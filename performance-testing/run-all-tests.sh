#!/bin/bash

# Comprehensive Performance Testing Suite Runner
# Runs all performance tests and generates consolidated reports

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3001}"
RESULTS_DIR="./results/$(date +%Y%m%d_%H%M%S)"
PARALLEL_TESTS=false

# Print banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           LinkedIn Headshot Performance Test Suite          ║"
echo "║                  Comprehensive Testing                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --api-url)
      API_URL="$2"
      shift 2
      ;;
    --parallel)
      PARALLEL_TESTS=true
      shift
      ;;
    --results-dir)
      RESULTS_DIR="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --api-url URL        API base URL (default: http://localhost:3001)"
      echo "  --parallel           Run tests in parallel where possible"
      echo "  --results-dir DIR    Results directory (default: ./results/TIMESTAMP)"
      echo "  --help               Show this help message"
      echo ""
      echo "Environment Variables:"
      echo "  API_URL             API base URL"
      echo "  SKIP_LOAD_TESTS     Skip load testing (set to 'true')"
      echo "  SKIP_BENCHMARKS     Skip API benchmarks (set to 'true')"
      echo "  SKIP_CAPACITY       Skip capacity planning (set to 'true')"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

# Create results directory
mkdir -p "$RESULTS_DIR"
echo -e "${GREEN}📁 Results directory: $RESULTS_DIR${NC}"

# Function to check if service is running
check_service() {
    local url=$1
    local service_name=$2
    
    echo -e "${YELLOW}🔍 Checking $service_name availability...${NC}"
    
    if curl -sf "$url/health" > /dev/null; then
        echo -e "${GREEN}✅ $service_name is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name is not available at $url${NC}"
        return 1
    fi
}

# Function to run test with timing and error handling
run_test() {
    local test_name=$1
    local test_command=$2
    local test_dir=$3
    
    echo -e "\n${BLUE}🚀 Starting $test_name...${NC}"
    local start_time=$(date +%s)
    
    cd "$test_dir"
    
    if eval "$test_command" > "$RESULTS_DIR/${test_name// /_}.log" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        echo -e "${GREEN}✅ $test_name completed in ${duration}s${NC}"
        
        # Copy results to results directory
        find . -name "*.json" -o -name "*.txt" -o -name "*.csv" | while read file; do
            cp "$file" "$RESULTS_DIR/" 2>/dev/null || true
        done
        
        return 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        echo -e "${RED}❌ $test_name failed after ${duration}s${NC}"
        echo -e "${RED}   Check log: $RESULTS_DIR/${test_name// /_}.log${NC}"
        return 1
    fi
}

# Function to install dependencies if needed
install_dependencies() {
    echo -e "${YELLOW}📦 Checking and installing dependencies...${NC}"
    
    # Check Node.js dependencies
    if [ -f "package.json" ] && [ ! -d "node_modules" ]; then
        echo "Installing Node.js dependencies..."
        npm install > /dev/null 2>&1
    fi
    
    # Check if required tools are installed
    local missing_tools=()
    
    if ! command -v k6 &> /dev/null; then
        missing_tools+=("k6")
    fi
    
    if ! command -v autocannon &> /dev/null; then
        missing_tools+=("autocannon")
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Missing tools: ${missing_tools[*]}${NC}"
        echo "Please install them manually:"
        echo "  k6: https://k6.io/docs/getting-started/installation/"
        echo "  autocannon: npm install -g autocannon"
    fi
}

