import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useVoting } from '../contexts/VotingContext';
import { Navigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Banner from '../components/Banner';
import LoadingScreen from '../components/LoadingScreen';
import { Terminal, LogOut, User, Award, Calendar } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, signOut, isAdmin } = useAuth();
  const { userVote, candidates, isLoading } = useVoting();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Debug effect to log loading state
    console.log('Auth checking state:', isCheckingAuth);
    console.log('User state:', user);
    
    // Timeout to prevent infinite loading
    const timer = setTimeout(() => {
      setIsCheckingAuth(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [isCheckingAuth, user]);

  if (isLoading || isCheckingAuth) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Find the candidate the user voted for
  const votedCandidate = userVote 
    ? candidates.find(c => c.id === userVote.candidate_id) 
    : null;

  // Safely format email with optional chaining
  const formattedEmail = user.email ? (user.email.substring(0, 16) + (user.email.length > 16 ? '...' : '')) : '';

  return (
    <div className="min-h-screen bg-black pb-20 font-mono">
      <Banner 
        title="USER PROFILE" 
        subtitle="ACCOUNT STATUS AND VOTING RECORD"
      />

      <div className="container mx-auto px-4 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* User Info */}
          <div className="p-4 bg-black border border-[#9ACD32]/30 rounded-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg text-[#9ACD32]">User Information</h2>
              <User size={18} className="text-[#9ACD32]" />
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-black border border-[#9ACD32]/20 rounded-md">
                <p className="text-xs text-gray-400 mb-1">Email Address</p>
                <p className="text-[#9ACD32] truncate">{formattedEmail}</p>
              </div>
              
              <div className="p-3 bg-black border border-[#9ACD32]/20 rounded-md">
                <p className="text-xs text-gray-400 mb-1">User ID</p>
                <p className="text-[#9ACD32] text-sm truncate">{user.id}</p>
              </div>
              
              <div className="p-3 bg-black border border-[#9ACD32]/20 rounded-md">
                <p className="text-xs text-gray-400 mb-1">Account Type</p>
                <p className="text-[#9ACD32]">{isAdmin ? 'ADMINISTRATOR' : 'STANDARD USER'}</p>
              </div>
              
              <div className="p-3 bg-black border border-[#9ACD32]/20 rounded-md">
                <p className="text-xs text-gray-400 mb-1">Last Login</p>
                <p className="text-[#9ACD32]">
                  {new Date().toLocaleDateString()} | {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
          
          {/* Vote Info */}
          <div className="p-4 bg-black border border-[#9ACD32]/30 rounded-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg text-[#9ACD32]">Vote Status</h2>
              <Award size={18} className="text-[#9ACD32]" />
            </div>
            
            {userVote && votedCandidate ? (
              <div className="space-y-3">
                <div className="p-3 bg-black border border-[#9ACD32]/20 rounded-md">
                  <p className="text-xs text-gray-400 mb-1">Voted For</p>
                  <p className="text-lg text-[#9ACD32]">{votedCandidate.name}</p>
                </div>
                
                <div className="p-3 bg-black border border-[#9ACD32]/20 rounded-md">
                  <p className="text-xs text-gray-400 mb-1">Vote Timestamp</p>
                  <div className="flex items-center space-x-2">
                    <Calendar size={14} className="text-[#9ACD32]" />
                    <p className="text-[#9ACD32]">
                      {new Date(userVote.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="p-3 bg-black border border-[#9ACD32]/20 rounded-md">
                  <p className="text-xs text-gray-400 mb-1">Transaction ID</p>
                  <p className="text-[#9ACD32] text-sm overflow-x-auto">
                    {userVote.transaction_id}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 h-40 text-center">
                <Terminal size={32} className="text-[#9ACD32]/50 mb-3" />
                <p className="text-[#9ACD32] mb-1">NO VOTE RECORDED</p>
                <p className="text-gray-400 text-sm">
                  You have not yet voted in this competition.
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mb-8">
          <button 
            onClick={signOut}
            className="flex-1 flex items-center justify-center py-3 bg-black border border-[#9ACD32]/50 text-[#9ACD32] rounded hover:bg-[#9ACD32]/10 transition duration-200"
          >
            <LogOut size={16} className="mr-2" />
            SIGN OUT
          </button>
          
          {isAdmin && (
            <button 
              onClick={() => window.location.href = '/admin'} 
              className="flex-1 flex items-center justify-center py-3 bg-black border border-[#9ACD32]/50 text-[#9ACD32] rounded hover:bg-[#9ACD32]/10 transition duration-200"
            >
              <Terminal size={16} className="mr-2" />
              ADMIN PANEL
            </button>
          )}
        </div>
      </div>
      
      <Navigation />
    </div>
  );
};

export default ProfilePage;