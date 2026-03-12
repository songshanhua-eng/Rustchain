/**
 * Health Endpoint Load Test
 * Tests: GET /health
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('health_errors');
const BASE_URL = __ENV.RUSTCHAIN_API_URL || 'https://50.28.86.131';

export default function() {
  console.log('Testing /health endpoint...');
  
  const response = http.get(`${BASE_URL}/health`);
  
  const success = check(response, {
    'health status is 200': (r) => r.status === 200,
    'health returns ok=true': (r) => {
      const body = JSON.parse(r.body);
      return body.ok === true;
    },
    'health has version': (r) => {
      const body = JSON.parse(r.body);
      return body.version && body.version.length > 0;
    },
    'health has uptime': (r) => {
      const body = JSON.parse(r.body);
      return body.uptime_s > 0;
    },
    'health latency < 100ms': (r) => r.timings.duration < 100,
  });
  
  errorRate.add(!success);
  
  sleep(1);
}

export const options = {
  vus: 10,
  duration: '5m',
  thresholds: {
    'http_req_duration': ['p(95)<100'],
    'health_errors': ['rate<0.01']
  }
};
