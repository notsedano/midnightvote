import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Terminal, ShieldCheck, RefreshCw, Shield, Facebook, Wifi } from 'lucide-react';
import Layout from '../components/Layout';
import Banner from '../components/Banner';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';

// CAPTCHA Component
const CyberCaptcha: React.FC<{ onVerify: (verified: boolean) => void }> = ({ onVerify }) => {
  const [captchaCode, setCaptchaCode] = useState<string[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isVerified, setIsVerified] = useState(false);
  const [showError, setShowError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate random captcha code on component mount
  useEffect(() => {
    generateCaptcha();
  }, []);

  // Generate a new captcha code
  const generateCaptcha = () => {
    // Create a cyberpunk-style captcha code with special characters
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789@#$%&';
    const codeLength = 6;
    let code = [];
    
    for (let i = 0; i < codeLength; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      code.push(chars[randomIndex]);
    }
    
    setCaptchaCode(code);
    setUserInput('');
    setIsVerified(false);
    setShowError(false);
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Verify the entered captcha code
  const verifyCaptcha = () => {
    const isValid = userInput.toUpperCase() === captchaCode.join('');
    setIsVerified(isValid);
    setShowError(!isValid);
    onVerify(isValid);
    
    if (!isValid) {
      generateCaptcha();
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value.toUpperCase());
    setShowError(false);
  };

  // Handle keypress to verify on enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      verifyCaptcha();
    }
  };

  return (
    <div className="mb-6">
      <div className="border border-[#9ACD32] bg-black/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Shield className="text-[#9ACD32] h-4 w-4 mr-1.5" />
            <span className="text-[#9ACD32] font-mono text-sm">SECURITY VERIFICATION</span>
          </div>
          <button 
            type="button" 
            onClick={generateCaptcha}
            className="text-gray-400 hover:text-[#9ACD32] transition-colors"
            aria-label="Refresh CAPTCHA"
          >
            <RefreshCw size={14} />
          </button>
        </div>
        
        {/* CAPTCHA Display */}
        <div className="border border-[#9ACD32]/40 bg-black/40 p-3 mb-3 select-none">
          <div className="flex justify-center space-x-1">
            {captchaCode.map((char, index) => (
              <div 
                key={index}
                className="relative"
              >
                <div 
                  className="w-8 h-10 flex items-center justify-center text-[#9ACD32] font-mono font-bold text-lg"
                  style={{
                    transform: `rotate(${Math.random() * 10 - 5}deg)`,
                    textShadow: '0 0 5px rgba(154, 205, 50, 0.7)'
                  }}
                >
                  {char}
                </div>
                {/* Random noise lines */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-30"
                  style={{
                    background: `repeating-linear-gradient(
                      ${Math.random() * 180}deg,
                      transparent,
                      #9ACD32 ${Math.random() * 2 + 1}px,
                      transparent ${Math.random() * 3 + 2}px
                    )`
                  }}
                ></div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            maxLength={captchaCode.length}
            placeholder="Enter code"
            className={`font-mono bg-black border ${
              isVerified 
                ? 'border-[#9ACD32]' 
                : showError 
                  ? 'border-red-500' 
                  : 'border-[#9ACD32]/50'
            } text-white p-2 w-full focus:outline-none`}
            aria-label="CAPTCHA verification code"
          />
          <button
            type="button"
            onClick={verifyCaptcha}
            className="ml-2 bg-[#9ACD32]/20 hover:bg-[#9ACD32]/30 border border-[#9ACD32]/50 text-[#9ACD32] px-3 py-2 font-mono"
          >
            Verify
          </button>
        </div>
        
        {showError && (
          <div className="text-red-500 text-xs font-mono mt-2 flex items-center">
            <Terminal size={12} className="mr-1" />
            Invalid code. Try again.
          </div>
        )}
        
        {isVerified && (
          <div className="text-[#9ACD32] text-xs font-mono mt-2 flex items-center">
            <ShieldCheck size={12} className="mr-1" />
            Verification complete.
          </div>
        )}
      </div>
    </div>
  );
};

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [userIp, setUserIp] = useState('');
  
  const { signUp, user, signInWithOAuth } = useAuth();
  const navigate = useNavigate();
  
  // If already logged in, redirect to vote page
  React.useEffect(() => {
    if (user) {
      navigate('/vote');
    }
  }, [user, navigate]);

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
    
    if (!captchaVerified) {
      setError('Please complete the security verification');
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
        
        // Store user IP for later use when user confirms email
        if (data.user && userIp) {
          try {
            // Store the IP in localStorage so we can update it when the user confirms their email
            localStorage.setItem(`registration_ip_${data.user.id}`, userIp);
            console.log(`Stored registration IP ${userIp} for user ${data.user.id}`);
          } catch (ipError) {
            console.error('Error storing registration IP:', ipError);
          }
        }
      } else {
        // If email confirmation not needed, user is already logged in
        if (data?.user && userIp) {
          // Update IP directly since user is confirmed immediately
          await updateUserIp(data.user.id, userIp);
        }
        navigate('/vote');
      }
    } catch (err: any) {
      console.error('Error signing up:', err);
      setError(err.message || 'Failed to sign up');
      setCaptchaVerified(false); // Reset CAPTCHA on error
    } finally {
      setLoading(false);
    }
  };

  // Helper function to update user IP (similar to the one in AuthContext)
  const updateUserIp = async (userId: string, ipAddress: string) => {
    if (!userId || !ipAddress) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ metadata: { registration_ip: ipAddress, registration_date: new Date().toISOString() } })
        .eq('id', userId);
        
      if (error) console.error('Error updating profile with registration IP:', error);
    } catch (e) {
      console.error('Unexpected error storing registration IP:', e);
    }
  };

  const handleFacebookSignUp = async () => {
    if (!captchaVerified) {
      setError('Please complete the security verification first');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Store the current IP in session storage so we can use it after the OAuth redirect
      if (userIp) {
        sessionStorage.setItem('registration_ip', userIp);
        sessionStorage.setItem('registration_time', new Date().toISOString());
      }
      
      const { error } = await signInWithOAuth('facebook');
      if (error) throw error;
      // Navigation is handled by the redirect in signInWithOAuth
    } catch (err: any) {
      console.error('Facebook registration error:', err);
      setError(err.message || 'Failed to register with Facebook. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Banner 
        title="MIDNIGHTREBELS &FRIENDS"
        subtitle="REGISTRATION FORM"
      />
      
      <div className="container mx-auto px-4 py-4 flex flex-col items-center justify-center max-w-md">
        {/* IP Address Display */}
        <div className="w-full flex items-center justify-center mb-4 py-2 px-3 bg-black/50 border border-[#9ACD32]/30 rounded-md">
          <Wifi size={16} className="text-[#9ACD32] mr-2" />
          <span className="text-gray-300 font-mono text-sm">Your IP Address: </span>
          <span className="text-white font-mono font-bold text-sm ml-1">{userIp || 'Detecting...'}</span>
        </div>
        
        {/* Registration Form */}
        <div className="w-full border border-[#9ACD32] p-6 bg-black rounded-sm mb-8">
          {error && (
            <motion.div 
              className="mb-4 p-3 bg-error-900/30 border border-error-700 rounded-md text-error-300 text-sm"
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
              className="p-5 bg-success-900/30 border border-success-700 rounded-md text-center"
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
              
              <div className="mb-4">
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
              
              {/* CAPTCHA Component */}
              <CyberCaptcha onVerify={setCaptchaVerified} />
              
              <button 
                type="submit" 
                className={`w-full py-3 font-bold font-mono flex items-center justify-center transition-colors ${
                  captchaVerified 
                    ? 'bg-[#9ACD32] text-black hover:bg-[#8bbc2d]' 
                    : 'bg-[#9ACD32]/40 text-black/70 cursor-not-allowed'
                }`}
                disabled={loading || !captchaVerified}
              >
                {loading ? 'Signing Up...' : (
                  <>
                    <span className="mr-2">SIGN UP</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
              
              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-[#9ACD32]/30"></div>
                <span className="flex-shrink mx-4 text-xs text-gray-400">OR</span>
                <div className="flex-grow border-t border-[#9ACD32]/30"></div>
              </div>
              
              <button 
                type="button"
                className="w-full py-3 font-bold font-mono flex items-center justify-center transition-colors bg-[#1877F2]/10 border border-[#1877F2]/40 text-white/70 hover:bg-[#1877F2]/10 opacity-80 cursor-not-allowed"
                disabled={true}
              >
                <Facebook className="mr-2 text-[#1877F2]/80" size={16} />
                <span>SIGN UP WITH FACEBOOK</span>
              </button>
              <div className="text-center mt-1">
                <span className="text-xs font-mono text-[#9ACD32]/70 tracking-wider">COMING SOON</span>
              </div>
              
              <div className="text-center mt-6">
                <p className="text-gray-300 text-sm">
                  Already have an account?
                </p>
                <Link to="/login" className="text-[#9ACD32] font-mono hover:underline">
                  Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
        
        {/* Banner */}
        <div className="w-full border border-[#9ACD32] bg-[#9ACD32]/10 p-6 text-center font-mono text-[#9ACD32]">
          &lt;/banner provision 2&gt;
        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;