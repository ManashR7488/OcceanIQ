import mongoose from 'mongoose';

const DNASequenceSchema = new mongoose.Schema(
  {
    sequenceId: {
      type: String,
      required: [true, 'Sequence ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    sampleId: {
      type: String,
      trim: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    sequenceType: {
      type: String,
      enum: ['reference', 'user_uploaded'],
      required: [true, 'Sequence type is required'],
      index: true,
    },
    sequence: {
      type: String,
      required: [true, 'Sequence data is required'],
      trim: true,
      index: true,
    },
    sequenceLength: {
      type: Number,
      required: [true, 'Sequence length is required'],
      min: [1, 'Sequence length must be at least 1'],
    },
    targetGene: {
      type: String,
      trim: true,
      index: true,
    },
    speciesReference: {
      scientificName: {
        type: String,
        trim: true,
        index: true,
      },
      commonName: {
        type: String,
        trim: true,
      },
      aphiaId: {
        type: Number,
      },
      ncbiTaxId: {
        type: Number,
      },
    },
    taxonomicHierarchy: {
      kingdom: {
        type: String,
        trim: true,
      },
      phylum: {
        type: String,
        trim: true,
      },
      class: {
        type: String,
        trim: true,
      },
      order: {
        type: String,
        trim: true,
      },
      family: {
        type: String,
        trim: true,
      },
      genus: {
        type: String,
        trim: true,
      },
      species: {
        type: String,
        trim: true,
      },
    },
    metadata: {
      source: {
        type: String,
        trim: true,
      },
      accessionNumber: {
        type: String,
        trim: true,
      },
      quality: {
        type: String,
        enum: ['high', 'medium', 'low','unknown'],
      },
      verified: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
DNASequenceSchema.index({ sequenceType: 1, targetGene: 1 });

// Static method: Find all reference sequences for a specific gene
DNASequenceSchema.statics.findReferenceSequences = function (targetGene) {
  return this.find({
    sequenceType: 'reference',
    targetGene: targetGene,
  });
};

// Static method: Find sequences by species
DNASequenceSchema.statics.findBySpecies = function (scientificName) {
  return this.find({
    'speciesReference.scientificName': scientificName,
  });
};

// Instance method: Calculate similarity with another sequence
DNASequenceSchema.methods.calculateSimilarity = function (otherSequence) {
  const seq1 = this.sequence.toUpperCase();
  const seq2 = otherSequence.toUpperCase();

  // Simple exact match check
  if (seq1 === seq2) {
    return 100;
  }

  // Calculate similarity based on matching characters
  const minLength = Math.min(seq1.length, seq2.length);
  const maxLength = Math.max(seq1.length, seq2.length);

  let matches = 0;
  for (let i = 0; i < minLength; i++) {
    if (seq1[i] === seq2[i]) {
      matches++;
    }
  }

  // Return percentage similarity
  return (matches / maxLength) * 100;
};

// Existing indexes
// DNASequenceSchema.index({ sequenceId: 1 });
// DNASequenceSchema.index({ sampleId: 1 });
// DNASequenceSchema.index({ sequenceType: 1 });
// DNASequenceSchema.index({ targetGene: 1 });
// DNASequenceSchema.index({ 'speciesReference.scientificName': 1 });
// DNASequenceSchema.index({ sequence: 'text' });

// Compound indexes for query optimization

// Species + Target Gene Index
// Optimizes queries for reference sequences by species and gene
// Common pattern for species identification and barcode matching
DNASequenceSchema.index({ 'speciesReference.scientificName': 1, targetGene: 1 });

// Sequence Type + Quality Index
// Optimizes queries for high-quality verified reference sequences
// Improves matching accuracy by filtering quality sequences
DNASequenceSchema.index({ sequenceType: 1, 'metadata.quality': 1, 'metadata.verified': 1 });

// Taxonomic Hierarchy Indexes
// Enables hierarchical taxonomic queries
// Useful for family/genus-level species matching
DNASequenceSchema.index({ 'taxonomicHierarchy.family': 1 });
DNASequenceSchema.index({ 'taxonomicHierarchy.genus': 1 });

// Sample + User Index
// Optimizes queries for user's sequences from specific samples
// Supports user-specific sequence management
DNASequenceSchema.index({ sampleId: 1, userId: 1 });

// Sequence Length Index
// Useful for filtering sequences by length during matching
DNASequenceSchema.index({ sequenceLength: 1 });

const DNASequence = mongoose.model('DNASequence', DNASequenceSchema);

export default DNASequence;
