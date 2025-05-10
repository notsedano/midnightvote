import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info';

interface VoteNotificationProps {
  message: string;
  type: NotificationType;
  isVisible: boolean;
  onClose?: () => void;
}

const VoteNotification: React.FC<VoteNotificationProps> = ({
  message,
  type = 'success',
  isVisible,
  onClose
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} />;
      case 'error':
        return <XCircle size={18} />;
      case 'info':
        return <Info size={18} />;
      default:
        return null;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'border-[#9ACD32]',
          text: 'text-[#9ACD32]'
        };
      case 'error':
        return {
          bg: 'border-white',
          text: 'text-white'
        };
      case 'info':
        return {
          bg: 'border-[#9ACD32]/70',
          text: 'text-[#9ACD32]/70'
        };
      default:
        return {
          bg: 'border-[#9ACD32]',
          text: 'text-[#9ACD32]'
        };
    }
  };

  const colors = getColors();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed bottom-20 inset-x-0 mx-auto w-full max-w-md px-4 z-50 font-mono`}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
        >
          <div className={`border ${colors.bg} p-3 bg-black relative`}>
            <div className="flex items-center">
              <div className={`mr-2 ${colors.text}`}>
                {getIcon()}
              </div>
              <div className={`${colors.text} flex-1`}>
                {message}
              </div>
              {onClose && (
                <button 
                  onClick={onClose}
                  className={`${colors.text} opacity-70 hover:opacity-100`}
                >
                  <XCircle size={16} />
                </button>
              )}
            </div>
            
            {/* Progress bar */}
            <motion.div 
              className={`absolute bottom-0 left-0 h-1 ${type === 'success' ? 'bg-[#9ACD32]' : type === 'error' ? 'bg-white' : 'bg-[#9ACD32]/70'}`}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 5 }}
              onAnimationComplete={onClose}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VoteNotification; 