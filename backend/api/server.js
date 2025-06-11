/**
 * ASRA API Server
 * Provides backend services for the ASRA frontend
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import route handlers
const hybridRoutes = require('./routes/hybrid');
const searchRoutes = require('./routes/search');

// Initialize Express
const app = express();
const port = process.env.PORT || 3001;

// Configure middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (if needed)
app.use(express.static(path.join(__dirname, 'public')));

// Register routes
app.use('/api/hybrid', hybridRoutes);
app.use('/api/search', searchRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'API service is operational'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'ASRA API Server is running',
    endpoints: [
      '/api/health - Health check endpoint',
      '/api/search - Standard Solr search with filtering',
      '/api/hybrid/search - Hybrid search combining Solr and Qdrant'
    ]
  });
});

// Start the server
app.listen(port, () => {
  console.log(`ASRA API server is running on port ${port}`);
});

module.exports = app;
