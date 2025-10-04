import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Custom icon for species markers
const createSpeciesIcon = (color = '#3b82f6') => {
  return L.divIcon({
    className: 'custom-species-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

const SpeciesMarker = ({ occurrence }) => {
  const position = [occurrence.decimalLatitude, occurrence.decimalLongitude];
//   console.log(position);
  return (
    <Marker position={position} icon={createSpeciesIcon()}>
      <Popup maxWidth={300}>
        <div className="space-y-2">
          <h4 className="font-bold text-blue-600 text-lg">
            {occurrence.scientificName || 'Unknown Species'}
          </h4>
          
          {occurrence.vernacularName && (
            <p className="text-sm text-gray-600 italic">
              Common name: {occurrence.vernacularName}
            </p>
          )}
          
          <div className="text-sm space-y-1 border-t pt-2">
            {occurrence.eventDate && (
              <p><span className="font-medium">Date:</span> {new Date(occurrence.eventDate).toLocaleDateString()}</p>
            )}
            {occurrence.depth && (
              <p><span className="font-medium">Depth:</span> {occurrence.depth}m</p>
            )}
            {occurrence.locality && (
              <p><span className="font-medium">Location:</span> {occurrence.locality}</p>
            )}
            {occurrence.institutionCode && (
              <p><span className="font-medium">Institution:</span> {occurrence.institutionCode}</p>
            )}
          </div>
          
          {occurrence.occurrenceID && (
            <a
              href={`https://obis.org/occurrence/${occurrence.occurrenceID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-xs text-blue-600 hover:underline"
            >
              View on OBIS →
            </a>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default SpeciesMarker;
