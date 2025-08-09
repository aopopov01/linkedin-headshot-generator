# LinkedIn Headshot Generator - Demo Setup

This demo allows you to test the LinkedIn Headshot Generator locally without requiring external API keys or services.

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Ports 3000, 3001, 5433, and 6380 available

### Run the Demo

1. **Start the demo environment:**
   ```bash
   ./start-demo.sh
   ```

2. **Open your browser and go to:**
   - **Web Demo**: http://localhost:3000
   - **Backend API**: http://localhost:3001

3. **Test the features:**
   - Upload any selfie/portrait photo
   - Choose from 5 professional styles
   - Generate AI headshots (mock results)
   - Download the generated images

4. **Stop the demo:**
   ```bash
   ./stop-demo.sh
   ```

## What's Running

| Service | URL | Description |
|---------|-----|-------------|
| Web Demo | http://localhost:3000 | React web interface |
| Backend API | http://localhost:3001 | Node.js REST API |
| Database | localhost:5433 | PostgreSQL database |
| Cache | localhost:6380 | Redis cache |

## Demo Features

✅ **Photo Upload**: Upload selfies up to 10MB  
✅ **Style Selection**: 5 professional styles (Corporate, Creative, Executive, Startup, Healthcare)  
✅ **Mock AI Generation**: Returns sample professional headshots  
✅ **Image Download**: Download generated images  
✅ **Real-time Status**: Progress tracking during generation  
✅ **Responsive UI**: Mobile-friendly interface  

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Demo      │───▶│   Backend API   │───▶│   Database      │
│  (React App)    │    │  (Node.js/Express)  │    │  (PostgreSQL)   │
│  Port 3000      │    │   Port 3001     │    │   Port 5433     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Redis Cache   │
                       │   Port 6380     │
                       └─────────────────┘
```

## Demo vs Production Differences

| Feature | Demo Mode | Production Mode |
|---------|-----------|----------------|
| AI Generation | Mock responses with sample images | Real Replicate API calls |
| Authentication | Demo user auto-created | Full registration/login system |
| Image Storage | Temporary/mock | Cloudinary integration |
| Payment | Unlimited credits | Stripe integration |
| Analytics | Basic logging | Full Mixpanel tracking |

## Troubleshooting

### Services not starting?
```bash
# Check Docker is running
docker info

# View service logs
docker-compose -f docker-compose.test.yml logs -f

# Restart services
./stop-demo.sh
./start-demo.sh
```

### Port conflicts?
Edit `docker-compose.test.yml` and change the port mappings:
```yaml
ports:
  - "3010:3000"  # Change 3000 to 3010
```

### Database issues?
```bash
# Reset database
docker-compose -f docker-compose.test.yml down -v
./start-demo.sh
```

## File Structure

```
├── backend/              # Node.js API server
├── demo-web/            # React web demo
├── docker-compose.test.yml  # Simplified Docker setup
├── .env                 # Environment variables
├── start-demo.sh        # Start script
├── stop-demo.sh         # Stop script
└── DEMO_SETUP.md        # This file
```

## Next Steps

To make this production-ready, you would need to:

1. **Get API Keys**:
   - Replicate API token for real AI generation
   - Cloudinary for image storage
   - Stripe for payments

2. **Deploy Infrastructure**:
   - Use the full `docker-compose.yml` with monitoring
   - Set up production environment variables
   - Configure domain and SSL certificates

3. **Mobile Apps**:
   - Use the React Native app in `LinkedInHeadshotApp/`
   - Build for iOS and Android app stores

---

**Happy testing! 🚀**