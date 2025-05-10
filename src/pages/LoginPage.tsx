import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Music, Mail, Lock } from 'lucide-react';
import Banner from '../components/Banner';
import { supabase } from '../lib/supabase';
import { ArrowRight } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // If already logged in, redirect to vote page
  React.useEffect(() => {
    if (user) {
      navigate('/vote');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) throw error;
      
      navigate('/vote');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  // Add makeAdmin function
  const makeAdmin = async () => {
    if (!user) {
      setError("You must be logged in to become an admin.");
      return;
    }
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', user.id);
        
      if (error) throw error;
      
      alert("Successfully made you an admin. Please refresh the page and navigate to /admin");
    } catch (err) {
      console.error('Error making admin:', err);
      setError('Failed to make you an admin. Check console for details.');
    }
  };
  
  // Add function to make specific email admin
  const makeSpecificUserAdmin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First try to update by email
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('email', 'contact.strodano@gmail.com');
        
      if (updateError) {
        console.warn('Update by email failed:', updateError.message);
        
        // Attempt to find the user first
        const { data: userData, error: fetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', 'contact.strodano@gmail.com')
          .single();
          
        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // Profile doesn't exist, try to create it
            // First get the user's auth ID if possible
            const { data: authData } = await supabase
              .from('auth.users')
              .select('id')
              .eq('email', 'contact.strodano@gmail.com')
              .single();
              
            const userId = authData?.id || 'missing-id';
            
            // Create the profile with admin rights
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                email: 'contact.strodano@gmail.com',
                is_admin: true,
                created_at: new Date().toISOString()
              });
              
            if (insertError) {
              throw new Error(`Failed to create profile: ${insertError.message}`);
            }
            
            alert("Successfully created admin profile for contact.strodano@gmail.com. Please log in with that account.");
          } else {
            throw fetchError;
          }
        } else {
          // Found the user, now update by ID
          const { error: updateByIdError } = await supabase
            .from('profiles')
            .update({ is_admin: true })
            .eq('id', userData.id);
            
          if (updateByIdError) throw updateByIdError;
          
          alert("Successfully made contact.strodano@gmail.com an admin. Please log in with that account and navigate to /admin");
        }
      } else {
        alert("Successfully made contact.strodano@gmail.com an admin. Please log in with that account and navigate to /admin");
      }
    } catch (err: any) {
      console.error('Error making specific user admin:', err);
      setError('Failed to update admin status: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Add function to diagnose admin status
  const checkAdminStatus = async () => {
    if (!user) {
      setError("You must be logged in to check admin status.");
      return;
    }
    
    try {
      // Force refresh profile data
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
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
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <Banner 
        imageUrl="https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800"
        title="Midnight Rebels"
        subtitle="DJ Competition"
      />
      
      <div className="container mx-auto px-4 pt-10 pb-20">
        <div className="max-w-md mx-auto card">
          <h2 className="text-xl font-mono text-primary-400 mb-6">Login</h2>
          
          {error && (
            <div className="bg-error-900 text-white p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          
          {location.state?.message && (
            <div className="bg-dark-700 p-3 rounded-md mb-4">
              {location.state.message}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm mb-1">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
                placeholder="your@email.com"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm mb-1">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full"
                placeholder="••••••••"
                required
              />
            </div>
            
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Login'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary-400 hover:underline">
                Register
              </Link>
            </p>
          </div>
          
          {/* Temporary admin buttons */}
          {user && (
            <div className="mt-4 pt-4 border-t border-dark-700">
              <button
                onClick={makeAdmin}
                className="w-full bg-dark-800 hover:bg-dark-700 text-white py-2 rounded-md text-sm mb-2"
              >
                Make Me Admin
              </button>
              <button
                onClick={makeSpecificUserAdmin}
                className="w-full bg-dark-800 hover:bg-primary-900 text-white py-2 rounded-md text-sm mb-2"
              >
                Make contact.strodano@gmail.com Admin
              </button>
              <button
                onClick={checkAdminStatus}
                className="w-full bg-dark-800 hover:bg-blue-900 text-white py-2 rounded-md text-sm"
              >
                Check Admin Status
              </button>
              <p className="text-xs text-gray-500 mt-2">
                After becoming admin, try signing out and back in, then go to /admin
              </p>
              <div className="mt-4 pt-2 border-t border-dark-700">
                <Link 
                  to="/debug" 
                  className="text-sm text-primary-400 hover:underline flex items-center justify-center"
                >
                  <span className="mr-1">🔧</span> Access Debug Page
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;