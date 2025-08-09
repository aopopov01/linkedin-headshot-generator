const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure multer for image uploads
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Simple in-memory storage for demo
const demoData = {
  users: new Map(),
  photos: new Map(),
  photoCounter: 1
};

// JWT Secret for demo
const JWT_SECRET = 'demo_jwt_secret_for_testing_only';

// Sample professional headshot images for demo
const demoImages = {
  corporate: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=400&h=400&fit=crop&crop=face'
  ],
  creative: [
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face'
  ],
  executive: [
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=400&fit=crop&crop=face'
  ],
  startup: [
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1558507652-2d9626c4e67a?w=400&h=400&fit=crop&crop=face'
  ],
  healthcare: [
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400&h=400&fit=crop&crop=face'
  ]
};

// Simple auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
}

// Routes
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'LinkedIn Headshot Generator Demo API',
    status: 'healthy',
    version: '1.0.0-demo',
    timestamp: new Date().toISOString()
  });
});

// Demo login
app.post('/api/auth/demo-login', (req, res) => {
  const { email = 'demo@example.com' } = req.body;
  
  const user = {
    id: 'demo-user-123',
    email,
    first_name: 'Demo',
    last_name: 'User',
    subscription_status: 'premium',
    credits_remaining: 999,
    isDemo: true
  };

  // Store user for later reference
  demoData.users.set(user.id, user);

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  console.log(`✅ Demo user logged in: ${user.email}`);

  res.json({
    success: true,
    message: 'Demo login successful',
    user,
    token
  });
});

// Generate headshots
app.post('/api/photos/generate', 
  authenticateToken, 
  upload.single('photo'),
  async (req, res) => {
    try {
      const { userId } = req.user;
      const { style_template = 'corporate', num_outputs = 4 } = req.body;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Photo file is required'
        });
      }

      const photoId = `photo_${demoData.photoCounter++}_${Date.now()}`;
      const originalImageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

      // Store photo record
      const photoRecord = {
        id: photoId,
        user_id: userId,
        original_image_url: originalImageUrl,
        style_template,
        processing_status: 'pending',
        processing_cost: 0.05,
        created_at: new Date().toISOString()
      };

      demoData.photos.set(photoId, photoRecord);

      console.log(`🎨 Starting headshot generation: ${photoId} (style: ${style_template})`);

      // Simulate AI processing in background
      setTimeout(async () => {
        try {
          const styleImages = demoImages[style_template] || demoImages.corporate;
          const selectedImages = styleImages.slice(0, parseInt(num_outputs));
          
          const generatedImages = selectedImages.map((url, index) => ({
            url,
            public_id: `demo_${photoId}_${index}`,
            width: 400,
            height: 400,
            format: 'jpg'
          }));

          // Update photo record
          photoRecord.generated_images = generatedImages;
          photoRecord.processing_status = 'completed';
          photoRecord.processing_time_seconds = 2 + Math.floor(Math.random() * 4); // 2-6 seconds
          photoRecord.completed_at = new Date().toISOString();

          console.log(`✨ Demo headshot generation completed: ${photoId} (${generatedImages.length} images)`);
        } catch (error) {
          console.error(`❌ Demo generation failed for ${photoId}:`, error);
          photoRecord.processing_status = 'failed';
          photoRecord.error = error.message;
        }
      }, 2000 + Math.random() * 3000); // 2-5 seconds delay

      res.status(202).json({
        success: true,
        message: 'Photo generation started',
        data: {
          id: photoId,
          processing_status: 'pending',
          estimated_processing_time: '30-60 seconds',
          estimated_cost: 0.05,
          style_template,
          num_outputs: parseInt(num_outputs),
          original_image_url: originalImageUrl
        }
      });

    } catch (error) {
      console.error('Photo generation failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start photo generation'
      });
    }
  }
);

