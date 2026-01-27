import { motion, AnimatePresence } from "framer-motion";

interface GestureGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const gestures = [
  {
    name: "Hello / Stop",
    emoji: "✋",
    description: "Open palm facing camera",
    instruction: "Extend all fingers."
  },
  {
    name: "Yes / Like",
    emoji: "👍",
    description: "Thumbs up",
    instruction: "Fist with thumb pointing up."
  },
  {
    name: "No / Dislike",
    emoji: "👎",
    description: "Thumbs down",
    instruction: "Fist with thumb pointing down."
  },
  {
    name: "I Love You",
    emoji: "🤟",
    description: "ILY Sign",
    instruction: "Thumb, Index, and Pinky extended."
  },
  {
    name: "Peace / Victory",
    emoji: "✌️",
    description: "V Sign",
    instruction: "Index and Middle fingers up."
  }
];

export default function GestureGuide({ isOpen, onClose }: GestureGuideProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            
            <h2 className="text-2xl font-bold mb-6 text-center text-white">Gesture Guide</h2>
            
            <div className="space-y-4">
              {gestures.map((gesture) => (
                <div 
                  key={gesture.name}
                  className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:bg-gray-800 transition-colors"
                >
                  <div className="text-4xl">{gesture.emoji}</div>
                  <div>
                    <h3 className="font-bold text-[#00fff2]">{gesture.name}</h3>
                    <p className="text-sm text-gray-400">{gesture.description}</p>
                    <p className="text-xs text-gray-500 italic mt-1">{gesture.instruction}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-[#00fff2] text-black font-bold rounded-lg hover:bg-[#00fff2]/80 transition-colors"
              >
                Got it!
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
