import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Vote, 
  BarChart3, 
  User, 
  Database, 
  ShieldCheck,
  Terminal
} from 'lucide-react';
import { motion } from 'framer-motion';

const Navigation: React.FC = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const navItems = [
    { path: '/vote', label: 'VOTE', icon: Vote },
    { path: '/results', label: 'RESULTS', icon: BarChart3 },
    ...(isAdmin ? [{ path: '/admin', label: 'ADMIN', icon: ShieldCheck }] : []),
    { path: '/explorer', label: 'EXPLORER', icon: Database },
    { path: '/profile', label: 'PROFILE', icon: User },
  ];

  return (
    <motion.nav 
      className="fixed bottom-0 left-0 right-0 bg-black border-t border-[#9ACD32] px-2 py-2 z-50 font-mono shadow-lg"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.5 }}
    >
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <div className="hidden md:flex items-center text-xs text-[#9ACD32]/70 px-2">
            <Terminal size={12} className="mr-1" />
            <span>MENU</span>
          </div>
          
          <div className="flex mx-auto md:mx-0 space-x-1 md:space-x-4 overflow-x-auto pb-1 no-scrollbar">
            {navItems.map((item) => (
              <NavItem 
                key={item.path}
                path={item.path}
                label={item.label}
                Icon={item.icon}
                isActive={isActive(item.path)}
              />
            ))}
          </div>
          
          <div className="hidden md:block text-xs text-[#9ACD32]/70 px-2">
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              READY
            </motion.span>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

interface NavItemProps {
  path: string;
  label: string;
  Icon: React.ElementType;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ path, label, Icon, isActive }) => {
  return (
    <Link 
      to={path} 
      className={`flex items-center px-2 py-1 border rounded ${isActive ? 'border-[#9ACD32] text-[#9ACD32] bg-[#9ACD32]/10' : 'border-[#9ACD32]/30 text-[#9ACD32]/70 hover:border-[#9ACD32]/60 hover:bg-[#9ACD32]/5'}`}
    >
      <Icon size={14} className="mr-1" />
      <span className="text-xs whitespace-nowrap">{label}</span>
      
      {isActive && (
        <motion.div 
          className="ml-1 w-1 h-1 bg-[#9ACD32]"
          layoutId="nav-indicator"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
    </Link>
  );
};

export default Navigation;