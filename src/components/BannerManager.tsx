import React, { useState, useEffect } from 'react';
import { getAllBanners, setBannerUrl, clearBannerUrl } from '../lib/bannerService';

const BannerManager: React.FC = () => {
  const [banners, setBanners] = useState({
    login1: '',
    login2: '',
    register: '',
  });
  const [status, setStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ 
    type: '', 
    message: '' 
  });

  useEffect(() => {
    // Load current banner URLs on component mount
    setBanners(getAllBanners());
  }, []);

  const handleInputChange = (key: keyof typeof banners, value: string) => {
    setBanners(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = (key: keyof typeof banners) => {
    try {
      setBannerUrl(key, banners[key]);
      setStatus({ 
        type: 'success', 
        message: `Successfully updated ${key} banner!` 
      });

      // Clear success message after 3 seconds
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: `Failed to update banner: ${error}` 
      });
    }
  };

  const handleClear = (key: keyof typeof banners) => {
    try {
      clearBannerUrl(key);
      setBanners(prev => ({ ...prev, [key]: '' }));
      setStatus({ 
        type: 'success', 
        message: `Cleared ${key} banner!` 
      });

      // Clear success message after 3 seconds
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: `Failed to clear banner: ${error}` 
      });
    }
  };

  return (
    <div className="border border-[#9ACD32]/30 rounded-md p-4 bg-black">
      <h3 className="text-xl font-mono text-[#9ACD32] mb-4">External Banner URLs</h3>

      {status.message && (
        <div className={`mb-4 p-3 rounded text-sm ${
          status.type === 'success' 
            ? 'bg-green-900/30 border border-green-700 text-green-300' 
            : 'bg-red-900/30 border border-red-700 text-red-300'
        }`}>
          {status.message}
        </div>
      )}

      <div className="space-y-4">
        {/* Login Banner 1 (Left) */}
        <div>
          <div className="text-sm font-mono text-white mb-1">Login Banner 1 (Left)</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={banners.login1}
              onChange={(e) => handleInputChange('login1', e.target.value)}
              placeholder="Enter image URL"
              className="flex-1 bg-black border border-[#9ACD32]/30 text-white p-2 rounded"
            />
            <button
              onClick={() => handleSave('login1')}
              className="bg-[#9ACD32] text-black px-3 py-1 rounded text-sm font-mono hover:bg-[#9ACD32]/90"
            >
              Save
            </button>
            <button
              onClick={() => handleClear('login1')}
              className="bg-red-700/50 text-white px-3 py-1 rounded text-sm font-mono hover:bg-red-700/70"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Login Banner 2 (Right) */}
        <div>
          <div className="text-sm font-mono text-white mb-1">Login Banner 2 (Right)</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={banners.login2}
              onChange={(e) => handleInputChange('login2', e.target.value)}
              placeholder="Enter image URL"
              className="flex-1 bg-black border border-[#9ACD32]/30 text-white p-2 rounded"
            />
            <button
              onClick={() => handleSave('login2')}
              className="bg-[#9ACD32] text-black px-3 py-1 rounded text-sm font-mono hover:bg-[#9ACD32]/90"
            >
              Save
            </button>
            <button
              onClick={() => handleClear('login2')}
              className="bg-red-700/50 text-white px-3 py-1 rounded text-sm font-mono hover:bg-red-700/70"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Register Banner */}
        <div>
          <div className="text-sm font-mono text-white mb-1">Register Page Banner</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={banners.register}
              onChange={(e) => handleInputChange('register', e.target.value)}
              placeholder="Enter image URL"
              className="flex-1 bg-black border border-[#9ACD32]/30 text-white p-2 rounded"
            />
            <button
              onClick={() => handleSave('register')}
              className="bg-[#9ACD32] text-black px-3 py-1 rounded text-sm font-mono hover:bg-[#9ACD32]/90"
            >
              Save
            </button>
            <button
              onClick={() => handleClear('register')}
              className="bg-red-700/50 text-white px-3 py-1 rounded text-sm font-mono hover:bg-red-700/70"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-400">
        Note: Enter full URLs to images hosted on external services like Imgur, Cloudinary, etc.
      </div>
    </div>
  );
};

export default BannerManager; 