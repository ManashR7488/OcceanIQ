import mongoose from "mongoose";
import { latLonToGeohash } from "../utils/geohash.js";

const observationSchema = new mongoose.Schema(
  {
    // Core Fields
    observationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    speciesRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Species",
      required: true,
      index: true,
    },
    scientificName: {
      type: String,
      required: true,
      index: true,
    },
    commonName: {
      type: String,
    },

    // Geospatial Data
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        validate: {
          validator: function (coords) {
            if (!Array.isArray(coords) || coords.length !== 2) return false;
            const [lon, lat] = coords;
            return lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90;
          },
          message: "Coordinates must be [longitude, latitude] with longitude in [-180, 180] and latitude in [-90, 90]",
        },
      },
    },
    geohash: {
      type: String,
      index: true,
    },
    locationPrecision: {
      type: Number, // GPS accuracy in meters
    },
    locality: {
      type: String,
    },
    country: {
      type: String,
      index: true,
    },
    marineRegion: {
      type: String,
    },

    // Depth Information
    depth: {
      type: {
        value: {
          type: Number,
          min: 0,
          max: 11000,
        },
        min: {
          type: Number,
          min: 0,
          max: 11000,
        },
        max: {
          type: Number,
          min: 0,
          max: 11000,
        },
        unit: {
          type: String,
          default: "meters",
        },
      },
      validate: {
        validator: function(depthObj) {
          // If depth is not provided or empty, it's valid
          if (!depthObj || Object.keys(depthObj).length === 0) return true;
          
          const hasValue = depthObj.value !== undefined && depthObj.value !== null;
          const hasMin = depthObj.min !== undefined && depthObj.min !== null;
          const hasMax = depthObj.max !== undefined && depthObj.max !== null;
          const hasRange = hasMin && hasMax;
          
          // Must have either value OR both min and max
          if (!hasValue && !hasRange) {
            return false;
          }
          
          // If range is provided, min must be <= max
          if (hasRange && depthObj.min > depthObj.max) {
            return false;
          }
          
          return true;
        },
        message: 'Depth must have either "value" or both "min" and "max" fields, and min must be <= max'
      }
    },

    // Temporal Data
    observedDate: {
      type: Date,
      required: true,
      index: true,
    },
    observedYear: {
      type: Number,
      index: true,
    },
    observedMonth: {
      type: Number,
      index: true,
      min: 1,
      max: 12,
    },
    dateAccuracy: {
      type: String,
      enum: ["exact", "day", "month", "year"],
    },

    // Data Source & Provenance
    dataSource: {
      type: String,
      required: true,
      index: true,
      enum: [
        "OBIS",
        "GBIF",
        "manual",
        "citizen_science",
        "research_survey",
        "other",
      ],
    },
    datasetId: {
      type: String,
      index: true,
    },
    datasetName: {
      type: String,
    },
    institutionCode: {
      type: String,
      index: true,
    },
    collectionCode: {
      type: String,
    },
    catalogNumber: {
      type: String,
    },
    basisOfRecord: {
      type: String,
      enum: [
        "HumanObservation",
        "PreservedSpecimen",
        "LivingSpecimen",
        "MachineObservation",
        "MaterialSample",
      ],
    },

    // Observer/Collector Information
    recordedBy: {
      type: String,
    },
    identifiedBy: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    // Quality Assurance
    verificationStatus: {
      type: String,
      required: true,
      index: true,
      enum: ["unverified", "verified", "expert_verified", "flagged", "rejected"],
      default: "unverified",
    },
    confidenceLevel: {
      type: Number,
      min: 0,
      max: 100,
    },
    identificationRemarks: {
      type: String,
      maxlength: 500,
    },
    occurrenceRemarks: {
      type: String,
      maxlength: 1000,
    },

    // Abundance & Sampling
    individualCount: {
      type: Number,
      min: 0,
    },
    samplingProtocol: {
      type: String,
    },
    samplingEffort: {
      type: String,
    },

    // Environmental Context
    environmentalContext: {
      temperature: {
        type: Number, // °C
      },
      salinity: {
        type: Number, // PSU
      },
      habitat: {
        type: String,
      },
    },

    // Metadata
    externalLinks: {
      obisUrl: {
        type: String,
      },
      gbifUrl: {
        type: String,
      },
      originalSource: {
        type: String,
      },
    },
    license: {
      type: String,
    },
    rightsHolder: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
observationSchema.index({ location: "2dsphere" });
observationSchema.index({ speciesRef: 1, observedDate: -1 });
observationSchema.index({ dataSource: 1, createdAt: -1 });
observationSchema.index({ verificationStatus: 1, observedDate: -1 });
observationSchema.index({ country: 1, observedYear: 1 });

// Virtual Fields
observationSchema.virtual("coordinates").get(function () {
  if (this.location && this.location.coordinates) {
    return {
      lon: this.location.coordinates[0],
      lat: this.location.coordinates[1],
    };
  }
  return null;
});

observationSchema.virtual("coordinates").set(function (coords) {
  if (coords && coords.lat !== undefined && coords.lon !== undefined) {
    this.location = {
      type: "Point",
      coordinates: [coords.lon, coords.lat],
    };
  }
});

observationSchema.virtual("depthValue").get(function () {
  if (this.depth && this.depth.value !== undefined) {
    return this.depth.value;
  }
  if (this.depth && this.depth.min !== undefined && this.depth.max !== undefined) {
    return (this.depth.min + this.depth.max) / 2;
  }
  return null;
});

// Instance Methods
observationSchema.methods.isVerified = function () {
  return (
    this.verificationStatus === "verified" ||
    this.verificationStatus === "expert_verified"
  );
};

observationSchema.methods.getCoordinates = function () {
  if (this.location && this.location.coordinates) {
    return {
      lon: this.location.coordinates[0],
      lat: this.location.coordinates[1],
    };
  }
  return null;
};

observationSchema.methods.hasDepthData = function () {
  return this.depth && (
    this.depth.value !== undefined ||
    (this.depth.min !== undefined && this.depth.max !== undefined)
  );
};

observationSchema.methods.getObservationAge = function () {
  if (!this.observedDate) return null;
  const now = new Date();
  const diffTime = Math.abs(now - this.observedDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Pre-validate Middleware (runs before validation, allows auto-generation of required fields)
observationSchema.pre("validate", function (next) {
  // Auto-generate observationId if not provided
  if (!this.observationId) {
    this.observationId = `OBS-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 11)}`;
  }

  next();
});

// Pre-save Middleware
observationSchema.pre("save", function (next) {
  // Extract year and month from observedDate
  if (this.observedDate) {
    this.observedYear = this.observedDate.getFullYear();
    this.observedMonth = this.observedDate.getMonth() + 1; // 1-12
  }

  // Generate geohash from location coordinates
  if (
    this.location &&
    this.location.coordinates &&
    this.location.coordinates.length === 2
  ) {
    const [lon, lat] = this.location.coordinates;
    this.geohash = latLonToGeohash(lat, lon, 6);
  }

  // Ensure location type is always "Point"
  if (this.location) {
    this.location.type = "Point";
  }

  next();
});

const Observation = mongoose.model("Observation", observationSchema);

export default Observation;
