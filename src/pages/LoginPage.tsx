import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Terminal } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getBannerUrl } from '../lib/bannerService';
import Footer from '../components/Footer';
import LoadingScreen from '../components/LoadingScreen';

const LoginPage: React.FC = () => {
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bannerImages, setBannerImages] = useState({
    banner1: '',
    banner2: ''
  });
  const [userIp, setUserIp] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  // If already logged in, redirect to vote page
  useEffect(() => {
    if (user) {
      navigate('/vote');
    }
  }, [user, navigate]);

  // Fetch banner images on load
  useEffect(() => {
    // Get banner images from our banner service
    setBannerImages({
      banner1: getBannerUrl('login1'),
      banner2: getBannerUrl('login2')
    });
  }, []);

  // Fetch user's IP address
  useEffect(() => {
    const fetchIpAddress = async () => {
      try {
        // Try to fetch from a free API
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        
        if (data.ip) {
          setUserIp(data.ip);
        } else {
          // Fallback to a random IP-like string if API fails
          generateFakeIp();
        }
      } catch (error) {
        console.error('Error fetching IP address:', error);
        // Generate a random IP-like string as fallback
        generateFakeIp();
      }
    };
    
    const generateFakeIp = () => {
      const randomOctet = () => Math.floor(Math.random() * 256);
      const fakeIp = `${randomOctet()}.${randomOctet()}.${randomOctet()}.${randomOctet()}`;
      setUserIp(fakeIp);
    };
    
    fetchIpAddress();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      console.log("Login attempt for:", email);
      
      // Try a direct fetch to a simpler endpoint first
      // This is a workaround for browsers with CORS issues
      try {
        const response = await fetch(`${window.location.origin}/api/auth-proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log("Auth proxy login success");
          navigate('/vote');
          return;
        }
      } catch (proxyError) {
        console.error("Auth proxy failed:", proxyError);
      }
      
      // Fall back to standard Supabase Auth
      console.log("Falling back to standard authentication");
      
      // Try simplified direct authentication with fewer headers and options
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        const baseUrl = `https://${supabaseUrl}/auth/v1/token?grant_type=password`;
        const headers = {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
        };
        
        const response = await fetch(baseUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ 
            email, 
            password,
            gotrue_meta_security: {}
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("Direct login success");
          
          // Manually set auth session
          localStorage.setItem('sb-refresh-token', data.refresh_token);
          localStorage.setItem('sb-access-token', data.access_token);
          
          // Reload the page to pick up the auth changes
          window.location.href = '/vote';
          return;
        } else {
          throw new Error(`Status ${response.status}: ${await response.text()}`);
        }
      } catch (directError) {
        console.error("Direct fetch login failed:", directError);
      }
      
      // As a last resort, try the standard Supabase Auth login
      const { error } = await signIn(email, password, userIp);
      if (error) throw error;
      
      navigate('/vote');
    } catch (err: any) {
      console.error('Login error details:', err);
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Authenticating..." />;
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="text-xs text-[#9ACD32] uppercase tracking-wide p-2 absolute top-0 left-0 z-10">
        LOGIN PAGE
      </div>
      
      {/* Main container */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Column: Banner Image */}
        <div className="w-full md:w-1/3 bg-black p-2 relative overflow-hidden min-h-[200px] md:min-h-0">
          <div className="w-full h-full border border-[#9ACD32]/30 rounded-md overflow-hidden relative flex items-center justify-center bg-black">
            {bannerImages.banner1 ? (
              <>
                <img 
                  src={bannerImages.banner1} 
                  alt="Left banner" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error("Error loading banner 1:", bannerImages.banner1);
                    // Set the display to none instead of removing the element
                    (e.target as HTMLImageElement).style.display = 'none';
                    // We'll fallback to the default content
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-[#9ACD32] text-xs font-mono" 
                  style={{display: 'none'}} // Hidden by default, will be shown by JavaScript on error
                  ref={(el) => {
                    if (el) {
                      const img = el.previousSibling as HTMLImageElement;
                      if (img) {
                        img.onerror = () => {
                          el.style.display = 'flex';
                        };
                      }
                    }
                  }}
                >
                  Image failed to load - Check URL
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-black flex flex-col font-mono">
                {/* Terminal header */}
                <div className="bg-[#9ACD32] text-black text-xs py-1 px-2 flex justify-between">
                  <span>DJ VOTING CONSOLE v1.0</span>
                  <div>
                    <span>IP: {userIp || '...'}</span>
                    <span className="ml-2">STATUS: ONLINE</span>
                  </div>
                </div>
                {/* Terminal content */}
                <div className="flex-1 p-4 text-[#9ACD32] flex flex-col">
                  <div className="flex items-start">
                    <span className="mr-2">&gt;_</span>
                    <div>
                      <div className="text-2xl md:text-5xl font-bold mb-1">MIDNIGHT REBELS</div>
                      <div className="text-xs md:text-sm font-thin">www.midnightrebels.com</div>
                    </div>
                  </div>
                  <div className="mt-auto text-xs flex justify-between">
                    <span>SESSION: SECURED</span>
                    <span>ACTIVE: ONLINE</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Center Column: Login */}
        <div className="w-full md:w-1/3 p-4 flex flex-col items-center justify-center bg-black">
          <div className="max-w-sm w-full">
            {/* Brand Logo/Title */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 text-center"
            >
              <h2 className="text-[#9ACD32] font-mono text-4xl md:text-6xl">&FRIENDS</h2>
              <h2 className="text-[#9ACD32] font-mono text-lg md:text-xl mb-2">DJ/PRODUCER COMPETITION</h2>
              <div className="text-sm text-gray-400 font-mono">Fair Voting Platform</div>
            </motion.div>
            
            {/* Login Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="w-full bg-black border border-[#9ACD32]/30 rounded-lg p-4 md:p-6"
            >
              {error && (
                <div className="bg-red-900/30 border border-red-700 text-red-300 p-3 rounded-md mb-4 text-sm">
                  {error}
                </div>
              )}
              
              {location.state?.message && (
                <div className="bg-gray-900 p-3 rounded-md mb-4 text-sm">
                  {location.state.message}
                </div>
              )}
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9ACD32] opacity-70" size={16} />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-black border border-[#9ACD32]/30 text-white rounded-md py-2 pl-10 pr-3 w-full focus:outline-none focus:border-[#9ACD32]/70 transition-colors"
                      placeholder="Email"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9ACD32] opacity-70" size={16} />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-black border border-[#9ACD32]/30 text-white rounded-md py-2 pl-10 pr-3 w-full focus:outline-none focus:border-[#9ACD32]/70 transition-colors"
                      placeholder="Password"
                      required
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="bg-[#9ACD32] text-black font-mono w-full py-2 rounded-md flex items-center justify-center hover:bg-[#9ACD32]/90 transition-colors"
                >
                  <ArrowRight className="mr-2" size={16} />
                  <span>SIGN IN</span>
                </button>
              </form>
              
              <div className="mt-4 text-center text-xs text-gray-400">
                Don't have an account?{" "}
                <Link to="/register" className="text-[#9ACD32] hover:underline">
                  Sign Up
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Right Column: Banner */}
        <div className="w-full md:w-1/3 bg-black p-2 relative overflow-hidden min-h-[200px] md:min-h-0">
          <div className="w-full h-full border border-[#9ACD32]/30 rounded-md overflow-hidden relative flex items-center justify-center bg-black">
            {bannerImages.banner2 ? (
              <>
                <img 
                  src={bannerImages.banner2} 
                  alt="Right banner" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error("Error loading banner 2:", bannerImages.banner2);
                    // Set the display to none instead of removing the element
                    (e.target as HTMLImageElement).style.display = 'none';
                    // We'll fallback to the default content
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-[#9ACD32] text-xs font-mono" 
                  style={{display: 'none'}} // Hidden by default, will be shown by JavaScript on error
                  ref={(el) => {
                    if (el) {
                      const img = el.previousSibling as HTMLImageElement;
                      if (img) {
                        img.onerror = () => {
                          el.style.display = 'flex';
                        };
                      }
                    }
                  }}
                >
                  Image failed to load - Check URL
                </div>
              </>
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
      
      {/* Admin buttons (hidden in a collapsible panel for cleaner UI) */}
      {user && (
        <div className="fixed bottom-16 right-4 z-20">
          <details className="bg-black border border-[#9ACD32]/30 rounded-md overflow-hidden">
            <summary className="p-2 cursor-pointer flex items-center justify-center text-[#9ACD32]">
              <Terminal size={14} className="mr-2" />
              <span className="text-xs font-mono">Admin Controls</span>
            </summary>
            <div className="p-3 space-y-2">
              <button
                onClick={async () => {
                  if (!user) {
                    setError("You must be logged in to become an admin.");
                    return;
                  }
                  
                  try {
                    const { error } = await fetch('/api/make-admin', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ userId: user.id }),
                    }).then(res => res.json());
                    
                    if (error) throw error;
                    
                    alert("Successfully made you an admin. Please refresh the page and navigate to /admin");
                  } catch (err) {
                    console.error('Error making admin:', err);
                    setError('Failed to make you an admin. Check console for details.');
                  }
                }}
                className="w-full bg-black hover:bg-[#9ACD32]/10 text-[#9ACD32] py-2 rounded-md text-xs font-mono border border-[#9ACD32]/50"
              >
                Make Me Admin
              </button>
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    setError(null);
                    
                    // First try to update by email
                    const { error: updateError } = await fetch('/api/make-specific-admin', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ email: 'contact.strodano@gmail.com' }),
                    }).then(res => res.json());
                    
                    if (updateError) throw updateError;
                    
                    alert("Successfully made contact.strodano@gmail.com an admin. Please log in with that account and navigate to /admin");
                  } catch (err: any) {
                    console.error('Error making specific user admin:', err);
                    setError('Failed to update admin status: ' + err.message);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full bg-black hover:bg-[#9ACD32]/10 text-[#9ACD32] py-2 rounded-md text-xs font-mono border border-[#9ACD32]/50"
              >
                Make contact.strodano@gmail.com Admin
              </button>
              <button
                onClick={async () => {
                  if (!user) {
                    setError("You must be logged in to check admin status.");
                    return;
                  }
                  
                  try {
                    // Force refresh profile data
                    const { data, error } = await fetch('/api/check-admin-status', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ userId: user.id }),
                    }).then(res => res.json());
                    
                    if (error) throw error;
                    
                    // Display status
                    alert(`Admin status check:
                      User ID: ${user.id}
                      Email: ${user.email}
                      Is Admin: ${data.is_admin ? 'YES' : 'NO'}
                      
                      If showing as admin but can't access /admin, try signing out and signing back in.`);
                    
                  } catch (err) {
                    console.error('Error checking admin status:', err);
                    setError('Failed to check admin status. See console for details.');
                  }
                }}
                className="w-full bg-black hover:bg-[#9ACD32]/10 text-[#9ACD32] py-2 rounded-md text-xs font-mono border border-[#9ACD32]/50"
              >
                Check Admin Status
              </button>
              <div className="text-xs text-gray-500 mt-2 font-mono text-center">
                After becoming admin, try signing out and back in, then go to /admin
              </div>
            </div>
          </details>
        </div>
      )}
      
      {/* Footer */}
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default LoginPage;