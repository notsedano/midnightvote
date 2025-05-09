import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Vote, 
  BarChart3, 
  User, 
  Database, 
  ShieldCheck
} from 'lucide-react';

const Navigation: React.FC = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path ? 'text-primary-400' : 'text-gray-400 hover:text-white';
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-900 border-t border-dark-700 px-4 py-2 z-50">
      <div className="container mx-auto">
        <div className="flex justify-around items-center">
          <Link to="/vote" className={`flex flex-col items-center ${isActive('/vote')}`}>
            <Vote size={20} />
            <span className="text-xs mt-1 font-mono">VOTE</span>
          </Link>
          
          <Link to="/results" className={`flex flex-col items-center ${isActive('/results')}`}>
            <BarChart3 size={20} />
            <span className="text-xs mt-1 font-mono">RESULTS</span>
          </Link>
          
          {isAdmin && (
            <Link to="/admin" className={`flex flex-col items-center ${isActive('/admin')}`}>
              <ShieldCheck size={20} />
              <span className="text-xs mt-1 font-mono">ADMIN</span>
            </Link>
          )}
          
          <Link to="/explorer" className={`flex flex-col items-center ${isActive('/explorer')}`}>
            <Database size={20} />
            <span className="text-xs mt-1 font-mono">EXPLORER</span>
          </Link>
          
          <Link to="/profile" className={`flex flex-col items-center ${isActive('/profile')}`}>
            <User size={20} />
            <span className="text-xs mt-1 font-mono">PROFILE</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;