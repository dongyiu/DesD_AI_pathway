import React, { useState, useEffect, useRef } from 'react';
// Assuming NavBar is correctly located at '../components/Navbar'
// If not, adjust the import path.
// import NavBar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import * as poseDetection from '@mediapipe/pose';
import { POSE_CONNECTIONS } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import io from 'socket.io-client';
// Import React Body Highlighter
import Model from 'react-body-highlighter';
import { MuscleType, ModelType } from 'react-body-highlighter';

// Uncomment NavBar import
import NavBar from '../components/Navbar';

// Add workout mapping (matching the backend)
const workoutMap = { 
  0: "Barbell Bicep Curl", 
  1: "Bench Press", 
  2: "Chest Fly Machine", 
  3: "Deadlift",
  4: "Decline Bench Press", 
  5: "Hammer Curl", 
  6: "Hip Thrust", 
  7: "Incline Bench Press", 
  8: "Lat Pulldown", 
  9: "Lateral Raises", 
  10: "Leg Extensions", 
  11: "Leg Raises",
  12: "Plank", 
  13: "Pull Up", 
  14: "Push Ups", 
  15: "Romanian Deadlift", 
  16: "Russian Twist", 
  17: "Shoulder Press", 
  18: "Squat", 
  19: "T Bar Row", 
  20: "Tricep Dips", 
  21: "Tricep Pushdown"
};

// Define muscle group mapping
const muscleGroupMap = {
  1: "shoulders",
  2: "chest",
  3: "biceps",
  4: "core",
  5: "triceps",
  6: "legs",
  7: "back"
};

// --- Utility functions (Unchanged) ---
const getJointName = (index) => {
  switch(index) {
    case 11: return "Left Shoulder"; case 12: return "Right Shoulder"; case 13: return "Left Elbow";
    case 14: return "Right Elbow"; case 15: return "Left Wrist"; case 16: return "Right Wrist";
    case 23: return "Left Hip"; case 24: return "Right Hip"; case 25: return "Left Knee";
    case 26: return "Right Knee"; case 27: return "Left Ankle"; case 28: return "Right Ankle";
    default: return "";
  }
};
const getArrowColor = (distance) => {
  if (distance < 0.05) return '#eab308'; // yellow
  else if (distance < 0.1) return '#f97316'; // orange
  else return '#ef4444'; // red
};
const drawArrow = (ctx, fromX, fromY, toX, toY, color, lineWidth) => {
  const headLength = 15; const dx = toX - fromX; const dy = toY - fromY;
  const angle = Math.atan2(dy, dx); ctx.beginPath(); ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY); ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI/6), toY - headLength * Math.sin(angle - Math.PI/6));
  ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI/6), toY - headLength * Math.sin(angle + Math.PI/6));
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
};

