const express = require('express');
const cors = require('cors');
const pool = require('./config/db.js');
require('dotenv').config();

const hotspotRoutes = require('./routes/hotspotRoutes');
const { initCronJobs } = require('./services/cronService');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/hotspots', hotspotRoutes);

app.get('/api/hotspots', async (req, res) => {
  const { minLng, minLat, maxLng, maxLat } = req.query;

  try {
    let query = `
      SELECT *
      FROM hotspots
    `;
    const values = [];

    // Jika parameter area dikirimkan oleh peta, gunakan filter PostGIS
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
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

initCronJobs();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});