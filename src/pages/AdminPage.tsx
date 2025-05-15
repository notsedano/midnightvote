import React, { useState, useEffect } from 'react';
import { useVoting } from '../contexts/VotingContext';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import Banner from '../components/Banner';
import LoadingScreen from '../components/LoadingScreen';
import { Trash2, RefreshCw, PlusCircle, BarChart2, Users, Award, Terminal, Edit2, Youtube, X, Upload, Image as ImageIcon } from 'lucide-react';
import VoteChart from '../components/VoteChart';
import { supabase } from '../lib/supabase';
import IpTrackingPanel from '../components/IpTrackingPanel';
import Footer from '../components/Footer';

const AdminPage: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const { candidates, fetchCandidates, isLoading, voteCounts, updateCandidate } = useVoting();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [newCandidateName, setNewCandidateName] = useState('');
  const [newCandidateGenre, setNewCandidateGenre] = useState('');
  const [voterCount, setVoterCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    genre: '',
    youtube_url: '',
  });
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<'banner1' | 'banner2' | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [bannerImages, setBannerImages] = useState({
    banner1: '',
    banner2: ''
  });
  
  // Get voter count and banner images
  useEffect(() => {
    const fetchVoterCount = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('has_voted', true);
          
        if (error) throw error;
        if (data) setVoterCount(data.length);
      } catch (error) {
        console.error('Error fetching voter count:', error);
      }
    };
    
    const fetchBannerImages = async () => {
      try {
        // Check localStorage first
        const localBanner1 = localStorage.getItem('login_banner1');
        const localBanner2 = localStorage.getItem('login_banner2');
        
        // Initialize with localStorage values if available
        const images = {
          banner1: localBanner1 || '',
          banner2: localBanner2 || ''
        };
        
        // Only fetch from Supabase if not found in localStorage
        if (!localBanner1 || !localBanner2) {
          try {
            const { data, error } = await supabase
              .from('site_settings')
              .select('key, value')
              .in('key', ['login_banner1', 'login_banner2'])
              .order('key');
                
            if (error) throw error;
            
            if (data && data.length > 0) {
              data.forEach(item => {
                if (item.key === 'login_banner1' && !localBanner1) {
                  images.banner1 = item.value;
                  // Also save to localStorage for future use
                  localStorage.setItem('login_banner1', item.value);
                } else if (item.key === 'login_banner2' && !localBanner2) {
                  images.banner2 = item.value;
                  // Also save to localStorage for future use
                  localStorage.setItem('login_banner2', item.value);
                }
              });
            }
          } catch (dbErr) {
            console.warn('Failed to fetch images from database, using localStorage only:', dbErr);
          }
        }
        
        setBannerImages(images);
      } catch (error) {
        console.error('Error fetching banner images:', error);
      }
    };
    
    fetchVoterCount();
    fetchBannerImages();
  }, []);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCandidates();
    setTimeout(() => setIsRefreshing(false), 1000);
  };
  
  const handleDeleteCandidate = async (id: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this candidate?');
    if (!confirmed) return;
    
    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      fetchCandidates();
    } catch (error) {
      console.error('Error deleting candidate:', error);
      setError('Failed to delete candidate');
    }
  };
  
  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidateName.trim() || !newCandidateGenre.trim()) return;
    
    try {
      const { error } = await supabase
        .from('candidates')
        .insert([{ 
          name: newCandidateName,
          genre: newCandidateGenre
        }]);
        
      if (error) throw error;
      setNewCandidateName('');
      setNewCandidateGenre('');
      setShowAddCandidate(false);
      fetchCandidates();
    } catch (error) {
      console.error('Error adding candidate:', error);
      setError('Failed to add candidate');
    }
  };

  const startEditingCandidate = (id: number) => {
    const candidate = candidates.find(c => c.id === id);
    if (!candidate) return;
    
    setEditingCandidate(id);
    setEditFormData({
      name: candidate.name || '',
      genre: candidate.genre || '',
      youtube_url: candidate.youtube_url || '',
    });
  };
  
  const cancelEditing = () => {
    setEditingCandidate(null);
    setEditFormData({
      name: '',
      genre: '',
      youtube_url: '',
    });
  };
  
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidate) return;
    
    try {
      const result = await updateCandidate(editingCandidate, editFormData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update candidate');
      }
      
      // Reset form and editing state
      cancelEditing();
    } catch (err: any) {
      console.error('Error updating candidate:', err);
      setError(err.message || 'Failed to update candidate');
    }
  };
  
  const getYouTubeThumbnail = (url: string) => {
    if (!url) return null;
    
    // Extract video ID from different YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      const videoId = match[2];
      return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
    
    return null;
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedBanner) {
      setError('Please select a banner position first');
      return;
    }
    
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.match('image.*')) {
      setError('Please upload an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeded. Maximum size is 5MB');
      return;
    }
    
    setUploadingImage(true);
    setError(null);
    
    try {
      // Create a FileReader to convert the image to a data URL
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const imageDataUrl = event.target?.result as string;
        
        if (!imageDataUrl) {
          throw new Error('Failed to convert image to data URL');
        }
        
        try {
          // Save the data URL to localStorage
          const key = selectedBanner === 'banner1' ? 'login_banner1' : 'login_banner2';
          localStorage.setItem(key, imageDataUrl);
          
          // Also save to the site_settings table for persistence across sessions
          // This is optional - if you want to remove all Supabase dependencies, you can remove this
          try {
            const { error: updateError } = await supabase
              .from('site_settings')
              .upsert({ 
                key, 
                value: imageDataUrl 
              });
              
            if (updateError) console.warn('Warning: Could not save to database:', updateError);
          } catch (dbErr) {
            console.warn('Warning: Could not save to database:', dbErr);
            // Continue anyway since we saved to localStorage
          }
          
          // Update local state
          setBannerImages(prev => ({
            ...prev,
            [selectedBanner]: imageDataUrl
          }));
          
          // Reset form
          setSelectedBanner(null);
          setShowImageUploader(false);
          
        } catch (err: any) {
          console.error('Error saving image:', err);
          setError(err.message || 'Failed to save image');
        } finally {
          setUploadingImage(false);
        }
      };
      
      reader.onerror = () => {
        setError('Failed to read the image file');
        setUploadingImage(false);
      };
      
      // Read the image file as a data URL
      reader.readAsDataURL(file);
      
    } catch (err: any) {
      console.error('Error handling image:', err);
      setError(err.message || 'Failed to process image');
      setUploadingImage(false);
    }
  };
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-dark-950 text-white flex flex-col items-center justify-center p-4">
        <Terminal size={48} className="text-[#9ACD32] mb-4" />
        <div className="font-mono text-[#9ACD32] text-xl mb-2">ACCESS DENIED</div>
        <p className="text-gray-400 max-w-md text-center font-mono">
          Unauthorized access attempt logged. This incident will be reported.
        </p>
      </div>
    );
  }

  // Calculate total votes
  const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="min-h-screen bg-black font-mono pb-20 flex flex-col">
      <Banner 
        title="ADMIN CONTROL PANEL" 
        subtitle="SYSTEM MANAGEMENT INTERFACE"
      />
      
      <div className="container mx-auto px-4 py-2 flex-1">
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500 text-red-300 rounded-md flex items-center">
            <span className="mr-2">ERROR:</span> {error}
            <button 
              className="ml-auto text-red-300 hover:text-red-100"
              onClick={() => setError(null)}
            >
              ×
            </button>
          </div>
        )}
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-black border border-[#9ACD32]/30 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">CANDIDATES</span>
              <Award size={18} className="text-[#9ACD32]" />
            </div>
            <div className="text-2xl text-[#9ACD32]">{candidates.length}</div>
          </div>
          
          <div className="p-4 bg-black border border-[#9ACD32]/30 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">VOTERS</span>
              <Users size={18} className="text-[#9ACD32]" />
            </div>
            <div className="text-2xl text-[#9ACD32]">{voterCount}</div>
          </div>
          
          <div className="p-4 bg-black border border-[#9ACD32]/30 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">TOTAL VOTES</span>
              <BarChart2 size={18} className="text-[#9ACD32]" />
            </div>
            <div className="text-2xl text-[#9ACD32]">{totalVotes}</div>
          </div>
        </div>
        
        {/* Image Upload Section */}
        <div className="mb-6 p-4 bg-black border border-[#9ACD32]/30 rounded-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg text-[#9ACD32]">Login Page Banners</h2>
            <button 
              onClick={() => setShowImageUploader(!showImageUploader)}
              className="flex items-center text-sm bg-[#9ACD32]/10 border border-[#9ACD32]/50 text-[#9ACD32] px-3 py-1 rounded hover:bg-[#9ACD32]/20 transition duration-200"
            >
              <Upload size={14} className="mr-1" />
              {showImageUploader ? 'Cancel' : 'Upload Image'}
            </button>
          </div>
          
          {showImageUploader && (
            <div className="mb-6 p-4 bg-black border border-[#9ACD32]/20 rounded-md">
              <div className="mb-4">
                <h3 className="text-sm text-[#9ACD32] mb-2">Select Banner Position</h3>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setSelectedBanner('banner2')}
                    className={`px-3 py-2 rounded-md text-xs ${
                      selectedBanner === 'banner2' 
                        ? 'bg-[#9ACD32] text-black' 
                        : 'bg-[#9ACD32]/10 border border-[#9ACD32]/30 text-[#9ACD32]'
                    }`}
                  >
                    Right Banner
                  </button>
                </div>
              </div>
              
              <div className="mb-2">
                <label className="block text-gray-400 text-xs mb-2">Upload Image (Max 5MB, JPG/PNG/GIF)</label>
                <div className="flex">
                  <label className="flex-1 cursor-pointer bg-[#9ACD32]/5 border border-[#9ACD32]/30 text-white rounded-md overflow-hidden flex items-center">
                    <span className="px-3 py-2 flex-1 truncate">
                      {uploadingImage ? 'Uploading...' : 'Choose file'}
                    </span>
                    <div className="bg-[#9ACD32]/10 h-full px-3 flex items-center">
                      <ImageIcon size={16} className="text-[#9ACD32]" />
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={!selectedBanner || uploadingImage}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Recommended dimensions: 800x1200px (portrait)
                </p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-2 border border-[#9ACD32]/30 rounded-md">
              <h3 className="text-sm text-gray-400 mb-2">Ad Banner</h3>
              <div className="aspect-[3/4] bg-dark-900 border border-[#9ACD32]/20 rounded flex items-center justify-center overflow-hidden relative">
                {bannerImages.banner1 ? (
                  <>
                    <img 
                      src={bannerImages.banner1} 
                      alt="Ad banner" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-60 transition-opacity flex items-center justify-center opacity-0 hover:opacity-100">
                      <div className="flex">
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this banner image?')) {
                              // Remove from localStorage
                              localStorage.removeItem('login_banner1');
                              // Update state
                              setBannerImages(prev => ({
                                ...prev,
                                banner1: ''
                              }));
                              // Optionally remove from database too
                              try {
                                supabase
                                  .from('site_settings')
                                  .update({ value: '' })
                                  .eq('key', 'login_banner1')
                                  .then(({ error }) => {
                                    if (error) console.warn('Warning: Could not update database:', error);
                                  });
                              } catch (err) {
                                console.warn('Error updating database:', err);
                              }
                            }
                          }}
                          className="bg-red-900/20 hover:bg-red-900/40 text-red-400 p-2 rounded-md"
                          title="Delete image"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-600 text-xs font-mono flex flex-col items-center">
                    <ImageIcon size={24} className="mb-2 opacity-50" />
                    <span className="text-center px-4">Ad banner content is managed by system admin</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-2 border border-[#9ACD32]/30 rounded-md">
              <h3 className="text-sm text-gray-400 mb-2">Right Banner</h3>
              <div className="aspect-[3/4] bg-dark-900 border border-[#9ACD32]/20 rounded flex items-center justify-center overflow-hidden relative">
                {bannerImages.banner2 ? (
                  <>
                    <img 
                      src={bannerImages.banner2} 
                      alt="Right login banner" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-60 transition-opacity flex items-center justify-center opacity-0 hover:opacity-100">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedBanner('banner2')}
                          className="bg-[#9ACD32]/20 hover:bg-[#9ACD32]/40 text-[#9ACD32] p-2 rounded-md"
                          title="Change image"
                        >
                          <Upload size={18} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this banner image?')) {
                              // Remove from localStorage
                              localStorage.removeItem('login_banner2');
                              // Update state
                              setBannerImages(prev => ({
                                ...prev,
                                banner2: ''
                              }));
                              // Optionally remove from database too
                              try {
                                supabase
                                  .from('site_settings')
                                  .update({ value: '' })
                                  .eq('key', 'login_banner2')
                                  .then(({ error }) => {
                                    if (error) console.warn('Warning: Could not update database:', error);
                                  });
                              } catch (err) {
                                console.warn('Error updating database:', err);
                              }
                            }
                          }}
                          className="bg-red-900/20 hover:bg-red-900/40 text-red-400 p-2 rounded-md"
                          title="Delete image"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-600 text-xs font-mono flex flex-col items-center">
                    <ImageIcon size={24} className="mb-2 opacity-50" />
                    No image set
                    <button
                      onClick={() => setSelectedBanner('banner2')}
                      className="mt-2 bg-[#9ACD32]/10 hover:bg-[#9ACD32]/20 text-[#9ACD32] px-3 py-1 rounded text-xs"
                    >
                      Set Image
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* IP Tracking Panel */}
        <IpTrackingPanel />
        
        {/* Vote Distribution */}
        <div className="mb-6 p-4 bg-black border border-[#9ACD32]/30 rounded-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg text-[#9ACD32]">Vote Distribution</h2>
            <button 
              onClick={handleRefresh}
              className="text-[#9ACD32] hover:text-white transition duration-200"
              disabled={isRefreshing}
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
          
          <div className="h-64">
            <VoteChart candidates={candidates} voteCounts={voteCounts} />
          </div>
        </div>
        
        {/* Candidate Management */}
        <div className="p-4 bg-black border border-[#9ACD32]/30 rounded-md mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg text-[#9ACD32]">Candidate Management</h2>
            <button 
              onClick={() => setShowAddCandidate(!showAddCandidate)}
              className="flex items-center text-sm bg-[#9ACD32]/10 border border-[#9ACD32]/50 text-[#9ACD32] px-3 py-1 rounded hover:bg-[#9ACD32]/20 transition duration-200"
            >
              <PlusCircle size={14} className="mr-1" />
              {showAddCandidate ? 'Cancel' : 'Add DJ'}
            </button>
          </div>
          
          {showAddCandidate && (
            <form onSubmit={handleAddCandidate} className="mb-4 p-3 bg-black border border-[#9ACD32]/30 rounded-md">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[#9ACD32]/70 mb-1">DJ Name</label>
                  <input
                    type="text"
                    value={newCandidateName}
                    onChange={(e) => setNewCandidateName(e.target.value)}
                    placeholder="Enter DJ name"
                    className="flex-1 bg-black border border-[#9ACD32]/50 text-white px-3 py-2 rounded-md focus:outline-none focus:border-[#9ACD32] w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#9ACD32]/70 mb-1">Genre</label>
                  <input
                    type="text"
                    value={newCandidateGenre}
                    onChange={(e) => setNewCandidateGenre(e.target.value)}
                    placeholder="e.g. EDM/HOUSE"
                    className="flex-1 bg-black border border-[#9ACD32]/50 text-white px-3 py-2 rounded-md focus:outline-none focus:border-[#9ACD32] w-full"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button 
                    type="submit" 
                    className="bg-[#9ACD32]/10 border border-[#9ACD32]/50 text-[#9ACD32] px-4 py-2 rounded hover:bg-[#9ACD32]/20 transition duration-200"
                    disabled={!newCandidateName.trim() || !newCandidateGenre.trim()}
                  >
                    Add DJ
                  </button>
                </div>
              </div>
            </form>
          )}
          
          <div className="space-y-4">
            {candidates.map((candidate) => (
              <div 
                key={candidate.id}
                className={`p-3 bg-black border ${editingCandidate === candidate.id ? 'border-[#9ACD32]' : 'border-[#9ACD32]/30'} rounded-md`}
              >
                {editingCandidate === candidate.id ? (
                  <form onSubmit={handleEditSubmit} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[#9ACD32] text-sm">EDITING DJ #{candidate.id}</h3>
                      <button 
                        type="button"
                        onClick={cancelEditing}
                        className="text-gray-400 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">DJ Name</label>
                        <input
                          type="text"
                          name="name"
                          value={editFormData.name}
                          onChange={handleEditFormChange}
                          className="w-full bg-black border border-[#9ACD32]/50 text-white px-3 py-2 rounded-md focus:outline-none focus:border-[#9ACD32]"
                          placeholder="DJ Name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Genre</label>
                        <input
                          type="text"
                          name="genre"
                          value={editFormData.genre}
                          onChange={handleEditFormChange}
                          className="w-full bg-black border border-[#9ACD32]/50 text-white px-3 py-2 rounded-md focus:outline-none focus:border-[#9ACD32]"
                          placeholder="EDM/HOUSE"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">YouTube Video URL</label>
                        <div className="flex">
                          <input
                            type="text"
                            name="youtube_url"
                            value={editFormData.youtube_url}
                            onChange={handleEditFormChange}
                            className="flex-1 bg-black border border-[#9ACD32]/50 text-white px-3 py-2 rounded-l-md focus:outline-none focus:border-[#9ACD32]"
                            placeholder="https://www.youtube.com/watch?v=..."
                          />
                          <div className="bg-[#9ACD32]/10 border-t border-r border-b border-[#9ACD32]/50 flex items-center px-3 rounded-r-md">
                            <Youtube size={16} className="text-[#9ACD32]" />
                          </div>
                        </div>
                      </div>
                      
                      {editFormData.youtube_url && getYouTubeThumbnail(editFormData.youtube_url) && (
                        <div className="border border-[#9ACD32]/30 p-1 mt-2">
                          <img 
                            src={getYouTubeThumbnail(editFormData.youtube_url)!} 
                            alt="YouTube thumbnail preview" 
                            className="w-full h-32 object-cover opacity-70"
                          />
                          <div className="text-xs text-[#9ACD32]/70 text-center mt-1">Thumbnail Preview</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end pt-2">
                      <button 
                        type="button"
                        onClick={cancelEditing}
                        className="bg-black border border-gray-600 text-gray-300 px-3 py-1 rounded mr-2 text-sm"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="bg-[#9ACD32]/10 border border-[#9ACD32]/50 text-[#9ACD32] px-3 py-1 rounded text-sm"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex justify-between items-center">
                    <div className="flex-1 pr-3">
                      <div className="flex items-center mb-1">
                        <div className="text-white mr-2 text-sm font-medium truncate">{candidate.name}</div>
                        {candidate.youtube_url && (
                          <Youtube size={14} className="text-[#9ACD32] opacity-70 flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        Genre: {candidate.genre || "Not set"} | Votes: {voteCounts[candidate.id] || 0}
                      </div>
                    </div>
                    <div className="flex items-center flex-shrink-0 ml-2">
                      <button 
                        onClick={() => startEditingCandidate(candidate.id)}
                        className="text-[#9ACD32]/70 hover:text-[#9ACD32] transition duration-200 mr-2 p-1"
                        aria-label="Edit candidate"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCandidate(candidate.id)}
                        className="text-red-400 hover:text-red-300 transition duration-200 p-1"
                        aria-label="Delete candidate"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {candidates.length === 0 && (
              <div className="text-center py-6 text-gray-400">
                No candidates found. Add a DJ to get started.
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
      <Navigation />
    </div>
  );
};

export default AdminPage;