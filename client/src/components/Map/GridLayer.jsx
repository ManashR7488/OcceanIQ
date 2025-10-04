import React, { useMemo } from 'react';
import { GeoJSON, Popup } from 'react-leaflet';
import ReactDOM from 'react-dom/client';
import GridCellPopup from './GridCellPopup';

const GridLayer = ({ gridData, colorScale, filters }) => {
  // Calculate min and max occurrence counts for color scaling
  const { minCount, maxCount } = useMemo(() => {
    if (!gridData || !gridData.features || gridData.features.length === 0) {
      return { minCount: 0, maxCount: 1 };
    }
    
    const counts = gridData.features.map(f => f.properties.n || 0);
    return {
      minCount: Math.min(...counts),
      maxCount: Math.max(...counts)
    };
  }, [gridData]);

  // Generate lightweight key for GeoJSON layer
  // Key changes only when feature count changes, avoiding heavy JSON.stringify operations
  const layerKey = useMemo(() => {
    if (!gridData || !gridData.features) return 'empty-grid';
    const featureCount = gridData.features.length;
    const precision = filters?.precision || 3;
    return `grid-${featureCount}-p${precision}`;
  }, [gridData, filters?.precision]);

  // Default color scale function (blue gradient for ocean theme)
  const defaultColorScale = (count) => {
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
  };

  const getColor = colorScale || defaultColorScale;

  // Style function for GeoJSON layer
  const style = (feature) => {
    const count = feature.properties.n || 0;
    return {
      fillColor: getColor(count),
      fillOpacity: 0.6,
      color: '#1e40af', // Border color (dark blue)
      weight: 1
    };
  };

  // Bind popup to each grid cell
  const onEachFeature = (feature, layer) => {
    if (feature.properties) {
      console.log('Feature properties:', feature.properties);
      
      const count = feature.properties.n || 0;
      const geohash = feature.properties?.geohash || null;
      
      if (!geohash) {
        console.warn('Feature missing geohash:', feature.properties);
      }
      
      // Calculate center coordinates from layer bounds
      const bounds = layer.getBounds();
      const center = bounds.getCenter();
      
      // Conditional popup binding - only if geohash exists
      if (geohash) {
        // Create a container for the React component
        const popupContainer = document.createElement('div');
        
        // Create root once and store it on the layer
        const root = ReactDOM.createRoot(popupContainer);
        layer._popupRoot = root;
        
        // Render the React component when popup opens
        layer.on('popupopen', () => {
          if (layer._popupRoot) {
            layer._popupRoot.render(
              <GridCellPopup 
                geohash={geohash} 
                occurrenceCount={count}
                centerLat={center.lat}
                centerLon={center.lng}
                filters={filters}
              />
            );
          }
        });
        
        // Clean up root when popup closes
        layer.on('popupclose', () => {
          if (layer._popupRoot) {
            layer._popupRoot.unmount();
            layer._popupRoot = null;
            // Recreate root for next open
            const newRoot = ReactDOM.createRoot(popupContainer);
            layer._popupRoot = newRoot;
          }
        });
        
        // Bind popup with the container
        layer.bindPopup(popupContainer, {
          maxWidth: 400,
          minWidth: 300
        });
      } else {
        // Fallback: bind tooltip if no geohash available
        layer.bindTooltip(`${count} occurrences (details unavailable)`, {
          permanent: false,
          direction: 'center'
        });
      }
      
      // Add hover effect
      layer.on('mouseover', function () {
        this.setStyle({
          weight: 3,
          fillOpacity: 0.8
        });
      });
      
      layer.on('mouseout', function () {
        this.setStyle({
          weight: 1,
          fillOpacity: 0.6
        });
      });
    }
  };

  if (!gridData || !gridData.features || gridData.features.length === 0) {
    return null;
  }

  return (
    <GeoJSON
      key={layerKey}
      data={gridData}
      style={style}
      onEachFeature={onEachFeature}
    />
  );
};

export default GridLayer;
