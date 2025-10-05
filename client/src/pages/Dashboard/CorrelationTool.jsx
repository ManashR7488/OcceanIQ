import { useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { FiDownload, FiRefreshCw, FiBarChart2 } from 'react-icons/fi';
import FileUpload from '../../components/Dashboard/FileUpload';
import FieldSelector from '../../components/Dashboard/FieldSelector';
import ScatterPlotChart from '../../components/Dashboard/ScatterPlotChart';
import CorrelationMatrixChart from '../../components/Dashboard/CorrelationMatrixChart';
import BoxPlotChart from '../../components/Dashboard/BoxPlotChart';
import BubbleChart from '../../components/Dashboard/BubbleChart';
import {
  parseFile,
  detectNumericFields,
  exportToCSV,
  exportToJSON,
  getFileInfo
} from '../../utils/fileUtils';
import {
  calculateCorrelationMatrix,
  calculateLinearRegression,
  calculateQuartiles,
  pairwiseAligned,
  calculatePearsonCorrelation,
  calculateSpearmanCorrelation
} from '../../utils/correlationUtils';

/**
 * Main correlation analysis tool component
 */
function CorrelationTool() {
  // File & Data State
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [numericFields, setNumericFields] = useState([]);
  const [fieldStats, setFieldStats] = useState({});
  const [parseError, setParseError] = useState(null);

  // Selection State
  const [selectedFields, setSelectedFields] = useState([]);
  const [xAxisField, setXAxisField] = useState(null);
  const [yAxisField, setYAxisField] = useState(null);
  const [sizeField, setSizeField] = useState(null);
  const [correlationMethod, setCorrelationMethod] = useState('pearson');

  // Analysis Results State
  const [correlationMatrix, setCorrelationMatrix] = useState(null);
  const [regressionResults, setRegressionResults] = useState(null);
  const [pearsonR, setPearsonR] = useState(null);
  const [spearmanRho, setSpearmanRho] = useState(null);
  const [boxPlotData, setBoxPlotData] = useState(null);
  const [scatterData, setScatterData] = useState(null);
  const [bubbleData, setBubbleData] = useState(null);

  // UI State
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('scatter');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Handle file upload
  const handleFileUpload = async (file) => {
    setLoading(true);
    setParseError(null);

    try {
      // Parse file
      const { data, fields, errors } = await parseFile(file);

      if (errors && errors.length > 0) {
        console.warn('Parsing warnings:', errors);
      }

      // Detect numeric fields
      const { numericFields: detectedNumeric, fieldStats: stats } = detectNumericFields(data, fields);

      if (detectedNumeric.length < 2) {
        throw new Error('File must contain at least 2 numeric fields for correlation analysis');
      }

      // Update state
      setUploadedFile(file);
      setParsedData(data);
      setAllFields(fields);
      setNumericFields(detectedNumeric);
      setFieldStats(stats);

      // Auto-select first 5 numeric fields
      const autoSelect = detectedNumeric.slice(0, Math.min(5, detectedNumeric.length));
      setSelectedFields(autoSelect);

      toast.success(`File loaded successfully! Found ${detectedNumeric.length} numeric fields.`);
    } catch (error) {
      console.error('File upload error:', error);
      setParseError(error.message);
      toast.error(`Failed to load file: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle field toggle
  const handleFieldToggle = (field) => {
    setSelectedFields(prev => {
      if (prev.includes(field)) {
        return prev.filter(f => f !== field);
      } else {
        if (prev.length >= 10) {
          toast.warning('Maximum 10 fields can be selected');
          return prev;
        }
        return [...prev, field];
      }
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    const fieldsToSelect = numericFields.slice(0, 10);
    setSelectedFields(fieldsToSelect);
  };

  // Handle clear all
  const handleClearAll = () => {
    setSelectedFields([]);
  };

  // Helper to build row-aligned pairs for pairwise operations
  const buildPairs = (arrays) => {
    // arrays is an array of arrays to align
    // Returns array of objects with aligned indices
    if (arrays.length === 0) return [];
    
    const aligned = [];
    const length = arrays[0].length;
    
    for (let i = 0; i < length; i++) {
      const values = arrays.map(arr => arr[i]);
      // Check if all values at this index are valid
      const allValid = values.every(v => 
        v !== null && 
        v !== undefined && 
        !isNaN(v) && 
        isFinite(v)
      );
      
      if (allValid) {
        aligned.push(values);
      }
    }
    
    return aligned;
  };

  // Handle analyze
  const handleAnalyze = async () => {
    if (selectedFields.length < 2) {
      toast.error('Please select at least 2 fields for analysis');
      return;
    }

    setLoading(true);

    try {
      // Extract raw field data (no filtering yet - correlation matrix handles alignment internally)
      const fieldData = {};
      selectedFields.forEach(field => {
        fieldData[field] = parsedData.map(row => row[field]);
      });

      // Calculate correlation matrix (util handles pairwise alignment internally)
      const { matrix, fieldNames } = calculateCorrelationMatrix(fieldData, correlationMethod);
      setCorrelationMatrix(matrix);

      // Set default axes for scatter plot
      const defaultX = selectedFields[0];
      const defaultY = selectedFields[1];
      const defaultSize = selectedFields.length >= 3 ? selectedFields[2] : null;

      setXAxisField(defaultX);
      setYAxisField(defaultY);
      setSizeField(defaultSize);

      // Build row-aligned pairs for scatter/regression (x, y)
      const xyRaw = [fieldData[defaultX], fieldData[defaultY]];
      const xyPairs = buildPairs(xyRaw);
      
      const xAligned = xyPairs.map(pair => pair[0]);
      const yAligned = xyPairs.map(pair => pair[1]);

      // Calculate regression with aligned data
      const regression = calculateLinearRegression(xAligned, yAligned);
      setRegressionResults(regression);

      // Calculate both Pearson and Spearman correlations
      const pearsonResult = calculatePearsonCorrelation(xAligned, yAligned);
      const spearmanResult = calculateSpearmanCorrelation(xAligned, yAligned);
      setPearsonR(pearsonResult.correlation);
      setSpearmanRho(spearmanResult.correlation);

      // Prepare scatter plot data with aligned pairs
      const scatter = xyPairs.map((pair, index) => ({
        x: pair[0],
        y: pair[1],
        label: `Point ${index + 1}`
      }));
      setScatterData(scatter);

      // Calculate box plot data (each field independently)
      const boxPlots = selectedFields.map(field => {
        const validData = fieldData[field].filter(v => 
          v !== null && v !== undefined && !isNaN(v) && isFinite(v)
        );
        const quartiles = calculateQuartiles(validData);
        return {
          field,
          ...quartiles
        };
      });
      setBoxPlotData(boxPlots);

      // Prepare bubble chart data (if 3+ fields) with row-aligned triplets
      if (selectedFields.length >= 3) {
        const xyzRaw = [fieldData[defaultX], fieldData[defaultY], fieldData[defaultSize]];
        const xyzPairs = buildPairs(xyzRaw);
        
        const bubble = xyzPairs.map((triplet, index) => ({
          x: triplet[0],
          y: triplet[1],
          z: triplet[2],
          label: `Point ${index + 1}`
        }));
        setBubbleData(bubble);
      }

      toast.success('Analysis completed successfully!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(`Analysis failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle axis change for scatter plot
  const handleAxisChange = (axis, field) => {
    if (axis === 'x') {
      setXAxisField(field);
    } else if (axis === 'y') {
      setYAxisField(field);
    } else if (axis === 'size') {
      setSizeField(field);
    }

    // Recalculate regression and data
    if ((axis === 'x' || axis === 'y') && correlationMatrix) {
      const newX = axis === 'x' ? field : xAxisField;
      const newY = axis === 'y' ? field : yAxisField;

      // Extract raw data
      const xRaw = parsedData.map(row => row[newX]);
      const yRaw = parsedData.map(row => row[newY]);

      // Build row-aligned pairs
      const xyPairs = buildPairs([xRaw, yRaw]);
      const xAligned = xyPairs.map(pair => pair[0]);
      const yAligned = xyPairs.map(pair => pair[1]);

      // Calculate regression with aligned data
      const regression = calculateLinearRegression(xAligned, yAligned);
      setRegressionResults(regression);

      // Calculate both Pearson and Spearman correlations
      const pearsonResult = calculatePearsonCorrelation(xAligned, yAligned);
      const spearmanResult = calculateSpearmanCorrelation(xAligned, yAligned);
      setPearsonR(pearsonResult.correlation);
      setSpearmanRho(spearmanResult.correlation);

      // Prepare scatter plot data with aligned pairs
      const scatter = xyPairs.map((pair, index) => ({
        x: pair[0],
        y: pair[1],
        label: `Point ${index + 1}`
      }));
      setScatterData(scatter);
    }

    // Recalculate bubble data
    if (correlationMatrix && selectedFields.length >= 3) {
      const newX = axis === 'x' ? field : xAxisField;
      const newY = axis === 'y' ? field : yAxisField;
      const newSize = axis === 'size' ? field : sizeField;

      // Extract raw data
      const xRaw = parsedData.map(row => row[newX]);
      const yRaw = parsedData.map(row => row[newY]);
      const zRaw = parsedData.map(row => row[newSize]);

      // Build row-aligned triplets
      const xyzPairs = buildPairs([xRaw, yRaw, zRaw]);

      const bubble = xyzPairs.map((triplet, index) => ({
        x: triplet[0],
        y: triplet[1],
        z: triplet[2],
        label: `Point ${index + 1}`
      }));
      setBubbleData(bubble);
    }
  };

  // Handle export
  const handleExport = (format) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const baseFilename = uploadedFile?.name.split('.')[0] || 'correlation-analysis';

      if (format === 'csv') {
        // Export correlation matrix as CSV
        const matrixData = correlationMatrix.map((row, i) => {
          const rowData = { field: selectedFields[i] };
          selectedFields.forEach((field, j) => {
            rowData[field] = row[j].toFixed(3);
          });
          return rowData;
        });

        exportToCSV(matrixData, `${baseFilename}_correlations_${timestamp}.csv`);
        toast.success('Correlation matrix exported to CSV');
      } else if (format === 'json') {
        // Export full results as JSON
        const results = {
          metadata: {
            filename: uploadedFile?.name,
            timestamp: new Date().toISOString(),
            fieldCount: selectedFields.length,
            dataPoints: parsedData?.length
          },
          selectedFields,
          correlationMatrix: {
            fieldNames: selectedFields,
            matrix: correlationMatrix
          },
          regressionResults,
          boxPlotData,
          fieldStats: Object.fromEntries(
            selectedFields.map(field => [field, fieldStats[field]])
          )
        };

        exportToJSON(results, `${baseFilename}_analysis_${timestamp}.json`);
        toast.success('Full analysis exported to JSON');
      }

      setShowExportMenu(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Export failed: ${error.message}`);
    }
  };

  // Handle reset
  const handleReset = () => {
    if (correlationMatrix && !window.confirm('Are you sure you want to reset? All analysis will be lost.')) {
      return;
    }

    setUploadedFile(null);
    setParsedData(null);
    setAllFields([]);
    setNumericFields([]);
    setFieldStats({});
    setParseError(null);
    setSelectedFields([]);
    setCorrelationMatrix(null);
    setRegressionResults(null);
    setBoxPlotData(null);
    setScatterData(null);
    setBubbleData(null);
    setActiveTab('scatter');
    setShowExportMenu(false);

    toast.info('Analysis reset');
  };

  // Find strongest correlation
  const strongestCorrelation = useMemo(() => {
    if (!correlationMatrix || !selectedFields) return null;

    let maxCorr = 0;
    let fieldPair = null;

    for (let i = 0; i < correlationMatrix.length; i++) {
      for (let j = i + 1; j < correlationMatrix[i].length; j++) {
        const corr = Math.abs(correlationMatrix[i][j]);
        if (corr > maxCorr) {
          maxCorr = corr;
          fieldPair = {
            field1: selectedFields[i],
            field2: selectedFields[j],
            correlation: correlationMatrix[i][j]
          };
        }
      }
    }

    return fieldPair;
  }, [correlationMatrix, selectedFields]);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center space-x-3 mb-2">
          <FiBarChart2 className="w-8 h-8" />
          <h2 className="text-3xl font-bold">Correlation Analysis Tool</h2>
        </div>
        <p className="text-cyan-100">
          Upload oceanographic data files (CSV/JSON) and explore correlations between variables
        </p>
      </div>

      {/* File Upload Phase */}
      {!parsedData && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <FileUpload
            onFileSelect={handleFileUpload}
            acceptedTypes={['csv', 'json']}
            maxSizeMB={100}
            disabled={loading}
          />
        </div>
      )}

      {/* Field Selection Phase */}
      {parsedData && !correlationMatrix && (
        <div className="space-y-4">
          {/* Correlation Method Toggle */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Correlation Method</h3>
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="correlationMethod"
                  value="pearson"
                  checked={correlationMethod === 'pearson'}
                  onChange={(e) => setCorrelationMethod(e.target.value)}
                  className="w-4 h-4 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-gray-700 font-medium">Pearson (linear)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="correlationMethod"
                  value="spearman"
                  checked={correlationMethod === 'spearman'}
                  onChange={(e) => setCorrelationMethod(e.target.value)}
                  className="w-4 h-4 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-gray-700 font-medium">Spearman (monotonic)</span>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              {correlationMethod === 'pearson' 
                ? 'Pearson measures linear relationships between variables'
                : 'Spearman measures monotonic relationships (ranked correlation)'}
            </p>
          </div>

          <FieldSelector
            fields={numericFields}
            selectedFields={selectedFields}
            onFieldToggle={handleFieldToggle}
            onSelectAll={handleSelectAll}
            onClearAll={handleClearAll}
            fieldStats={fieldStats}
            minSelection={2}
            maxSelection={10}
          />

          <div className="flex justify-center space-x-4">
            <button
              onClick={handleAnalyze}
              disabled={selectedFields.length < 2 || loading}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white 
                       font-semibold rounded-lg shadow-md hover:from-cyan-600 hover:to-blue-600 
                       transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center space-x-2"
            >
              <FiBarChart2 className="w-5 h-5" />
              <span>Analyze Correlations</span>
            </button>

            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg 
                       hover:bg-gray-300 transition-colors flex items-center space-x-2"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}

      {/* Visualization Phase */}
      {correlationMatrix && (
        <div className="space-y-6">
          {/* Control Panel */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Tab Navigation */}
              <div className="flex flex-wrap gap-2">
                {['scatter', 'matrix', 'boxplot', 'bubble'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    disabled={tab === 'bubble' && selectedFields.length < 3}
                    className={`
                      px-4 py-2 rounded-md font-medium transition-all duration-200
                      ${activeTab === tab
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                      ${tab === 'bubble' && selectedFields.length < 3 ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {tab === 'scatter' && 'Scatter Plot'}
                    {tab === 'matrix' && 'Correlation Matrix'}
                    {tab === 'boxplot' && 'Box Plots'}
                    {tab === 'bubble' && 'Bubble Chart'}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="px-4 py-2 bg-green-500 text-white font-medium rounded-md 
                             hover:bg-green-600 transition-colors flex items-center space-x-2"
                  >
                    <FiDownload className="w-4 h-4" />
                    <span>Export</span>
                  </button>

                  {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg 
                                  border border-gray-200 z-10">
                      <button
                        onClick={() => handleExport('csv')}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 rounded-t-lg"
                      >
                        Export as CSV
                      </button>
                      <button
                        onClick={() => handleExport('json')}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 rounded-b-lg"
                      >
                        Export as JSON
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md 
                           hover:bg-gray-300 transition-colors flex items-center space-x-2"
                >
                  <FiRefreshCw className="w-4 h-4" />
                  <span>New Analysis</span>
                </button>
              </div>
            </div>
          </div>

          {/* Charts Container */}
          <div>
            {activeTab === 'scatter' && (
              <div className="space-y-4">
                {/* Axis Selectors */}
                <div className="bg-white rounded-lg shadow-md p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        X-Axis Variable
                      </label>
                      <select
                        value={xAxisField}
                        onChange={(e) => handleAxisChange('x', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 
                                 focus:ring-cyan-500 focus:border-transparent"
                      >
                        {selectedFields.map(field => (
                          <option key={field} value={field}>{field}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Y-Axis Variable
                      </label>
                      <select
                        value={yAxisField}
                        onChange={(e) => handleAxisChange('y', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 
                                 focus:ring-cyan-500 focus:border-transparent"
                      >
                        {selectedFields.map(field => (
                          <option key={field} value={field}>{field}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <ScatterPlotChart
                  data={scatterData}
                  xField={xAxisField}
                  yField={yAxisField}
                  regressionData={regressionResults}
                  pearsonR={pearsonR}
                  spearmanRho={spearmanRho}
                  title="Scatter Plot with Regression"
                />
              </div>
            )}

            {activeTab === 'matrix' && (
              <CorrelationMatrixChart
                correlationMatrix={correlationMatrix}
                fieldNames={selectedFields}
              />
            )}

            {activeTab === 'boxplot' && (
              <BoxPlotChart
                data={boxPlotData}
                title="Distribution Comparison"
              />
            )}

            {activeTab === 'bubble' && selectedFields.length >= 3 && (
              <div className="space-y-4">
                {/* Field Selectors */}
                <div className="bg-white rounded-lg shadow-md p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        X-Axis Variable
                      </label>
                      <select
                        value={xAxisField}
                        onChange={(e) => handleAxisChange('x', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 
                                 focus:ring-cyan-500 focus:border-transparent"
                      >
                        {selectedFields.map(field => (
                          <option key={field} value={field}>{field}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Y-Axis Variable
                      </label>
                      <select
                        value={yAxisField}
                        onChange={(e) => handleAxisChange('y', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 
                                 focus:ring-cyan-500 focus:border-transparent"
                      >
                        {selectedFields.map(field => (
                          <option key={field} value={field}>{field}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Size Variable
                      </label>
                      <select
                        value={sizeField}
                        onChange={(e) => handleAxisChange('size', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 
                                 focus:ring-cyan-500 focus:border-transparent"
                      >
                        {selectedFields.map(field => (
                          <option key={field} value={field}>{field}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <BubbleChart
                  data={bubbleData}
                  xField={xAxisField}
                  yField={yAxisField}
                  zField={sizeField}
                  title="Multi-Variable Bubble Chart"
                />
              </div>
            )}
          </div>

          {/* Summary Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Analysis Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Fields Analyzed</p>
                <p className="text-3xl font-bold text-blue-600">{selectedFields.length}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Data Points</p>
                <p className="text-3xl font-bold text-green-600">{parsedData?.length || 0}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-600 mb-1">Strongest Correlation</p>
                {strongestCorrelation ? (
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {strongestCorrelation.correlation.toFixed(3)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {strongestCorrelation.field1} ↔ {strongestCorrelation.field2}
                    </p>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-purple-600">N/A</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
              <span className="text-lg font-semibold text-gray-700">Processing...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CorrelationTool;