// Get photo status
app.get('/api/photos/:photoId/status', authenticateToken, (req, res) => {
  try {
    const { photoId } = req.params;
    const { userId } = req.user;

    const photo = demoData.photos.get(photoId);
    
    if (!photo || photo.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: photo.id,
        processing_status: photo.processing_status,
        processing_time_seconds: photo.processing_time_seconds,
        generated_images: photo.generated_images || null,
        style_template: photo.style_template,
        created_at: photo.created_at,
        completed_at: photo.completed_at,
        download_count: 0
      }
    });

  } catch (error) {
    console.error('Failed to get photo status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get photo status'
    });
  }
});

// Get user photos
app.get('/api/photos', authenticateToken, (req, res) => {
  try {
    const { userId } = req.user;
    const photos = Array.from(demoData.photos.values())
      .filter(photo => photo.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      success: true,
      data: {
        photos,
        pagination: {
          page: 1,
          limit: 10,
          total: photos.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve photos'
    });
  }
});

// Get style templates
app.get('/api/photos/styles', (req, res) => {
  const styles = [
    {
      id: 'corporate',
      template_key: 'corporate',
      display_name: 'Corporate Professional',
      description: 'Professional business look with formal attire',
      preview_image_url: demoImages.corporate[0],
      target_industry: 'Business & Finance',
      is_premium: false,
      premium_price: null,
      average_rating: 4.8,
      usage_count: 1250
    },
    {
      id: 'creative',
      template_key: 'creative',
      display_name: 'Creative Professional',
      description: 'Modern and approachable creative style',
      preview_image_url: demoImages.creative[0],
      target_industry: 'Design & Marketing',
      is_premium: false,
      premium_price: null,
      average_rating: 4.7,
      usage_count: 980
    },
    {
      id: 'executive',
      template_key: 'executive',
      display_name: 'Executive Premium',
      description: 'Leadership and authority executive style',
      preview_image_url: demoImages.executive[0],
      target_industry: 'C-Suite & Management',
      is_premium: true,
      premium_price: 1.99,
      average_rating: 4.9,
      usage_count: 750
    },
    {
      id: 'startup',
      template_key: 'startup',
      display_name: 'Modern Startup',
      description: 'Innovative and casual tech professional',
      preview_image_url: demoImages.startup[0],
      target_industry: 'Technology & Startups',
      is_premium: false,
      premium_price: null,
      average_rating: 4.6,
      usage_count: 1100
    },
    {
      id: 'healthcare',
      template_key: 'healthcare',
      display_name: 'Healthcare Professional',
      description: 'Trustworthy and caring medical professional',
      preview_image_url: demoImages.healthcare[0],
      target_industry: 'Healthcare & Medicine',
      is_premium: false,
      premium_price: null,
      average_rating: 4.8,
      usage_count: 650
    }
  ];

  res.json({
    success: true,
    data: styles
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'LinkedIn Headshot Generator Demo API',
    version: '1.0.0-demo',
    environment: 'demo',
    features: [
      'Demo authentication',
      'Mock AI headshot generation',
      '5 professional styles',
      'File upload support',
      'Real-time status tracking'
    ],
    endpoints: {
      health: 'GET /health',
      demoLogin: 'POST /api/auth/demo-login',
      generateHeadshots: 'POST /api/photos/generate',
      getPhotoStatus: 'GET /api/photos/:id/status',
      getUserPhotos: 'GET /api/photos',
      getStyles: 'GET /api/photos/styles'
    },
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 LinkedIn Headshot Generator Demo API');
  console.log('=====================================');
  console.log(`📍 Server running on http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 API status: http://localhost:${PORT}`);
  console.log('\n💡 Demo Features:');
  console.log('   ✅ Mock AI generation with sample images');
  console.log('   ✅ 5 professional headshot styles');
  console.log('   ✅ File upload and processing simulation');
  console.log('   ✅ JWT authentication with demo user');
  console.log('   ✅ Real-time status tracking');
  console.log('\n🎯 Ready for testing!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});