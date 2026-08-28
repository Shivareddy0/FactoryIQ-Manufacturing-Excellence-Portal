import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  FolderGit2, 
  Cpu, 
  ShieldAlert, 
  Truck, 
  Wrench,
  UserCheck
} from 'lucide-react';

const Sidebar = () => {
  const { user, activeRole, setOverrideRole, clearOverrideRole } = useAuth();

  const menuItems = [
    { name: 'Executive Dashboard', path: '/', icon: LayoutDashboard, roles: ['Admin', 'Project_Mgr', 'Prod_Planner', 'Quality_Eng', 'SC_Manager', 'Customer_Rep'] },
    { name: 'Projects & NPI Gates', path: '/projects', icon: FolderGit2, roles: ['Admin', 'Project_Mgr', 'Customer_Rep'] },
    { name: 'Production Visibility', path: '/production', icon: Cpu, roles: ['Admin', 'Project_Mgr', 'Prod_Planner'] },
    { name: 'Quality & CAPA (8D)', path: '/quality', icon: ShieldAlert, roles: ['Admin', 'Quality_Eng', 'Customer_Rep'] },
    { name: 'Supply Chain Materials', path: '/supply-chain', icon: Truck, roles: ['Admin', 'SC_Manager', 'Customer_Rep'] },
    { name: 'After-Sales RMA', path: '/after-sales', icon: Wrench, roles: ['Admin', 'Project_Mgr', 'Customer_Rep'] },
  ];

  // Filter menu items by active role. Admin can see everything.
  const filteredMenu = menuItems.filter(item => 
    activeRole === 'Admin' || item.roles.includes(activeRole)
  );

  const availableRoles = [
    { value: 'Admin', label: 'System Admin' },
    { value: 'Project_Mgr', label: 'Project Manager' },
    { value: 'Prod_Planner', label: 'Production Planner' },
    { value: 'Quality_Eng', label: 'Quality Engineer' },
    { value: 'SC_Manager', label: 'Supply Chain Mgr' },
    { value: 'Customer_Rep', label: 'Customer Rep' }
  ];

  const handleRoleChange = (e) => {
    const selected = e.target.value;
    if (selected === user.role) {
      clearOverrideRole();
    } else {
      setOverrideRole(selected);
    }
  };

  return (
    <aside className="w-64 bg-obsidian-900 border-r border-slate-800/80 flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/60 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-precision-cyan to-blue-600 flex items-center justify-center font-bold text-obsidian-950 glow-cyan">
          FIQ
        </div>
        <div>
          <h1 className="font-bold text-lg leading-none bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">FactoryIQ</h1>
          <span className="text-xs text-slate-500 font-medium tracking-wider uppercase">Enterprise</span>
        </div>
      </div>

      {/* Role Switcher Widget (Portfolio Demonstration Tool) */}
      <div className="px-4 py-4 border-b border-slate-800/40 bg-obsidian-950/30">
        <div className="flex items-center gap-2 mb-2 text-xs text-precision-cyan font-semibold uppercase tracking-wider">
          <UserCheck size={14} />
          <span>Role Sandbox Selector</span>
        </div>
        <select 
          value={activeRole || ''} 
          onChange={handleRoleChange}
          className="w-full bg-obsidian-800 border border-slate-700/60 text-xs text-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-precision-cyan/80 cursor-pointer"
        >
          {availableRoles.map(roleOpt => (
            <option key={roleOpt.value} value={roleOpt.value}>
              {roleOpt.label} {user?.role === roleOpt.value ? '(Base)' : ''}
            </option>
          ))}
        </select>
        {user?.role !== activeRole && (
          <button 
            onClick={clearOverrideRole}
            className="mt-2 text-[10px] text-red-400 hover:text-red-300 transition-colors w-full text-left"
          >
            ← Reset to Base Role ({user?.role})
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {filteredMenu.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group
              ${isActive 
                ? 'bg-precision-cyan/10 text-precision-cyanLight border-l-2 border-precision-cyan font-semibold' 
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'}
            `}
          >
            <item.icon size={18} className="group-hover:scale-105 transition-transform" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Info Status footer */}
      <div className="p-4 border-t border-slate-800/60 bg-obsidian-950/20 text-center">
        <div className="text-[10px] text-slate-500 font-mono">
          SYSTEM STATUS: ONLINE
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
