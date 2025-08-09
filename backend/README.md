# LinkedIn Headshot Generator Backend API

Enterprise-grade Node.js backend API for the LinkedIn Headshot Generator mobile application. This API provides AI-powered professional headshot generation using Replicate's image models, complete payment processing, user management, and comprehensive analytics.

## 🚀 Features

### Core Functionality
- **AI-Powered Headshot Generation**: Integration with Replicate API for professional headshot creation
- **Multiple Style Templates**: Corporate, Creative, Executive, Startup, and Healthcare styles
- **Real-time Processing**: Asynchronous image generation with status tracking
- **Batch Processing**: Generate multiple variations and styles simultaneously

### Authentication & Security
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Role-based Access Control**: Admin and user roles with appropriate permissions
- **Rate Limiting**: Advanced rate limiting for API protection
- **Data Encryption**: Secure password hashing and sensitive data protection

### Payment Integration
- **Stripe Integration**: Complete payment processing for credits and subscriptions
- **Flexible Pricing**: One-time purchases and subscription models
- **Credit System**: Photo credit management with real-time tracking
- **Webhook Support**: Automated payment confirmation and processing

### Infrastructure
- **PostgreSQL Database**: Robust data storage with migrations and indexing
- **Redis Caching**: High-performance caching and session management
- **Cloudinary Integration**: Professional image storage and optimization
- **Docker Support**: Containerized deployment with docker-compose

### Analytics & Monitoring
- **Mixpanel Integration**: Advanced user behavior tracking
- **Comprehensive Logging**: Structured logging with Winston
- **Performance Monitoring**: Request tracking and error monitoring
- **Success Metrics**: User engagement and conversion tracking

## 📋 Prerequisites

- Node.js 18.x or higher
- PostgreSQL 15.x
- Redis 7.x
- Docker and Docker Compose (for containerized development)

## 🛠 Installation & Setup

### Local Development

1. **Clone and navigate to the project:**
```bash
cd "/home/he_reat/Desktop/Projects/LinkedIn Headshot/backend"
```

2. **Install dependencies:**
```bash
npm install
```

3. **Environment configuration:**
```bash
cp .env.example .env
# Edit .env with your configuration values
```

4. **Database setup:**
```bash
# Run migrations
npm run migrate

# Seed database (optional)
npm run seed
```

5. **Start development server:**
```bash
npm run dev
```

### Docker Development

1. **Using Docker Compose:**
```bash
# Start all services (API, Database, Redis)
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

2. **Production-like setup:**
```bash
# With nginx and monitoring
docker-compose --profile production up -d
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | No | `development` |
| `PORT` | Server port | No | `3001` |
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `REDIS_URL` | Redis connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `REPLICATE_API_TOKEN` | Replicate API token | Yes | - |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes | - |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes | - |
| `MIXPANEL_TOKEN` | Mixpanel project token | No | - |

See `.env.example` for complete configuration options.

### Database Configuration

The application uses Knex.js for database management:

```javascript
// knexfile.js configuration
module.exports = {
  development: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
    }
  }
};
```

## 📚 API Documentation

### Interactive Documentation
- **Swagger UI**: `http://localhost:3001/docs` (when `SWAGGER_ENABLED=true`)
- **OpenAPI Spec**: `http://localhost:3001/docs.json`

### Authentication
All endpoints (except auth and health) require a valid JWT token:
```
Authorization: Bearer <your-jwt-token>
```

### Key Endpoints

#### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout

#### Photo Generation
- `POST /api/v1/photos/generate` - Generate professional headshots
- `GET /api/v1/photos` - Get user's generated photos
- `GET /api/v1/photos/:id/status` - Check generation status
- `GET /api/v1/photos/:id/download/:index` - Download generated photo

#### Payments
- `GET /api/v1/payments/products` - Get available products
- `POST /api/v1/payments/create-payment-intent` - Create payment intent
- `POST /api/v1/payments/webhook` - Stripe webhook handler

#### User Management
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `GET /api/v1/users/history` - Get generation history

### Response Format
All API responses follow a consistent format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "pagination": { ... } // For paginated responses
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

## 🏗 Architecture

