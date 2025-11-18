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

#### Species Identification (Optional - For Future AI Integration)
```env
# Not required for MVP - static database is used
# Uncomment and configure when enabling AI-powered identification
# FISHIAL_CLIENT_ID=your_fishial_client_id
# FISHIAL_CLIENT_SECRET=your_fishial_client_secret
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

### Species Identification API (Backend - Currently Not Used)

The backend has API endpoints for image-based identification that will be used when AI features are enabled:

#### POST `/api/taxonomy/identify`
Upload an image for species identification (Future AI Integration).

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `image` (file)
- Authentication: Required (JWT token)

**Response:**
```json
{
  "success": true,
  "message": "Species identification completed successfully",
  "data": {
    "uploadedImageUrl": "https://res.cloudinary.com/...",
    "identificationResults": [
      {
        "scientificName": "Thunnus albacares",
        "commonName": "Yellowfin Tuna",
        "speciesData": {
          "scientificName": "Thunnus albacares",
          "commonNames": ["Yellowfin Tuna", "Ahi"],
          "taxonomicHierarchy": { ... },
          "morphology": { ... },
          "ecology": { ... },
          "habitat": "Pelagic-oceanic",
          "distribution": "Worldwide in tropical and subtropical seas"
        }
      }
    ]
  }
}
```

#### GET `/api/taxonomy/history`
Retrieve identification history for authenticated user (Future feature).

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
