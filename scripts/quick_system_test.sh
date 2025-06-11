#!/bin/bash

# ASRA Quick System Test
# Fast verification of core system functionality

echo "=== ASRA Quick System Test ==="
echo "Testing core functionality..."
echo "Started at: $(date)"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ((TESTS_FAILED++))
}

# Quick service test with timeout
quick_test() {
    local service_name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    log_info "Quick test: $service_name"
    
    local status_code
    status_code=$(timeout 10 curl -s -o /dev/null -w "%{http_code}" --max-time 5 --connect-timeout 3 "$url" 2>/dev/null || echo "000")
    
    if [ "$status_code" = "$expected_status" ]; then
        log_success "$service_name ✓"
        return 0
    else
        log_error "$service_name ✗ (status: $status_code)"
        return 1
    fi
}

echo "=== Quick Health Checks ==="

# Test core services
quick_test "Frontend" "http://localhost:8080"
quick_test "Backend API" "http://localhost:3001/api/health"
quick_test "Apache Solr" "http://localhost:8983/solr/documents/admin/ping"
quick_test "Qdrant" "http://localhost:6333"

echo
echo "=== Search Functionality ==="

# Test basic search
log_info "Testing basic Solr search..."
search_response=$(timeout 10 curl -s "http://localhost:8983/solr/documents/select?q=Grundgesetz&rows=1&wt=json" --max-time 5 2>/dev/null || echo "ERROR")
if [ "$search_response" != "ERROR" ] && echo "$search_response" | jq -e '.response.docs | length > 0' > /dev/null 2>&1; then
    log_success "Solr search working ✓"
else
    log_error "Solr search failed ✗"
fi

# Test wegegefallene filtering
log_info "Testing wegegefallene document filtering..."
wegegefallene_count=$(timeout 10 curl -s "http://localhost:8983/solr/documents/select?q=titel:\"(weggefallen)\"&rows=0&wt=json" --max-time 5 2>/dev/null | jq -r '.response.numFound // 0' 2>/dev/null || echo "0")
repealed_count=$(timeout 10 curl -s "http://localhost:8983/solr/documents/select?q=*:*&fq=norm_type:repealed&rows=0&wt=json" --max-time 5 2>/dev/null | jq -r '.response.numFound // 0' 2>/dev/null || echo "0")

total_filtered=$((wegegefallene_count + repealed_count))
if [ "$total_filtered" -gt 0 ]; then
    log_success "Found $total_filtered filtered documents ($wegegefallene_count weggefallen + $repealed_count repealed) ✓"
else
    log_error "No filtered documents found - filtering may not be working ✗"
fi

# Test hybrid search API
log_info "Testing hybrid search API..."
hybrid_response=$(timeout 15 curl -s -X POST "http://localhost:3001/api/hybrid/search" \
    -H "Content-Type: application/json" \
    -d '{"query": "Grundgesetz", "limit": 1}' --max-time 10 2>/dev/null || echo "ERROR")
if [ "$hybrid_response" != "ERROR" ] && echo "$hybrid_response" | jq -e '.docs | length > 0' > /dev/null 2>&1; then
    log_success "Hybrid search API working ✓"
else
    log_error "Hybrid search API failed ✗"
fi

echo
echo "=== Results ==="

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
echo "Tests run: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All quick tests passed! Core system is operational.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️ Some tests failed. Check the detailed logs above.${NC}"
    exit 1
fi