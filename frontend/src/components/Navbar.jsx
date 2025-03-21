import React from 'react';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const NavBar = ({ isMenuOpen, setIsMenuOpen }) => {
  return (
    <nav className="backdrop-blur-md bg-black/10 border-b border-white/5 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center p-4">
        <span className="text-lg font-light">gym<span className="text-purple-400">tracker</span></span>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="lg:hidden p-1.5 rounded-lg bg-white/5"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </motion.button>
      </div>
    </nav>
  );
};

export default NavBar;