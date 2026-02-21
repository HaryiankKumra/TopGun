import React from 'react';
import { Activity } from 'lucide-react';

const ECG: React.FC = () => {
  return (
    <div className="relative">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl h-64 sm:h-80 md:h-96 mx-auto relative bg-gradient-to-br from-sky-50/50 to-cyan-50/50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-xl sm:rounded-2xl border border-sky-200 dark:border-slate-600 overflow-hidden backdrop-blur-sm">
        {/* ECG Animation */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
          <div className="w-full mb-4 sm:mb-6 md:mb-8 flex justify-center">
            <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg h-16 sm:h-20 md:h-24 bg-slate-900/10 dark:bg-slate-900/30 rounded-md sm:rounded-lg overflow-hidden">
              {/* Grid Background */}
              <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full" viewBox="0 0 320 96">
                  <defs>
                    <pattern id="grid" width="16" height="12" patternUnits="userSpaceOnUse">
                      <path d="M 16 0 L 0 0 0 12" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-cyan-300/40 dark:text-cyan-400/40"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>
              
              {/* ECG Line */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 96" preserveAspectRatio="none">
                <path
                  d="M0,48 L40,48 L45,48 L50,20 L55,80 L60,48 L65,48 L105,48 L110,48 L115,20 L120,80 L125,48 L130,48 L170,48 L175,48 L180,20 L185,80 L190,48 L195,48 L235,48 L240,48 L245,20 L250,80 L255,48 L260,48 L300,48 L320,48"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-cyan-400 dark:text-cyan-300 ecg-line"
                  style={{
                    strokeDasharray: '320',
                    strokeDashoffset: '320',
                    animation: 'ecg-pulse 2s ease-in-out infinite'
                  }}
                />
              </svg>
              
              {/* Scanning Line */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 dark:bg-cyan-300 opacity-80 scan-line"
                style={{
                  left: '0%',
                  animation: 'scan-line 2s ease-in-out infinite'
                }}
              />
              
              {/* Glow Effect */}
              <div 
                className="absolute top-0 bottom-0 w-4 sm:w-6 md:w-8 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent blur-sm glow-effect"
                style={{
                  left: '0%',
                  animation: 'scan-line 2s ease-in-out infinite'
                }}
              />
            </div>
          </div>
          
          <div className="text-center">
            <Activity className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-sky-600 dark:text-sky-400 mx-auto mb-2 sm:mb-3 animate-pulse" />
            <p className="text-sky-600 dark:text-sky-400 font-semibold text-base sm:text-lg md:text-xl">
              Real-time Monitoring
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
              AI-Powered Detection
            </p>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes ecg-pulse {
          0% {
            stroke-dashoffset: 320;
          }
          50% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -320;
          }
        }
        
        @keyframes scan-line {
          0% {
            left: 0%;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            left: 100%;
            opacity: 0;
          }
        }

        /* Mobile optimizations */
        @media (max-width: 640px) {
          .ecg-line {
            stroke-width: 1.5;
          }
          
          .scan-line {
            width: 1px;
          }
          
          .glow-effect {
            width: 12px;
          }
        }

        /* Tablet optimizations */
        @media (min-width: 641px) and (max-width: 1024px) {
          .ecg-line {
            stroke-width: 2;
          }
        }

        /* Desktop optimizations */
        @media (min-width: 1025px) {
          .ecg-line {
            stroke-width: 2.5;
          }
          
          .glow-effect {
            width: 36px;
          }
        }

        /* High DPI displays */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          .ecg-line {
            stroke-width: 1.5;
          }
        }

        /* Reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .ecg-line, .scan-line, .glow-effect {
            animation: none;
          }
          
          .animate-pulse {
            animation: none;
          }
        }

        /* Dark mode adjustments */
        @media (prefers-color-scheme: dark) {
          .ecg-line {
            filter: brightness(1.1);
          }
        }
      `}</style>
    </div>
  );
};

export default ECG;