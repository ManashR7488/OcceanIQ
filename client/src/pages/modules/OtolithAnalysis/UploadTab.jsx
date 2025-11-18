import React, { useState } from "react";
import { FiUpload, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import axiosInstance from "../../../config/axios.config";
import { toast } from "react-toastify";

const UploadTab = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form data
  const [formData, setFormData] = useState({
    collectionDate: "",
    location: "",
    depth: "",
    collector: "",
    notes: "",
  });

  // File selection handler
  const handleFileSelect = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/tiff"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Only JPG, PNG, and TIFF files are allowed.");
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("File size exceeds 10MB limit.");
      return;
    }

    setSelectedFile(file);

    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Form input handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Upload handler
  const handleUpload = async (e) => {
    e.preventDefault();

    // Validation
    if (!selectedFile) {
      toast.error("Please select an otolith image");
      return;
    }

    if (!formData.collectionDate || !formData.location) {
      toast.error("Collection date and location are required");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Create FormData
      const uploadData = new FormData();
      uploadData.append("otolithImage", selectedFile);
      uploadData.append("collectionDate", formData.collectionDate);
      uploadData.append("location", formData.location);
      if (formData.depth) uploadData.append("depth", formData.depth);
      if (formData.collector) uploadData.append("collector", formData.collector);
      if (formData.notes) uploadData.append("notes", formData.notes);

      // Upload to backend
      const response = await axiosInstance.post("/otolith/upload", uploadData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        },
      });

      toast.success(
        response.data.message || "Otolith uploaded successfully to Cloudinary!"
      );

      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setFormData({
        collectionDate: "",
        location: "",
        depth: "",
        collector: "",
        notes: "",
      });
      setUploadProgress(0);

      // Notify parent component
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to upload otolith image";
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-3">
          <FiAlertCircle className="text-2xl text-cyan-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Step 1: Upload Image to Cloudinary
            </h3>
            <p className="text-gray-600 text-sm">
              Upload your otolith image to cloud storage. The image will be
              saved with status <strong>"pending"</strong>. You can analyze it
              later from the Gallery tab.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleUpload} className="space-y-6">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Otolith Image <span className="text-red-500">*</span>
          </label>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-cyan-500 transition-colors duration-300">
            {previewUrl ? (
              <div className="space-y-4">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-64 mx-auto rounded-lg shadow-md"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Remove Image
                </button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <FiUpload className="text-5xl text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 font-medium mb-2">
                  Click to select otolith image
                </p>
                <p className="text-sm text-gray-500">
                  JPG, PNG, or TIFF (max 10MB)
                </p>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.tiff,.tif"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Sample Metadata Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Collection Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Collection Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="collectionDate"
              value={formData.collectionDate}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., North Atlantic, 60°N 10°W"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          {/* Depth */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Depth (meters)
            </label>
            <input
              type="number"
              name="depth"
              value={formData.depth}
              onChange={handleInputChange}
              placeholder="e.g., 150"
              min="0"
              step="0.1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          {/* Collector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Collector Name
            </label>
            <input
              type="text"
              name="collector"
              value={formData.collector}
              onChange={handleInputChange}
              placeholder="e.g., Dr. Smith"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Any additional observations or metadata..."
            rows={4}
            maxLength={1000}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.notes.length}/1000 characters
          </p>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Uploading to Cloudinary...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading || !selectedFile}
          className={`
            w-full py-4 rounded-lg font-semibold text-white text-lg
            transition-all duration-300 shadow-md hover:shadow-lg
            flex items-center justify-center gap-3
            ${
              uploading || !selectedFile
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            }
          `}
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <FiUpload className="text-xl" />
              <span>Upload to Cloudinary</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default UploadTab;
