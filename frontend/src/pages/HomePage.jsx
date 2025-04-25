import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = ({ isDarkMode,}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate()
  const user = useAuth()
  console.log('user:')
  console.log(user)

  return (
    <header className={`${ 
      isDarkMode 
      ? 'bg-gray-800 border-gray-700' 
      : 'bg-white border-gray-200'
      } border-b shadow-sm transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
            <Home className={`w-8 h-8 ${
            isDarkMode ? 'text-purple-400' : 'text-indigo-600'
          } mr-2`} />
          <h1 className="text-xl font-bold hidden sm:block">GymTracker</h1>
            </div>
            
            <div className="hidden md:flex space-x-8">
              <a href="#features" className={`${ isDarkMode? 'text-white hover:text-indigo-500' : 'text-gray-400 hover:text-indigo-500'} font-medium`}>Features</a>
              <a href="#how-it-works" className={`${ isDarkMode? 'text-white hover:text-indigo-500' : 'text-gray-400 hover:text-indigo-500'} font-medium`}>How It Works</a>
            </div>
            
            { user.user ? (
                <div className='md:flex space-x-8'>
                  <div>
                  <button onClick={()=>navigate("/dashboard")} className="hidden md:block bg-indigo-500 hover:bg-indigo-800 text-white font-semibold py-2 px-6 rounded-full transition duration-300">
                    Dashboard
                  </button>
                  </div>
                  <div>
                  <button onClick={()=>navigate("/account")} className="hidden md:block bg-indigo-500 hover:bg-indigo-800 text-white font-semibold py-2 px-6 rounded-full transition duration-300">
                    My Account
                  </button>
                  </div>
                </div>
                ) : (
                  <button onClick={()=>navigate("/auth")} className="hidden md:block bg-indigo-500 hover:bg-indigo-800 text-white font-semibold py-2 px-6 rounded-full transition duration-300">
                  Log in
                </button>
                )}

            <div className="md:hidden">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {isMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          {isMenuOpen && (
            <div className="md:hidden py-4">
              <div className="flex flex-col space-y-4">
                <a href="#features" className={`${ isDarkMode? 'text-white hover:text-indigo-500' : 'text-gray-400 hover:text-indigo-500'} font-medium`}>Features</a>
                <a href="#how-it-works" className={`${ isDarkMode? 'text-white hover:text-indigo-500' : 'text-gray-400 hover:text-indigo-500'} font-medium`}>How It Works</a>
                { user.user ? (
                <div className="flex flex-col space-y-4">
                <button className="bg-indigo-500 hover:bg-indigo-800 text-white font-semibold py-2 px-6 rounded-full transition duration-300 w-full">
                  My Account
                </button>
                <button className="bg-indigo-500 hover:bg-indigo-800 text-white font-semibold py-2 px-6 rounded-full transition duration-300 w-full">
                  Dashboard
                </button>
                </div>
                ) : (
                <button className="bg-indigo-500 hover:bg-indigo-800 text-white font-semibold py-2 px-6 rounded-full transition duration-300 w-full">
                  Log in
                </button> 
                )}
              </div>
            </div>
          )}
        </div>
      </header>
  );
};

const Hero = ({ isDarkMode,}) => {
  return (
    <section className={`pt-32 pb-20 bg-gradient-to-br ${isDarkMode ? 'from-gray-800 to-indigo-500':'from-gray-100 to-indigo-500'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className={`text-4xl sm:text-5xl font-bold ${isDarkMode ? 'text-white':'text-gray-900'} mb-6`}>Transform Your Workouts With AI</h1>
        <p className={`text-lg ${isDarkMode ? 'text-gray-100' : 'text-gray-600'} max-w-3xl mx-auto mb-8`}>
          GymTracker uses advanced artificial intelligence to track your form, provide real-time feedback, and optimise your fitness journey like never before.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          <button className="bg-indigo-500 hover:bg-indigo-800 text-white font-semibold py-3 px-8 rounded-full transition duration-300">
            Get Started
          </button>
          <button className="bg-transparent hover:bg-indigo-500 text-indigo-500 hover:text-white font-semibold py-3 px-8 rounded-full border-2 border-indigo-500 transition duration-300">
            Watch Demo
          </button>
        </div>
        <div className="max-w-4xl mx-auto rounded-lg shadow-2xl">
          <img src="https://cdn.midjourney.com/c54c6344-3536-40cc-bce3-8257b728d23d/0_3.png" alt="GymTracker App Demo" className="w-full h-auto" />
        </div>
      </div>
    </section>
  );
};

const Features = ({ isDarkMode,}) => {
  const FeatureCard = ({ icon, title, description }) => {
    return (
      <div className="bg-white rounded-lg p-8 shadow-md hover:shadow-xl transform hover:-translate-y-2 transition duration-300">
        <div className="bg-indigo-400 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
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
      title: "Pinpoint Muscle Acitivation Detection",
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
    <section id="features" className="py-24 bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center text-white mb-16">Intelligent Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index} 
              icon={feature.icon} 
              title={feature.title} 
              description={feature.description} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const Step = ({ isDarkMode, number, title, description }) => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-6 mb-16">
      <div className={`s${isDarkMode? '': 'bg-indigo-500 text-white'} w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0`}>
        {number}
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
};

const HowItWorks = ({ isDarkMode,}) => {
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
    <section id="how-it-works" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">How It Works</h2>
        <div className="max-w-3xl mx-auto">
          {steps.map((step, index) => (
            <Step 
              key={index} 
              number={step.number} 
              title={step.title} 
              description={step.description} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const TestimonialCard = ({ isDarkMode, quote, name, achievement, avatarUrl }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-6 shadow-md">
      <p className="text-gray-600 italic mb-6">{quote}</p>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full">
          <img src={avatarUrl} alt={`${name}'s avatar`} className="w-full h-full object-cover" />
        </div>
        <div>
          <h4 className="text-lg font-semibold text-gray-900">{name}</h4>
          <p className="text-gray-500 text-sm">{achievement}</p>
        </div>
      </div>
    </div>
  );
};

const Testimonials = ({ isDarkMode,}) => {
  const testimonials = [
    {
      quote: "I've tried many fitness apps, but FitAI is in a league of its own. The form feedback helped me correct issues I didn't even know I had.",
      name: "Sarah Johnson",
      achievement: "Lost 15 lbs in 3 months",
      avatarUrl: "/api/placeholder/50/50"
    },
    {
      quote: "As a personal trainer, I recommend FitAI to all my clients for their solo sessions. It's like having me there when I can't be.",
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
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">Success Stories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard 
              key={index} 
              quote={testimonial.quote} 
              name={testimonial.name} 
              achievement={testimonial.achievement} 
              avatarUrl={testimonial.avatarUrl} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const Stat = ({ isDarkMode, value, label }) => {
  return (
    <div className="text-center">
      <h2 className="text-4xl font-bold text-white mb-2">{value}</h2>
      <p className="text-white">{label}</p>
    </div>
  );
};

const Stats = ({ isDarkMode,}) => {
  const stats = [
    { value: "1M+", label: "Active Users" },
    { value: "50M+", label: "Workouts Analyzed" },
    { value: "85%", label: "Form Improvement" },
    { value: "4.8/5", label: "App Store Rating" }
  ];

  return (
    <section className="py-20 bg-gradient-to-r from-indigo-500 to-indigo-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <Stat key={index} value={stat.value} label={stat.label} />
          ))}
        </div>
      </div>
    </section>
  );
};

const ContactForm = ({ isDarkMode,}) => {
  return (
    <section id="contact" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">Contact Us</h2>
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <div className="mb-6">
            <label htmlFor="name" className="block text-gray-800 font-medium mb-2">Name</label>
            <input 
              type="text" 
              id="name" 
              placeholder="Your name" 
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="email" className="block text-gray-800 font-medium mb-2">Email</label>
            <input 
              type="email" 
              id="email" 
              placeholder="Your email" 
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="message" className="block text-gray-800 font-medium mb-2">Message</label>
            <textarea 
              id="message" 
              placeholder="How can we help?" 
              rows="5"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
          </div>
          <button className="w-full bg-indigo-500 hover:bg-indigo-800 text-white font-semibold py-3 px-6 rounded-full transition duration-300">
            Send Message
          </button>
        </div>
      </div>
    </section>
  );
};

const Footer = ({ isDarkMode,}) => {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-xl font-semibold mb-4">GymTracker</h3>
            <p className="text-gray-400 mb-6">Transforming fitness through artificial intelligence, computer vision, and personalized guidance.</p>
            <div className="flex space-x-4">
              <a href="#" className="bg-gray-800 hover:bg-indigo-500 w-10 h-10 rounded-full flex items-center justify-center transition duration-300">FB</a>
              <a href="#" className="bg-gray-800 hover:bg-indigo-500 w-10 h-10 rounded-full flex items-center justify-center transition duration-300">TW</a>
              <a href="#" className="bg-gray-800 hover:bg-indigo-500 w-10 h-10 rounded-full flex items-center justify-center transition duration-300">IG</a>
              <a href="#" className="bg-gray-800 hover:bg-indigo-500 w-10 h-10 rounded-full flex items-center justify-center transition duration-300">YT</a>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Features</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">FAQ</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Blog</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Tutorials</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Support</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Community</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">About Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Careers</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Terms of Service</a></li>
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

const HomePage = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  
    // Check system preference on initial load
    useEffect(() => {
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDarkMode);
      
    }, [navigate]);
  
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
    <div className={`overflow-scroll fixed inset-0 ${
      isDarkMode 
        ? 'bg-gray-900 text-gray-100' 
        : 'bg-gray-50 text-gray-900'
    } transition-colors duration-300`}>
      <Header isDarkMode={isDarkMode} />
      <main>
        <Hero isDarkMode={isDarkMode}/>
        <HowItWorks isDarkMode={isDarkMode}/>
        <Features isDarkMode={isDarkMode}/>
        <Testimonials isDarkMode={isDarkMode}/>
        <Stats isDarkMode={isDarkMode}/>
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;