import React, { ReactNode } from 'react';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-black text-[#9ACD32] font-mono relative flex flex-col">
      {/* Console header bar */}
      <div className="w-full h-6 bg-[#9ACD32] text-black px-4 flex items-center justify-between">
        <span className="text-xs font-bold">DJ VOTING CONSOLE v1.0</span>
        <div className="flex space-x-2">
          <span className="text-xs">IP: 485680122</span>
          <span className="text-xs">STATUS: ONLINE</span>
        </div>
      </div>
      {/* Console grid effect - faint grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzlBQ0QzMiIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] z-0"></div>
      <div className="relative z-10 flex-1 pb-24">
        {children}
      </div>
      <div className="relative z-10 mb-14">
        <Footer />
      </div>
    </div>
  );
};

export default Layout; 