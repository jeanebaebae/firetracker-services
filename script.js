import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 50 },  // Naik ke 50 VUs
    { duration: '20s', target: 100 }, // Naik ke 100 VUs
    { duration: '30s', target: 200 }, // Lonjakan ekstrem ke 200 VUs
    { duration: '10s', target: 0 },   // Normalisasi kembali
  ],
};

export default function () {
  const res = http.get('http://localhost:5001/api/hotspots');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(0.5); // Jeda lebih pendek untuk meningkatkan beban per detik
}