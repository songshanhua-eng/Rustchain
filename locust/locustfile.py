"""
RustChain API Load Testing with Locust
Enhanced version with multiple user classes and scenarios
"""

from locust import HttpUser, task, between, events
import json
import time

# Test miner IDs
TEST_MINER_IDS = [
    'RTC1d48d848a5aa5ecf2c5f01aa5fb64837daaf2f35',
    'newffnow-github',
    'claw-ip-172-31-22-129-39771'
]

class APIUser(HttpUser):
    """Normal API user - simulates regular usage"""
    
    wait_time = between(1, 3)
    
    @task(3)
    def health_check(self):
        """Test /health endpoint"""
        with self.client.get("/health", catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                if data.get('ok') != True:
                    response.failure("Health check failed: ok != True")
            else:
                response.failure(f"Status code: {response.status_code}")
    
    @task(2)
    def epoch_query(self):
        """Test /epoch endpoint"""
        with self.client.get("/epoch", catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                if 'epoch' not in data:
                    response.failure("Missing epoch field")
            else:
                response.failure(f"Status code: {response.status_code}")
    
    @task(2)
    def miners_list(self):
        """Test /api/miners endpoint"""
        with self.client.get("/api/miners", catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                if not isinstance(data, list) or len(data) == 0:
                    response.failure("Miners list is empty or invalid")
            else:
                response.failure(f"Status code: {response.status_code}")
    
    @task(1)
    def balance_check(self):
        """Test /wallet/balance endpoint"""
        miner_id = TEST_MINER_IDS[0]
        with self.client.get(f"/wallet/balance?miner_id={miner_id}", catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                if 'amount_rtc' not in data:
                    response.failure("Missing amount_rtc field")
            else:
                response.failure(f"Status code: {response.status_code}")


class HeavyUser(HttpUser):
    """Heavy API user - simulates power users with more requests"""
    
    wait_time = between(0.5, 1)
    weight = 2
    
    @task
    def all_endpoints(self):
        """Hit all endpoints in sequence"""
        self.client.get("/health")
        self.client.get("/epoch")
        self.client.get("/api/miners")
        
        for miner_id in TEST_MINER_IDS:
            self.client.get(f"/wallet/balance?miner_id={miner_id}")
            time.sleep(0.1)


class EdgeCaseUser(HttpUser):
    """Edge case tester - tests error handling"""
    
    wait_time = between(2, 5)
    weight = 1
    
    @task
    def invalid_requests(self):
        """Test invalid inputs"""
        # Invalid miner ID
        self.client.get("/wallet/balance?miner_id=invalid", expect_error=True)
        
        # Empty parameter
        self.client.get("/wallet/balance?miner_id=", expect_error=True)
        
        # Very long parameter
        long_id = 'a' * 1000
        self.client.get(f"/wallet/balance?miner_id={long_id}", expect_error=True)


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Called when test starts"""
    print("🚀 Load test starting...")
    print(f"📡 Target: {environment.host}")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Called when test stops"""
    print("✅ Load test completed!")
    print(f"📊 Results available in Locust UI")
