#!/bin/bash

# LinkedIn Headshot Generator - Demo Startup Script
echo "🚀 Starting LinkedIn Headshot Generator Demo..."
echo "----------------------------------------"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Navigate to project directory
cd "$(dirname "$0")"

echo "📋 Environment Configuration:"
echo "   - Backend API: http://localhost:3001"
echo "   - Web Demo: http://localhost:3000"
echo "   - Database: PostgreSQL (port 5433)"
echo "   - Cache: Redis (port 6380)"
echo ""

# Create required directories
echo "📁 Creating required directories..."
mkdir -p backend/logs backend/uploads backend/temp

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.test.yml down --remove-orphans

# Start the demo environment
echo "🔄 Starting demo environment..."
echo "   This may take a few minutes on first run..."

# Build and start services
docker-compose -f docker-compose.test.yml up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check PostgreSQL
if docker-compose -f docker-compose.test.yml exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
    echo "   ✅ PostgreSQL is ready"
else
    echo "   ❌ PostgreSQL is not ready"
fi

# Check Redis  
if docker-compose -f docker-compose.test.yml exec -T redis redis-cli -a redis_dev_pass ping >/dev/null 2>&1; then
    echo "   ✅ Redis is ready"
else
    echo "   ❌ Redis is not ready"
fi

# Check Backend API
sleep 5
if curl -s http://localhost:3001/health >/dev/null 2>&1; then
    echo "   ✅ Backend API is ready"
else
    echo "   ⚠️  Backend API is starting up (this may take a moment)"
fi

# Check Web Demo
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "   ✅ Web Demo is ready"
else
    echo "   ⚠️  Web Demo is starting up (this may take a moment)"
fi

echo ""
echo "🎉 Demo environment is starting up!"
echo "----------------------------------------"
echo "📱 Open your browser and go to: http://localhost:3000"
echo "🔧 Backend API available at: http://localhost:3001"
echo "📊 Backend API health check: http://localhost:3001/health"
echo ""
echo "💡 Features available in demo mode:"
echo "   - Upload photo and generate headshots"
echo "   - 5 professional styles to choose from"
echo "   - Mock AI generation with sample results"
echo "   - No API keys required for demo"
echo ""
echo "🛠️  To stop the demo: ./stop-demo.sh"
echo "📄 To view logs: docker-compose -f docker-compose.test.yml logs -f"
echo ""
echo "⚡ Demo is running in background..."