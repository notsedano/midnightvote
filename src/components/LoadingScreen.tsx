import React from 'react';
import { Music } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-dark-950">
      <div className="text-center">
        <Music className="animate-vote-pulse mx-auto h-16 w-16 text-primary-400" />
        <h2 className="mt-4 text-xl font-mono text-primary-400">Loading...</h2>
        <div className="mt-4 w-48 h-2 bg-dark-800 rounded-full overflow-hidden">
          <div className="h-full bg-primary-400 animate-vote-fill"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;