import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAlerts, clearAlerts } from '../services/api';
import '../styles/FireStationDashboard.css';
import { 
  ArrowLeft, 
  MapPin, 
  ShieldAlert, 
  Activity, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Compass,
  Zap
} from 'lucide-react';

export default function FireStationDashboard() {
  const navigate = useNavigate();

  // State
  const [location, setLocation] = useState(null); // {lat, lng}
  const [locationError, setLocationError] = useState('');
  const [alertsHistory, setAlertsHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fallback coords: Chennai, India (13.0827, 80.2707)
  const defaultCoords = { lat: 13.0827, lng: 80.2707 };
  const currentCoords = location || defaultCoords;

  // Mock teams
  const teams = [
    { name: 'Fire Team Alpha', status: 'Available', type: 'Heavy Pumper', location: 'Central Headquarters' },
    { name: 'Rescue Unit Bravo', status: 'En Route', type: 'Medical Hazmat', location: 'Industrial Sector 4' },
    { name: 'Engine Squad Charlie', status: 'On Scene', type: 'Ladder Unit', location: 'Suburban Port Terminal' },
    { name: 'Support Unit Delta', status: 'Available', type: 'Wildfire Carrier', location: 'Southern Foothills Station' }
  ];

  // Map Iframe URL Bbox Calculation
  const bbox = {
    minLng: currentCoords.lng - 0.02,
    minLat: currentCoords.lat - 0.01,
    maxLng: currentCoords.lng + 0.02,
    maxLat: currentCoords.lat + 0.01
  };
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox.minLng}%2C${bbox.minLat}%2C${bbox.maxLng}%2C${bbox.maxLat}&layer=mapnik&marker=${currentCoords.lat}%2C${currentCoords.lng}`;

  const loadAlerts = async () => {
    try {
      const data = await getAlerts(15);
      setAlertsHistory(data.alerts || []);
    } catch (err) {
      console.error('Failed to load alert history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();

    // Query GPS coordinates
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation access failed:', error.message);
          setLocationError('Geolocation permission denied. Using fallback coordinates.');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
    }
  }, []);

  const handleClearAllAlerts = async () => {
    if (!window.confirm('Are you sure you want to clear dispatch logs?')) return;
    try {
      await clearAlerts();
      setAlertsHistory([]);
    } catch (err) {
      console.error('Failed to clear alerts', err);
    }
  };

  return (
    <div className="fire-station-page page-wrapper min-h-screen text-[#e0e0e0] flex flex-col gap-6">
      
      {/* Header */}
      <header className="glass-card p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn-ghost p-2 border-none hover:bg-white/5"
            style={{ padding: '6px 12px' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="text-red-500" />
              Emergency Response Ops Center
            </h1>
            <p className="text-xs text-[#888]">
              Agniv Fire Coordination & Dispatch Desk
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
          <Compass size={14} className="text-red-500 animate-spin-slow" />
          <span>Responder GPS: {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}</span>
        </div>
      </header>

      {locationError && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg text-xs">
          {locationError}
        </div>
      )}

      {/* Main Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Section - GPS Tracking Map (8 columns) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="glass-card overflow-hidden border border-white/5 relative">
            <div className="p-4 border-b border-white/5 bg-white/20 text-sm font-bold text-white flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <MapPin className="text-red-500 w-4 h-4" /> Live Incident Dispatch Map
              </span>
              <span className="text-xs font-mono text-[#888]">OpenStreetMap Grid</span>
            </div>
            
            {/* 400px Tall Map Iframe */}
            <div style={{ height: '400px', width: '100%', position: 'relative' }}>
              <iframe
                title="GPS Dispatch Map"
                src={mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
              />
            </div>
          </div>

          {/* Team Availability Table */}
          <div className="glass-card p-6 border border-white/5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="text-fire-500 w-4 h-4" /> Responder Squad Status
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[#888]">
                    <th className="py-2 px-1">Squad Unit</th>
                    <th className="py-2 px-1">Equipment Class</th>
                    <th className="py-2 px-1">Current Sector</th>
                    <th className="py-2 px-1 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-all">
                      <td className="py-3 px-1 font-bold text-white">{team.name}</td>
                      <td className="py-3 px-1 text-[#888]">{team.type}</td>
                      <td className="py-3 px-1 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-[#888]" /> {team.location}
                      </td>
                      <td className="py-3 px-1 text-right">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          team.status === 'Available' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          team.status === 'En Route' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {team.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Section - Dispatch Control & History logs (4 columns) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Dispatch Control Desk */}
          <div className="glass-card p-6 border border-white/5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="text-red-500 w-4 h-4 animate-pulse" /> Dispatch Desk
            </h3>
            
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <span className="text-xs font-bold text-red-500 block">Open Broadcast active</span>
                <span className="text-[11px] text-[#888]">
                  Incident monitors relay alerts directly via MQTT / WebSocket pipelines.
                </span>
              </div>
            </div>

            <button
              onClick={handleClearAllAlerts}
              className="btn-ghost w-full py-2.5 text-xs text-red-500 border-red-500/15 hover:bg-red-500/5 hover:border-red-500/35"
            >
              Clear Dispatch Logs
            </button>
          </div>

          {/* Alarm Incident Logs */}
          <div className="glass-card p-6 border border-white/5 flex flex-col gap-4 flex-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="text-amber-500 w-4 h-4" /> Active Incident Log
            </h3>

            {loading ? (
              <div className="text-[#888] text-xs text-center py-10">Syncing history logs...</div>
            ) : alertsHistory.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#666] flex flex-col items-center gap-2">
                <CheckCircle className="text-green-500 w-8 h-8 opacity-40" />
                No active incidents reported.
              </div>
            ) : (
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px] pr-1">
                {alertsHistory.map((alert, idx) => (
                  <div key={idx} className="p-3 bg-white/5 border border-white/5 rounded-lg flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-[#888] font-mono">{alert.time}</span>
                      <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                        alert.type === 'fire' ? 'bg-red-500/10 text-red-400' : 'bg-gray-500/10 text-gray-300'
                      }`}>
                        {alert.type || 'alarm'}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-white">{alert.title}</span>
                    <span className="text-[11px] text-[#888] truncate">{alert.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Slow spinning animation helper */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
