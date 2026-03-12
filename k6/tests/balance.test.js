/**
 * Balance Endpoint Load Test
 * Tests: GET /wallet/balance?miner_id=xxx
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('balance_errors');
const latency = new Trend('balance_latency');
const BASE_URL = __ENV.RUSTCHAIN_API_URL || 'https://50.28.86.131';

// Test miner IDs
const TEST_MINER_IDS = [
  'RTC1d48d848a5aa5ecf2c5f01aa5fb64837daaf2f35',
  'newffnow-github',
  'claw-ip-172-31-22-129-39771'
];

export default function() {
  const minerId = TEST_MINER_IDS[Math.floor(Math.random() * TEST_MINER_IDS.length)];
  console.log(`Testing /wallet/balance for ${minerId}...`);
  
  const response = http.get(`${BASE_URL}/wallet/balance?miner_id=${minerId}`);
  
  const success = check(response, {
    'balance status is 200': (r) => r.status === 200,
    'balance has miner_id': (r) => {
      const body = JSON.parse(r.body);
      return body.miner_id === minerId;
    },
    'balance has amount_rtc': (r) => {
      const body = JSON.parse(r.body);
      return typeof body.amount_rtc === 'number';
    },
    'balance has amount_i64': (r) => {
      const body = JSON.parse(r.body);
      return typeof body.amount_i64 === 'number';
    },
    'balance latency < 300ms': (r) => r.timings.duration < 300,
  });
  
  errorRate.add(!success);
  latency.add(response.timings.duration);
  
  sleep(2);
}

export const options = {
  vus: 10,
  duration: '5m',
  thresholds: {
    'http_req_duration': ['p(95)<300'],
    'balance_errors': ['rate<0.01']
  }
};
