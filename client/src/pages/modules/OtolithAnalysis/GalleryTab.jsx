import React, { useState, useEffect } from "react";
import {
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiTrash2,
  FiSearch,
  FiFilter,
} from "react-icons/fi";
import axiosInstance from "../../../config/axios.config";
import { toast } from "react-toastify";

const GalleryTab = ({ onSelectOtolith, refreshTrigger }) => {
  const [otoliths, setOtoliths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    status: "",
    species: "",
    search: "",
  });

  // Fetch otoliths
  const fetchOtoliths = async () => {
    try {
      setLoading(true);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.status) params.status = filters.status;
      if (filters.species) params.species = filters.species;

      const response = await axiosInstance.get("/otolith/measurements", { params });

      setOtoliths(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Fetch otoliths error:", error);
      toast.error(error.response?.data?.message || "Failed to fetch otoliths");
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchOtoliths();
  }, [pagination.page, pagination.limit, filters.status, filters.species, refreshTrigger]);

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this otolith sample?")) {
      return;
    }

    try {
      await axiosInstance.delete(`/otolith/measurements/${id}`);
      toast.success("Otolith deleted successfully");
      fetchOtoliths();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.message || "Failed to delete otolith");
    }
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      pending: {
        icon: FiClock,
        label: "Pending",
        color: "bg-yellow-100 text-yellow-800",
        iconColor: "text-yellow-600",
      },
      processing: {
        icon: FiClock,
        label: "Processing",
        color: "bg-blue-100 text-blue-800",
        iconColor: "text-blue-600",
      },
      completed: {
        icon: FiCheckCircle,
        label: "Analyzed",
        color: "bg-green-100 text-green-800",
        iconColor: "text-green-600",
      },
      failed: {
        icon: FiXCircle,
        label: "Failed",
        color: "bg-red-100 text-red-800",
        iconColor: "text-red-600",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}
      >
        <Icon className={config.iconColor} />
        {config.label}
      </span>
    );
  };

  // Confidence badge component
  const ConfidenceBadge = ({ confidence }) => {
    if (confidence === null || confidence === undefined) return null;

    let color = "bg-gray-100 text-gray-800";
    if (confidence >= 80) color = "bg-green-100 text-green-800";
    else if (confidence >= 60) color = "bg-yellow-100 text-yellow-800";
    else if (confidence >= 40) color = "bg-orange-100 text-orange-800";
    else color = "bg-red-100 text-red-800";

    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${color}`}>
        {confidence}% confidence
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-600" />
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, status: e.target.value }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Analyzed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Species Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <FiSearch className="text-gray-600" />
            <input
              type="text"
              placeholder="Search by species..."
              value={filters.species}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, species: e.target.value }));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          {/* Items per page */}
          <select
            value={pagination.limit}
            onChange={(e) => {
              setPagination((prev) => ({
                ...prev,
                limit: parseInt(e.target.value),
                page: 1,
              }));
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value={12}>12 per page</option>
            <option value={24}>24 per page</option>
            <option value={48}>48 per page</option>
          </select>
        </div>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent" />
        </div>
      ) : otoliths.length === 0 ? (
        <div className="text-center py-20">
          <FiSearch className="text-6xl text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Otoliths Found
          </h3>
          <p className="text-gray-500">
            {filters.status || filters.species
              ? "Try adjusting your filters"
              : "Upload your first otolith sample to get started"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {otoliths.map((otolith) => (
            <div
              key={otolith._id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group"
            >
              {/* Image */}
              <div className="relative h-48 bg-gray-100 overflow-hidden">
                <img
                  src={otolith.thumbnailUrl}
                  alt={`Otolith ${otolith.sampleId}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {/* Status Badge Overlay */}
                <div className="absolute top-2 right-2">
                  <StatusBadge status={otolith.analysisStatus} />
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Sample ID */}
                <h4 className="font-semibold text-gray-800 truncate">
                  {otolith.sampleId}
                </h4>

                {/* Species (if analyzed) */}
                {otolith.speciesIdentified && (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600 truncate">
                      {otolith.speciesIdentified}
                    </p>
                    <ConfidenceBadge confidence={otolith.speciesConfidence} />
                  </div>
                )}

                {/* Metadata */}
                <div className="text-xs text-gray-500 space-y-1">
                  <p>
                    📍{" "}
                    {otolith.sampleMetadata.location.substring(0, 30)}
                    {otolith.sampleMetadata.location.length > 30 ? "..." : ""}
                  </p>
                  <p>
                    📅{" "}
                    {new Date(
                      otolith.sampleMetadata.collectionDate
                    ).toLocaleDateString()}
                  </p>
                  {otolith.sampleMetadata.depth && (
                    <p>🌊 {otolith.sampleMetadata.depth}m depth</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => onSelectOtolith(otolith)}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleDelete(otolith._id)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300"
                    aria-label="Delete otolith"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-6">
          <button
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
            }
            disabled={pagination.page === 1}
            className="px-4 py-2 bg-white rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-300"
          >
            Previous
          </button>

          <span className="px-4 py-2 text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <button
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
            }
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 bg-white rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-300"
          >
            Next
          </button>
        </div>
      )}

      {/* Results Info */}
      {!loading && otoliths.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
          {pagination.total} samples
        </div>
      )}
    </div>
  );
};

export default GalleryTab;
