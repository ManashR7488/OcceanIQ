import { useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import GridLayer from '../Map/GridLayer';
import 'leaflet/dist/leaflet.css';

// Helper function to get color matching GridLayer's blue logarithmic scale
function getColorForCount(count, minCount, maxCount) {
  if (count === 0 || maxCount === minCount) return '#dbeafe'; // Very light blue
  
  // Use logarithmic scale for better visualization
  const logCount = Math.log(count + 1);
  const logMax = Math.log(maxCount + 1);
  const ratio = logCount / logMax;
  
  // Blue gradient from very light to dark blue
  const colors = [
    '#dbeafe', // 0% - very light blue
    '#bfdbfe', // 20%
    '#93c5fd', // 40%
    '#60a5fa', // 60%
    '#3b82f6', // 80%
    '#2563eb', // 90%
    '#1e40af', // 95%
    '#1e3a8a'  // 100% - dark blue
  ];
  
  const index = Math.floor(ratio * (colors.length - 1));
  return colors[Math.min(index, colors.length - 1)];
}

function BiodiversityMap({ 
  gridData, 
  loading = false, 
  height = '500px',
  center = [20, 80],
  zoom = 4,
  filters 
}) {
  // Generate unique key to prevent double-initialization
  const mapKey = useMemo(() => `biodiversity-map-${Date.now()}`, []);

  // Calculate statistics and color scale data
  const { stats, minCount, maxCount, legendBins } = useMemo(() => {
    if (!gridData || !gridData.features) return { stats: null, minCount: 0, maxCount: 1, legendBins: [] };

    const totalCells = gridData.features.length;
    const counts = gridData.features.map(f => f.properties?.n || 0);
    const totalOccurrences = counts.reduce((sum, count) => sum + count, 0);
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);

    // Generate legend bins dynamically matching the blue logarithmic scale
    const logMax = Math.log(maxCount + 1);
    const bins = [];
    
    // Create 5 bins spanning the logarithmic range
    for (let i = 0; i < 5; i++) {
      const ratio = i / 4; // 0, 0.25, 0.5, 0.75, 1.0
      const logValue = ratio * logMax;
      const value = Math.floor(Math.exp(logValue) - 1);
      
      const nextRatio = (i + 1) / 4;
      const nextLogValue = nextRatio * logMax;
      const nextValue = i < 4 ? Math.floor(Math.exp(nextLogValue) - 1) : maxCount;
      
      bins.push({
        label: i === 0 ? `${minCount}-${nextValue}` : 
               i === 4 ? `${value}+` : 
               `${value}-${nextValue}`,
        color: getColorForCount(value, minCount, maxCount)
      });
    }

    return { 
      stats: { totalCells, totalOccurrences }, 
      minCount, 
      maxCount,
      legendBins: bins
    };
  }, [gridData]);

  // Color scale matching GridLayer's blue logarithmic gradient
  const colorScale = (count) => {
    return getColorForCount(count, minCount, maxCount);
  };

  return (
    <div className="relative">
      {/* Map Container */}
      <div 
        className="rounded-lg overflow-hidden shadow-md relative"
        style={{ height }}
      >
        {gridData && gridData.features && gridData.features.length > 0 ? (
          <MapContainer
            key={mapKey}
            center={center}
            zoom={zoom}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            {/* Base Layer */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Heatmap Layer */}
            <GridLayer gridData={gridData} colorScale={colorScale} filters={filters} />
          </MapContainer>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center p-6">
              <p className="text-gray-600 text-sm">
                {loading 
                  ? 'Loading biodiversity data...' 
                  : 'No biodiversity data available. Adjust filters and try again.'}
              </p>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-[1000]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mb-2"></div>
              <p className="text-gray-700 font-medium">Loading map data...</p>
            </div>
          </div>
        )}

        {/* Legend */}
        {gridData && gridData.features && gridData.features.length > 0 && !loading && (
          <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
            <h4 className="text-xs font-semibold text-gray-800 mb-2">
              Occurrence Density
            </h4>
            <div className="space-y-1">
              {legendBins.map(({ label, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <div 
                    className="w-6 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-gray-700">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Statistics Bar */}
      {stats && !loading && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-200">
            <p className="text-xs text-cyan-700 font-medium mb-1">Grid Cells</p>
            <p className="text-2xl font-bold text-cyan-900">
              {stats.totalCells.toLocaleString()}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-blue-700 font-medium mb-1">Total Occurrences</p>
            <p className="text-2xl font-bold text-blue-900">
              {stats.totalOccurrences.toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default BiodiversityMap;
