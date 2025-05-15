import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllBanners, setBannerUrl } from '../lib/bannerService';
import Footer from '../components/Footer';

const TestBannerPage: React.FC = () => {
  const [banners, setBanners] = useState(getAllBanners());
  const [testUrl, setTestUrl] = useState('');
  const [testBannerKey, setTestBannerKey] = useState<'login1' | 'login2' | 'register'>('login1');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({
    type: '',
    message: ''
  });

  useEffect(() => {
    document.title = 'Banner Test Page';
  }, []);

  const handleQuickTest = () => {
    try {
      if (!testUrl) {
        setStatus({
          type: 'error',
          message: 'Please enter a URL to test'
        });
        return;
      }

      // Save to the selected banner key
      setBannerUrl(testBannerKey, testUrl);
      
      // Refresh banners
      setBanners(getAllBanners());
      
      setStatus({
        type: 'success',
        message: `Successfully set ${testBannerKey} banner!`
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    } catch (error) {
      setStatus({
        type: 'error',
        message: `Failed to set banner: ${error}`
      });
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 border-b border-[#9ACD32]/30 pb-4">
            <h1 className="text-[#9ACD32] font-mono text-4xl mb-2">Banner Test Page</h1>
            <p className="text-gray-400">
              This page lets you test if banner images are working correctly. You can see currently set banners and test new ones.
            </p>
          </div>
          
          {status.message && (
            <div className={`mb-8 p-4 rounded border ${
              status.type === 'success' 
                ? 'bg-green-900/30 border-green-700 text-green-300' 
                : 'bg-red-900/30 border-red-700 text-red-300'
            }`}>
              {status.message}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="border border-[#9ACD32]/30 rounded-md p-4">
              <h2 className="text-[#9ACD32] font-mono text-xl mb-4">Current Banner Settings</h2>
              
              <div className="space-y-6">
                {/* Login Banner 1 */}
                <div>
                  <h3 className="text-white font-mono text-sm mb-2">Login Banner 1 (Left)</h3>
                  <div className="bg-black border border-[#9ACD32]/30 p-2 rounded mb-2 h-40 flex items-center justify-center">
                    {banners.login1 ? (
                      <img 
                        src={banners.login1} 
                        alt="Login Banner 1" 
                        className="max-h-full max-w-full object-contain"
                        onError={() => {
                          setStatus({
                            type: 'error',
                            message: 'Failed to load Login Banner 1 image. URL might be invalid.'
                          });
                        }}
                      />
                    ) : (
                      <div className="text-[#9ACD32]/50 font-mono">&lt;/empty&gt;</div>
                    )}
                  </div>
                  
                  {banners.login1 && (
                    <div className="text-xs text-gray-500 break-all">
                      URL: {banners.login1}
                    </div>
                  )}
                </div>
                
                {/* Login Banner 2 */}
                <div>
                  <h3 className="text-white font-mono text-sm mb-2">Login Banner 2 (Right)</h3>
                  <div className="bg-black border border-[#9ACD32]/30 p-2 rounded mb-2 h-40 flex items-center justify-center">
                    {banners.login2 ? (
                      <img 
                        src={banners.login2} 
                        alt="Login Banner 2" 
                        className="max-h-full max-w-full object-contain"
                        onError={() => {
                          setStatus({
                            type: 'error',
                            message: 'Failed to load Login Banner 2 image. URL might be invalid.'
                          });
                        }}
                      />
                    ) : (
                      <div className="text-[#9ACD32]/50 font-mono">&lt;/empty&gt;</div>
                    )}
                  </div>
                  
                  {banners.login2 && (
                    <div className="text-xs text-gray-500 break-all">
                      URL: {banners.login2}
                    </div>
                  )}
                </div>
                
                {/* Register Banner */}
                <div>
                  <h3 className="text-white font-mono text-sm mb-2">Register Page Banner</h3>
                  <div className="bg-black border border-[#9ACD32]/30 p-2 rounded mb-2 h-40 flex items-center justify-center">
                    {banners.register ? (
                      <img 
                        src={banners.register} 
                        alt="Register Banner" 
                        className="max-h-full max-w-full object-contain"
                        onError={() => {
                          setStatus({
                            type: 'error',
                            message: 'Failed to load Register Banner image. URL might be invalid.'
                          });
                        }}
                      />
                    ) : (
                      <div className="text-[#9ACD32]/50 font-mono">&lt;/empty&gt;</div>
                    )}
                  </div>
                  
                  {banners.register && (
                    <div className="text-xs text-gray-500 break-all">
                      URL: {banners.register}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="border border-[#9ACD32]/30 rounded-md p-4">
              <h2 className="text-[#9ACD32] font-mono text-xl mb-4">Quick Banner Test</h2>
              <p className="text-gray-400 text-sm mb-4">
                Enter an image URL to test it as a banner. This will save to localStorage.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-mono text-sm mb-2">Select Banner Position</label>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setTestBannerKey('login1')}
                      className={`px-3 py-2 border rounded ${
                        testBannerKey === 'login1' 
                          ? 'bg-[#9ACD32] text-black' 
                          : 'border-[#9ACD32]/50 text-[#9ACD32]'
                      }`}
                    >
                      Login 1
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestBannerKey('login2')}
                      className={`px-3 py-2 border rounded ${
                        testBannerKey === 'login2' 
                          ? 'bg-[#9ACD32] text-black' 
                          : 'border-[#9ACD32]/50 text-[#9ACD32]'
                      }`}
                    >
                      Login 2
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestBannerKey('register')}
                      className={`px-3 py-2 border rounded ${
                        testBannerKey === 'register' 
                          ? 'bg-[#9ACD32] text-black' 
                          : 'border-[#9ACD32]/50 text-[#9ACD32]'
                      }`}
                    >
                      Register
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-white font-mono text-sm mb-2">Image URL</label>
                  <input
                    type="text"
                    value={testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full bg-black border border-[#9ACD32]/50 text-white px-3 py-2 rounded-md focus:outline-none focus:border-[#9ACD32]"
                  />
                </div>
                
                <div>
                  <button
                    type="button"
                    onClick={handleQuickTest}
                    className="bg-[#9ACD32] text-black px-4 py-2 rounded font-mono hover:bg-[#9ACD32]/90"
                  >
                    Test Banner
                  </button>
                </div>
                
                {testUrl && (
                  <div>
                    <label className="block text-white font-mono text-sm mb-2">Preview</label>
                    <div className="bg-black border border-[#9ACD32]/30 p-2 rounded h-40 flex items-center justify-center">
                      <img 
                        src={testUrl} 
                        alt="Test preview" 
                        className="max-h-full max-w-full object-contain"
                        onError={() => {
                          setStatus({
                            type: 'error',
                            message: 'Cannot load this image. URL might be invalid or CORS restricted.'
                          });
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-8 text-sm text-gray-400">
                <p className="mb-2">Sample image URLs to test:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>https://picsum.photos/800/600 - Random image</li>
                  <li>https://placehold.co/600x400/9ACD32/000000?text=Banner</li>
                  <li>https://source.unsplash.com/random/800x600 - Random Unsplash</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between border-t border-[#9ACD32]/30 pt-6">
            <Link to="/login" className="text-[#9ACD32] hover:underline">Go to Login</Link>
            <Link to="/admin" className="text-[#9ACD32] hover:underline">Go to Admin</Link>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default TestBannerPage; 