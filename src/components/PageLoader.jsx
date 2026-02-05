import React from 'react';

const PageLoader = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-900 z-50">
      {/* Logo */}
      <div className="relative mb-8">
        <img 
          src="/logo-onhub.png" 
          alt="OnHub" 
          className="w-16 h-16 object-contain animate-pulse"
        />
      </div>
      
      {/* Loading bar */}
      <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 rounded-full animate-loading-bar" />
      </div>
      
      {/* Loading text */}
      <p className="mt-4 text-sm text-gray-500 animate-pulse">Carregando...</p>
      
      <style>{`
        @keyframes loading-bar {
          0% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 60%;
            margin-left: 20%;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default PageLoader;