// --- Drawing functions (Unchanged) ---
const drawUserPose = (ctx, landmarks, canvasWidth, canvasHeight) => {
  if (!landmarks) return;
  for (let i = 11; i < landmarks.length; i++) {
    const landmark = landmarks[i];
    if (!landmark || landmark.x == null || landmark.y == null) continue;
    const x = landmark.x * canvasWidth; const y = landmark.y * canvasHeight;
    ctx.beginPath(); ctx.arc(x, y, 5, 0, 2 * Math.PI); ctx.fillStyle = '#8b5cf6'; ctx.fill();
  }
  POSE_CONNECTIONS.forEach(([i, j]) => {
    if (i >= 11 && j >= 11 && i < landmarks.length && j < landmarks.length) {
      const p1 = landmarks[i]; const p2 = landmarks[j];
      if (!p1 || !p2 || p1.x == null || p1.y == null || p2.x == null || p2.y == null) return;
      ctx.beginPath(); ctx.moveTo(p1.x * canvasWidth, p1.y * canvasHeight);
      ctx.lineTo(p2.x * canvasWidth, p2.y * canvasHeight);
      ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 2; ctx.stroke();
    }
  });
};
const findJointsToCorrect = (landmarks, corrections) => {
  // Use the corrections object passed directly (likely from a ref now)
  if (!landmarks || !corrections || Object.keys(corrections).length === 0) { return []; }
  const correctJoints = [];
  Object.keys(corrections).forEach(indexStr => {
    const i = parseInt(indexStr); const correction = corrections[indexStr];
    if (correction && correction.x != null && correction.y != null &&
        (Math.abs(correction.x) > 0.01 || Math.abs(correction.y) > 0.01) &&
        i < landmarks.length && landmarks[i]) {
      const jointName = getJointName(i);
      if (jointName) { correctJoints.push({ name: jointName, index: i, correction: correction }); }
    }
  });
  return correctJoints;
};
const drawCorrectionArrows = (ctx, landmarks, corrections, jointsToCorrect, canvasWidth, canvasHeight) => {
   // Use the corrections object passed directly (likely from a ref now)
  if (!landmarks || !corrections || jointsToCorrect.length === 0) { return; }
  jointsToCorrect.forEach(joint => {
    const i = joint.index;
    if (!landmarks[i] || landmarks[i].x == null || landmarks[i].y == null) { console.warn(`[drawCorrectionArrows] Skipping arrow for joint ${joint.name} (index ${i}): Landmark invalid.`); return; }
    const originalX = landmarks[i].x * canvasWidth; const originalY = landmarks[i].y * canvasHeight;
    // Get the specific correction for this joint from the passed corrections object
    const correction = corrections[String(i)]; // Ensure key is string if needed
    if (!correction || correction.x == null || correction.y == null) { console.warn(`[drawCorrectionArrows] Skipping arrow for joint ${joint.name} (index ${i}): Correction data invalid or missing.`); return; }
    const vectorX = correction.x * canvasWidth; const vectorY = correction.y * canvasHeight;
    const targetX = originalX + vectorX; const targetY = originalY + vectorY;
    const extendedTargetX = originalX + vectorX * 1.5; const extendedTargetY = originalY + vectorY * 1.5;
    const correctionMagnitude = Math.sqrt(correction.x * correction.x + correction.y * correction.y);
    const arrowColor = getArrowColor(correctionMagnitude);
    drawArrow(ctx, originalX, originalY, extendedTargetX, extendedTargetY, arrowColor, 6);
  });
};

// --- UI Components (Unchanged) ---
const ConnectionStatus = ({ status }) => { 
  const statusColors = { connected: "bg-green-500", connecting: "bg-yellow-500", disconnected: "bg-red-500" }; 
  return ( <div className="absolute top-4 right-4 flex items-center space-x-2 z-40"><div className={`w-4 h-4 rounded-full ${statusColors[status]}`}></div><span className="text-xs font-medium text-white bg-black/30 px-2 py-1 rounded">{status === "connected" ? "Connected" : status === "connecting" ? "Connecting..." : "Disconnected"}</span></div> ); 
};

