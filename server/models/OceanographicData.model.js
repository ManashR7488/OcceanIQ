import mongoose from "mongoose";
import { latLonToGeohash } from "../utils/geohash.js";

const oceanographicDataSchema = new mongoose.Schema(
  {
    // Core Fields
    measurementId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
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

    // Temporal Information
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    year: {
      type: Number,
      index: true,
    },
    month: {
      type: Number,
      index: true,
      min: 1,
      max: 12,
    },
    day: {
      type: Number,
      min: 1,
      max: 31,
    },
    hour: {
      type: Number,
      min: 0,
      max: 23,
    },
    temporalGranularity: {
      type: String,
      required: true,
      index: true,
      enum: ["hourly", "daily", "weekly", "monthly", "seasonal", "annual"],
    },

    // Depth Information
    depth: {
      value: {
        type: Number,
        required: true,
        min: 0,
        max: 11000,
      },
      layer: {
        type: String,
        enum: ["surface", "subsurface", "deep", "benthic"],
      },
      unit: {
        type: String,
        default: "meters",
      },
    },

    // Temperature Measurements
    temperature: {
      seaSurfaceTemperature: {
        type: Number, // °C
      },
      waterTemperature: {
        type: Number, // °C
      },
      unit: {
        type: String,
        default: "celsius",
      },
      measurementMethod: {
        type: String,
      },
    },

    // Salinity Measurements
    salinity: {
      type: {
        value: {
          type: Number,
          min: 0,
          max: 50, // PSU
        },
        unit: {
          type: String,
          default: "PSU",
        },
        measurementMethod: {
          type: String,
        },
      },
      validate: {
        validator: function(v) {
          // If salinity object is not provided, it's valid
          if (!v) return true;
          // If salinity object exists, value must be provided
          return typeof v.value === 'number';
        },
        message: 'salinity.value is required when salinity object is provided'
      }
    },

    // Wave Data
    waves: {
      height: {
        type: Number,
        min: 0, // meters
      },
      direction: {
        type: Number,
        min: 0,
        max: 360, // degrees
      },
      period: {
        type: Number,
        min: 0, // seconds
      },
      unit: {
        type: String,
        default: "meters",
      },
    },

    // Ocean Current Data
    currents: {
      velocity: {
        type: Number,
        min: 0, // m/s
      },
      direction: {
        type: Number,
        min: 0,
        max: 360, // degrees
      },
      uComponent: {
        type: Number, // m/s - eastward
      },
      vComponent: {
        type: Number, // m/s - northward
      },
      unit: {
        type: String,
        default: "m/s",
      },
    },

    // Wind Data
    wind: {
      speed: {
        type: Number,
        min: 0, // m/s
      },
      direction: {
        type: Number,
        min: 0,
        max: 360, // degrees
      },
      gustSpeed: {
        type: Number,
        min: 0, // m/s
      },
      unit: {
        type: String,
        default: "m/s",
      },
    },

    // Chemical Parameters
    chemistry: {
      dissolvedOxygen: {
        type: Number,
        min: 0, // mg/L
      },
      pH: {
        type: Number,
        min: 0,
        max: 14,
      },
      nutrients: {
        nitrate: {
          type: Number, // μmol/L
        },
        phosphate: {
          type: Number, // μmol/L
        },
        silicate: {
          type: Number, // μmol/L
        },
      },
      chlorophyll: {
        type: Number,
        min: 0, // mg/m³
      },
    },

    // Atmospheric Pressure
    pressure: {
      seaLevelPressure: {
        type: Number, // hPa
      },
      unit: {
        type: String,
        default: "hPa",
      },
    },

    // Data Source & Provenance
    dataSource: {
      type: String,
      required: true,
      index: true,
      enum: [
        "open-meteo",
        "satellite",
        "buoy",
        "ship",
        "research_station",
        "model",
        "manual",
        "other",
      ],
    },
    dataProvider: {
      type: String,
    },
    datasetId: {
      type: String,
      index: true,
    },
    instrumentType: {
      type: String,
    },
    platformType: {
      type: String,
      enum: [
        "satellite",
        "buoy",
        "ship",
        "mooring",
        "glider",
        "float",
        "shore_station",
      ],
    },

    // Quality Assurance
    qualityFlags: {
      overall: {
        type: String,
        enum: ["good", "questionable", "bad", "missing"],
        default: "good",
      },
      temperatureQC: {
        type: String,
      },
      salinityQC: {
        type: String,
      },
      notes: {
        type: String,
        maxlength: 500,
      },
    },
    dataQuality: {
      type: Number,
      min: 0,
      max: 100,
    },

    // Metadata
    measurementRemarks: {
      type: String,
      maxlength: 1000,
    },
    processingLevel: {
      type: String,
      enum: ["raw", "quality_controlled", "derived", "modeled"],
    },
    standardsCompliance: {
      type: [String], // e.g., ["CF-1.8", "BODC", "ISO-19115"]
    },
    externalLinks: {
      sourceUrl: {
        type: String,
      },
      metadataUrl: {
        type: String,
      },
    },

    // User Reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
// Note: Standalone location index removed to avoid redundancy with compound index below
oceanographicDataSchema.index({ location: "2dsphere", timestamp: -1 });
oceanographicDataSchema.index({ geohash: 1, timestamp: -1 });
oceanographicDataSchema.index({ dataSource: 1, timestamp: -1 });
oceanographicDataSchema.index({ year: 1, month: 1, temporalGranularity: 1 });
oceanographicDataSchema.index({ "depth.value": 1, timestamp: -1 });

// Virtual Fields
oceanographicDataSchema.virtual("coordinates").get(function () {
  if (this.location && this.location.coordinates) {
    return {
      lon: this.location.coordinates[0],
      lat: this.location.coordinates[1],
    };
  }
  return null;
});

oceanographicDataSchema.virtual("coordinates").set(function (coords) {
  if (coords && coords.lat !== undefined && coords.lon !== undefined) {
    this.location = {
      type: "Point",
      coordinates: [coords.lon, coords.lat],
    };
  }
});

oceanographicDataSchema.virtual("sst").get(function () {
  return this.temperature?.seaSurfaceTemperature || null;
});

oceanographicDataSchema.virtual("waveHeight").get(function () {
  return this.waves?.height || null;
});

oceanographicDataSchema.virtual("currentSpeed").get(function () {
  return this.currents?.velocity || null;
});

oceanographicDataSchema.virtual("windSpeed").get(function () {
  return this.wind?.speed || null;
});

// Instance Methods
oceanographicDataSchema.methods.getCoordinates = function () {
  if (this.location && this.location.coordinates) {
    return {
      lon: this.location.coordinates[0],
      lat: this.location.coordinates[1],
    };
  }
  return null;
};

oceanographicDataSchema.methods.hasTemperatureData = function () {
  return (
    this.temperature &&
    (this.temperature.seaSurfaceTemperature !== undefined ||
      this.temperature.waterTemperature !== undefined)
  );
};

oceanographicDataSchema.methods.hasWaveData = function () {
  return this.waves && this.waves.height !== undefined;
};

oceanographicDataSchema.methods.hasCurrentData = function () {
  return this.currents && this.currents.velocity !== undefined;
};

oceanographicDataSchema.methods.hasChemistryData = function () {
  return (
    this.chemistry &&
    (this.chemistry.dissolvedOxygen !== undefined ||
      this.chemistry.pH !== undefined ||
      this.chemistry.chlorophyll !== undefined ||
      this.chemistry.nutrients)
  );
};

oceanographicDataSchema.methods.isGoodQuality = function () {
  return this.qualityFlags?.overall === "good";
};

oceanographicDataSchema.methods.getAge = function () {
  if (!this.timestamp) return null;
  const now = new Date();
  const diffTime = Math.abs(now - this.timestamp);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Static Methods
oceanographicDataSchema.statics.findByLocation = function (
  lat,
  lon,
  radiusKm,
  options = {}
) {
  const radiusMeters = radiusKm * 1000;
  const query = {
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lon, lat],
        },
        $maxDistance: radiusMeters,
      },
    },
  };

  // Apply additional filters from options
  if (options.dataSource) query.dataSource = options.dataSource;
  if (options.startDate || options.endDate) {
    query.timestamp = {};
    if (options.startDate) query.timestamp.$gte = options.startDate;
    if (options.endDate) query.timestamp.$lte = options.endDate;
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(options.limit || 100);
};

