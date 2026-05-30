import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Target, MapPin, ShieldAlert, Camera, Lock } from 'lucide-react';
import '../styles/Landing.css';

export default function Landing() {
  const navigate = useNavigate();

  const handleScrollToFeatures = () => {
    document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    {
      icon: <Zap className="text-amber-500 w-8 h-8" />,
      title: "⚡ Instant Alerts",
      description: "Real-time fire and smoke detection with sub-second notification to minimize response time."
    },
    {
      icon: <Target className="text-red-500 w-8 h-8" />,
      title: "🎯 YOLOv8 AI",
      description: "Industry-leading computer vision model optimized for rapid detection, with HSV color analysis fallback."
    },
    {
      icon: <MapPin className="text-orange-500 w-8 h-8" />,
      title: "📍 Property Management",
      description: "Monitor multiple geographic locations, status indexes, and camera networks from a single, unified dashboard."
    },
    {
      icon: <ShieldAlert className="text-red-600 w-8 h-8" />,
      title: "🚒 Responder Dashboard",
      description: "Coordinate emergency response units and track real-time dispatch routes with active responder GPS monitoring."
    },
    {
      icon: <Camera className="text-yellow-500 w-8 h-8" />,
      title: "📷 Live Analysis",
      description: "Upload static footage images or stream webcam video directly into the browser for immediate deep learning detection."
    },
    {
      icon: <Lock className="text-green-500 w-8 h-8" />,
      title: "🔒 Zero Friction",
      description: "No password, verification, or external OAuth required. Enter any email to instantly configure your dashboard."
    }
  ];

  return (
    <div className="page-wrapper min-h-screen text-[#e0e0e0] flex flex-col justify-between">
      {/* Hero Section */}
      <header className="flex-1 flex flex-col justify-center items-center text-center px-4 max-w-4xl mx-auto py-16">
        {/* Animated Fire Emoji */}
        <div className="text-7xl sm:text-8xl md:text-9xl mb-8 select-none animate-bounce duration-1000">
          🔥
        </div>

        {/* Heading */}
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-fire-500 to-[#ff8c00] bg-clip-text text-transparent drop-shadow-md font-sans">
          Agniv 2.0
        </h1>

        {/* Tagline */}
        <p className="text-lg sm:text-2xl text-gray-400 font-light mb-12 max-w-2xl leading-relaxed">
          AI-powered Fire & Smoke Detection for the Real World
        </p>

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md">
          <button
            onClick={() => navigate('/login')}
            className="btn-primary w-full sm:w-auto text-lg px-8 py-4 bg-gradient-to-r from-fire-500 to-fire-600 hover:from-fire-600 hover:to-fire-500 transition-all shadow-lg hover:shadow-fire-600/30"
          >
            Get Started
          </button>
          <button
            onClick={handleScrollToFeatures}
            className="btn-ghost w-full sm:w-auto text-lg px-8 py-4 transition-all"
          >
            View Demo
          </button>
        </div>
      </header>

      {/* Features Grid Section */}
      <section id="features-section" className="py-20 px-6 max-w-7xl mx-auto w-full border-t border-white/5">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16 text-white tracking-wide">
          State of the Art Features
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="glass-card p-8 flex flex-col gap-4 border border-white/10 rounded-xl hover:border-fire-500/30 transition-all duration-300"
            >
              <div className="mb-2 p-3 bg-white/5 rounded-lg w-fit">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white font-sans">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full text-center py-8 border-t border-white/5 text-xs text-gray-500 bg-black/10">
        <p>Built with React + Flask + YOLOv8 | Agniv 2.0</p>
      </footer>
    </div>
  );
}
