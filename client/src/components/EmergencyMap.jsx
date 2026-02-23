import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import api from '../services/api';

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

    useEffect(() => {
        if (emergency) {
            fetchNearestHospital();
        }
    }, [emergency]);

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
        <div className="h-[400px] w-full rounded-2xl overflow-hidden shadow-inner border relative group">
            <MapContainer center={center} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ChangeView center={center} zoom={13} />

                <Marker position={center} icon={redIcon}>
                    <Popup>
                        <div className="font-sans">
                            <p className="font-bold text-red-600">EMERGENCY LOCATION</p>
                            <p className="text-sm font-medium">{emergency.patient?.name}</p>
                        </div>
                    </Popup>
                </Marker>

                {nearestHospital && (
                    <Marker position={[nearestHospital.lat, nearestHospital.lng]} icon={greenIcon}>
                        <Popup>
                            <div className="font-sans">
                                <p className="font-bold text-emerald-600">NEAREST HOSPITAL</p>
                                <p className="text-sm font-medium">{nearestHospital.name}</p>
                                <p className="text-xs text-slate-500">{nearestHospital.distance} km away</p>
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
