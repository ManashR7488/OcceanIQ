import EDNASample from '../models/EDNASample.model.js';
import DNASequence from '../models/DNASequence.model.js';
import {
  parseSequenceFile,
  analyzeMetabarcoding,
  seedReferenceDatabase,
} from '../services/ednaAnalysis.service.js';
import { enrichSpeciesWithINaturalist } from '../services/inaturalist.service.js';

/**
 * Upload eDNA sample with metadata and sequences
 * POST /api/edna/upload
 */
export const uploadEDNASample = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if file or text input
    const hasFile = req.file;
    const hasText = req.body.sequenceText;

    // Validate input method
    if (!hasFile && !hasText) {
      return res.status(400).json({ success: false, message: 'No sequence file or text provided' });
    }

    // Parse sample metadata from request body
    const {
      collectionDate,
      locationName,
      latitude,
      longitude,
      waterDepth,
      waterTemperature,
      sampleVolume,
      filterSize,
      collector,
      notes,
      forwardPrimer,
      reversePrimer,
      targetGene,
      sequencingPlatform,
    } = req.body;

    // Validate required fields
    if (!collectionDate || !locationName || !targetGene) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: collectionDate, locationName, targetGene',
      });
    }

    // Validate collection date is not in the future
    if (new Date(collectionDate) > new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Collection date cannot be in the future',
      });
    }

    // Validate water depth range
    if (waterDepth && (parseFloat(waterDepth) < 0 || parseFloat(waterDepth) > 11000)) {
      return res.status(400).json({
        success: false,
        message: 'Water depth must be between 0 and 11000 meters',
      });
    }

    // Validate water temperature range
    if (waterTemperature && (parseFloat(waterTemperature) < -2 || parseFloat(waterTemperature) > 40)) {
      return res.status(400).json({
        success: false,
        message: 'Water temperature must be between -2°C and 40°C',
      });
    }

    // Parse sequence file or text
    let parsedSequences;
    if (hasFile) {
      parsedSequences = parseSequenceFile(req.file.buffer, req.file.originalname);
    } else {
      // Handle text input
      parsedSequences = parseSequenceFile(Buffer.from(hasText), 'input.txt');
    }

    if (parsedSequences.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid sequences found in uploaded file',
      });
    }

    // Validate sequence count limit
    if (parsedSequences.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Too many sequences. Maximum allowed is 1000 sequences per sample',
      });
    }

    // Generate unique sample ID
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const sampleId = `EDNA-${timestamp}-${random}`;

    // Create eDNA sample document
    const ednaSample = await EDNASample.create({
      sampleId,
      userId,
      sampleMetadata: {
        collectionDate: new Date(collectionDate),
        location: {
          name: locationName,
          coordinates: latitude && longitude ? [parseFloat(longitude), parseFloat(latitude)] : undefined,
        },
        waterDepth: waterDepth ? parseFloat(waterDepth) : undefined,
        waterTemperature: waterTemperature ? parseFloat(waterTemperature) : undefined,
        sampleVolume: sampleVolume ? parseFloat(sampleVolume) : undefined,
        filterSize: filterSize || undefined,
        collector,
        notes,
      },
      pcrWorkflow: {
        primerForward: forwardPrimer,
        primerReverse: reversePrimer,
        targetGene,
        sequencingPlatform,
      },
      sequenceCount: parsedSequences.length,
      analysisStatus: 'pending',
    });

    // Store sequences in database
    const sequenceDocuments = parsedSequences.map((seq, index) => {
      const seqTimestamp = Date.now() + index;
      const seqRandom = Math.floor(Math.random() * 1000);

      return {
        sequenceId: `SEQ-${seqTimestamp}-${seqRandom}`,
        sampleId: ednaSample.sampleId,
        userId,
        sequenceType: 'user_uploaded',
        sequence: seq.sequence,
        sequenceLength: seq.sequence.length,
        targetGene,
        metadata: {
          source: 'user_upload',
          quality: 'unknown',
          verified: false,
        },
      };
    });

    await DNASequence.insertMany(sequenceDocuments);

    res.status(201).json({
      success: true,
      message: 'eDNA sample uploaded successfully',
      data: ednaSample,
    });
  } catch (error) {
    console.error('Error uploading eDNA sample:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload eDNA sample',
    });
  }
};

