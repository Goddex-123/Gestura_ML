"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const webcamRef = useRef<Webcam>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentSign, setCurrentSign] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [handsDetected, setHandsDetected] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);

  const handleUserMedia = () => {
    console.log("Camera started successfully");
    setCameraError(null);
  };

  const handleUserMediaError = (error: string | DOMException) => {
    console.error("Camera error:", error);
    setCameraError(typeof error === 'string' ? error : error.message);
  };

  // Text-to-Speech
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      speechSynthesis.speak(utterance);
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/predict");
    
    ws.onopen = () => {
      setIsConnected(true);
      console.log("Connected to Gestura API");
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "prediction") {
        setHandsDetected(data.hands_detected);
        if (data.action && data.confidence > 0.7) {
          if (data.action !== currentSign) {
            setCurrentSign(data.action);
            setHistory(prev => [...prev.slice(-4), data.action]);
            speak(data.action);
          }
          setConfidence(data.confidence);
        }
      }
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      console.log("Disconnected");
    };
    
    wsRef.current = ws;
  }, [currentSign, speak]);

  // Send frames to backend
  useEffect(() => {
    if (!isTranslating || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    const interval = setInterval(() => {
      if (webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "frame", data: imageSrc }));
        }
      }
    }, 100); // 10 FPS
    
    return () => clearInterval(interval);
  }, [isTranslating]);

  const [demoMode, setDemoMode] = useState(true); // Demo mode by default

  const toggleTranslation = () => {
    if (demoMode) {
      // Demo mode - simulate detections
      setIsTranslating(!isTranslating);
      setIsConnected(true);
    } else {
      // Real mode - connect to backend
      if (!isConnected) {
        connect();
      }
      setIsTranslating(!isTranslating);
    }
  };

  // Demo mode effect - simulate random detections
  useEffect(() => {
    if (!isTranslating || !demoMode) return;
    
    const actions = ['hello', 'thanks', 'iloveyou', 'yes', 'no'];
    let lastAction = '';
    
    const interval = setInterval(() => {
      // Simulate hand detection
      setHandsDetected(true);
      
      // 30% chance to detect a sign
      if (Math.random() > 0.7) {
        let newAction = actions[Math.floor(Math.random() * actions.length)];
        // Avoid repeating same sign
        while (newAction === lastAction) {
          newAction = actions[Math.floor(Math.random() * actions.length)];
        }
        lastAction = newAction;
        
        setCurrentSign(newAction);
        setConfidence(0.75 + Math.random() * 0.2);
        setHistory(prev => [...prev.slice(-4), newAction]);
        speak(newAction);
      }
    }, 2000);
    
    return () => {
      clearInterval(interval);
      setHandsDetected(false);
    };
  }, [isTranslating, demoMode, speak]);

  return (
    <main className="min-h-screen relative grid-overlay">
      {/* Animated Background */}
      <div className="gradient-bg" />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-6">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold neon-text tracking-wider"
          >
            GESTURA
          </motion.h1>
          
          <div className="flex items-center gap-4">
            {demoMode && (
              <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                DEMO MODE
              </span>
            )}
            <span className={`flex items-center gap-2 text-sm ${isConnected ? 'text-[#00fff2]' : 'text-gray-500'}`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#00fff2] animate-pulse' : 'bg-gray-500'}`} />
              {isConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Video Feed */}
          <div className="lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass neon-glow relative overflow-hidden"
            >
              <div className="aspect-video relative bg-gray-900">
                {cameraError ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-6">
                      <p className="text-red-400 mb-2">📷 Camera Error</p>
                      <p className="text-gray-500 text-sm">{cameraError}</p>
                    </div>
                  </div>
                ) : (
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover rounded-2xl"
                    mirrored
                    onUserMedia={handleUserMedia}
                    onUserMediaError={handleUserMediaError}
                    videoConstraints={{
                      width: 1280,
                      height: 720,
                      facingMode: "user"
                    }}
                  />
                )}
                
                {/* Scanning Effect */}
                {isTranslating && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="scan-line" />
                    <div className="absolute inset-0 border-2 border-[#00fff2] rounded-2xl opacity-50" />
                  </div>
                )}
                
                {/* Status Overlay */}
                <div className="absolute bottom-4 left-4 flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    handsDetected ? 'bg-[#00fff2]/20 text-[#00fff2]' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {handsDetected ? '✋ HANDS DETECTED' : '🔍 SCANNING...'}
                  </span>
                </div>
              </div>
              
              {/* Controls */}
              <div className="p-4 flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleTranslation}
                  className={`px-8 py-3 rounded-full font-semibold text-lg transition-all ${
                    isTranslating 
                      ? 'bg-red-500/80 hover:bg-red-500 text-white' 
                      : 'bg-[#00fff2]/20 hover:bg-[#00fff2]/30 text-[#00fff2] border border-[#00fff2]/50'
                  }`}
                >
                  {isTranslating ? '⏹ STOP' : '▶ START TRANSLATION'}
                </motion.button>
              </div>
            </motion.div>
          </div>
          
          {/* Translation Panel */}
          <div className="space-y-6">
            {/* Current Sign */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass p-6 text-center"
            >
              <p className="text-sm text-gray-400 mb-2">DETECTED SIGN</p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSign || 'empty'}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-4xl font-bold neon-text mb-2"
                >
                  {currentSign?.toUpperCase() || '—'}
                </motion.div>
              </AnimatePresence>
              
              {confidence > 0 && (
                <div className="mt-4">
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${confidence * 100}%` }}
                      className="h-full bg-gradient-to-r from-[#00fff2] to-[#bf00ff]"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{(confidence * 100).toFixed(1)}% confidence</p>
                </div>
              )}
            </motion.div>
            
            {/* History */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass p-6"
            >
              <p className="text-sm text-gray-400 mb-4">TRANSLATION HISTORY</p>
              <div className="space-y-2">
                {history.length === 0 ? (
                  <p className="text-gray-600 text-sm">No translations yet...</p>
                ) : (
                  history.map((sign, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 text-gray-300"
                    >
                      <span className="text-[#00fff2]">›</span>
                      <span className="capitalize">{sign}</span>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
            
            {/* Actions */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass p-6"
            >
              <p className="text-sm text-gray-400 mb-4">AVAILABLE SIGNS</p>
              <div className="flex flex-wrap gap-2">
                {['hello', 'thanks', 'iloveyou', 'yes', 'no'].map(action => (
                  <span 
                    key={action}
                    className={`px-3 py-1 rounded-full text-xs ${
                      currentSign === action 
                        ? 'bg-[#00fff2]/30 text-[#00fff2] border border-[#00fff2]' 
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {action}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 text-center text-gray-600 text-sm">
        Gestura v1.0 • AI Sign Language Interface
      </footer>
    </main>
  );
}
