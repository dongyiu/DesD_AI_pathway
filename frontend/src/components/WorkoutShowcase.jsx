import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import io from 'socket.io-client';
import { POSE_CONNECTIONS } from '@mediapipe/pose';
import Model from 'react-body-highlighter';
import { MuscleType, ModelType } from 'react-body-highlighter';
import { AI_URL } from '../config';
import { generateShoulderPressPose } from '../utils/syntheticPoseGenerator';
import { Activity, Zap, Play, Pause, RotateCcw, Github } from 'lucide-react';

/**
 * Drawing utility functions
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
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
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
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  });
};

const getArrowColor = (distance) => {
  if (distance < 0.05) return '#eab308';
  else if (distance < 0.1) return '#f97316';
  else return '#ef4444';
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

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();

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
 * Workout Showcase Component
 * Large demo with muscle visualization and AI detection
 */
const WorkoutShowcase = ({ isDarkMode = false, navigate, continueAsGuest }) => {
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const frameRef = useRef(0);
  const animationFrameRef = useRef(null);
  const sendIntervalRef = useRef(null);

  const [corrections, setCorrections] = useState({});
  const [detectedWorkout, setDetectedWorkout] = useState('Shoulder Press');
  const [muscleGroup, setMuscleGroup] = useState(1); // Shoulders
  const [isPlaying, setIsPlaying] = useState(true);

  // Drawing loop
  const draw = (landmarks, currentCorrections) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
    const landmarks = generateShoulderPressPose(frameRef.current);
    draw(landmarks, corrections);
    frameRef.current++;
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    frameRef.current = 0;
    setCorrections({});
  };

  const handleTryAsGuest = () => {
    if (continueAsGuest) {
      continueAsGuest();
    }
    if (navigate) {
      navigate('/workout');
    }
  };

  const handleGitHub = () => {
    window.open('https://github.com/dongyiu/DesD_AI_pathway', '_blank');
  };

  // WebSocket setup
  useEffect(() => {
    socketRef.current = io(AI_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ['websocket'],
      auth: { guest: true }
    });

    socketRef.current.on('pose_corrections', (data) => {
      if (data.corrections && Object.keys(data.corrections).length > 0) {
        setCorrections(data.corrections);
      }
      if (data.predicted_workout_type !== undefined) {
        // Update detected workout (would map from ID to name)
        setDetectedWorkout('Shoulder Press');
      }
      if (data.predicted_muscle_group !== undefined) {
        setMuscleGroup(data.predicted_muscle_group);
      }
    });

    // Send pose data every 50ms
    sendIntervalRef.current = setInterval(() => {
      if (socketRef.current?.connected) {
        const landmarks = generateShoulderPressPose(frameRef.current);
        socketRef.current.emit('pose_data', {
          landmarks,
          timestamp: Date.now(),
          selected_workout: 17 // Shoulder Press
        });
      }
    }, 50);

    return () => {
      if (sendIntervalRef.current) clearInterval(sendIntervalRef.current);
      if (socketRef.current) socketRef.current.disconnect();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Start animation
  useEffect(() => {
    if (isPlaying) {
      animate();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, corrections, isDarkMode]);

  // Muscle data for shoulder press
  const muscleData = [
    { name: 'Shoulder Press', muscles: [MuscleType.BACK_DELTOIDS, MuscleType.FRONT_DELTOIDS, MuscleType.TRICEPS] }
  ];

  return (
    <div className="relative w-full max-w-7xl mx-auto">
      {/* Main Canvas Container */}
      <div className={`relative ${isDarkMode ? 'bg-gray-800/90' : 'bg-white/90'} rounded-2xl overflow-hidden shadow-2xl border ${isDarkMode ? 'border-white/20' : 'border-gray-300'}`}>
        {/* Canvas - Responsive height */}
        <canvas
          ref={canvasRef}
          width={1200}
          height={600}
          className="w-full h-auto max-h-[400px] md:max-h-none"
        />

        {/* Detected Workout Badge */}
        <motion.div
          className="absolute top-3 left-3 sm:top-6 sm:left-6 z-40"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className={`${
            isDarkMode ? 'bg-purple-600/90' : 'bg-purple-600'
          } backdrop-blur-sm text-white px-2.5 py-1 sm:px-4 sm:py-2 rounded-lg shadow-lg flex items-center space-x-1.5 sm:space-x-2`}>
            <Activity className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-base font-semibold">{detectedWorkout}</span>
          </div>
        </motion.div>

        {/* CTA Buttons - Center on desktop, hidden on mobile */}
        <div className="hidden md:flex absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 flex-row gap-4">
          <motion.button
            onClick={handleTryAsGuest}
            className={`bg-gradient-to-r ${isDarkMode ? 'from-purple-500 to-indigo-600' : 'from-indigo-500 to-purple-600'} text-white font-semibold py-4 px-8 rounded-lg shadow-xl hover:shadow-2xl transition duration-300 flex items-center justify-center space-x-2 text-lg`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play className="w-5 h-5" />
            <span>Try as Guest</span>
          </motion.button>

          <motion.button
            onClick={handleGitHub}
            className={`bg-transparent ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white border-white/30' : 'bg-black/5 hover:bg-black/10 text-gray-800 border-gray-400'} font-semibold py-4 px-8 rounded-lg border-2 shadow-xl hover:shadow-2xl transition duration-300 flex items-center justify-center space-x-2 text-lg backdrop-blur-sm`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Github className="w-5 h-5" />
            <span>View on GitHub</span>
          </motion.button>
        </div>

        {/* Small Controls - Bottom Right (desktop only) */}
        <div className="hidden md:flex absolute bottom-4 right-4 z-40 space-x-2">
          <motion.button
            onClick={handlePlayPause}
            className={`${
              isDarkMode ? 'bg-purple-600/80 hover:bg-purple-700' : 'bg-indigo-600/80 hover:bg-indigo-700'
            } text-white p-2 rounded-lg shadow-lg backdrop-blur-sm`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </motion.button>

          <motion.button
            onClick={handleReset}
            className={`${
              isDarkMode ? 'bg-gray-700/80 hover:bg-gray-600' : 'bg-gray-200/80 hover:bg-gray-300'
            } ${isDarkMode ? 'text-white' : 'text-gray-800'} p-2 rounded-lg shadow-lg backdrop-blur-sm`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Muscle Group Visualizers */}
        {/* Front view - Left side */}
        <motion.div
          className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-30 pointer-events-none w-[70px] sm:w-[100px] md:w-[150px]"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Model
            data={muscleData}
            type={ModelType.ANTERIOR}
            highlightedColors={['#a855f7']}
            onClick={() => {}}
          />
        </motion.div>

        {/* Back view - Right side */}
        <motion.div
          className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 pointer-events-none w-[70px] sm:w-[100px] md:w-[150px]"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Model
            data={muscleData}
            type={ModelType.POSTERIOR}
            highlightedColors={['#a855f7']}
            onClick={() => {}}
          />
        </motion.div>
      </div>

      {/* CTA Buttons - Below canvas on mobile only */}
      <div className="md:hidden flex flex-col gap-3 mt-4 px-4">
        <motion.button
          onClick={handleTryAsGuest}
          className={`bg-gradient-to-r ${isDarkMode ? 'from-purple-500 to-indigo-600' : 'from-indigo-500 to-purple-600'} text-white font-semibold py-3 px-6 rounded-lg shadow-xl hover:shadow-2xl transition duration-300 flex items-center justify-center space-x-2 text-base w-full`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Play className="w-4 h-4" />
          <span>Try as Guest</span>
        </motion.button>

        <motion.button
          onClick={handleGitHub}
          className={`bg-transparent ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white border-white/30' : 'bg-black/5 hover:bg-black/10 text-gray-800 border-gray-400'} font-semibold py-3 px-6 rounded-lg border-2 shadow-xl hover:shadow-2xl transition duration-300 flex items-center justify-center space-x-2 text-base backdrop-blur-sm w-full`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Github className="w-4 h-4" />
          <span>View on GitHub</span>
        </motion.button>

        {/* Mobile Controls */}
        <div className="flex justify-center space-x-2 mt-1">
          <motion.button
            onClick={handlePlayPause}
            className={`${
              isDarkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white p-2.5 rounded-lg shadow-lg`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </motion.button>

          <motion.button
            onClick={handleReset}
            className={`${
              isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            } ${isDarkMode ? 'text-white' : 'text-gray-800'} p-2.5 rounded-lg shadow-lg`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Feature Labels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <motion.div
          className={`${isDarkMode ? 'bg-gray-800/60' : 'bg-white'} p-4 rounded-lg border ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h4 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Real-Time Corrections
          </h4>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Visual arrows show exactly how to fix your form
          </p>
        </motion.div>

        <motion.div
          className={`${isDarkMode ? 'bg-gray-800/60' : 'bg-white'} p-4 rounded-lg border ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h4 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Auto Detection
          </h4>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            AI automatically recognizes your exercise
          </p>
        </motion.div>

        <motion.div
          className={`${isDarkMode ? 'bg-gray-800/60' : 'bg-white'} p-4 rounded-lg border ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h4 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Muscle Tracking
          </h4>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            See which muscles you're working in real-time
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default WorkoutShowcase;
