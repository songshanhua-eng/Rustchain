/**
 * Miners Endpoint Load Test
 * Tests: GET /api/miners
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('miners_errors');
const latency = new Trend('miners_latency');
const BASE_URL = __ENV.RUSTCHAIN_API_URL || 'https://50.28.86.131';

export default function() {
  console.log('Testing /api/miners endpoint...');
  
  const response = http.get(`${BASE_URL}/api/miners`);
  
  const success = check(response, {
    'miners status is 200': (r) => r.status === 200,
    'miners returns array': (r) => Array.isArray(JSON.parse(r.body)),
    'miners has data': (r) => {
      const miners = JSON.parse(r.body);
      return miners.length > 0;
    },
    'miner has required fields': (r) => {
      const miners = JSON.parse(r.body);
      const miner = miners[0];
      return miner.miner && miner.device_arch && miner.hardware_type;
    },
    'miner has antiquity_multiplier': (r) => {
      const miners = JSON.parse(r.body);
      const miner = miners[0];
      return typeof miner.antiquity_multiplier === 'number';
    },
    'miners latency < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!success);
  latency.add(response.timings.duration);
  
  sleep(3);
}

export const options = {
  vus: 5,
  duration: '5m',
  thresholds: {
    'http_req_duration': ['p(95)<500'],
    'miners_errors': ['rate<0.01']
  }
};