// Add new Fullscreen Button component
const FullscreenButton = ({ isFullscreen, toggleFullscreen }) => {
  return (
    <button 
      onClick={toggleFullscreen}
      className="absolute top-4 left-4 z-40 bg-black/40 hover:bg-black/60 text-white p-2 rounded-lg transition-colors"
      title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
    >
      {isFullscreen ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 4a1 1 0 00-1 1v4a1 1 0 01-1 1H2a1 1 0 110-2h.59L1.3 6.7a1 1 0 111.4-1.4L4 6.59V6a1 1 0 011-1h4a1 1 0 110 2H7a1 1 0 01-1-1V4zM16 4a1 1 0 00-1 1v1a1 1 0 01-1 1h-2a1 1 0 110-2h.59l-1.3-1.3a1 1 0 111.42-1.4L14 3.59V4a1 1 0 011-1h1a1 1 0 010 2v-1zM15 12a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1v-1zM5 16a1 1 0 001 1h4a1 1 0 100-2H7.41l1.3-1.3a1 1 0 00-1.42-1.4L6 13.59V14a1 1 0 01-1 1H4a1 1 0 100 2h1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
};

// Add workout selector component
const WorkoutSelector = ({ selectedWorkout, onSelectWorkout, isFullscreen }) => {
  return (
    <div className={`text-white ${isFullscreen ? 'absolute top-16 right-4 z-40' : 'text-center mb-4'}`}>
      <label htmlFor="workout-select" className={`mr-2 ${isFullscreen ? 'text-white' : ''}`}>
        Workout:
      </label>
      <select 
        id="workout-select"
        value={selectedWorkout}
        onChange={(e) => onSelectWorkout(Number(e.target.value))}
        className={`px-3 py-1 rounded-md ${isFullscreen ? 'bg-black/40 text-white border border-gray-500' : 'bg-white dark:bg-gray-700 border dark:border-gray-600'}`}
      >
        {Object.entries(workoutMap).map(([id, name]) => (
          <option key={id} value={id}>{name}</option>
        ))}
      </select>
    </div>
  );
};

// New MuscleGroupVisualizer component
const MuscleGroupVisualizer = ({ isVisible, isFullscreen, muscleGroup }) => {
  // Get the appropriate muscle data based on the current muscle group
  let muscleData;
  
  // Use a safer approach - hardcode a valid array for the default case
  if (muscleGroup === 0 || muscleGroup > 7) {
    // Hardcoded safe default with a valid muscle to avoid library errors
    muscleData = [
      { name: 'Rest', muscles: [] }
    ];
  } else {
    // Function to map muscle group IDs to React Body Highlighter muscle types
    switch(muscleGroup) {
      case 1: // shoulders
        muscleData = [
          { name: 'Shoulder Press', muscles: [MuscleType.BACK_DELTOIDS, MuscleType.FRONT_DELTOIDS] }
        ];
        break;
      case 2: // chest
        muscleData = [
          { name: 'Bench Press', muscles: [MuscleType.CHEST] }
        ];
        break;
      case 3: // biceps
        muscleData = [
          { name: 'Bicep Curl', muscles: [MuscleType.BICEPS] }
        ];
        break;
      case 4: // core
        muscleData = [
          { name: 'Crunches', muscles: [MuscleType.ABS, MuscleType.OBLIQUES] }
        ];
        break;
      case 5: // triceps
        muscleData = [
          { name: 'Tricep Pushdown', muscles: [MuscleType.TRICEPS] }
        ];
        break;
      case 6: // legs
        muscleData = [
          { name: 'Squats', muscles: [MuscleType.QUADRICEPS, MuscleType.HAMSTRING, MuscleType.CALVES] },
          { name: 'Hip Thrust', muscles: [MuscleType.GLUTEAL] }
        ];
        break;
      case 7: // back
        muscleData = [
          { name: 'Lat Pulldown', muscles: [MuscleType.UPPER_BACK, MuscleType.LOWER_BACK] }
        ];
        break;
    }
  }
  
  // Now just check if we want to show the visualizer
  return isVisible ? (
    <>
      {/* Front view - Left side */}
      <div className={`absolute ${isFullscreen ? 'bottom-20 left-8' : 'bottom-20 left-4'} z-30 pointer-events-none w-[120px] sm:w-[180px] lg:w-[200px] max-w-[30vw]`}>
        <Model 
          data={muscleData}
          type={ModelType.ANTERIOR}
          highlightedColors={['#e65a5a']}
          onClick={() => {}} // Empty handler to prevent errors
        />
      </div>
      
      {/* Back view - Right side */}
      <div className={`absolute ${isFullscreen ? 'bottom-20 right-8' : 'bottom-20 right-4'} z-30 pointer-events-none w-[120px] sm:w-[180px] lg:w-[200px] max-w-[30vw]`}>
        <Model 
          data={muscleData}
          type={ModelType.POSTERIOR}
          highlightedColors={['#e65a5a']}
          onClick={() => {}} // Empty handler to prevent errors
        />
      </div>
    </>
  ) : null;
};

// Add toggle button for muscle visualization
const MuscleVisualizerToggle = ({ isVisible, toggleVisibility, isFullscreen }) => {
  return (
    <button 
      onClick={toggleVisibility}
      className={`absolute ${isFullscreen ? 'bottom-4 right-8' : 'bottom-4 right-4'} z-40 bg-black/40 hover:bg-black/60 text-white p-2 rounded-lg transition-colors`}
      title={isVisible ? "Hide Muscle Activation" : "Show Muscle Activation"}
    >
      {isVisible ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1H5zm0 2h10v8H5V6z" clipRule="evenodd" />
          <path d="M7 9a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" />
          <path d="M7 12a1 1 0 011-1h2a1 1 0 110 2H8a1 1 0 01-1-1z" />
        </svg>
      )}
    </button>
  );
};

// --- Main TrainingPage Component ---
const TrainingPage = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [userLandmarksForDrawing, setUserLandmarksForDrawing] = useState(null);
  const latestLandmarksRef = useRef(null);
  const [corrections, setCorrections] = useState({});
  const latestCorrectionsRef = useRef({});
  const socketRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const lastLandmarkUpdateRef = useRef(0);
  const lastCorrectionTimeRef = useRef(0);
  const [feedbackLatency, setFeedbackLatency] = useState(0);
  const [receivedCount, setReceivedCount] = useState(0);
  const poseInstanceRef = useRef(null);
  const cameraInstanceRef = useRef(null);
  const sendIntervalRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Add state for muscle visualizer toggle
  const [showMuscleVisualizer, setShowMuscleVisualizer] = useState(true);
  
  // Modified workout prediction state
  const [predictedWorkout, setPredictedWorkout] = useState(12); // Default to plank (12)
  
  // Add state for manually selected workout (default to predicted)
  const [selectedWorkout, setSelectedWorkout] = useState(12); // Default to plank (12)
  
  // Add state for muscle group prediction
  const [predictedMuscleGroup, setPredictedMuscleGroup] = useState(0); // Default to none
  
  // Add state for muscle group prediction stability
  const [recentMuscleGroupPredictions, setRecentMuscleGroupPredictions] = useState([]);
  const [muscleGroupConfidence, setMuscleGroupConfidence] = useState(0);
  
  // Add state for workout prediction stability
  const [recentWorkoutPredictions, setRecentWorkoutPredictions] = useState([]);
  const PREDICTION_WINDOW_SIZE = 30; // Keep track of ~1.5 seconds of predictions (at 50ms intervals)
  const CONFIDENCE_THRESHOLD = 0.6; // 60% majority needed to change workout
  const lastStableWorkoutRef = useRef(12); // Track the last stable workout type
  const lastStableMuscleGroupRef = useRef(0); // Track the last stable muscle group
  // Add state to track overall confidence
  const [predictionConfidence, setPredictionConfidence] = useState(0);
  
  // Add handler for workout selection change
  const handleWorkoutChange = (workoutId) => {
    setSelectedWorkout(Number(workoutId));
  };

  // Add new function to stabilize workout predictions
  const updateStableWorkoutPrediction = (newPrediction) => {
    // Update the array of recent predictions
    setRecentWorkoutPredictions(prev => {
      // Add new prediction and keep window size limited
      const updated = [...prev, newPrediction].slice(-PREDICTION_WINDOW_SIZE);
      
      // Count occurrences of each workout type in our window
      const counts = updated.reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      
      // Find the most frequent workout type
      let mostFrequent = null;
      let highestCount = 0;
      
      Object.entries(counts).forEach(([type, count]) => {
        if (count > highestCount) {
          highestCount = count;
          mostFrequent = Number(type);
        }
      });
      
      // Calculate confidence (percentage of window with this prediction)
      const confidence = highestCount / updated.length;
      
      // Store the confidence value for UI display
      setPredictionConfidence(confidence);
      
      // Only update the displayed workout if confidence passes threshold
      // or if it's the same as our current stable workout
      if (confidence >= CONFIDENCE_THRESHOLD || mostFrequent === lastStableWorkoutRef.current) {
        setPredictedWorkout(mostFrequent);
        lastStableWorkoutRef.current = mostFrequent;
      }
      
      return updated;
    });
  };
  
  // Add new function to stabilize muscle group predictions
  const updateStableMuscleGroupPrediction = (newPrediction) => {
    // Update the array of recent predictions
    setRecentMuscleGroupPredictions(prev => {
      // Add new prediction and keep window size limited
      const updated = [...prev, newPrediction].slice(-PREDICTION_WINDOW_SIZE);
      
      // Count occurrences of each muscle group in our window
      const counts = updated.reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      
      // Find the most frequent muscle group
      let mostFrequent = null;
      let highestCount = 0;
      
      Object.entries(counts).forEach(([type, count]) => {
        if (count > highestCount) {
          highestCount = count;
          mostFrequent = Number(type);
        }
      });
      
      // Calculate confidence (percentage of window with this prediction)
      const confidence = highestCount / updated.length;
      
      // Store the confidence value 
      setMuscleGroupConfidence(confidence);
      
      // Only update the displayed muscle group if confidence passes threshold
      // or if it's the same as our current stable muscle group
      if (confidence >= CONFIDENCE_THRESHOLD || mostFrequent === lastStableMuscleGroupRef.current) {
        setPredictedMuscleGroup(mostFrequent);
        lastStableMuscleGroupRef.current = mostFrequent;
      }
      
      return updated;
    });
  };

  // Add function to toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Add event listener for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // --- WebSocket Connection Setup ---
  useEffect(() => {
    const connectSocket = () => {
      if (socketRef.current) { socketRef.current.disconnect(); }
      console.log('[Socket Setup] Attempting to connect WebSocket...');
      setConnectionStatus("connecting");
      socketRef.current = io('http://localhost:8001', {
        reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 1000,
        reconnectionDelayMax: 5000, timeout: 10000, transports: ['websocket']
      });
      socketRef.current.on('connect', () => { console.log('[Socket Status] WebSocket connected. ID:', socketRef.current?.id); setConnectionStatus("connected"); });
      socketRef.current.on('disconnect', (reason) => { console.warn('[Socket Status] WebSocket disconnected. Reason:', reason); setConnectionStatus("disconnected"); });
      socketRef.current.on('connect_error', (error) => { console.error('[Socket Status] WebSocket connection error:', error); setConnectionStatus("disconnected"); });
      socketRef.current.on('connected', (data) => { console.log('[Socket Event] Received "connected" confirmation:', data); });

      // --- MODIFIED CORRECTIONS HANDLER ---
      socketRef.current.on('pose_corrections', (data) => {
        // Update the ref with the latest data immediately
        latestCorrectionsRef.current = data;

        // Update state as well (might trigger other UI updates)
        setCorrections(data);

        // Check if there's a predicted workout type in the data
        if (data.predicted_workout_type !== undefined) {
          // Instead of directly setting the workout, update our stable prediction
          updateStableWorkoutPrediction(data.predicted_workout_type);
        }
        
        // Check if there's a predicted muscle group in the data
        if (data.predicted_muscle_group !== undefined) {
          // Update our stable muscle group prediction
          updateStableMuscleGroupPrediction(data.predicted_muscle_group);
        }

        // Update timing info
        const now = Date.now();
        const latency = lastLandmarkUpdateRef.current ? now - lastLandmarkUpdateRef.current : 0;
        setFeedbackLatency(latency);
        setReceivedCount(prevCount => prevCount + 1);
        lastCorrectionTimeRef.current = now;
      });
      // --- END MODIFIED HANDLER ---

      socketRef.current.on('error', (data) => { console.error('[Socket Event] Received server error:', data.message || data); });
    };
    connectSocket();
    return () => { if (socketRef.current) { console.log("[Socket Cleanup] Disconnecting WebSocket."); socketRef.current.disconnect(); socketRef.current = null; } };
  }, []);

  // --- Landmark Update Function (Unchanged) ---
  const updateLandmarks = (landmarks) => {
    if (landmarks && landmarks.length > 0) {
        setUserLandmarksForDrawing(landmarks);
        latestLandmarksRef.current = landmarks;
        lastLandmarkUpdateRef.current = Date.now();
    } else {
        setUserLandmarksForDrawing(null);
        latestLandmarksRef.current = null;
    }
  };

  // Modify the send interval to include the selected workout type
  useEffect(() => {
    const sendIntervalDelay = 50;
    if (sendIntervalRef.current) { clearInterval(sendIntervalRef.current); }
    console.log(`[Data Send] Setting up interval to send data every ${sendIntervalDelay}ms`);
    sendIntervalRef.current = setInterval(() => {
      const landmarksToSend = latestLandmarksRef.current;
      const socketIsConnected = socketRef.current?.connected;
      if (landmarksToSend && socketIsConnected) {
        const sendTimestamp = Date.now();
        // Always send landmarks without a workout type, let backend predict it
        socketRef.current.emit('pose_data', { 
          landmarks: landmarksToSend, 
          timestamp: sendTimestamp 
        });
      }
    }, sendIntervalDelay);
    return () => { if (sendIntervalRef.current) { console.log("[Data Send] Clearing send interval."); clearInterval(sendIntervalRef.current); sendIntervalRef.current = null; } };
  }, []); // No dependencies needed now

  // --- Correction Timeout Check (Unchanged) ---
  useEffect(() => {
    lastCorrectionTimeRef.current = 0;
    const checkInterval = 5000;
    const checkCorrectionTimeout = setInterval(() => {
      const now = Date.now();
      if (connectionStatus === "connected" && latestLandmarksRef.current && lastLandmarkUpdateRef.current !== 0) {
          const timeSinceLastCorrection = now - lastCorrectionTimeRef.current;
          if (lastCorrectionTimeRef.current === 0 && (now - lastLandmarkUpdateRef.current > checkInterval)) {
              console.warn(`[Correction Check] Connected >${checkInterval/1000}s, sending data, but no corrections received yet. Verify backend.`);
          } else if (lastCorrectionTimeRef.current !== 0 && timeSinceLastCorrection > checkInterval) {
              console.warn(`[Correction Check] No corrections received for >${checkInterval/1000}s. Last at: ${new Date(lastCorrectionTimeRef.current).toLocaleTimeString()}. Forcing socket reconnect.`);
              if (socketRef.current) { socketRef.current.disconnect(); }
          }
      }
    }, checkInterval);
    return () => clearInterval(checkCorrectionTimeout);
  }, [connectionStatus]);

  // Add dark mode toggle functionality
  // Add function to toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Dark Mode Setup (Unchanged) ---
  useEffect(() => {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDarkMode);
  }, []);
  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // --- MediaPipe Pose Setup ---
  useEffect(() => {
    console.log("[MediaPipe Setup] Effect triggered.");
    poseInstanceRef.current = null;
    cameraInstanceRef.current = null;
    let initTimeoutId = null;

    // --- MediaPipe Results Callback ---
    function onResults(results) {
        const canvas = canvasRef.current;
        if (!canvas || !webcamRef.current) { return; }
        const ctx = canvas.getContext('2d');
        if (!ctx) { return; }
        const videoWidth = webcamRef.current.videoWidth;
        const videoHeight = webcamRef.current.videoHeight;
        if (videoWidth === 0 || videoHeight === 0) { return; }
        if (canvas.width !== videoWidth) canvas.width = videoWidth;
        if (canvas.height !== videoHeight) canvas.height = videoHeight;

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.poseLandmarks) {
            const landmarks = results.poseLandmarks;
            updateLandmarks(landmarks); // Update ref and state

            // --- Drawing Logic ---
            drawUserPose(ctx, landmarks, canvas.width, canvas.height); // Draw skeleton

            // *** Use the latestCorrectionsRef for drawing ***
            const currentCorrections = latestCorrectionsRef.current;
            // console.log("[onResults] Using corrections from ref:", currentCorrections); // Check ref value
            const jointsToCorrect = findJointsToCorrect(landmarks, currentCorrections);
            // console.log("[onResults] Joints found to correct (using ref):", jointsToCorrect); // Check identified joints

            // Only attempt to draw if there are joints needing correction
            if (jointsToCorrect.length > 0) {
                 drawCorrectionArrows(ctx, landmarks, currentCorrections, jointsToCorrect, canvas.width, canvas.height);
            }
            // *** END Use the latestCorrectionsRef for drawing ***

        } else {
            updateLandmarks(null);
        }
        ctx.restore();
    }


    const startMediaPipe = async () => {
        if (typeof window === 'undefined' || !webcamRef.current) {
            console.log("[MediaPipe Setup] Aborted: window or webcamRef not ready."); return;
        }
        console.log("[MediaPipe Setup] Initializing Pose...");
        const pose = new poseDetection.Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${poseDetection.VERSION}/${file}`
        });
        poseInstanceRef.current = pose;
        pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, enableSegmentation: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
        pose.onResults(onResults);

        initTimeoutId = setTimeout(async () => {
            try {
                console.log("[MediaPipe Setup] Attempting pose.initialize() after delay...");
                await pose.initialize();
                console.log("[MediaPipe Setup] Pose initialized successfully after delay.");
                if (!webcamRef.current) { console.warn("[MediaPipe Setup] Webcam ref null before camera setup."); return; }
                console.log("[MediaPipe Setup] Setting up Camera...");
                const camera = new Camera(webcamRef.current, {
                    onFrame: async () => {
                        if (poseInstanceRef.current && webcamRef.current) {
                            try { await poseInstanceRef.current.send({ image: webcamRef.current }); }
                            catch (sendError) { console.error("[MediaPipe onFrame] Error sending frame:", sendError); }
                        }
                    },
                    width: 640, height: 480
                });
                cameraInstanceRef.current = camera;
                await camera.start();
                console.log("[MediaPipe Setup] Camera started successfully.");
            } catch (initError) {
                console.error("[MediaPipe Setup] Error initializing MediaPipe Pose (after delay):", initError);
                if (poseInstanceRef.current) { poseInstanceRef.current.close(); poseInstanceRef.current = null; }
                if (cameraInstanceRef.current) { cameraInstanceRef.current = null; }
            }
        }, 100);
    };

    startMediaPipe();

    return () => {
        console.log("[MediaPipe Cleanup] Cleaning up...");
        if (initTimeoutId) { clearTimeout(initTimeoutId); }
        if (cameraInstanceRef.current) { cameraInstanceRef.current.stop(); cameraInstanceRef.current = null; }
        if (poseInstanceRef.current) { poseInstanceRef.current.close(); poseInstanceRef.current = null; }
    };
  }, []); // Empty dependency array

  // Add fullscreen styles to be applied conditionally
  const fullscreenStyles = {
    container: isFullscreen ? "fixed inset-0 z-50 bg-black m-0 p-0 max-w-none rounded-none" : "max-w-4xl mx-auto mt-2 bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden p-4",
    videoContainer: isFullscreen ? "w-screen h-screen" : "relative w-full aspect-video",
    infoPanel: isFullscreen ? "absolute bottom-4 left-0 right-0 bg-black/50 text-white px-4 py-2 rounded-none" : "mt-4 text-center text-sm text-gray-700 dark:text-gray-300"
  };

  // Add function to toggle muscle visualizer
  const toggleMuscleVisualizer = () => {
    setShowMuscleVisualizer(!showMuscleVisualizer);
  };

  // --- Render ---
  return (
    <section className={`overflow-hidden ${isFullscreen ? 'fixed inset-0 bg-black' : 'fixed inset-0'} ${isDarkMode && !isFullscreen ? 'bg-gradient-to-br from-gray-800 to-indigo-500' : !isFullscreen ? 'bg-gradient-to-br from-gray-100 to-indigo-500' : ''}`}>
      <NavBar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      <main className={isFullscreen ? "h-full" : ""}>
        <div className={fullscreenStyles.container}>
          {!isFullscreen && <WorkoutSelector selectedWorkout={selectedWorkout} onSelectWorkout={handleWorkoutChange} isFullscreen={isFullscreen} />}
          <div className={fullscreenStyles.videoContainer}>
            <ConnectionStatus status={connectionStatus} />
            <FullscreenButton isFullscreen={isFullscreen} toggleFullscreen={toggleFullscreen} />
            {isFullscreen && <WorkoutSelector selectedWorkout={selectedWorkout} onSelectWorkout={handleWorkoutChange} isFullscreen={isFullscreen} />}
            <video
              ref={webcamRef}
              className="absolute top-0 left-0 w-full h-full object-cover rounded-lg"
              style={{ 
                transform: 'scaleX(-1)',
                borderRadius: isFullscreen ? '0' : undefined 
              }}
              autoPlay muted playsInline
              onLoadedData={() => console.log("[Video Event] Video metadata loaded.")}
              onError={(e) => console.error("[Video Event] Video error:", e)}
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              style={{ 
                transform: 'scaleX(-1)',
                borderRadius: isFullscreen ? '0' : undefined 
              }}
            />
            
            {/* Add Muscle Group Visualizer - use selectedWorkout instead of predictedWorkout */}
            <MuscleGroupVisualizer isVisible={showMuscleVisualizer} isFullscreen={isFullscreen} muscleGroup={predictedMuscleGroup} />
            <MuscleVisualizerToggle 
              isVisible={showMuscleVisualizer} 
              toggleVisibility={toggleMuscleVisualizer} 
              isFullscreen={isFullscreen}
            />
          </div>
          <div className={fullscreenStyles.infoPanel}>
            <div className="flex flex-wrap justify-center items-center">
              <div className="text-center">
                <p>
                  <span className="font-medium">Selected Workout:</span> {workoutMap[selectedWorkout]}
                </p>
                {predictedWorkout !== selectedWorkout && (
                  <p className="text-sm">
                    <span className="font-medium">AI Suggestion:</span> {workoutMap[predictedWorkout]}
                    {recentWorkoutPredictions.length > 0 && (
                      <span className="ml-2 text-xs opacity-75">
                        (Confidence: {Math.round(predictionConfidence * 100)}%)
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
            
            {predictedMuscleGroup > 0 && (
              <p className={`${isFullscreen ? '' : 'mt-1'} text-center`}>
                Muscle Group: <span className="font-semibold">{muscleGroupMap[predictedMuscleGroup]}</span>
                {recentMuscleGroupPredictions.length > 0 && (
                  <span className="ml-2 text-xs opacity-75">
                    (Confidence: {Math.round(muscleGroupConfidence * 100)}%)
                  </span>
                )}
              </p>
            )}
            
            {(feedbackLatency > 0 || receivedCount > 0) && (
              <p className={`${isFullscreen ? '' : 'mt-1'} text-xs text-center`}>
                Latency: {feedbackLatency > 0 ? `${feedbackLatency}ms` : 'N/A'} | Corrections: {receivedCount}
              </p>
            )}
            <p className={`${isFullscreen ? '' : 'mt-1'} text-xs text-center`}>Socket: {connectionStatus}</p>
          </div>
        </div>
      </main>
    </section>
  );
};

export default TrainingPage;
