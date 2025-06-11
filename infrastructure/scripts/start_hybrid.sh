#!/bin/bash

# Start ASRA with API server and frontend
# This script starts both the API server and the frontend application

echo "Starting ASRA - Deutsche Gesetze system..."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install Node.js and npm."
    exit 1
fi

# Function to check if a process is running on a port
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Start API server if not already running
if ! check_port 3001; then
    echo "Starting API server..."
    cd api
    npm install
    # Start API server in background
    npm start &
    API_PID=$!
    echo "API server started with PID: $API_PID"
    cd ..
else
    echo "API server is already running on port 3001"
fi

# Start frontend
echo "Starting frontend server..."
if [ -f "./start_app.sh" ]; then
    ./start_app.sh
else
    npm install
    npm run dev
fi

# When frontend is stopped, also stop API server
kill $API_PID 2>/dev/null
echo "ASRA system stopped."
