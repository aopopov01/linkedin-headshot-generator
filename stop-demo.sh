#!/bin/bash

# LinkedIn Headshot Generator - Stop Demo Script
echo "🛑 Stopping LinkedIn Headshot Generator Demo..."
echo "----------------------------------------"

# Navigate to project directory
cd "$(dirname "$0")"

# Stop all containers
docker-compose -f docker-compose.test.yml down --remove-orphans

# Optional: Remove volumes (uncomment to clean up data)
# echo "🧹 Cleaning up volumes..."
# docker-compose -f docker-compose.test.yml down -v

echo "✅ Demo stopped successfully!"
echo ""
echo "💡 To start again: ./start-demo.sh"