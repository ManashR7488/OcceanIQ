import mongoose from "mongoose";
import OtolithMeasurement from "../models/OtolithMeasurement.model.js";
import {
  uploadImageToCloudinary,
  analyzeOtolith,
  deleteOtolithImage,
  fetchImageBuffer,
} from "../services/otolithAnalysis.service.js";

/**
 * Upload otolith image to Cloudinary (Step 1 - No analysis yet)
 * POST /api/otolith/upload
 */
export const uploadOtolith = async (req, res) => {
  let publicId;
  
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded",
        message: "Please upload an otolith image",
      });
    }

    // Extract metadata from request body
    let { collectionDate, location, depth, collector, notes } = req.body;

    // Validate required fields
    if (!collectionDate || !location) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Collection date and location are required",
      });
    }

    // Validate collection date (cannot be in the future)
    const collectionDateObj = new Date(collectionDate);
    if (collectionDateObj > new Date()) {
      return res.status(400).json({
        error: "Invalid date",
        message: "Collection date cannot be in the future",
      });
    }

    // Validate depth (0 to 11000 meters - Mariana Trench depth)
    if (depth !== undefined && depth !== null && depth !== "") {
      const depthNum = parseFloat(depth);
      if (isNaN(depthNum) || depthNum < 0 || depthNum > 11000) {
        return res.status(400).json({
          error: "Invalid depth",
          message: "Depth must be between 0 and 11000 meters",
        });
      }
      depth = depthNum;
    }

    // Trim and limit string lengths
    if (location) location = location.trim().substring(0, 200);
    if (collector) collector = collector.trim().substring(0, 100);
    if (notes) notes = notes.trim().substring(0, 1000);

    // Get user ID from authenticated request
    const userId = req.user._id;

    // Generate unique sample ID
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const sampleId = `OTL-${timestamp}-${randomStr}`;

    // Upload image to Cloudinary
    const uploadResult = await uploadImageToCloudinary(
      req.file.buffer,
      userId,
      sampleId
    );
    
    // Track publicId for potential cleanup
    publicId = uploadResult.publicId;

    // Create database record with status 'pending'
    const otolithMeasurement = await OtolithMeasurement.create({
      sampleId,
      userId,
      imageUrl: uploadResult.imageUrl,
      thumbnailUrl: uploadResult.thumbnailUrl,
      cloudinaryPublicId: uploadResult.publicId,
      sampleMetadata: {
        collectionDate: collectionDateObj,
        location,
        depth: depth || undefined,
        collector,
        notes,
      },
      analysisStatus: "pending",
      morphometrics: null,
      speciesIdentified: null,
    });

    res.status(201).json({
      success: true,
      message:
        "Otolith uploaded successfully to Cloudinary. Click 'Analyze' to process.",
      data: otolithMeasurement,
    });
  } catch (error) {
    console.error("Upload otolith error:", error);

    // Clean up Cloudinary if DB save failed
    if (publicId) {
      await deleteOtolithImage(publicId).catch((err) =>
        console.error("Cleanup failed:", err)
      );
    }

    res.status(500).json({
      error: "Upload failed",
      message: error.message || "Failed to upload otolith image",
    });
  }
};

/**
 * Analyze uploaded otolith (Step 2 - Perform morphometric analysis)
 * POST /api/otolith/analyze/:id
 */
export const analyzeOtolithController = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid ID",
        message: "Invalid otolith measurement ID",
      });
    }

    // Find otolith measurement
    const otolith = await OtolithMeasurement.findById(id);

    if (!otolith) {
      return res.status(404).json({
        error: "Not found",
        message: "Otolith measurement not found",
      });
    }

    // Verify ownership
    if (otolith.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: "Unauthorized",
        message: "You are not authorized to analyze this otolith",
      });
    }

    // Update status to 'processing'
    otolith.analysisStatus = "processing";
    await otolith.save();

    // Fetch image from Cloudinary
    const imageBuffer = await fetchImageBuffer(otolith.imageUrl);

    // Perform analysis
    const analysisResults = await analyzeOtolith(id, imageBuffer);

    // Update database with results
    otolith.morphometrics = analysisResults.morphometrics;
    otolith.speciesIdentified =
      analysisResults.speciesIdentification.primarySpecies.name;
    otolith.speciesConfidence =
      analysisResults.speciesIdentification.primarySpecies.confidence;
    otolith.alternativeSpecies =
      analysisResults.speciesIdentification.alternativeSpecies;
    otolith.analysisStatus = "completed";
    otolith.analysisResults = {
      processedAt: new Date(),
      processingTime: analysisResults.processingTime,
    };

    await otolith.save();

    res.status(200).json({
      success: true,
      message: "Otolith analysis completed successfully",
      data: otolith,
    });
  } catch (error) {
    console.error("Analyze otolith error:", error);

    // Update status to 'failed' if otolith exists
    if (req.params.id && mongoose.Types.ObjectId.isValid(req.params.id)) {
      await OtolithMeasurement.findByIdAndUpdate(req.params.id, {
        analysisStatus: "failed",
        "analysisResults.errorMessage": error.message,
      }).catch((err) => console.error("Failed to update status:", err));
    }

    res.status(500).json({
      error: "Analysis failed",
      message: error.message || "Failed to analyze otolith",
    });
  }
};

/**
 * Get all otolith measurements for authenticated user with pagination and filters
 * GET /api/otolith/measurements
 */
