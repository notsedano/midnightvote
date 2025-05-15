import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const TestBucket: React.FC = () => {
  const { user } = useAuth();
  const [buckets, setBuckets] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [settings, setSettings] = useState<any[]>([]);

  useEffect(() => {
    checkBuckets();
    checkSettings();
  }, []);

  const checkSettings = async () => {
    try {
      setStatus('Checking site_settings table...');
      
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');
        
      if (error) {
        console.error('Settings error:', error);
        throw error;
      }
      
      setSettings(data || []);
      setStatus(`Found ${data?.length || 0} settings`);
    } catch (err: any) {
      console.error('Error checking settings:', err);
      setError(`Error checking settings: ${err.message}`);
    }
  };

  const testUpdateSetting = async () => {
    try {
      setStatus('Testing site_settings update...');
      setError(null);
      
      const testKey = 'test_setting_' + Date.now();
      const testValue = 'Test value ' + new Date().toISOString();
      
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: testKey, value: testValue });
        
      if (error) {
        console.error('Settings update error:', error);
        throw error;
      }
      
      setStatus(`Successfully updated site_settings with test key: ${testKey}`);
      checkSettings(); // Refresh settings list
    } catch (err: any) {
      console.error('Error updating settings:', err);
      setError(`Error updating settings: ${err.message}`);
    }
  };

  const checkBuckets = async () => {
    setStatus('Checking buckets...');
    try {
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        throw error;
      }
      
      setBuckets(data || []);
      setStatus(`Found ${data?.length || 0} buckets`);
      
      // Check if banners bucket exists
      const bannersBucket = data?.find(b => b.name === 'banners');
      if (bannersBucket) {
        checkFiles();
      } else {
        setStatus('Banners bucket not found');
      }
    } catch (err: any) {
      setError(`Error checking buckets: ${err.message}`);
      setStatus('Failed');
    }
  };

  const checkFiles = async () => {
    setStatus('Checking files in banners bucket...');
    try {
      const { data, error } = await supabase.storage
        .from('banners')
        .list();
      
      if (error) {
        throw error;
      }
      
      setFiles(data || []);
      setStatus(`Found ${data?.length || 0} files in banners bucket`);
    } catch (err: any) {
      setError(`Error checking files: ${err.message}`);
      setStatus('Failed to list files');
    }
  };

  const handleUploadTest = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setStatus('Uploading test file...');
    setError(null);
    
    try {
      // Check auth status
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setError('You must be logged in to upload files');
        return;
      }
      
      const filePath = `test_${Date.now()}.${selectedFile.name.split('.').pop()}`;
      
      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(filePath, selectedFile, { upsert: true });
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get URL
      const { data } = supabase.storage
        .from('banners')
        .getPublicUrl(filePath);
        
      setStatus(`Upload successful! URL: ${data.publicUrl}`);
      
      // Refresh file list
      checkFiles();
    } catch (err: any) {
      setError(`Upload failed: ${err.message}`);
      setStatus('Upload failed');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 font-mono">
      <h1 className="text-2xl text-[#9ACD32] mb-4">Supabase Storage Test</h1>
      
      <div className="mb-6">
        <h2 className="text-xl mb-2">Auth Status</h2>
        <div className="bg-gray-900 p-4 rounded">
          {user ? (
            <div>
              <p>Logged in as: {user.email}</p>
              <p>User ID: {user.id}</p>
            </div>
          ) : (
            <p className="text-red-400">Not logged in</p>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl mb-2">Status</h2>
        <div className="bg-gray-900 p-4 rounded">
          <p>{status || 'Ready'}</p>
          {error && <p className="text-red-400 mt-2">{error}</p>}
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl mb-2">Buckets</h2>
        <div className="bg-gray-900 p-4 rounded">
          {buckets.length > 0 ? (
            <ul>
              {buckets.map(bucket => (
                <li key={bucket.id} className="mb-2">
                  {bucket.name} - {bucket.public ? 'Public' : 'Private'}
                </li>
              ))}
            </ul>
          ) : (
            <p>No buckets found</p>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl mb-2">Files in 'banners' bucket</h2>
        <div className="bg-gray-900 p-4 rounded">
          {files.length > 0 ? (
            <ul>
              {files.map(file => (
                <li key={file.id} className="mb-2">
                  {file.name} - {file.metadata?.size || 0} bytes
                </li>
              ))}
            </ul>
          ) : (
            <p>No files found</p>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl mb-2">Upload Test</h2>
        <div className="bg-gray-900 p-4 rounded">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="mb-4"
          />
          <button
            onClick={handleUploadTest}
            disabled={!selectedFile}
            className="px-4 py-2 bg-[#9ACD32] text-black rounded disabled:opacity-50"
          >
            Test Upload
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl mb-2">Site Settings Table</h2>
        <div className="bg-gray-900 p-4 rounded">
          {settings.length > 0 ? (
            <div>
              <ul className="mb-4">
                {settings.map((setting, index) => (
                  <li key={index} className="mb-2">
                    <strong>{setting.key}:</strong> {setting.value ? (setting.value.length > 50 ? `${setting.value.substring(0, 50)}...` : setting.value) : '(empty)'}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p>No settings found</p>
          )}
          
          <button
            onClick={testUpdateSetting}
            className="px-4 py-2 bg-[#9ACD32] text-black rounded mr-2"
          >
            Test Settings Update
          </button>
        </div>
      </div>
      
      <div className="mt-4">
        <button
          onClick={() => {
            checkBuckets();
            checkSettings();
          }}
          className="px-4 py-2 bg-gray-700 text-white rounded mr-2"
        >
          Refresh All
        </button>
      </div>
    </div>
  );
};

export default TestBucket; 