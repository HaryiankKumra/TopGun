import React, { useState } from 'react';
import { Monitor, Menu, X } from 'lucide-react';

// Mock components for demonstration
// const ThemeToggle = () => (
//   <button className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
//     🌙
//   </button>
// );

const Link = ({ to, children, className }) => (
  <a href={to} className={className}>
    {children}
  </a>
);

const CollapsibleHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="container mx-auto px-6 py-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Monitor className="w-8 h-8 text-sky-600 dark:text-sky-400" />
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            StressGuard AI
          </span>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#about"
            className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            About
          </a>
          <a
            href="#team"
            className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Team
          </a>
          <a
            href="#research"
            className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Research
          </a>
          <a
            href="#technology"
            className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Technology
          </a>
          <a
            href="#contact"
            className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Contact
          </a>
          {/* <ThemeToggle /> */}
          <Link
            to="/login"
            className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Login
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X className="w-6 h-6 text-slate-600 dark:text-slate-300" />
          ) : (
            <Menu className="w-6 h-6 text-slate-600 dark:text-slate-300" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div className={`md:hidden transition-all duration-300 ease-in-out ${
        isMenuOpen 
          ? 'max-h-96 opacity-100 mt-6' 
          : 'max-h-0 opacity-0 overflow-hidden'
      }`}>
        <nav className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex flex-col space-y-4">
            <a
              href="#about"
              onClick={closeMenu}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              About
            </a>
            <a
              href="#team"
              onClick={closeMenu}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Team
            </a>
            <a
              href="#research"
              onClick={closeMenu}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Research
            </a>
            <a
              href="#technology"
              onClick={closeMenu}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Technology
            </a>
            <a
              href="#contact"
              onClick={closeMenu}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Contact
            </a>
            
            <div className="border-t border-slate-200 dark:border-slate-600 pt-4 mt-4">
              <div className="flex items-center justify-between">
                {/* <ThemeToggle /> */}
                <Link
                  to="/login"
                  className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg transition-colors"
                //   onClick={closeMenu}
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default CollapsibleHeader;