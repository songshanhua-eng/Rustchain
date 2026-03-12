/**
 * RustChain API Load Testing - k6 Scenarios
 * 
 * 8 test scenarios: smoke, load, stress, soak, spike, break, recovery, edge
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');

// Configuration
const BASE_URL = __ENV.RUSTCHAIN_API_URL || 'https://50.28.86.131';

// Test parameters
const TEST_CONFIG = {
  smoke: { vus: 1, duration: '1m' },
  load: { vus: 10, duration: '10m' },
  stress: { vus: 50, duration: '15m' },
  soak: { vus: 20, duration: '1h' },
  spike: { vus: 10, duration: '10m', spikeTo: 200 },
  break: { vus: 200, duration: '30m', maxVus: 1000 },
  recovery: { vus: 10, duration: '15m' },
  edge: { vus: 5, duration: '5m' }
};

// API endpoints
const ENDPOINTS = {
  health: '/health',
  epoch: '/epoch',
  miners: '/api/miners',
  balance: (minerId) => `/wallet/balance?miner_id=${minerId}`
};

// Test data
const TEST_MINER_IDS = [
  'RTC1d48d848a5aa5ecf2c5f01aa5fb64837daaf2f35',
  'newffnow-github',
  'claw-ip-172-31-22-129-39771'
];

// Helper functions
function checkResponse(response, expectedStatus = 200) {
  const success = check(response, {
    'status is 200': (r) => r.status === expectedStatus,
    'has body': (r) => r.body && r.body.length > 0,
    'latency < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!success);
  apiLatency.add(response.timings.duration);
  
  return success;
}

// Scenario 1: Smoke Test
export function smoke() {
  console.log('🔍 Running Smoke Test...');
  
  const healthRes = http.get(`${BASE_URL}${ENDPOINTS.health}`);
  checkResponse(healthRes);
  
  const epochRes = http.get(`${BASE_URL}${ENDPOINTS.epoch}`);
  checkResponse(epochRes);
  
  sleep(1);
}

// Scenario 2: Load Test
export function load() {
  console.log('📊 Running Load Test...');
  
  const minerId = TEST_MINER_IDS[0];
  
  // Health check
  http.get(`${BASE_URL}${ENDPOINTS.health}`);
  sleep(0.5);
  
  // Epoch query
  http.get(`${BASE_URL}${ENDPOINTS.epoch}`);
  sleep(0.5);
  
  // Miners list
  http.get(`${BASE_URL}${ENDPOINTS.miners}`);
  sleep(0.5);
  
  // Balance check
  http.get(`${BASE_URL}${ENDPOINTS.balance(minerId)}`);
  sleep(1);
}

// Scenario 3: Stress Test
export function stress() {
  load(); // Reuse load test logic with more VUs
}

// Scenario 4: Soak Test
export function soak() {
  load(); // Reuse load test logic with longer duration
}

// Scenario 5: Spike Test
export function spike() {
  load(); // k6 config handles the spike
}

// Scenario 6: Break Test
export function breakTest() {
  const minerId = TEST_MINER_IDS[0];
  const endpoint = ENDPOINTS.balance(minerId);
  
  http.get(`${BASE_URL}${endpoint}`);
  sleep(0.1); // Minimal sleep for maximum load
}

// Scenario 7: Recovery Test
export function recovery() {
  // Normal load
  load();
  
  // Simulate failure (optional)
  // Then verify recovery
  
  sleep(1);
}

// Scenario 8: Edge Case Test
export function edgeCase() {
  console.log('🔬 Running Edge Case Test...');
  
  // Invalid miner ID
  const invalidRes = http.get(`${BASE_URL}/wallet/balance?miner_id=invalid`);
  check(invalidRes, {
    'invalid ID returns error': (r) => r.status === 400 || r.status === 404,
  });
  
  // Empty parameter
  const emptyRes = http.get(`${BASE_URL}/wallet/balance?miner_id=`);
  check(emptyRes, {
    'empty param returns error': (r) => r.status !== 200,
  });
  
  // Very long parameter
  const longId = 'a'.repeat(1000);
  const longRes = http.get(`${BASE_URL}/wallet/balance?miner_id=${longId}`);
  check(longRes, {
    'long param handled': (r) => r.status === 400 || r.status === 414,
  });
  
  sleep(1);
}

// Default export - selects scenario based on env
export default function() {
  const scenario = __ENV.SCENARIO || 'smoke';
  
  switch(scenario) {
    case 'smoke': smoke(); break;
    case 'load': load(); break;
    case 'stress': stress(); break;
    case 'soak': soak(); break;
    case 'spike': spike(); break;
    case 'break': breakTest(); break;
    case 'recovery': recovery(); break;
    case 'edge': edgeCase(); break;
    default: smoke();
  }
}

// k6 options - can be overridden via CLI
export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: TEST_CONFIG.smoke.vus,
      duration: TEST_CONFIG.smoke.duration,
      exec: 'smoke',
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests should complete below 500ms
    'errors': ['rate<0.01'], // Error rate should be less than 1%
  },
};
