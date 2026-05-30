import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import '../styles/Dashboard.css';
import { 
  getProperties, 
  getStatus, 
  getAlerts, 
  deleteProperty, 
  clearAlerts 
} from '../services/api';
import { 
  Building, 
  AlertTriangle, 
  Play, 
  Activity, 
  Plus, 
  Trash2, 
  Monitor, 
  LogOut,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Server
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [properties, setProperties] = useState([]);
  const [status, setStatus] = useState({ running: false, fps: 0, alert_active: false, detections: [] });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    try {
      const props = await getProperties();
      setProperties(props || []);
    } catch (err) {
      console.error('Failed to load properties', err);
    }

    try {
      const stats = await getStatus();
      setStatus(stats || { running: false, fps: 0, alert_active: false, detections: [] });
    } catch (err) {
      console.error('Failed to load status', err);
    }

    try {
      const alertData = await getAlerts(50);
      setAlerts(alertData.alerts || []);
    } catch (err) {
      console.error('Failed to load alerts', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // Poll status every 5s
    const statusInterval = setInterval(async () => {
      try {
        const stats = await getStatus();
        setStatus(stats || { running: false, fps: 0, alert_active: false, detections: [] });
      } catch (err) {
        console.error('Error polling status', err);
      }
    }, 5000);

    return () => clearInterval(statusInterval);
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    try {
      await deleteProperty(id);
      setProperties(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete property', err);
      setErrorMsg('Failed to delete property');
    }
  };

  const handleClearAllAlerts = async () => {
    try {
      await clearAlerts();
      setAlerts([]);
      setStatus(prev => ({ ...prev, alert_active: false, detections: [] }));
    } catch (err) {
      console.error('Failed to clear alerts', err);
    }
  };

  const handleLogoutClick = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="dashboard page-wrapper min-h-screen text-[#e0e0e0] flex flex-col gap-6">

      {/* Alert Banner */}
      {status.alert_active && (
        <div className="alert-banner p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="text-3xl animate-pulse">⚠️</div>
            <div>
              <h3 className="text-xl font-bold text-red-500">Active Fire/Smoke Alert!</h3>
              <p className="text-sm text-gray-300">
                AI detector has identified a high-probability incident on your network.
              </p>
            </div>
          </div>
          <button 
            onClick={handleClearAllAlerts} 
            className="btn-primary bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6"
          >
            Clear Alerts
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/15 border border-red-500/30 text-red-500 rounded-lg text-sm">
          {errorMsg}
        </div>
      )}

      {/* Stats Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <span className="text-sm text-[#888] font-medium block">Total Properties</span>
            <span className="text-3xl font-bold text-white mt-1 block">{properties.length}</span>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/5">
            <Building className="text-amber-500 w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <span className="text-sm text-[#888] font-medium block">Active Incidents</span>
            <span className={`text-3xl font-bold mt-1 block ${status.alert_active ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
              {status.alert_active ? 'ACTIVE' : 'None'}
            </span>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/5">
            <AlertTriangle className="text-red-500 w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <span className="text-sm text-[#888] font-medium block">AI Detector</span>
            <span className={`text-3xl font-bold mt-1 block ${status.running ? 'text-green-500' : 'text-gray-400'}`}>
              {status.running ? 'Running' : 'Stopped'}
            </span>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/5">
            <Play className="text-green-500 w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <span className="text-sm text-[#888] font-medium block">Alerts Logged</span>
            <span className="text-3xl font-bold text-white mt-1 block">{alerts.length}</span>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/5">
            <Activity className="text-yellow-500 w-6 h-6" />
          </div>
        </div>
      </section>

      {/* Properties Section Header */}
      <section className="flex justify-between items-center mt-4">
        <h2 className="text-xl font-bold text-white">Monitored Properties</h2>
        <button
          onClick={() => navigate('/add-property')}
          className="btn-primary flex items-center gap-2 bg-fire-500 hover:bg-fire-600 font-semibold"
        >
          <Plus size={18} /> Add Property
        </button>
      </section>

      {/* Properties Grid */}
      <section className="flex-1">
        {loading ? (
          <div className="text-center py-20 text-[#888]">Loading dashboard data...</div>
        ) : properties.length === 0 ? (
          <div className="glass-card text-center py-16 px-6 flex flex-col items-center justify-center border-dashed border-2 border-white/10">
            <Building className="w-16 h-16 text-[#888] mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No properties yet</h3>
            <p className="text-sm text-[#888] max-w-sm mb-6">
              Get started by registering your first building, facility, or monitoring node coordinates.
            </p>
            <button
              onClick={() => navigate('/add-property')}
              className="btn-primary bg-fire-500 hover:bg-fire-600 font-semibold"
            >
              Add Property
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div key={property.id} className="glass-card p-6 flex flex-col justify-between gap-4 border border-white/10 hover:border-fire-500/20 transition-all duration-200">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-lg font-bold text-white tracking-wide truncate max-w-[80%]">{property.name}</h3>
                    {/* Status Dot */}
                    <span 
                      className={`status-dot ${
                        status.alert_active && status.detections?.length > 0 ? 'alert' : 'online'
                      }`} 
                      title={status.alert_active && status.detections?.length > 0 ? 'ALERT ACTIVE' : 'Healthy Monitoring'} 
                    />
                  </div>
                  <p className="text-sm text-[#888] flex items-center gap-1.5 mt-2">
                    <MapPin size={14} className="flex-shrink-0" />
                    <span className="truncate">{property.address}</span>
                  </p>
                  {property.lat && property.lng && (
                    <p className="text-xs text-[#666] mt-1 font-mono">
                      GPS: {Number(property.lat).toFixed(4)}, {Number(property.lng).toFixed(4)}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 border-t border-white/5 pt-4 mt-2">
                  <button
                    onClick={() => navigate(`/camera/${property.id}`)}
                    className="btn-ghost flex-1 py-2 text-xs font-bold flex justify-center items-center gap-1.5 border-fire-500/20 text-fire-500 hover:bg-fire-500/5"
                  >
                    <Monitor size={14} /> Monitor
                  </button>
                  <button
                    onClick={(e) => handleDelete(property.id, e)}
                    className="btn-ghost py-2 px-3 text-xs font-bold text-red-500 border-red-500/20 hover:bg-red-500/5 hover:border-red-500/30"
                    title="Delete Property"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
