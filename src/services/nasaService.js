const axios = require('axios');
const csv = require('csv-parser');
const pool = require('../config/db');
const { Readable } = require('stream');
require('dotenv').config();

const fetchAndParseCSV = async (url) => {
    const response = await axios.get(url, {
        responseType: 'text',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        }
    });

    return new Promise((resolve, reject) => {
        const results = [];
        Readable.from(response.data)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
};

const fetchNasaData = async () => {
    try {
        console.log('Memulai proses unduh data multi-satelit NASA FIRMS...');
        
        const MAP_KEY = process.env.NASA_FIRMS_MAP_KEY;
        const area = '95,-11,141,6';
        const days = 5;

        const urls = [
            `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${MAP_KEY}/VIIRS_SNPP_NRT/${area}/${days}`,
            `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${MAP_KEY}/VIIRS_NOAA20_NRT/${area}/${days}`,
            `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${MAP_KEY}/MODIS_NRT/${area}/${days}`
        ];

        const [viirsSnpp, viirsNoaa20, modis] = await Promise.all(urls.map(url => fetchAndParseCSV(url)));
        
        const results = [...viirsSnpp, ...viirsNoaa20, ...modis];

        console.log(`Berhasil mengunduh ${results.length} baris data gabungan dari NASA. Memasukkan ke database...`);
        
        let inserted = 0;
        for (const row of results) {
            const { latitude, longitude, confidence, acq_date, acq_time, frp, satellite, instrument } = row;
            const brightness = row.bright_ti4 || row.brightness;
            
            if (!latitude || !longitude) continue;

            const formattedTime = `${acq_time.padStart(4, '0').substring(0, 2)}:${acq_time.padStart(4, '0').substring(2, 4)}:00`;
            const datetime = `${acq_date} ${formattedTime}`;

            try {
                await pool.query(
                    `INSERT INTO hotspots (geom, latitude, longitude, confidence, brightness, acq_datetime, frp, satellite, instrument)
                     VALUES (ST_SetSRID(ST_MakePoint($1, $2), 4326), $2, $1, $3, $4, $5, $6, $7, $8)`,
                    [
                        parseFloat(longitude), 
                        parseFloat(latitude), 
                        confidence, 
                        parseFloat(brightness), 
                        datetime,
                        frp ? parseFloat(frp) : null,
                        satellite || null,
                        instrument || null
                    ]
                );
                inserted++;
            } catch (dbErr) {
                console.error('Gagal insert baris:', dbErr.message);
            }
        }
        console.log(`Selesai! ${inserted} titik panas berhasil disimpan ke database.`);

    } catch (error) {
        if (error.response) {
            console.error('Pesan Error dari NASA:', error.response.status, error.response.data);
        } else {
            console.error('Gagal mengambil data dari NASA:', error.message);
        }
    }
};

module.exports = { fetchNasaData };