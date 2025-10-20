import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Play, Zap, Activity, Eye, Github } from 'lucide-react';
import NavBar from '../components/Navbar';
import WorkoutShowcase from '../components/WorkoutShowcase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const Hero = ({ isDarkMode, navigate, isGuestMode }) => {
  return (
    <section className={`pt-32 pb-16 bg-gradient-to-br ${isDarkMode ? 'from-gray-900 via-gray-800 to-indigo-900' : 'from-indigo-50 via-white to-indigo-100'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.h1
            className={`text-5xl sm:text-6xl md:text-7xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6 leading-tight`}
            variants={fadeIn}
          >
            AI-Powered <span className={`${isDarkMode ? 'text-purple-400' : 'text-indigo-600'}`}>Form Correction</span>
          </motion.h1>

          <motion.p
            className={`text-xl md:text-2xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto mb-10 leading-relaxed`}
            variants={fadeIn}
          >
            Real-time workout tracking with AI-powered pose detection and instant feedback
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row justify-center gap-4 mb-16"
            variants={fadeIn}
          >
            <motion.button
              className={`bg-gradient-to-r ${isDarkMode ? 'from-purple-500 to-indigo-600' : 'from-indigo-500 to-purple-600'} text-white font-medium py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transition duration-300 flex items-center justify-center space-x-2 text-lg`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/workout')}
            >
              <span>{isGuestMode ? 'Continue Training' : 'Start Training'}</span>
              <ArrowRight size={20} />
            </motion.button>

            <motion.button
              className={`bg-transparent ${isDarkMode ? 'hover:bg-white/10 text-white border-white/30' : 'hover:bg-indigo-50 text-indigo-600 border-indigo-200'} font-medium py-4 px-8 rounded-lg border-2 transition duration-300 flex items-center justify-center space-x-2 text-lg`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.open('https://youtu.be/b1T-nO1Q60M', '_blank')}
            >
              <Play size={20} />
              <span>Watch Demo</span>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const LiveDemo = ({ isDarkMode }) => {
  return (
    <section id="demo" className={`py-24 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          <motion.h2
            className={`text-4xl md:text-5xl font-bold text-center ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}
            variants={fadeIn}
          >
            See It In Action
          </motion.h2>

          <motion.p
            className={`text-lg md:text-xl text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto mb-16`}
            variants={fadeIn}
          >
            Watch our AI analyze form in real-time and provide instant corrections
          </motion.p>

          <motion.div
            variants={fadeIn}
          >
            <WorkoutShowcase isDarkMode={isDarkMode} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const FeatureHighlights = ({ isDarkMode }) => {
  const highlights = [
    {
      icon: <Activity className="w-8 h-8" />,
      title: "22+ Exercises",
      description: "From planks to squats to deadlifts"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Feedback",
      description: "Get corrections in real-time"
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: "Privacy First",
      description: "No video recording or storage"
    }
  ];

  return (
    <section className={`py-16 ${isDarkMode ? 'bg-gray-800/50' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {highlights.map((highlight, index) => (
            <motion.div
              key={index}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={`${isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-indigo-100 text-indigo-600'} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                {highlight.icon}
              </div>
              <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                {highlight.title}
              </h3>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {highlight.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = ({ isDarkMode }) => {
  return (
    <footer className={`${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-900 text-white'} py-12`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-semibold mb-2">GymTracker</h3>
            <p className="text-gray-400">AI-Powered Fitness Training</p>
          </div>

          <div className="flex items-center space-x-6">
            <a
              href="https://github.com/dongyiu/DesD_AI_pathway"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-400 hover:text-purple-400 transition"
            >
              <Github className="w-5 h-5" />
              <span>Open Source</span>
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
          <p>&copy; 2025 GymTracker. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { isGuestMode } = useAuth();

  // Check system preference on initial load
  useEffect(() => {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDarkMode);
  }, []);

  // Update dark mode class on body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`min-h-screen ${
      isDarkMode ? 'bg-gradient-to-br from-gray-900 to-indigo-900 text-white' : 'bg-gradient-to-br from-white to-indigo-100 text-gray-900'
    }`}>
      <NavBar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      <main>
        <Hero isDarkMode={isDarkMode} navigate={navigate} isGuestMode={isGuestMode} />
        <LiveDemo isDarkMode={isDarkMode} />
        <FeatureHighlights isDarkMode={isDarkMode} />
      </main>
      <Footer isDarkMode={isDarkMode} />
    </div>
  );
};

export default HomePage;
