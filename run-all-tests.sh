#!/bin/bash
# Run All Load Tests - One Command

set -e

echo "🚀 RustChain Load Tests - Enhanced Edition"
echo "==========================================="
echo ""

# Configuration
API_URL=${RUSTCHAIN_API_URL:-"https://50.28.86.131"}
RESULTS_DIR="./results/$(date +%Y%m%d_%H%M%S)"

mkdir -p "$RESULTS_DIR"

export RUSTCHAIN_API_URL="$API_URL"

echo "📡 Target API: $API_URL"
echo "📁 Results: $RESULTS_DIR"
echo ""

# Function to run k6 test
run_k6_test() {
  local test_name=$1
  local test_file=$2
  
  echo "🔍 Running k6: $test_name..."
  k6 run --out json="$RESULTS_DIR/${test_name}.json" "$test_file" || echo "⚠️  $test_name failed"
}

# Run all k6 tests
echo "========================================="
echo "Phase 1: k6 Tests"
echo "========================================="

run_k6_test "health" "k6/tests/health.test.js"
run_k6_test "epoch" "k6/tests/epoch.test.js"
run_k6_test "miners" "k6/tests/miners.test.js"
run_k6_test "balance" "k6/tests/balance.test.js"

# Run scenario tests
echo ""
echo "========================================="
echo "Phase 2: Scenario Tests"
echo "========================================="

for scenario in smoke load stress; do
  echo "🎭 Running scenario: $scenario"
  SCENARIO=$scenario k6 run --out json="$RESULTS_DIR/scenario_${scenario}.json" k6/scenarios.js || echo "⚠️  Scenario $scenario failed"
done

# Generate summary
echo ""
echo "========================================="
echo "📊 Test Summary"
echo "========================================="

echo "✅ All tests completed!"
echo "📁 Results saved to: $RESULTS_DIR"
echo ""
echo "To view detailed results:"
echo "  k6 stat $RESULTS_DIR/*.json"
echo ""
echo "To run Locust tests next:"
echo "  cd locust && locust -f locustfile.py --headless -u 50 -r 5 --run-time 10m"
echo ""
