import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Terminal } from 'lucide-react';
import Layout from '../components/Layout';
import Banner from '../components/Banner';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bannerImages, setBannerImages] = useState({
    banner1: '',
    banner2: ''
  });
  
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  
  // If already logged in, redirect to vote page
  React.useEffect(() => {
    if (user) {
      navigate('/vote');
    }
  }, [user, navigate]);

  // Fetch banner images on load
  useEffect(() => {
    const fetchBannerImages = async () => {
      try {
        // First check localStorage
        const localBanner1 = localStorage.getItem('login_banner1');
        const localBanner2 = localStorage.getItem('login_banner2');
        
        if (localBanner1 || localBanner2) {
          // Use localStorage values if available
          setBannerImages({
            banner1: localBanner1 || '',
            banner2: localBanner2 || ''
          });
        } else {
          // Fall back to database if localStorage is empty
          try {
            const { data, error } = await supabase
              .from('site_settings')
              .select('key, value')
              .in('key', ['login_banner1', 'login_banner2'])
              .order('key');
              
            if (error) throw error;
            
            if (data && data.length > 0) {
              const images = {
                banner1: '',
                banner2: ''
              };
              
              data.forEach(item => {
                if (item.key === 'login_banner1') {
                  images.banner1 = item.value;
                  // Also save to localStorage for future use
                  if (item.value) localStorage.setItem('login_banner1', item.value);
                } else if (item.key === 'login_banner2') {
                  images.banner2 = item.value;
                  // Also save to localStorage for future use
                  if (item.value) localStorage.setItem('login_banner2', item.value);
                }
              });
              
              setBannerImages(images);
            }
          } catch (dbError) {
            console.error('Error fetching banner images from database:', dbError);
          }
        }
      } catch (error) {
        console.error('Error fetching banner images:', error);
      }
    };
    
    fetchBannerImages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      const { error, data } = await signUp(email, password);
      
      if (error) throw error;
      
      // Check if email confirmation is needed (based on auto-confirm settings)
      if (data?.user && !data.user.confirmed_at) {
        setSuccess(true);
      } else {
        navigate('/vote');
      }
    } catch (err: any) {
      console.error('Error signing up:', err);
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="text-xs text-[#9ACD32] uppercase tracking-wide p-2 absolute top-0 left-0 z-10">
        REGISTER PAGE
      </div>
      
      {/* Main container */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Column: Banner Image */}
        <div className="w-full md:w-1/3 bg-black p-2 relative overflow-hidden min-h-[200px] md:min-h-0">
          <div className="w-full h-full border border-[#9ACD32]/30 rounded-md overflow-hidden relative flex items-center justify-center bg-black">
            {bannerImages.banner1 ? (
              <img 
                src={bannerImages.banner1} 
                alt="Left banner" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-48 md:h-full bg-[#9ACD32] flex items-center justify-center text-black font-mono relative">
                <div className="absolute inset-0 bg-black opacity-10 z-0" 
                  style={{ 
                    backgroundImage: 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.1) 50%)', 
                    backgroundSize: '100% 4px'
                  }}>
                </div>
                &lt;/banner provision 1&gt;
              </div>
            )}
          </div>
        </div>
        
        {/* Center Column: Registration Form */}
        <div className="w-full md:w-1/3 bg-black p-4 relative">
          <div className="mb-2">
            <Banner 
              title="MIDNIGHTREBELS &FRIENDS"
              subtitle="REGISTRATION FORM"
            />
          </div>
          
          <div className="w-full h-full border border-[#9ACD32]/30 rounded-md p-4 bg-black">
            {error && (
              <motion.div 
                className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded-md text-red-300 text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center">
                  <Terminal size={16} className="mr-2 flex-shrink-0" />
                  <div>{error}</div>
                </div>
              </motion.div>
            )}
            
            {success ? (
              <motion.div 
                className="p-5 bg-green-900/30 border border-green-500 rounded-md text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-xl font-mono text-[#9ACD32] mb-2">Verification Email Sent</h2>
                <p className="text-gray-300 mb-4">
                  Please check your email to verify your account before logging in.
                </p>
                <Link to="/login">
                  <Button variant="primary" fullWidth>
                    Go to Login
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-3 pl-10 bg-black border border-[#9ACD32] text-white font-mono focus:outline-none focus:border-white"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-3 pl-10 bg-black border border-[#9ACD32] text-white font-mono focus:outline-none focus:border-white"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-3 pl-10 bg-black border border-[#9ACD32] text-white font-mono focus:outline-none focus:border-white"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  className="w-full py-3 bg-[#9ACD32] text-black font-bold font-mono hover:bg-[#8bbc2d] transition-colors flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? 'Signing Up...' : (
                    <>
                      <span className="mr-2">SIGN UP</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
                
                <div className="mt-4 text-center text-xs text-gray-400">
                  Already have an account?{" "}
                  <Link to="/login" className="text-[#9ACD32] hover:underline">
                    Sign In
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
        
        {/* Right Column: Banner */}
        <div className="w-full md:w-1/3 bg-black p-2 relative overflow-hidden min-h-[200px] md:min-h-0">
          <div className="w-full h-full border border-[#9ACD32]/30 rounded-md overflow-hidden relative flex items-center justify-center bg-black">
            {bannerImages.banner2 ? (
              <img 
                src={bannerImages.banner2} 
                alt="Right banner" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-48 md:h-full bg-[#9ACD32] flex items-center justify-center text-black font-mono relative">
                <div className="absolute inset-0 bg-black opacity-10 z-0" 
                  style={{ 
                    backgroundImage: 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.1) 50%)', 
                    backgroundSize: '100% 4px'
                  }}>
                </div>
                &lt;/banner provision 2&gt;
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;