### Project Structure
```
src/
├── app.js                 # Main application file
├── config/               # Configuration files
│   ├── database.js       # Database configuration
│   └── logger.js         # Logging configuration
├── middleware/           # Express middleware
│   ├── auth.js          # Authentication middleware
│   ├── security.js      # Security middleware
│   ├── validation.js    # Request validation
│   └── errorHandler.js  # Error handling
├── routes/              # API route handlers
│   ├── auth.js         # Authentication routes
│   ├── photos.js       # Photo generation routes
│   ├── payments.js     # Payment routes
│   ├── users.js        # User management routes
│   └── analytics.js    # Analytics routes
├── services/           # Business logic services
│   ├── aiService.js    # AI/Replicate integration
│   ├── paymentService.js # Payment processing
│   ├── analyticsService.js # Analytics tracking
│   ├── redisService.js # Caching service
│   └── cloudinaryService.js # Image storage
├── docs/              # API documentation
│   └── swagger.js     # OpenAPI specification
└── utils/             # Utility functions
```

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  first_name VARCHAR,
  last_name VARCHAR,
  subscription_status VARCHAR DEFAULT 'free',
  photo_credits INTEGER DEFAULT 1,
  total_photos_generated INTEGER DEFAULT 0,
  stripe_customer_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Generated Photos Table
```sql
CREATE TABLE generated_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  original_image_url VARCHAR NOT NULL,
  generated_images JSONB,
  style_template VARCHAR NOT NULL,
  processing_status VARCHAR DEFAULT 'pending',
  processing_time_seconds INTEGER,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

### Service Architecture

#### AI Service (Replicate Integration)
```javascript
// Generate professional headshots
const result = await aiService.generateHeadshot(imageBase64, 'corporate', {
  numOutputs: 4,
  aiParameters: { guidance_scale: 5 }
});
```

#### Payment Service (Stripe Integration)
```javascript
// Create payment intent
const paymentIntent = await paymentService.createPaymentIntent(
  userId, 
  'headshot_basic', 
  { source: 'mobile_app' }
);
```

#### Caching Service (Redis)
```javascript
// Cache photo analysis results
await redisService.cachePhotoAnalysis(photoId, analysis, 3600);
const cachedAnalysis = await redisService.getCachedPhotoAnalysis(photoId);
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
```
tests/
├── integration/        # Integration tests
├── unit/              # Unit tests
├── fixtures/          # Test data and fixtures
└── helpers/           # Test helper functions
```

### Example Test
```javascript
describe('Photo Generation API', () => {
  test('should generate professional headshot', async () => {
    const response = await request(app)
      .post('/api/v1/photos/generate')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('photo', 'test-image.jpg')
      .field('style_template', 'corporate')
      .expect(202);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
  });
});
```

## 🚀 Deployment

### Production Environment

1. **Environment Setup:**
```bash
# Set production environment variables
export NODE_ENV=production
export DATABASE_URL=your-production-db-url
export REDIS_URL=your-production-redis-url
```

2. **Build and Deploy:**
```bash
# Build production image
docker build -t linkedin-headshot-api .

# Run production container
docker run -d \
  --name linkedin-headshot-api \
  -p 3001:3001 \
  --env-file .env.production \
  linkedin-headshot-api
```

### Health Monitoring
- **Health Check Endpoint**: `GET /health`
- **Metrics Endpoint**: `GET /metrics` (when enabled)
- **Docker Health Check**: Built-in container health monitoring

## 🔒 Security

### Security Features
- **Helmet.js**: HTTP security headers
- **CORS Configuration**: Controlled cross-origin access
- **Rate Limiting**: Request frequency control
- **Input Validation**: Joi schema validation
- **Password Security**: bcrypt hashing with salt rounds
- **JWT Security**: Secure token generation and validation

### Security Headers
```javascript
// Automatically applied security headers
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

## 📊 Monitoring & Analytics

### Logging
Structured logging with Winston:
```javascript
logger.info('Photo generation completed', {
  userId: '12345',
  photoId: 'photo-67890',
  processingTime: '45s',
  style: 'corporate'
});
```

### Analytics Events
Mixpanel integration for user behavior tracking:
- User registration and login
- Photo generation requests
- Payment events
- Feature usage patterns

### Performance Monitoring
- Request/response timing
- Database query performance
- AI processing metrics
- Error rate tracking

## 🤝 Contributing

### Development Guidelines
1. **Code Style**: ESLint configuration with Airbnb style guide
2. **Commit Format**: Conventional commits format
3. **Testing**: Maintain test coverage above 80%
4. **Documentation**: Update API docs for endpoint changes

### Pull Request Process
1. Create feature branch from `develop`
2. Implement changes with tests
3. Update documentation
4. Submit pull request with description

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues
- **Database Connection**: Ensure PostgreSQL is running and credentials are correct
- **Redis Connection**: Verify Redis server is accessible
- **Image Upload**: Check Cloudinary configuration and file size limits
- **AI Generation**: Verify Replicate API token and quota

### Contact
- **Technical Support**: support@headshotpro.com
- **Documentation**: `/docs` endpoint when server is running
- **GitHub Issues**: For bug reports and feature requests

---

## 🔄 Version History

- **v1.0.0** (Current): Initial enterprise release with full feature set
- **v0.9.0**: Beta release with core functionality
- **v0.8.0**: Alpha release with basic AI integration

---

*Last updated: January 2025*