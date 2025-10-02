import { useEffect, useRef, useState } from 'react';
import Map, { Marker, NavigationControl, ScaleControl } from 'react-map-gl';
import { MapPin } from 'lucide-react';
import type { MissionTrip } from '../types/MissionTrip';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MissionMapProps {
  trips: MissionTrip[];
  onMarkerClick: (trip: MissionTrip) => void;
  selectedTrip: MissionTrip | null;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN_HERE';

export default function MissionMap({ trips, onMarkerClick, selectedTrip }: MissionMapProps) {
  const mapRef = useRef(null);
  const [viewState, setViewState] = useState({
    longitude: 20,
    latitude: 20,
    zoom: 2,
    pitch: 0,
    bearing: 0,
  });

  useEffect(() => {
    if (selectedTrip && mapRef.current) {
      const map = mapRef.current;
      map.flyTo({
        center: [selectedTrip.coordinates.lng, selectedTrip.coordinates.lat],
        zoom: 10,
        duration: 2000,
      });
    }
  }, [selectedTrip]);

  return (
    <div className="w-full h-full relative">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        projection="mercator"
      >
        <NavigationControl position="top-right" />
        <ScaleControl />

        {trips.map((trip) => (
          <Marker
            key={trip.id}
            longitude={trip.coordinates.lng}
            latitude={trip.coordinates.lat}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onMarkerClick(trip);
            }}
          >
            <div
              className={`relative cursor-pointer transform transition-all duration-300 hover:scale-125 ${
                selectedTrip?.id === trip.id ? 'scale-125' : ''
              }`}
            >
              <div className="absolute -top-2 -left-2 w-12 h-12 bg-mission-500 rounded-full opacity-20 animate-ping" />
              <div className="relative bg-gradient-to-br from-mission-600 to-mission-800 p-3 rounded-full shadow-2xl border-4 border-white">
                <MapPin className="w-6 h-6 text-white" fill="white" />
              </div>
              {selectedTrip?.id !== trip.id && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-lg text-xs font-semibold text-mission-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {trip.location}
                </div>
              )}
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
}
