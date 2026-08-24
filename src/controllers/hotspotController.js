const { fetchNasaData } = require('../services/nasaService');

// Fungsi untuk memicu sinkronisasi manual
const syncNasaData = async (req, res) => {
    try {
        // Jalankan fungsi fetch di background (tidak di-await agar tidak timeout)
        fetchNasaData(); 
        
        res.status(200).json({ 
            message: "Sinkronisasi data NASA sedang berjalan di latar belakang. Silakan cek console terminal Anda." 
        });
    } catch (error) {
        res.status(500).json({ error: "Gagal memulai sinkronisasi" });
    }
};

module.exports = { syncNasaData };