const express = require('express');
const { spawn } = require('child_process');
const cors = require('cors');
const path = require('path');

// Create an Express router for the hybrid search API
const router = express.Router();

/**
 * Route handler for hybrid search
 * This endpoint integrates with the Python hybrid search script
 */
router.get('/search', cors(), async (req, res) => {
  try {
    const { q, rows = 10, start = 0, keyword_weight = 0.5, semantic_weight = 0.5 } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({ 
        error: true, 
        message: 'Query parameter is required',
        numFound: 0,
        docs: []
      });
    }

    // Convert to numeric values
    const limit = parseInt(rows, 10) || 10;
    const weights = `${parseFloat(keyword_weight)},${parseFloat(semantic_weight)}`;
    
    console.log(`Performing hybrid search: "${q}" with weights ${weights} and limit ${limit}`);
    
    // Execute the Python script
    const scriptPath = path.join(__dirname, '../../../search-engines/qdrant/hybrid_search.py');
    // Use system Python in development, but respect PATH in production (which should include the venv)
    const pythonBin = process.env.NODE_ENV === 'production' ? 'python' : 'python3';
    const pythonProcess = spawn(pythonBin, [
      scriptPath,
      '--query', q,
      '--limit', limit.toString(),
      '--weights', weights
    ]);
    
    let resultData = '';
    let errorData = '';

    // Collect data from stdout
    pythonProcess.stdout.on('data', (data) => {
      resultData += data.toString();
    });

    // Collect data from stderr
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      console.error(`Hybrid search stderr: ${data}`);
    });

    // Handle process completion
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Hybrid search process exited with code ${code}`);
        console.error(`Error: ${errorData}`);
        return res.status(500).json({
          error: true, 
          message: `Search failed with exit code ${code}`,
          stderr: errorData,
          numFound: 0,
          docs: []
        });
      }

      try {
        // Parse the JSON returned by the Python script
        const results = JSON.parse(resultData);
        
        // Format the results in a way compatible with the frontend
        const formattedResults = {
          numFound: results.length,
          docs: results,
          start: parseInt(start, 10) || 0,
        };

        res.json(formattedResults);
      } catch (parseError) {
        console.error('Failed to parse hybrid search results:', parseError);
        console.error('Raw data:', resultData);
        res.status(500).json({
          error: true, 
          message: 'Failed to parse search results',
          numFound: 0,
          docs: []
        });
      }
    });
  } catch (error) {
    console.error('Hybrid search error:', error);
    res.status(500).json({
      error: true, 
      message: error.message || 'Internal server error',
      numFound: 0,
      docs: []
    });
  }
});

module.exports = router;
