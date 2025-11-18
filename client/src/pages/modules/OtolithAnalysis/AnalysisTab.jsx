import React, { useState } from "react";
import {
  FiPlay,
  FiRefreshCw,
  FiDownload,
  FiTrash2,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import axiosInstance from "../../../config/axios.config";
import { toast } from "react-toastify";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

const AnalysisTab = ({ otolith, onAnalysisComplete }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [currentOtolith, setCurrentOtolith] = useState(otolith);

  // Handle analyze action (Step 2)
  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      toast.loading("Analyzing otolith...", { id: "analyze" });

      const response = await axiosInstance.post(
        `/otolith/analyze/${currentOtolith._id}`
      );

      toast.success("Analysis completed successfully!", { id: "analyze" });
      setCurrentOtolith(response.data.data);

      if (onAnalysisComplete) {
        onAnalysisComplete(response.data.data);
      }
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error(
        error.response?.data?.message || "Analysis failed",
        { id: "analyze" }
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // Render based on status
  const status = currentOtolith.analysisStatus;

  // Pending View - Show Analyze Button
  if (status === "pending") {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Info Card */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="text-3xl text-yellow-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Ready for Analysis
              </h3>
              <p className="text-gray-600 mb-4">
                This otolith sample has been uploaded to Cloudinary and is ready
                for morphometric analysis. Click the button below to start Step
                2 of the process.
              </p>
            </div>
          </div>
        </div>

        {/* Image Preview */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Sample Image
          </h4>
          <img
            src={currentOtolith.imageUrl}
            alt={`Otolith ${currentOtolith.sampleId}`}
            className="w-full max-h-96 object-contain rounded-lg shadow-md"
          />
        </div>

        {/* Sample Metadata */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Sample Details
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Sample ID:</span>
              <p className="font-semibold text-gray-800">
                {currentOtolith.sampleId}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Collection Date:</span>
              <p className="font-semibold text-gray-800">
                {new Date(
                  currentOtolith.sampleMetadata.collectionDate
                ).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Location:</span>
              <p className="font-semibold text-gray-800">
                {currentOtolith.sampleMetadata.location}
              </p>
            </div>
            {currentOtolith.sampleMetadata.depth && (
              <div>
                <span className="text-gray-600">Depth:</span>
                <p className="font-semibold text-gray-800">
                  {currentOtolith.sampleMetadata.depth}m
                </p>
              </div>
            )}
            {currentOtolith.sampleMetadata.collector && (
              <div>
                <span className="text-gray-600">Collector:</span>
                <p className="font-semibold text-gray-800">
                  {currentOtolith.sampleMetadata.collector}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className={`
            w-full py-4 rounded-xl font-semibold text-white text-lg
            transition-all duration-300 shadow-lg hover:shadow-xl
            flex items-center justify-center gap-3
            ${
              analyzing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
            }
          `}
        >
          {analyzing ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <FiPlay className="text-2xl" />
              <span>Analyze Now (Step 2)</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // Processing View
  if (status === "processing") {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-500 border-t-transparent mx-auto mb-6" />
        <h3 className="text-2xl font-semibold text-gray-800 mb-2">
          Processing Analysis...
        </h3>
        <p className="text-gray-600">
          Analyzing morphometrics and identifying species
        </p>
      </div>
    );
  }

  // Failed View
  if (status === "failed") {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <FiXCircle className="text-3xl text-red-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Analysis Failed
              </h3>
              <p className="text-gray-600 mb-4">
                {currentOtolith.analysisResults?.errorMessage ||
                  "An error occurred during analysis"}
              </p>
            </div>
          </div>
        </div>

        {/* Retry Button */}
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="w-full py-4 rounded-xl font-semibold text-white text-lg bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 transition-all duration-300 shadow-lg flex items-center justify-center gap-3"
        >
          <FiRefreshCw className="text-2xl" />
          <span>Retry Analysis</span>
        </button>
      </div>
    );
  }

  // Completed View - Show Full Results
  if (status === "completed" && currentOtolith.morphometrics) {
    // Prepare chart data
    const morphometricData = [
      { name: "Length", value: currentOtolith.morphometrics.length, unit: "mm" },
      { name: "Width", value: currentOtolith.morphometrics.width, unit: "mm" },
      { name: "Area", value: currentOtolith.morphometrics.area, unit: "mm²" },
      { name: "Perimeter", value: currentOtolith.morphometrics.perimeter, unit: "mm" },
    ];

    const shapeData = [
      { characteristic: "Circularity", value: currentOtolith.morphometrics.circularity * 100 },
      { characteristic: "Aspect Ratio", value: currentOtolith.morphometrics.aspectRatio * 10 },
      { characteristic: "Compactness", value: currentOtolith.morphometrics.shapeDescriptors.compactness * 100 },
      { characteristic: "Elongation", value: currentOtolith.morphometrics.shapeDescriptors.elongation * 100 },
    ];

    return (
      <div className="space-y-6">
        {/* Success Header */}
        <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <FiCheckCircle className="text-3xl text-green-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Analysis Complete
              </h3>
              <p className="text-gray-600">
                Morphometric analysis and species identification completed
                successfully
              </p>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Image and Details */}
          <div className="space-y-6">
            {/* Image Viewer */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Sample Image
              </h4>
              <img
                src={currentOtolith.imageUrl}
                alt={`Otolith ${currentOtolith.sampleId}`}
                className="w-full rounded-lg shadow-md"
              />
            </div>

            {/* Sample Details */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Sample Information
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sample ID:</span>
                  <span className="font-semibold text-gray-800">
                    {currentOtolith.sampleId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-semibold text-gray-800">
                    {currentOtolith.sampleMetadata.location}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Collection Date:</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(
                      currentOtolith.sampleMetadata.collectionDate
                    ).toLocaleDateString()}
                  </span>
                </div>
                {currentOtolith.sampleMetadata.depth && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Depth:</span>
                    <span className="font-semibold text-gray-800">
                      {currentOtolith.sampleMetadata.depth}m
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Analyzed:</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(
                      currentOtolith.analysisResults.processedAt
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Processing Time:</span>
                  <span className="font-semibold text-gray-800">
                    {currentOtolith.analysisResults.processingTime}ms
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {/* Species Identification */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Species Identification
              </h4>
              <div className="space-y-4">
                {/* Primary Species */}
                <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-semibold text-gray-800">
                      Primary Identification
                    </h5>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                      {currentOtolith.speciesConfidence}% confidence
                    </span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {currentOtolith.speciesIdentified}
                  </p>
                </div>

                {/* Alternative Species */}
                {currentOtolith.alternativeSpecies &&
                  currentOtolith.alternativeSpecies.length > 0 && (
                    <div>
                      <h6 className="text-sm font-semibold text-gray-700 mb-2">
                        Alternative Identifications:
                      </h6>
                      <div className="space-y-2">
                        {currentOtolith.alternativeSpecies.map((alt, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center bg-gray-50 rounded-lg p-3"
                          >
                            <span className="text-gray-800">{alt.name}</span>
                            <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-semibold">
                              {alt.confidence}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Morphometric Measurements */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Morphometric Measurements
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-cyan-50 rounded-lg p-3">
                  <span className="text-gray-600 block mb-1">Length</span>
                  <span className="text-xl font-bold text-gray-900">
                    {currentOtolith.morphometrics.length} mm
                  </span>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <span className="text-gray-600 block mb-1">Width</span>
                  <span className="text-xl font-bold text-gray-900">
                    {currentOtolith.morphometrics.width} mm
                  </span>
                </div>
                <div className="bg-teal-50 rounded-lg p-3">
                  <span className="text-gray-600 block mb-1">Area</span>
                  <span className="text-xl font-bold text-gray-900">
                    {currentOtolith.morphometrics.area} mm²
                  </span>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <span className="text-gray-600 block mb-1">Perimeter</span>
                  <span className="text-xl font-bold text-gray-900">
                    {currentOtolith.morphometrics.perimeter} mm
                  </span>
                </div>
                <div className="bg-pink-50 rounded-lg p-3">
                  <span className="text-gray-600 block mb-1">Circularity</span>
                  <span className="text-xl font-bold text-gray-900">
                    {currentOtolith.morphometrics.circularity.toFixed(3)}
                  </span>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <span className="text-gray-600 block mb-1">Aspect Ratio</span>
                  <span className="text-xl font-bold text-gray-900">
                    {currentOtolith.morphometrics.aspectRatio.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart - Morphometrics */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">
              Morphometric Measurements
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={morphometricData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0891b2" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar Chart - Shape Characteristics */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">
              Shape Characteristics
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={shapeData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="characteristic" />
                <PolarRadiusAxis />
                <Radar
                  name="Value"
                  dataKey="value"
                  stroke="#0891b2"
                  fill="#0891b2"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleAnalyze}
            className="flex-1 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <FiRefreshCw />
            <span>Re-analyze</span>
          </button>
          <button
            onClick={() => {
              const dataStr = JSON.stringify(currentOtolith, null, 2);
              const dataBlob = new Blob([dataStr], { type: "application/json" });
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `${currentOtolith.sampleId}_analysis.json`;
              link.click();
              toast.success("Analysis data exported");
            }}
            className="flex-1 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <FiDownload />
            <span>Export JSON</span>
          </button>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="text-center py-20">
      <p className="text-gray-500">Unknown analysis status</p>
    </div>
  );
};

export default AnalysisTab;
