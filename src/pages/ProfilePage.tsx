import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useVoting } from '../contexts/VotingContext';
import Navigation from '../components/Navigation';
import Banner from '../components/Banner';
import LoadingScreen from '../components/LoadingScreen';
import { LogOut, User as UserIcon, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const { user, profile, signOut, isLoading: authLoading } = useAuth();
  const { userVote, candidates, isLoading: votingLoading } = useVoting();
  const [localLoading, setLocalLoading] = useState(true);
  const navigate = useNavigate();
  
  // Add debug effect to log what's causing the loading state
  useEffect(() => {
    console.log("Debug Profile Page:", { 
      user: !!user, 
      profile: !!profile, 
      authLoading, 
      votingLoading 
    });
    
    // Set local loading to false after a short timeout to prevent infinite loading
    const timer = setTimeout(() => {
      setLocalLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [user, profile, authLoading, votingLoading]);
  
  // Show loading only when explicitly loading data
  if ((authLoading || votingLoading) && localLoading) {
    return <LoadingScreen />;
  }
  
  // If no user after loading is complete, redirect to login
  if (!user && !authLoading) {
    navigate('/login');
    return null;
  }
  
  const votedCandidate = userVote 
    ? candidates.find(c => c.id === userVote.candidate_id) 
    : null;
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Add admin navigation function
  const goToAdmin = () => {
    navigate('/debug-admin');
  };

  return (
    <div className="min-h-screen bg-dark-950 pb-20">
      <Banner
        imageUrl="https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800"
        title="My Profile"
      />
      
      <div className="container mx-auto px-4">
        <div className="card mb-6">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 rounded-full bg-dark-700 flex items-center justify-center">
              <UserIcon size={32} className="text-primary-400" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-mono text-primary-400">
                {user?.email || 'Loading...'}
              </h2>
              <p className="text-sm text-gray-400">
                {profile?.is_admin ? 'Administrator' : 'Verified Voter'}
              </p>
            </div>
          </div>
          
          <div className="border-t border-dark-700 pt-4">
            <h3 className="text-lg font-mono text-primary-400 mb-3">Your Vote</h3>
            
            {votedCandidate ? (
              <div className="p-4 bg-dark-800 rounded-md">
                <p className="text-sm text-gray-400">You voted for:</p>
                <p className="text-lg font-mono text-primary-400">{votedCandidate.name}</p>
                <p className="text-sm text-gray-400">{votedCandidate.genre}</p>
                
                <div className="mt-3 text-xs text-gray-500">
                  <p>Vote ID: {userVote?.transaction_id}</p>
                  <p>Date: {userVote?.created_at ? new Date(userVote.created_at).toLocaleString() : ''}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-dark-800 rounded-md">
                <p className="text-gray-400">You haven't cast a vote yet.</p>
                <button 
                  onClick={() => navigate('/vote')}
                  className="mt-2 text-sm text-primary-400 hover:text-primary-300"
                >
                  Go to Vote tab to participate
                </button>
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={handleSignOut}
          className="btn btn-outline w-full flex items-center justify-center space-x-2"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
      
      <Navigation />
      
      {/* Direct admin access button */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          onClick={goToAdmin}
          className="bg-primary-900 hover:bg-primary-800 text-white p-3 rounded-full shadow-lg"
          aria-label="Admin Access"
        >
          <Shield size={24} />
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;