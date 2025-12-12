import React from 'react';
import { Briefcase, Sun, Moon, Sparkles } from 'lucide-react';

const Header = ({ theme, toggleTheme, onNewAnalysis }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-xl 
      bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-800/50">

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-20">

          {/* Logo Section */}
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none"
            onClick={onNewAnalysis}
          >
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 
                rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
              <div className="relative p-2 rounded-xl sm:p-2.5 bg-gradient-to-br 
                from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 
                group-hover:scale-105 transition-transform duration-300">
                <Briefcase className="w-4 h-4 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
              </div>
            </div>

            {/* Title */}
            <div className="flex flex-col leading-none">
              <h1 className="font-extrabold tracking-tight text-gray-900 dark:text-white 
                text-lg sm:text-2xl">
                Career
                <span className="text-transparent bg-clip-text bg-gradient-to-r 
                  from-indigo-500 to-purple-600">
                  Compass
                </span>
              </h1>

              {/* Subtitle (Hidden on very small screens) */}
              <p className="hidden xs:block text-[9px] sm:text-xs font-semibold 
                text-gray-400 uppercase tracking-widest mt-0.5 group-hover:text-indigo-500 transition-colors">
                AI Career Assistant
              </p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-4">

            {/* New Analysis Button */}
            <button
              onClick={onNewAnalysis}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 
              text-xs sm:text-sm font-bold text-white bg-gray-900 dark:bg-white 
              dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 
              transition-all shadow-lg hover:shadow-xl active:scale-95 group"
            >
              <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
              <span className="hidden sm:inline">New Analysis</span>
              <span className="sm:hidden">New</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 sm:p-2.5 rounded-xl text-gray-500 hover:text-gray-900 
              dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 
              transition-all active:scale-95 border border-transparent hover:border-gray-200 
              dark:hover:border-gray-700"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" strokeWidth={2} />
              ) : (
                <Sun className="w-5 h-5" strokeWidth={2} />
              )}
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
