import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { detectFrame, startDetection, stopDetection, getAlerts, clearAlerts } from '../services/api';
import { io } from 'socket.io-client';
import '../styles/CameraManagement.css';

export default function CameraManagement() {
  const { propertyId } = useParams();
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const socketRef = useRef(null);

  const [isRunning, setIsRunning] = useState(false);
  const [annotatedFrame, setAnnotatedFrame] = useState(null);
  const [detections, setDetections] = useState([]);
  const [alertActive, setAlertActive] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');
  const [fps, setFps] = useState(0);
  const [streamReady, setStreamReady] = useState(false);
  const [gpsBind, setGpsBind] = useState('Querying...');

  // Setup socket connection and load initial alerts
  useEffect(() => {
    // Load existing alerts log
    getAlerts(20)
      .then((data) => {
        setAlerts(data || []);
      })
      .catch((err) => console.error('Failed to pre-load alerts log', err));

    // Get GPS coordinates
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsBind(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        () => {
          setGpsBind('Unavailable (Permission Denied)');
        }
      );
    } else {
      setGpsBind('Unavailable');
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://fire-detection-backend-c1xy.onrender.com';
    socketRef.current = io(SOCKET_URL, { 
      withCredentials: true, 
      transports: ['websocket', 'polling'] 
    });

    socketRef.current.on('connect', () => {
      console.log('Socket.IO monitoring connection open');
    });

    socketRef.current.on('alert', (data) => {
      setAlertActive(true);
      setAlerts((prev) => [data, ...prev].slice(0, 20));
    });

    socketRef.current.on('alerts_cleared', () => {
      setAlertActive(false);
      setAlerts([]);
    });

    // Cleanup on unmount
    return () => {
      clearInterval(intervalRef.current);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  async function handleStart() {
    setError('');
    try {
      // 1. Get webcam
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 }, 
          facingMode: 'environment' 
        }, 
        audio: false 
      });
      
      // 2. Attach to video element - THIS IS CRITICAL
      const video = videoRef.current;
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play();
        setStreamReady(true);
      };
      
      // 3. Tell backend detection is starting
      await startDetection();
      setIsRunning(true);

      // 4. Start frame capture loop — wait 1 second for video to be ready
      setTimeout(() => {
        let frameCount = 0;
        let lastFpsTime = Date.now();
        
        intervalRef.current = setInterval(async () => {
          const vid = videoRef.current;
          const canvas = canvasRef.current;
          if (!vid || !canvas || vid.readyState < 2 || vid.videoWidth === 0) return;
          
          // Draw frame to canvas
          canvas.width = vid.videoWidth;
          canvas.height = vid.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
          
          // Get base64 frame
          const frameData = canvas.toDataURL('image/jpeg', 0.7);
          
          try {
            const result = await detectFrame(frameData);
            if (result.annotated_image) {
              setAnnotatedFrame(result.annotated_image);
            }
            setDetections(result.detections || []);
            if (result.alert) {
              setAlertActive(true);
            }
            
            // FPS counter
            frameCount++;
            const now = Date.now();
            if (now - lastFpsTime >= 1000) {
              setFps(frameCount);
              frameCount = 0;
              lastFpsTime = now;
            }
          } catch (err) {
            console.error('Frame detection error:', err);
          }
        }, 500); // every 500ms = ~2fps detection
      }, 1000);
      
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and try again.');
      } else {
        setError('Failed to start camera: ' + err.message);
      }
    }
  }

  function handleStop() {
    clearInterval(intervalRef.current);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    stopDetection();
    setIsRunning(false);
    setStreamReady(false);
    setAnnotatedFrame(null);
    setDetections([]);
    setFps(0);
  }

  const handleClearAlerts = async () => {
    try {
      await clearAlerts();
      setAlertActive(false);
      setAlerts([]);
    } catch (err) {
      console.error('Failed to clear alerts log', err);
    }
  };

  return (
    <div className="camera-page text-[#e0e0e0] max-w-7xl mx-auto flex flex-col gap-6">
      
      {/* Back Header */}
      <div className="flex justify-between items-center mb-2">
        <button 
          onClick={() => { handleStop(); navigate('/dashboard'); }}
          className="btn-ghost"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px' }}
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-xl font-bold text-white">Monitoring Node: {propertyId}</h1>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '12px 16px', borderRadius: '8px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {alertActive && (
        <div className="alert-banner animate-pulse" style={{ backgroundColor: 'rgba(239,68,68,0.15)', border: '2px solid #ef4444', borderRadius: '12px', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2rem' }}>🔥</span>
            <div>
              <h3 style={{ margin: 0, color: '#ef4444', fontWeight: 'bold', fontSize: '1.15rem' }}>FIRE/SMOKE DETECTED</h3>
              <p style={{ margin: '4px 0 0 0', color: '#e0e0e0', fontSize: '0.9rem' }}>Dispatch emergency response teams immediately!</p>
            </div>
          </div>
          <button 
            className="btn-stop" 
            onClick={handleClearAlerts}
            style={{ padding: '8px 20px', fontSize: '0.85rem' }}
          >
            Clear Alert
          </button>
        </div>
      )}

      <div className="camera-layout">
        
        {/* LEFT COLUMN: video panel */}
        <div className="video-panel flex flex-col gap-4">
          <div className="video-wrapper">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="video-feed"
              style={{ display: annotatedFrame ? 'none' : 'block' }}
            />
            
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            {annotatedFrame && (
              <img 
                src={annotatedFrame} 
                alt="AI Detection" 
                className="video-feed annotated"
              />
            )}
            
            {!isRunning && (
              <div className="video-placeholder">
                <span style={{fontSize:'48px'}}>📷</span>
                <p style={{ margin: 0, fontWeight: 500 }}>Click "Start Detection" to begin</p>
              </div>
            )}
            
            {isRunning && (
              <div className="fps-badge">{fps} FPS</div>
            )}
          </div>
          
          <div className="controls-bar">
            <div>
              <span className="mode-label" style={{ fontSize: '12px', color: '#888', display: 'block' }}>Active Mode</span>
              <span className="mode-value" style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>Webcam Live Stream</span>
            </div>
            {!isRunning ? (
              <button className="btn-start" onClick={handleStart}>🔴 Start Detection</button>
            ) : (
              <button className="btn-stop" onClick={handleStop}>⏹ Stop Detection</button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: diagnostics panel */}
        <div className="detections-panel flex flex-col gap-6">
          
          {/* Panel 1: Live AI Diagnostics */}
          <div className="diagnostics-box" style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>Live AI Diagnostics</h3>
            
            {detections.length === 0 && !alertActive ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', fontSize: '14px' }}>
                <span>✓</span>
                <span>No fire or smoke signatures detected.</span>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '14px', marginBottom: '16px', fontWeight: 'bold' }}>
                  <span>⚠</span>
                  <span>ALERT: Detection active!</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {detections.map((det, idx) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                        <span className={det.label.toLowerCase() === 'fire' ? 'text-red-500' : 'text-gray-300'}>
                          {det.label.toUpperCase()}
                        </span>
                        <span>{(det.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="confidence-bar-bg">
                        <div 
                          className="confidence-bar-fill" 
                          style={{ 
                            width: `${(det.confidence * 100).toFixed(0)}%`,
                            backgroundColor: det.label.toLowerCase() === 'fire' ? '#ff4500' : '#888'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Panel 2: NODE STATUS */}
          <div className="status-box" style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>Node Status</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                <span style={{ color: '#888' }}>Connection</span>
                <span style={{ fontWeight: '600', color: socketRef.current?.connected ? '#22c55e' : '#ef4444' }}>
                  {socketRef.current?.connected ? 'WebSocket Active' : 'Disconnected'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                <span style={{ color: '#888' }}>Detection</span>
                <span style={{ fontWeight: '600', color: isRunning ? '#22c55e' : '#888' }}>
                  {isRunning ? 'Running' : 'Idle'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                <span style={{ color: '#888' }}>FPS</span>
                <span style={{ fontWeight: '600', color: '#fff' }}>{fps} fps</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>GPS Bind</span>
                <span style={{ fontWeight: '600', color: '#fff' }}>{gpsBind}</span>
              </div>
            </div>
          </div>

          {/* Panel 3: Recent Alerts */}
          <div className="alerts-history-box" style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>Recent Alerts (Last 5)</h3>
            
            {alerts.length === 0 ? (
              <div style={{ color: '#888', fontSize: '12px', textAlign: 'center', padding: '12px' }}>
                No alerts recorded
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {alerts.slice(0, 5).map((item, idx) => (
                  <div key={idx} style={{ borderBottom: idx === 4 ? 'none' : '1px solid rgba(255,255,255,0.05)', padding: '8px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: '#888' }}>{new Date(item.timestamp || item.time || Date.now()).toLocaleTimeString()}</span>
                      <span style={{ fontWeight: 'bold', color: item.type === 'fire' ? '#ff4500' : '#ccc' }}>
                        {(item.type || 'ALERT').toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#bbb', marginTop: '2px' }}>
                      Detections: {item.count || item.detections?.length || 0}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
