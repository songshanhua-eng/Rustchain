/**
 * k6 Configuration
 * Centralized configuration for all load tests
 */

export const config = {
  // API Configuration
  baseUrl: __ENV.RUSTCHAIN_API_URL || 'https://50.28.86.131',
  
  // Test Scenarios
  scenarios: {
    smoke: {
      vus: 1,
      duration: '1m',
      description: 'Basic functionality verification'
    },
    load: {
      vus: 10,
      duration: '10m',
      rampUp: '1m',
      description: 'Normal load performance'
    },
    stress: {
      vus: 50,
      duration: '15m',
      rampUp: '2m',
      description: 'Find system bottlenecks'
    },
    soak: {
      vus: 20,
      duration: '1h',
      description: 'Long-running stability'
    },
    spike: {
      startVus: 10,
      spikeTo: 200,
      duration: '10m',
      description: 'Sudden traffic spike'
    },
    break: {
      startVus: 200,
      maxVus: 1000,
      duration: '30m',
      description: 'Find breaking point'
    },
    recovery: {
      vus: 10,
      duration: '15m',
      description: 'Recovery after failure'
    },
    edge: {
      vus: 5,
      duration: '5m',
      description: 'Edge cases and error handling'
    }
  },
  
  // Performance Thresholds
  thresholds: {
    excellent: {
      'http_req_duration': 'p(95)<50',
      'http_req_failed': 'rate<0.001'
    },
    good: {
      'http_req_duration': 'p(95)<100',
      'http_req_failed': 'rate<0.01'
    },
    acceptable: {
      'http_req_duration': 'p(95)<500',
      'http_req_failed': 'rate<0.05'
    }
  },
  
  // Test Miner IDs
  minerIds: [
    'RTC1d48d848a5aa5ecf2c5f01aa5fb64837daaf2f35',
    'newffnow-github',
    'claw-ip-172-31-22-129-39771'
  ]
};

export default config;
