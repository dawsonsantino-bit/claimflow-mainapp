import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Loader2 } from 'lucide-react';

// Fix leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom fire marker icon
const fireIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNCIgZmlsbD0iI0ZGNTcyMiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPHBhdGggZD0iTTE2IDhMMTggMTJMMjIgMTRMMTggMTZMMTYgMjBMMTQgMTZMMTAgMTRMMTQgMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function MapController({ alerts }) {
  const map = useMap();

  useEffect(() => {
    if (alerts && alerts.length > 0) {
      const validAlerts = alerts.filter(a => a.lat && a.lon);
      if (validAlerts.length > 0) {
        const bounds = L.latLngBounds(validAlerts.map(a => [a.lat, a.lon]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    }
  }, [alerts, map]);

  return null;
}

export default function FireMap({ alerts, onAlertClick, isLoading }) {
  const validAlerts = alerts.filter(a => a.lat && a.lon);

  if (isLoading) {
    return (
      <div className="h-96 bg-slate-100 rounded flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (validAlerts.length === 0) {
    return (
      <div className="h-96 bg-slate-100 rounded flex items-center justify-center text-slate-500">
        <div className="text-center">
          <p className="font-medium">No alerts with location data</p>
          <p className="text-sm">Add alerts with lat/lon to see them on the map</p>
        </div>
      </div>
    );
  }

  const center = validAlerts.length === 1 
    ? [validAlerts[0].lat, validAlerts[0].lon]
    : [validAlerts.reduce((sum, a) => sum + a.lat, 0) / validAlerts.length,
       validAlerts.reduce((sum, a) => sum + a.lon, 0) / validAlerts.length];

  return (
    <div className="h-96 rounded overflow-hidden border">
      <MapContainer 
        center={center} 
        zoom={10} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController alerts={validAlerts} />
        {validAlerts.map(alert => (
          <Marker 
            key={alert.id} 
            position={[alert.lat, alert.lon]}
            icon={fireIcon}
            eventHandlers={{
              click: () => onAlertClick(alert)
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{alert.headline || alert.event_type}</p>
                <p className="text-xs text-slate-600">{alert.address_text}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(alert.received_at).toLocaleString()}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}