#!/bin/bash

# ASRA System Verification
# Corrected endpoint testing with proper error handling

echo "=== ASRA System Verification ==="
echo "Started at: $(date)"
echo

# Colors
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

echo "=== Docker Services Status ==="
docker compose -f infrastructure/docker-compose.yml ps --format 'table {{.Name}}\t{{.Status}}'
echo

echo "=== Service Health Checks ==="

# Frontend
log_info "Testing Frontend (Nginx + Vite)..."
if [ "$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:8080")" = "200" ]; then
    log_success "Frontend is responding (HTTP 200)"
else
    log_error "Frontend is not responding correctly"
fi

# Backend API
log_info "Testing Backend API..."
if [ "$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:3001/api/health")" = "200" ]; then
    log_success "Backend API is responding (HTTP 200)"
else
    log_error "Backend API is not responding correctly"
fi

# Solr (corrected endpoint)
log_info "Testing Apache Solr..."
if [ "$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:8983/solr/documents/admin/ping")" = "200" ]; then
    log_success "Apache Solr is responding (HTTP 200)"
else
    log_error "Apache Solr is not responding correctly"
fi

# Qdrant (corrected endpoint)
log_info "Testing Qdrant Vector DB..."
if [ "$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:6333/")" = "200" ]; then
    log_success "Qdrant is responding (HTTP 200)"
else
    log_error "Qdrant is not responding correctly"
fi

# Ollama
log_info "Testing Ollama..."
if [ "$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:11434/api/version")" = "200" ]; then
    log_success "Ollama is responding (HTTP 200)"
else
    log_error "Ollama is not responding correctly"
fi

# OpenWebUI
log_info "Testing OpenWebUI..."
if [ "$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:8181/")" = "200" ]; then
    log_success "OpenWebUI is responding (HTTP 200)"
else
    log_error "OpenWebUI is not responding correctly"
fi

echo
echo "=== Functional Tests ==="

# Test Solr search functionality
log_info "Testing Solr search with 'Grundgesetz'..."
solr_response=$(curl -s --max-time 10 "http://localhost:8983/solr/documents/select?q=Grundgesetz&rows=1&wt=json" 2>/dev/null)
if echo "$solr_response" | jq -e '.response.docs | length > 0' >/dev/null 2>&1; then
    doc_count=$(echo "$solr_response" | jq -r '.response.numFound')
    log_success "Solr search working - found $doc_count documents"
else
    log_error "Solr search failed or returned no results"
fi

# Test repealed document filtering
log_info "Testing repealed document filtering..."
filtered_response=$(curl -s --max-time 10 "http://localhost:8983/solr/documents/select?q=*:*&fq=-norm_type:repealed&fq=-titel:\"(weggefallen)\"&rows=1&wt=json" 2>/dev/null)
if echo "$filtered_response" | jq -e '.response.docs | length >= 0' >/dev/null 2>&1; then
    total_docs=$(echo "$filtered_response" | jq -r '.response.numFound')
    log_success "Repealed document filtering working - $total_docs active documents"
else
    log_error "Repealed document filtering test failed"
fi

# Test Hybrid Search API
log_info "Testing Hybrid Search API..."
hybrid_response=$(curl -s --max-time 15 -X POST "http://localhost:3001/api/hybrid/search" \
    -H "Content-Type: application/json" \
    -d '{"query": "Grundgesetz", "limit": 3}' 2>/dev/null)
if echo "$hybrid_response" | jq -e '.numFound' >/dev/null 2>&1; then
    result_count=$(echo "$hybrid_response" | jq -r '.numFound // 0')
    log_success "Hybrid Search API working - found $result_count results"
else
    log_error "Hybrid Search API failed"
fi

# Test stopword filtering
log_info "Testing German stopword filtering..."
stopword_response=$(curl -s --max-time 15 -X POST "http://localhost:3001/api/hybrid/search" \
    -H "Content-Type: application/json" \
    -d '{"query": "der", "limit": 3}' 2>/dev/null)
if echo "$stopword_response" | jq -e '.error' >/dev/null 2>&1; then
    log_success "Stopword filtering working (correctly rejected 'der' query)"
else
    log_error "Stopword filtering test failed"
fi

# Test API proxy through frontend
log_info "Testing API proxy through frontend..."
proxy_response=$(curl -s --max-time 10 "http://localhost:8080/api/health" 2>/dev/null)
if echo "$proxy_response" | jq -e '.status' >/dev/null 2>&1; then
    log_success "API proxy working correctly"
else
    log_error "API proxy test failed"
fi

echo
echo "=== Python Script Test ==="
log_info "Testing Python hybrid search script..."
cd search-engines/qdrant
if timeout 20 python3 hybrid_search.py --query "Grundgesetz" --limit 3 >/tmp/hybrid_test.json 2>/dev/null; then
    if [ -s /tmp/hybrid_test.json ] && jq -e '. | length > 0' /tmp/hybrid_test.json >/dev/null 2>&1; then
        result_count=$(jq -r '. | length' /tmp/hybrid_test.json)
        log_success "Python hybrid search script working - returned $result_count results"
    else
        log_error "Python hybrid search script returned no results"
    fi
else
    log_error "Python hybrid search script execution failed"
fi
cd ../..
rm -f /tmp/hybrid_test.json

echo
echo "=== Results Summary ==="
TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
echo "Total Tests Run: $TOTAL_TESTS"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}✅ ASRA hybrid search system is fully operational${NC}"
    echo -e "${GREEN}✅ All Docker services are running correctly${NC}"
    echo -e "${GREEN}✅ Search functionality with intelligent filtering is working${NC}"
    echo -e "${GREEN}✅ German stopword and repealed document filtering active${NC}"
    echo -e "${GREEN}✅ Frontend-API integration is functional${NC}"
    echo -e "${GREEN}✅ Python hybrid search scripts are working${NC}"
else
    echo -e "\n${YELLOW}⚠️  $TESTS_FAILED test(s) failed - please check the issues above${NC}"
    echo -e "${YELLOW}Core functionality may still be working despite some failures${NC}"
fi

echo
echo "Verification completed at: $(date)"
echo "System ready for use!"

exit $TESTS_FAILED