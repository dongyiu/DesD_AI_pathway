import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import io from 'socket.io-client';
import { POSE_CONNECTIONS } from '@mediapipe/pose';
import { AI_URL } from '../config';
import { generatePlankPose, generatePushUpPose, generateSquatPose, generateShoulderPressPose } from '../utils/syntheticPoseGenerator';
import { Play, Pause, RotateCcw } from 'lucide-react';

/**
 * Drawing utility functions (extracted from WorkoutPage)
 */

const drawUserPose = (ctx, landmarks, canvasWidth, canvasHeight) => {
  if (!landmarks) return;

  // Draw joints (dots)
  for (let i = 11; i < landmarks.length; i++) {
    const landmark = landmarks[i];
    if (!landmark || landmark.x == null || landmark.y == null) continue;
    const x = landmark.x * canvasWidth;
    const y = landmark.y * canvasHeight;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#8b5cf6';
    ctx.fill();
  }

  // Draw connections (lines)
  POSE_CONNECTIONS.forEach(([i, j]) => {
    if (i >= 11 && j >= 11 && i < landmarks.length && j < landmarks.length) {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      if (!p1 || !p2 || p1.x == null || p1.y == null || p2.x == null || p2.y == null) return;
      ctx.beginPath();
      ctx.moveTo(p1.x * canvasWidth, p1.y * canvasHeight);
      ctx.lineTo(p2.x * canvasWidth, p2.y * canvasHeight);
      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
};

const getArrowColor = (distance) => {
  if (distance < 0.05) return '#eab308'; // yellow
  else if (distance < 0.1) return '#f97316'; // orange
  else return '#ef4444'; // red
};

const drawArrow = (ctx, fromX, fromY, toX, toY, color, lineWidth) => {
  fromX = Math.round(fromX);
  fromY = Math.round(fromY);
  toX = Math.round(toX);
  toY = Math.round(toY);

  const headLength = 15;
  const dx = toX - fromX;
  const dy = toY - fromY;

  const magnitude = Math.sqrt(dx * dx + dy * dy);
  if (magnitude < 5) return;

  const angle = Math.atan2(dy, dx);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw arrow shaft
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  // Draw arrowhead
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

  ctx.restore();
};

const drawCorrectionArrows = (ctx, landmarks, corrections, canvasWidth, canvasHeight) => {
  if (!landmarks || !corrections || Object.keys(corrections).length === 0) return;

  ctx.globalCompositeOperation = 'source-over';

  Object.keys(corrections).forEach(indexStr => {
    const i = parseInt(indexStr);
    if (!landmarks[i] || landmarks[i].x == null || landmarks[i].y == null) return;

    const originalX = landmarks[i].x * canvasWidth;
    const originalY = landmarks[i].y * canvasHeight;

    const correction = corrections[indexStr];
    if (!correction || correction.x == null || correction.y == null) return;

    const vectorX = correction.x * canvasWidth;
    const vectorY = correction.y * canvasHeight;

    const magnitude = Math.sqrt(vectorX * vectorX + vectorY * vectorY);
    if (magnitude < 2) return;

    const extendedTargetX = originalX + vectorX * 1.5;
    const extendedTargetY = originalY + vectorY * 1.5;

    const correctionMagnitude = Math.sqrt(correction.x * correction.x + correction.y * correction.y);
    const arrowColor = getArrowColor(correctionMagnitude);

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

  ctx.globalCompositeOperation = 'source-over';
};

/**
 * Feature Demo Component
 * Demonstrates pose correction with synthetic data and real AI backend
 */
const FeatureDemo = ({ exercise = 'plank', isDarkMode = false, autoPlay = true }) => {
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const frameRef = useRef(0);
  const animationFrameRef = useRef(null);
  const sendIntervalRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [corrections, setCorrections] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [correctionCount, setCorrectionCount] = useState(0);

  // Choose pose generator based on exercise prop
  const getPoseGenerator = () => {
    switch (exercise) {
      case 'pushup':
        return generatePushUpPose;
      case 'squat':
        return generateSquatPose;
      case 'shoulderpress':
        return generateShoulderPressPose;
      case 'plank':
      default:
        return generatePlankPose;
    }
  };

  // Get workout ID for backend
  const getWorkoutId = () => {
    switch (exercise) {
      case 'pushup':
        return 14; // Push Ups
      case 'squat':
        return 18; // Squat
      case 'shoulderpress':
        return 17; // Shoulder Press
      case 'plank':
      default:
        return 12; // Plank
    }
  };

  // Drawing loop
  const draw = (landmarks, currentCorrections) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = isDarkMode ? '#1f2937' : '#f3f4f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw skeleton
    drawUserPose(ctx, landmarks, canvas.width, canvas.height);

    // Draw correction arrows
    drawCorrectionArrows(ctx, landmarks, currentCorrections, canvas.width, canvas.height);
  };

  // Animation loop
  const animate = () => {
    if (!isPlaying) return;

    const poseGenerator = getPoseGenerator();
    const landmarks = poseGenerator(frameRef.current);

    draw(landmarks, corrections);

    frameRef.current++;
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // WebSocket setup
  useEffect(() => {
    // Connect to WebSocket
    console.log('[FeatureDemo] Connecting to AI backend:', AI_URL);
    setConnectionStatus('connecting');

    socketRef.current = io(AI_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ['websocket'],
      auth: { guest: true } // Guest mode for demo
    });

    socketRef.current.on('connect', () => {
      console.log('[FeatureDemo] Connected to AI backend');
      setConnectionStatus('connected');
    });

    socketRef.current.on('disconnect', () => {
      console.log('[FeatureDemo] Disconnected from AI backend');
      setConnectionStatus('disconnected');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('[FeatureDemo] Connection error:', error);
      setConnectionStatus('error');
    });

    // Listen for corrections
    socketRef.current.on('pose_corrections', (data) => {
      if (data.corrections && Object.keys(data.corrections).length > 0) {
        setCorrections(data.corrections);
        setCorrectionCount(prev => prev + 1);
      }
    });

    // Send pose data every 50ms
    sendIntervalRef.current = setInterval(() => {
      if (socketRef.current?.connected && isPlaying) {
        const poseGenerator = getPoseGenerator();
        const landmarks = poseGenerator(frameRef.current);

        socketRef.current.emit('pose_data', {
          landmarks,
          timestamp: Date.now(),
          selected_workout: getWorkoutId()
        });
      }
    }, 50);

    return () => {
      if (sendIntervalRef.current) {
        clearInterval(sendIntervalRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [exercise]);

  // Start/stop animation based on isPlaying
  useEffect(() => {
    if (isPlaying) {
      animate();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, corrections, isDarkMode]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    frameRef.current = 0;
    setCorrections({});
    setCorrectionCount(0);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'error':
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={`relative ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden shadow-lg`}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="w-full h-auto"
      />

      {/* Controls Overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
        {/* Play/Pause and Reset */}
        <div className="flex space-x-2">
          <motion.button
            onClick={handlePlayPause}
            className={`${
              isDarkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white p-2 rounded-lg shadow-lg`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </motion.button>

          <motion.button
            onClick={handleReset}
            className={`${
              isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            } ${isDarkMode ? 'text-white' : 'text-gray-800'} p-2 rounded-lg shadow-lg`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RotateCcw className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Status Info */}
        <div className={`${
          isDarkMode ? 'bg-black/60' : 'bg-white/80'
        } backdrop-blur-sm rounded-lg px-3 py-2 flex items-center space-x-2`}>
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
          <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {connectionStatus}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FeatureDemo;
