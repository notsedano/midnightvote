import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, Clock, Database, Download, Users, AlertCircle, Code, Copy, Check, ExternalLink, RefreshCw } from 'lucide-react';

interface IpStats {
  total_users: number;
  unique_ips: number;
  most_recent_login: string;
}

interface IpRecord {
  id: string;
  user_id: string;
  ip_address: string;
  created_at: string;
  last_login: string;
  login_count: number;
  user_email?: string;
}

// Define the shape of the record returned from Supabase
interface ProfilesIpRecord {
  id: string;
  user_id: string;
  ip_address: string;
  created_at: string;
  last_login: string;
  login_count: number;
  profiles: {
    email?: string;
  } | null;
}

const IpTrackingPanel: React.FC = () => {
  const [ipRecords, setIpRecords] = useState<IpRecord[]>([]);
  const [stats, setStats] = useState<IpStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [copied, setCopied] = useState(false);

  // SQL script to create table
  const sqlScript = `
CREATE TABLE IF NOT EXISTS public.profiles_ip (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT now(),
  login_count INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_profiles_ip_user_id ON public.profiles_ip(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_ip_ip_address ON public.profiles_ip(ip_address);

ALTER TABLE public.profiles_ip ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all IP data" ON public.profiles_ip
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can view their own IP data" ON public.profiles_ip
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert IP data" ON public.profiles_ip
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "System can update IP data" ON public.profiles_ip
  FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE OR REPLACE FUNCTION public.get_ip_stats()
RETURNS TABLE (
  total_users BIGINT,
  unique_ips BIGINT,
  most_recent_login TIMESTAMP WITH TIME ZONE
) SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT
      COUNT(DISTINCT user_id)::BIGINT AS total_users,
      COUNT(DISTINCT ip_address)::BIGINT AS unique_ips,
      MAX(last_login) AS most_recent_login
    FROM
      public.profiles_ip;
END;
$$ LANGUAGE plpgsql;`;

  useEffect(() => {
    fetchIpData();
  }, []);

  const fetchIpData = async () => {
    try {
      setLoading(true);
      setError(null);

      // First check if the profiles_ip table exists
      const { error: checkError } = await supabase
        .from('profiles_ip')
        .select('id')
        .limit(1);

      if (checkError) {
        // Table doesn't exist yet, try to create it
        setError('IP tracking table not found. Create it now?');
        setLoading(false);
        return;
      }

      // Get IP records with user emails
      const { data: records, error: recordsError } = await supabase
        .from('profiles_ip')
        .select(`
          id,
          user_id,
          ip_address,
          created_at,
          last_login,
          login_count,
          profiles:user_id (email)
        `)
        .order('last_login', { ascending: false });

      if (recordsError) throw recordsError;

      // Format the data with type casting
      const formattedRecords = (records as unknown as ProfilesIpRecord[]).map(record => ({
        id: record.id,
        user_id: record.user_id,
        ip_address: record.ip_address,
        created_at: record.created_at,
        last_login: record.last_login,
        login_count: record.login_count,
        user_email: record.profiles?.email
      }));

      setIpRecords(formattedRecords);

      // Get stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_ip_stats');

      if (statsError) throw statsError;
      if (statsData) {
        setStats(statsData[0]);
      }

    } catch (err: any) {
      console.error('Error fetching IP data:', err);
      setError(err.message || 'Failed to fetch IP data');
    } finally {
      setLoading(false);
    }
  };

  const createIpTable = async () => {
    try {
      setLoading(true);
      setShowInstructions(true);
      setError(null);
    } catch (err: any) {
      console.error('Error:', err);
      setError('Failed to show SQL script. Please see console for details.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  };

  const exportToCsv = () => {
    if (!ipRecords.length) return;

    const headers = ['User ID', 'Email', 'IP Address', 'First Login', 'Last Login', 'Login Count'];
    const rows = ipRecords.map(record => [
      record.user_id,
      record.user_email || 'Unknown',
      record.ip_address,
      new Date(record.created_at).toLocaleString(),
      new Date(record.last_login).toLocaleString(),
      record.login_count.toString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ip_tracking_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 bg-black border border-[#9ACD32]/30 rounded-md mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg text-[#9ACD32]">IP Tracking</h2>
        <button
          onClick={fetchIpData}
          className="text-sm bg-[#9ACD32]/10 border border-[#9ACD32]/50 text-[#9ACD32] px-3 py-1 rounded hover:bg-[#9ACD32]/20 transition duration-200"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
      </div>

      {error && !showInstructions && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500 text-red-300 rounded-md flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle size={16} className="mr-2" />
            {error}
          </div>
          {error.includes('IP tracking table not found') && (
            <button
              onClick={createIpTable}
              className="bg-[#9ACD32]/20 text-[#9ACD32] px-3 py-1 rounded hover:bg-[#9ACD32]/30 transition duration-200 text-sm"
              disabled={loading}
            >
              Create Table
            </button>
          )}
        </div>
      )}

      {showInstructions && (
        <div className="mb-6 p-4 bg-dark-950 border border-[#9ACD32]/30 rounded-md">
          <h3 className="text-[#9ACD32] text-md mb-3 font-mono">Setup Instructions</h3>
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              To create the IP tracking table, follow these steps:
            </p>
            <ol className="text-gray-300 text-sm space-y-2 list-decimal pl-6">
              <li>Copy the SQL script below</li>
              <li>
                Go to your <a 
                  href="https://app.supabase.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[#9ACD32] hover:underline inline-flex items-center"
                >
                  Supabase dashboard <ExternalLink size={12} className="ml-1" />
                </a>
              </li>
              <li>Navigate to the SQL Editor</li>
              <li>Create a new query</li>
              <li>Paste the SQL script</li>
              <li>Click "Run" to execute it</li>
              <li>Come back here and click "Refresh Data"</li>
            </ol>
            
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-gray-300 flex items-center">
                  <Code size={14} className="mr-1 text-[#9ACD32]" />
                  SQL Script
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="text-xs bg-[#9ACD32]/10 border border-[#9ACD32]/30 text-[#9ACD32] px-2 py-1 rounded flex items-center"
                >
                  {copied ? <Check size={12} className="mr-1" /> : <Copy size={12} className="mr-1" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="bg-dark-900 p-2 rounded-md border border-[#9ACD32]/20">
                <pre className="text-xs text-gray-300 overflow-x-auto max-h-40 p-2 font-mono">
                  {sqlScript}
                </pre>
              </div>
            </div>
            
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => setShowInstructions(false)}
                className="text-sm bg-dark-800 text-gray-300 px-3 py-1 rounded hover:bg-dark-700 transition duration-200"
              >
                Close
              </button>
              <button
                onClick={fetchIpData}
                className="text-sm bg-[#9ACD32]/20 text-[#9ACD32] px-3 py-1 rounded hover:bg-[#9ACD32]/30 transition duration-200 flex items-center"
              >
                <RefreshCw size={14} className="mr-1" />
                Check Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-3 bg-[#9ACD32]/5 border border-[#9ACD32]/30 rounded-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-400 text-sm">Users Tracked</span>
              <Users size={16} className="text-[#9ACD32]" />
            </div>
            <div className="text-xl text-[#9ACD32]">{stats.total_users}</div>
          </div>

          <div className="p-3 bg-[#9ACD32]/5 border border-[#9ACD32]/30 rounded-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-400 text-sm">Unique IPs</span>
              <Shield size={16} className="text-[#9ACD32]" />
            </div>
            <div className="text-xl text-[#9ACD32]">{stats.unique_ips}</div>
          </div>

          <div className="p-3 bg-[#9ACD32]/5 border border-[#9ACD32]/30 rounded-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-400 text-sm">Last Login</span>
              <Clock size={16} className="text-[#9ACD32]" />
            </div>
            <div className="text-xl text-[#9ACD32]">
              {stats.most_recent_login 
                ? new Date(stats.most_recent_login).toLocaleString()
                : 'None'}
            </div>
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={exportToCsv}
          className="flex items-center text-sm bg-[#9ACD32]/10 border border-[#9ACD32]/50 text-[#9ACD32] px-3 py-1 rounded hover:bg-[#9ACD32]/20 transition duration-200"
          disabled={loading || !ipRecords.length}
        >
          <Download size={14} className="mr-1" />
          Export to CSV
        </button>
      </div>

      {/* IP Records Table */}
      <div className="border border-[#9ACD32]/30 rounded-md overflow-x-auto">
        <table className="min-w-full divide-y divide-[#9ACD32]/20">
          <thead className="bg-[#9ACD32]/10">
            <tr>
              <th className="px-4 py-2 text-left text-xs text-[#9ACD32] uppercase">User</th>
              <th className="px-4 py-2 text-left text-xs text-[#9ACD32] uppercase">IP Address</th>
              <th className="px-4 py-2 text-left text-xs text-[#9ACD32] uppercase">First Login</th>
              <th className="px-4 py-2 text-left text-xs text-[#9ACD32] uppercase">Last Login</th>
              <th className="px-4 py-2 text-left text-xs text-[#9ACD32] uppercase">Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#9ACD32]/10">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Loading IP records...
                </td>
              </tr>
            ) : ipRecords.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No IP records found. Users will be added when they log in.
                </td>
              </tr>
            ) : (
              ipRecords.map((record) => (
                <tr key={record.id} className="hover:bg-[#9ACD32]/5">
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm text-white">{record.user_email || 'Unknown'}</div>
                    <div className="text-xs text-gray-400 font-mono">{record.user_id}</div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-white font-mono">
                    {record.ip_address}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                    {new Date(record.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                    {new Date(record.last_login).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-[#9ACD32]">
                    {record.login_count}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <div className="flex items-center">
          <Database size={12} className="mr-1" />
          IP tracking data is used for security purposes only and stored in the profiles_ip table.
        </div>
      </div>
    </div>
  );
};

export default IpTrackingPanel; 