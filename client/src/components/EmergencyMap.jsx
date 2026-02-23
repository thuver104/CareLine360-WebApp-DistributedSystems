import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useRef, useCallback } from 'react';
import api from '../api/axios';

// Fix Leaflet marker icon issue
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});
// Add CSS to fix popup styling conflicts and make it look premium
const popupStyles = `
  .leaflet-popup-pane {
    z-index: 9999 !important;
  }
  .leaflet-popup {
    z-index: 9999 !important;
    background-color: transparent !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15) !important;
  }
  .leaflet-popup-content-wrapper {
    padding: 0 !important;
    border-radius: 14px !important;
    border: 1px solid rgba(0, 0, 0, 0.05) !important;
    overflow: hidden !important;
    background: #ffffff !important;
  }
  .leaflet-popup-content {
    margin: 0 !important;
    width: 240px !important;
    font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
    font-size: 13px !important;
    color: #1e293b !important;
  }
  .leaflet-popup-tip {
    background: #ffffff !important;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1) !important;
  }
  .leaflet-container a.leaflet-popup-close-button {
    top: 10px !important;
    right: 10px !important;
    color: #ffffff !important;
    background: rgba(0,0,0,0.2) !important;
    width: 20px !important;
    height: 20px !important;
    border-radius: 50% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 12px !important;
    text-decoration: none !important;
    transition: all 0.2s ease !important;
  }
  .leaflet-container a.leaflet-popup-close-button:hover {
    background: rgba(0,0,0,0.4) !important;
    color: #ffffff !important;
  }
`;

// Helper for structured data rows
const DataRow = ({ label, value, color = "#64748b" }) => (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '4px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '10px', fontWeight: '800', color: color, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '60px', paddingTop: '2px' }}>{label}</span>
        <span style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b', flex: 1, lineHeight: '1.4' }}>{value || 'Not provided'}</span>
    </div>
);

// Inject styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = popupStyles;
    if (!document.head.querySelector('style[data-leaflet-popup-fix]')) {
        styleSheet.setAttribute('data-leaflet-popup-fix', 'true');
        document.head.appendChild(styleSheet);
    }
}
const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const blueIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function ChangeView({ center, zoom }) {
    const map = useMap();
    map.setView(center, zoom);
    return null;
}

const EmergencyMap = ({ emergency }) => {
    const [nearestHospital, setNearestHospital] = useState(null);
    const [allHospitals, setAllHospitals] = useState([]);
    const markerRef = useRef(null);

    // Auto-open the emergency popup when marker mounts
    const setMarkerRef = useCallback((node) => {
        if (node) {
            markerRef.current = node;
            // Small delay to ensure popup is ready
            setTimeout(() => {
                node.openPopup();
            }, 300);
        }
    }, []);

    useEffect(() => {
        fetchAllHospitals();
        if (emergency) {
            fetchNearestHospital();
        }
    }, [emergency]);

    const fetchAllHospitals = async () => {
        try {
            const response = await api.get('/hospitals');
            setAllHospitals(response.data.data);
        } catch (error) {
            console.error('Failed to load all hospitals');
        }
    };

    const fetchNearestHospital = async () => {
        try {
            const response = await api.get(`/emergency/${emergency._id}/nearest-hospital`);
            setNearestHospital(response.data.nearestHospital);
        } catch (error) {
            console.error('Failed to load nearest hospital');
        }
    };

    if (!emergency || typeof emergency.latitude !== 'number' || typeof emergency.longitude !== 'number') {
        return <div className="h-[400px] w-full rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 italic">Location data unavailable</div>;
    }

    const center = [emergency.latitude, emergency.longitude];

    return (
        <div className="h-full w-full relative group">
            <MapContainer
                center={center}
                zoom={13}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%', zIndex: 1 }}
                className="rounded-2xl"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ChangeView center={center} zoom={13} />

                <Marker position={center} icon={redIcon} ref={setMarkerRef}>
                    <Popup closeButton={false} closeOnClick={false} autoClose={false} keepInView={true}>
                        <div style={{ overflow: 'hidden' }}>
                            {/* Header */}
                            <div style={{ background: '#ef4444', padding: '10px 16px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                <p style={{ fontWeight: '900', color: '#ffffff', margin: 0, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>🚨 EMERGENCY LOCATION</p>
                            </div>

                            {/* Body */}
                            <div style={{ padding: '16px' }}>
                                <DataRow label="Patient" value={emergency.patient?.fullName} color="#ef4444" />
                                <DataRow label="Contact" value={emergency.patient?.phone || emergency.patient?.contact} />
                                <DataRow label="Address" value={emergency.patient?.address} />

                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #e2e8f0' }}>
                                    <DataRow label="Status" value={emergency.status} />
                                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748b', fontStyle: 'italic', lineHeight: '1.5' }}>
                                        {emergency.description ? `"${emergency.description}"` : 'No situation details provided.'}
                                    </p>
                                </div>

                                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.6 }}>
                                    <span style={{ fontSize: '9px', fontWeight: '800', fontFamily: 'monospace' }}>{emergency.latitude?.toFixed(5)}, {emergency.longitude?.toFixed(5)}</span>
                                    <span style={{ fontSize: '9px', fontWeight: '800' }}>{new Date(emergency.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        </div>
                    </Popup>
                </Marker>

                {allHospitals.map(h => (
                    <Marker key={h._id} position={[h.lat, h.lng]} icon={blueIcon}>
                        <Popup>
                            <div style={{ overflow: 'hidden' }}>
                                {/* Header */}
                                <div style={{ background: '#3b82f6', padding: '10px 16px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                    <p style={{ fontWeight: '900', color: '#ffffff', margin: 0, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>🏥 {h.name}</p>
                                </div>

                                {/* Body */}
                                <div style={{ padding: '16px' }}>
                                    <DataRow label="Address" value={h.address} color="#3b82f6" />
                                    <DataRow label="Contact" value={h.contact} />
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {nearestHospital && (
                    <Marker position={[nearestHospital.lat, nearestHospital.lng]} icon={greenIcon}>
                        <Popup closeButton={false} closeOnClick={false} autoClose={false} keepInView={true}>
                            <div style={{ overflow: 'hidden' }}>
                                {/* Header */}
                                <div style={{ background: '#10b981', padding: '10px 16px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                    <p style={{ fontWeight: '900', color: '#ffffff', margin: 0, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>🏥 NEAREST HOSPITAL</p>
                                </div>

                                {/* Body */}
                                <div style={{ padding: '16px' }}>
                                    <DataRow label="Name" value={nearestHospital.name} color="#10b981" />
                                    <DataRow label="Address" value={nearestHospital.address} />
                                    <DataRow label="Contact" value={nearestHospital.contact} />

                                    <div style={{ marginTop: '12px', padding: '8px 12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #dcfce7', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '14px' }}>📍</span>
                                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#065f46' }}>{nearestHospital.distance} km away</span>
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>

            {nearestHospital && (
                <div className="absolute bottom-4 left-4 right-4 bg-white p-3 rounded-xl shadow-lg z-[1000] border border-emerald-100 flex items-center justify-between pointer-events-none">
                    <div>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Fastest Route Suggested</p>
                        <p className="font-bold text-slate-800">{nearestHospital.name}</p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-sm font-bold">
                        {nearestHospital.distance} km
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmergencyMap;