# Main execution
main() {
    echo -e "${BLUE}🏁 Performance Testing Suite Started${NC}"
    echo "API URL: $API_URL"
    echo "Results Directory: $RESULTS_DIR"
    echo "Parallel Tests: $PARALLEL_TESTS"
    echo ""
    
    # Pre-flight checks
    check_service "$API_URL" "LinkedIn Headshot API" || {
        echo -e "${RED}❌ Cannot proceed without API service${NC}"
        exit 1
    }
    
    install_dependencies
    
    # Test results tracking
    local test_results=()
    local failed_tests=()
    
    # 1. API Health and Smoke Tests
    echo -e "\n${BLUE}═══ Phase 1: Health & Smoke Tests ═══${NC}"
    
    if run_test "API Health Check" "curl -f $API_URL/health" "."; then
        test_results+=("Health Check: PASSED")
    else
        test_results+=("Health Check: FAILED")
        failed_tests+=("Health Check")
    fi
    
    # 2. API Benchmarks
    if [ "$SKIP_BENCHMARKS" != "true" ]; then
        echo -e "\n${BLUE}═══ Phase 2: API Benchmarks ═══${NC}"
        
        if [ -f "backend-benchmarks/api-benchmarks.js" ]; then
            if run_test "API Benchmarks" "node api-benchmarks.js $API_URL" "backend-benchmarks"; then
                test_results+=("API Benchmarks: PASSED")
            else
                test_results+=("API Benchmarks: FAILED")
                failed_tests+=("API Benchmarks")
            fi
        else
            echo -e "${YELLOW}⚠️  API Benchmark script not found, skipping...${NC}"
        fi
    else
        echo -e "${YELLOW}⏭️  Skipping API benchmarks (SKIP_BENCHMARKS=true)${NC}"
    fi
    
    # 3. Load Tests
    if [ "$SKIP_LOAD_TESTS" != "true" ]; then
        echo -e "\n${BLUE}═══ Phase 3: Load Testing ═══${NC}"
        
        if [ -f "load-tests/k6-load-test.js" ]; then
            # Run different load test scenarios
            local scenarios=("baseline" "peak" "stress")
            
            for scenario in "${scenarios[@]}"; do
                if $PARALLEL_TESTS && [ "$scenario" != "stress" ]; then
                    # Run baseline and peak in parallel
                    run_test "K6 Load Test ($scenario)" "k6 run --env API_URL=$API_URL --env SCENARIO=$scenario k6-load-test.js" "load-tests" &
                else
                    if run_test "K6 Load Test ($scenario)" "k6 run --env API_URL=$API_URL --env SCENARIO=$scenario k6-load-test.js" "load-tests"; then
                        test_results+=("Load Test ($scenario): PASSED")
                    else
                        test_results+=("Load Test ($scenario): FAILED")
                        failed_tests+=("Load Test ($scenario)")
                    fi
                fi
            done
            
            # Wait for parallel tests to complete
            if $PARALLEL_TESTS; then
                wait
                test_results+=("Load Tests (parallel): COMPLETED")
            fi
        else
            echo -e "${YELLOW}⚠️  K6 load test script not found, skipping...${NC}"
        fi
    else
        echo -e "${YELLOW}⏭️  Skipping load tests (SKIP_LOAD_TESTS=true)${NC}"
    fi
    
    # 4. Capacity Planning
    if [ "$SKIP_CAPACITY" != "true" ]; then
        echo -e "\n${BLUE}═══ Phase 4: Capacity Planning ═══${NC}"
        
        if [ -f "capacity-planning/capacity-planner.js" ]; then
            if run_test "Capacity Planning" "node capacity-planner.js $API_URL" "capacity-planning"; then
                test_results+=("Capacity Planning: PASSED")
            else
                test_results+=("Capacity Planning: FAILED")
                failed_tests+=("Capacity Planning")
            fi
        else
            echo -e "${YELLOW}⚠️  Capacity planning script not found, skipping...${NC}"
        fi
    else
        echo -e "${YELLOW}⏭️  Skipping capacity planning (SKIP_CAPACITY=true)${NC}"
    fi
    
    # 5. Generate Consolidated Report
    echo -e "\n${BLUE}═══ Phase 5: Report Generation ═══${NC}"
    generate_consolidated_report
    
    # Summary
    echo -e "\n${BLUE}╔══════════════════════════════════════════════════════════════╗"
    echo "║                     Test Summary                             ║"
    echo "╚══════════════════════════════════════════════════════════════╝${NC}"
    
    local total_tests=${#test_results[@]}
    local failed_count=${#failed_tests[@]}
    local passed_count=$((total_tests - failed_count))
    
    echo -e "${GREEN}✅ Passed: $passed_count${NC}"
    echo -e "${RED}❌ Failed: $failed_count${NC}"
    echo -e "${BLUE}📊 Total:  $total_tests${NC}"
    
    if [ $failed_count -gt 0 ]; then
        echo -e "\n${RED}Failed Tests:${NC}"
        printf '%s\n' "${failed_tests[@]}"
    fi
    
    echo -e "\n${BLUE}📋 Detailed results available in: $RESULTS_DIR${NC}"
    
    # Return appropriate exit code
    [ $failed_count -eq 0 ] && exit 0 || exit 1
}

# Generate consolidated report
generate_consolidated_report() {
    local report_file="$RESULTS_DIR/performance-test-report.md"
    
    echo "# LinkedIn Headshot API - Performance Test Report" > "$report_file"
    echo "" >> "$report_file"
    echo "**Generated:** $(date)" >> "$report_file"
    echo "**API URL:** $API_URL" >> "$report_file"
    echo "" >> "$report_file"
    
    # Test Results Section
    echo "## Test Results Summary" >> "$report_file"
    echo "" >> "$report_file"
    printf '%s\n' "${test_results[@]}" >> "$report_file"
    echo "" >> "$report_file"
    
    # Failed Tests Section
    if [ ${#failed_tests[@]} -gt 0 ]; then
        echo "## Failed Tests" >> "$report_file"
        echo "" >> "$report_file"
        printf '- %s\n' "${failed_tests[@]}" >> "$report_file"
        echo "" >> "$report_file"
    fi
    
    # Key Metrics Section
    echo "## Key Performance Metrics" >> "$report_file"
    echo "" >> "$report_file"
    
    # Extract key metrics from JSON reports
    find "$RESULTS_DIR" -name "*.json" | while read json_file; do
        echo "### $(basename "$json_file" .json)" >> "$report_file"
        echo "" >> "$report_file"
        echo '```json' >> "$report_file"
        cat "$json_file" | head -20 >> "$report_file"
        echo '```' >> "$report_file"
        echo "" >> "$report_file"
    done
    
    # Recommendations Section
    echo "## Recommendations" >> "$report_file"
    echo "" >> "$report_file"
    echo "Based on the performance test results:" >> "$report_file"
    echo "" >> "$report_file"
    
    if [ ${#failed_tests[@]} -eq 0 ]; then
        echo "- ✅ All tests passed successfully" >> "$report_file"
        echo "- 📊 Monitor key metrics in production" >> "$report_file"
        echo "- 🔄 Run tests regularly to track performance trends" >> "$report_file"
    else
        echo "- ⚠️  Address failed test issues before production deployment" >> "$report_file"
        echo "- 🔍 Investigate performance bottlenecks identified in failed tests" >> "$report_file"
        echo "- 📈 Consider infrastructure scaling based on load test results" >> "$report_file"
    fi
    
    echo "" >> "$report_file"
    echo "---" >> "$report_file"
    echo "Report generated by LinkedIn Headshot Performance Test Suite" >> "$report_file"
    
    echo -e "${GREEN}📄 Consolidated report generated: $report_file${NC}"
}

# Handle script interruption
trap 'echo -e "\n${YELLOW}⚠️  Tests interrupted by user${NC}"; exit 130' INT TERM

# Run main function
main "$@"