import React, { useState } from 'react';
import axiosInstance from '../../config/axios.config';
import { toast } from 'react-toastify';
import { FiSearch, FiX, FiImage, FiExternalLink, FiMapPin, FiCalendar, FiUser, FiAward, FiGlobe } from 'react-icons/fi';

const Section3 = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!searchQuery.trim()) {
      toast.warning('Please enter a scientific name');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await axiosInstance.get('/map/species-images', {
        params: {
          scientificname: searchQuery.trim()
        }
      });
      console.log(response.data.images);
      setImages(response.data.images || []);
      
      if (response.data.images.length === 0) {
        toast.info('No images found for this species');
      } else {
        toast.success(`Found ${response.data.images.length} images`);
      }
    } catch (err) {
      console.error('Error fetching species images:', err);
      setError(err.response?.data?.message || 'Failed to fetch images');
      toast.error(err.response?.data?.message || 'Failed to fetch species images');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setImages([]);
    setError(null);
    setHasSearched(false);
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const closeOverlay = () => {
    setSelectedImage(null);
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Overlay Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={closeOverlay}
        >
          <div 
            className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Side - Image */}
            <div className="md:w-1/2 bg-gray-900 flex items-center justify-center p-4">
              <img
                src={selectedImage.url}
                alt={selectedImage.alt || selectedImage.scientificName}
                className="max-w-full max-h-[80vh] object-contain rounded"
              />
            </div>

            {/* Right Side - Details */}
            <div className="md:w-1/2 overflow-y-auto p-6">
              {/* Close Button */}
              <button
                onClick={closeOverlay}
                className="float-right text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={24} />
              </button>

              {/* Species Information */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {selectedImage.scientificName}
                </h2>
                {selectedImage.commonName && (
                  <p className="text-lg text-gray-600 mb-2">
                    {selectedImage.commonName}
                  </p>
                )}
                {selectedImage.title && (
                  <p className="text-sm text-gray-500 italic">
                    {selectedImage.title}
                  </p>
                )}
              </div>

              {/* Details Grid */}
              <div className="space-y-4">
                {/* Observer */}
                {selectedImage.observerName && (
                  <div className="flex items-start gap-3">
                    <FiUser className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Observer</p>
                      <p className="text-sm text-gray-600">
                        {selectedImage.observerName}
                        {selectedImage.observerLogin && (
                          <span className="text-gray-400"> (@{selectedImage.observerLogin})</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Date Observed */}
                {selectedImage.dateObserved && (
                  <div className="flex items-start gap-3">
                    <FiCalendar className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Date Observed</p>
                      <p className="text-sm text-gray-600">{selectedImage.dateObserved}</p>
                    </div>
                  </div>
                )}

                {/* Location */}
                {selectedImage.location && (
                  <div className="flex items-start gap-3">
                    <FiMapPin className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Location</p>
                      <p className="text-sm text-gray-600">{selectedImage.location}</p>
                      {selectedImage.coordinates && (
                        <p className="text-xs text-gray-500 mt-1">
                          Coordinates: {selectedImage.coordinates[1].toFixed(4)}°N, {selectedImage.coordinates[0].toFixed(4)}°E
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Quality Grade */}
                {selectedImage.qualityGrade && (
                  <div className="flex items-start gap-3">
                    <FiAward className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Quality Grade</p>
                      <p className="text-sm text-gray-600 capitalize">
                        {selectedImage.qualityGrade.replace('_', ' ')}
                        {selectedImage.idCount && (
                          <span className="text-gray-500"> • {selectedImage.idCount} identifications</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* License */}
                {selectedImage.license && (
                  <div className="flex items-start gap-3">
                    <FiImage className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">License</p>
                      <p className="text-sm text-gray-600">{selectedImage.license}</p>
                      {selectedImage.attribution && (
                        <p className="text-xs text-gray-500 mt-1">{selectedImage.attribution}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Source */}
                {selectedImage.source && (
                  <div className="flex items-start gap-3">
                    <FiGlobe className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Source</p>
                      <p className="text-sm text-gray-600">{selectedImage.source}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
                {selectedImage.wikiUrl && (
                  <a
                    href={selectedImage.wikiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <FiGlobe size={16} />
                    View on Wikipedia
                  </a>
                )}
                <button
                  onClick={closeOverlay}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar - Search Panel */}
      <div className="w-80 bg-white shadow-lg overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <FiImage className="text-blue-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-800">Species Images</h2>
            </div>
            <p className="text-sm text-gray-600">
              Search for marine species images by scientific name
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scientific Name
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="scientific name (e.g., Thunnus albacares)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FiSearch size={18} />
                {loading ? 'Searching...' : 'Search'}
              </button>
              
              {(searchQuery || hasSearched) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <FiX size={18} />
                </button>
              )}
            </div>
          </form>

          {/* Info Panel */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              About This Feature
            </h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Search by scientific name (e.g., species binomial)</li>
              <li>• Images sourced from iNaturalist observations</li>
              <li>• Click any image to view detailed information</li>
              <li>• View observer credits and observation details</li>
            </ul>
          </div>

          {/* iNaturalist Attribution */}
          <div className="mt-4 p-3 bg-gray-100 rounded-lg">
            <p className="text-xs text-gray-600">
              Images and data provided by{' '}
              <a
                href="https://www.inaturalist.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                iNaturalist
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right Content Area - Image Gallery */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Searching for images...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Empty State - No Search Yet */}
        {!hasSearched && !loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <FiImage className="mx-auto mb-4 text-gray-400" size={64} />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Search for Species Images
              </h3>
              <p className="text-gray-500">
                Enter a scientific name to find marine species images
              </p>
            </div>
          </div>
        )}

        {/* Empty State - No Results */}
        {hasSearched && !loading && images.length === 0 && !error && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <FiImage className="mx-auto mb-4 text-gray-400" size={64} />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Images Found
              </h3>
              <p className="text-gray-500">
                Try searching with a different scientific name
              </p>
            </div>
          </div>
        )}

        {/* Image Gallery */}
        {images.length > 0 && !loading && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Results for "{searchQuery}"
              </h2>
              <p className="text-gray-600">
                Found {images.length} images
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {images.map((image) => (
                <div
                  key={image.id || `${image.scientificName}-${Math.random()}`}
                  className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                  onClick={() => handleImageClick(image)}
                >
                  {/* Image */}
                  <div className="relative aspect-video overflow-hidden z-[2]">
                    <img
                      src={image?.url}
                      alt={image.alt || image.scientificName}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
                      <FiExternalLink
                        className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        size={32}
                      />
                    </div>
                  </div>

                  {/* Info Card */}
                  <div className="p-3 bg-white">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {image.scientificName}
                    </p>
                    {image.commonName && (
                      <p className="text-xs text-gray-500 truncate">
                        {image.commonName}
                      </p>
                    )}
                    {image.observerName && (
                      <p className="text-xs text-gray-600 truncate mt-1">
                        by {image.observerName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Section3;
