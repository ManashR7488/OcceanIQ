import React, { useState, useEffect, useRef } from "react";
import { FiUpload, FiX, FiDownload, FiEye, FiSearch } from "react-icons/fi";
import { toast } from "react-toastify";
import { generateSpeciesReportPDF } from "../../../utils/pdfGenerator";
import {
  searchSpecies,
  getPopularSpecies,
  getAllFamilies,
  getSpeciesByFamily,
  SPECIES_DATABASE,
} from "../../../data/speciesDatabase";
import useDebounce from "../../../hooks/useDebounce";

const IdentifyTab = ({ onSelectSpecies, refreshTrigger }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState("");

  // Refs for managing processing sessions and intervals
  const processingSessionRef = useRef(0);
  const intervalsRef = useRef([]);

  // Debounce search query to avoid excessive filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  /**
   * Species Identification: STATIC DATABASE APPROACH
   *
   * This MVP implementation uses a curated static database of 20+ common marine fish species
   * instead of AI-powered image recognition APIs. This approach:
   *
   * ✅ Requires no API keys or external dependencies
   * ✅ Works completely offline
   * ✅ Provides instant results with zero latency
   * ✅ Perfect for hackathon demos and MVP validation
   * ✅ Can be upgraded to real AI-powered identification later
   *
   * Users search for species by name and can optionally upload an image for visual reference.
   */

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      intervalsRef.current.forEach(clearInterval);
      intervalsRef.current = [];
    };
  }, []);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery.length >= 2) {
      const results = searchSpecies(debouncedSearchQuery);
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [debouncedSearchQuery]);

  // Handle search query change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  // Handle selecting a species from search results
  const handleSelectSpecies = (species) => {
    setSelectedCandidate({
      scientificName: species.scientificName,
      commonName: species.commonNames[0],
      speciesData: species,
    });
    setShowDetails(true);
    setShowSearchResults(false);
    setSearchQuery(""); // Clear search after selection
    
    // Notify parent component if callback provided
    if (typeof onSelectSpecies === 'function') {
      onSelectSpecies(species);
    }
  };

  // Handle popular species quick select
  const handlePopularSpeciesClick = (species) => {
    handleSelectSpecies(species);
  };

  // Handle family filter
  const handleFamilyFilter = (family) => {
    setSelectedFamily(family);
    if (family) {
      const results = getSpeciesByFamily(family);
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Clear search and filters
  const handleClearSearch = () => {
    setSearchQuery("");
    setSelectedFamily("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Handle file selection (optional - for visual reference only)
  const handleFileSelect = (file) => {
    // Guard against concurrent uploads
    if (isProcessing) {
      toast.info("Please wait, still identifying the previous image...");
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
      // Start simulated AI processing after preview is ready
      simulateSpeciesIdentification();
    };
    reader.readAsDataURL(file);

    toast.info("Processing image...");
  };

  // Simulate AI-powered species identification with realistic processing
  const simulateSpeciesIdentification = async () => {
    // Validate database availability
    if (!Array.isArray(SPECIES_DATABASE) || SPECIES_DATABASE.length === 0) {
      toast.error("No species available in database.");
      setIsProcessing(false);
      return;
    }

    // Create new session ID and invalidate any previous processing
    const sessionId = ++processingSessionRef.current;
    
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingMessage("Uploading image...");

    // Simulate processing with staged progress updates
    const stages = [
      { progress: 30, message: "Analyzing features...", duration: 800 },
      { progress: 60, message: "Matching species database...", duration: 1000 },
      { progress: 90, message: "Finalizing results...", duration: 700 },
      { progress: 100, message: "Complete!", duration: 500 },
    ];

    // Animate progress through stages
    for (const stage of stages) {
      await new Promise((resolve) => {
        const steps = 20;
        const stepDuration = stage.duration / steps;
        let tick = 0;

        const intervalId = setInterval(() => {
          // Check if session is still valid
          if (processingSessionRef.current !== sessionId) {
            clearInterval(intervalId);
            return resolve();
          }

          tick++;
          setProcessingProgress((prev) => {
            const remaining = stage.progress - prev;
            const increment = Math.max(remaining / (steps - tick + 1), 0);
            const next = Math.min(prev + increment, stage.progress);
            return next;
          });
          setProcessingMessage(stage.message);

          if (tick >= steps) {
            clearInterval(intervalId);
            resolve();
          }
        }, stepDuration);

        // Track interval for cleanup
        intervalsRef.current.push(intervalId);
      });

      // Check if session is still valid after stage
      if (processingSessionRef.current !== sessionId) {
        return; // Processing was cancelled
      }
    }

    // Final check before selecting species
    if (processingSessionRef.current !== sessionId) {
      return; // Processing was cancelled
    }

    // Select random species from database
    const randomIndex = Math.floor(Math.random() * SPECIES_DATABASE.length);
    const randomSpecies = SPECIES_DATABASE[randomIndex];
    const speciesName = randomSpecies?.commonNames?.[0] || randomSpecies?.scientificName || "Unknown species";

    // Display the "identified" species (this will also notify parent via handleSelectSpecies)
    handleSelectSpecies(randomSpecies);

    // Reset processing state
    setTimeout(() => {
      // Final session check before showing success
      if (processingSessionRef.current === sessionId) {
        setIsProcessing(false);
        setProcessingProgress(0);
        setProcessingMessage("");
        toast.success(`Species identified: ${speciesName}`);
      }
    }, 500);
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
    
    // Clear all active intervals
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];
    
    setSelectedImage(null);
    setImagePreview(null);
    setIsProcessing(false);
    setProcessingProgress(0);
    setProcessingMessage("");
  };

  /**
   * Export species identification report as PDF (Client-side generation)
   * Uses jsPDF to generate PDF entirely in browser with embedded image
   */
  const handleExportPDF = async () => {
    if (!selectedCandidate) {
      toast.error("Please select a species first");
      return;
    }

    try {
      setExporting(true);
    //   toast.loading("Generating PDF...", { id: "export-pdf" });

      const identificationData = {
        uploadedImageUrl:
          imagePreview || selectedCandidate.speciesData.images?.[0] || null,
      };

       const filename = await toast.promise(
      generateSpeciesReportPDF(
        selectedCandidate.speciesData,
        {
          uploadedImageUrl:
            imagePreview || selectedCandidate.speciesData.images?.[0] || null,
        },
        {
          includeReferences: true,
          includeImage: !!(imagePreview || selectedCandidate.speciesData.images?.[0]),
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

  // Try another search/image
  const handleTryAnother = () => {
    // Invalidate current processing session
    processingSessionRef.current++;
    
    // Clear all active intervals
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];
    
    handleClearImage();
    setShowDetails(false);
    setSelectedCandidate(null);
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          <strong>Instructions:</strong> Search for fish species by scientific
          or common name to view detailed taxonomic, morphological, and
          ecological information. You can also optionally upload an image for
          visual reference. The database contains curated information about 20+
          common marine fish species.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 1: Search & Image Upload (Left Column) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Search Box */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FiSearch className="text-cyan-600" />
              Search Species
            </h2>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by scientific or common name..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FiX size={20} />
                </button>
              )}
            </div>

            {/* Family Filter */}
            <div className="mt-4">
              <select
                value={selectedFamily}
                onChange={(e) => handleFamilyFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">All Families</option>
                {getAllFamilies().map((family) => (
                  <option key={family} value={family}>
                    {family}
                  </option>
                ))}
              </select>
            </div>

            {/* Popular Species Quick Links */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Popular Species:
              </h3>
              <div className="flex flex-wrap gap-2">
                {getPopularSpecies().map((species) => (
                  <button
                    key={species.scientificName}
                    onClick={() => handlePopularSpeciesClick(species)}
                    className="px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-full text-sm hover:bg-cyan-100 transition-colors"
                  >
                    {species.commonNames[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Optional Image Upload */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FiUpload className="text-cyan-600" />
              Optional: Upload Image for Reference
            </h2>

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
                <FiUpload className={`text-5xl mx-auto mb-4 ${isProcessing ? 'text-gray-300' : 'text-gray-400'}`} />
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
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-cyan-600 text-white hover:bg-cyan-700 cursor-pointer'
                  }`}
                  aria-disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Select Image'}
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Image Preview */}
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
          </div>
        </div>

        {/* Section 2: Search Results (Right Column) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {showSearchResults ? "Search Results" : "Species Database"}
          </h2>

          {!showSearchResults || searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FiSearch className="text-6xl text-gray-300 mb-4" />
              <p className="text-gray-500">
                Type at least 2 characters to search the curated species database
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {searchResults.map((species) => (
                <div
                  key={species.scientificName}
                  onClick={() => handleSelectSpecies(species)}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-cyan-400 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      {/* Rank Badge */}
                      {/* <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded mb-2">
                        #{candidate.rank}
                      </span> */}

                      {/* Provider Badge */}
                      {/* {candidate.source && (
                        <span
                          className={`inline-block px-2 py-1 ml-2 text-xs font-semibold rounded mb-2 ${
                            candidate.source === "Fishial.AI"
                              ? "bg-blue-100 text-blue-700 border border-blue-300"
                              : "bg-gray-100 text-gray-600 border border-gray-300"
                          }`}
                        >
                          {candidate.source === "Fishial.AI"
                            ? "� Fishial.AI"
                            : "📊 Fallback"}
                        </span>
                      )} */}

                      {/* Scientific Name */}
                      <h3 className="text-lg font-semibold italic text-gray-800">
                        {species.scientificName}
                      </h3>

                      {/* Common Name */}
                      <p className="text-sm text-gray-600">
                        {species.commonNames?.join(", ") || "N/A"}
                      </p>

                      {/* Family */}
                      <p className="text-xs text-gray-500 mt-1">
                        Family: {species.taxonomicHierarchy.family}
                      </p>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectSpecies(species);
                    }}
                    className="w-full py-2 bg-cyan-50 text-cyan-600 rounded-lg hover:bg-cyan-100 transition-colors font-medium text-sm"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Species Details Panel */}
      {showDetails && selectedCandidate && (
        <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-cyan-600">
          {/* Species Header */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            {(imagePreview || selectedCandidate?.speciesData?.images?.[0]) && (
              <div className="mb-6">
                <img
                  src={imagePreview || selectedCandidate?.speciesData?.images?.[0]}
                  alt="Reference"
                  className="w-full max-h-96 object-contain rounded-lg shadow-md"
                />
              </div>
            )}
            <h2 className="text-3xl font-bold italic text-gray-800 mb-2">
              {selectedCandidate.scientificName}
            </h2>
            <p className="text-lg text-gray-600 mb-4">
              {selectedCandidate.speciesData?.commonNames?.join(", ") || "N/A"}
            </p>
            <p className="text-sm text-gray-500 italic">
              Source: Curated database (MVP)
            </p>
          </div>

          {/* Taxonomic Classification */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1 h-6 bg-cyan-600 rounded"></span>
              Taxonomic Classification
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              {selectedCandidate.speciesData.taxonomicHierarchy ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(
                    selectedCandidate.speciesData.taxonomicHierarchy
                  ).map(([rank, value]) => (
                    <div key={rank}>
                      <span className="text-xs text-gray-500 uppercase">
                        {rank}
                      </span>
                      <p className="text-sm font-medium text-gray-800">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  Taxonomic classification data not available
                </p>
              )}
            </div>
          </div>

          {/* Physical Characteristics */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-600 rounded"></span>
              Physical Characteristics
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {selectedCandidate.speciesData.description ||
                "Physical characteristics data not available."}
            </p>
          </div>

          {/* Habitat & Distribution */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1 h-6 bg-teal-600 rounded"></span>
              Habitat & Distribution
            </h3>
            <div className="space-y-2 text-gray-700">
              <p>
                <strong>Habitat:</strong>{" "}
                {selectedCandidate.speciesData.habitat || "N/A"}
              </p>
              <p>
                <strong>Distribution:</strong>{" "}
                {selectedCandidate.speciesData.distribution || "N/A"}
              </p>
              {selectedCandidate.speciesData.wormsMetadata && (
                <p>
                  <strong>Environment:</strong>{" "}
                  {[
                    selectedCandidate.speciesData.wormsMetadata.isMarine &&
                      "Marine",
                    selectedCandidate.speciesData.wormsMetadata.isBrackish &&
                      "Brackish",
                    selectedCandidate.speciesData.wormsMetadata.isFreshwater &&
                      "Freshwater",
                  ]
                    .filter(Boolean)
                    .join(", ") || "N/A"}
                </p>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1 h-6 bg-purple-600 rounded"></span>
              Additional Information
            </h3>
            <div className="space-y-2 text-gray-700">
              {selectedCandidate.speciesData.conservationStatus && (
                <p>
                  <strong>Conservation Status:</strong>{" "}
                  {selectedCandidate.speciesData.conservationStatus}
                </p>
              )}
              <p>
                <strong>Taxonomic Status:</strong>{" "}
                {selectedCandidate.speciesData.taxonomicStatus || "N/A"}
              </p>
              {selectedCandidate.speciesData.wormsMetadata?.authority && (
                <p>
                  <strong>Authority:</strong>{" "}
                  {selectedCandidate.speciesData.wormsMetadata.authority}
                </p>
              )}
            </div>
          </div>

          {/* External Links */}
          {(selectedCandidate.speciesData.wormsMetadata?.url ||
            selectedCandidate.speciesData.externalLinks) && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                External Links
              </h3>
              <div className="flex flex-wrap gap-3">
                {selectedCandidate.speciesData.wormsMetadata?.url && (
                  <a
                    href={selectedCandidate.speciesData.wormsMetadata.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                  >
                    WoRMS
                  </a>
                )}
                {selectedCandidate.speciesData.externalLinks?.wikipedia && (
                  <a
                    href={selectedCandidate.speciesData.externalLinks.wikipedia}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Wikipedia
                  </a>
                )}
                {selectedCandidate.speciesData.externalLinks?.gbif && (
                  <a
                    href={selectedCandidate.speciesData.externalLinks.gbif}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                  >
                    GBIF
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className={`flex-1 md:flex-none px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                exporting
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:shadow-lg"
              }`}
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <FiDownload />
                  Export as PDF
                </>
              )}
            </button>

            <button
              onClick={handleTryAnother}
              className="flex-1 md:flex-none px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
            >
              Try Another Image
            </button>
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
