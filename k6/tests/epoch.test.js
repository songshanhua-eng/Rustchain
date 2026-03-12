/**
 * Epoch Endpoint Load Test
 * Tests: GET /epoch
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('epoch_errors');
const latency = new Trend('epoch_latency');
const BASE_URL = __ENV.RUSTCHAIN_API_URL || 'https://50.28.86.131';

export default function() {
  console.log('Testing /epoch endpoint...');
  
  const response = http.get(`${BASE_URL}/epoch`);
  
  const success = check(response, {
    'epoch status is 200': (r) => r.status === 200,
    'epoch has epoch number': (r) => {
      const body = JSON.parse(r.body);
      return body.epoch > 0;
    },
    'epoch has slot': (r) => {
      const body = JSON.parse(r.body);
      return body.slot > 0;
    },
    'epoch has enrolled_miners': (r) => {
      const body = JSON.parse(r.body);
      return body.enrolled_miners >= 0;
    },
    'epoch has blocks_per_epoch': (r) => {
      const body = JSON.parse(r.body);
      return body.blocks_per_epoch > 0;
    },
    'epoch latency < 200ms': (r) => r.timings.duration < 200,
  });
  
  errorRate.add(!success);
  latency.add(response.timings.duration);
  
  sleep(2);
}

export const options = {
  vus: 10,
  duration: '5m',
  thresholds: {
    'http_req_duration': ['p(95)<200'],
    'epoch_errors': ['rate<0.01']
  }
};
