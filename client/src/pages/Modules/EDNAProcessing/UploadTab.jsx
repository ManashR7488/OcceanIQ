import { useState } from 'react';
import { FiUpload, FiFile, FiX, FiInfo, FiCamera, FiCheck } from 'react-icons/fi';
import axios from '../../../config/axios.config';
import { toast } from 'react-toastify';
import BarcodeScanner from '../../../components/EDNAScanner/BarcodeScanner';

const UploadTab = ({ onUploadSuccess }) => {
  const [formData, setFormData] = useState({
    collectionDate: '',
    locationName: '',
    latitude: '',
    longitude: '',
    waterDepth: '',
    waterTemperature: '',
    sampleVolume: '',
    filterSize: '',
    collector: '',
    notes: '',
    forwardPrimer: '',
    reversePrimer: '',
    targetGene: 'COI',
    sequencingPlatform: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [inputMode, setInputMode] = useState('file'); // 'file', 'text', or 'barcode'
  const [sequenceText, setSequenceText] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const targetGenes = [
    { value: 'COI', label: 'COI (Cytochrome Oxidase I)' },
    { value: '16S', label: '16S rRNA' },
    { value: '12S', label: '12S rRNA' },
    { value: '18S', label: '18S rRNA' },
    { value: 'ITS', label: 'ITS (Internal Transcribed Spacer)' },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validExtensions = ['.fasta', '.fa', '.fna', '.txt', '.csv'];
      const fileName = file.name.toLowerCase();
      const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

      if (!isValid) {
        toast.error('Invalid file type. Please upload FASTA, CSV, or TXT files.');
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB limit');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    const fileInput = document.getElementById('sequenceFile');
    if (fileInput) fileInput.value = '';
  };

  // Client-side sequence validation helper
  const normalizeAndValidateSequence = (raw) => {
    if (!raw) return { ok: false, reason: 'Empty' };
    const isFasta = raw.trim().startsWith('>');
    if (isFasta) {
      return { ok: true, value: raw }; // let server parse FASTA, optionally basic sanity checks
    }
    const cleaned = raw.replace(/\s+/g, '').toUpperCase();
    const dnaRegex = /^[ATCGN]+$/;
    if (!dnaRegex.test(cleaned)) return { ok: false, reason: 'Only A,T,C,G,N allowed' };
    if (cleaned.length < 50) return { ok: false, reason: 'Minimum length is 50 bases' };
    return { ok: true, value: cleaned };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.collectionDate || !formData.locationName || !formData.targetGene) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (inputMode === 'file' && !selectedFile) {
      toast.error('Please select a sequence file to upload');
      return;
    }

    if ((inputMode === 'text' || inputMode === 'barcode') && !sequenceText.trim()) {
      toast.error('Please paste or scan sequence data');
      return;
    }

    setUploading(true);

    try {
      // Create FormData
      const uploadData = new FormData();
      
      if (inputMode === 'file') {
        uploadData.append('sequenceFile', selectedFile);
      } else {
        // Validate and normalize sequence for text/barcode modes
        const { ok, value, reason } = normalizeAndValidateSequence(sequenceText);
        if (!ok) {
          toast.error(`Invalid sequence: ${reason}`);
          setUploading(false);
          return;
        }
        uploadData.append('sequenceText', value);
      }

      // Append all form fields
      Object.keys(formData).forEach((key) => {
        if (formData[key]) {
          uploadData.append(key, formData[key]);
        }
      });

      // Upload sample
      const response = await axios.post('/edna/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success('Sample uploaded successfully! Ready for analysis.');
        
        // Reset form
        setFormData({
          collectionDate: '',
          locationName: '',
          latitude: '',
          longitude: '',
          waterDepth: '',
          waterTemperature: '',
          sampleVolume: '',
          filterSize: '',
          collector: '',
          notes: '',
          forwardPrimer: '',
          reversePrimer: '',
          targetGene: 'COI',
          sequencingPlatform: '',
        });
        setSelectedFile(null);
        setSequenceText('');
        const fileInput = document.getElementById('sequenceFile');
        if (fileInput) fileInput.value = '';

        // Notify parent
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload sample');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <FiInfo className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Upload your eDNA sequences</p>
          <p>
            Supported formats: FASTA (.fasta, .fa, .fna), CSV (.csv), Plain Text (.txt). 
            Maximum file size: 10MB. After uploading, you can analyze the sample to identify species.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input Mode Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Input Method <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setInputMode('file')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                inputMode === 'file'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiUpload className="inline-block w-4 h-4 mr-2" />
              Upload File
            </button>
            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                inputMode === 'text'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiFile className="inline-block w-4 h-4 mr-2" />
              Paste Text
            </button>
            <button
              type="button"
              onClick={() => {
                setInputMode('barcode');
                setShowScanner(true);
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                inputMode === 'barcode'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiCamera className="inline-block w-4 h-4 mr-2" />
              Scan Barcode/QR
            </button>
          </div>
        </div>

        {/* File Upload Section */}
        {inputMode === 'file' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sequence File <span className="text-red-500">*</span>
          </label>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            {!selectedFile ? (
              <label htmlFor="sequenceFile" className="cursor-pointer">
                <FiUpload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  FASTA, CSV, or TXT files (up to 10MB)
                </p>
                <input
                  type="file"
                  id="sequenceFile"
                  accept=".fasta,.fa,.fna,.txt,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <FiFile className="w-8 h-8 text-blue-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-red-600 hover:text-red-700"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Text Input Section */}
        {inputMode === 'text' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sequence Data <span className="text-red-500">*</span>
          </label>
          <textarea
            value={sequenceText}
            onChange={(e) => setSequenceText(e.target.value)}
            rows={10}
            placeholder="Paste your sequences here in FASTA format or plain text (one sequence per line)&#10;&#10;Example FASTA:&#10;>Sequence1&#10;ATCGATCGATCG&#10;>Sequence2&#10;GCTAGCTAGCTA"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Accepted: FASTA or plain DNA (A,T,C,G,N), min length 50 bases. Maximum 1000 sequences.
          </p>
        </div>
        )}

        {/* Barcode Scanner Section */}
        {inputMode === 'barcode' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Barcode/QR Code Scanner <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {!sequenceText ? (
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  <FiCamera className="w-5 h-5" />
                  Open Scanner
                </button>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <FiCheck className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-800">Sequence scanned successfully</p>
                  <p className="text-xs text-green-600 mt-1 font-mono break-all">{sequenceText.substring(0, 50)}...</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSequenceText('');
                      setShowScanner(true);
                    }}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                  >
                    Scan Again
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Accepted: FASTA or plain DNA (A,T,C,G,N), min length 50 bases.
            </p>
          </div>
        )}

        {/* Sample Metadata Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sample Metadata</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Collection Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Collection Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="collectionDate"
                value={formData.collectionDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Location Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="locationName"
                value={formData.locationName}
                onChange={handleInputChange}
                placeholder="e.g., Coral Bay, Great Barrier Reef"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Latitude */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                placeholder="e.g., -23.445678"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Longitude */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                placeholder="e.g., 151.234567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Water Depth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Water Depth (m)
              </label>
              <input
                type="number"
                step="any"
                name="waterDepth"
                value={formData.waterDepth}
                onChange={handleInputChange}
                placeholder="e.g., 15.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Water Temperature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Water Temperature (°C)
              </label>
              <input
                type="number"
                step="any"
                name="waterTemperature"
                value={formData.waterTemperature}
                onChange={handleInputChange}
                placeholder="e.g., 24.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Sample Volume */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sample Volume (L)
              </label>
              <input
                type="number"
                step="any"
                name="sampleVolume"
                value={formData.sampleVolume}
                onChange={handleInputChange}
                placeholder="e.g., 2.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filter Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter Size (μm)
              </label>
              <input
                type="number"
                step="any"
                name="filterSize"
                value={formData.filterSize}
                onChange={handleInputChange}
                placeholder="e.g., 0.45"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Collector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Collector
              </label>
              <input
                type="text"
                name="collector"
                value={formData.collector}
                onChange={handleInputChange}
                placeholder="e.g., Dr. Jane Smith"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              placeholder="Additional notes about the sample..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* PCR Workflow Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">PCR Workflow</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Forward Primer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Forward Primer
              </label>
              <input
                type="text"
                name="forwardPrimer"
                value={formData.forwardPrimer}
                onChange={handleInputChange}
                placeholder="e.g., mlCOIintF"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Reverse Primer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reverse Primer
              </label>
              <input
                type="text"
                name="reversePrimer"
                value={formData.reversePrimer}
                onChange={handleInputChange}
                placeholder="e.g., jgHCO2198"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Target Gene */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Gene <span className="text-red-500">*</span>
              </label>
              <select
                name="targetGene"
                value={formData.targetGene}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {targetGenes.map((gene) => (
                  <option key={gene.value} value={gene.value}>
                    {gene.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sequencing Platform */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sequencing Platform
              </label>
              <input
                type="text"
                name="sequencingPlatform"
                value={formData.sequencingPlatform}
                onChange={handleInputChange}
                placeholder="e.g., Illumina MiSeq"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading || (inputMode === 'file' ? !selectedFile : !sequenceText.trim())}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <FiUpload className="w-5 h-5" />
                Upload Sample
              </>
            )}
          </button>
        </div>
      </form>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onScan={(data) => {
            const normalized = data.replace(/\s+/g, '').toUpperCase();
            setSequenceText(normalized);
            setShowScanner(false);
            toast.success('Sequence scanned successfully!');
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default UploadTab;
