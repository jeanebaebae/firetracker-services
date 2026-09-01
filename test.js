import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 20 }, 
    { duration: '20s', target: 20 }, 
    { duration: '10s', target: 0 },  
  ],
};

export default function () {
  // GANTI ke URL Backend Node.js dan Endpoint API Anda
  const res = http.get('http://localhost:5001/api/hotspots'); 

  // Memastikan server merespons dengan status 200 (OK)
  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1); 
}