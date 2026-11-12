# OceanIQ - Marine Ecosystem Management Platform

An intelligent platform for marine biodiversity monitoring, species identification, and ecosystem management powered by AI and comprehensive marine databases.

## 🌊 Features

### 🐟 **Species Database & Search**
- **Curated Species Database**: Browse and search 20+ common marine fish species with comprehensive data
- **Complete Taxonomic Information**: Full classification hierarchy (kingdom to species)
- **Morphological Data**: Physical characteristics, maximum length, weight, and distinctive features
- **Ecological Information**: Diet, depth range, habitat, and distribution data
- **Conservation Status**: IUCN status and economic importance
- **PDF Export**: Generate professional reports with species data and images
- **Instant Results**: No API calls required - works completely offline

> **Note:** This is an MVP implementation using a curated static database for demonstration purposes. The architecture supports future integration with AI-powered identification services.

### 📊 **Additional Modules**
- **Biodiversity Monitoring**: Track and analyze marine species diversity
- **Otolith Analysis**: Fish age determination through otolith examination
- **Interactive Maps**: Visualize marine ecosystem data
- **Dashboard**: Key metrics and insights at a glance

---

## 🔗 n8n Taxonomy Webhook Integration

The Taxonomic Management module uses an external n8n webhook for dynamic species identification. This allows the platform to leverage custom AI workflows, external APIs, and data enrichment pipelines.

### How It Works

1. User enters a species name or uploads an image in the Taxonomic Management module
2. Backend uploads image to Cloudinary (if provided) and gets URL
3. Backend sends species name or image URL to configured n8n webhook
4. n8n workflow processes the input (AI identification, API calls, data enrichment)
5. n8n returns comprehensive taxonomy data (see format below)
6. Backend saves species data to MongoDB with user reference
7. Frontend displays enriched species information

### Setup Instructions

1. **Create n8n Workflow:**
   - Set up an n8n instance (cloud or self-hosted)
   - Create a new workflow with a Webhook trigger node
   - Implement your taxonomy identification logic (e.g., call iNaturalist API, use AI models, query databases)
   - Add a Respond to Webhook node to return data

2. **Configure Webhook URL:**
   - Copy the webhook URL from your n8n workflow
   - Add to `.env` file: `N8N_TAXONOMY_WEBHOOK_URL=https://your-n8n-instance.com/webhook/taxonomy-identify`

3. **Webhook Input Format:**
   ```json
   {
     "input": "Gadus morhua" // or "https://res.cloudinary.com/.../fish.jpg"
   }
   ```

4. **Required Webhook Output Format:**
   ```json
   {
     "scientificName": "Gadus morhua",
     "commonNames": ["Atlantic Cod", "Cod"],
     "taxonomicHierarchy": {
       "kingdom": "Animalia",
       "phylum": "Chordata",
       "class": "Actinopterygii",
       "order": "Gadiformes",
       "family": "Gadidae",
       "genus": "Gadus",
       "species": "Gadus morhua"
     },
     "description": "The Atlantic cod is a benthopelagic fish...",
     "habitat": "Cold waters of the North Atlantic...",
     "distribution": "North Atlantic Ocean...",
     "morphology": {
       "maxLength": 200,
       "maxWeight": 96,
       "distinctiveFeatures": ["Single barbel on chin", ...]
     },
     "ecology": {
       "diet": "Carnivorous, feeding on smaller fish...",
       "behavior": "Benthopelagic, forming large schools...",
       "depthRange": { "min": 0, "max": 600 }
     },
     "conservationStatus": "Vulnerable",
     "economicImportance": "Highly important commercial species...",
     "imageUrl": "https://images.unsplash.com/...",
     "thumbnailUrl": "https://images.unsplash.com/...",
     "externalLinks": {
       "wikipedia": "https://en.wikipedia.org/wiki/Atlantic_cod",
       "fishbase": "https://www.fishbase.se/summary/69"
     }
   }
   ```

### Troubleshooting

