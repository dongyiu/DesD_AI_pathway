import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Users, 
  Settings, 
  LogOut, 
  Sun,
  Moon,
  Bell,
  Menu,
  X,
  User,
  MessageSquare,
  FileText,
  ArrowRight,
  Play,
  CheckCircle,
  ChevronRight,
  Star,
  Dumbbell
} from 'lucide-react';
import NavBar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

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

const Hero = ({ isDarkMode }) => {
  return (
    <section className={`pt-32 pb-24 bg-gradient-to-br ${isDarkMode ? 'from-gray-900 via-gray-800 to-indigo-900' : 'from-indigo-50 via-white to-indigo-100'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.h1 
            className={`text-4xl sm:text-5xl md:text-6xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6 leading-tight`}
            variants={fadeIn}
          >
            Transform Your Workouts <span className={`${isDarkMode ? 'text-purple-400' : 'text-indigo-600'}`}>With AI</span>
          </motion.h1>
          
          <motion.p 
            className={`text-lg md:text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto mb-10 leading-relaxed`}
            variants={fadeIn}
          >
            GymTracker uses advanced artificial intelligence to track your form, provide real-time feedback, and optimise your fitness journey like never before.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row justify-center gap-4 mb-16"
            variants={fadeIn}
          >
            <motion.button 
              className={`bg-gradient-to-r ${isDarkMode ? 'from-purple-500 to-indigo-600' : 'from-indigo-500 to-purple-600'} text-white font-medium py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition duration-300 flex items-center justify-center space-x-2`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Get Started</span>
              <ArrowRight size={18} />
            </motion.button>
            
            <motion.button 
              className={`bg-transparent ${isDarkMode ? 'hover:bg-white/10 text-white border-white/30' : 'hover:bg-indigo-50 text-indigo-600 border-indigo-200'} font-medium py-3 px-8 rounded-lg border transition duration-300 flex items-center justify-center space-x-2`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play size={18} />
              <span>Watch Demo</span>
            </motion.button>
          </motion.div>
          
          <motion.div 
            className="max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl"
            variants={fadeIn}
            whileHover={{ y: -5 }}
          >
            <img 
              src="https://cdn.midjourney.com/c54c6344-3536-40cc-bce3-8257b728d23d/0_3.png" 
              alt="GymTracker App Demo" 
              className="w-full h-auto"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const Features = ({ isDarkMode }) => {
  const FeatureCard = ({ icon, title, description }) => {
    return (
      <motion.div 
        className={`${isDarkMode ? 'bg-gray-800/60 backdrop-blur-md border border-white/5' : 'bg-white/90 backdrop-blur-md border border-gray-100'} rounded-xl p-8 shadow-lg hover:shadow-xl transition duration-300 h-64 flex flex-col`}
        whileHover={{ y: -8, scale: 1.02 }}
      >
        <div className={`${isDarkMode ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600'} text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3 text-center`}>{title}</h3>
        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-center flex-grow`}>{description}</p>
      </motion.div>
    );
  };
  
  const features = [
    {
      icon: "🔍",
      title: "Activity Recognition",
      description: "Start exercising and let our AI do its bit to recognise the exercise."
    },
    {
      icon: "💪",
      title: "Pinpoint Muscle Activation",
      description: "See how each muscle group is activated during your exercise."
    },
    {
      icon: "👁️",
      title: "AI Form Analysis",
      description: "Our computer vision technology analyzes your exercise form in real-time, helping prevent injuries and maximise results."
    },
    {
      icon: "🔄",
      title: "Real-Time Adjustments",
      description: "Receive instant feedback and suggestions to optimise your workout as you exercise."
    },
    {
      icon: "📊",
      title: "Smart Progress Tracking",
      description: "Track your progress with detailed metrics, personalised insights, and adaptive recommendations."
    },
    {
      icon: "🎯",
      title: "Hit Targets",
      description: "Aim high using our metrics to boost your development as you please."
    }
  ];

  return (
    <section id="features" className={`py-24 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          <motion.h2 
            className={`text-4xl font-bold text-center ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}
            variants={fadeIn}
          >
            Intelligent Features
          </motion.h2>
          
          <motion.p 
            className={`text-lg text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto mb-16`}
            variants={fadeIn}
          >
            Our AI-powered platform delivers a comprehensive fitness experience
          </motion.p>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeIn}>
                <FeatureCard 
                  icon={feature.icon} 
                  title={feature.title} 
                  description={feature.description} 
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const Step = ({ isDarkMode, number, title, description }) => {
  return (
    <motion.div 
      className="flex flex-col md:flex-row items-center gap-6 mb-16"
      whileHover={{ x: 5 }}
    >
      <motion.div 
        className={`${isDarkMode ? 'bg-purple-500 text-white' : 'bg-indigo-500 text-white'} w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-lg`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {number}
      </motion.div>
      <div>
        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>{title}</h3>
        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{description}</p>
      </div>
    </motion.div>
  );
};

const HowItWorks = ({ isDarkMode }) => {
  const steps = [
    {
      number: "1",
      title: "Set Up Your Profile",
      description: "Create your profile, set your fitness goals, and tell us about your experience level and available equipment."
    },
    {
      number: "2",
      title: "Position Your Device",
      description: "Place your phone or tablet where it can see you perform exercises. Our AI will guide you on optimal camera placement."
    },
    {
      number: "3",
      title: "Start Your Workout",
      description: "Begin your workout session with real-time form analysis, rep counting, and personalized guidance from our AI coach."
    },
    {
      number: "4",
      title: "Track Your Progress",
      description: "Review your performance, see your improvement over time, and receive AI-generated recommendations for future workouts."
    }
  ];

  return (
    <section id="how-it-works" className={`py-24 ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-sm' : 'bg-white/50 backdrop-blur-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          <motion.h2 
            className={`text-4xl font-bold text-center ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}
            variants={fadeIn}
          >
            How It Works
          </motion.h2>
          
          <motion.p 
            className={`text-lg text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto mb-16`}
            variants={fadeIn}
          >
            Getting started with GymTracker is quick and easy
          </motion.p>
          
          <motion.div 
            className="max-w-3xl mx-auto bg-gradient-to-b from-transparent to-transparent p-8 rounded-2xl"
            variants={staggerContainer}
          >
            {steps.map((step, index) => (
              <motion.div key={index} variants={fadeIn}>
                <Step 
                  isDarkMode={isDarkMode}
                  number={step.number} 
                  title={step.title} 
                  description={step.description} 
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const TestimonialCard = ({ isDarkMode, quote, name, achievement, avatarUrl }) => {
  return (
    <motion.div 
      className={`${isDarkMode ? 'bg-gray-800/60 backdrop-blur-md border border-white/5' : 'bg-white/90 backdrop-blur-md border border-gray-100'} rounded-xl p-6 shadow-lg`}
      whileHover={{ y: -8, scale: 1.02 }}
    >
      <div className={`${isDarkMode ? 'text-purple-400' : 'text-indigo-500'} text-5xl font-serif mb-3`}>"</div>
      <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} italic mb-6`}>{quote}</p>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${isDarkMode ? 'border-purple-500' : 'border-indigo-500'}`}>
          <img src={avatarUrl} alt={`${name}'s avatar`} className="w-full h-full object-cover" />
        </div>
        <div>
          <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{name}</h4>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>{achievement}</p>
        </div>
      </div>
    </motion.div>
  );
};

const Testimonials = ({ isDarkMode }) => {
  const testimonials = [
    {
      quote: "I've tried many fitness apps, but GymTracker is in a league of its own. The form feedback helped me correct issues I didn't even know I had.",
      name: "Sarah Johnson",
      achievement: "Lost 15 lbs in 3 months",
      avatarUrl: "/api/placeholder/50/50"
    },
    {
      quote: "As a personal trainer, I recommend GymTracker to all my clients for their solo sessions. It's like having me there when I can't be.",
      name: "Mike Williams",
      achievement: "Certified Personal Trainer",
      avatarUrl: "/api/placeholder/50/50"
    },
    {
      quote: "The AI adjustments to my workout plan kept me challenged but never overwhelmed. I've gained 10lbs of muscle in just 6 months!",
      name: "David Chen",
      achievement: "Gained 10 lbs of muscle",
      avatarUrl: "/api/placeholder/50/50"
    }
  ];

  return (
    <section className={`py-24 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          <motion.h2 
            className={`text-4xl font-bold text-center ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}
            variants={fadeIn}
          >
            Success Stories
          </motion.h2>
          
          <motion.p 
            className={`text-lg text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto mb-16`}
            variants={fadeIn}
          >
            See how GymTracker has transformed fitness journeys
          </motion.p>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div key={index} variants={fadeIn}>
                <TestimonialCard 
                  isDarkMode={isDarkMode}
                  quote={testimonial.quote} 
                  name={testimonial.name} 
                  achievement={testimonial.achievement} 
                  avatarUrl={testimonial.avatarUrl} 
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const Stat = ({ isDarkMode, value, label }) => {
  return (
    <motion.div 
      className="text-center"
      whileHover={{ y: -5, scale: 1.05 }}
    >
      <motion.h2 
        className={`text-4xl md:text-5xl font-bold ${isDarkMode ? 'text-white' : 'text-white'} mb-2`}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {value}
      </motion.h2>
      <motion.p 
        className={`${isDarkMode ? 'text-gray-300' : 'text-indigo-100'}`}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {label}
      </motion.p>
    </motion.div>
  );
};

const Stats = ({ isDarkMode }) => {
  const stats = [
    { value: "1M+", label: "Active Users" },
    { value: "50M+", label: "Workouts Analyzed" },
    { value: "85%", label: "Form Improvement" },
    { value: "4.8/5", label: "App Store Rating" }
  ];

  return (
    <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-700 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/50 to-purple-700/50 backdrop-blur-sm"></div>
      
      {/* Optional decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <Stat key={index} isDarkMode={isDarkMode} value={stat.value} label={stat.label} />
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = ({ isDarkMode }) => {
  return (
    <footer className={`${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-900 text-white'} pt-16 pb-8`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <motion.div whileHover={{ scale: 1.05 }} className="inline-block">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Home className={`${isDarkMode ? 'text-purple-400' : 'text-purple-400'} mr-2`} size={20} />
                GymTracker
              </h3>
            </motion.div>
            <p className="text-gray-400 mb-6">Transforming fitness through artificial intelligence, computer vision, and personalized guidance.</p>
            <div className="flex space-x-4">
              <motion.a 
                href="#" 
                className={`${isDarkMode ? 'bg-gray-800 hover:bg-purple-500' : 'bg-gray-800 hover:bg-purple-500'} w-10 h-10 rounded-full flex items-center justify-center transition duration-300`}
                whileHover={{ y: -5, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <span className="sr-only">Facebook</span>
                FB
              </motion.a>
              <motion.a 
                href="#" 
                className={`${isDarkMode ? 'bg-gray-800 hover:bg-purple-500' : 'bg-gray-800 hover:bg-purple-500'} w-10 h-10 rounded-full flex items-center justify-center transition duration-300`}
                whileHover={{ y: -5, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <span className="sr-only">Twitter</span>
                TW
              </motion.a>
              <motion.a 
                href="#" 
                className={`${isDarkMode ? 'bg-gray-800 hover:bg-purple-500' : 'bg-gray-800 hover:bg-purple-500'} w-10 h-10 rounded-full flex items-center justify-center transition duration-300`}
                whileHover={{ y: -5, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <span className="sr-only">Instagram</span>
                IG
              </motion.a>
              <motion.a 
                href="#" 
                className={`${isDarkMode ? 'bg-gray-800 hover:bg-purple-500' : 'bg-gray-800 hover:bg-purple-500'} w-10 h-10 rounded-full flex items-center justify-center transition duration-300`}
                whileHover={{ y: -5, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <span className="sr-only">YouTube</span>
                YT
              </motion.a>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <motion.li whileHover={{ x: 5 }}>
                <a href="#features" className="text-gray-400 hover:text-purple-400 transition duration-300 flex items-center">
                  Features
                </a>
              </motion.li>
              <motion.li whileHover={{ x: 5 }}>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition duration-300">FAQ</a>
              </motion.li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              <motion.li whileHover={{ x: 5 }}>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition duration-300">Blog</a>
              </motion.li>
              <motion.li whileHover={{ x: 5 }}>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition duration-300">Tutorials</a>
              </motion.li>
              <motion.li whileHover={{ x: 5 }}>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition duration-300">Support</a>
              </motion.li>
              <motion.li whileHover={{ x: 5 }}>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition duration-300">Community</a>
              </motion.li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <motion.li whileHover={{ x: 5 }}>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition duration-300">About Us</a>
              </motion.li>
              <motion.li whileHover={{ x: 5 }}>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition duration-300">Careers</a>
              </motion.li>
              <motion.li whileHover={{ x: 5 }}>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition duration-300">Privacy Policy</a>
              </motion.li>
              <motion.li whileHover={{ x: 5 }}>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition duration-300">Terms of Service</a>
              </motion.li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
          <p>&copy; 2025 GymTracker. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

const FloatingDumbbellButton = ({ isDarkMode, navigate }) => {
  // Animation for continuous bouncing effect
  const bounceAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  return (
    <motion.div 
      className="fixed bottom-6 right-6 z-50 md:bottom-8 md:right-8"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, duration: 0.5 }}
    >
      <motion.button
        onClick={() => navigate('/workout')}
        className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-lg 
          ${isDarkMode 
            ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white' 
            : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
          } hover:shadow-xl transition-shadow duration-300`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={bounceAnimation}
      >
        <Dumbbell size={24} className="text-white" />
      </motion.button>
    </motion.div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  
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

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/auth');
  };
  
  return (
    <div className={`min-h-screen ${
      isDarkMode ? 'bg-gradient-to-br from-gray-900 to-indigo-900 text-white' : 'bg-gradient-to-br from-white to-indigo-100 text-gray-900'
    }`}>
      <NavBar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      <main>
        <Hero isDarkMode={isDarkMode}/>
        <HowItWorks isDarkMode={isDarkMode}/>
        <Features isDarkMode={isDarkMode}/>
        <Testimonials isDarkMode={isDarkMode}/>
        <Stats isDarkMode={isDarkMode}/>
      </main>
      <Footer isDarkMode={isDarkMode} />
      
      {/* Floating Dumbbell Button */}
      <FloatingDumbbellButton isDarkMode={isDarkMode} navigate={navigate} />
    </div>
  );
};

export default HomePage;