"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import { motion, AnimatePresence } from "framer-motion";
import { detectGesture, Landmark } from "@/utils/hand-logic";
import GestureGuide from "@/components/GestureGuide";
// Import MediaPipe types dynamically or use 'any' to avoid build issues if types are missing
// We will use dynamic imports for the heavy libraries inside useEffect

export default function Home() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isConnected, setIsConnected] = useState(false); // Used for "AI Active" state now
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentSign, setCurrentSign] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [handsDetected, setHandsDetected] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // References for MediaPipe instances
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  const handleUserMedia = () => {
    console.log("Camera started successfully");
    setCameraError(null);
  };

  const handleUserMediaError = (error: string | DOMException) => {
    console.error("Camera error:", error);
    setCameraError(typeof error === 'string' ? error : error.message);
  };

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      speechSynthesis.speak(utterance);
    }
  }, []);

  // Initialize MediaPipe Hands
  useEffect(() => {
    let hands: any;
    let camera: any;

    const loadMediaPipe = async () => {
      try {
        const mpHands = await import("@mediapipe/hands");
        const mpDrawing = await import("@mediapipe/drawing_utils");
        const mpCamera = await import("@mediapipe/camera_utils");

        hands = new mpHands.Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults((results: any) => {
            const videoWidth = webcamRef.current?.video?.videoWidth;
            const videoHeight = webcamRef.current?.video?.videoHeight;

            if (canvasRef.current && videoWidth && videoHeight) {
                canvasRef.current.width = videoWidth;
                canvasRef.current.height = videoHeight;
                const canvasCtx = canvasRef.current.getContext("2d");
                if (canvasCtx) {
                    canvasCtx.save();
                    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);
                    
                    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                        setHandsDetected(true);
                        
                        for (const landmarks of results.multiHandLandmarks) {
                            mpDrawing.drawConnectors(canvasCtx, landmarks, mpHands.HAND_CONNECTIONS,
                                { color: '#00fff2', lineWidth: 5 });
                            mpDrawing.drawLandmarks(canvasCtx, landmarks,
                                { color: '#bf00ff', lineWidth: 2 });
                                
                            // Perform Gesture Recognition
                            const gesture = detectGesture(landmarks);
                            if (gesture) {
                                if (gesture !== currentSign) {
                                    setCurrentSign(gesture);
                                    setConfidence(0.95); // High confidence for rule-based
                                    setHistory(prev => {
                                        const newHistory = [...prev, gesture];
                                        return newHistory.slice(-4);
                                    });
                                    speak(gesture);
                                }
                            } else {
                                // Keep last sign or clear if needed? 
                                // For stability, maybe don't clear immediately or wait for "Null"
                            }
                        }
                    } else {
                        setHandsDetected(false);
                    }
                    canvasCtx.restore();
                }
            }
        });

        handsRef.current = hands;
      
      } catch (error) {
        console.error("Failed to load MediaPipe:", error);
      }
    };

    loadMediaPipe();

    return () => {
        if (hands) hands.close();
    }
  }, [speak]); // Removed currentSign dependency to avoid re-init loop

  // Loop to send frames to MediaPipe
  useEffect(() => {
    if (isTranslating && webcamRef.current && webcamRef.current.video && handsRef.current) {
        const interval = setInterval(async () => {
            if (webcamRef.current?.video?.readyState === 4) {
               await handsRef.current.send({image: webcamRef.current.video});
            }
        }, 100); // 10 FPS
        
        return () => clearInterval(interval);
    }
  }, [isTranslating]);


  const toggleTranslation = () => {
    setIsTranslating(!isTranslating);
    setIsConnected(!isTranslating); // Toggle "Active" state
  };

  return (
    <main className="min-h-screen relative grid-overlay overflow-x-hidden">
      <GestureGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      
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
             <button
                onClick={() => setIsGuideOpen(true)}
                className="px-3 py-1 rounded text-xs bg-[#bf00ff]/20 text-[#bf00ff] border border-[#bf00ff]/30 hover:bg-[#bf00ff]/30 transition-colors"
             >
                ✋ GESTURE GUIDE
             </button>
             
            <span className={`flex items-center gap-2 text-sm ${isConnected ? 'text-[#00fff2]' : 'text-gray-500'}`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#00fff2] animate-pulse' : 'bg-gray-500'}`} />
              {isConnected ? 'AI ACTIVE' : 'IDLE'}
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
              className="glass neon-glow relative overflow-hidden flex justify-center items-center bg-gray-900 rounded-2xl aspect-video"
            >
              <div className="relative w-full h-full">
                {cameraError ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-6">
                      <p className="text-red-400 mb-2">📷 Camera Error</p>
                      <p className="text-gray-500 text-sm">{cameraError}</p>
                    </div>
                  </div>
                ) : (
                  <>
                  {/* Webcam acts as the source, usually hidden if we draw to canvas, 
                      but for simplicity in this React setup, we show webcam and draw overlay on top?
                      Or better: Show Webcam, draw landmarks on canvas overlay. */}
                   <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    className="absolute inset-0 w-full h-full object-cover"
                    mirrored
                    onUserMedia={handleUserMedia}
                    onUserMediaError={handleUserMediaError}
                    videoConstraints={{
                      width: 1280,
                      height: 720,
                      facingMode: "user"
                    }}
                  />
                  <canvas 
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ transform: "scaleX(-1)" }} // Mirror canvas to match webcam
                  />
                  </>
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
              <div className="absolute bottom-4 right-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleTranslation}
                  className={`px-6 py-2 rounded-full font-semibold text-sm transition-all shadow-lg ${
                    isTranslating 
                      ? 'bg-red-500/80 hover:bg-red-500 text-white' 
                      : 'bg-[#00fff2]/20 hover:bg-[#00fff2]/30 text-[#00fff2] border border-[#00fff2]/50'
                  }`}
                >
                  {isTranslating ? '⏹ STOP' : '▶ START'}
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
                  history.slice().reverse().map((sign, i) => (
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
            
            {/* Helper Hint */}
             <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass p-6 text-center cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setIsGuideOpen(true)}
            >
               <p className="text-[#bf00ff] font-bold mb-1">Need Help?</p>
               <p className="text-xs text-gray-400">Click to view the Gesture Guide</p>
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
