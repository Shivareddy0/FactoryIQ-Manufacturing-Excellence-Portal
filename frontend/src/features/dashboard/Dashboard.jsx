import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import projectService from '../../services/projectService';
import productionService from '../../services/productionService';
import qualityService from '../../services/qualityService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend
} from 'recharts';
import { 
  BarChart2, 
  Percent, 
  Activity, 
  Clock, 
  Package, 
  AlertTriangle,
  FolderGit2,
  Heart
} from 'lucide-react';

const Dashboard = () => {
  const { user, activeRole } = useAuth();
  const [stats, setStats] = useState(null);
  const [prodStats, setProdStats] = useState(null);
  const [qualStats, setQualStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [projData, prodData, qualData] = await Promise.all([
          projectService.getDashboardStats(),
          productionService.getDashboardStats(),
          qualityService.getDashboardStats()
        ]);
        setStats(projData);
        setProdStats(prodData);
        setQualStats(qualData);
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [activeRole]); // Reload when role selector switches (in case segregation applies)

  const renderRoleSpecificStats = () => {
    switch (activeRole) {
      case 'Quality_Eng':
        return (
          <>
            <div className="glass-card glow-cyan-hover">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Defect PPM</p>
                  <h3 className="text-2xl font-bold text-slate-200 mt-1">
                    {loading ? '...' : `${qualStats?.defect_ppm || 0} PPM`}
                  </h3>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <Activity size={20} />
                </div>
              </div>
              <p className="text-[11px] text-emerald-400 mt-3 flex items-center gap-1">
                <span>Calculated from line stats</span>
              </p>
            </div>
            <div className="glass-card glow-cyan-hover">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Open NCRs</p>
                  <h3 className="text-2xl font-bold text-amber-400 mt-1">
                    {loading ? '...' : `${qualStats?.open_ncrs || 0} Active`}
                  </h3>
                </div>
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                  <AlertTriangle size={20} />
                </div>
              </div>
              <p className="text-[11px] text-amber-400 mt-3">Under Root Cause Analysis</p>
            </div>
          </>
        );
      case 'Prod_Planner':
        return (
          <>
            <div className="glass-card glow-cyan-hover">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active WIP</p>
                  <h3 className="text-2xl font-bold text-slate-200 mt-1">
                    {loading ? '...' : `${prodStats?.active_wip?.toLocaleString() || 0} Units`}
                  </h3>
                </div>
                <div className="p-2 bg-cyan-500/10 rounded-lg text-precision-cyan">
                  <Package size={20} />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-3">Active production batches</p>
            </div>
            <div className="glass-card glow-cyan-hover">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">OEE Rating</p>
                  <h3 className="text-2xl font-bold text-slate-200 mt-1">
                    {loading ? '...' : `${prodStats?.average_oee || 0}%`}
                  </h3>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <Percent size={20} />
                </div>
              </div>
              <p className="text-[11px] text-emerald-400 mt-3">Live line availability limit</p>
            </div>
          </>
        );
      default:
        return (
          <>
            <div className="glass-card glow-cyan-hover">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">On-Time Delivery</p>
                  <h3 className="text-2xl font-bold text-slate-200 mt-1">96.3%</h3>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <Clock size={20} />
                </div>
              </div>
              <p className="text-[11px] text-emerald-400 mt-3">↑ 0.8% weekly recovery</p>
            </div>
            <div className="glass-card glow-cyan-hover">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Program Health</p>
                  <h3 className="text-2xl font-bold text-emerald-400 mt-1">
                    {loading ? '...' : (stats?.program_health.find(h => h.health === 'Red')?.count > 0 ? 'Critical (Red)' : 'Stable (Green)')}
                  </h3>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <BarChart2 size={20} />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-3">
                {!loading && `${stats?.total_projects || 0} active NPI projects`}
              </p>
            </div>
          </>
        );
    }
  };

  // Recharts Health colors mapping
  const HEALTH_COLORS = {
    Green: '#10B981',
    Yellow: '#F59E0B',
    Red: '#EF4444'
  };

  const getHealthPieData = () => {
    if (!stats) return [];
    return stats.program_health
      .filter(item => item.count > 0)
      .map(item => ({
        name: `${item.health} Health`,
        value: item.count,
        color: HEALTH_COLORS[item.health] || '#ccc'
      }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-200">Manufacturing Operations Hub</h2>
        <p className="text-xs text-slate-400 mt-1">Enterprise portfolio health, quality limits, and live metrics.</p>
      </div>

      {/* Grid: Dynamic KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card glow-cyan-hover">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Operating Site</p>
              <h3 className="text-2xl font-bold text-slate-200 mt-1">Facility SZ-1</h3>
            </div>
            <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
              <Activity size={20} />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Guangdong Province, CN</p>
        </div>

        <div className="glass-card glow-cyan-hover">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Portfolio Projects</p>
              <h3 className="text-2xl font-bold text-precision-cyanLight mt-1">
                {loading ? '...' : stats?.total_projects}
              </h3>
            </div>
            <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
              <FolderGit2 size={20} />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            {loading ? '...' : `${stats?.active_projects} active / ${stats?.completed_projects} completed`}
          </p>
        </div>

        {renderRoleSpecificStats()}
      </div>

      {/* Analytics Charts section */}
      {!loading && stats && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Projects by Lifecycle Stage Bar Chart */}
          <div className="glass-panel p-6">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <BarChart2 size={16} className="text-precision-cyan" />
              <span>Projects by Lifecycle Stage</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.stages_breakdown} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="stage" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#22d3ee', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#06B6D4" radius={[4, 4, 0, 0]} barSize={35} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Program Health Distribution Pie Chart */}
          <div className="glass-panel p-6">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Heart size={16} className="text-emerald-400" />
              <span>Program Health Portfolio</span>
            </h3>
            <div className="h-64 flex flex-col justify-center">
              {getHealthPieData().length === 0 ? (
                <p className="text-xs text-slate-500 text-center">No program data loaded.</p>
              ) : (
                <div className="h-full flex items-center justify-between">
                  <div className="w-[60%] h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getHealthPieData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {getHealthPieData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                          itemStyle={{ fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-[40%] space-y-2.5 text-xs text-slate-400 font-semibold pl-4 border-l border-slate-800">
                    {getHealthPieData().map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
                        <span>{entry.name}: <span className="text-slate-200 font-bold">{entry.value}</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overview Description */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-bold text-slate-200 mb-4">Enterprise Portal Overview</h3>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">
          FactoryIQ is configured to manage the end-to-end product lifecycle. The system is currently running a background simulation engine that feeds telemetry directly to the database. Use the **Role Sandbox Selector** in the sidebar to simulate access controls and visibility filters for different internal engineering departments and customer representatives.
        </p>
        <div className="flex gap-4">
          <div className="text-xs border border-slate-700/60 rounded px-3 py-2 bg-obsidian-950/20 text-slate-400 font-mono">
            BASE AUTH ROLE: <span className="text-precision-cyanLight">{user?.role}</span>
          </div>
          <div className="text-xs border border-slate-700/60 rounded px-3 py-2 bg-obsidian-950/20 text-slate-400 font-mono">
            SANDBOX PERSPECTIVE: <span className="text-precision-cyanLight">{activeRole}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
