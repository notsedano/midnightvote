import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Terminal } from 'lucide-react';
import Layout from '../components/Layout';
import Banner from '../components/Banner';
import Button from '../components/Button';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  
  // If already logged in, redirect to vote page
  React.useEffect(() => {
    if (user) {
      navigate('/vote');
    }
  }, [user, navigate]);

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
    <Layout>
      <Banner 
        title="MIDNIGHTREBELS &FRIENDS"
        subtitle="REGISTRATION FORM"
      />
      
      <div className="container mx-auto px-4 py-4 flex flex-col items-center justify-center max-w-md">
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