oceanographicDataSchema.statics.findByTimeRange = function (
  startDate,
  endDate,
  options = {}
) {
  const query = {
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
  };

  // Apply additional filters from options
  if (options.dataSource) query.dataSource = options.dataSource;
  if (options.location) {
    // Expect options.location to be { lat, lon, radiusKm }
    const radiusMeters = options.location.radiusKm * 1000;
    query.location = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [options.location.lon, options.location.lat],
        },
        $maxDistance: radiusMeters,
      },
    };
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(options.limit || 100);
};

oceanographicDataSchema.statics.getTimeSeries = async function (
  lat,
  lon,
  radiusKm,
  startDate,
  endDate,
  parameter
) {
  const radiusMeters = radiusKm * 1000;
  const query = {
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lon, lat],
        },
        $maxDistance: radiusMeters,
      },
    },
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
  };

  // Ensure the parameter field exists
  if (parameter) {
    query[parameter] = { $exists: true };
  }

  return this.find(query)
    .select(`timestamp ${parameter}`)
    .sort({ timestamp: 1 });
};

// Pre-validate Middleware (runs before validation, allows auto-generation of required fields)
oceanographicDataSchema.pre("validate", function (next) {
  // Auto-generate measurementId if not provided
  if (!this.measurementId) {
    this.measurementId = `OCEAN-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 11)}`;
  }

  next();
});

// Pre-save Middleware
oceanographicDataSchema.pre("save", function (next) {
  // Extract year, month, day, hour from timestamp
  if (this.timestamp) {
    this.year = this.timestamp.getFullYear();
    this.month = this.timestamp.getMonth() + 1; // 1-12
    this.day = this.timestamp.getDate();
    this.hour = this.timestamp.getHours();
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

  // Validate depth value is within valid range
  if (this.depth && this.depth.value !== undefined) {
    if (this.depth.value < 0 || this.depth.value > 11000) {
      return next(
        new Error("Depth value must be between 0 and 11000 meters")
      );
    }
  }

  // Set default qualityFlags.overall if not provided
  if (!this.qualityFlags) {
    this.qualityFlags = { overall: "good" };
  } else if (!this.qualityFlags.overall) {
    this.qualityFlags.overall = "good";
  }

  next();
});

const OceanographicData = mongoose.model(
  "OceanographicData",
  oceanographicDataSchema
);

export default OceanographicData;
