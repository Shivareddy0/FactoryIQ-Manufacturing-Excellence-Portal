import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import productionService from '../../services/productionService';
import projectService from '../../services/projectService';
import { 
  LineChart, 
  Line, 
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
  Plus, 
  Search, 
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  TrendingUp,
  AlertTriangle,
  Cpu,
  CheckCircle,
  Clock,
  Settings,
  AlertCircle,
  Activity,
  Layers,
  Wrench,
  Trash2,
  Edit2
} from 'lucide-react';

const Production = () => {
  const { activeRole } = useAuth();
  
  // Dashboard Metrics state
  const [stats, setStats] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Work Orders List pagination & search state
  const [workOrders, setWorkOrders] = useState([]);
  const [totalWO, setTotalWO] = useState(0);
  const [woPage, setWoPage] = useState(1);
  const [woPages, setWoPages] = useState(1);
  const [woSearch, setWoSearch] = useState('');
  const [woStatus, setWoStatus] = useState('');
  const [loadingWO, setLoadingWO] = useState(false);
  const [projects, setProjects] = useState([]);

  // Modals state
  const [showWOModal, setShowWOModal] = useState(false);
  const [editingWO, setEditingWO] = useState(null);
  const [woForm, setWoForm] = useState({
    project_id: '',
    work_order_number: '',
    quantity_ordered: '',
    quantity_completed: '',
    status: 'Released'
  });
  const [woFormError, setWoFormError] = useState('');
  const [woSubmitting, setWoSubmitting] = useState(false);

  // Machine Toggle modal state
  const [showMachineModal, setShowMachineModal] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [machineForm, setMachineForm] = useState({
    status: 'Active',
    downtime_reason: ''
  });

  const canWrite = activeRole === 'Admin' || activeRole === 'Project_Mgr' || activeRole === 'Prod_Planner';

  // Load Projects on mount for selection dropdown
  useEffect(() => {
    const fetchProjectsList = async () => {
      try {
        const data = await projectService.getProjects({ limit: 100 });
        setProjects(data.items);
      } catch (err) {
        console.error('Failed to load projects list', err);
      }
    };
    fetchProjectsList();
  }, []);

  // Fetch Production Stats
  const fetchDashboardStats = async () => {
    try {
      const data = await productionService.getDashboardStats();
      setStats(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch production dashboard stats');
    }
  };

  // Fetch Production Lines
  const fetchProductionLines = async () => {
    try {
      const data = await productionService.getProductionLines();
      setLines(data);
    } catch (err) {
      console.error('Failed to fetch production lines', err);
    }
  };

  // Fetch Work Orders
  const fetchWorkOrders = async () => {
    setLoadingWO(true);
    try {
      const params = {
        page: woPage,
        limit: 5,
        search: woSearch || undefined,
        status: woStatus || undefined
      };
      const data = await productionService.getWorkOrders(params);
      setWorkOrders(data.items);
      setTotalWO(data.total);
      setWoPages(data.pages);
    } catch (err) {
      console.error('Failed to fetch work orders', err);
    } finally {
      setLoadingWO(false);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchDashboardStats(),
      fetchProductionLines(),
      fetchWorkOrders()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, [woPage, woStatus]);

  const handleWOSearchSubmit = (e) => {
    e.preventDefault();
    setWoPage(1);
    fetchWorkOrders();
  };

  const resetWOFilters = () => {
    setWoSearch('');
    setWoStatus('');
    setWoPage(1);
    fetchWorkOrders();
  };

  // Work Order Save
  const handleSaveWO = async (e) => {
    e.preventDefault();
    setWoFormError('');
    if (!woForm.project_id) return setWoFormError('Project is required');
    if (!woForm.work_order_number.trim()) return setWoFormError('Work order number is required');
    if (!woForm.quantity_ordered || Number(woForm.quantity_ordered) <= 0) return setWoFormError('Quantity ordered must be greater than 0');
    
    const qtyCompleted = Number(woForm.quantity_completed) || 0;
    const qtyOrdered = Number(woForm.quantity_ordered);
    if (qtyCompleted > qtyOrdered) return setWoFormError('Quantity completed cannot exceed ordered quantity');

    setWoSubmitting(true);
    try {
      if (editingWO) {
        await productionService.updateWorkOrder(editingWO.id, {
          work_order_number: woForm.work_order_number,
          quantity_ordered: qtyOrdered,
          quantity_completed: qtyCompleted,
          status: woForm.status
        });
      } else {
        await productionService.createWorkOrder({
          project_id: woForm.project_id,
          work_order_number: woForm.work_order_number,
          quantity_ordered: qtyOrdered,
          quantity_completed: qtyCompleted,
          status: woForm.status
        });
      }
      setShowWOModal(false);
      loadAllData();
    } catch (err) {
      setWoFormError(err.response?.data?.detail || 'Failed to save work order');
    } finally {
      setWoSubmitting(false);
    }
  };

  // Work Order Edit open
  const openWOEdit = (wo) => {
    setEditingWO(wo);
    setWoForm({
      project_id: wo.project_id,
      work_order_number: wo.work_order_number,
      quantity_ordered: wo.quantity_ordered,
      quantity_completed: wo.quantity_completed,
      status: wo.status
    });
    setWoFormError('');
    setShowWOModal(true);
  };

  // Work Order Create open
  const openWOCreate = () => {
    setEditingWO(null);
    setWoForm({
      project_id: '',
      work_order_number: '',
      quantity_ordered: '',
      quantity_completed: '0',
      status: 'Released'
    });
    setWoFormError('');
    setShowWOModal(true);
  };

  // Work Order Delete
  const handleDeleteWO = async (woId) => {
    if (!window.confirm('Are you sure you want to delete this work order?')) return;
    try {
      await productionService.deleteWorkOrder(woId);
      loadAllData();
    } catch (err) {
      alert('Failed to delete work order');
    }
  };

  // Machine status update modal
  const openMachineToggle = (machine) => {
    if (!canWrite) return;
    setSelectedMachine(machine);
    setMachineForm({
      status: machine.status,
      downtime_reason: machine.downtime_reason || ''
    });
    setShowMachineModal(true);
  };

  const handleSaveMachineStatus = async (e) => {
    e.preventDefault();
    if (!selectedMachine) return;
    try {
      await productionService.toggleMachineStatus(selectedMachine.id, {
        status: machineForm.status,
        downtime_reason: machineForm.status === 'Active' ? '' : machineForm.downtime_reason
      });
      setShowMachineModal(false);
      loadAllData();
    } catch (err) {
      alert('Failed to update machine status');
    }
  };

  // Styles helpers
  const getLineStatusClass = (status) => {
    switch (status) {
      case 'Running': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Idle': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default: return 'bg-rose-500/10 text-rose-400 border border-rose-500/20'; // Stopped
    }
  };

  const getMachineStatusClass = (status) => {
    switch (status) {
      case 'Active': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Offline': return 'bg-slate-700/20 text-slate-400 border border-slate-700/40';
      default: return 'bg-rose-500/10 text-rose-400 border border-rose-500/20'; // Error
    }
  };

  const getWOStatusClass = (status) => {
    switch (status) {
      case 'Closed': return 'bg-slate-700/20 text-slate-400 border border-slate-700/40';
      case 'Paused': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'In_Production': return 'bg-cyan-500/10 text-precision-cyanLight border border-precision-cyan/20';
      default: return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'; // Released
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="h-10 w-10 rounded-full border-2 border-t-precision-cyan border-slate-800 animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Resolving real-time production feeds...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="glass-panel p-8 text-center max-w-lg mx-auto mt-12 space-y-4">
        <AlertCircle size={40} className="text-red-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-200">Error Loading Production Board</h3>
        <p className="text-sm text-slate-400">{error || 'Data is unavailable.'}</p>
        <button 
          onClick={loadAllData}
          className="text-xs font-semibold text-precision-cyanLight flex items-center justify-center gap-1.5 mx-auto hover:underline"
        >
          ✕ Try Again
        </button>
      </div>
    );
  }

  // Radial chart OEE gauge calculations
  const oeeGaugeData = [
    { name: 'OEE', value: stats.average_oee, fill: '#06B6D4' },
    { name: 'Remaining', value: 100 - stats.average_oee, fill: '#1e293b' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Cpu size={24} className="text-precision-cyan" />
            <span>Production Visibility Hub</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time assembly line statuses, machine station telemetry logs, and OEE parameters.
          </p>
        </div>
      </div>

      {/* KPI Stats Panel */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="glass-card glow-cyan-hover">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Active WIP</span>
          <h3 className="text-2xl font-bold text-slate-200 mt-1 font-mono">{stats.active_wip.toLocaleString()}</h3>
          <p className="text-[10px] text-slate-400 mt-2">Units in SMT/Assembly</p>
        </div>
        <div className="glass-card glow-cyan-hover">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">OEE Rating</span>
          <h3 className="text-2xl font-bold text-precision-cyanLight mt-1 font-mono">{stats.average_oee}%</h3>
          <p className="text-[10px] text-emerald-400 mt-2">Average line performance</p>
        </div>
        <div className="glass-card glow-cyan-hover">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">FPY Yield Rate</span>
          <h3 className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{stats.average_yield}%</h3>
          <p className="text-[10px] text-slate-400 mt-2">Passed vs defect limit</p>
        </div>
        <div className="glass-card glow-cyan-hover">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Downtime Logs</span>
          <h3 className="text-2xl font-bold text-rose-400 mt-1 font-mono">{stats.total_downtime}m</h3>
          <p className="text-[10px] text-rose-400 mt-2">Cumulative minutes</p>
        </div>
        <div className="glass-card glow-cyan-hover">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Work Orders</span>
          <h3 className="text-2xl font-bold text-slate-200 mt-1 font-mono">{stats.total_work_orders}</h3>
          <p className="text-[10px] text-slate-400 mt-2">Released in system</p>
        </div>
      </div>

      {/* Production Lines perform track */}
      <div className="glass-panel p-6">
        <h3 className="text-sm font-bold text-slate-200 mb-6 flex items-center gap-2">
          <Layers size={16} className="text-precision-cyan" />
          <span>Active Assembly Lines</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {lines.map(line => (
            <div key={line.id} className="glass-card flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-slate-200 text-sm">{line.name}</h4>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getLineStatusClass(line.status)}`}>
                    {line.status}
                  </span>
                </div>
                
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div>
                    <span className="text-[9px] text-slate-500 font-semibold uppercase">OEE</span>
                    <p className="text-base font-bold text-precision-cyanLight mt-0.5">{line.oee}%</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-semibold uppercase">Yield</span>
                    <p className="text-base font-bold text-emerald-400 mt-0.5">{line.yield_rate}%</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-semibold uppercase">Downtime</span>
                    <p className="text-base font-bold text-slate-300 mt-0.5">{line.downtime_minutes}m</p>
                  </div>
                </div>
              </div>

              {/* Nested Machines Mini Grid */}
              <div className="mt-6 pt-4 border-t border-slate-800/40 space-y-2">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                  Machine Statuses {canWrite && '(Click to Toggle Status)'}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {line.machines.map(m => (
                    <div 
                      key={m.id}
                      onClick={() => openMachineToggle(m)}
                      className={`p-2 rounded border border-slate-800/40 bg-obsidian-950/20 cursor-pointer ${
                        canWrite ? 'hover:bg-slate-800/20 hover:border-precision-cyan/20' : 'pointer-events-none'
                      }`}
                      title={m.downtime_reason ? `${m.name}: ${m.downtime_reason}` : m.name}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] text-slate-300 font-semibold truncate max-w-[80px]">{m.name}</span>
                        <span className={`h-2 w-2 rounded-full ${
                          m.status === 'Active' ? 'bg-emerald-500' :
                          m.status === 'Offline' ? 'bg-slate-500' : 'bg-red-500'
                        }`}></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Visualization Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Production Trends output line chart */}
        <div className="glass-panel p-6">
          <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-precision-cyan" />
            <span>Daily Output & Defects Trend</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.production_trends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '10px' }}
                  itemStyle={{ fontSize: '11px' }}
                />
                <Line type="monotone" dataKey="output" stroke="#06B6D4" strokeWidth={2} dot={false} name="Output Units" />
                <Line type="monotone" dataKey="defects" stroke="#EF4444" strokeWidth={2} dot={false} name="Defect Units" />
                <Legend wrapperStyle={{ fontSize: '10px', color: '#64748b' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Capacity Utilization & Yield Rates (stacked) */}
        <div className="glass-panel p-6">
          <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-emerald-400" />
            <span>Line Capacity Utilization</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.utilization} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="line_name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '10px' }}
                  itemStyle={{ fontSize: '11px' }}
                />
                <Bar dataKey="utilization" fill="#10B981" radius={[4, 4, 0, 0]} name="Capacity Utilization %" barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Bottlenecks List */}
      <div className="glass-panel p-6">
        <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2 text-rose-400">
          <AlertTriangle size={16} />
          <span>Active Bottleneck Warnings</span>
        </h3>
        {stats.bottlenecks.length === 0 ? (
          <p className="text-xs text-slate-500">All machine stations operating within normal yield parameters.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.bottlenecks.map((b, idx) => (
              <div key={idx} className="p-4 border border-rose-950/20 bg-rose-500/[0.01] rounded-lg flex items-start gap-3">
                <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{b.machine_name}</h4>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{b.line_name} ({b.type})</p>
                  <p className="text-[11px] text-rose-400 mt-2 font-medium">
                    {b.status === 'Active' ? `Yield warning: ${b.failure_count} failures` : `Machine Down: ${b.downtime_reason || 'Unknown error'}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Work Orders CRUD section */}
      <div className="glass-panel p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-200">Work Orders Registry</h3>
            <p className="text-xs text-slate-500">Review production batches, completed quantities, and scheduling.</p>
          </div>
          {canWrite && (
            <button 
              onClick={openWOCreate}
              className="flex items-center gap-1.5 bg-precision-cyan hover:bg-precision-cyanLight text-obsidian-950 text-xs font-bold px-3.5 py-2 rounded-lg transition-all active:scale-95"
            >
              <Plus size={14} /> Release Work Order
            </button>
          )}
        </div>

        {/* Filter bar */}
        <form onSubmit={handleWOSearchSubmit} className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Search work orders..." 
              value={woSearch}
              onChange={(e) => setWoSearch(e.target.value)}
              className="w-full bg-obsidian-950 border border-slate-800/80 focus:border-precision-cyan/80 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 outline-none"
            />
            <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
          </div>
          
          <select 
            value={woStatus}
            onChange={(e) => { setWoStatus(e.target.value); setWoPage(1); }}
            className="bg-obsidian-950 border border-slate-800/80 focus:border-precision-cyan/80 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Released">Released</option>
            <option value="In_Production">In Production</option>
            <option value="Paused">Paused</option>
            <option value="Closed">Closed</option>
          </select>
          
          <button 
            type="button" 
            onClick={resetWOFilters}
            className="p-2 bg-obsidian-950/60 hover:bg-obsidian-900 border border-slate-800/80 text-slate-400 hover:text-slate-200 rounded-lg"
          >
            <RotateCcw size={14} />
          </button>
        </form>

        {/* WO Table */}
        {loadingWO ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-2">
            <div className="h-6 w-6 rounded-full border-2 border-t-precision-cyan border-slate-800 animate-spin"></div>
            <span className="text-xs text-slate-500">Querying work orders...</span>
          </div>
        ) : workOrders.length === 0 ? (
          <div className="text-center py-10 text-slate-600 text-xs">No work orders registered.</div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-500 uppercase font-semibold tracking-wider">
                    <th className="py-2.5 px-4">WO Number</th>
                    <th className="py-2.5 px-4">Project Name</th>
                    <th className="py-2.5 px-4">Qty Ordered</th>
                    <th className="py-2.5 px-4">Qty Completed</th>
                    <th className="py-2.5 px-4">Progress</th>
                    <th className="py-2.5 px-4">Status</th>
                    {canWrite && <th className="py-2.5 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300">
                  {workOrders.map(wo => {
                    const progressPercent = wo.quantity_ordered > 0
                      ? Math.round((wo.quantity_completed / wo.quantity_ordered) * 100)
                      : 0;

                    return (
                      <tr key={wo.id} className="hover:bg-slate-850/20 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-precision-cyanLight">{wo.work_order_number}</td>
                        <td className="py-3 px-4 font-semibold text-slate-200">{wo.project_name || '—'}</td>
                        <td className="py-3 px-4 font-mono">{wo.quantity_ordered}</td>
                        <td className="py-3 px-4 font-mono">{wo.quantity_completed}</td>
                        <td className="py-3 px-4 min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-obsidian-950 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-precision-cyan h-full" style={{ width: `${progressPercent}%` }}></div>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">{progressPercent}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getWOStatusClass(wo.status)}`}>
                            {wo.status.replace('_', ' ')}
                          </span>
                        </td>
                        {canWrite && (
                          <td className="py-3 px-4 text-right space-x-2">
                            <button 
                              onClick={() => openWOEdit(wo)}
                              className="text-slate-400 hover:text-slate-200 transition-colors p-1"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button 
                              onClick={() => handleDeleteWO(wo.id)}
                              className="text-red-400 hover:text-red-300 transition-colors p-1"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-500">Showing {workOrders.length} batches</span>
              <div className="flex items-center gap-1.5">
                <button 
                  disabled={woPage === 1}
                  onClick={() => setWoPage(p => Math.max(1, p - 1))}
                  className="p-1.5 bg-obsidian-900 border border-slate-800/80 text-slate-400 hover:text-slate-200 disabled:opacity-40 rounded transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs text-slate-400 font-mono">{woPage} / {woPages}</span>
                <button 
                  disabled={woPage === woPages}
                  onClick={() => setWoPage(p => Math.min(woPages, p + 1))}
                  className="p-1.5 bg-obsidian-900 border border-slate-800/80 text-slate-400 hover:text-slate-200 disabled:opacity-40 rounded transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* WORK ORDER DIALOG */}
      {showWOModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowWOModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="glass-panel w-full max-w-md p-6 relative z-10 border border-slate-700/50 glow-cyan">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-base font-bold text-slate-100">
                {editingWO ? 'Modify Work Order' : 'Release Work Order'}
              </h3>
              <button onClick={() => setShowWOModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>
            
            {woFormError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2 mb-4">
                <AlertCircle size={16} />
                <span>{woFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveWO} className="space-y-4">
              {!editingWO && (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Target Project</label>
                  <select 
                    required
                    value={woForm.project_id}
                    onChange={(e) => setWoForm({ ...woForm, project_id: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="">Select project...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Work Order Number</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. WO-SMT-2026-902"
                  value={woForm.work_order_number}
                  onChange={(e) => setWoForm({ ...woForm, work_order_number: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Quantity Ordered</label>
                  <input 
                    type="number" 
                    required
                    placeholder="1000"
                    value={woForm.quantity_ordered}
                    onChange={(e) => setWoForm({ ...woForm, quantity_ordered: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Quantity Completed</label>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={woForm.quantity_completed}
                    onChange={(e) => setWoForm({ ...woForm, quantity_completed: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</label>
                <select 
                  value={woForm.status}
                  onChange={(e) => setWoForm({ ...woForm, status: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none"
                >
                  <option value="Released">Released</option>
                  <option value="In_Production">In Production</option>
                  <option value="Paused">Paused</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowWOModal(false)}
                  className="px-3.5 py-1.5 border border-slate-800 hover:bg-slate-800/40 text-slate-300 text-xs font-semibold rounded"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={woSubmitting}
                  className="bg-precision-cyan text-obsidian-950 font-bold px-4 py-1.5 rounded text-xs hover:bg-precision-cyanLight"
                >
                  {woSubmitting ? 'Saving...' : 'Release Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MACHINE TOGGLE DIALOG */}
      {showMachineModal && selectedMachine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowMachineModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="glass-panel w-full max-w-sm p-6 relative z-10 border border-slate-700/50 glow-cyan">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-100">Toggle Machine Status</h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{selectedMachine.name}</p>
              </div>
              <button onClick={() => setShowMachineModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>
            
            <form onSubmit={handleSaveMachineStatus} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Select Status</label>
                <select 
                  value={machineForm.status}
                  onChange={(e) => setMachineForm({ ...machineForm, status: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none"
                >
                  <option value="Active">Active / Operational</option>
                  <option value="Offline">Offline / Standby</option>
                  <option value="Error">Error / Downtime</option>
                </select>
              </div>

              {machineForm.status !== 'Active' && (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Downtime Reason</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Mechanical feeder jam"
                    value={machineForm.downtime_reason}
                    onChange={(e) => setMachineForm({ ...machineForm, downtime_reason: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowMachineModal(false)}
                  className="px-3.5 py-1.5 border border-slate-800 hover:bg-slate-800/40 text-slate-300 text-xs font-semibold rounded"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-precision-cyan text-obsidian-950 font-bold px-4 py-1.5 rounded text-xs hover:bg-precision-cyanLight"
                >
                  Apply Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Production;
