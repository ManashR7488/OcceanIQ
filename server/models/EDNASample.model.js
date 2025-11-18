import mongoose from 'mongoose';

const EDNASampleSchema = new mongoose.Schema(
  {
    sampleId: {
      type: String,
      required: [true, 'Sample ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    sampleMetadata: {
      collectionDate: {
        type: Date,
        required: [true, 'Collection date is required'],
      },
      location: {
        name: {
          type: String,
          required: [true, 'Location name is required'],
          trim: true,
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          index: '2dsphere',
        },
      },
      waterDepth: {
        type: Number,
        min: [0, 'Water depth cannot be negative'],
        max: [11000, 'Water depth cannot exceed 11000 meters'],
      },
      waterTemperature: {
        type: Number,
        min: [-2, 'Water temperature cannot be below -2°C'],
        max: [40, 'Water temperature cannot exceed 40°C'],
      },
      sampleVolume: {
        type: Number,
        min: [0, 'Sample volume cannot be negative'],
      },
      filterSize: {
        type: String,
        trim: true,
      },
      collector: {
        type: String,
        trim: true,
      },
      notes: {
        type: String,
        maxlength: [1000, 'Notes cannot exceed 1000 characters'],
        trim: true,
      },
    },
    pcrWorkflow: {
      primerForward: {
        type: String,
        trim: true,
      },
      primerReverse: {
        type: String,
        trim: true,
      },
      targetGene: {
        type: String,
        trim: true,
      },
      sequencingPlatform: {
        type: String,
        trim: true,
      },
      sequencingDate: {
        type: Date,
      },
    },
    analysisStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    sequenceCount: {
      type: Number,
      default: 0,
      min: [0, 'Sequence count cannot be negative'],
    },
    speciesDetected: [
      {
        scientificName: {
          type: String,
          trim: true,
        },
        confidence: {
          type: Number,
          min: [0, 'Confidence cannot be less than 0'],
          max: [100, 'Confidence cannot exceed 100'],
        },
        readCount: {
          type: Number,
          min: [0, 'Read count cannot be negative'],
        },
        inaturalistData: {
          taxonId: { type: Number },
          rank: { type: String },
          taxonomy: {
            kingdom: String,
            phylum: String,
            class: String,
            order: String,
            family: String,
            genus: String,
            species: String,
          },
          commonNames: [
            {
              name: String,
              locale: String,
            },
          ],
          conservationStatus: {
            status: String,
            authority: String,
            iucnStatus: String,
          },
          wikipediaUrl: String,
          wikipediaSummary: String,
          photos: [
            {
              url: String,
              attribution: String,
              license: String,
            },
          ],
          fetchedAt: { type: Date, default: Date.now },
        },
      },
    ],
    biodiversityMetrics: {
      totalSpecies: {
        type: Number,
        min: [0, 'Total species cannot be negative'],
      },
      shannonIndex: {
        type: Number,
      },
      simpsonIndex: {
        type: Number,
      },
    },
    analysisResults: {
      processedAt: {
        type: Date,
      },
      processingTime: {
        type: Number,
        min: [0, 'Processing time cannot be negative'],
      },
      errorMessage: {
        type: String,
        trim: true,
      },
      matchesBySequence: [
        {
          sequenceIndex: Number,
          sequenceId: String,
          sequenceLength: Number,
          topHit: String,
          matches: [
            {
              scientificName: String,
              commonName: String,
              similarity: Number,
              confidence: Number,
            },
          ],
        },
      ],
      enrichmentStats: {
        totalSpecies: { type: Number, default: 0 },
        enrichedSpecies: { type: Number, default: 0 },
        failedEnrichments: { type: Number, default: 0 },
        enrichedAt: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
// Existing indexes
// EDNASampleSchema.index({ userId: 1, createdAt: -1 });
// EDNASampleSchema.index({ 'sampleMetadata.collectionDate': 1 });

// Compound indexes for query optimization

// Analysis Status + Collection Date Index
// Optimizes queries for samples by status, sorted by collection date
// Common pattern: filtering pending/completed samples chronologically
EDNASampleSchema.index({ analysisStatus: 1, 'sampleMetadata.collectionDate': -1 });

// Location Geospatial Index
// Enables geospatial queries for samples near a location
// Supports radius-based searches and map visualizations
EDNASampleSchema.index({ 'sampleMetadata.location.coordinates': '2dsphere' });

// Species Detected Index
// Optimizes queries for samples containing specific species
// Enables efficient species-based filtering and biodiversity analysis
EDNASampleSchema.index({ 'speciesDetected.scientificName': 1 });

// Biodiversity Metrics Index
// Optimizes queries for samples sorted by species richness
// Useful for identifying high-biodiversity samples
EDNASampleSchema.index({ 'biodiversityMetrics.totalSpecies': -1 });

// Instance method: Check if sample has been analyzed
EDNASampleSchema.methods.isAnalyzed = function () {
  return this.analysisStatus === 'completed' && this.speciesDetected.length > 0;
};

// Instance method: Check if sample can be analyzed
EDNASampleSchema.methods.canAnalyze = function () {
  return (
    (this.analysisStatus === 'pending' || this.analysisStatus === 'failed') &&
    this.sequenceCount > 0
  );
};

// Virtual field: Get dominant species (highest read count)
EDNASampleSchema.virtual('dominantSpecies').get(function () {
  if (!this.speciesDetected || this.speciesDetected.length === 0) {
    return null;
  }

  return this.speciesDetected.reduce((max, species) => {
    return species.readCount > (max.readCount || 0) ? species : max;
  }, this.speciesDetected[0]);
});

// Ensure virtuals are included in JSON output
EDNASampleSchema.set('toJSON', { virtuals: true });
EDNASampleSchema.set('toObject', { virtuals: true });

const EDNASample = mongoose.model('EDNASample', EDNASampleSchema);

export default EDNASample;
