const cron = require('node-cron');
const { fetchNasaData } = require('./nasaService');

const initCronJobs = () => {
    // Menjalankan penarikan data otomatis setiap 3 jam sekali
    cron.schedule('0 */3 * * *', () => {
        console.log('[CRON JOB] Menjalankan pembaruan data NASA otomatis...');
        fetchNasaData();
    });
};

module.exports = { initCronJobs };