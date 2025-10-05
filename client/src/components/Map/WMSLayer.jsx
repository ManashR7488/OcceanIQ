import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * WMS Layer component for displaying pollution data from Copernicus Marine Service
 * Uses Leaflet's WMS TileLayer through the backend proxy
 */
function WMSLayer({ 
  url, 
  layers, 
  opacity = 0.7, 
  time, 
  bounds,
  dataset = 'global-analysis-forecast-phy-001-024'
}) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!map || !layers) return;

    // Create WMS tile layer
    const wmsLayer = L.tileLayer.wms(url, {
      layers: layers,
      format: 'image/png',
      transparent: true,
      version: '1.3.0',
      opacity: opacity,
      attribution: '&copy; Copernicus Marine Service',
      // Additional WMS parameters
      dataset: dataset,
      time: time || undefined,
      // Bounds if specified
      bounds: bounds || undefined
    });

    // Add layer to map
    wmsLayer.addTo(map);
    layerRef.current = wmsLayer;

    // Cleanup on unmount
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, url, layers, dataset]);

  // Update opacity when it changes
  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.setOpacity(opacity);
    }
  }, [opacity]);

  // Update time parameter when it changes
  useEffect(() => {
    if (layerRef.current && time) {
      layerRef.current.setParams({ time }, false);
      layerRef.current.redraw();
    }
  }, [time]);

  return null; // This component doesn't render anything itself
}

export default WMSLayer;
