import React, { useEffect, useState } from 'react';
import { Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Loading..." 
}) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Initializing...");
  
  useEffect(() => {
    const loadingPhrases = [
      "Initializing system...",
      "Loading audio modules...",
      "Establishing database connection...",
      "Verifying DJ records...",
      "Calculating vote counts...",
      "Preparing interface..."
    ];
    
    let phraseIndex = 0;
    const intervalId = setInterval(() => {
      setLoadingText(loadingPhrases[phraseIndex % loadingPhrases.length]);
      phraseIndex++;
    }, 1500);
    
    const progressId = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressId);
          return 100;
        }
        return prev + Math.floor(Math.random() * 5) + 1;
      });
    }, 200);
    
    return () => {
      clearInterval(intervalId);
      clearInterval(progressId);
    };
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black font-mono text-[#9ACD32]">
      <div className="w-full max-w-md border border-[#9ACD32] p-4 relative">
        <div className="border-b border-[#9ACD32] pb-2 mb-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Terminal size={16} />
            <span className="text-sm">SYSTEM.LOAD</span>
          </div>
          <span className="text-xs">{progress}%</span>
        </div>
        
        <div className="space-y-4">
          <div className="flex flex-col space-y-1">
            <div className="text-xs flex justify-between">
              <span>Task:</span>
              <span>{loadingText}</span>
            </div>
            <div className="w-full h-2 bg-black border border-[#9ACD32]">
              <motion.div 
                className="h-full bg-[#9ACD32]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          <div className="text-center">
            <span className="text-sm">{message}</span>
          </div>
          
          <div className="terminal-output h-32 overflow-hidden border border-[#9ACD32] p-2 bg-black font-mono text-xs">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-[#9ACD32]">{`> DJ VOTING SYSTEM v1.0`}</p>
              <p className="text-[#9ACD32]">{`> Initializing components...`}</p>
              <p className="text-[#9ACD32]">{`> Loading user profiles...`}</p>
              <p className="text-[#9ACD32]">{`> Connecting to secure network...`}</p>
              <p className="text-[#9ACD32]">{`> Verifying access protocols...`}</p>
              <motion.p 
                className="text-[#9ACD32] flex"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {`> ${loadingText}`}<span className="ml-1">_</span>
              </motion.p>
            </motion.div>
          </div>
        </div>
        
        <div className="absolute bottom-2 right-2">
          <span className="text-xs opacity-50">Press any key to continue_</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;