/**
 * Analyze eDNA sample
 * POST /api/edna/analyze/:id
 */
export const analyzeEDNASample = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // Find sample
    const sample = await EDNASample.findOne({ sampleId: id });

    if (!sample) {
      return res.status(404).json({ success: false, message: 'Sample not found' });
    }

    // Verify ownership
    if (sample.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to sample' });
    }

    // Check if sample can be analyzed
    if (!sample.canAnalyze()) {
      return res.status(400).json({
        success: false,
        message: `Sample cannot be analyzed. Current status: ${sample.analysisStatus}`,
      });
    }

    // Update status to processing
    sample.analysisStatus = 'processing';
    await sample.save();

    // Retrieve sequences for this sample
    const sequences = await DNASequence.find({
      sampleId: sample.sampleId,
      sequenceType: 'user_uploaded',
    });

    if (sequences.length === 0) {
      sample.analysisStatus = 'failed';
      sample.analysisResults.errorMessage = 'No sequences found for analysis';
      await sample.save();

      return res.status(400).json({
        success: false,
        message: 'No sequences found for analysis',
      });
    }

    // Perform metabarcoding analysis
    const analysisResult = await analyzeMetabarcoding(
      sample.sampleId,
      sequences,
      sample.pcrWorkflow.targetGene
    );

    // Update sample with analysis results
    sample.speciesDetected = analysisResult.speciesDetected;
    sample.biodiversityMetrics = analysisResult.biodiversityMetrics;
    sample.analysisStatus = 'completed';
    sample.analysisResults.processedAt = new Date();
    sample.analysisResults.processingTime = analysisResult.processingTime;
    sample.analysisResults.matchesBySequence = analysisResult.matchesBySequence;
    sample.analysisResults.enrichmentStats = analysisResult.enrichmentStats;

    await sample.save();

    res.json({
      success: true,
      message: 'Analysis completed successfully',
      data: sample,
    });
  } catch (error) {
    console.error('Error analyzing eDNA sample:', error);

    // Update sample status to failed
    try {
      const sample = await EDNASample.findOne({ sampleId: req.params.id });
      if (sample) {
        sample.analysisStatus = 'failed';
        sample.analysisResults.errorMessage = error.message;
        await sample.save();
      }
    } catch (updateError) {
      console.error('Error updating sample status:', updateError);
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze eDNA sample',
    });
  }
};

/**
 * Get all eDNA samples for current user
 * GET /api/edna/samples
 */
export const getEDNASamples = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      page = 1,
      limit = 10,
      status,
      targetGene,
      startDate,
      endDate,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    // Build filter query
    const filter = { userId };

    if (status) {
      filter.analysisStatus = status;
    }

    if (targetGene) {
      filter['pcrWorkflow.targetGene'] = targetGene;
    }

    if (startDate || endDate) {
      filter['sampleMetadata.collectionDate'] = {};
      if (startDate) {
        filter['sampleMetadata.collectionDate'].$gte = new Date(startDate);
      }
      if (endDate) {
        filter['sampleMetadata.collectionDate'].$lte = new Date(endDate);
      }
    }

    // Build sort object
    const sortOrder = order === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const samples = await EDNASample.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalSamples = await EDNASample.countDocuments(filter);
    const totalPages = Math.ceil(totalSamples / parseInt(limit));

    res.json({
      success: true,
      data: samples,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalSamples,
        samplesPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error fetching eDNA samples:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch eDNA samples',
    });
  }
};

/**
 * Get single eDNA sample by ID
 * GET /api/edna/samples/:id
 */
export const getEDNASampleById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const sample = await EDNASample.findOne({ sampleId: id });

    if (!sample) {
      return res.status(404).json({ success: false, message: 'Sample not found' });
    }

    // Verify ownership
    if (sample.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to sample' });
    }

    res.json({
      success: true,
      data: sample,
    });
  } catch (error) {
    console.error('Error fetching eDNA sample:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch eDNA sample',
    });
  }
};

/**
 * Delete eDNA sample
 * DELETE /api/edna/samples/:id
 */
