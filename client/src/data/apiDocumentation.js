import { FiLock, FiMap, FiBarChart2, FiImage, FiDatabase, FiCpu, FiActivity } from 'react-icons/fi';
import { GiDna1 } from "react-icons/gi";

/**
 * Comprehensive API documentation metadata for OcceanIQ platform
 * Defines all available endpoints with detailed specifications
 */
export const API_DOCUMENTATION = [
  // Authentication APIs
  {
    id: 'auth',
    name: 'Authentication',
    description: 'User authentication and profile management',
    icon: FiLock,
    endpoints: [
      {
        id: 'auth-signup',
        method: 'POST',
        path: '/api/auth/signup',
        name: 'User Registration',
        description: 'Create a new user account',
        requiresAuth: false,
        parameters: [],
        requestBody: {
          contentType: 'application/json',
          schema: {
            name: { type: 'string', required: true, description: 'Full name of the user' },
            email: { type: 'string', required: true, description: 'Valid email address' },
            password: { type: 'string', required: true, description: 'Password (min 6 characters)' }
          },
          example: JSON.stringify({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'securepass123'
          }, null, 2)
        },
        responses: {
          201: {
            description: 'User created successfully',
            example: JSON.stringify({
              success: true,
              message: 'User created successfully',
              user: { _id: '507f1f77bcf86cd799439011', name: 'John Doe', email: 'john@example.com' }
            }, null, 2)
          },
          400: {
            description: 'Missing fields or user already exists',
            example: JSON.stringify({ message: 'All fields are required.' }, null, 2)
          }
        },
        notes: ['Password is hashed before storage', 'JWT token set as HTTP-only cookie']
      },
      {
        id: 'auth-login',
        method: 'POST',
        path: '/api/auth/login',
        name: 'User Login',
        description: 'Authenticate user and receive JWT token in HTTP-only cookie',
        requiresAuth: false,
        parameters: [],
        requestBody: {
          contentType: 'application/json',
          schema: {
            email: { type: 'string', required: true, description: 'User email address' },
            password: { type: 'string', required: true, description: 'User password' }
          },
          example: JSON.stringify({
            email: 'john@example.com',
            password: 'securepass123'
          }, null, 2)
        },
        responses: {
          200: {
            description: 'Login successful',
            example: JSON.stringify({
              success: true,
              message: 'Login successful',
              user: { _id: '507f1f77bcf86cd799439011', name: 'John Doe', email: 'john@example.com' }
            }, null, 2)
          },
          400: {
            description: 'Missing credentials',
            example: JSON.stringify({ message: 'Email and password are required.' }, null, 2)
          },
          401: {
            description: 'Invalid credentials',
            example: JSON.stringify({ message: 'Invalid email or password.' }, null, 2)
          }
        },
        notes: ['JWT token is set as HTTP-only cookie', 'Cookie expires in 7 days']
      },
      {
        id: 'auth-logout',
        method: 'POST',
        path: '/api/auth/logout',
        name: 'User Logout',
        description: 'Clear authentication cookie and logout user',
        requiresAuth: true,
        parameters: [],
        responses: {
          200: {
            description: 'Logout successful',
            example: JSON.stringify({ success: true, message: 'Logout successful' }, null, 2)
          }
        },
        notes: ['Clears the JWT cookie']
      },
      {
        id: 'auth-profile',
        method: 'GET',
        path: '/api/auth/profile',
        name: 'Get User Profile',
        description: 'Retrieve authenticated user profile information',
        requiresAuth: true,
        parameters: [],
        responses: {
          200: {
            description: 'Profile retrieved successfully',
            example: JSON.stringify({
              success: true,
              user: { _id: '507f1f77bcf86cd799439011', name: 'John Doe', email: 'john@example.com', createdAt: '2025-01-01T00:00:00Z' }
            }, null, 2)
          },
          401: {
            description: 'Not authenticated',
            example: JSON.stringify({ message: 'Unauthorized' }, null, 2)
          }
        },
        notes: ['Requires valid JWT token in cookie']
      }
    ]
  },

  // Map & Biodiversity APIs
  {
    id: 'map',
    name: 'Map & Biodiversity',
    description: 'Species occurrence data, marine weather, and map layers',
    icon: FiMap,
    endpoints: [
      {
        id: 'map-occurrences',
        method: 'GET',
        path: '/api/map/obis/occurrences',
        name: 'Get Species Occurrences',
        description: 'Fetch species occurrence data from OBIS with filters',
        requiresAuth: true,
        parameters: [
          { name: 'scientificname', type: 'string', required: false, location: 'query', description: 'Scientific name of species', example: 'Perna viridis' },
          { name: 'geometry', type: 'string', required: false, location: 'query', description: 'WKT geometry for spatial filtering', example: 'POLYGON((...)' },
          { name: 'startdate', type: 'string', required: false, location: 'query', description: 'Start date (YYYY-MM-DD)', example: '2020-01-01' },
          { name: 'enddate', type: 'string', required: false, location: 'query', description: 'End date (YYYY-MM-DD)', example: '2025-12-31' },
          { name: 'year', type: 'number', required: false, location: 'query', description: 'Filter by year', example: '2024' },
          { name: 'offset', type: 'number', required: false, location: 'query', description: 'Pagination offset', example: '0' },
          { name: 'size', type: 'number', required: false, location: 'query', description: 'Number of results (max 5000)', example: '100' }
        ],
        responses: {
          200: {
            description: 'Occurrences retrieved successfully',
            example: JSON.stringify({
              results: [{ decimalLongitude: 73.85, decimalLatitude: 18.52, scientificName: 'Perna viridis', eventDate: '2024-05-15' }],
              total: 1523
            }, null, 2)
          },
          500: {
            description: 'OBIS API error',
            example: JSON.stringify({ error: 'Failed to fetch occurrences from OBIS' }, null, 2)
          }
        },
        notes: ['Data fetched from OBIS API', 'Cached for 5 minutes', 'Max 5000 results per request']
      },
      {
        id: 'map-grid',
        method: 'GET',
        path: '/api/map/obis/grid/3',
        name: 'Get Grid Data',
        description: 'Fetch occurrence density grid data for heatmap visualization',
        requiresAuth: true,
        parameters: [
          { name: 'geometry', type: 'string', required: false, location: 'query', description: 'WKT geometry for spatial filtering', example: 'POLYGON((...))' },
          { name: 'gridSize', type: 'number', required: false, location: 'query', description: 'Grid cell size', example: '1' }
        ],
        responses: {
          200: {
            description: 'Grid data retrieved',
            example: JSON.stringify({ gridData: [{ lat: 18.5, lon: 73.8, count: 45 }] }, null, 2)
          }
        },
        notes: ['Used for heatmap layers']
      },
      {
        id: 'map-weather',
        method: 'GET',
        path: '/api/map/marine-weather',
        name: 'Get Marine Weather',
        description: 'Fetch real-time marine weather data from Open-Meteo API',
        requiresAuth: true,
        parameters: [
          { name: 'latitude', type: 'number', required: true, location: 'query', description: 'Latitude coordinate', example: '55.0' },
          { name: 'longitude', type: 'number', required: true, location: 'query', description: 'Longitude coordinate', example: '4.0' }
        ],
        responses: {
          200: {
            description: 'Weather data retrieved',
            example: JSON.stringify({
              current: { time: '2025-10-06T12:00', waveHeight: 2.5, waveDirection: 180, windSpeed: 15, waterTemperature: 18.5 }
            }, null, 2)
          },
          400: {
            description: 'Invalid coordinates',
            example: JSON.stringify({ error: 'Invalid coordinates' }, null, 2)
          }
        },
        notes: ['Data from Open-Meteo Marine API', 'Cached for 5 minutes']
      },
      {
        id: 'biodiversity-taxonomy',
        method: 'GET',
        path: '/api/map/worms/taxonomy',
        name: 'Get Taxonomy',
        description: 'Search species taxonomy data from WoRMS',
        requiresAuth: true,
        parameters: [
          { name: 'name', type: 'string', required: true, location: 'query', description: 'Scientific name to search', example: 'Perna viridis' }
        ],
        responses: {
          200: {
            description: 'Taxonomy data retrieved',
            example: JSON.stringify({
              scientificName: 'Perna viridis',
              kingdom: 'Animalia',
              phylum: 'Mollusca',
              class: 'Bivalvia',
              order: 'Mytilida',
              family: 'Mytilidae'
            }, null, 2)
          }
        },
        notes: ['Data from WoRMS API', 'Cached for 10 minutes']
      },
      {
        id: 'biodiversity-images',
        method: 'GET',
        path: '/api/map/species-images',
        name: 'Get Species Images',
        description: 'Search species images from iNaturalist',
        requiresAuth: true,
        parameters: [
          { name: 'name', type: 'string', required: true, location: 'query', description: 'Scientific name', example: 'Perna viridis' },
          { name: 'per_page', type: 'number', required: false, location: 'query', description: 'Images per page', example: '10' }
        ],
        responses: {
          200: {
            description: 'Images retrieved',
            example: JSON.stringify({
              images: [{ url: 'https://...', license: 'CC BY', author: 'Jane Doe' }],
              total: 45
            }, null, 2)
          }
        },
        notes: ['Data from iNaturalist API', 'Cached for 10 minutes']
      }
    ]
  },

  // Dashboard APIs
  {
    id: 'dashboard',
    name: 'Dashboard Analytics',
    description: 'Statistics, trends, and visualization data',
    icon: FiBarChart2,
    endpoints: [
      {
        id: 'dashboard-stats',
        method: 'GET',
        path: '/api/dashboard/stats',
        name: 'Get Dashboard Statistics',
        description: 'Retrieve overview statistics for the dashboard',
        requiresAuth: true,
        parameters: [],
        responses: {
          200: {
            description: 'Statistics retrieved',
            example: JSON.stringify({
              totalSpecies: 10247,
              totalObservations: 156823,
              dataSources: 4,
              totalUsers: 125
            }, null, 2)
          }
        },
        notes: ['Species and observation counts are representative']
      },
      {
        id: 'dashboard-oceanographic',
        method: 'GET',
        path: '/api/dashboard/oceanographic-trends',
        name: 'Get Oceanographic Trends',
        description: 'Fetch time-series oceanographic data for charts',
        requiresAuth: true,
        parameters: [
          { name: 'days', type: 'number', required: false, location: 'query', description: 'Number of days (1-14)', example: '7' },
          { name: 'latitude', type: 'number', required: false, location: 'query', description: 'Latitude coordinate', example: '55.0' },
          { name: 'longitude', type: 'number', required: false, location: 'query', description: 'Longitude coordinate', example: '4.0' }
        ],
        responses: {
          200: {
            description: 'Trend data retrieved',
            example: JSON.stringify({
              timestamps: ['2025-10-01T00:00', '2025-10-02T00:00'],
              temperature: [18.5, 18.7],
              salinity: [35.1, 35.0],
              ph: [8.1, 8.2],
              dissolvedOxygen: [7.5, 7.6]
            }, null, 2)
          }
        },
        notes: ['Data from Open-Meteo Marine API', 'Default location: North Sea (55°N, 4°E)']
      },
      {
        id: 'dashboard-recent-observations',
        method: 'GET',
        path: '/api/dashboard/recent-observations',
        name: 'Get Recent Observations',
        description: 'Retrieve paginated list of recent species observations',
        requiresAuth: true,
        parameters: [
          { name: 'page', type: 'number', required: false, location: 'query', description: 'Page number (min 1)', example: '1' },
          { name: 'limit', type: 'number', required: false, location: 'query', description: 'Items per page (1-100)', example: '10' },
          { name: 'sortBy', type: 'string', required: false, location: 'query', description: 'Sort field (observedDate, createdAt, depth.value)', example: 'observedDate' },
          { name: 'order', type: 'string', required: false, location: 'query', description: 'Sort order (asc, desc)', example: 'desc' }
        ],
        responses: {
          200: {
            description: 'Observations retrieved',
            example: JSON.stringify({
              observations: [{
                id: '507f1f77bcf86cd799439011',
                species: { scientificName: 'Perna viridis', commonName: 'Asian green mussel' },
                location: { latitude: 18.52, longitude: 73.85 },
                depth: 5,
                observedDate: '2024-05-15T10:30:00Z',
                institution: 'MBAI'
              }],
              pagination: { currentPage: 1, totalPages: 10, totalObservations: 100, limit: 10 }
            }, null, 2)
          }
        },
        notes: ['Default: page 1, limit 10, sorted by observedDate desc']
      }
    ]
  },

  // Otolith Analysis APIs
  {
    id: 'otolith',
    name: 'Otolith Analysis',
    description: 'Fish age estimation from otolith images',
    icon: FiImage,
    endpoints: [
      {
        id: 'otolith-upload',
        method: 'POST',
        path: '/api/otolith/upload',
        name: 'Upload Otolith Image',
        description: 'Upload otolith image for analysis',
        requiresAuth: true,
        parameters: [],
        requestBody: {
          contentType: 'multipart/form-data',
          schema: {
            image: { type: 'file', required: true, description: 'Otolith image file (max 10MB)' },
            speciesName: { type: 'string', required: false, description: 'Species name' }
          },
          example: '(Form data with image file)'
        },
        responses: {
          201: {
            description: 'Image uploaded successfully',
            example: JSON.stringify({
              success: true,
              message: 'Image uploaded successfully',
              imageUrl: 'https://cloudinary.com/...',
              otolithId: '507f1f77bcf86cd799439011'
            }, null, 2)
          },
          400: {
            description: 'No file uploaded or invalid format',
            example: JSON.stringify({ message: 'No file uploaded.' }, null, 2)
          }
        },
        notes: ['Accepts: JPG, PNG, JPEG', 'Max size: 10MB', 'Uploads to Cloudinary']
      },
      {
        id: 'otolith-analyze',
        method: 'POST',
        path: '/api/otolith/analyze',
        name: 'Analyze Otolith',
        description: 'Analyze uploaded otolith image and estimate fish age',
        requiresAuth: true,
        parameters: [],
        requestBody: {
          contentType: 'application/json',
          schema: {
            otolithId: { type: 'string', required: true, description: 'Otolith record ID' },
            imageUrl: { type: 'string', required: true, description: 'Cloudinary image URL' }
          },
          example: JSON.stringify({
            otolithId: '507f1f77bcf86cd799439011',
            imageUrl: 'https://cloudinary.com/...'
          }, null, 2)
        },
        responses: {
          200: {
            description: 'Analysis completed',
            example: JSON.stringify({
              success: true,
              measurements: { ringCount: 7, radius: 12.5, imageSize: { width: 1024, height: 768 } },
              estimatedAge: 7,
              confidence: 0.85
            }, null, 2)
          }
        },
        notes: ['Uses image processing to count growth rings', 'Estimates fish age from ring count']
      },
      {
        id: 'otolith-measurements',
        method: 'GET',
        path: '/api/otolith/measurements',
        name: 'Get All Measurements',
        description: 'Retrieve all otolith measurements for authenticated user',
        requiresAuth: true,
        parameters: [],
        responses: {
          200: {
            description: 'Measurements retrieved',
            example: JSON.stringify({
              success: true,
              measurements: [{ _id: '...', imageUrl: '...', ringCount: 7, estimatedAge: 7, createdAt: '...' }],
              count: 15
            }, null, 2)
          }
        },
        notes: ['Returns only user\'s own measurements']
      },
      {
        id: 'otolith-measurement-detail',
        method: 'GET',
        path: '/api/otolith/measurements/:id',
        name: 'Get Measurement Details',
        description: 'Get detailed information for a specific otolith measurement',
        requiresAuth: true,
        parameters: [
          { name: 'id', type: 'string', required: true, location: 'path', description: 'Measurement ID', example: '507f1f77bcf86cd799439011' }
        ],
        responses: {
          200: {
            description: 'Measurement details retrieved',
            example: JSON.stringify({
              success: true,
              measurement: { _id: '...', imageUrl: '...', ringCount: 7, radius: 12.5, estimatedAge: 7, confidence: 0.85 }
            }, null, 2)
          },
          404: {
            description: 'Measurement not found',
            example: JSON.stringify({ message: 'Measurement not found' }, null, 2)
          }
        },
        notes: ['Users can only access their own measurements']
      },
      {
        id: 'otolith-delete',
        method: 'DELETE',
        path: '/api/otolith/measurements/:id',
        name: 'Delete Measurement',
        description: 'Delete an otolith measurement record',
        requiresAuth: true,
        parameters: [
          { name: 'id', type: 'string', required: true, location: 'path', description: 'Measurement ID', example: '507f1f77bcf86cd799439011' }
        ],
        responses: {
          200: {
            description: 'Measurement deleted',
            example: JSON.stringify({ success: true, message: 'Measurement deleted successfully' }, null, 2)
          },
          404: {
            description: 'Measurement not found',
            example: JSON.stringify({ message: 'Measurement not found' }, null, 2)
          }
        },
        notes: ['Also deletes image from Cloudinary']
      }
    ]
  },

  // Taxonomic Management APIs
  {
    id: 'taxonomy',
    name: 'Taxonomic Management',
    description: 'Species identification from images using AI',
    icon: GiDna1,
    endpoints: [
      {
        id: 'taxonomy-identify',
        method: 'POST',
        path: '/api/taxonomy/identify',
        name: 'Identify Species',
        description: 'Identify fish species from uploaded image using Fishial.AI',
        requiresAuth: true,
        parameters: [],
        requestBody: {
          contentType: 'multipart/form-data',
          schema: {
            image: { type: 'file', required: true, description: 'Fish image (max 10MB)' }
          },
          example: '(Form data with image file)'
        },
        responses: {
          200: {
            description: 'Species identified',
            example: JSON.stringify({
              success: true,
              data: {
                species: 'Perna viridis',
                confidence: 0.92,
                alternatives: [{ species: 'Perna indica', confidence: 0.75 }],
                imageUrl: 'https://cloudinary.com/...'
              }
            }, null, 2)
          },
          400: {
            description: 'No image uploaded',
            example: JSON.stringify({ message: 'No image file uploaded' }, null, 2)
          }
        },
        notes: ['Uses Fishial.AI API', '639+ fish species supported', 'Image uploaded to Cloudinary']
      },
      {
        id: 'taxonomy-history',
        method: 'GET',
        path: '/api/taxonomy/identification-history',
        name: 'Get Identification History',
        description: 'Retrieve user\'s species identification history',
        requiresAuth: true,
        parameters: [],
        responses: {
          200: {
            description: 'History retrieved',
            example: JSON.stringify({
              success: true,
              identifications: [{ _id: '...', species: 'Perna viridis', confidence: 0.92, imageUrl: '...', createdAt: '...' }],
              count: 23
            }, null, 2)
          }
        },
        notes: ['Returns only user\'s own identification history']
      }
    ]
  },

  // eDNA Processing APIs
  {
    id: 'edna',
    name: 'eDNA Processing',
    description: 'Environmental DNA sample analysis and species detection',
    icon: GiDna1,
    endpoints: [
      {
        id: 'edna-upload',
        method: 'POST',
        path: '/api/edna/upload',
        name: 'Upload eDNA Sample',
        description: 'Upload environmental DNA sequence file for analysis',
        requiresAuth: true,
        parameters: [],
        requestBody: {
          contentType: 'multipart/form-data',
          schema: {
            sequenceFile: { type: 'file', required: true, description: 'DNA sequence file (FASTA, max 10MB)' },
            location: { type: 'string', required: true, description: 'Sample location (lat,lon)' },
            sampleDate: { type: 'string', required: true, description: 'Sample collection date (YYYY-MM-DD)' }
          },
          example: '(Form data with sequence file and metadata)'
        },
        responses: {
          201: {
            description: 'Sample uploaded',
            example: JSON.stringify({
              success: true,
              message: 'eDNA sample uploaded successfully',
              sampleId: '507f1f77bcf86cd799439011'
            }, null, 2)
          }
        },
        notes: ['Accepts FASTA format', 'Max 10MB file size']
      },
      {
        id: 'edna-analyze',
        method: 'POST',
        path: '/api/edna/analyze/:sampleId',
        name: 'Analyze eDNA Sample',
        description: 'Analyze uploaded eDNA sample and detect species',
        requiresAuth: true,
        parameters: [
          { name: 'sampleId', type: 'string', required: true, location: 'path', description: 'Sample ID', example: '507f1f77bcf86cd799439011' }
        ],
        responses: {
          200: {
            description: 'Analysis completed',
            example: JSON.stringify({
              success: true,
              detectedSpecies: [{ scientificName: 'Perna viridis', confidence: 0.95, matchLength: 650 }],
              totalReads: 1520,
              qualityScore: 0.88
            }, null, 2)
          }
        },
        notes: ['Performs sequence alignment against reference database', 'Returns species with >80% confidence']
      },
      {
        id: 'edna-samples',
        method: 'GET',
        path: '/api/edna/samples',
        name: 'Get eDNA Samples',
        description: 'Retrieve all eDNA samples for authenticated user',
        requiresAuth: true,
        parameters: [],
        responses: {
          200: {
            description: 'Samples retrieved',
            example: JSON.stringify({
              success: true,
              samples: [{ _id: '...', location: '18.52,73.85', sampleDate: '2024-05-15', status: 'analyzed', detectedSpecies: 5 }],
              count: 12
            }, null, 2)
          }
        },
        notes: ['Returns user\'s own samples only']
      }
    ]
  },

  // Data Ingestion APIs
  {
    id: 'data',
    name: 'Data Ingestion',
    description: 'Bulk data upload for species, observations, and oceanographic data',
    icon: FiDatabase,
    endpoints: [
      {
        id: 'data-species-upload',
        method: 'POST',
        path: '/api/data/species/upload',
        name: 'Upload Species Data',
        description: 'Bulk upload species data via CSV/JSON file',
        requiresAuth: true,
        parameters: [],
        requestBody: {
          contentType: 'multipart/form-data',
          schema: {
            file: { type: 'file', required: true, description: 'CSV/JSON file (max 50MB)' }
          },
          example: '(Form data with CSV/JSON file containing species records)'
        },
        responses: {
          201: {
            description: 'All records inserted',
            example: JSON.stringify({
              success: true,
              inserted: 150,
              failed: 0,
              errors: [],
              warnings: []
            }, null, 2)
          },
          207: {
            description: 'Partial success',
            example: JSON.stringify({
              success: true,
              inserted: 120,
              failed: 30,
              errors: [{ row: 15, field: 'scientificName', message: 'Required field missing' }],
              warnings: []
            }, null, 2)
          },
          400: {
            description: 'All records failed',
            example: JSON.stringify({ success: false, inserted: 0, failed: 150, errors: [{ row: 1, message: 'Invalid data' }] }, null, 2)
          }
        },
        notes: ['Max 50MB file size', 'Supports CSV and JSON', 'Duplicate detection by scientificName']
      },
      {
        id: 'data-observations-upload',
        method: 'POST',
        path: '/api/data/observations/upload',
        name: 'Upload Observations Data',
        description: 'Bulk upload species observation data via CSV/JSON',
        requiresAuth: true,
        parameters: [],
        requestBody: {
          contentType: 'multipart/form-data',
          schema: {
            file: { type: 'file', required: true, description: 'CSV/JSON file (max 50MB)' }
          },
          example: '(Form data with observation records)'
        },
        responses: {
          201: {
            description: 'All records inserted',
            example: JSON.stringify({ success: true, inserted: 500, failed: 0, errors: [] }, null, 2)
          },
          207: {
            description: 'Partial success',
            example: JSON.stringify({ success: true, inserted: 450, failed: 50, errors: [{ row: 10, message: 'Invalid date' }] }, null, 2)
          }
        },
        notes: ['Pre-validation for scientificName, observedDate, location', 'Duplicate detection by observationId']
      },
      {
        id: 'data-oceanographic-upload',
        method: 'POST',
        path: '/api/data/oceanographic/upload',
        name: 'Upload Oceanographic Data',
        description: 'Bulk upload oceanographic measurement data',
        requiresAuth: true,
        parameters: [],
        requestBody: {
          contentType: 'multipart/form-data',
          schema: {
            file: { type: 'file', required: true, description: 'CSV/JSON file (max 50MB)' }
          },
          example: '(Form data with oceanographic records)'
        },
        responses: {
          201: {
            description: 'All records inserted',
            example: JSON.stringify({ success: true, inserted: 800, failed: 0, errors: [] }, null, 2)
          },
          207: {
            description: 'Partial success',
            example: JSON.stringify({ success: true, inserted: 750, failed: 50, errors: [{ row: 20, message: 'Invalid depth' }] }, null, 2)
          }
        },
        notes: ['Pre-validation for timestamp, location, depth', 'No future timestamps allowed']
      }
    ]
  },

  // AI Analytics APIs
  {
    id: 'analytics',
    name: 'AI Analytics',
    description: 'Machine learning insights and natural language queries',
    icon: FiCpu,
    endpoints: [
      {
        id: 'analytics-correlations',
        method: 'GET',
        path: '/api/analytics/correlations',
        name: 'Get Correlations',
        description: 'Analyze correlations between ocean parameters and species distribution',
        requiresAuth: true,
        parameters: [
          { name: 'startDate', type: 'string', required: false, location: 'query', description: 'Start date (ISO 8601)', example: '2024-01-01' },
          { name: 'endDate', type: 'string', required: false, location: 'query', description: 'End date (ISO 8601)', example: '2024-12-31' },
          { name: 'latitude', type: 'number', required: false, location: 'query', description: 'Center latitude', example: '55.0' },
          { name: 'longitude', type: 'number', required: false, location: 'query', description: 'Center longitude', example: '4.0' },
          { name: 'radiusKm', type: 'number', required: false, location: 'query', description: 'Search radius (km)', example: '500' }
        ],
        responses: {
          200: {
            description: 'Correlation analysis complete',
            example: JSON.stringify({
              correlations: { 'Temperature vs Abundance': 0.72, 'Salinity vs Diversity': -0.45 },
              scatterData: [{ x: 18.5, y: 45, timestamp: '...' }],
              insights: [{ parameter: 'Temperature', metric: 'Abundance', correlation: 0.72, significance: 'high' }],
              dataPoints: 150,
              synthetic: false
            }, null, 2)
          }
        },
        notes: ['Uses Pearson correlation', 'Synthetic fallback if <10 data points', 'Default: last 90 days']
      },
      {
        id: 'analytics-predictions',
        method: 'GET',
        path: '/api/analytics/predictions',
        name: 'Get Predictions',
        description: 'Generate time-series predictions for biodiversity metrics',
        requiresAuth: true,
        parameters: [
          { name: 'metric', type: 'string', required: true, location: 'query', description: 'Metric to predict (abundance, diversity, temperature, salinity)', example: 'abundance' },
          { name: 'forecastDays', type: 'number', required: false, location: 'query', description: 'Days to forecast (7-60)', example: '30' }
        ],
        responses: {
          200: {
            description: 'Predictions generated',
            example: JSON.stringify({
              historical: [{ timestamp: '...', value: 45 }],
              forecast: [{ timestamp: '...', predicted: 48, lower: 43, upper: 53 }],
              trend: { direction: 'increasing', percentage: 5.2, slope: 0.05 },
              anomalies: [],
              synthetic: false
            }, null, 2)
          }
        },
        notes: ['Uses moving averages and linear regression', 'Anomaly detection (>2 std dev)', 'Based on last 90 days']
      },
      {
        id: 'analytics-query',
        method: 'POST',
        path: '/api/analytics/query',
        name: 'Natural Language Query',
        description: 'Ask questions about marine data using AI (requires OpenAI/Anthropic API key)',
        requiresAuth: true,
        parameters: [],
        requestBody: {
          contentType: 'application/json',
          schema: {
            question: { type: 'string', required: true, description: 'Natural language question' },
            filters: { type: 'object', required: false, description: 'Date/region filters' }
          },
          example: JSON.stringify({
            question: 'What is the correlation between temperature and species diversity?',
            filters: { startDate: '2024-01-01', endDate: '2024-12-31' }
          }, null, 2)
        },
        responses: {
          200: {
            description: 'Query processed',
            example: JSON.stringify({
              answer: 'Based on the observations...',
              sources: [{ id: '...', species: 'Perna viridis', date: '...' }],
              confidence: 0.85,
              dataPoints: 50
            }, null, 2)
          },
          503: {
            description: 'API key not configured',
            example: JSON.stringify({
              error: 'AI query unavailable',
              message: 'AI query requires API key configuration'
            }, null, 2)
          }
        },
        notes: ['Requires OPENAI_API_KEY or ANTHROPIC_API_KEY in server .env', 'Uses RAG pattern with MongoDB', 'Queries top 50 relevant observations']
      }
    ]
  },

  // System Health
  {
    id: 'health',
    name: 'System Health',
    description: 'API health checks and provider status',
    icon: FiActivity,
    endpoints: [
      {
        id: 'health-providers',
        method: 'GET',
        path: '/api/health/providers',
        name: 'Get Provider Status',
        description: 'Check status of external API providers (OBIS, WoRMS, iNaturalist, Fishial.AI)',
        requiresAuth: false,
        parameters: [],
        responses: {
          200: {
            description: 'Provider status retrieved',
            example: JSON.stringify({
              providers: [
                { name: 'OBIS', status: 'healthy', endpoint: 'https://api.obis.org' },
                { name: 'WoRMS', status: 'healthy', endpoint: 'https://www.marinespecies.org/rest' },
                { name: 'iNaturalist', status: 'healthy', endpoint: 'https://api.inaturalist.org' },
                { name: 'Fishial.AI', status: 'configured', configured: true }
              ],
              timestamp: '2025-10-06T12:00:00Z'
            }, null, 2)
          }
        },
        notes: ['No authentication required', 'Useful for debugging integration issues']
      }
    ]
  }
];
