const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LinkedIn Headshot Generator API',
      version: '1.0.0',
      description: 'AI-powered professional headshot generation API for LinkedIn profiles',
      contact: {
        name: 'API Support',
        email: 'support@headshotpro.com'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'https://api.headshotpro.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            code: {
              type: 'string',
              example: 'ERROR_CODE'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            first_name: {
              type: 'string',
              example: 'John'
            },
            last_name: {
              type: 'string',
              example: 'Doe'
            },
            subscription_status: {
              type: 'string',
              enum: ['free', 'active', 'cancelled'],
              example: 'free'
            },
            photo_credits: {
              type: 'integer',
              example: 5
            },
            total_photos_generated: {
              type: 'integer',
              example: 12
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        GeneratedPhoto: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            user_id: {
              type: 'string',
              format: 'uuid'
            },
            original_image_url: {
              type: 'string',
              format: 'url'
            },
            generated_images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: {
                    type: 'string',
                    format: 'url'
                  },
                  public_id: {
                    type: 'string'
                  },
                  width: {
                    type: 'integer'
                  },
                  height: {
                    type: 'integer'
                  }
                }
              }
            },
            style_template: {
              type: 'string',
              enum: ['corporate', 'creative', 'executive', 'startup', 'healthcare'],
              example: 'corporate'
            },
            processing_status: {
              type: 'string',
              enum: ['pending', 'processing', 'completed', 'failed'],
              example: 'completed'
            },
            processing_time_seconds: {
              type: 'integer',
              example: 45
            },
            download_count: {
              type: 'integer',
              example: 3
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            completed_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        StyleTemplate: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'corporate'
            },
            name: {
              type: 'string',
              example: 'Corporate Professional'
            },
            description: {
              type: 'string',
              example: 'Traditional business professional look with formal attire and neutral background'
            },
            estimatedCost: {
              type: 'string',
              example: '0.0092'
            },
            processingTime: {
              type: 'string',
              example: '45-60 seconds'
            }
          }
        },
        Purchase: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            user_id: {
              type: 'string',
              format: 'uuid'
            },
            product_id: {
              type: 'string',
              example: 'headshot_basic'
            },
            amount_usd: {
              type: 'number',
              format: 'float',
              example: 4.99
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed'],
              example: 'completed'
            },
            platform: {
              type: 'string',
              example: 'stripe'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/app.js'
  ],
};

const specs = swaggerJSDoc(options);

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'LinkedIn Headshot Generator API',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      tryItOutEnabled: true
    }
  }),
  specs
};