- **Timeout Errors:** Increase `N8N_TAXONOMY_TIMEOUT` in `.env` (default: 60 seconds)
- **Invalid Response:** Ensure n8n webhook returns data in the exact format above
- **Webhook Unreachable:** Check n8n instance is running and URL is correct
- **Missing Fields:** All fields except `imageUrl`, `thumbnailUrl`, and `externalLinks` are required
- **Authentication Errors:** User must be logged in to use species identification

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd oceaniq
```

2. **Install server dependencies**
```bash
cd server
npm install
```

3. **Install client dependencies**
```bash
cd ../client
npm install
```

4. **Set up environment variables**

Copy the example file and fill in your credentials:
```bash
cd server
cp .env.example .env
```

Edit `.env` with your actual credentials (see Configuration section below).

5. **Start the development servers**

Terminal 1 (Server):
```bash
cd server
npm run dev
```

Terminal 2 (Client):
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

---

## ⚙️ Configuration

### Required Environment Variables

#### Database
```env
MONGODB_URI=mongodb://localhost:27017/occeaniq
# Or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/occeaniq
```

#### Authentication
```env
JWT_SECRET=your_secure_jwt_secret_key
JWT_EXPIRE=7d
```

#### Image Storage (Cloudinary)
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Get Cloudinary credentials:**
1. Sign up at https://cloudinary.com/
2. Go to Dashboard → API Keys
3. Copy Cloud Name, API Key, and API Secret

#### Species Identification (n8n Taxonomy Webhook - Required)
```env
# Required for Taxonomic Management module
# See "n8n Taxonomy Webhook Integration" section above for setup details
N8N_TAXONOMY_WEBHOOK_URL=https://your-n8n-instance.com/webhook/taxonomy-identify
N8N_TAXONOMY_TIMEOUT=60000
```

**Note:** The current MVP uses a static species database. API keys for Fishial.AI are optional and will be used when AI-powered identification features are enabled in the future.

---

## 🔧 Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Cloudinary** for image storage
- **Sharp** for image processing
- **Axios** for HTTP requests

### AI & Data Services (MVP)
- **Static Species Database** - Curated collection of 20+ marine fish species with complete taxonomic, morphological, and ecological data

### AI & Data Services (Future Integration)
- **Fishial.AI** - AI-powered fish species identification (639+ species coverage)
- **FishBase API** - Real-time species data and ecology information
- **WoRMS API** - Live taxonomic classification validation
- **OBIS** - Biodiversity occurrence data integration

### Frontend
- **React** with Vite
- **Tailwind CSS** for styling
- **jsPDF** for PDF generation
- **React-Toastify** for notifications

---

## 📖 API Documentation

### Species Database (MVP)

The current implementation uses a static species database located at `client/src/data/speciesDatabase.js`. The following helper functions are available:

- `searchSpecies(query)` - Search species by name (scientific/common)
- `getSpeciesByFamily(family)` - Filter species by taxonomic family
- `getPopularSpecies()` - Get featured species
- `getAllFamilies()` - Get list of all families
- `getSpeciesByScientificName(name)` - Get species by exact scientific name
- `getAllSpeciesNames()` - Get all species names for autocomplete

### Species Identification API (Backend - Active, Powered by n8n)

The backend provides dual-input species identification powered by the n8n taxonomy webhook:

#### POST `/api/taxonomy/identify`
Identify species by name (text) or image. This endpoint is **actively used** and integrates with the n8n taxonomy webhook for real-time species identification.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data` (for image) or `application/json` (for name)
- Authentication: Required (JWT token)

**Body Parameters (choose one):**
- `speciesName` (string): Species name (scientific or common) for text-based identification
- `speciesImage` (file): Image file for image-based identification

**Response:**
```json
{
  "success": true,
  "message": "Species identified successfully",
  "data": {
    "species": {
      "_id": "507f1f77bcf86cd799439011",
      "scientificName": "Thunnus albacares",
      "commonNames": ["Yellowfin Tuna", "Ahi"],
      "taxonomicHierarchy": {
        "kingdom": "Animalia",
        "phylum": "Chordata",
        "class": "Actinopterygii",
        "order": "Perciformes",
        "family": "Scombridae",
        "genus": "Thunnus"
      },
      "morphology": {
        "maxLength": "239 cm",
        "commonLength": "150 cm",
        "maxWeight": "200 kg",
        "bodyShape": "Fusiform"
      },
      "ecology": {
        "trophicLevel": 4.5,
        "feedingHabits": "Carnivorous",
        "reproductionMode": "Oviparous"
      },
      "habitat": "Pelagic-oceanic",
      "distribution": "Worldwide in tropical and subtropical seas",
      "conservationStatus": "NT",
      "images": ["https://res.cloudinary.com/..."],
      "uploadedImageUrl": "https://res.cloudinary.com/...",
      "thumbnailUrl": "https://res.cloudinary.com/...",
      "identificationSource": "n8n_webhook",
      "identificationMetadata": {
        "timestamp": "2025-01-15T12:34:56.789Z",
        "identifiedBy": "507f191e810c19729de860ea"
      },
      "createdBy": "507f191e810c19729de860ea",
      "createdAt": "2025-01-15T12:34:56.789Z",
      "updatedAt": "2025-01-15T12:34:56.789Z"
    },
    "isNew": false,
    "source": "n8n_webhook"
  }
}
```

