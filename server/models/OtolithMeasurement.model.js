import mongoose from "mongoose";

const otolithMeasurementSchema = new mongoose.Schema(
  {
    // Unique sample identifier
    sampleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // User who uploaded the sample
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Cloudinary image URLs
    imageUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
    },

    // Sample metadata (collected during upload - Step 1)
    sampleMetadata: {
      collectionDate: {
        type: Date,
        required: true,
      },
      location: {
        type: String,
        required: true,
      },
      depth: {
        type: Number,
        min: 0,
      },
      collector: {
        type: String,
      },
      notes: {
        type: String,
        maxlength: 1000,
      },
    },

    // Morphometric measurements (null until analyzed - Step 2)
    morphometrics: {
      type: {
        length: {
          type: Number,
          min: 0,
        },
        width: {
          type: Number,
          min: 0,
        },
        area: {
          type: Number,
          min: 0,
        },
        perimeter: {
          type: Number,
          min: 0,
        },
        circularity: {
          type: Number,
          min: 0,
          max: 1,
        },
        aspectRatio: {
          type: Number,
          min: 0,
        },
        shapeDescriptors: {
          compactness: Number,
          elongation: Number,
        },
      },
      default: null,
    },

    // Analysis status for two-step process
    analysisStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },

    // Species identification results (null until analyzed - Step 2)
    speciesIdentified: {
      type: String,
      default: null,
      index: true,
    },
    speciesConfidence: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    alternativeSpecies: {
      type: [
        {
          name: String,
          confidence: {
            type: Number,
            min: 0,
            max: 100,
          },
        },
      ],
      default: [],
    },

    // Analysis metadata
    analysisResults: {
      processedAt: Date,
      processingTime: Number, // in milliseconds
      errorMessage: String,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Index for sorting by creation date (descending)
otolithMeasurementSchema.index({ createdAt: -1 });

// Virtual field for image transformations
otolithMeasurementSchema.virtual("imageTransformations").get(function () {
  if (!this.cloudinaryPublicId) return null;

  const baseUrl = this.imageUrl.split("/upload/")[0] + "/upload/";
  const imagePath = this.cloudinaryPublicId;

  return {
    thumbnail: `${baseUrl}w_200,h_200,c_fill,q_auto,f_auto/${imagePath}`,
    medium: `${baseUrl}w_800,h_800,c_limit,q_auto,f_auto/${imagePath}`,
    large: `${baseUrl}w_1600,h_1600,c_limit,q_auto,f_auto/${imagePath}`,
    original: this.imageUrl,
  };
});

// Instance method: Check if sample has been analyzed
otolithMeasurementSchema.methods.isAnalyzed = function () {
  return this.analysisStatus === "completed" && this.morphometrics !== null;
};

// Instance method: Check if sample can be analyzed
otolithMeasurementSchema.methods.canAnalyze = function () {
  return ["pending", "failed"].includes(this.analysisStatus);
};

// Ensure virtuals are included in JSON
otolithMeasurementSchema.set("toJSON", { virtuals: true });
otolithMeasurementSchema.set("toObject", { virtuals: true });

// Compound indexes for query optimization

// User + Analysis Status Index
// Optimizes queries for user's samples filtered by status (pending, completed, failed)
// Common query pattern: User gallery view, stats view
otolithMeasurementSchema.index({ userId: 1, analysisStatus: 1 });

// Species + Confidence Index
// Optimizes queries for finding samples by species, sorted by confidence
// Useful for species-specific analysis and validation
otolithMeasurementSchema.index({ speciesIdentified: 1, speciesConfidence: -1 });

// Collection Date Index
// Optimizes temporal queries and time-series analysis
// Enables efficient date range filtering
otolithMeasurementSchema.index({ 'sampleMetadata.collectionDate': -1 });

const OtolithMeasurement = mongoose.model(
  "OtolithMeasurement",
  otolithMeasurementSchema
);

export default OtolithMeasurement;
