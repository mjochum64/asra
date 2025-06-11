#!/bin/bash

# ASRA Quick System Check
# Fast verification of all core services and functionality

set -e

echo "=== ASRA Quick System Check ==="
echo "Started at: $(date)"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; ((TESTS_PASSED++)); }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; ((TESTS_FAILED++)); }

# Quick service check with short timeout
check_service() {
    local name="$1"
    local url="$2"
    local expected="$3"
    
    log_info "Checking $name..."
    if timeout 5 curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected" 2>/dev/null; then
        log_success "$name is UP"
        return 0
    else
        log_error "$name is DOWN or not responding"
        return 1
    fi
}

echo "=== Docker Services Status ==="
docker compose -f infrastructure/docker-compose.yml ps --format 'table {{.Name}}\t{{.Status}}'
echo

echo "=== Service Health Checks ==="
check_service "Frontend" "http://localhost:8080" "200"
check_service "Backend API" "http://localhost:3001/api/health" "200"
check_service "Apache Solr" "http://localhost:8983/solr/admin/ping" "200"
check_service "Qdrant" "http://localhost:6333/health" "200"
check_service "Ollama" "http://localhost:11434/api/version" "200"
check_service "OpenWebUI" "http://localhost:8181" "200"

echo
echo "=== Quick Functionality Tests ==="

# Test Solr search
log_info "Testing Solr search..."
if timeout 10 curl -s "http://localhost:8983/solr/documents/select?q=Grundgesetz&rows=1&wt=json" | jq -e '.response.docs | length > 0' >/dev/null 2>&1; then
    log_success "Solr search working"
else
    log_error "Solr search failed"
fi

# Test Hybrid search API
log_info "Testing Hybrid search API..."
if timeout 15 curl -s -X POST "http://localhost:3001/api/hybrid/search" \
    -H "Content-Type: application/json" \
    -d '{"query": "Grundgesetz", "limit": 3}' | jq -e '.results' >/dev/null 2>&1; then
    log_success "Hybrid search API working"
else
    log_error "Hybrid search API failed"
fi

# Test API proxy through frontend
log_info "Testing API proxy..."
if timeout 10 curl -s "http://localhost:8080/api/health" | grep -q "OK\|healthy" 2>/dev/null; then
    log_success "API proxy working"
else
    log_error "API proxy failed"
fi

echo
echo "=== Results Summary ==="
TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL SYSTEMS OPERATIONAL!${NC}"
    echo -e "${GREEN}✅ ASRA hybrid search system is ready for use${NC}"
else
    echo -e "\n${YELLOW}⚠️  Some services need attention${NC}"
fi

echo
echo "Completed at: $(date)"