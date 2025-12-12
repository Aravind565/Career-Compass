import React from "react";
import { Briefcase, Sun, Moon, Sparkles } from "lucide-react";

const Header = ({ theme, toggleTheme, onNewAnalysis }) => {
  return (
    <header
      className="
        fixed top-0 left-0 right-0 z-50 
        backdrop-blur-2xl 
        bg-white/50 dark:bg-gray-900/40
        border-b border-white/30 dark:border-gray-700/40
        shadow-lg shadow-black/5
      "
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">

          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none"
            onClick={onNewAnalysis}
          >
       
            <div className="relative shrink-0">
              <div
                className="
                  absolute inset-0 rounded-xl blur-lg 
                  bg-gradient-to-r from-indigo-500 to-purple-600
                  opacity-30 group-hover:opacity-50 transition duration-300
                "
              />
              <div
                className="
                  relative p-2 sm:p-2.5 rounded-xl
                  bg-gradient-to-br from-indigo-600 to-purple-600
                  shadow-lg shadow-indigo-500/30 
                  group-hover:scale-105 transition duration-300
                "
              >
                <Briefcase className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>

          
            <div className="flex flex-col leading-none">
              <h1
                className="
                  font-extrabold tracking-tight 
                  text-gray-900 dark:text-white 
                  text-lg sm:text-2xl
                "
              >
                Career{" "}
                <span
                  className="
                    text-transparent bg-clip-text
                    bg-gradient-to-r from-indigo-600 to-purple-600
                  "
                >
                  Compass
                </span>
              </h1>

              <p
                className="
                  hidden xs:block mt-0.5
                  text-[9px] sm:text-xs font-semibold 
                  text-gray-500 dark:text-gray-400
                  uppercase tracking-widest
                "
              >
                AI Career Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">

        
            <button
              onClick={onNewAnalysis}
              className="
                flex items-center gap-1.5 sm:gap-2
                px-3 sm:px-5 py-2 sm:py-2.5
                text-xs sm:text-sm font-semibold
                rounded-xl
                bg-gradient-to-r from-indigo-600 to-purple-600 
                text-white shadow-md shadow-indigo-500/20
                hover:shadow-xl hover:scale-[1.03]
                transition-all active:scale-95
                backdrop-blur-xl
              "
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">New Analysis</span>
              <span className="sm:hidden">New</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="
                p-2 sm:p-2.5 rounded-xl
                border border-transparent
                hover:border-gray-300 dark:hover:border-gray-700
                hover:bg-gray-100/60 dark:hover:bg-gray-800/60
                text-gray-600 dark:text-gray-300
                transition-all active:scale-95
              "
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;
