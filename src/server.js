const Redis = require('ioredis');
const redis = new Redis();

const compression = require('compression');
const express = require('express');
const cors = require('cors');
const pool = require('./config/db.js');
require('dotenv').config();

const hotspotRoutes = require('./routes/hotspotRoutes');
const { initCronJobs } = require('./services/cronService');

const app = express();

app.use(compression());
app.use(cors());
app.use(express.json());

// 1. Pindahkan endpoint custom dengan Redis ini SEBELUM hotspotRoutes 
// atau hapus app.use('/api/hotspots', hotspotRoutes) jika jalurnya bentrok.
app.get('/api/hotspots', async (req, res) => {
  const { minLng, minLat, maxLng, maxLat } = req.query;
  const cacheKey = minLng && minLat && maxLng && maxLat
    ? `hotspots:${minLng}:${minLat}:${maxLng}:${maxLat}`
    : 'hotspots:all';

  try {
    const cachedHotspots = await redis.get(cacheKey);

    if (cachedHotspots) {
      return res.json(JSON.parse(cachedHotspots));
    }

    let query = `
      SELECT *
      FROM hotspots
    `;
    const values = [];

    if (minLng && minLat && maxLng && maxLat) {
      query += `
        WHERE ST_Within(
          geom, 
          ST_MakeEnvelope($1, $2, $3, $4, 4326)
        )
      `;
      values.push(
        parseFloat(minLng), 
        parseFloat(minLat), 
        parseFloat(maxLng), 
        parseFloat(maxLat)
      );
    }

    query += ` ORDER BY acq_datetime DESC LIMIT 10000;`;

    const result = await pool.query(query, values);
    
    await redis.set(cacheKey, JSON.stringify(result.rows), 'EX', 900);

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// 2. Pasang hotspotRoutes di bawah jika berisi sub-route lain (misal: /api/hotspots/:id)
app.use('/api/hotspots', hotspotRoutes);

initCronJobs();

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});