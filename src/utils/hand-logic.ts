export type Landmark = {
  x: number;
  y: number;
  z: number;
};

export const detectGesture = (landmarks: Landmark[]): string | null => {
  if (!landmarks || landmarks.length < 21) return null;

  // Finger states (Is Extended?)
  const thumbTip = landmarks[4];
  const thumbIP = landmarks[3];
  
  const indexTip = landmarks[8];
  const indexPIP = landmarks[6];

  const middleTip = landmarks[12];
  const middlePIP = landmarks[10];

  const ringTip = landmarks[16];
  const ringPIP = landmarks[14];

  const pinkyTip = landmarks[20];
  const pinkyPIP = landmarks[18];

  // Logic for extensions (assuming upright hand for simplicity)
  // Note: Y coordinates are normalized 0 (top) to 1 (bottom)
  
  const isThumbExtended = thumbTip.x < thumbIP.x; // Basic check for right hand, needs refinement for mirroring
  const isIndexExtended = indexTip.y < indexPIP.y;
  const isMiddleExtended = middleTip.y < middlePIP.y;
  const isRingExtended = ringTip.y < ringPIP.y;
  const isPinkyExtended = pinkyTip.y < pinkyPIP.y;

  // More robust thumb check (distance based)
  // const isThumbExtended = distance(thumbTip, indexMCP) > distance(thumbIP, indexMCP); 

  // Count extended fingers (excluding thumb for some logics)
  let extendedCount = 0;
  if (isIndexExtended) extendedCount++;
  if (isMiddleExtended) extendedCount++;
  if (isRingExtended) extendedCount++;
  if (isPinkyExtended) extendedCount++;

  // --- Gesture Recognition Rules ---

  // 1. Hello (Open Palm) - All 5 fingers extended
  if (extendedCount === 4 && (thumbTip.x < landmarks[2].x || thumbTip.x > landmarks[2].x)) { 
      // Thumb check is loose here. Strict: All 4 fingers up + thumb out.
      return "Hello"; 
  }

  // 2. Thumbs Up - Thumb up, others curled
  if (extendedCount === 0 && thumbTip.y < thumbIP.y && thumbTip.y < landmarks[0].y) {
      return "Yes";
  }

  // 3. Thumbs Down - Thumb down, others curled
  if (extendedCount === 0 && thumbTip.y > thumbIP.y && thumbTip.y > landmarks[0].y) {
      return "No";
  }

  // 4. I Love You - Thumb, Index, Pinky extended. Middle, Ring curled.
  if (isIndexExtended && isPinkyExtended && !isMiddleExtended && !isRingExtended) {
      return "I Love You";
  }
  
  // 5. Victory/Peace - Index, Middle extended. Others curled.
  if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      return "Peace";
  }

  // 6. Point - Index only
  // if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) return "Look";

  return null;
};
