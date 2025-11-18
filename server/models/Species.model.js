import mongoose from "mongoose";

const speciesSchema = new mongoose.Schema(
  {
    scientificName: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    commonNames: {
      type: [String],
      default: [],
    },
    taxonomicHierarchy: {
      kingdom: String,
      phylum: String,
      class: String,
      order: String,
      family: String,
      genus: String,
      species: String,
    },
    taxonomicStatus: {
      type: String,
      enum: ["accepted", "synonym", "unaccepted", "uncertain"],
      default: "accepted",
    },
    description: {
      type: String,
      default: "",
    },
    habitat: {
      type: String,
      default: "",
    },
    distribution: {
      type: String,
      default: "",
    },
    conservationStatus: {
      type: String,
      enum: [
        "LC", // Least Concern
        "NT", // Near Threatened
        "VU", // Vulnerable
        "EN", // Endangered
        "CR", // Critically Endangered
        "EW", // Extinct in the Wild
        "EX", // Extinct
        "DD", // Data Deficient
        "NE", // Not Evaluated
      ],
      default: null,
    },
    wormsMetadata: {
      aphiaId: Number,
      url: String,
      authority: String,
      isMarine: { type: Boolean, default: false },
      isBrackish: { type: Boolean, default: false },
      isFreshwater: { type: Boolean, default: false },
      status: String,
      rank: String,
    },
    synonyms: [
      {
        name: String,
        authority: String,
      },
    ],
    externalLinks: {
      wikipedia: String,
      gbif: String,
      fishbase: String,
      iNaturalist: String,
    },
    // Additional fields for marine species
    morphology: {
      maxLength: Number, // in cm
      maxWeight: Number, // in kg
      distinctiveFeatures: [String],
    },
    ecology: {
      diet: String,
      behavior: String,
      reproduction: String,
      depthRange: {
        min: Number,
        max: Number,
      },
    },
    economicImportance: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
speciesSchema.index({ scientificName: 1 });
speciesSchema.index({ "commonNames": 1 });
speciesSchema.index({ "taxonomicHierarchy.family": 1 });
speciesSchema.index({ "taxonomicHierarchy.genus": 1 });
speciesSchema.index({ "wormsMetadata.aphiaId": 1 });

const Species = mongoose.model("Species", speciesSchema);

export default Species;
