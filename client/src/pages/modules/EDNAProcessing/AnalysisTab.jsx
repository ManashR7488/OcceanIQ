import { useState, useEffect } from 'react';
import {
  FiPlay,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiInfo,
  FiBook,
  FiImage,
  FiAward,
  FiExternalLink,
  FiX,
} from 'react-icons/fi';
import axios from '../../../config/axios.config';
import { toast } from 'react-toastify';

const AnalysisTab = ({ refreshTrigger, selectedSample: propSelectedSample }) => {
  const [samples, setSamples] = useState([]);
  const [selectedSample, setSelectedSample] = useState(propSelectedSample);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedSpecies, setExpandedSpecies] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Update local state when prop changes
  useEffect(() => {
    if (propSelectedSample) {
      setSelectedSample(propSelectedSample);
    }
  }, [propSelectedSample]);

  const fetchPendingSamples = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/edna/samples', {
        params: { status: 'pending', limit: 50 },
      });

      if (response.data.success) {
        setSamples(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching pending samples:', error);
      toast.error('Failed to load samples');
    } finally {
      setLoading(false);
    }
  };

  const fetchSampleDetails = async (sampleId) => {
    try {
      const response = await axios.get(`/edna/samples/${sampleId}`);
      
      if (response.data.success) {
        setSelectedSample(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching sample details:', error);
      toast.error('Failed to load sample details');
    }
  };

  useEffect(() => {
    fetchPendingSamples();
  }, [refreshTrigger]);

  const handleAnalyze = async (sampleId) => {
    setAnalyzing(true);

    try {
      const response = await axios.post(`/edna/analyze/${sampleId}`);

      if (response.data.success) {
        toast.success('Analysis completed successfully!');
        setSelectedSample(response.data.data);
        fetchPendingSamples(); // Refresh pending list
      }
    } catch (error) {
      console.error('Error analyzing sample:', error);
      toast.error(error.response?.data?.message || 'Failed to analyze sample');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectSample = (sampleId) => {
    fetchSampleDetails(sampleId);
  };

  // Helper function to render taxonomy tree
  const renderTaxonomyTree = (taxonomy) => {
    if (!taxonomy) return null;

    const levels = [
      { key: 'kingdom', label: 'Kingdom', color: 'text-purple-600', indent: 0 },
      { key: 'phylum', label: 'Phylum', color: 'text-blue-600', indent: 1 },
      { key: 'class', label: 'Class', color: 'text-green-600', indent: 2 },
      { key: 'order', label: 'Order', color: 'text-yellow-600', indent: 3 },
      { key: 'family', label: 'Family', color: 'text-orange-600', indent: 4 },
      { key: 'genus', label: 'Genus', color: 'text-red-600', indent: 5 },
      { key: 'species', label: 'Species', color: 'text-pink-600', indent: 6 },
    ];

    return (
      <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
        {levels.map((level) => {
          const value = taxonomy[level.key];
          if (!value) return null;

          return (
            <div key={level.key} style={{ marginLeft: `${level.indent * 20}px` }} className="py-1">
              <span className="text-gray-500">{level.indent > 0 && '└─ '}</span>
              <span className="text-gray-700 font-medium">{level.label}:</span>{' '}
              <span className={`${level.color} font-semibold`}>{value}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Helper function to get conservation status color
  const getConservationColor = (status) => {
    const statusMap = {
      'Critically Endangered': 'bg-red-600',
      'Endangered': 'bg-orange-600',
      'Vulnerable': 'bg-yellow-600',
      'Near Threatened': 'bg-blue-600',
      'Least Concern': 'bg-green-600',
      'Data Deficient': 'bg-gray-600',
      'Not Evaluated': 'bg-gray-400',
    };
    return statusMap[status] || 'bg-gray-400';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (samples.length === 0 && !selectedSample) {
    return (
      <div className="p-6 text-center py-12">
        <FiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No pending samples
        </h3>
        <p className="text-gray-500">
          All your samples have been analyzed. Upload new samples to continue.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Samples List */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Pending Samples ({samples.length})
          </h3>
          
          <div className="space-y-3">
            {samples.map((sample) => (
              <button
                key={sample.sampleId}
                onClick={() => handleSelectSample(sample.sampleId)}
                className={`w-full text-left p-4 border rounded-lg transition-all ${
                  selectedSample?.sampleId === sample.sampleId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <p className="font-medium text-gray-900 mb-1">
                  {sample.sampleId}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  {sample.sampleMetadata.location.name}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {sample.sequenceCount} sequences
                  </span>
                  <span className="text-xs font-medium text-blue-600">
                    {sample.pcrWorkflow.targetGene}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Analysis Panel */}
        <div className="lg:col-span-2">
          {selectedSample ? (
            <div>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                {/* Sample Info */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {selectedSample.sampleId}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium text-gray-900">
                        {selectedSample.sampleMetadata.location.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Collection Date</p>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedSample.sampleMetadata.collectionDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Target Gene</p>
                      <p className="font-medium text-blue-600">
                        {selectedSample.pcrWorkflow.targetGene}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Sequences</p>
                      <p className="font-medium text-gray-900">
                        {selectedSample.sequenceCount}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Analysis Status */}
                {selectedSample.analysisStatus === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                      <FiAlertCircle className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-yellow-800">Ready for Analysis</p>
                        <p className="text-sm text-yellow-700">
                          Click the button below to start metabarcoding analysis
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedSample.analysisStatus === 'completed' && (
                  <div>
                    {/* Species Detected */}
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        Species Detected ({selectedSample.speciesDetected?.length || 0})
                      </h4>
                      
                      {selectedSample.speciesDetected && selectedSample.speciesDetected.length > 0 ? (
                        <div className="space-y-4">
                          {selectedSample.speciesDetected.map((species, index) => {
                            const isExpanded = expandedSpecies === index;
                            const hasINatData = species.inaturalistData;

                            return (
                              <div
                                key={index}
                                className="border border-gray-200 rounded-lg overflow-hidden transition-shadow hover:shadow-md"
                              >
                                {/* Compact Card View */}
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                                  <div className="flex items-center gap-4 flex-1">
                                    {/* Thumbnail */}
                                    {hasINatData && species.inaturalistData.photos?.length > 0 ? (
                                      <img
                                        src={species.inaturalistData.photos[0].url}
                                        alt={species.scientificName}
                                        className="w-16 h-16 rounded-lg object-cover border-2 border-white shadow-sm"
                                      />
                                    ) : (
                                      <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                                        <FiImage className="w-8 h-8 text-gray-400" />
                                      </div>
                                    )}

                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="text-lg font-semibold text-gray-900 italic">
                                          {species.scientificName}
                                        </p>
                                        {hasINatData && species.inaturalistData.rank && (
                                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                            {species.inaturalistData.rank}
                                          </span>
                                        )}
                                      </div>
                                      {hasINatData && species.inaturalistData.commonNames?.length > 0 ? (
                                        <p className="text-sm text-gray-600">
                                          {species.inaturalistData.commonNames[0].name}
                                        </p>
                                      ) : species.commonName ? (
                                        <p className="text-sm text-gray-600">{species.commonName}</p>
                                      ) : null}
                                      {hasINatData && species.inaturalistData.conservationStatus && (
                                        <span
                                          className={`inline-block mt-1 text-xs px-2 py-1 text-white rounded ${getConservationColor(
                                            species.inaturalistData.conservationStatus.status
                                          )}`}
                                        >
                                          <FiAward className="inline w-3 h-3 mr-1" />
                                          {species.inaturalistData.conservationStatus.status}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <p className="text-xs text-gray-600">Reads</p>
                                      <p className="font-semibold text-gray-900">{species.readCount}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs text-gray-600">Confidence</p>
                                      <p className="font-semibold text-green-600">{species.confidence}%</p>
                                    </div>
                                    <button
                                      onClick={() => setExpandedSpecies(isExpanded ? null : index)}
                                      className="p-2 hover:bg-white rounded-lg transition-colors"
                                    >
                                      {isExpanded ? (
                                        <FiChevronUp className="w-5 h-5 text-gray-600" />
                                      ) : (
                                        <FiChevronDown className="w-5 h-5 text-gray-600" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Expanded Card View */}
                                {isExpanded && (
                                  <div className="p-6 bg-white space-y-6">
                                    {hasINatData ? (
                                      <>
                                        {/* Photo Gallery */}
                                        {species.inaturalistData.photos?.length > 0 && (
                                          <div>
                                            <h5 className="flex items-center gap-2 text-md font-semibold text-gray-900 mb-3">
                                              <FiImage className="w-4 h-4" />
                                              Photo Gallery
                                            </h5>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                              {species.inaturalistData.photos.map((photo, photoIndex) => (
                                                <div
                                                  key={photoIndex}
                                                  className="relative group cursor-pointer"
                                                  onClick={() => setSelectedPhoto(photo)}
                                                >
                                                  <img
                                                    src={photo.url}
                                                    alt={`${species.scientificName} ${photoIndex + 1}`}
                                                    className="w-full h-32 object-cover rounded-lg border border-gray-200 group-hover:opacity-75 transition-opacity"
                                                  />
                                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                                                    <FiExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                  </div>
                                                  {photo.attribution && (
                                                    <p className="text-xs text-gray-500 mt-1 truncate">
                                                      © {photo.attribution}
                                                    </p>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Taxonomy Tree */}
                                        {species.inaturalistData.taxonomy && (
                                          <div>
                                            <h5 className="flex items-center gap-2 text-md font-semibold text-gray-900 mb-3">
                                              <FiInfo className="w-4 h-4" />
                                              Taxonomic Classification
                                            </h5>
                                            {renderTaxonomyTree(species.inaturalistData.taxonomy)}
                                          </div>
                                        )}

                                        {/* Wikipedia Summary */}
                                        {species.inaturalistData.wikipediaSummary && (
                                          <div>
                                            <h5 className="flex items-center gap-2 text-md font-semibold text-gray-900 mb-3">
                                              <FiBook className="w-4 h-4" />
                                              Description
                                            </h5>
                                            <p className="text-sm text-gray-700 leading-relaxed">
                                              {species.inaturalistData.wikipediaSummary}
                                            </p>
                                            {species.inaturalistData.wikipediaUrl && (
                                              <a
                                                href={species.inaturalistData.wikipediaUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:text-blue-700"
                                              >
                                                Read more on Wikipedia
                                                <FiExternalLink className="w-3 h-3" />
                                              </a>
                                            )}
                                          </div>
                                        )}

                                        {/* Detection Details */}
                                        <div>
                                          <h5 className="text-md font-semibold text-gray-900 mb-3">
                                            Detection Details
                                          </h5>
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-blue-50 rounded-lg p-4">
                                              <p className="text-xs text-gray-600 mb-1">Read Count</p>
                                              <div className="flex items-end gap-2">
                                                <p className="text-2xl font-bold text-blue-600">
                                                  {species.readCount}
                                                </p>
                                                <div className="flex-1 bg-blue-200 h-2 rounded-full overflow-hidden mb-1">
                                                  <div
                                                    className="bg-blue-600 h-full rounded-full"
                                                    style={{
                                                      width: `${Math.min(
                                                        (species.readCount /
                                                          Math.max(
                                                            ...selectedSample.speciesDetected.map((s) => s.readCount)
                                                          )) *
                                                          100,
                                                        100
                                                      )}%`,
                                                    }}
                                                  ></div>
                                                </div>
                                              </div>
                                            </div>
                                            <div className="bg-green-50 rounded-lg p-4">
                                              <p className="text-xs text-gray-600 mb-1">Confidence</p>
                                              <div className="flex items-end gap-2">
                                                <p className="text-2xl font-bold text-green-600">
                                                  {species.confidence}%
                                                </p>
                                                <div className="flex-1 bg-green-200 h-2 rounded-full overflow-hidden mb-1">
                                                  <div
                                                    className="bg-green-600 h-full rounded-full"
                                                    style={{ width: `${species.confidence}%` }}
                                                  ></div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-center py-8">
                                        <FiAlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-600 mb-2">
                                          Detailed information not available for this species
                                        </p>
                                        <p className="text-sm text-gray-500">
                                          Only basic detection data is available
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">
                          No species detected in this sample
                        </p>
                      )}
                    </div>

                    {/* Biodiversity Metrics */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Biodiversity Metrics
                      </h4>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {selectedSample.biodiversityMetrics?.totalSpecies || 0}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Total Species
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {selectedSample.biodiversityMetrics?.shannonIndex?.toFixed(2) || 0}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Shannon Index
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">
                            {selectedSample.biodiversityMetrics?.simpsonIndex?.toFixed(2) || 0}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Simpson Index
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Per-Sequence BLAST-like Matches */}
                    {selectedSample.analysisResults?.matchesBySequence && selectedSample.analysisResults.matchesBySequence.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">
                          Sequence Match Details
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left border border-gray-200">
                            <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                              <tr>
                                <th className="px-4 py-3 border-b">Seq #</th>
                                <th className="px-4 py-3 border-b">Length</th>
                                <th className="px-4 py-3 border-b">Top Hit</th>
                                <th className="px-4 py-3 border-b">Common Name</th>
                                <th className="px-4 py-3 border-b">Similarity</th>
                                <th className="px-4 py-3 border-b">Confidence</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedSample.analysisResults.matchesBySequence.map((seqMatch, idx) => (
                                <tr key={idx} className="border-b hover:bg-gray-50">
                                  <td className="px-4 py-3">{seqMatch.sequenceIndex}</td>
                                  <td className="px-4 py-3">{seqMatch.sequenceLength} bp</td>
                                  <td className="px-4 py-3 font-medium text-gray-900">
                                    {seqMatch.topHit}
                                  </td>
                                  <td className="px-4 py-3 text-gray-600">
                                    {seqMatch.matches && seqMatch.matches.length > 0
                                      ? seqMatch.matches[0].commonName || '-'
                                      : '-'}
                                  </td>
                                  <td className="px-4 py-3">
                                    {seqMatch.matches && seqMatch.matches.length > 0
                                      ? `${seqMatch.matches[0].similarity}%`
                                      : '-'}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-medium ${
                                        seqMatch.matches && seqMatch.matches.length > 0
                                          ? seqMatch.matches[0].confidence >= 90
                                            ? 'bg-green-100 text-green-800'
                                            : seqMatch.matches[0].confidence >= 80
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                          : 'bg-gray-100 text-gray-800'
                                      }`}
                                    >
                                      {seqMatch.matches && seqMatch.matches.length > 0
                                        ? `${seqMatch.matches[0].confidence}%`
                                        : 'No match'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Processing Info */}
                    <div className="mt-4 text-sm text-gray-500 text-center">
                      Processed in {selectedSample.analysisResults?.processingTime}ms •{' '}
                      {new Date(selectedSample.analysisResults?.processedAt).toLocaleString()}
                    </div>
                  </div>
                )}

                {selectedSample.analysisStatus === 'failed' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <FiAlertCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-medium text-red-800">Analysis Failed</p>
                        <p className="text-sm text-red-700">
                          {selectedSample.analysisResults?.errorMessage || 'Unknown error'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                {(selectedSample.analysisStatus === 'pending' || selectedSample.analysisStatus === 'failed') && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => handleAnalyze(selectedSample.sampleId)}
                      disabled={analyzing}
                      className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {analyzing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <FiPlay className="w-5 h-5" />
                          {selectedSample.analysisStatus === 'failed' ? 'Retry Analysis' : 'Start Analysis'}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FiRefreshCw className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Select a sample to view details and start analysis</p>
            </div>
          )}
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors z-10"
            >
              <FiX className="w-6 h-6 text-gray-800" />
            </button>
            <img
              src={selectedPhoto.url}
              alt="Species"
              className="w-full h-auto rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            {selectedPhoto.attribution && (
              <div className="mt-4 text-center">
                <p className="text-white text-sm">
                  © {selectedPhoto.attribution} • License: {selectedPhoto.license || 'Unknown'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisTab;
