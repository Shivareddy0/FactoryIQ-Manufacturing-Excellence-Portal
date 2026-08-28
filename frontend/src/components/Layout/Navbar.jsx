import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Bell, Shield, Radio } from 'lucide-react';

const Navbar = () => {
  const { user, activeRole, logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800/80 bg-obsidian-900/60 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Left status badge */}
      <div className="flex items-center gap-3">
        <Radio size={16} className="text-precision-cyan animate-pulse-glow" />
        <span className="text-xs text-slate-400 font-mono tracking-wider">LIVE TELEMETRY STREAM: ACTIVE</span>
      </div>

      {/* Right User details & Logout */}
      <div className="flex items-center gap-4">
        {/* Simulated alert bell */}
        <button className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800/40 relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-precision-cyan"></span>
        </button>

        {/* Profile Card */}
        <div className="flex items-center gap-3 border-l border-slate-800/80 pl-4">
          <div className="text-right">
            <div className="text-sm font-semibold text-slate-200">{user?.full_name}</div>
            <div className="text-[10px] font-mono text-precision-cyanLight uppercase flex items-center justify-end gap-1">
              <Shield size={10} />
              {activeRole?.replace('_', ' ')}
            </div>
          </div>

          <button 
            onClick={logout}
            className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
