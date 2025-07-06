# Project Planning: ASRA – German Laws

## Project Overview

ASRA – German Laws is a specialized web-based application for searching federal law, providing a user-friendly interface for searching German legal documents indexed in Apache Solr. The project serves as a practical tool for legal research and as a demonstration of Solr's search capabilities for legal applications.

**Project Status**: ✅ **Phase 1 FULLY COMPLETED** (Version 1.0.0 PRODUCTION READY)
**Quality Assurance**: 11/11 tests passed, 0 critical bugs
**Next Phase**: Sprint 2 - Auto-Suggest & Sorting

---

## System Architecture

### Components

1.  **Frontend Application**
    -   React-based single-page application with configurable UI modes
    -   Responsive UI with Tailwind CSS and modern design
    -   Component-based architecture with central configuration ([`uiConfig.js`](src/config/uiConfig.js))
    -   Vite for fast development and optimized builds
    -   **Normal Mode**: 5 user-friendly search fields (All fields, Full text, Short title, Official abbreviation, Legal abbreviation)
    -   **Expert Mode**: Full access to all Solr fields with advanced filters
    -   **ModeSwitcher**: User-friendly toggle between modes

2.  **Search Backend**
    -   **Hybrid Search Architecture**:
        -   **Apache Solr 9.4**: For classic full-text search and faceting.
            -   Customized schema configuration for German legal documents.
            -   RESTful API with special support for German legal abbreviations ("1. BImSchV", etc.).
            -   Content highlighting with corrected field configurations.
        -   **Qdrant**: For semantic vector search.
            -   Storage and querying of vector embeddings of legal documents.
        -   **Ollama (optional)**: For LLM-supported functions.
            -   Query expansion.
            -   RAG-based answer generation.
    -   Docker containerization for deployment consistency

3.  **Infrastructure**
    -   Docker Compose for multi-container orchestration
    -   Nginx as a reverse proxy and static file server
    -   Production and development environments

---

## System Architecture

### Components

1.  **Frontend Application**
    -   React-based single-page application
    -   Responsive UI with Tailwind CSS
    -   Component-based architecture
    -   Vite for fast development and optimized builds

2.  **Search Backend**
    -   Apache Solr 9.4 search platform
    -   Custom schema configuration for document indexing
    -   RESTful API for query processing
    -   Docker containerization for deployment consistency

### Data Flow

1.  User inputs search query in the frontend
2.  Query is sent to the backend API
3.  **Backend API processes the query**:
    -   Optional: LLM-supported query expansion (Ollama)
    -   Parallel query to Apache Solr (full-text search)
    -   Parallel query to Qdrant (semantic vector search)
4.  **Results Combination**: Backend API combines and ranks results from Solr and Qdrant.
5.  Results are returned to the frontend
6.  Frontend renders the results in a user-friendly format
7.  Optional: RAG-based answer generation by Ollama based on the combined search results.

---

## Development Guidelines

### Coding Style & Standards

#### React Components
- Follow functional component pattern with hooks
- Keep components focused on a single responsibility
- Use clear, descriptive prop names
- Extract reusable logic into custom hooks

#### JavaScript
- Use modern ES6+ syntax
- Follow consistent naming conventions:
  - camelCase for variables and functions
  - PascalCase for components and classes
- Prefer destructuring for props and state
- Use async/await for asynchronous operations

#### CSS/Styling
- Use Tailwind utility classes for styling
- Maintain custom color scheme in tailwind.config.js
- Use responsive design principles throughout

### File Structure

- `/src`: React application source code
  - `/components`: Reusable UI components
  - `/services`: API and data handling services
  - `/hooks`: Custom React hooks
  - `/utils`: Helper functions and utilities
  - `/context`: React context providers

- `/docker`: Docker configuration and related files
  - `/solr`: Solr configuration and data loading scripts

### Testing Strategy

- Unit tests for React components using React Testing Library
- API service tests with mock responses
- Integration tests for key user flows
- End-to-end tests for critical paths

### Performance Considerations

1.  Optimize Solr queries for performance
2.  Implement pagination for large result sets
3.  Use React.memo for performance-sensitive components
4.  Optimize bundle size with code splitting

---

## Feature Roadmap

### Phase 1: Core Search Functionality
- [x] Basic search interface
- [x] Solr connection and query handling
- [x] Results display with basic metadata
- [x] Error handling and loading states

### Phase 2: Enhanced Search Experience
- [ ] Advanced search filters
- [ ] Faceted navigation
- [ ] Search suggestions
- [ ] Result highlighting
- [ ] Sorting options
- [ ] **Integration of semantic search (Qdrant)**
- [ ] **Optional LLM integration (Ollama) for query expansion**

### Phase 3: Document Management & Advanced AI Features
- [ ] Document preview
- [ ] User authentication
- [ ] Saved searches
- [ ] Export functionality
- [ ] Analytics dashboard
- [ ] **Optional RAG implementation (Ollama)**
- [ ] **Fine-tuning of embeddings and LLM models**

---

## Technical Debt & Known Issues

1.  Need to implement proper error boundaries
2.  API URL hardcoded in service layer
3.  Limited test coverage
4.  Environment configuration needs to be externalized

---

## Deployment Strategy

### Development Environment
- Local Vite development server
- Docker-based Solr instance
- Sample data for testing

### Production Deployment
- Docker Compose for containerized deployment
- NGINX for static asset serving
- Health checks for service monitoring
- Regular data backups