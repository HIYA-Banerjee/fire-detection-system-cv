import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProperty } from '../services/api';
import { Building, MapPin, Navigation, Lock, ArrowLeft } from 'lucide-react';
import '../styles/AddProperty.css';

export default function AddProperty() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    lat: '',
    lng: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name || !formData.address) {
      setErrorMsg('Property name and address are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        address: formData.address,
        lat: formData.lat ? parseFloat(formData.lat) : 0,
        lng: formData.lng ? parseFloat(formData.lng) : 0,
        password: formData.password || ''
      };

      await createProperty(payload);
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to create property', err);
      setErrorMsg(err?.response?.data?.error || 'Failed to register property. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-property-container page-wrapper min-h-screen text-[#e0e0e0] flex items-center justify-center py-12 px-4">
      <div className="auth-card glass-card w-full max-w-lg p-8 relative border border-white/10 rounded-xl">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate('/dashboard')}
          className="btn-ghost p-2 mb-6 text-sm flex items-center gap-1.5 border-none hover:bg-white/5"
          style={{ padding: '6px 12px' }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        {/* Form Header */}
        <div className="text-center mb-8">
          <div className="p-3 bg-fire-500/10 border border-fire-500/20 rounded-xl w-fit mx-auto mb-3">
            <Building className="text-fire-500 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Add Monitored Property</h2>
          <p className="text-sm text-[#888] mt-1">Configure a new facility node for live AI detection</p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-500/15 border border-red-500/30 text-red-500 rounded-lg text-sm mb-6">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Property Name */}
          <div className="form-group flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-semibold text-gray-300">Property Name *</label>
            <div className="relative">
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Headquarters Office, Warehouse 3"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white placeholder-white/20 focus:outline-none focus:border-fire-500 transition"
              />
            </div>
          </div>

          {/* Address */}
          <div className="form-group flex flex-col gap-1.5">
            <label htmlFor="address" className="text-sm font-semibold text-gray-300">Address *</label>
            <div className="relative">
              <input
                id="address"
                name="address"
                type="text"
                placeholder="e.g. 123 Industrial Parkway, Suite A"
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white placeholder-white/20 focus:outline-none focus:border-fire-500 transition"
              />
            </div>
          </div>

          {/* Coordinates (Latitude & Longitude) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group flex flex-col gap-1.5">
              <label htmlFor="lat" className="text-sm font-semibold text-gray-300">Latitude</label>
              <input
                id="lat"
                name="lat"
                type="number"
                step="any"
                placeholder="e.g. 13.0827"
                value={formData.lat}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white placeholder-white/20 focus:outline-none focus:border-fire-500 transition"
              />
            </div>

            <div className="form-group flex flex-col gap-1.5">
              <label htmlFor="lng" className="text-sm font-semibold text-gray-300">Longitude</label>
              <input
                id="lng"
                name="lng"
                type="number"
                step="any"
                placeholder="e.g. 80.2707"
                value={formData.lng}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white placeholder-white/20 focus:outline-none focus:border-fire-500 transition"
              />
            </div>
          </div>

          {/* Coordinate Picker Note */}
          <div className="p-3 bg-white/5 border border-white/5 rounded-lg text-xs text-[#888] flex items-start gap-2 leading-relaxed">
            <Navigation size={14} className="text-fire-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Pro-tip:</strong> Use Google Maps to pin your location, copy the coordinates, and paste them above for exact mapping on the responder dashboard.
            </div>
          </div>

          {/* Access Password */}
          <div className="form-group flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-gray-300">Access Password (Optional)</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Leave blank for public access"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white placeholder-white/20 focus:outline-none focus:border-fire-500 transition"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 mt-4 bg-gradient-to-r from-fire-500 to-fire-600 hover:from-fire-600 hover:to-fire-500 transition-all font-bold"
          >
            {loading ? 'Registering Facility...' : 'Add Property'}
          </button>
        </form>
      </div>
    </div>
  );
}
