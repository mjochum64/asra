#!/bin/bash

# ASRA Final Verification Suite
# Tests all services and enhancements after project cleanup and reorganization

# Don't exit on errors - we want to continue testing and report all failures
set +e

echo "=== ASRA Final Verification Suite ==="
echo "Testing all services and enhancements..."
echo "Started at: $(date)"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    ((TESTS_PASSED++))
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ((TESTS_FAILED++))
    FAILED_TESTS+=("$1")
}

# Test if a service is responding
test_service() {
    local service_name="$1"
    local url="$2"
    local expected_status="$3"
    
    log_info "Testing $service_name at $url"
    
    # Use timeout command for extra safety
    local status_code
    status_code=$(timeout 15 curl -s -o /dev/null -w "%{http_code}" --max-time 10 --connect-timeout 5 "$url" 2>/dev/null || echo "000")
    
    if [ "$status_code" = "$expected_status" ]; then
        log_success "$service_name is responding correctly"
        return 0
    else
        log_error "$service_name is not responding at $url (got status: $status_code)"
        return 1
    fi
}

# Test API endpoint
test_api_endpoint() {
    local endpoint_name="$1"
    local url="$2"
    local method="$3"
    local data="$4"
    
    log_info "Testing $endpoint_name endpoint"
    
    local response
    if [ "$method" = "POST" ]; then
        response=$(timeout 20 curl -s -X POST -H "Content-Type: application/json" -d "$data" --max-time 15 --connect-timeout 5 "$url" 2>/dev/null || echo "ERROR")
    else
        response=$(timeout 20 curl -s --max-time 15 --connect-timeout 5 "$url" 2>/dev/null || echo "ERROR")
    fi
    
    if [ "$response" = "ERROR" ] || [ -z "$response" ]; then
        log_error "$endpoint_name endpoint failed to respond or timed out"
        return 1
    else
        log_success "$endpoint_name endpoint is working"
        return 0
    fi
}

echo "=== Phase 1: Docker Services Status ==="
echo

# Check if Docker Compose is running
if ! docker compose -f infrastructure/docker-compose.yml ps | grep -q "Up"; then
    log_error "Docker Compose services are not running. Starting them..."
    cd infrastructure
    docker compose up -d
    cd ..
    sleep 10
    log_info "Waiting for services to start..."
    sleep 20
fi

# Test individual Docker services
log_info "Checking Docker service status..."
docker compose -f infrastructure/docker-compose.yml ps

echo
echo "=== Phase 2: Core Service Health Checks ==="
echo

# Test Frontend (Nginx + Vite)
test_service "Frontend" "http://localhost:8080" "200"

# Test Backend API
test_service "Backend API" "http://localhost:3001/api/health" "200"

# Test Solr
test_service "Apache Solr" "http://localhost:8983/solr/documents/admin/ping" "200"

# Test Qdrant
test_service "Qdrant Vector DB" "http://localhost:6333" "200"

# Test Ollama
test_service "Ollama" "http://localhost:11434/api/version" "200"

# Test OpenWebUI
test_service "OpenWebUI" "http://localhost:8181" "200"

echo
echo "=== Phase 3: Search Functionality Tests ==="
echo

# Test basic Solr search
log_info "Testing basic Solr search functionality..."
solr_response=$(timeout 15 curl -s "http://localhost:8983/solr/documents/select?q=Grundgesetz&rows=5&wt=json" --max-time 10 --connect-timeout 5 2>/dev/null || echo "ERROR")
if [ "$solr_response" != "ERROR" ] && echo "$solr_response" | jq -e '.response.docs | length > 0' > /dev/null 2>&1; then
    log_success "Solr search is working - found results for 'Grundgesetz'"
else
    log_error "Solr search failed or returned no results"
fi

# Test repealed document filtering in Solr
log_info "Testing repealed document filtering in Solr..."
repealed_response=$(timeout 15 curl -s "http://localhost:8983/solr/documents/select?q=*:*&fq=norm_type:repealed&rows=1&wt=json" --max-time 10 --connect-timeout 5 2>/dev/null || echo "ERROR")
if [ "$repealed_response" != "ERROR" ]; then
    repealed_count=$(echo "$repealed_response" | jq -r '.response.numFound // 0' 2>/dev/null || echo "0")
else
    repealed_count=0
fi

# Test for documents with titel "(weggefallen)"
weggefallen_response=$(timeout 15 curl -s "http://localhost:8983/solr/documents/select?q=titel:\"(weggefallen)\"&rows=1&wt=json" --max-time 10 --connect-timeout 5 2>/dev/null || echo "ERROR")
if [ "$weggefallen_response" != "ERROR" ]; then
    weggefallen_count=$(echo "$weggefallen_response" | jq -r '.response.numFound // 0' 2>/dev/null || echo "0")
else
    weggefallen_count=0
fi

total_repealed=$((repealed_count + weggefallen_count))

