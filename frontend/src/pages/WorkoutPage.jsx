import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as poseDetection from '@mediapipe/pose';
import { POSE_CONNECTIONS } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import io from 'socket.io-client';
// Import React Body Highlighter
import Model from 'react-body-highlighter';
import { MuscleType, ModelType } from 'react-body-highlighter';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Add this import
import { subscriptionService, usageService, lastViewedExerciseService } from '../services/apiService';
import axios from 'axios';
import { API_URL, AI_URL } from '../config';
import { UserCircle } from 'lucide-react';
// Lucide icons for a more consistent look
import {
  FullscreenIcon,
  MinimizeIcon,
  XCircle,
  Check,
  AlertTriangle,
  Info,
  Eye,
  EyeOff,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react';

// Import NavBar
import NavBar from '../components/Navbar';

// Import Mobile Components
import { useIsMobile } from '../hooks/useIsMobile';
import MobileLayout from '../components/mobile/MobileLayout';

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
  1: "Shoulders",
  2: "Chest",
  3: "Biceps",
  4: "Core",
  5: "Triceps",
  6: "Legs",
  7: "Back"
};

// --- Utility functions ---
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
  // Convert all coordinates to integers to avoid subpixel rendering issues
  fromX = Math.round(fromX);
  fromY = Math.round(fromY);
  toX = Math.round(toX);
  toY = Math.round(toY);
  
  const headLength = 15; 
  const dx = toX - fromX; 
  const dy = toY - fromY;
  
  // Skip drawing very small/insignificant arrows
  const magnitude = Math.sqrt(dx * dx + dy * dy);
  if (magnitude < 5) return;
  
  const angle = Math.atan2(dy, dx);
  
  // Save the current state
  ctx.save();
  
  // Apply anti-aliasing and better line joins
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Draw the arrow shaft with nicer settings
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  
  // Draw the arrowhead as a filled path
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    Math.round(toX - headLength * Math.cos(angle - Math.PI/6)),
    Math.round(toY - headLength * Math.sin(angle - Math.PI/6))
  );
  ctx.lineTo(
    Math.round(toX - headLength * Math.cos(angle + Math.PI/6)),
    Math.round(toY - headLength * Math.sin(angle + Math.PI/6))
  );
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  
  // Restore the context state
  ctx.restore();
};

// --- Drawing functions ---
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

// Add smooth correction tracking
const SMOOTHING_FACTOR = 0.7; // Higher = more smoothing
let previousCorrections = {};

// Add this smoothing function right above the findJointsToCorrect function
const smoothCorrections = (newCorrections, prevCorrections) => {
  if (!newCorrections || Object.keys(newCorrections).length === 0) {
    return prevCorrections;
  }
  
  if (!prevCorrections || Object.keys(prevCorrections).length === 0) {
    return newCorrections;
  }
  
  const smoothedCorrections = {};
  
  // Process all keys from the new corrections
  Object.keys(newCorrections).forEach(key => {
    if (prevCorrections[key]) {
      // Apply smoothing if we have previous data for this joint
      smoothedCorrections[key] = {
        x: SMOOTHING_FACTOR * prevCorrections[key].x + (1 - SMOOTHING_FACTOR) * newCorrections[key].x,
        y: SMOOTHING_FACTOR * prevCorrections[key].y + (1 - SMOOTHING_FACTOR) * newCorrections[key].y
      };
    } else {
      // No previous data, use new data directly
      smoothedCorrections[key] = newCorrections[key];
    }
  });
  
  // Also include joints from previous corrections that might not be in new data
  // This helps prevent sudden disappearances
  Object.keys(prevCorrections).forEach(key => {
    if (!newCorrections[key]) {
      // Apply decay to previous corrections that are no longer present
      smoothedCorrections[key] = {
        x: prevCorrections[key].x * 0.8, // Gradual fade out
        y: prevCorrections[key].y * 0.8
      };
      
      // Remove very small corrections to avoid visual noise
      if (Math.abs(smoothedCorrections[key].x) < 0.005 && Math.abs(smoothedCorrections[key].y) < 0.005) {
        delete smoothedCorrections[key];
      }
    }
  });
  
  return smoothedCorrections;
};

const findJointsToCorrect = (landmarks, corrections) => {
  // Add debugging
  if (!landmarks) {
    console.log('[findJointsToCorrect] No landmarks provided');
    return [];
  }
  
  if (!corrections) {
    return [];
  }
  
  if (Object.keys(corrections).length === 0) {
    return [];
  }
  
  try {
    const correctJoints = [];
    Object.keys(corrections).forEach(indexStr => {
      const i = parseInt(indexStr);
      const correction = corrections[indexStr];
      
      // Make sure we have valid landmarks and index
      if (i >= 0 && i < landmarks.length && landmarks[i]) {
        // Make sure correction has valid x/y values
        if (correction && typeof correction === 'object') {
          const corrX = correction.x !== undefined ? correction.x : 0;
          const corrY = correction.y !== undefined ? correction.y : 0;
          
          // Only include if the correction magnitude is significant
          if ((Math.abs(corrX) > 0.01 || Math.abs(corrY) > 0.01)) {
            const jointName = getJointName(i);
            if (jointName) {
              correctJoints.push({ name: jointName, index: i, correction: {x: corrX, y: corrY} });
            }
          }
        }
      }
    });
    
    return correctJoints;
  } catch (e) {
    console.error('[findJointsToCorrect] Error processing corrections:', e);
    return [];
  }
};

const drawCorrectionArrows = (ctx, landmarks, corrections, jointsToCorrect, canvasWidth, canvasHeight) => {
  if (!landmarks || !corrections || jointsToCorrect.length === 0) { return; }
  
  // Set proper composite operation for cleaner overlapping
  ctx.globalCompositeOperation = 'source-over';
  
  jointsToCorrect.forEach(joint => {
    const i = joint.index;
    if (!landmarks[i] || landmarks[i].x == null || landmarks[i].y == null) { return; }
    
    const originalX = landmarks[i].x * canvasWidth; 
    const originalY = landmarks[i].y * canvasHeight;
    
    const correction = corrections[String(i)];
    if (!correction || correction.x == null || correction.y == null) { return; }
    
    const vectorX = correction.x * canvasWidth; 
    const vectorY = correction.y * canvasHeight;
    
    // Only draw if magnitude is significant
    const magnitude = Math.sqrt(vectorX * vectorX + vectorY * vectorY);
    if (magnitude < 2) { return; } // Skip tiny corrections that cause flicker
    
    const targetX = originalX + vectorX; 
    const targetY = originalY + vectorY;
    
    // Use a consistent extension factor
    const extendedTargetX = originalX + vectorX * 1.5; 
    const extendedTargetY = originalY + vectorY * 1.5;
    
    const correctionMagnitude = Math.sqrt(correction.x * correction.x + correction.y * correction.y);
    const arrowColor = getArrowColor(correctionMagnitude);
    
    // Use whole numbers to avoid anti-aliasing issues
    drawArrow(
      ctx, 
      Math.round(originalX), 
      Math.round(originalY), 
      Math.round(extendedTargetX), 
      Math.round(extendedTargetY), 
      arrowColor, 
      6
    );
  });
  
  // Reset composite operation
  ctx.globalCompositeOperation = 'source-over';
};

// --- UI Components ---

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.4 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  },
  exit: { 
    opacity: 0, 
    y: 20,
    transition: { duration: 0.2 }
  }
};

const ConnectionStatus = ({ status }) => {
  const statusInfo = {
    connected: {
      color: "bg-green-500", 
      text: "Connected",
      icon: <Check className="w-3 h-3 text-green-500" />
    },
    connecting: {
      color: "bg-yellow-500", 
      text: "Connecting...",
      icon: <RefreshCw className="w-3 h-3 text-yellow-500 animate-spin" />
    },
    disconnected: {
      color: "bg-red-500", 
      text: "Disconnected",
      icon: <XCircle className="w-3 h-3 text-red-500" />
    }
  };
  
  const { color, text, icon } = statusInfo[status];
  
  return (
    <motion.div 
      className="absolute top-4 right-4 z-40"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg">
        <div className={`w-2 h-2 rounded-full ${color}`}></div>
        <span className="text-xs font-medium">{text}</span>
        <div className="ml-1">{icon}</div>
      </div>
    </motion.div>
  );
};

const FullscreenButton = ({ isFullscreen, toggleFullscreen }) => {
  return (
    <motion.button 
      onClick={toggleFullscreen}
      className="absolute top-4 left-4 z-40 bg-black/40 hover:bg-black/60 text-white p-2.5 rounded-lg transition-colors backdrop-blur-sm shadow-lg"
      title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {isFullscreen ? <MinimizeIcon className="w-5 h-5" /> : <FullscreenIcon className="w-5 h-5" />}
    </motion.button>
  );
};

