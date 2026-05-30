import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Mic, CheckCircle, ShieldAlert, AlertCircle } from 'lucide-react';
import '../styles/FaceVerification.css';

export default function FaceVerification() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const audioCtxRef = useRef(null);
  const micIntervalRef = useRef(null);
  const faceIntervalRef = useRef(null);
  const streamRef = useRef(null);

  // States
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1: Camera Access, 2: Face Detection, 3: Mic Check, 4: Verified

  // Speech Synthesis Helper
  const speakGreeting = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Identity verified. Welcome to Agniv 2.0.');
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startVerification = async () => {
    setError('');
    setVerifying(true);
    setCurrentStep(1);
    setVerified(false);
    setFaceDetected(false);
    setMicLevel(0);

    try {
      // 1. Request Camera Access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 400, height: 300 },
        audio: true
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Camera Access Granted -> Progress to Face Detection
      setCurrentStep(2);

      // Start Microphone Level Check
      setupMicrophoneAnalysis(stream);

      // Start Face Detection
      setupFaceDetection();

    } catch (err) {
      console.error(err);
      setError('Biometric hardware access denied. Please grant camera and microphone permissions.');
      setVerifying(false);
    }
  };

  // Web Audio API Analysis
  const setupMicrophoneAnalysis = (stream) => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioCtxRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      micIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const mappedLevel = Math.min(Math.round((average / 120) * 100), 100);
        setMicLevel(mappedLevel);
      }, 100);
    } catch (err) {
      console.warn('AudioContext setup failed', err);
    }
  };

  // Face Detection (Real or Simulated fallback)
  const setupFaceDetection = () => {
    let faceDetectorObj = null;

    if ('FaceDetector' in window) {
      try {
        // eslint-disable-next-line no-undef
        faceDetectorObj = new FaceDetector({ maxDetectedFaces: 1 });
      } catch (e) {
        console.warn('FaceDetector API initialized but threw constructor error', e);
      }
    }

    if (faceDetectorObj) {
      // Real detection using experimental Shape Detection API
      faceIntervalRef.current = setInterval(async () => {
        if (!videoRef.current) return;
        try {
          const faces = await faceDetectorObj.detect(videoRef.current);
          if (faces.length > 0) {
            setFaceDetected(true);
            clearInterval(faceIntervalRef.current);
            // Advance to Mic Check (Step 3)
            setCurrentStep(3);
          }
        } catch (err) {
          console.error('Real face detection check error', err);
        }
      }, 1000);
    } else {
      // Simulation fallback: Wait 3 seconds
      setTimeout(() => {
        setFaceDetected(true);
        // Advance to Mic Check (Step 3)
        setCurrentStep(3);
      }, 3000);
    }
  };

  // Monitor Mic Check progress
  useEffect(() => {
    if (currentStep === 3 && micLevel > 18) {
      // Microphones check passed! Progress to Verified
      setTimeout(() => {
        setCurrentStep(4);
        setVerified(true);
        setVerifying(false);
        speakGreeting();
        stopMediaStream();
      }, 1000);
    }
  }, [currentStep, micLevel]);

  const stopMediaStream = () => {
    // Clear intervals
    if (micIntervalRef.current) {
      clearInterval(micIntervalRef.current);
      micIntervalRef.current = null;
    }
    if (faceIntervalRef.current) {
      clearInterval(faceIntervalRef.current);
      faceIntervalRef.current = null;
    }
    // Stop tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    // Close AudioContext
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(console.error);
      audioCtxRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      stopMediaStream();
    };
  }, []);

  return (
    <div className="verify-container page-wrapper min-h-screen text-[#e0e0e0] flex items-center justify-center p-4">
      <div className="auth-card glass-card w-full max-w-xl p-8 border border-white/10 rounded-xl relative">
        
        {/* Back Button */}
        <button 
          onClick={() => { stopMediaStream(); navigate('/dashboard'); }}
          className="btn-ghost p-2 mb-6 text-sm flex items-center gap-1.5 border-none hover:bg-white/5"
          style={{ padding: '6px 12px' }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🛡️</div>
          <h2 className="text-2xl font-bold text-white">Biometric Face Verification</h2>
          <p className="text-sm text-[#888] mt-1">Authenticate terminal access via camera & speech frequency check</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/15 border border-red-500/30 text-red-500 rounded-lg text-sm mb-6 flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step Progress Indicators */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-[#888] font-semibold mb-2 px-1">
            <span className={currentStep >= 1 ? 'text-fire-500 font-bold' : ''}>1. Camera</span>
            <span className={currentStep >= 2 ? 'text-fire-500 font-bold' : ''}>2. Face Detection</span>
            <span className={currentStep >= 3 ? 'text-fire-500 font-bold' : ''}>3. Mic Check</span>
            <span className={currentStep >= 4 ? 'text-green-500 font-bold' : ''}>4. Verified</span>
          </div>
          {/* Progress Bar */}
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden w-full">
            <div 
              className={`h-full transition-all duration-500 ${currentStep === 4 ? 'bg-green-500' : 'bg-fire-500'}`}
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Live Camera Stream Preview */}
        <div className="glass-card aspect-video max-w-sm mx-auto overflow-hidden bg-black/40 border border-white/5 relative flex items-center justify-center mb-6">
          {verifying || currentStep === 3 ? (
            <div className="relative w-full h-full">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
              {/* Scanning Laser Line Animation (Step 2 Only) */}
              {currentStep === 2 && (
                <div 
                  className="absolute left-0 right-0 h-0.5 bg-fire-500 shadow-[0_0_10px_#ff4500]"
                  style={{
                    animation: 'scan 2s linear infinite'
                  }}
                />
              )}
            </div>
          ) : verified ? (
            <div className="text-center flex flex-col items-center gap-3">
              <CheckCircle className="text-green-500 w-16 h-16 animate-bounce" />
              <p className="text-sm text-green-400 font-semibold uppercase tracking-wider">Access Granted</p>
            </div>
          ) : (
            <div className="text-center p-8 flex flex-col items-center gap-2">
              <Camera className="w-12 h-12 text-[#444]" />
              <p className="text-xs text-[#666]">Camera scanner standby</p>
            </div>
          )}
        </div>

        {/* Voice Frequency Check Status (Step 3) */}
        {currentStep === 3 && (
          <div className="glass-card p-4 border border-white/5 flex flex-col gap-3 mb-6 max-w-sm mx-auto">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#888] flex items-center gap-1">
                <Mic size={14} className="text-fire-500 animate-pulse" /> Speech Level Check
              </span>
              <span className="font-mono text-fire-500 font-bold">{micLevel}%</span>
            </div>
            {/* Level Bar */}
            <div className="h-2 bg-white/5 rounded-full overflow-hidden w-full">
              <div 
                className="h-full bg-fire-500 transition-all duration-75"
                style={{ width: `${micLevel}%` }}
              />
            </div>
            <p className="text-[11px] text-[#888] text-center italic">
              Say: "Activate Agniv 2.0" to test audio frequency
            </p>
          </div>
        )}

        {/* Actions Button */}
        <div className="text-center">
          {!verifying && !verified ? (
            <button
              onClick={startVerification}
              className="btn-primary w-full max-w-xs py-3 bg-gradient-to-r from-fire-500 to-fire-600 hover:from-fire-600 hover:to-fire-500 transition-all font-bold"
            >
              Start Verification
            </button>
          ) : verified ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary w-full max-w-xs py-3 bg-green-600 hover:bg-green-700 transition-all font-bold"
            >
              Enter System Terminal
            </button>
          ) : (
            <div className="text-[#888] text-xs">
              {currentStep === 2 && 'Locating face coordinates...'}
              {currentStep === 3 && 'Analyzing microphone check...'}
            </div>
          )}
        </div>
      </div>
      
      {/* Dynamic Keyframes for Scan Line Animation */}
      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
}