export const getOtolithMeasurements = async (req, res) => {
  try {
    const userId = req.user._id;

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Filters
    const filters = { userId };

    if (req.query.species) {
      filters.speciesIdentified = new RegExp(req.query.species, "i");
    }

    if (req.query.status) {
      filters.analysisStatus = req.query.status;
    }

    if (req.query.startDate || req.query.endDate) {
      filters["sampleMetadata.collectionDate"] = {};
      if (req.query.startDate) {
        filters["sampleMetadata.collectionDate"].$gte = new Date(
          req.query.startDate
        );
      }
      if (req.query.endDate) {
        filters["sampleMetadata.collectionDate"].$lte = new Date(
          req.query.endDate
        );
      }
    }

    // Query with pagination
    const otoliths = await OtolithMeasurement.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await OtolithMeasurement.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: otoliths,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get otolith measurements error:", error);
    res.status(500).json({
      error: "Fetch failed",
      message: error.message || "Failed to fetch otolith measurements",
    });
  }
};

/**
 * Get single otolith measurement by ID
 * GET /api/otolith/measurements/:id
 */
export const getOtolithById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid ID",
        message: "Invalid otolith measurement ID",
      });
    }

    // Find otolith with virtuals
    const otolith = await OtolithMeasurement.findById(id);

    if (!otolith) {
      return res.status(404).json({
        error: "Not found",
        message: "Otolith measurement not found",
      });
    }

    // Verify ownership
    if (otolith.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: "Unauthorized",
        message: "You are not authorized to view this otolith",
      });
    }

    res.status(200).json({
      success: true,
      data: otolith,
    });
  } catch (error) {
    console.error("Get otolith by ID error:", error);
    res.status(500).json({
      error: "Fetch failed",
      message: error.message || "Failed to fetch otolith measurement",
    });
  }
};

/**
 * Delete otolith measurement
 * DELETE /api/otolith/measurements/:id
 */
export const deleteOtolith = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid ID",
        message: "Invalid otolith measurement ID",
      });
    }

    // Find otolith
    const otolith = await OtolithMeasurement.findById(id);

    if (!otolith) {
      return res.status(404).json({
        error: "Not found",
        message: "Otolith measurement not found",
      });
    }

    // Verify ownership
    if (otolith.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: "Unauthorized",
        message: "You are not authorized to delete this otolith",
      });
    }

    // Delete from Cloudinary (log error but don't fail)
    await deleteOtolithImage(otolith.cloudinaryPublicId).catch((err) =>
      console.error("Cloudinary deletion error:", err)
    );

    // Delete from database
    await OtolithMeasurement.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Otolith measurement deleted successfully",
    });
  } catch (error) {
    console.error("Delete otolith error:", error);
    res.status(500).json({
      error: "Deletion failed",
      message: error.message || "Failed to delete otolith measurement",
    });
  }
};

/**
 * Get user statistics for otolith measurements
 * GET /api/otolith/stats
 */
export const getOtolithStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Aggregate statistics
    const [
      totalSamples,
      pendingSamples,
      analyzedSamples,
      failedSamples,
      speciesStats,
      recentUploads,
      avgConfidence,
      avgMorphometrics,
    ] = await Promise.all([
      // Total samples
      OtolithMeasurement.countDocuments({ userId }),

      // Pending samples
      OtolithMeasurement.countDocuments({
        userId,
        analysisStatus: "pending",
      }),

      // Analyzed samples
      OtolithMeasurement.countDocuments({
        userId,
        analysisStatus: "completed",
      }),

      // Failed samples
      OtolithMeasurement.countDocuments({ userId, analysisStatus: "failed" }),

      // Species distribution
      OtolithMeasurement.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), analysisStatus: "completed" } },
        { $group: { _id: "$speciesIdentified", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { name: "$_id", count: 1, _id: 0 } },
      ]),

      // Recent uploads (last 7 days)
      OtolithMeasurement.countDocuments({
        userId,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),

      // Average confidence (only completed)
      OtolithMeasurement.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), analysisStatus: "completed" } },
        { $group: { _id: null, avgConfidence: { $avg: "$speciesConfidence" } } },
      ]),

      // Average morphometrics (only completed)
      OtolithMeasurement.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), analysisStatus: "completed" } },
        {
          $group: {
            _id: null,
            avgLength: { $avg: "$morphometrics.length" },
            avgWidth: { $avg: "$morphometrics.width" },
            avgArea: { $avg: "$morphometrics.area" },
            avgPerimeter: { $avg: "$morphometrics.perimeter" },
            avgCircularity: { $avg: "$morphometrics.circularity" },
            avgAspectRatio: { $avg: "$morphometrics.aspectRatio" },
          },
        },
      ]),
    ]);

    // Upload timeline (last 30 days)
    const uploadTimeline = await OtolithMeasurement.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: "$_id", count: 1, _id: 0 } },
    ]);

    // Confidence distribution
    const confidenceBuckets = await OtolithMeasurement.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), analysisStatus: "completed" } },
      {
        $bucket: {
          groupBy: "$speciesConfidence",
          boundaries: [0, 20, 40, 60, 80, 101],
          default: "Other",
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    // Map buckets to labeled ranges
    const rangeLabels = ["0-20%", "20-40%", "40-60%", "60-80%", "80-100%"];
    const confidenceDistribution = confidenceBuckets.map((bucket, index) => ({
      range: rangeLabels[index] || "Other",
      count: bucket.count,
    }));

    res.status(200).json({
      success: true,
      data: {
        totalSamples,
        pendingSamples,
        analyzedSamples,
        failedSamples,
        uniqueSpecies: speciesStats.length,
        speciesDistribution: speciesStats,
        recentUploads,
        avgConfidence: avgConfidence[0]?.avgConfidence || 0,
        avgMorphometrics: avgMorphometrics[0] || {},
        uploadTimeline,
        confidenceDistribution,
      },
    });
  } catch (error) {
    console.error("Get otolith stats error:", error);
    res.status(500).json({
      error: "Stats fetch failed",
      message: error.message || "Failed to fetch statistics",
    });
  }
};