const WorkoutSelector = ({ selectedWorkout, onSelectWorkout }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="relative">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 bg-black/40 hover:bg-black/60 text-white px-4 py-2 rounded-lg transition-colors shadow-md backdrop-blur-sm border border-gray-600/30"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>{workoutMap[selectedWorkout]}</span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </motion.button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute mt-1 left-0 right-0 max-h-60 overflow-y-auto bg-black/80 text-white border border-gray-600/30 rounded-lg shadow-xl z-50 backdrop-blur-md"
            >
              {Object.entries(workoutMap).map(([id, name]) => (
                <div
                  key={id}
                  onClick={() => {
                    onSelectWorkout(Number(id));
                    setIsOpen(false);
                  }}
                  className={`px-4 py-2 cursor-pointer ${
                    Number(id) === selectedWorkout
                      ? 'bg-purple-500/30 text-purple-200'
                      : ''
                  } hover:bg-gray-700/50 transition-colors`}
                >
                  {name}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const MuscleGroupVisualizer = ({ isVisible, muscleGroup }) => {
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
  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Front view - Left side */}
          <motion.div 
            className="absolute bottom-20 left-8 z-30 pointer-events-none w-[120px] sm:w-[180px] lg:w-[200px] max-w-[30vw]"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={fadeIn}
          >
            <Model 
              data={muscleData}
              type={ModelType.ANTERIOR}
              highlightedColors={['#a855f7']}
              onClick={() => {}} // Empty handler to prevent errors
            />
          </motion.div>
          
          {/* Back view - Right side */}
          <motion.div 
            className="absolute bottom-20 right-8 z-30 pointer-events-none w-[120px] sm:w-[180px] lg:w-[200px] max-w-[30vw]"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={fadeIn}
          >
            <Model 
              data={muscleData}
              type={ModelType.POSTERIOR}
              highlightedColors={['#a855f7']}
              onClick={() => {}} // Empty handler to prevent errors
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const MuscleVisualizerToggle = ({ isVisible, toggleVisibility }) => {
  return (
    <motion.button 
      onClick={toggleVisibility}
      className={`absolute bottom-4 right-8 z-40 ${
        isVisible 
          ? 'bg-purple-600/70 hover:bg-purple-700/80' 
          : 'bg-black/40 hover:bg-black/60'
      } text-white p-2.5 rounded-lg transition-colors backdrop-blur-sm shadow-lg`}
      title={isVisible ? "Hide Muscle Activation" : "Show Muscle Activation"}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
    </motion.button>
  );
};

const CustomNotification = ({ type, message, onClose }) => {
  // Define color schemes based on notification type
  const notificationConfig = {
    success: {
      bg: "bg-green-500/90",
      border: "border-green-400",
      icon: <Check className="w-5 h-5" />
    },
    info: {
      bg: "bg-blue-500/90",
      border: "border-blue-400",
      icon: <Info className="w-5 h-5" />
    },
    warning: {
      bg: "bg-yellow-500/90",
      border: "border-yellow-400",
      icon: <AlertTriangle className="w-5 h-5" />
    },
    error: {
      bg: "bg-red-500/90",
      border: "border-red-400",
      icon: <XCircle className="w-5 h-5" />
    }
  };

  // Use info as default type
  const config = notificationConfig[type] || notificationConfig.info;
  
  return (
    <motion.div 
      className={`${config.bg} backdrop-blur-md text-white rounded-lg shadow-lg overflow-hidden mb-4 border-l-4 ${config.border}`}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start p-4">
        <div className="flex-shrink-0 mr-3">
          {config.icon}
        </div>
        <div className="flex-grow">
          <p className="font-medium">{message}</p>
        </div>
        <button 
          onClick={onClose}
          className="flex-shrink-0 ml-3 p-1 rounded-full hover:bg-white/20 transition-colors"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

// First, update the InfoPanel component definition to accept pendingUpdates as a prop
const InfoPanel = ({ 
  currentWorkout, 
  predictedWorkout, 
  predictionConfidence, 
  predictionThreshold,
  predictedMuscleGroup,
  muscleGroupConfidence,
  feedbackLatency,
  receivedCount,
  connectionStatus,
  onForceUpdate,
  pendingUpdates,
  sessionDuration
}) => {
  // Format the session duration into a readable format
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <motion.div 
      className="bg-black/60 text-white px-5 py-3 rounded-xl backdrop-blur-md border border-white/10 shadow-lg"
      initial="hidden"
      animate="visible"
      variants={slideUp}
    >
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-sm font-medium opacity-70">Current:</span>
            <span className="ml-2 font-semibold">
              {currentWorkout !== null ? workoutMap[currentWorkout] : "Loading..."}
            </span>
          </div>          
          {/* Add session timer here */}
          <div className="flex items-center text-xs">
            <span className="opacity-70 mr-1">Session:</span>
            <span className="font-mono">{formatDuration(sessionDuration)}</span>
          </div>
        </div>

        {currentWorkout !== null && predictedWorkout !== currentWorkout && (
            <div className="flex items-center">
              <span className="text-sm font-medium opacity-70">Suggested:</span>
              <span className={`ml-2 px-2 py-0.5 rounded-full text-sm ${
                predictionConfidence > predictionThreshold 
                  ? 'bg-purple-500/30 text-purple-200 border border-purple-500/30' 
                  : 'bg-gray-500/30 text-gray-200 border border-gray-500/30'
              }`}>
                {workoutMap[predictedWorkout]}
              </span>
              {predictionConfidence > 0 && (
                <div className="ml-2 flex items-center">
                  <div className="w-4 h-1 bg-gray-700/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        predictionConfidence > predictionThreshold ? 'bg-purple-500' : 'bg-gray-500'
                      }`}
                      style={{ width: `${predictionConfidence * 100}%` }}
                    ></div>
                  </div>
                  <span className={`ml-1 text-xs ${
                    predictionConfidence > predictionThreshold ? 'text-purple-300' : 'opacity-60'
                  }`}>
                    {Math.round(predictionConfidence * 100)}%
                  </span>
                </div>
              )}
            </div>
          )}
        
        {predictedMuscleGroup > 0 && (
          <div className="flex items-center">
            <span className="text-sm font-medium opacity-70">Muscle Group:</span>
            <div className="flex items-center ml-2">
              <Zap className={`w-4 h-4 mr-1 ${
                muscleGroupConfidence > predictionThreshold ? 'text-purple-400' : 'opacity-60'
              }`} />
              <span className="font-semibold">{muscleGroupMap[predictedMuscleGroup]}</span>
              {muscleGroupConfidence > 0 && (
                <div className="ml-2 flex items-center">
                  <div className="w-4 h-1 bg-gray-700/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        muscleGroupConfidence > predictionThreshold ? 'bg-purple-500' : 'bg-gray-500'
                      }`}
                      style={{ width: `${muscleGroupConfidence * 100}%` }}
                    ></div>
                  </div>
                  <span className={`ml-1 text-xs ${
                    muscleGroupConfidence > predictionThreshold ? 'text-purple-300' : 'opacity-60'
                  }`}>
                    {Math.round(muscleGroupConfidence * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            {(feedbackLatency > 0 || receivedCount > 0) && (
              <>
                <span>Latency: {feedbackLatency > 0 ? `${feedbackLatency}ms` : 'N/A'}</span>
                <span className="flex items-center">
                  Corrections: 
                  <span className="font-semibold ml-1">{receivedCount}</span>
                  <button 
                    onClick={onForceUpdate}
                    className="ml-1 p-1 bg-purple-500/20 rounded-full hover:bg-purple-500/40 transition-colors"
                    title="Update Usage Stats"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                  <span 
                    id="auto-update-indicator" 
                    className={`w-2 h-2 ml-1 rounded-full ${
                      pendingUpdates > 0 ? 'bg-yellow-500/50' : 'bg-gray-500/50'
                    }`}
                    title={pendingUpdates > 0 ? `${pendingUpdates} updates pending` : 'No updates pending'}
                  ></span>
                </span>
              </>
            )}
          </div>
          <span className="flex items-center">
            <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500' : 
              'bg-red-500'
            }`}></div>
            {connectionStatus}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main TrainingPage Component ---
const TrainingPage = () => {
  const navigate = useNavigate();
  const { token, isGuestMode, user, logout } = useAuth(); // Get auth token, guest mode, user, and logout from context

  // Logout handler
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(true); // Add this state
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true); // Add this state
  const [showCameraPermission, setShowCameraPermission] = useState(false); // Camera permission modal
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
  const receivedCountRef = useRef(0);
  const poseInstanceRef = useRef(null);
  const cameraInstanceRef = useRef(null);
  const sendIntervalRef = useRef(null);
  const sessionDurationTimerRef = useRef(null);
  const autoUpdateTimerRef = useRef(null);
  const lastAutoUpdateTimeRef = useRef(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Add these new refs for tracking updates
  const pendingStatsRef = useRef({
    framesProcessed: 0,
    correctionsSent: 0,
    sessionDuration: 0
  });
  
  // Add session tracking state
  const [sessionId, setSessionId] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionStats, setSessionStats] = useState({
    framesProcessed: 0,
    correctionsSent: 0
  });
  
  // Add state for tracking session duration
  const [sessionDuration, setSessionDuration] = useState(0);

  // Add state for muscle visualizer toggle
  const [showMuscleVisualizer, setShowMuscleVisualizer] = useState(true);

  // Mobile detection and mobile-specific state
  const isMobile = useIsMobile();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Debug: Log mobile detection
  useEffect(() => {
    console.log('[Mobile Detection]', {
      isMobile,
      width: window.innerWidth,
      height: window.innerHeight,
      isPortrait: window.innerHeight > window.innerWidth,
      touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0
    });
  }, [isMobile]);
  
  // Modified workout prediction state
  const [predictedWorkout, setPredictedWorkout] = useState(12); // Default to plank (12)
  
  // Replace the selectedWorkout state with currentWorkout, but use null as initial value
  // We'll fetch the last viewed exercise and update it before showing UI
  const [currentWorkout, setCurrentWorkout] = useState(null); 
  // Add ref to track current workout synchronously with a default of 12 (plank)
  const currentWorkoutRef = useRef(12);
  
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
  
  // Modify the notification system variables
  const SUGGESTION_THRESHOLD = 0.8; // Higher threshold for suggestions
  const AUTO_CHANGE_THRESHOLD = 0.95; // Very high threshold for auto-changing (increased)
  const AUTO_CHANGE_CONSECUTIVE_FRAMES = 40; // Need consistent prediction for ~2 seconds (increased)
  const MIN_SUGGESTION_COUNT = 15; // Require at least ~0.75 seconds of consistent detection before suggesting
  const [suggestionCounts, setSuggestionCounts] = useState({});
  const [lastSuggestedWorkout, setLastSuggestedWorkout] = useState(null);
  const [lastNotificationTime, setLastNotificationTime] = useState(0);
  // Add a ref to synchronously track the next allowed notification time
  const nextAllowedChangeTimeRef = useRef(0);
  const NOTIFICATION_COOLDOWN = 5000; // 20 seconds between notifications (doubled)
  const [declinedWorkouts, setDeclinedWorkouts] = useState({}); // Track declined suggestions
  const DECLINE_COOLDOWN = 60000; // 1 minute cooldown after declining a suggestion
  
  // Update the ratio window size from 15 seconds to 5 seconds
  const RATIO_WINDOW_SIZE = 100; // Track ~5 seconds (100 frames at 50ms intervals)
  const SUGGESTION_RATIO_THRESHOLD = 0.75; // Require 75% of recent predictions to be the same workout
  const AUTO_CHANGE_RATIO_THRESHOLD = 0.85; // Require 85% for auto-change
  const [workoutHistoryWindow, setWorkoutHistoryWindow] = useState([]); // Track history for ratio calculation
  
  // Add state for our custom notifications
  const [notifications, setNotifications] = useState([]);
  // Add notification queue
  const [notificationQueue, setNotificationQueue] = useState([]);
  const [isProcessingNotification, setIsProcessingNotification] = useState(false);
  
  // Add this at the top of the component function where other refs are defined
  const correctionsUpdateTimerRef = useRef(null);
  
  // Function to add a notification to the queue
  const addNotification = (notificationData) => {
    const id = Date.now(); // Simple unique ID based on timestamp
    
    // Add to the queue instead of showing immediately
    setNotificationQueue(prev => [...prev, { ...notificationData, id }]);
    
    // If notification is related to workout suggestion or change, update stats immediately
    if (notificationData.type === 'info' && 
        (notificationData.message.includes('Changed to') || 
         notificationData.message.includes('workout') || 
         notificationData.message.includes('exercise'))) {
      
      // Only send update if we have an active session
      if (sessionId && token) {
        // Send immediate stats update
        forceUpdateUsageStats();
      }
    }
    
    return id; // Return the ID for reference
  };
  
  // Process the notification queue
  useEffect(() => {
    if (notificationQueue.length > 0 && !isProcessingNotification) {
      // Get the first notification from the queue
      const nextNotification = notificationQueue[0];
      
      // Remove it from the queue
      setNotificationQueue(prev => prev.slice(1));
      
      // Set the active notification
      setNotifications([nextNotification]);
      setIsProcessingNotification(true);
      
      // Set timeout to clear this notification
      const timeout = nextNotification.autoClose || 3000;
      setTimeout(() => {
        setNotifications([]);
        setIsProcessingNotification(false);
      }, timeout);
    }
  }, [notificationQueue, isProcessingNotification]);
  
  // Fix the removeNotification function to be more robust
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    setIsProcessingNotification(false);
  };
  
  // Update the clearAllNotifications function to clear everything
  const clearAllNotifications = () => {
    setNotifications([]);
    setNotificationQueue([]);
    setIsProcessingNotification(false);
  };
  
  // Simplify handleWorkoutChange to just set the workout without tracking previous
  const handleWorkoutChange = (newWorkoutId) => {
    const parsedId = Number(newWorkoutId);
    // Only call setCurrentWorkout once
    setCurrentWorkout(parsedId);
    // Update ref synchronously to always have the latest value
    currentWorkoutRef.current = parsedId;
    clearAllNotifications();
    
    // Update lastNotificationTime to prevent immediate new notifications
    setLastNotificationTime(Date.now());
    
    // Log the NEW workout that's being set rather than the current one
    console.log(`[Handle Workout Change] Changed from ${workoutMap[currentWorkout]} to ${workoutMap[parsedId]}`);
    
    // Also update the ref to ensure synchronous blocking of future changes
    nextAllowedChangeTimeRef.current = Date.now() + NOTIFICATION_COOLDOWN;

    // If user is authenticated (not guest), update the last viewed exercise in the backend
    if (token && !isGuestMode) {
      // Update the last viewed exercise record
      lastViewedExerciseService.updateLastViewed({
        workout_type: parsedId,
        workout_name: workoutMap[parsedId]
      })
      .then(() => {
        console.log(`[LastViewed] Updated last viewed exercise to: ${workoutMap[parsedId]}`);
      })
      .catch(error => {
        console.error('[LastViewed] Error updating last viewed exercise:', error);
      });
    }


    // If we have an active session (not guest), update the workout type in the session tracking
    if (sessionId && token && !isGuestMode) {
      // Convert workout map to a format with string keys for better JSON compatibility
      const stringWorkoutMap = {};
      Object.entries(workoutMap).forEach(([key, value]) => {
        stringWorkoutMap[key.toString()] = value;
      });
      
      // Create update payload with the new workout
      const updateData = {
        session_id: sessionId,
        workout_type: parsedId,
        workout_map: stringWorkoutMap,
        frames_processed: pendingStatsRef.current.framesProcessed,
        corrections_sent: pendingStatsRef.current.correctionsSent,
        session_duration: pendingStatsRef.current.sessionDuration
      };
      
      // Update the session info on the backend
      usageService.updateMetrics(updateData)
        .then(response => {
          console.log(`[Session] Updated session workout type to: ${workoutMap[parsedId]}`);
        })
        .catch(error => {
          console.error('[Session] Error updating session workout type:', error);
        });
        
      // Also force an immediate update to make sure this change is recorded
      forceUpdateUsageStats();
    }
    
    // Add notification
    addNotification({
      type: 'info',
      message: `Changed to ${workoutMap[parsedId]}`,
      autoClose: 3000
    });
  };

  // Replace the updateStableWorkoutPrediction function with improved auto-change approach
  const updateStableWorkoutPrediction = (newPrediction) => {
    // Update the recent predictions array for confidence calculation
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
      
      // Set the predicted workout type only if it's not the same as the current workout
      if (mostFrequent !== currentWorkoutRef.current) {
        setPredictedWorkout(mostFrequent);
      }
      
      return updated;
    });
    
    // Update longer history window for ratio-based suggestions
    setWorkoutHistoryWindow(prev => {
      // Keep the history window at RATIO_WINDOW_SIZE
      const updatedHistory = [...prev, newPrediction].slice(-RATIO_WINDOW_SIZE);
      
      // Calculate the ratio of each workout type in the history window
      const typeCount = {};
      updatedHistory.forEach(type => {
        typeCount[type] = (typeCount[type] || 0) + 1;
      });
      
      // If the history window is sufficiently full (at least half capacity)
      if (updatedHistory.length >= RATIO_WINDOW_SIZE / 2) {
        // Get the workout with the highest count
        let mostFrequentType = null;
        let highestCount = 0;
        
        Object.entries(typeCount).forEach(([type, count]) => {
          if (count > highestCount) {
            highestCount = count;
            mostFrequentType = Number(type);
          }
        });
        
        // Calculate the ratio of the most frequent workout
        const ratio = highestCount / updatedHistory.length;
        
        // If we have a different workout than selected with high ratio
        if (mostFrequentType !== currentWorkoutRef.current && ratio >= SUGGESTION_RATIO_THRESHOLD) {
          const now = Date.now();
          
          // Check if we're past the cooldown period using the ref for synchronous checking
          if (now >= nextAllowedChangeTimeRef.current) {
            // Check if this workout was recently declined
            const workoutKey = String(mostFrequentType);
            const declineTime = declinedWorkouts[workoutKey] || 0;
            const timeSinceDecline = now - declineTime;
            
            // Skip suggestion if recently declined
            if (timeSinceDecline < DECLINE_COOLDOWN) {
              return updatedHistory;
            }
            
            // Immediately update the ref to block subsequent calls
            nextAllowedChangeTimeRef.current = now + NOTIFICATION_COOLDOWN;
            
            // AUTO-CHANGE with notification when we detect a different workout with high confidence
            // Only change workout if it's different from the current one
            if (mostFrequentType !== currentWorkoutRef.current) {
              console.log(`[Auto-Change] Detected different workout: ${workoutMap[mostFrequentType]}`);
              // log current and predicted workout
              console.log(`[Auto-Change] Current workout: ${workoutMap[currentWorkout]}`);
              console.log(`[Auto-Change] Predicted workout: ${workoutMap[mostFrequentType]}`);
              // Then handle the workout change
              handleWorkoutChange(mostFrequentType);
              
              // Show notification about the change
              addNotification({
                type: 'info',
                message: `Changed to ${workoutMap[mostFrequentType]}`,
                autoClose: 3000
              });
              
              // Force update stats since this is a significant event
              if (sessionId && token) {
                // Wait a moment for handleWorkoutChange to complete its updates
                setTimeout(() => {
                  forceUpdateUsageStats();
                }, 500);
              }
              
              setLastSuggestedWorkout(mostFrequentType);
              setLastNotificationTime(now);
            }
          }
        }
      }
      
      return updatedHistory;
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
      
      // Add auth token to connection if available
      const socketOptions = {
        reconnection: true, 
        reconnectionAttempts: Infinity, 
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000, 
        timeout: 10000, 
        transports: ['websocket']
      };
      
      // Add auth token if available, or mark as guest
      if (token) {
        console.log('[Socket Setup] Adding auth token to connection');
        socketOptions.auth = { token };
      } else if (isGuestMode) {
        console.log('[Socket Setup] Connecting as guest user');
        socketOptions.auth = { guest: true };
      } else {
        console.log('[Socket Setup] No auth token available');
      }
      
      console.log(`[Socket Setup] Connecting to WebSocket server at ${AI_URL}`);
      try {
        socketRef.current = io(AI_URL, socketOptions);
        
        socketRef.current.on('connect', () => { 
          console.log('[Socket Status] WebSocket connected successfully. Socket ID:', socketRef.current?.id); 
          setConnectionStatus("connected");
          setSessionStartTime(Date.now());
        });
        
        socketRef.current.on('disconnect', (reason) => { 
          console.warn('[Socket Status] WebSocket disconnected. Reason:', reason); 
          setConnectionStatus("disconnected");
          
          // Report final session stats if we had a session
          if (sessionId) {
            reportFinalSessionStats();
          }
        });
        
        socketRef.current.on('connect_error', (error) => { 
          console.error('[Socket Status] WebSocket connection error:', error); 
          console.error('[Socket Status] Error details:', error.message || 'Unknown error');
          setConnectionStatus("disconnected"); 
        });
        
        socketRef.current.on('connected', (data) => { 
          console.log('[Socket Event] Received "connected" confirmation:', data);
          
          // Store session ID if provided and ensure we start a new session on the backend
          if (data && data.session_id) {
            console.log('[Socket Event] Session ID received:', data.session_id);
            setSessionId(data.session_id);
            
            // Reset session stats on new connection
            setSessionStats({
              framesProcessed: 0,
              correctionsSent: 0
            });
            console.log('[Socket Event] Session stats reset for new session');
          } else if (data && data.client_id) {
            // If we didn't get a session_id but got a client_id, we should manually start a session
            console.log('[Socket Event] No session ID received, starting a new session manually with client ID:', data.client_id);
            
            // Check if we're already tracking a session before starting a new one
            if (!sessionId) {
              startSessionOnBackend(data.client_id);
            } else {
              console.log('[Socket Event] Already tracking session ID:', sessionId);
            }
          } else {
            console.warn('[Socket Event] No session ID or client ID received in connected event');
          }
        });

        // --- Corrections Handler ---
        socketRef.current.on('pose_corrections', (data) => {
          // Process the corrections for drawing without triggering renders
          if (data.corrections) {
            // Apply smoothing to prevent flickering
            const smoothedCorrections = smoothCorrections(data.corrections, previousCorrections);
            previousCorrections = smoothedCorrections;
            
            // Update the ref with the smoothed data
            latestCorrectionsRef.current = smoothedCorrections;
          } else if (typeof data === 'object' && !data.predicted_workout_type && !data.predicted_muscle_group) {
            // Apply smoothing to prevent flickering
            const smoothedCorrections = smoothCorrections(data, previousCorrections);
            previousCorrections = smoothedCorrections;
            
            // Update the ref with the smoothed data
            latestCorrectionsRef.current = smoothedCorrections;
          } else {
            latestCorrectionsRef.current = {};
          }

          // Update state much less frequently to prevent render flicker
          // Use a timer-based approach instead of random to make it more predictable
          if (!correctionsUpdateTimerRef.current) {
            correctionsUpdateTimerRef.current = setTimeout(() => {
              setCorrections(latestCorrectionsRef.current);
              correctionsUpdateTimerRef.current = null;
            }, 500); // Update UI state only every 500ms
          }

          // Update session stats - add to both the state and the pending stats ref
          const correctionCount = data.corrections ? Object.keys(data.corrections).length : 1;
          
          // Update the state (this might cause re-renders)
          setSessionStats(prev => ({
            framesProcessed: prev.framesProcessed + 1,
            correctionsSent: prev.correctionsSent + correctionCount
          }));
          
          // Also accumulate in our pending stats reference (for auto-updates)
          pendingStatsRef.current.framesProcessed += 1;
          pendingStatsRef.current.correctionsSent += correctionCount;
          
          // Log the updated stats occasionally to verify they're increasing
          if (Math.random() < 0.01) { // Log roughly every 100 frames
            console.log('[Session Stats] Current stats:', {
              sessionId,
              framesProcessed: sessionStats.framesProcessed,
              correctionsSent: sessionStats.correctionsSent,
              pendingUpdates: pendingStatsRef.current
            });
          }
          
          // Check if there's a predicted workout type in the data
          if (data.predicted_workout_type !== undefined) {
            updateStableWorkoutPrediction(data.predicted_workout_type);
          }
          
          // Check if there's a predicted muscle group in the data
          if (data.predicted_muscle_group !== undefined) {
            updateStableMuscleGroupPrediction(data.predicted_muscle_group);
          }

          // Update timing info
          const now = Date.now();
          // Check if the received data contains a timestamp from when it was sent
          if (data.timestamp) {
            const latency = now - data.timestamp;
            // Update more frequently with a smaller threshold
            if (Math.abs(latency - feedbackLatency) > 20) {
              setFeedbackLatency(latency);
            }
          } else {
            // Fallback to the old calculation
            const latency = lastLandmarkUpdateRef.current ? now - lastLandmarkUpdateRef.current : 0;
            if (Math.abs(latency - feedbackLatency) > 20) {
              setFeedbackLatency(latency);
            }
          }
          
          // Use ref for count and update state less frequently
          receivedCountRef.current += 1;
          // Update more frequently (every other correction) but still throttle
          if (receivedCountRef.current % 2 === 0) {
            setReceivedCount(receivedCountRef.current);
          }
          
          lastCorrectionTimeRef.current = now;
        });
        // --- END Corrections Handler ---

        socketRef.current.on('error', (data) => { 
          console.error('[Socket Event] Received server error:', data.message || data); 
        });
      } catch (error) {
        console.error('[Socket Setup] Error initializing socket connection:', error);
        setConnectionStatus("disconnected");
      }
    };
    
    connectSocket();

    // Send final session stats when component unmounts
    return () => {
      // Report final session stats if we have an active session (skip for guests)
      if (sessionId && token && !isGuestMode) {
        console.log('[Component Unmount] Reporting final stats for session:', sessionId);
        reportFinalSessionStats();
      }
      
      // Cleanup all timers
      if (sessionDurationTimerRef.current) {
        clearInterval(sessionDurationTimerRef.current);
        sessionDurationTimerRef.current = null;
      }
      
      if (autoUpdateTimerRef.current) {
        clearInterval(autoUpdateTimerRef.current);
        autoUpdateTimerRef.current = null;
      }
      
      if (sendIntervalRef.current) {
        clearInterval(sendIntervalRef.current);
        sendIntervalRef.current = null;
      }
      
      // Disconnect WebSocket
      if (socketRef.current) { 
        console.log("[Socket Cleanup] Disconnecting WebSocket."); 
        socketRef.current.disconnect(); 
        socketRef.current = null;
      }
    };
  }, [token, isGuestMode]); // Add token and isGuestMode as dependencies

  // Function to report final session stats
  const reportFinalSessionStats = () => {
    if (!token || !sessionId) {
      console.log('[Session] Cannot report final stats: No active session or token');
      return;
    }
    
    // Convert workout map to a format with string keys for better JSON compatibility
    const stringWorkoutMap = {};
    Object.entries(workoutMap).forEach(([key, value]) => {
      stringWorkoutMap[key.toString()] = value;
    });
    
    // Get the latest stats
    const finalStats = {
      frames_processed: sessionStats.framesProcessed + pendingStatsRef.current.framesProcessed,
      corrections_sent: sessionStats.correctionsSent + pendingStatsRef.current.correctionsSent,
      session_duration: sessionDuration,
      workout_type: currentWorkoutRef.current,
      workout_map: stringWorkoutMap,
      platform: getPlatform()
    };
    
    console.log('[Session] Reporting final session stats:', finalStats);
    
    // Send final stats to the backend
    fetch(`${API_URL}/api/usage/end_session/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        session_id: sessionId,
        ...finalStats
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('[Session] Final stats reported successfully:', data);
      
      // Clear the session ID and timers
      setSessionId(null);
      setSessionStartTime(null);
      setSessionDuration(0);
      
      // Clear any running timers
      if (sessionDurationTimerRef.current) {
        clearInterval(sessionDurationTimerRef.current);
        sessionDurationTimerRef.current = null;
      }
      
      if (autoUpdateTimerRef.current) {
        clearInterval(autoUpdateTimerRef.current);
        autoUpdateTimerRef.current = null;
      }
      
      // Reset pending stats
      pendingStatsRef.current = {
        framesProcessed: 0,
        correctionsSent: 0,
        sessionDuration: 0
      };
    })
    .catch(error => {
      console.error('[Session] Error reporting final stats:', error);
    });
  };

  // Update the useEffect that handles periodic session stats reporting
  useEffect(() => {
    // Skip session tracking for guest users
    if (isGuestMode) {
      console.log('[Session] Skipping session tracking for guest user');
      return;
    }

    if (!sessionId || !token) {
      console.log('[Session] Missing sessionId or token for automatic updates');
      return;
    }
    
    console.log('[Session] Setting up periodic stats reporting for session:', sessionId);
    
    // Initialize our pending stats tracker
    pendingStatsRef.current = {
      framesProcessed: sessionStats.framesProcessed,
      correctionsSent: sessionStats.correctionsSent,
      sessionDuration: 0
    };
    
    const reportInterval = setInterval(() => {
      const now = Date.now();
      
      // Check if we have new stats to report compared to last auto-update
      const pendingStats = pendingStatsRef.current;
      const hasNewData = (
        pendingStats.framesProcessed > 0 || 
        pendingStats.correctionsSent > 0
      );
      
      // Calculate current duration in seconds
      const currentDurationInSeconds = sessionStartTime ? Math.floor((now - sessionStartTime) / 1000) : 0;
      
      // Only send update if we have some data to report
      if (hasNewData) {
        console.log('[Session] Sending auto-update with stats:', {
          session_id: sessionId,
          frames_processed: pendingStats.framesProcessed,
          corrections_sent: pendingStats.correctionsSent,
          session_duration: currentDurationInSeconds,
          workout_type: currentWorkoutRef.current,
          time_since_last: now - lastAutoUpdateTimeRef.current
        });
        
        fetch(`${API_URL}/api/usage/update_metrics/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            session_id: sessionId,
            frames_processed: pendingStats.framesProcessed,
            corrections_sent: pendingStats.correctionsSent,
            session_duration: currentDurationInSeconds,
            workout_type: currentWorkoutRef.current
          })
        })
        .then(response => {
          if (response.ok) {
            // Update the UI indicator
            const autoUpdateIndicator = document.getElementById('auto-update-indicator');
            if (autoUpdateIndicator) {
              autoUpdateIndicator.classList.add('pulse-success');
              setTimeout(() => {
                autoUpdateIndicator.classList.remove('pulse-success');
              }, 1000);
            }
            
            // Reset our pending stats accumulator
            pendingStatsRef.current = {
              framesProcessed: 0,
              correctionsSent: 0,
              sessionDuration: 0
            };
            
            // Update the last auto-update time
            lastAutoUpdateTimeRef.current = now;
            
            console.log('[Session] Auto-update successful');
          } else {
            console.error('[Session] Auto-update failed:', response.statusText);
          }
        })
        .catch(error => {
          console.error('[Session] Error in auto-update:', error);
        });
      } else {
        console.log('[Session] Skipping auto-update - no new stats to report');
      }
    }, 10000); // Every 10 seconds
    
    return () => {
      console.log('[Session] Clearing periodic stats reporting interval');
      clearInterval(reportInterval);
    };
  }, [sessionId, token, sessionStartTime, isGuestMode]); // Add sessionStartTime and isGuestMode to dependencies

  // Add a new function to manually force-update usage stats
  const forceUpdateUsageStats = () => {
    // Skip for guest users
    if (isGuestMode) {
      console.log('[Session] Skipping stats update for guest user');
      return;
    }

    if (!sessionId || !token) {
      console.warn('[Session] Cannot force update: Missing session ID or token');
      return;
    }
    
    // Ensure sessionStartTime exists
    if (!sessionStartTime) {
      console.warn('[Session] Cannot force update: Missing session start time');
      return;
    }
    
    // Calculate current duration in seconds
    const currentDurationInSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
    
    // Convert workout map to a format with string keys for better JSON compatibility
    const stringWorkoutMap = {};
    Object.entries(workoutMap).forEach(([key, value]) => {
      stringWorkoutMap[key.toString()] = value;
    });
    
    // Combine current stats with pending stats for a complete update
    const statsToReport = {
      session_id: sessionId,
      frames_processed: sessionStats.framesProcessed,
      corrections_sent: sessionStats.correctionsSent,
      session_duration: currentDurationInSeconds,
      workout_type: currentWorkoutRef.current,
      workout_map: stringWorkoutMap,
      platform: getPlatform()
    };
    
    console.log('[Session] Force-updating stats:', statsToReport);
    
    // Send the update to the backend
    fetch(`${API_URL}/api/usage/update_metrics/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(statsToReport)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log(`[Session] Stats updated successfully for session: ${data.session_id}`);
      
      // Reset pending stats since we just committed them
      pendingStatsRef.current = {
        framesProcessed: 0,
        correctionsSent: 0,
        sessionDuration: currentDurationInSeconds
      };
      
      // Update last auto-update time
      lastAutoUpdateTimeRef.current = Date.now();
    })
    .catch(error => {
      console.error('[Session] Error updating stats:', error);
    });
  };

  // Add a new debugging function for tracing the pose/drawing pipeline
  const debugLog = (message, data = null, force = false) => {
    // Use force for critical logs we always want to see
    if (force || Math.random() < 0.01) { // Show ~1% of logs to avoid console spam
      if (data) {
        // console.log(`[Debug] ${message}`, data);
      } else {
        // console.log(`[Debug] ${message}`);
      }
    }
  };

  // --- Landmark Update Function ---
  const updateLandmarks = (landmarks) => {
    if (landmarks && landmarks.length > 0) {
        debugLog("Landmark update: Received valid landmarks", landmarks.length, true);
        setUserLandmarksForDrawing(landmarks);
        latestLandmarksRef.current = landmarks;
        lastLandmarkUpdateRef.current = Date.now();
    } else {
        debugLog("Landmark update: No valid landmarks received", null, true);
        setUserLandmarksForDrawing(null);
        latestLandmarksRef.current = null;
    }
  };

  // Modify the send interval to include the selected workout type
  useEffect(() => {
    // Mobile optimization: reduce send frequency to save battery (10 FPS vs 20 FPS)
    const sendIntervalDelay = isMobile ? 100 : 50;
    if (sendIntervalRef.current) { clearInterval(sendIntervalRef.current); }
    console.log(`[Data Send] Setting up interval to send data every ${sendIntervalDelay}ms`);
    sendIntervalRef.current = setInterval(() => {
      const landmarksToSend = latestLandmarksRef.current;
      const socketIsConnected = socketRef.current?.connected;
      
      // Log connection status regularly for debugging
      if (!socketRef.current) {
        console.warn('[Data Send] Socket ref is null');
      } else if (!socketIsConnected) {
        console.warn('[Data Send] Socket is not connected');
      }
      
      if (landmarksToSend && socketIsConnected) {
        const sendTimestamp = Date.now();
        // Send both landmarks and the selected workout type
        try {
          socketRef.current.emit('pose_data', { 
            landmarks: landmarksToSend, 
            timestamp: sendTimestamp,
            selected_workout: currentWorkout
          });
          
          // Log occasional send success (every 100 frames = ~5 seconds)
          if (Math.random() < 0.01) {
            console.log('[Data Send] Successfully sent frame data to server');
          }
        } catch (error) {
          console.error('[Data Send] Error sending data to server:', error);
        }
      } else if (!landmarksToSend && socketIsConnected) {
        console.warn('[Data Send] No landmarks to send');
      }
    }, sendIntervalDelay);

    return () => {
      if (sendIntervalRef.current) {
        console.log("[Data Send] Clearing send interval.");
        clearInterval(sendIntervalRef.current);
        sendIntervalRef.current = null;
      }
    };
  }, [currentWorkout, isMobile]); // Add currentWorkout and isMobile as dependencies

  // --- Correction Timeout Check ---
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

  // --- MediaPipe Results Callback ---
  function onResults(results) {
    const canvas = canvasRef.current;
    if (!canvas || !webcamRef.current) { return; }
    const ctx = canvas.getContext('2d');
    if (!ctx) { return; }
    
    const videoWidth = webcamRef.current.videoWidth;
    const videoHeight = webcamRef.current.videoHeight;
    if (videoWidth === 0 || videoHeight === 0) { return; }
    
    // Only resize canvas if dimensions change to avoid flicker
    if (canvas.width !== videoWidth) canvas.width = videoWidth;
    if (canvas.height !== videoHeight) canvas.height = videoHeight;

    // Clear entire canvas with proper settings
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.poseLandmarks) {
        const landmarks = results.poseLandmarks;
        updateLandmarks(landmarks); // Update ref and state

        // --- Drawing Logic ---
        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw skeleton first as the base layer
        drawUserPose(ctx, landmarks, canvas.width, canvas.height);

        // Get corrections and find joints to correct
        const currentCorrections = latestCorrectionsRef.current;
        
        // Only calculate joints to correct if we have valid corrections
        if (currentCorrections && Object.keys(currentCorrections).length > 0) {
            const jointsToCorrect = findJointsToCorrect(landmarks, currentCorrections);
            
            // Draw correction arrows if needed
            if (jointsToCorrect && jointsToCorrect.length > 0) {
                drawCorrectionArrows(ctx, landmarks, currentCorrections, jointsToCorrect, canvas.width, canvas.height);
            }
        }
    } else {
        updateLandmarks(null);
    }
    
    ctx.restore();
  }

  // Toggle dark mode function
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Dark Mode Setup
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

        // Get video natural dimensions and displayed dimensions
        const videoWidth = webcamRef.current.videoWidth;
        const videoHeight = webcamRef.current.videoHeight;
        const rect = webcamRef.current.getBoundingClientRect();

        if (videoWidth === 0 || videoHeight === 0) { return; }

        // Debug logging - log every time to diagnose the issue
        if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
            console.log('[Canvas Sizing]', {
                videoNatural: `${videoWidth}x${videoHeight}`,
                videoAspect: (videoWidth / videoHeight).toFixed(2),
                displaySize: `${rect.width.toFixed(0)}x${rect.height.toFixed(0)}`,
                displayAspect: (rect.width / rect.height).toFixed(2),
                isMobile,
                canvasWillBe: `${videoWidth}x${videoHeight}`
            });
        }

        // Set canvas to match video's natural dimensions
        // MediaPipe landmarks are normalized to video dimensions, not display size
        if (canvas.width !== videoWidth) canvas.width = videoWidth;
        if (canvas.height !== videoHeight) canvas.height = videoHeight;

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.poseLandmarks) {
            const landmarks = results.poseLandmarks;
            updateLandmarks(landmarks); // Update ref and state

            // --- Drawing Logic ---
            // Enable image smoothing for better quality
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Draw skeleton first as the base layer
            drawUserPose(ctx, landmarks, canvas.width, canvas.height);

            // Get corrections and find joints to correct
            const currentCorrections = latestCorrectionsRef.current;
            
            // Only calculate joints to correct if we have valid corrections
            if (currentCorrections && Object.keys(currentCorrections).length > 0) {
                const jointsToCorrect = findJointsToCorrect(landmarks, currentCorrections);
                
                // Draw correction arrows if needed
                if (jointsToCorrect && jointsToCorrect.length > 0) {
                    drawCorrectionArrows(ctx, landmarks, currentCorrections, jointsToCorrect, canvas.width, canvas.height);
                }
            }
        } else {
            updateLandmarks(null);
        }
        ctx.restore();
    }

    const startMediaPipe = async () => {
        if (typeof window === 'undefined' || !webcamRef.current) {
            console.log("[MediaPipe Setup] Aborted: window or webcamRef not ready.");
            return;
        }

        // Check if camera API is available (required for HTTPS or localhost)
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error("[MediaPipe Setup] Camera API not available. This typically happens when:");
            console.error("1. Using HTTP instead of HTTPS on mobile");
            console.error("2. Browser doesn't support getUserMedia");
            alert(
              "Camera access requires HTTPS.\n\n" +
              "Options:\n" +
              "• Use a browser that supports camera on this page\n" +
              "• Deploy with HTTPS\n" +
              "• Use localhost (desktop only)"
            );
            return;
        }
        console.log("[MediaPipe Setup] Initializing Pose...");
        const pose = new poseDetection.Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${poseDetection.VERSION}/${file}`
        });
        poseInstanceRef.current = pose;
        // Mobile optimization: use lite model (0) on mobile for better performance
        pose.setOptions({
          modelComplexity: isMobile ? 0 : 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: isMobile ? 0.6 : 0.5,
          minTrackingConfidence: isMobile ? 0.6 : 0.5
        });
        pose.onResults(onResults);

        initTimeoutId = setTimeout(async () => {
            try {
                console.log("[MediaPipe Setup] Attempting pose.initialize() after delay...");
                await pose.initialize();
                console.log("[MediaPipe Setup] Pose initialized successfully after delay.");
                if (!webcamRef.current) { 
                  console.warn("[MediaPipe Setup] Webcam ref null before camera setup."); 
                  return; 
                }
                console.log("[MediaPipe Setup] Setting up Camera...");
                // Smart camera resolution based on display aspect ratio
                const isPortrait = window.innerHeight > window.innerWidth;
                const isNarrow = window.innerWidth < 768;

                // Calculate target aspect ratio from display
                const displayAspect = window.innerWidth / window.innerHeight;

                // Choose camera resolution that best matches display aspect
                let cameraWidth, cameraHeight;
                if (isPortrait && isNarrow) {
                  // Mobile portrait: use 720x1280 (9:16)
                  cameraWidth = 720;
                  cameraHeight = 1280;
                } else if (displayAspect > 1.5) {
                  // Wide landscape (like iPad landscape): use 1280x720 (16:9)
                  cameraWidth = 1280;
                  cameraHeight = 720;
                } else {
                  // Standard landscape or square-ish: use 640x480 (4:3)
                  cameraWidth = 640;
                  cameraHeight = 480;
                }

                console.log('[Camera Config]', {
                  isPortrait,
                  isNarrow,
                  displayDimensions: `${window.innerWidth}x${window.innerHeight}`,
                  displayAspect: displayAspect.toFixed(2),
                  requestedRes: `${cameraWidth}x${cameraHeight}`,
                  requestedAspect: (cameraWidth / cameraHeight).toFixed(2)
                });

                const cameraConfig = {
                  onFrame: async () => {
                    if (poseInstanceRef.current && webcamRef.current) {
                      try {
                        await poseInstanceRef.current.send({ image: webcamRef.current });
                      }
                      catch (sendError) {
                        console.error("[MediaPipe onFrame] Error sending frame:", sendError);
                      }
                    }
                  },
                  width: cameraWidth,
                  height: cameraHeight
                };
                const camera = new Camera(webcamRef.current, cameraConfig);
                cameraInstanceRef.current = camera;
                await camera.start();
                console.log("[MediaPipe Setup] Camera started successfully.");
            } catch (initError) {
                console.error("[MediaPipe Setup] Error initializing MediaPipe Pose (after delay):", initError);
                if (poseInstanceRef.current) { 
                  poseInstanceRef.current.close(); 
                  poseInstanceRef.current = null; 
                }
                if (cameraInstanceRef.current) { 
                  cameraInstanceRef.current = null; 
                }
            }
        }, 100);
    };

    startMediaPipe();

    return () => {
        console.log("[MediaPipe Cleanup] Cleaning up...");
        if (initTimeoutId) { clearTimeout(initTimeoutId); }
        if (cameraInstanceRef.current) { 
          cameraInstanceRef.current.stop(); 
          cameraInstanceRef.current = null; 
        }
        if (poseInstanceRef.current) { 
          poseInstanceRef.current.close(); 
          poseInstanceRef.current = null; 
        }
    };
  }, []); // Empty dependency array

  // Function to toggle muscle visualizer
  const toggleMuscleVisualizer = () => {
    setShowMuscleVisualizer(!showMuscleVisualizer);
  };

  // Add this function to manually start a session on the backend
  const startSessionOnBackend = (clientId) => {
    // Skip session creation for guest users
    if (isGuestMode) {
      console.log('[Session] Skipping session creation for guest user');
      return;
    }

    // Make sure we're authenticated first
    if (!token) {
      console.log('[Session] Cannot start session - not authenticated');
      setConnectionStatus('disconnected');
      return;
    }
    
    console.log(`[Session] Starting backend session for client ID: ${clientId}`);
        
    // Convert workout map to a format with string keys for better JSON compatibility
    const stringWorkoutMap = {};
    Object.entries(workoutMap).forEach(([key, value]) => {
      stringWorkoutMap[key.toString()] = value;
    });
    
    // Use the currentWorkoutRef to ensure we have the most up-to-date value
    const currentWorkoutType = currentWorkoutRef.current;
    
    // Create session payload - now including the current workout type
    const sessionData = {
      client_id: clientId,
      workout_type: currentWorkoutType, // Use the current workout
      workout_map: stringWorkoutMap,
      platform: getPlatform()
    };
    
    console.log(`[Session] Using workout type ${currentWorkoutType} (${workoutMap[currentWorkoutType]}) for new session`);
    
    // Create the session
    usageService.startSession(sessionData)
    .then(data => {
      // Store session ID and start time
      setSessionId(data.session_id);
      setSessionStartTime(new Date(data.started));
      
      console.log(`[Session] Backend session started with ID: ${data.session_id}`);
      
      // Start timer to track session duration
      sessionDurationTimerRef.current = setInterval(() => {
        const now = new Date();
        const startTime = new Date(data.started);
        const durationSeconds = Math.floor((now - startTime) / 1000);
        setSessionDuration(durationSeconds);
        pendingStatsRef.current.sessionDuration = durationSeconds;
      }, 1000);
      
      // Also start a timer for periodic auto-updates
      // This ensures stats are periodically saved even if the user doesn't end the session properly
      lastAutoUpdateTimeRef.current = Date.now();
      
      // Set up auto-update every 60 seconds
      autoUpdateTimerRef.current = setInterval(() => {
        forceUpdateUsageStats();
      }, 60000); 
    })
    .catch(error => {
      console.error('[Session] Error starting backend session:', error);
      setConnectionStatus('disconnected');
    });
  };

  // Add this effect to update metrics periodically regardless of incoming data
  useEffect(() => {
    const updateInterval = setInterval(() => {
      // Update UI with latest values from refs
      setReceivedCount(receivedCountRef.current);
      
      // If we've had recent corrections, update the latency display
      const now = Date.now();
      if (lastCorrectionTimeRef.current > 0 && (now - lastCorrectionTimeRef.current < 5000)) {
        const estimatedLatency = lastCorrectionTimeRef.current - lastLandmarkUpdateRef.current;
        if (estimatedLatency > 0) {
          setFeedbackLatency(estimatedLatency);
        }
      }
    }, 1000); // Update every second
    
    return () => clearInterval(updateInterval);
  }, []);

  // Add CSS for the pulse effect
  // We'll add a style tag in the component since this is a specific effect we need
  useEffect(() => {
    // Add the CSS for the pulse effect
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      .pulse-success {
        animation: pulse-green 1s;
        background-color: #10b981 !important;
        opacity: 1 !important;
      }

      @keyframes pulse-green {
        0% {
          transform: scale(0.95);
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
        }
        
        70% {
          transform: scale(1.5);
          box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
        }
        
        100% {
          transform: scale(0.95);
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
        }
      }
    `;
    document.head.appendChild(styleEl);
    
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // Add useEffect for tracking session duration
  useEffect(() => {
    if (!sessionId || !sessionStartTime) return;
    
    console.log('[Session] Starting session duration timer');
    
    // Clear any existing timer
    if (sessionDurationTimerRef.current) {
      clearInterval(sessionDurationTimerRef.current);
    }
    
    if (autoUpdateTimerRef.current) {
      clearInterval(autoUpdateTimerRef.current);
    }
    
    // Start a timer to update the duration every second
    sessionDurationTimerRef.current = setInterval(() => {
      const durationInSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
      setSessionDuration(durationInSeconds);
      
      // Also update the pending stats ref with the latest duration
      pendingStatsRef.current.sessionDuration = durationInSeconds;
    }, 1000);
    
    return () => {
      console.log('[Session] Clearing session duration timer');
      if (sessionDurationTimerRef.current) {
        clearInterval(sessionDurationTimerRef.current);
        sessionDurationTimerRef.current = null;
      }
      if (autoUpdateTimerRef.current) {
        clearInterval(autoUpdateTimerRef.current);
        autoUpdateTimerRef.current = null;
      }
    };
  }, [sessionId, sessionStartTime]);

  // Add subscription check effect
  useEffect(() => {
    const checkSubscription = async () => {
      // Skip subscription check for guest users
      if (isGuestMode) {
        setHasSubscription(true);
        setIsLoadingSubscription(false);
        setShowCameraPermission(true); // Show camera permission modal for guests
        return;
      }

      if (!token) {
        setHasSubscription(false);
        setIsLoadingSubscription(false);
        return;
      }

      try {
        const response = await subscriptionService.getCurrentSubscription();
        if (response.status === 200) {
          const data = response.data;
          // Check if user has an active subscription
          setHasSubscription(data && data.is_active);
        } else {
          setHasSubscription(false);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setHasSubscription(false);
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    checkSubscription();
  }, [token, isGuestMode]);

  // Add navigation handlers
  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoToSubscription = () => {
    navigate('/settings?page=billing');
  };

  // Camera permission handlers
  const handleAcceptCamera = () => {
    setShowCameraPermission(false);
    // Camera will be accessed by MediaPipe automatically
  };

  const handleDeclineCamera = () => {
    setShowCameraPermission(false);
    navigate('/'); // Redirect to home if camera is declined
  };

  // Add useEffect to load last viewed exercise when component mounts
  useEffect(() => {
    // Skip for guest users - use default workout
    if (isGuestMode) {
      console.log('[LastViewed] Guest mode - using default workout (Plank)');
      setCurrentWorkout(12); // Default to plank
      return;
    }

    // Only fetch if user is authenticated
    if (token) {
      lastViewedExerciseService.getLastViewed()
        .then(response => {
          const data = response.data;
          if (data && data.workout_type !== null) {
            console.log(`[LastViewed] Found last viewed workout: ${data.workout_name} (type: ${data.workout_type})`);
            // Update both the state and ref
            setCurrentWorkout(data.workout_type);
            currentWorkoutRef.current = data.workout_type;
            // Also update the last stable workout ref for consistency
            lastStableWorkoutRef.current = data.workout_type;
          } else {
            console.log('[LastViewed] No last viewed workout found, using default (Plank)');
            // Set to default if no last viewed workout
            setCurrentWorkout(12); // Default to plank
          }
        })
        .catch(error => {
          console.error('[LastViewed] Error fetching last viewed exercise:', error);
          // Set to default on error
          setCurrentWorkout(12); // Default to plank
        });
    } else {
      // Not logged in, use default
      setCurrentWorkout(12);
    }
  }, [token, isGuestMode]);

  // Portrait orientation lock for mobile devices
  useEffect(() => {
    if (!isMobile) return;

    // Try to lock to portrait orientation
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('portrait-primary').catch(err => {
        console.log('[Orientation] Cannot lock to portrait:', err);
        // Graceful degradation - orientation lock not supported
        // The app will still work, just won't be locked
      });
    }

    return () => {
      // Unlock orientation when leaving the page or switching to desktop
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    };
  }, [isMobile]);

  // --- Render ---
  return (
    <motion.section
      className={`min-h-screen overflow-hidden ${
        isDarkMode
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900'
          : 'bg-gradient-to-br from-gray-100 via-gray-100 to-indigo-100'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hide navbar on mobile and when fullscreen */}
      {!isMobile && !isFullscreen && <NavBar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />}

      {/* Show camera permission modal for guest users */}
      <AnimatePresence>
        {showCameraPermission && (
          <CameraPermissionModal
            isDarkMode={isDarkMode}
            onAccept={handleAcceptCamera}
            onDecline={handleDeclineCamera}
          />
        )}
      </AnimatePresence>

      {/* Show subscription prompt if no subscription */}
      <AnimatePresence>
        {!isLoadingSubscription && !hasSubscription && (
          <SubscriptionPrompt
            isDarkMode={isDarkMode}
            onGoHome={handleGoHome}
            onGoToSubscription={handleGoToSubscription}
          />
        )}
      </AnimatePresence>
      
      {/* Conditional Layout: Mobile vs Desktop */}
      {isMobile ? (
        /* Mobile Layout */
        <MobileLayout
          // Workout data
          currentWorkout={currentWorkout}
          predictedWorkout={predictedWorkout}
          predictionConfidence={predictionConfidence}
          predictionThreshold={SUGGESTION_THRESHOLD}
          predictedMuscleGroup={predictedMuscleGroup}
          muscleGroupConfidence={muscleGroupConfidence}
          workoutMap={workoutMap}
          muscleGroupMap={muscleGroupMap}

          // Connection & Status
          connectionStatus={connectionStatus}
          isGuestMode={isGuestMode}
          sessionDuration={sessionDuration}
          receivedCount={receivedCount}
          feedbackLatency={feedbackLatency}
          pendingUpdates={pendingStatsRef.current ?
            pendingStatsRef.current.framesProcessed + pendingStatsRef.current.correctionsSent : 0}

          // Refs
          webcamRef={webcamRef}
          canvasRef={canvasRef}

          // UI State
          showMobileMenu={showMobileMenu}
          setShowMobileMenu={setShowMobileMenu}
          showWorkoutModal={showWorkoutModal}
          setShowWorkoutModal={setShowWorkoutModal}
          isDrawerOpen={isDrawerOpen}
          setIsDrawerOpen={setIsDrawerOpen}

          // Settings
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          showMuscleVisualizer={showMuscleVisualizer}
          toggleMuscleVisualizer={toggleMuscleVisualizer}

          // Actions
          handleWorkoutChange={handleWorkoutChange}
          forceUpdateUsageStats={forceUpdateUsageStats}

          // User
          user={user}
          handleLogout={handleLogout}

          // Notifications
          notifications={notifications}
          removeNotification={removeNotification}
          CustomNotification={CustomNotification}
        />
      ) : (
        /* Desktop Layout (existing) */
        <>
          {/* Custom Notifications Container */}
          <AnimatePresence>
            {notifications.length > 0 && (
              <motion.div
                className="fixed top-24 right-6 z-50 w-80 max-w-[90%]"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {notifications.map(notification => (
                  <CustomNotification
                    key={notification.id}
                    type={notification.type}
                    message={notification.message}
                    onClose={() => removeNotification(notification.id)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.main 
        className={`${isFullscreen ? 'h-screen' : 'container mx-auto px-4 py-4 sm:py-6 max-w-5xl'}`}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <motion.div 
          className={`${
            isFullscreen 
              ? 'fixed inset-0 bg-black m-0 p-0 max-w-none rounded-none' 
              : 'mx-auto bg-black/20 dark:bg-gray-800/30 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-white/10'
          }`}
          layout
          transition={{ duration: 0.4, type: 'spring', bounce: 0.2 }}
        >
          <div className={`relative ${
            isFullscreen ? 'w-screen h-screen' : 'aspect-video'
          }`}>
            <video
              ref={webcamRef}
              className="absolute top-0 left-0 w-full h-full object-cover"
              style={{ 
                transform: 'scaleX(-1)',
                borderRadius: isFullscreen ? '0' : undefined 
              }}
              autoPlay 
              muted 
              playsInline
            />
            
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
              style={{ 
                transform: 'scaleX(-1)',
                borderRadius: isFullscreen ? '0' : undefined 
              }}
            />
            
            {/* All UI controls positioned consistently */}
            <ConnectionStatus status={connectionStatus} />
            <FullscreenButton isFullscreen={isFullscreen} toggleFullscreen={toggleFullscreen} />

            {/* Guest Mode Indicator */}
            {isGuestMode && (
              <motion.div
                className="absolute top-4 right-48 z-40"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center space-x-2 bg-purple-600/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg border border-purple-500/30">
                  <UserCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">Guest Mode</span>
                </div>
              </motion.div>
            )}
            
            {/* WorkoutSelector always in same position */}
            <div className="absolute top-4 left-16 z-40">
              {currentWorkout !== null ? (
                <WorkoutSelector 
                  selectedWorkout={currentWorkout} 
                  onSelectWorkout={handleWorkoutChange} 
                />
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="flex items-center space-x-2 bg-black/40 text-white px-4 py-2 rounded-lg shadow-md backdrop-blur-sm border border-gray-600/30"
                >
                  <span>Loading workout...</span>
                  <div className="w-4 h-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
                </motion.div>
              )}
            </div>
            
            <MuscleGroupVisualizer 
              isVisible={showMuscleVisualizer} 
              muscleGroup={predictedMuscleGroup} 
            />
            
            <MuscleVisualizerToggle 
              isVisible={showMuscleVisualizer} 
              toggleVisibility={toggleMuscleVisualizer} 
            />
            
            {/* InfoPanel moved inside video container with consistent positioning */}
            <div className="absolute bottom-4 left-0 right-0 mx-auto max-w-xl px-4">
              {currentWorkout !== null ? (
                <InfoPanel 
                  currentWorkout={currentWorkout}
                  predictedWorkout={predictedWorkout}
                  predictionConfidence={predictionConfidence}
                  predictionThreshold={SUGGESTION_THRESHOLD}
                  predictedMuscleGroup={predictedMuscleGroup}
                  muscleGroupConfidence={muscleGroupConfidence}
                  feedbackLatency={feedbackLatency}
                  receivedCount={receivedCount}
                  connectionStatus={connectionStatus}
                  onForceUpdate={forceUpdateUsageStats}
                  pendingUpdates={pendingStatsRef.current ? 
                    pendingStatsRef.current.framesProcessed + pendingStatsRef.current.correctionsSent : 0}
                  sessionDuration={sessionDuration}
                />
              ) : (
                <motion.div 
                  className="bg-black/60 text-white px-5 py-3 rounded-xl backdrop-blur-md border border-white/10 shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-sm font-medium opacity-70">Loading your last workout...</span>
                      <div className="ml-2 w-4 h-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.main>
        </>
      )}
    </motion.section>
  );
};

export default TrainingPage;

// Add Camera Permission Modal component
const CameraPermissionModal = ({ isDarkMode, onAccept, onDecline }) => {
  const githubRepoUrl = "https://github.com/dongyiu/DesD_AI_pathway"; // Update with your actual repo URL

  return (
    <motion.div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        isDarkMode ? 'bg-black/80' : 'bg-white/80'
      } backdrop-blur-sm`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={`${
          isDarkMode
            ? 'bg-gray-800 border border-white/10'
            : 'bg-white border border-gray-200'
        } rounded-xl p-6 max-w-lg w-full shadow-xl`}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="text-center mb-6">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
          }`}>
            <Eye className={`w-8 h-8 ${
              isDarkMode ? 'text-purple-400' : 'text-purple-600'
            }`} />
          </div>
          <h2 className={`text-2xl font-semibold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Camera Access Required
          </h2>
          <p className={`text-sm mb-4 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            We need access to your camera to track your workout form in real-time.
          </p>
        </div>

        <div className={`p-4 rounded-lg mb-6 ${
          isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
        }`}>
          <h3 className={`font-semibold mb-2 flex items-center ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            <Info className="w-4 h-4 mr-2" />
            Privacy & Security
          </h3>
          <ul className={`text-sm space-y-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <li className="flex items-start">
              <Check className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
              <span><strong>No video storage:</strong> We do not record, store, or save any video data from your camera.</span>
            </li>
            <li className="flex items-start">
              <Check className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
              <span><strong>Real-time processing:</strong> All pose detection happens locally in your browser.</span>
            </li>
            <li className="flex items-start">
              <Check className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
              <span><strong>Open source:</strong> Our code is publicly available on{' '}
                <a
                  href={githubRepoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`underline ${
                    isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
                  }`}
                >
                  GitHub
                </a> for transparency.
              </span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDecline}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            }`}
          >
            Decline
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAccept}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium ${
              isDarkMode
                ? 'bg-purple-600 hover:bg-purple-500 text-white'
                : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
          >
            Allow Camera Access
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Add new SubscriptionPrompt component
const SubscriptionPrompt = ({ isDarkMode, onGoHome, onGoToSubscription }) => {
  return (
    <motion.div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        isDarkMode ? 'bg-black/80' : 'bg-white/80'
      } backdrop-blur-sm`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className={`${
          isDarkMode 
            ? 'bg-gray-800 border border-white/10' 
            : 'bg-white border border-gray-200'
        } rounded-xl p-6 max-w-md w-full shadow-xl`}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="text-center mb-6">
          <AlertTriangle className={`w-12 h-12 mx-auto mb-4 ${
            isDarkMode ? 'text-yellow-400' : 'text-yellow-500'
          }`} />
          <h2 className={`text-xl font-semibold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Subscription Required
          </h2>
          <p className={`${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            You need an active subscription to access the workout features. Please subscribe to continue.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGoHome}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            }`}
          >
            Go to Home
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGoToSubscription}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium ${
              isDarkMode 
                ? 'bg-purple-600 hover:bg-purple-500 text-white' 
                : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
          >
            View Subscriptions
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Helper function to get a platform name that fits in the database field length
const getPlatform = () => {
  // Extract just the platform or browser name, limited to 50 chars
  if (navigator.platform) {
    return navigator.platform.substring(0, 50);
  } else if (navigator.userAgentData && navigator.userAgentData.platform) {
    return navigator.userAgentData.platform.substring(0, 50);
  } else {
    // Simple browser detection as fallback
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Web';
  }
};