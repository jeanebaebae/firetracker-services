import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 50 },
    { duration: '20s', target: 100 },
    { duration: '30s', target: 200 },
    { duration: '10s', target: 0 },
  ],
};

export default function () {
  // Tambahkan opsi header Accept-Encoding agar k6 meminta kompresi Gzip
  const params = {
    headers: {
      'Accept-Encoding': 'gzip, deflate',
    },
  };

  const res = http.get('http://localhost:5001/api/hotspots', params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(0.5);
}