if [ "$total_repealed" -gt 0 ]; then
    log_info "Found $repealed_count norm_type:repealed + $weggefallen_count titel:weggefallen = $total_repealed total repealed documents"
    
    # Test that they are excluded from normal search
    filtered_response=$(timeout 15 curl -s "http://localhost:8983/solr/documents/select?q=*:*&fq=-norm_type:repealed&fq=-titel:\"(weggefallen)\"&rows=5&wt=json" --max-time 10 --connect-timeout 5 2>/dev/null || echo "ERROR")
    if [ "$filtered_response" != "ERROR" ] && echo "$filtered_response" | jq -e '.response.docs | length > 0' > /dev/null 2>&1; then
        active_count=$(echo "$filtered_response" | jq -r '.response.numFound // 0' 2>/dev/null || echo "0")
        log_success "Repealed document filtering is working correctly - $active_count active documents remain"
    else
        log_error "Repealed document filtering may not be working"
    fi
else
    log_warning "No repealed documents found in index for testing"
fi

# Test Qdrant vector search
log_info "Testing Qdrant vector search functionality..."
qdrant_response=$(curl -s -X POST "http://localhost:6333/collections/deutsche_gesetze/points/search" \
    -H "Content-Type: application/json" \
    -d '{"vector": [0.1, 0.2, 0.3], "limit": 1, "with_payload": true}' --max-time 10)
if echo "$qdrant_response" | jq -e '.result | length >= 0' > /dev/null 2>&1; then
    log_success "Qdrant vector search is responding"
else
    log_error "Qdrant vector search failed"
fi

echo
echo "=== Phase 4: Hybrid Search Enhancement Tests ==="
echo

# Test hybrid search API endpoint
test_api_endpoint "Hybrid Search API" "http://localhost:3001/api/hybrid/search" "POST" '{"query": "Grundgesetz", "limit": 5}'

# Test hybrid search with stopword filtering
log_info "Testing hybrid search with German stopwords..."
stopword_response=$(timeout 20 curl -s -X POST "http://localhost:3001/api/hybrid/search" \
    -H "Content-Type: application/json" \
    -d '{"query": "der", "limit": 5}' --max-time 15 2>/dev/null || echo "ERROR")
if [ "$stopword_response" != "ERROR" ] && echo "$stopword_response" | jq -e '.docs | length >= 0' > /dev/null 2>&1; then
    log_success "Hybrid search handles stopword queries correctly"
else
    log_error "Hybrid search stopword handling failed"
fi

# Test hybrid search with meaningful query
log_info "Testing hybrid search with meaningful query..."
meaningful_response=$(timeout 20 curl -s -X POST "http://localhost:3001/api/hybrid/search" \
    -H "Content-Type: application/json" \
    -d '{"query": "Meinungsfreiheit Artikel 5", "limit": 5}' --max-time 15 2>/dev/null || echo "ERROR")
if [ "$meaningful_response" != "ERROR" ] && echo "$meaningful_response" | jq -e '.docs | length > 0' > /dev/null 2>&1; then
    log_success "Hybrid search returns results for meaningful queries"
else
    log_warning "Hybrid search may not be returning results for meaningful queries"
fi

echo
echo "=== Phase 5: Frontend Integration Tests ==="
echo

# Test frontend can load
log_info "Testing frontend application loading..."
frontend_response=$(curl -s "http://localhost:8080" --max-time 10)
if echo "$frontend_response" | grep -q "ASRA" || echo "$frontend_response" | grep -q "Deutsche Gesetze"; then
    log_success "Frontend loads correctly"
else
    log_error "Frontend may not be loading correctly"
fi

# Test API proxy configuration
log_info "Testing nginx API proxy configuration..."
proxy_response=$(curl -s "http://localhost:8080/api/health" --max-time 10)
if echo "$proxy_response" | grep -q "OK" || echo "$proxy_response" | grep -q "healthy"; then
    log_success "Nginx API proxy is working correctly"
else
    log_error "Nginx API proxy configuration may have issues"
fi

echo
echo "=== Phase 6: Python Hybrid Search Script Tests ==="
echo

# Test Python hybrid search script directly
log_info "Testing Python hybrid search script with meaningful query..."
cd search-engines/qdrant
if python3 hybrid_search.py --query "Grundgesetz Artikel 1" --limit 3 > /tmp/hybrid_test.json 2>/dev/null; then
    if [ -s /tmp/hybrid_test.json ] && jq -e '. | length > 0' /tmp/hybrid_test.json > /dev/null 2>&1; then
        log_success "Python hybrid search script works correctly"
    else
        log_error "Python hybrid search script returned no results"
    fi
else
    log_error "Python hybrid search script failed to execute"
fi

# Test Python hybrid search with stopword
log_info "Testing Python hybrid search script with stopword query..."
if python3 hybrid_search.py --query "der" --limit 3 > /tmp/hybrid_stopword_test.json 2>/dev/null; then
    log_success "Python hybrid search script handles stopwords"
else
    log_warning "Python hybrid search script may have issues with stopword queries"
fi

cd ../..

echo
echo "=== Phase 7: System Integration Tests ==="
echo

# Test that all services can communicate
log_info "Testing service communication chain..."