export const deleteEDNASample = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const sample = await EDNASample.findOne({ sampleId: id });

    if (!sample) {
      return res.status(404).json({ success: false, message: 'Sample not found' });
    }

    // Verify ownership
    if (sample.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to sample' });
    }

    // Delete associated sequences
    await DNASequence.deleteMany({ sampleId: sample.sampleId });

    // Delete sample
    await sample.deleteOne();

    res.json({
      success: true,
      message: 'Sample and associated sequences deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting eDNA sample:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete eDNA sample',
    });
  }
};

/**
 * Get eDNA statistics for current user
 * GET /api/edna/stats
 */
export const getEDNAStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Total samples
    const totalSamples = await EDNASample.countDocuments({ userId });

    // Samples by status
    const samplesByStatus = await EDNASample.aggregate([
      { $match: { userId } },
      { $group: { _id: '$analysisStatus', count: { $sum: 1 } } },
    ]);

    // Total unique species detected
    const speciesStats = await EDNASample.aggregate([
      { $match: { userId, analysisStatus: 'completed' } },
      { $unwind: '$speciesDetected' },
      {
        $group: {
          _id: '$speciesDetected.scientificName',
          totalReads: { $sum: '$speciesDetected.readCount' },
          averageConfidence: { $avg: '$speciesDetected.confidence' },
        },
      },
    ]);

    // Average biodiversity metrics
    const biodiversityStats = await EDNASample.aggregate([
      { $match: { userId, analysisStatus: 'completed' } },
      {
        $group: {
          _id: null,
          avgShannonIndex: { $avg: '$biodiversityMetrics.shannonIndex' },
          avgSimpsonIndex: { $avg: '$biodiversityMetrics.simpsonIndex' },
          avgSpeciesCount: { $avg: '$biodiversityMetrics.totalSpecies' },
        },
      },
    ]);

    // Samples by target gene
    const samplesByGene = await EDNASample.aggregate([
      { $match: { userId } },
      { $group: { _id: '$pcrWorkflow.targetGene', count: { $sum: 1 } } },
    ]);

    // Timeline data (samples per day, last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const timeline = await EDNASample.aggregate([
      { 
        $match: { 
          userId, 
          createdAt: { $gte: thirtyDaysAgo } 
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalSamples,
        samplesByStatus: samplesByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        totalUniqueSpecies: speciesStats.length,
        topSpecies: speciesStats
          .sort((a, b) => b.totalReads - a.totalReads)
          .slice(0, 10)
          .map((s) => ({
            scientificName: s._id,
            totalReads: s.totalReads,
            averageConfidence: Math.round(s.averageConfidence),
          })),
        biodiversityMetrics: biodiversityStats[0] || {
          avgShannonIndex: 0,
          avgSimpsonIndex: 0,
          avgSpeciesCount: 0,
        },
        samplesByGene: samplesByGene.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        timeline: timeline.map((t) => ({
          date: `${t._id.year}-${String(t._id.month).padStart(2, '0')}-${String(t._id.day).padStart(2, '0')}`,
          count: t.count,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching eDNA statistics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch eDNA statistics',
    });
  }
};

/**
 * Seed reference database
 * POST /api/edna/seed-reference
 */
export const seedReferenceData = async (req, res) => {
  try {
    const result = await seedReferenceDatabase();

    res.json({
      success: true,
      message: result.message,
      count: result.count,
    });
  } catch (error) {
    console.error('Error seeding reference database:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to seed reference database',
    });
  }
};

/**
 * Get species details from iNaturalist
 * GET /api/edna/species/details
 */
export const getSpeciesDetails = async (req, res) => {
  try {
    const { scientificName } = req.query;

    if (!scientificName) {
      return res.status(400).json({
        success: false,
        message: 'Scientific name is required',
      });
    }

    const enrichment = await enrichSpeciesWithINaturalist(scientificName);

    if (!enrichment) {
      return res.status(404).json({
        success: false,
        message: 'Species not found in iNaturalist database',
      });
    }

    res.json({
      success: true,
      data: enrichment,
    });
  } catch (error) {
    console.error('Error fetching species details:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch species details',
    });
  }
};
