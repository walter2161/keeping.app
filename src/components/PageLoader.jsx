import React from 'react';

const PageLoader = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-900 z-50">
      {/* Spinning Circle */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-full border-4 border-gray-700 border-t-blue-500 animate-spin" />
        {/* Inner glow effect */}
        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-purple-500 animate-spin-reverse opacity-50" />
      </div>
      
      {/* Logo */}
      <div className="relative mb-4">
        <img 
          src="/logo-onhub.png" 
          alt="OnHub" 
          className="w-12 h-12 object-contain"
        />
      </div>
      
      {/* Loading text */}
      <p className="mt-2 text-sm text-gray-400">Carregando...</p>
      
      <style>{`
        @keyframes spin-reverse {
          0% {
            transform: rotate(360deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }
        .animate-spin-reverse {
          animation: spin-reverse 1.2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default PageLoader;
