import React, { useState, useRef } from "react";
import { 
  FiUpload, 
  FiX, 
  FiDownload, 
  FiExternalLink, 
  FiInfo, 
  FiActivity, 
  FiDroplet, 
  FiMapPin, 
  FiGlobe,
  FiTarget,
  FiLayers
} from "react-icons/fi";
import { FaRulerHorizontal, FaWeightHanging } from "react-icons/fa";
import { BiWater } from "react-icons/bi";
import { MdOutlineScience } from "react-icons/md";
import { toast } from "react-toastify";
import { generateSpeciesReportPDF } from "../../../utils/pdfGenerator";
import axios from "../../../config/axios.config";

const IdentifyTab = ({ onSelectSpecies, refreshTrigger }) => {
  // Input mode state
  const [inputMode, setInputMode] = useState("name"); // 'name' | 'image'
  const [speciesNameInput, setSpeciesNameInput] = useState("");
  
  // Image upload state
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Results and display state
  const [identificationResult, setIdentificationResult] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [apiError, setApiError] = useState(null);
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState("");
  const [exporting, setExporting] = useState(false);

  // Refs
  const processingSessionRef = useRef(0);


  // Handle species name input change
  const handleSpeciesNameChange = (e) => {
    setSpeciesNameInput(e.target.value);
    setApiError(null);
  };

  // Handle file selection - auto-triggers identification
  const handleFileSelect = (file) => {
    // Guard against concurrent uploads
    if (isProcessing) {
      toast.info("Please wait, still identifying...");
      return;
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a JPG, JPEG, or PNG image");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      // Auto-trigger identification after preview is ready, passing file to avoid state timing issues
      identifySpeciesViaAPI(file);
    };
    reader.readAsDataURL(file);

    toast.info("Processing image...");
  };

  // Real API call to identify species via n8n webhook
  const identifySpeciesViaAPI = async (fileParam = null) => {
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingMessage("Connecting to identification service...");
    setApiError(null);

    try {
      const formData = new FormData();

      // Prefer passed-in file parameter over state to avoid timing issues
      const imageFile = fileParam || selectedImage;
      
      if (inputMode === "image" && imageFile) {
        formData.append("speciesImage", imageFile);
        setProcessingMessage("Uploading to cloud storage...");
      } else if (inputMode === "name" && speciesNameInput) {
        formData.append("speciesName", speciesNameInput);
      } else {
        toast.error("Please provide a species name or upload an image");
        setIsProcessing(false);
        return;
      }

      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 800);

      setProcessingMessage("Analyzing with n8n taxonomy service...");

      const response = await axios.post("/taxonomy/identify", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000, // 120 seconds (slightly longer than backend timeout)
      });
      console.log(response.data)
      clearInterval(progressInterval);
      setProcessingProgress(100);
      setProcessingMessage("Complete!");

      // Set identification result from API
      setIdentificationResult(response.data.data.species);
      setShowDetails(true);
      
      // Notify parent component if callback provided
      if (typeof onSelectSpecies === "function") {
        onSelectSpecies(response.data.data.species);
      }

      toast.success("Species identified successfully!");
    } catch (error) {
      console.error("Identification error:", error);

      let errorMessage = "Identification failed";

      if (error.code === "ECONNABORTED") {
        errorMessage =
          "Identification timeout. The service is taking too long. Please try again.";
        toast.error("Request timeout");
      } else if (error.response?.status === 504) {
        errorMessage =
          "n8n webhook timeout. Please check your n8n service.";
        toast.error("Service timeout");
      } else if (error.response?.status === 503) {
        errorMessage =
          "Cannot connect to n8n taxonomy service. Please check that n8n is running.";
        toast.error("Service unavailable");
      } else if (error.response?.status === 401) {
        errorMessage = "Please log in to use species identification.";
        toast.error("Authentication required");
      } else {
        errorMessage =
          error.response?.data?.message || "Identification failed";
        toast.error("Identification failed");
      }

      setApiError(errorMessage);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
      setProcessingMessage("");
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Clear selected image
  const handleClearImage = () => {
    // Invalidate current processing session
    processingSessionRef.current++;

    setSelectedImage(null);
    setImagePreview(null);
    setIsProcessing(false);
    setProcessingProgress(0);
    setProcessingMessage("");
    setApiError(null);
  };

  /**
   * Export species identification report as PDF (Client-side generation)
   * Uses jsPDF to generate PDF entirely in browser with embedded image
   */
  const handleExportPDF = async () => {
    if (!identificationResult) {
      toast.error("Please identify a species first");
      return;
    }

    try {
      setExporting(true);

      const filename = await toast.promise(
        generateSpeciesReportPDF(
          identificationResult,
          {
            uploadedImageUrl:
              imagePreview ||
              identificationResult.uploadedImageUrl ||
              identificationResult.images?.[0] ||
              null,
          },
          {
            includeReferences: true,
            includeImage: !!(
              imagePreview ||
              identificationResult.uploadedImageUrl ||
              identificationResult.images?.[0]
            ),
          }
        ),
        {
          loading: "Generating PDF...",
          success: (filename) => `PDF downloaded: ${filename}`,
          error: "Failed to generate PDF. Please try again.",
        }
      );
    } catch (error) {
      console.error("PDF export error:", error);
    } finally {
      setExporting(false);
    }
  };

  // Try another identification
  const handleTryAnother = () => {
    // Invalidate current processing session
    processingSessionRef.current++;

    handleClearImage();
    setShowDetails(false);
    setIdentificationResult(null);
    setSpeciesNameInput("");
    setApiError(null);
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          <strong>Instructions:</strong> Identify fish species by entering a
          scientific or common name, or by uploading an image. Our n8n-powered
          identification service provides comprehensive taxonomic, morphological,
          and ecological information sourced from multiple scientific databases.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 1: Input Selection (Left Column) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Input Mode Selection */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Identify Species
            </h2>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setInputMode("name")}
                className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                  inputMode === "name"
                    ? "bg-white text-cyan-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                By Name
              </button>
              <button
                onClick={() => setInputMode("image")}
                className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                  inputMode === "image"
                    ? "bg-white text-cyan-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                By Image
              </button>
            </div>

            {/* Name Input Mode */}
            {inputMode === "name" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Species Name
                  </label>
                  <input
                    type="text"
                    value={speciesNameInput}
                    onChange={handleSpeciesNameChange}
                    placeholder="Enter scientific or common name (e.g., Gadus morhua, Atlantic Cod)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    disabled={isProcessing}
                  />
                </div>
                <button
                  onClick={identifySpeciesViaAPI}
                  disabled={isProcessing || speciesNameInput.length < 2}
                  className={`w-full px-6 py-3 rounded-lg font-semibold transition-all ${
                    isProcessing || speciesNameInput.length < 2
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:shadow-lg"
                  }`}
                >
                  {isProcessing ? "Identifying..." : "Identify Species"}
                </button>
                {apiError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{apiError}</p>
                    <button
                      onClick={() => setApiError(null)}
                      className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Image Upload Mode */}
            {inputMode === "image" && (
              <div>
                {!imagePreview ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      isProcessing
                        ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                        : dragActive
                        ? "border-cyan-500 bg-cyan-50"
                        : "border-gray-300 hover:border-cyan-400"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    aria-disabled={isProcessing}
                  >
                    <FiUpload
                      className={`text-5xl mx-auto mb-4 ${
                        isProcessing ? "text-gray-300" : "text-gray-400"
                      }`}
                    />
                    <p className="text-gray-600 mb-2">
                      Drag and drop an image here, or click to select
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Supported formats: JPG, JPEG, PNG (Max 10MB)
                    </p>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleFileInputChange}
                      className="hidden"
                      id="fileInput"
                      disabled={isProcessing}
                    />
                    <label
                      htmlFor="fileInput"
                      className={`inline-block px-6 py-2 rounded-lg transition-colors ${
                        isProcessing
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-cyan-600 text-white hover:bg-cyan-700 cursor-pointer"
                      }`}
                      aria-disabled={isProcessing}
                    >
                      {isProcessing ? "Processing..." : "Select Image"}
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full max-h-96 object-contain rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={handleClearImage}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                        aria-label="Remove image"
                      >
                        <FiX />
                      </button>
                    </div>
                  </div>
                )}
                {apiError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                    <p className="text-red-700 text-sm">{apiError}</p>
                    <button
                      onClick={() => setApiError(null)}
                      className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Processing Status / Results (Right Column) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {showDetails ? "Identification Result" : "Ready to Identify"}
          </h2>

          {!showDetails ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FiUpload className="text-6xl text-gray-300 mb-4" />
              <p className="text-gray-500">
                Select an input mode and provide a species name or image
              </p>
            </div>
          ) : identificationResult ? (
            <div className="space-y-3">
              <div 
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md cursor-pointer" 
                onClick={() => setShowDetails(true)}
              >
                <h3 className="text-lg font-semibold italic text-gray-800">
                  {identificationResult.scientificName}
                </h3>
                <p className="text-sm text-gray-600">
                  {identificationResult.commonNames?.join(', ') || 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Family: {identificationResult.taxonomicHierarchy?.family || 'N/A'}
                </p>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="inline-block px-2 py-1 bg-cyan-100 text-cyan-800 text-xs font-medium rounded-full">
                    n8n Taxonomy
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Identification result will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Species Details Panel */}
      {showDetails && identificationResult && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border-t-4 border-cyan-600 animate-fade-in">
          
          {/* Hero Section with Image and Basic Info */}
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 text-white">
            <div className="absolute inset-0 opacity-20 bg-pattern-grid"></div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-8">
              {/* Image Container */}
              <div className="lg:col-span-1 bg-black/30 min-h-[300px] lg:min-h-full flex items-center justify-center p-4">
                {(imagePreview || identificationResult.uploadedImageUrl || identificationResult.images?.[0]) ? (
                  <img
                    src={imagePreview || identificationResult.uploadedImageUrl || identificationResult.images?.[0]}
                    alt={identificationResult.scientificName}
                    className="w-full h-full max-h-[400px] object-contain rounded-lg shadow-2xl border border-white/10"
                  />
                ) : (
                  <div className="text-white/30 flex flex-col items-center">
                    <FiUpload className="text-6xl mb-2" />
                    <span>No Image Available</span>
                  </div>
                )}
              </div>

              {/* Header Info */}
              <div className="lg:col-span-2 p-8 flex flex-col justify-center">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-4xl font-bold italic font-serif tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200 mb-2">
                      {identificationResult.scientificName}
                    </h2>
                    <h3 className="text-xl text-gray-300 font-light">
                      {identificationResult.commonNames?.join(", ") || "Common Name Unknown"}
                    </h3>
                  </div>
                  {identificationResult.conservationStatus && (
                    <div className={`px-4 py-2 rounded-full border ${
                      identificationResult.conservationStatus === 'LC' ? 'bg-green-500/20 border-green-500 text-green-300' :
                      identificationResult.conservationStatus === 'EN' ? 'bg-red-500/20 border-red-500 text-red-300' :
                      identificationResult.conservationStatus === 'VU' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300' :
                      'bg-gray-500/20 border-gray-500 text-gray-300'
                    }`}>
                      <span className="text-xs font-bold uppercase tracking-wider block text-center">Conservation Status</span>
                      <span className="text-lg font-bold block text-center">{identificationResult.conservationStatus}</span>
                    </div>
                  )}
                </div>

                <p className="text-gray-300 leading-relaxed mb-6 border-l-4 border-cyan-500 pl-4 italic">
                  {identificationResult.description || "No description available for this species."}
                </p>

                <div className="flex flex-wrap gap-3">
                  {identificationResult.wormsMetadata?.isMarine && (
                    <span className="px-3 py-1 bg-blue-900/50 text-blue-200 rounded-full text-sm flex items-center gap-2 border border-blue-700/50">
                      <BiWater /> Marine
                    </span>
                  )}
                  {identificationResult.wormsMetadata?.isFreshwater && (
                    <span className="px-3 py-1 bg-green-900/50 text-green-200 rounded-full text-sm flex items-center gap-2 border border-green-700/50">
                      <FiDroplet /> Freshwater
                    </span>
                  )}
                  {identificationResult.wormsMetadata?.isBrackish && (
                    <span className="px-3 py-1 bg-amber-900/50 text-amber-200 rounded-full text-sm flex items-center gap-2 border border-amber-700/50">
                      <FiActivity /> Brackish
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-gray-50">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Taxonomy & External Links */}
              <div className="space-y-8">
                {/* Taxonomy Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-cyan-50 px-6 py-4 border-b border-cyan-100 flex items-center gap-2">
                    <FiLayers className="text-cyan-600" />
                    <h3 className="font-bold text-gray-800">Taxonomic Hierarchy</h3>
                  </div>
                  <div className="p-6">
                    {identificationResult.taxonomicHierarchy ? (
                      <div className="relative border-l-2 border-gray-200 ml-3 space-y-4 py-2">
                        {['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species'].map((rank) => {
                          const value = identificationResult.taxonomicHierarchy[rank];
                          if (!value) return null;
                          return (
                            <div key={rank} className="relative pl-6 group">
                              <span className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-gray-300 group-hover:border-cyan-500 transition-colors"></span>
                              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-0.5">{rank}</p>
                              <p className="text-gray-800 font-medium group-hover:text-cyan-700 transition-colors">{value}</p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">Taxonomy data unavailable</p>
                    )}
                  </div>
                </div>

                {/* External Links Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <FiExternalLink className="text-gray-600" />
                    <h3 className="font-bold text-gray-800">External Resources</h3>
                  </div>
                  <div className="p-6 flex flex-col gap-3">
                    {identificationResult.externalLinks?.wikipedia && (
                      <a 
                        href={identificationResult.externalLinks.wikipedia} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                      >
                        <span className="font-medium text-gray-700 group-hover:text-gray-900">Wikipedia</span>
                        <FiExternalLink className="text-gray-400 group-hover:text-gray-600" />
                      </a>
                    )}
                    {identificationResult.wormsMetadata?.url && (
                      <a 
                        href={identificationResult.wormsMetadata.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors group"
                      >
                        <span className="font-medium text-blue-700 group-hover:text-blue-900">WoRMS Database</span>
                        <FiExternalLink className="text-blue-400 group-hover:text-blue-600" />
                      </a>
                    )}
                    {identificationResult.externalLinks?.fishbase && (
                      <a 
                        href={identificationResult.externalLinks.fishbase} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg bg-cyan-50 hover:bg-cyan-100 transition-colors group"
                      >
                        <span className="font-medium text-cyan-700 group-hover:text-cyan-900">FishBase</span>
                        <FiExternalLink className="text-cyan-400 group-hover:text-cyan-600" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Middle & Right Columns: Details */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Morphology & Ecology Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Morphology */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                      <MdOutlineScience className="text-purple-600 text-xl" />
                      Morphology
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-gray-600">
                          <FaRulerHorizontal className="text-gray-400" />
                          <span>Max Length</span>
                        </div>
                        <span className="font-semibold text-gray-800">
                          {identificationResult.morphology?.maxLength ? `${identificationResult.morphology.maxLength} cm` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-gray-600">
                          <FaWeightHanging className="text-gray-400" />
                          <span>Max Weight</span>
                        </div>
                        <span className="font-semibold text-gray-800">
                          {identificationResult.morphology?.maxWeight ? `${identificationResult.morphology.maxWeight} kg` : 'N/A'}
                        </span>
                      </div>
                      
                      {identificationResult.morphology?.distinctiveFeatures && (
                        <div className="mt-4">
                          <p className="text-sm font-semibold text-gray-500 mb-2 uppercase">Distinctive Features</p>
                          <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                            {identificationResult.morphology.distinctiveFeatures.map((feature, idx) => (
                              <li key={idx}>{feature}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ecology */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                      <FiGlobe className="text-green-600 text-xl" />
                      Ecology
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <FiTarget className="text-gray-400" />
                          <span className="font-medium">Depth Range</span>
                        </div>
                        <p className="text-gray-800 pl-6">
                          {identificationResult.ecology?.depthRange?.min || 0} - {identificationResult.ecology?.depthRange?.max || '?'} meters
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <FiActivity className="text-gray-400" />
                          <span className="font-medium">Diet</span>
                        </div>
                        <p className="text-gray-700 text-sm pl-6 leading-relaxed">
                          {identificationResult.ecology?.diet || "Dietary information not available."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Habitat & Distribution (Full Width) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                    <FiMapPin className="text-red-500 text-xl" />
                    Habitat & Distribution
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Habitat</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {identificationResult.habitat || "Habitat information not available."}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Distribution</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {identificationResult.distribution || "Distribution information not available."}
                      </p>
                    </div>
                  </div>
                  
                  {identificationResult.ecology?.behavior && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <h4 className="font-semibold text-gray-700 mb-2">Behavior</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {identificationResult.ecology.behavior}
                      </p>
                    </div>
                  )}
                </div>

                {/* Economic Importance */}
                {identificationResult.economicImportance && (
                  <div className="bg-amber-50 rounded-xl border border-amber-100 p-6">
                    <h3 className="text-lg font-bold text-amber-800 mb-2">Economic Importance</h3>
                    <p className="text-amber-900/80 text-sm">
                      {identificationResult.economicImportance}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 pt-4">
                  <button
                    onClick={handleExportPDF}
                    disabled={exporting}
                    className={`flex-1 px-6 py-4 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-1 ${
                      exporting
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:shadow-cyan-500/30"
                    } flex items-center justify-center gap-3`}
                  >
                    {exporting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    ) : (
                      <FiDownload className="text-xl" />
                    )}
                    {exporting ? "Generating Report..." : "Download Species Report"}
                  </button>

                  <button
                    onClick={handleTryAnother}
                    className="px-6 py-4 rounded-xl font-bold text-gray-700 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all"
                  >
                    Identify Another
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all animate-fade-in">
            {/* Animated Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-cyan-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-cyan-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
            </div>

            {/* Processing Message */}
            <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
              Identifying Species
            </h3>
            <p className="text-sm text-gray-600 text-center mb-6 animate-pulse">
              {processingMessage}
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${processingProgress}%` }}
              ></div>
            </div>

            {/* Progress Percentage */}
            <p className="text-center text-sm font-semibold text-cyan-600 mt-3">
              {Math.round(processingProgress)}%
            </p>

            {/* Fun Fact or Tips */}
            <div className="mt-6 p-4 bg-cyan-50 rounded-lg border border-cyan-100">
              <p className="text-xs text-cyan-800 text-center italic">
                💡 Our AI analyzes morphological features, color patterns, and distinctive characteristics to identify species
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdentifyTab;