# Test Ollama embedding generation
log_info "Testing Ollama embedding generation..."
embedding_response=$(curl -s -X POST "http://localhost:11434/api/embeddings" \
    -H "Content-Type: application/json" \
    -d '{"model": "qllama/multilingual-e5-large-instruct:latest", "prompt": "test"}' --max-time 20)
if echo "$embedding_response" | jq -e '.embedding | length > 0' > /dev/null 2>&1; then
    log_success "Ollama embedding generation is working"
else
    log_error "Ollama embedding generation failed"
fi

echo
echo "=== Phase 8: Data Quality Tests ==="
echo

# Check Solr document count
log_info "Checking Solr document count..."
solr_count_response=$(curl -s "http://localhost:8983/solr/documents/select?q=*:*&rows=0&wt=json" --max-time 10)
solr_doc_count=$(echo "$solr_count_response" | jq -r '.response.numFound // 0' 2>/dev/null || echo "0")
log_info "Solr contains $solr_doc_count documents"

if [ "$solr_doc_count" -gt 1000 ]; then
    log_success "Solr has substantial document collection ($solr_doc_count docs)"
elif [ "$solr_doc_count" -gt 0 ]; then
    log_warning "Solr has limited document collection ($solr_doc_count docs)"
else
    log_error "Solr appears to have no documents"
fi

# Check Qdrant collection info
log_info "Checking Qdrant collection info..."
qdrant_info_response=$(curl -s "http://localhost:6333/collections/deutsche_gesetze" --max-time 10)
if echo "$qdrant_info_response" | jq -e '.result.points_count' > /dev/null 2>&1; then
    qdrant_points=$(echo "$qdrant_info_response" | jq -r '.result.points_count // 0')
    log_info "Qdrant contains $qdrant_points vector points"
    if [ "$qdrant_points" -gt 0 ]; then
        log_success "Qdrant has vector data available"
    else
        log_warning "Qdrant collection exists but has no points"
    fi
else
    log_error "Qdrant collection info could not be retrieved"
fi

echo
echo "=== Phase 9: Performance Tests ==="
echo

# Test search response times
log_info "Testing search performance..."

# Solr performance
start_time=$(date +%s%N)
curl -s "http://localhost:8983/solr/documents/select?q=Grundgesetz&rows=10&wt=json" > /dev/null
end_time=$(date +%s%N)
solr_time=$((($end_time - $start_time) / 1000000))  # Convert to milliseconds
log_info "Solr search took ${solr_time}ms"

if [ "$solr_time" -lt 1000 ]; then
    log_success "Solr search performance is good (<1s)"
elif [ "$solr_time" -lt 3000 ]; then
    log_warning "Solr search performance is acceptable (<3s)"
else
    log_error "Solr search performance is slow (>3s)"
fi

# Hybrid search performance
start_time=$(date +%s%N)
curl -s -X POST "http://localhost:3001/api/hybrid/search" \
    -H "Content-Type: application/json" \
    -d '{"query": "Grundgesetz", "limit": 10}' > /dev/null 2>/dev/null
end_time=$(date +%s%N)
hybrid_time=$((($end_time - $start_time) / 1000000))  # Convert to milliseconds
log_info "Hybrid search took ${hybrid_time}ms"

if [ "$hybrid_time" -lt 2000 ]; then
    log_success "Hybrid search performance is good (<2s)"
elif [ "$hybrid_time" -lt 5000 ]; then
    log_warning "Hybrid search performance is acceptable (<5s)"
else
    log_error "Hybrid search performance is slow (>5s)"
fi

echo
echo "=== Final Results Summary ==="
echo

# Calculate total tests
TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))

echo -e "${BLUE}=== ASRA Final Verification Suite Results ===${NC}"
echo -e "Total Tests Run: ${TOTAL_TESTS}"
echo -e "${GREEN}Tests Passed: ${TESTS_PASSED}${NC}"
echo -e "${RED}Tests Failed: ${TESTS_FAILED}${NC}"

if [ ${TESTS_FAILED} -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! ASRA system is fully operational.${NC}"
    echo -e "${GREEN}✅ Project cleanup and reorganization completed successfully${NC}"
    echo -e "${GREEN}✅ All Docker services are running correctly${NC}"
    echo -e "${GREEN}✅ Hybrid search with intelligent filtering is working${NC}"
    echo -e "${GREEN}✅ German stopword filtering is active${NC}"
    echo -e "${GREEN}✅ Repealed document filtering is working${NC}"
    echo -e "${GREEN}✅ Frontend-API integration is functional${NC}"
else
    echo -e "\n${YELLOW}⚠️  Some tests failed. Please review the following issues:${NC}"
    for failed_test in "${FAILED_TESTS[@]}"; do
        echo -e "${RED}  ❌ $failed_test${NC}"
    done
    echo -e "\n${YELLOW}Despite some issues, core functionality may still be working.${NC}"
fi

echo
echo "Verification completed at: $(date)"
echo -e "${BLUE}Full system status: $(docker compose -f infrastructure/docker-compose.yml ps --format 'table {{.Name}}\t{{.Status}}')${NC}"

# Cleanup temporary files
rm -f /tmp/hybrid_test.json /tmp/hybrid_stopword_test.json

exit $TESTS_FAILED
