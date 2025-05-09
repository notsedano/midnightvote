import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Music, Mail, Lock } from 'lucide-react';

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
    <div className="min-h-screen bg-dark-950 flex flex-col">
      {/* Banner image */}
      <div className="w-full h-48 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=800)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-dark-900/80 to-dark-900/30"></div>
        </div>
      </div>
      
      {/* Logo and title */}
      <div className="text-center mt-4 mb-6">
        <Music className="h-12 w-12 mx-auto text-primary-400" />
        <h1 className="text-2xl font-mono text-primary-400 uppercase mt-2">
          Midnight Rebels <br /> & Friends DJ Competition
        </h1>
      </div>
      
      {/* Register form */}
      <div className="w-full max-w-md mx-auto px-6">
        {error && (
          <motion.div 
            className="mb-4 p-3 bg-error-900/30 border border-error-700 rounded-md text-error-300 text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}
        
        {success ? (
          <motion.div 
            className="p-5 bg-success-900/30 border border-success-700 rounded-md text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xl font-mono text-primary-400 mb-2">Verification Email Sent</h2>
            <p className="text-gray-300 mb-4">
              Please check your email to verify your account before logging in.
            </p>
            <Link to="/login" className="btn btn-primary">
              Go to Login
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
                  className="input pl-10"
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
                  className="input pl-10"
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
                  className="input pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary w-full mb-4"
              disabled={loading}
            >
              {loading ? 'Signing Up...' : 'Sign Up'}
            </button>
            
            <p className="text-center text-sm text-gray-400 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300">
                Sign In
              </Link>
            </p>
          </form>
        )}
      </div>
      
      {/* Banner bottom */}
      <div className="mt-auto w-full h-32 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.pexels.com/photos/1587927/pexels-photo-1587927.jpeg?auto=compress&cs=tinysrgb&w=800)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-dark-900/30"></div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;