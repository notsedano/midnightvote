import React from 'react';
import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';

interface BannerProps {
  imageUrl?: string;
  title?: string;
  subtitle?: string;
}

const Banner: React.FC<BannerProps> = ({ 
  title = "MIDNIGHTREBELS & FRIENDS DJ COMPETITION",
  subtitle = "SELECT CANDIDATE TO VOTE"
}) => {
  return (
    <div className="w-full relative mb-6 border-b border-[#9ACD32]/50 bg-black font-mono">
      <div className="py-3 px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Terminal size={18} className="text-[#9ACD32]" />
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-lg text-[#9ACD32] font-bold"
            >
              {title}
            </motion.div>
          </div>
          
          <div className="flex space-x-2 text-xs text-[#9ACD32]/70">
            <span>SESSION: ACTIVE</span>
            <span>|</span>
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              SYSTEM ONLINE
            </motion.span>
          </div>
        </div>
        
        {subtitle && (
          <div className="mt-4 mb-1">
            <div className="flex items-center">
              <div className="w-3 h-3 border border-[#9ACD32] mr-2 flex-shrink-0"></div>
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-[#9ACD32]/80 text-sm flex-1"
              >
                {subtitle}
              </motion.div>
            </div>
            
            <div className="mt-3 grid grid-cols-4 gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <motion.div 
                  key={i}
                  className="h-1 bg-[#9ACD32]/30"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.3, delay: 0.1 * i }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Decorative scanlines effect */}
      <div className="absolute inset-0 pointer-events-none opacity-10" 
           style={{ 
             backgroundImage: 'linear-gradient(transparent 50%, rgba(154, 205, 50, 0.1) 50%)', 
             backgroundSize: '100% 4px'
           }}>
      </div>
      
      {/* Blinking cursor */}
      <motion.div 
        className="absolute bottom-3 right-3 w-2 h-4 bg-[#9ACD32]"
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    </div>
  );
};

export default Banner;