**Notes:**
- The `isNew` field indicates whether this species was newly created (true) or already existed in the database (false)
- The `source` field shows the identification method used (currently "n8n_webhook")
- For image-based identification, `uploadedImageUrl` and `thumbnailUrl` are included
- The `createdBy` field preserves the original user who first identified the species

#### GET `/api/taxonomy/identify/history`
Retrieve identification history for the authenticated user with pagination support.

**Request:**
- Method: `GET`
- Authentication: Required (JWT token)

**Query Parameters:**
- `page` (number, optional): Page number for pagination (default: 1)
- `limit` (number, optional): Number of results per page (default: 10, max: 50)

**Response:**
```json
{
  "success": true,
  "message": "Identification history retrieved successfully",
  "data": {
    "species": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "scientificName": "Thunnus albacares",
        "commonNames": ["Yellowfin Tuna", "Ahi"],
        "images": ["https://res.cloudinary.com/..."],
        "identificationSource": "n8n_webhook",
        "createdAt": "2025-01-15T12:34:56.789Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 47,
      "itemsPerPage": 10
    }
  }
}
```

#### POST `/api/taxonomy/export-pdf`
Generate PDF report for species data (currently uses static database).

---

## 🐛 Troubleshooting

### Image Upload Fails

**Cause:** Cloudinary not configured

**Solution:**
1. Verify Cloudinary credentials in `.env`
2. Check internet connection
3. Ensure Cloudinary account is active
4. Test credentials at https://cloudinary.com/console

### Database Connection Issues

**Cause:** MongoDB not running or incorrect connection string

**Solution:**
1. Ensure MongoDB is running locally or MongoDB Atlas is accessible
2. Verify `MONGODB_URI` in `.env` file
3. Check network connectivity
4. Verify database credentials for Atlas connections

---

## 🤝 API Credits & Acknowledgments

- **FishBase** (FishBase.org) - Source for species data and ecology information
- **WoRMS** - World Register of Marine Species (taxonomic reference)
- **OBIS** - Ocean Biodiversity Information System
- **Cloudinary** - Image storage and optimization

### Future Integrations
- **Fishial.AI** - AI-powered fish species identification (planned)
- **FishBase API** - Real-time species data integration (planned)
- **WoRMS API** - Live taxonomic validation (planned)

---

## 📜 License

This project is licensed under the ISC License.

---

## 📧 Support

For issues, questions, or contributions:
- Create an issue on GitHub
- Contact: [Your contact information]

---

## 🔐 Security Note

**IMPORTANT:** Never commit the `.env` file to version control. It contains sensitive credentials that should remain private. Always use `.env.example` as a template and add actual credentials locally only.

---

## 🎯 Roadmap

### Current MVP Features
- ✅ Static species database with 20+ marine fish species
- ✅ Text-based search and filtering
- ✅ Complete taxonomic and ecological data
- ✅ PDF export functionality
- ✅ Family-based browsing

### Future Enhancements
- [ ] **AI-Powered Image Recognition**
  - Integration with Fishial.AI for automatic species identification from photos
  - Confidence scoring and multiple candidate results
  - Support for 639+ fish species
- [ ] **Real-Time API Integration**
  - Live FishBase API integration for up-to-date species data
  - WoRMS API for taxonomic validation
  - OBIS integration for biodiversity occurrence data
- [ ] **Enhanced Features**
  - Identification history tracking
  - User-contributed species observations
  - Offline identification mode with cached data
  - Mobile app development
  - Advanced filtering and search capabilities
  - Community contribution features
- [ ] **Extended Coverage**
  - Support for additional marine species (not just fish)
  - Integration with more marine databases
  - Regional species guides

---

**Made with 🌊 for marine conservation and research**
