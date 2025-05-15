import React, { useState, useEffect } from 'react';
import { useVoting } from '../contexts/VotingContext';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import Banner from '../components/Banner';
import LoadingScreen from '../components/LoadingScreen';
import { Trash2, RefreshCw, PlusCircle, BarChart2, Users, Award, Terminal, Edit2, Youtube, X, Link as LinkIcon } from 'lucide-react';
import VoteChart from '../components/VoteChart';
import { supabase } from '../lib/supabase';
import IpTrackingPanel from '../components/IpTrackingPanel';
import Footer from '../components/Footer';
import { updateSiteSetting } from '../utils/storage';

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
  const [selectedBanner, setSelectedBanner] = useState<number>(1); // 1 or 2
  const [bannerUrls, setBannerUrls] = useState<Record<string, string>>({
    banner1: localStorage.getItem('login_banner1') || '',
    banner2: localStorage.getItem('login_banner2') || ''
  });
  const [newBannerUrl, setNewBannerUrl] = useState<string>('');
  const [bannerUpdateSuccess, setBannerUpdateSuccess] = useState(false);
  const [bannerUpdateError, setBannerUpdateError] = useState<string | null>(null);
  
  // Get voter count
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
    
    fetchVoterCount();
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

  const handleBannerUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerUrl.trim()) {
      setBannerUpdateError('Please enter a banner URL');
      return;
    }
    
    // Simple URL validation
    try {
      new URL(newBannerUrl);
    } catch (e) {
      setBannerUpdateError('Please enter a valid URL (must include http:// or https://)');
      return;
    }
    
    setBannerUpdateError(null);
    
    try {
      const settingKey = `login_banner${selectedBanner}`;
      console.log(`Updating site setting: ${settingKey}`);
      
      const { error: updateError } = await updateSiteSetting(settingKey, newBannerUrl);
        
      if (updateError) {
        console.error("Settings update error:", updateError);
        throw updateError;
      }
      
      // Update state to force re-render
      setBannerUrls(prev => ({
        ...prev,
        [`banner${selectedBanner}`]: newBannerUrl
      }));
      
      console.log("Banner updated successfully");
      setBannerUpdateSuccess(true);
      setNewBannerUrl(''); // Clear input field
      
      // Hide success message after 3 seconds
      setTimeout(() => setBannerUpdateSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating banner:', err);
      setBannerUpdateError(err.message || 'Failed to update banner. Check console for details.');
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
      
      <div className="container mx-auto px-4 py-6 flex-1">
        {error && (
          <div className="mb-6 p-3 bg-red-900/30 border border-red-500 text-red-300 rounded-md flex items-center">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
        
        {/* IP Tracking Panel */}
        <IpTrackingPanel />
        
        {/* Vote Distribution */}
        <div className="mb-8 p-6 bg-black border border-[#9ACD32]/30 rounded-md">
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
        <div className="p-6 bg-black border border-[#9ACD32]/30 rounded-md mb-8">
          <div className="flex justify-between items-center mb-6">
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
            <form onSubmit={handleAddCandidate} className="mb-6 p-4 bg-black border border-[#9ACD32]/30 rounded-md">
              <div className="space-y-4">
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
                <div className="flex justify-end pt-2">
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
                className={`p-4 bg-black border ${editingCandidate === candidate.id ? 'border-[#9ACD32]' : 'border-[#9ACD32]/30'} rounded-md`}
              >
                {editingCandidate === candidate.id ? (
                  <form onSubmit={handleEditSubmit} className="space-y-4">
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
                    
                    <div className="space-y-4">
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
                        className="bg-dark-800 text-gray-300 px-3 py-1 rounded mr-2 text-sm"
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
                <div>
                      <div className="flex items-center mb-1">
                        <div className="text-white mr-2">{candidate.name}</div>
                        {candidate.youtube_url && (
                          <Youtube size={14} className="text-[#9ACD32] opacity-70" />
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        Genre: {candidate.genre || "Not set"} | Votes: {voteCounts[candidate.id] || 0}
                      </div>
                </div>
                    <div className="flex items-center">
                      <button 
                        onClick={() => startEditingCandidate(candidate.id)}
                        className="text-[#9ACD32]/70 hover:text-[#9ACD32] transition duration-200 mr-3"
                        aria-label="Edit candidate"
                      >
                        <Edit2 size={16} />
                      </button>
                <button 
                  onClick={() => handleDeleteCandidate(candidate.id)}
                  className="text-red-400 hover:text-red-300 transition duration-200"
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
        
        {/* Banner Management Tool */}
        <div className="p-6 bg-black border border-[#9ACD32]/30 rounded-md mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg text-[#9ACD32]">Banner Management</h2>
          </div>
          
          {bannerUpdateError && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500 text-red-300 rounded-md">
              <div className="font-bold mb-1">Error updating banner:</div>
              <div>{bannerUpdateError}</div>
              <button
                className="mt-2 text-red-300 hover:text-red-100 text-sm"
                onClick={() => setBannerUpdateError(null)}
              >
                Dismiss
              </button>
            </div>
          )}
          
          {bannerUpdateSuccess && (
            <div className="mb-4 p-3 bg-green-900/30 border border-green-500 text-green-300 rounded-md">
              <div className="font-bold">Banner updated successfully!</div>
              <div className="text-sm mt-1">
                The banner URL has been updated and will appear on the login and register pages.
                {localStorage.getItem(`login_banner${selectedBanner}`) && (
                  <div className="mt-2">
                    Banner URL: <span className="text-xs break-all">{localStorage.getItem(`login_banner${selectedBanner}`)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-black border border-[#9ACD32]/30 rounded-md">
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[#9ACD32]">Banner Selection</span>
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setSelectedBanner(1)}
                      className={`px-4 py-2 border ${selectedBanner === 1 ? 'bg-[#9ACD32] text-black' : 'border-[#9ACD32]/50 text-[#9ACD32]'} rounded`}
                    >
                      Banner 1
                    </button>
                    <button
                      onClick={() => setSelectedBanner(2)}
                      className={`px-4 py-2 border ${selectedBanner === 2 ? 'bg-[#9ACD32] text-black' : 'border-[#9ACD32]/50 text-[#9ACD32]'} rounded`}
                    >
                      Banner 2
                    </button>
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    Select which banner position to update
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-black border border-[#9ACD32]/30 rounded-md">
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[#9ACD32]">Set Banner Image URL</span>
                  </div>
                  
                  <form onSubmit={handleBannerUpdate} className="space-y-4">
                    <div className="flex">
                      <input
                        type="url"
                        value={newBannerUrl}
                        onChange={(e) => setNewBannerUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 bg-black border border-[#9ACD32]/50 text-white px-3 py-2 rounded-l-md focus:outline-none focus:border-[#9ACD32]"
                      />
                      <button
                        type="submit"
                        className="bg-[#9ACD32]/20 hover:bg-[#9ACD32]/30 border-t border-r border-b border-[#9ACD32]/50 text-[#9ACD32] px-3 rounded-r-md flex items-center"
                      >
                        <LinkIcon size={16} />
                      </button>
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      Enter the full URL to an image hosted anywhere on the web (including https://)
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full bg-[#9ACD32]/10 border border-[#9ACD32]/50 text-[#9ACD32] py-2 rounded hover:bg-[#9ACD32]/20 transition duration-200"
                    >
                      Update Banner
                    </button>
                  </form>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-black border border-[#9ACD32]/30 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[#9ACD32]">Preview</span>
              </div>
              
              <div className="text-xs text-gray-400 mb-2">
                Banner {selectedBanner} will appear in the {selectedBanner === 1 ? 'left' : 'right'} section on login and register pages
              </div>
              
              <div className="h-64 border border-[#9ACD32]/30 rounded-md overflow-hidden">
                {(() => {
                  // Get current banner URL from local state
                  const bannerUrl = bannerUrls[`banner${selectedBanner}`] || localStorage.getItem(`login_banner${selectedBanner}`);
                  
                  if (bannerUrl) {
                    return (
                      <img 
                        id={`banner-preview-${selectedBanner}`}
                        src={bannerUrl} 
                        alt={`Banner ${selectedBanner} preview`} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          console.error('Error loading banner preview:', e);
                          // If image fails to load, show fallback
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    );
                  }
                  
                  return (
                    <div className="w-full h-full bg-black flex items-center justify-center text-[#9ACD32]/50 font-mono">
                      &lt;/banner provision {selectedBanner}&gt;
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
      <Navigation />
    </div>
  );
};

export default AdminPage;