import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import afterSalesService from '../../services/afterSalesService';
import projectService from '../../services/projectService';
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
  Legend,
  LineChart,
  Line
} from 'recharts';
import { 
  Plus, 
  Search, 
  RotateCcw,
  ChevronLeft,
  ChevronRight,
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
  Edit2,
  ShieldCheck,
  FileText,
  ClipboardList,
  Compass,
  ArrowRight,
  ShieldAlert,
  Shield,
  ThumbsUp,
  Frown,
  Star
} from 'lucide-react';

const AfterSales = () => {
  const { activeRole } = useAuth();
  
  // Tab states: 'dashboard', 'rmas', 'repairs', 'warranties', 'complaints'
  const [activeTab, setActiveTab] = useState('dashboard');

  const [stats, setStats] = useState(null);
  const [rmas, setRmas] = useState([]);
  const [rmaTotal, setRmaTotal] = useState(0);
  const [rmaPage, setRmaPage] = useState(1);
  const [rmaPages, setRmaPages] = useState(1);

  const [repairs, setRepairs] = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // RMA search/filter
  const [searchRMA, setSearchRMA] = useState('');
  const [rmaStatusFilter, setRmaStatusFilter] = useState('');

  // Warranty Live check states
  const [checkSerialNumber, setCheckSerialNumber] = useState('');
  const [checkedWarranty, setCheckedWarranty] = useState(null);
  const [checkedWarrantyError, setCheckedWarrantyError] = useState('');

  // RMA Modal
  const [showRMAModal, setShowRMAModal] = useState(false);
  const [editingRMA, setEditingRMA] = useState(null);
  const [rmaForm, setRmaForm] = useState({
    project_id: '',
    rma_number: '',
    reason_code: '',
    status: 'Requested',
    customer_name: '',
    customer_email: '',
    serial_number: '',
    priority: 'Medium',
    created_at: new Date().toISOString().split('T')[0]
  });
  const [rmaFormError, setRmaFormError] = useState('');
  const [rmaSubmitting, setRmaSubmitting] = useState(false);

  // Repair Modal
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [editingRepair, setEditingRepair] = useState(null);
  const [repairForm, setRepairForm] = useState({
    diagnostics: '',
    repair_action: '',
    status: 'Pending_Diagnostics',
    completion_date: ''
  });
  const [requestSparePartId, setRequestSparePartId] = useState('');
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [repairSubmitting, setRepairSubmitting] = useState(false);

  // Complaint Modal
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintForm, setComplaintForm] = useState({
    customer_name: '',
    complaint_text: '',
    root_cause: '',
    resolution: '',
    status: 'Open',
    customer_feedback_score: 5
  });

  const canWriteRMA = activeRole === 'Admin' || activeRole === 'Customer_Rep';
  const canWriteRepair = activeRole === 'Admin' || activeRole === 'Service_Engineer';

  // Load static resources
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const projData = await projectService.getProjects({ limit: 100 });
        setProjects(projData.items);
      } catch (err) {
        console.error('Failed to load projects list', err);
      }
    };
    fetchResources();
  }, []);

  // Fetch RMAs
  const fetchRMAs = async () => {
    try {
      const params = {
        page: rmaPage,
        limit: 5,
        search: searchRMA || undefined,
        status_filter: rmaStatusFilter || undefined
      };
      const data = await afterSalesService.getRMAs(params);
      setRmas(data.items);
      setRmaTotal(data.total);
      setRmaPages(data.pages);
    } catch (err) {
      console.error('Failed to fetch RMAs', err);
    }
  };

  const loadAllDashboardData = async () => {
    try {
      setError('');
      const [statsData, repairsList, warrantiesList, complaintsList, partsList] = await Promise.all([
        afterSalesService.getDashboardStats(),
        afterSalesService.getRepairs(),
        afterSalesService.getWarranties(),
        afterSalesService.getComplaints(),
        afterSalesService.getSpareParts()
      ]);
      setStats(statsData);
      setRepairs(repairsList);
      setWarranties(warrantiesList);
      setComplaints(complaintsList);
      setSpareParts(partsList);
    } catch (err) {
      setError('Failed to fetch after-sales stats');
    }
  };

  const initData = async () => {
    setLoading(true);
    await Promise.all([
      loadAllDashboardData(),
      fetchRMAs()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    initData();
  }, [rmaPage, rmaStatusFilter]);

  const handleRMASearch = (e) => {
    e.preventDefault();
    setRmaPage(1);
    fetchRMAs();
  };

  // Save RMA
  const handleSaveRMA = async (e) => {
    e.preventDefault();
    setRmaFormError('');
    if (!rmaForm.project_id) return setRmaFormError('Project is required');
    if (!rmaForm.rma_number.trim()) return setRmaFormError('RMA Number is required');
    if (!rmaForm.reason_code.trim()) return setRmaFormError('Reason Code is required');

    setRmaSubmitting(true);
    try {
      if (editingRMA) {
        await afterSalesService.updateRMA(editingRMA.id, rmaForm);
      } else {
        await afterSalesService.createRMA(rmaForm);
      }
      setShowRMAModal(false);
      initData();
    } catch (err) {
      setRmaFormError(err.response?.data?.detail || 'Failed to save RMA Case');
    } finally {
      setRmaSubmitting(false);
    }
  };

  const openRMAEdit = (rma) => {
    setEditingRMA(rma);
    setRmaForm({
      project_id: rma.project_id,
      rma_number: rma.rma_number,
      reason_code: rma.reason_code,
      status: rma.status,
      customer_name: rma.customer_name || '',
      customer_email: rma.customer_email || '',
      serial_number: rma.serial_number || '',
      priority: rma.priority,
      created_at: rma.created_at
    });
    setRmaFormError('');
    setShowRMAModal(true);
  };

  const openRMACreate = () => {
    setEditingRMA(null);
    setRmaForm({
      project_id: '',
      rma_number: `RMA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      reason_code: '',
      status: 'Requested',
      customer_name: '',
      customer_email: '',
      serial_number: '',
      priority: 'Medium',
      created_at: new Date().toISOString().split('T')[0]
    });
    setRmaFormError('');
    setShowRMAModal(true);
  };

  const handleDeleteRMA = async (rmaId) => {
    if (!window.confirm('Are you sure you want to delete this RMA Case?')) return;
    try {
      await afterSalesService.deleteRMA(rmaId);
      initData();
    } catch (err) {
      alert('Failed to delete RMA Case');
    }
  };

  // Warranty dynamic validation check
  const handleCheckWarranty = async (e) => {
    e.preventDefault();
    setCheckedWarranty(null);
    setCheckedWarrantyError('');
    if (!checkSerialNumber.trim()) return;
    try {
      const data = await afterSalesService.checkWarranty(checkSerialNumber.trim());
      setCheckedWarranty(data);
    } catch (err) {
      setCheckedWarrantyError(err.response?.data?.detail || 'Serial number warranty registration not found');
    }
  };

  // Update Repair
  const handleUpdateRepair = async (e) => {
    e.preventDefault();
    setRepairSubmitting(true);
    try {
      const payload = {
        ...repairForm,
        completion_date: repairForm.completion_date || null
      };
      await afterSalesService.updateRepair(editingRepair.id, payload);

      // Handle spare part request if selected
      if (requestSparePartId) {
        await afterSalesService.createSparePartsRequest(editingRepair.id, {
          spare_part_id: requestSparePartId,
          quantity_requested: Number(requestQuantity)
        });
      }

      setShowRepairModal(false);
      initData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update repair details');
    } finally {
      setRepairSubmitting(false);
    }
  };

  const openRepairEdit = (rep) => {
    setEditingRepair(rep);
    setRepairForm({
      diagnostics: rep.diagnostics || '',
      repair_action: rep.repair_action || '',
      status: rep.status,
      completion_date: rep.completion_date || ''
    });
    setRequestSparePartId('');
    setRequestQuantity(1);
    setShowRepairModal(true);
  };

  // Save Customer Complaint
  const handleSaveComplaint = async (e) => {
    e.preventDefault();
    if (!complaintForm.customer_name || !complaintForm.complaint_text) {
      alert('Fill all required fields');
      return;
    }
    try {
      await afterSalesService.createComplaint({
        ...complaintForm,
        customer_feedback_score: Number(complaintForm.customer_feedback_score)
      });
      setShowComplaintModal(false);
      loadAllDashboardData();
    } catch (err) {
      alert('Failed to log customer complaint');
    }
  };

  const getPriorityClass = (p) => {
    switch (p) {
      case 'Critical': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'High': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    }
  };

  const getRMAStatusClass = (s) => {
    switch (s) {
      case 'Completed': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Repairing': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'In_Triage': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      default: return 'bg-slate-700/20 text-slate-400 border border-slate-700/40'; // Requested / Cancelled
    }
  };

  const getRepairStatusClass = (s) => {
    switch (s) {
      case 'Completed': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'In_Progress': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Under_QA': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'Scrap': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default: return 'bg-slate-700/20 text-slate-400 border border-slate-700/40'; // Pending Diagnostics
    }
  };

  const COLORS = ['#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Top Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Wrench size={24} className="text-precision-cyan" />
            <span>After-Sales RMA & Diagnostics Portal</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Validate device warranties, log triage diagnostics, request spare parts, and address customer complaints.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800/80 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-3 text-xs uppercase tracking-wider font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'dashboard' ? 'border-precision-cyan text-precision-cyanLight bg-precision-cyan/5' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          RMA Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('rmas')}
          className={`px-4 py-3 text-xs uppercase tracking-wider font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'rmas' ? 'border-precision-cyan text-precision-cyanLight bg-precision-cyan/5' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          RMA Cases Registry
        </button>
        <button 
          onClick={() => setActiveTab('repairs')}
          className={`px-4 py-3 text-xs uppercase tracking-wider font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'repairs' ? 'border-precision-cyan text-precision-cyanLight bg-precision-cyan/5' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Repair Management
        </button>
        <button 
          onClick={() => setActiveTab('warranties')}
          className={`px-4 py-3 text-xs uppercase tracking-wider font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'warranties' ? 'border-precision-cyan text-precision-cyanLight bg-precision-cyan/5' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Warranty Validation
        </button>
        <button 
          onClick={() => setActiveTab('complaints')}
          className={`px-4 py-3 text-xs uppercase tracking-wider font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'complaints' ? 'border-precision-cyan text-precision-cyanLight bg-precision-cyan/5' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Complaints Log
        </button>
      </div>

      {/* Panels */}
      <div className="space-y-6">

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="glass-card text-center p-4">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Open RMAs</span>
                <p className="text-xl font-bold text-precision-cyanLight mt-1 font-mono">{stats.open_rmas}</p>
              </div>
              <div className="glass-card text-center p-4">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Closed RMAs</span>
                <p className="text-xl font-bold text-slate-200 mt-1 font-mono">{stats.closed_rmas}</p>
              </div>
              <div className="glass-card text-center p-4">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Warranty Claims</span>
                <p className="text-xl font-bold text-amber-400 mt-1 font-mono">{stats.warranty_claims}</p>
              </div>
              <div className="glass-card text-center p-4">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Repair Success Rate</span>
                <p className="text-xl font-bold text-emerald-400 mt-1 font-mono">{stats.repair_success_rate}%</p>
              </div>
              <div className="glass-card text-center p-4">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Avg Repair Time</span>
                <p className="text-xl font-bold text-slate-200 mt-1 font-mono">{stats.average_repair_time}d</p>
              </div>
              <div className="glass-card text-center p-4">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Pending Diagnostics</span>
                <p className="text-xl font-bold text-rose-400 mt-1 font-mono">{stats.pending_diagnostics}</p>
              </div>
              <div className="glass-card text-center p-4">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Spare Parts Req</span>
                <p className="text-xl font-bold text-slate-200 mt-1 font-mono">{stats.spare_parts_requests_count}</p>
              </div>
            </div>

            {/* Visual Analytics */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* RMA Trend Line chart */}
              <div className="glass-panel p-6 lg:col-span-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">RMA Weekly Intake Volume</h4>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.rma_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="date" stroke="#64748b" fontSize={9} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '11px', color: '#06B6D4' }}
                      />
                      <Line type="monotone" dataKey="count" stroke="#06B6D4" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Warranty claims by month */}
              <div className="glass-panel p-6">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Warranty Claims Trend</h4>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.warranty_claims_by_month} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '11px', color: '#F59E0B' }}
                      />
                      <Bar dataKey="claims" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Customer feedback / Complaints */}
              <div className="glass-panel p-6">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Complaints Failures Breakdown</h4>
                <div className="h-60 flex flex-col justify-between">
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.complaints_categories}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="count"
                          nameKey="category"
                        >
                          {stats.complaints_categories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                          itemStyle={{ fontSize: '11px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Legend list */}
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] text-slate-400">
                    {stats.complaints_categories.map((c, i) => (
                      <span key={c.category} className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full block" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                        {c.category} ({c.count})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Spare Parts Stock Status */}
            <div className="glass-panel p-6">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Spare Parts Stock Catalog</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {spareParts.map(p => (
                  <div key={p.id} className="p-4 border border-slate-800/80 rounded-xl bg-obsidian-950/20 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 font-bold block">{p.part_number}</span>
                      <span className="text-xs font-bold text-slate-200 block mt-1">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-semibold block">In Stock</span>
                      <span className={`text-base font-bold font-mono block mt-1 ${p.stock < 15 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {p.stock} pcs
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: RMA CASES */}
        {activeTab === 'rmas' && (
          <div className="space-y-6">
            
            <div className="glass-panel p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-200">Customer RMA Logbook</h3>
                  <p className="text-xs text-slate-500">Record and follow-up customer return authorizations.</p>
                </div>
                {canWriteRMA && (
                  <button 
                    onClick={openRMACreate}
                    className="flex items-center gap-1 bg-precision-cyan hover:bg-precision-cyanLight text-obsidian-950 text-xs font-bold px-3.5 py-2 rounded-lg"
                  >
                    <Plus size={14} /> Intake RMA Case
                  </button>
                )}
              </div>

              {/* Filters */}
              <form onSubmit={handleRMASearch} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search by RMA/customer/serial..." 
                    value={searchRMA}
                    onChange={(e) => setSearchRMA(e.target.value)}
                    className="w-full bg-obsidian-950 border border-slate-800/80 focus:border-precision-cyan/80 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 outline-none"
                  />
                  <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                </div>

                <select 
                  value={rmaStatusFilter}
                  onChange={(e) => setRmaStatusFilter(e.target.value)}
                  className="bg-obsidian-950 border border-slate-800/80 focus:border-precision-cyan/80 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="Requested">Requested</option>
                  <option value="In_Triage">In Triage</option>
                  <option value="Repairing">Repairing</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold py-2 rounded-lg">Search</button>

                <button 
                  type="button" 
                  onClick={() => { setSearchRMA(''); setRmaStatusFilter(''); fetchRMAs(); }}
                  className="p-2 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs"
                >
                  Clear Filters
                </button>
              </form>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-slate-500 uppercase font-semibold">
                      <th className="py-2.5 px-4">RMA Number</th>
                      <th className="py-2.5 px-4">Project</th>
                      <th className="py-2.5 px-4">Customer</th>
                      <th className="py-2.5 px-4">Serial Number</th>
                      <th className="py-2.5 px-4">Reason Failure</th>
                      <th className="py-2.5 px-4">Created Date</th>
                      <th className="py-2.5 px-4">Priority</th>
                      <th className="py-2.5 px-4">Status</th>
                      {canWriteRMA && <th className="py-2.5 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                    {rmas.map(rma => (
                      <tr key={rma.id} className="hover:bg-slate-850/10">
                        <td className="py-3 px-4 font-mono font-bold text-precision-cyanLight">{rma.rma_number}</td>
                        <td className="py-3 px-4 text-slate-300 font-semibold">{rma.project?.name}</td>
                        <td className="py-3 px-4 font-bold text-slate-200">
                          {rma.customer_name}
                          <span className="text-[10px] text-slate-500 block">{rma.customer_email}</span>
                        </td>
                        <td className="py-3 px-4 font-mono">{rma.serial_number || '—'}</td>
                        <td className="py-3 px-4 text-slate-400 font-semibold">{rma.reason_code.replace('_', ' ')}</td>
                        <td className="py-3 px-4 font-mono">{new Date(rma.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getPriorityClass(rma.priority)}`}>
                            {rma.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getRMAStatusClass(rma.status)}`}>
                            {rma.status.replace('_', ' ')}
                          </span>
                        </td>
                        {canWriteRMA && (
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            <button 
                              onClick={() => openRMAEdit(rma)}
                              className="text-slate-400 hover:text-slate-200 p-1"
                              title="Edit RMA"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button 
                              onClick={() => handleDeleteRMA(rma.id)}
                              className="text-red-400 hover:text-red-300 p-1"
                              title="Delete RMA"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center pt-4">
                <span className="text-[11px] text-slate-500">Showing {rmas.length} RMA Cases</span>
                <div className="flex items-center gap-1.5">
                  <button 
                    disabled={rmaPage === 1}
                    onClick={() => setRmaPage(p => Math.max(1, p - 1))}
                    className="p-1.5 bg-obsidian-900 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-40 rounded"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs text-slate-400 font-mono">{rmaPage} / {rmaPages}</span>
                  <button 
                    disabled={rmaPage === rmaPages}
                    onClick={() => setRmaPage(p => Math.min(rmaPages, p + 1))}
                    className="p-1.5 bg-obsidian-900 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-40 rounded"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: REPAIR MANAGEMENT */}
        {activeTab === 'repairs' && (
          <div className="space-y-6">
            
            <div className="glass-panel p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-200">RMA Repair Operations</h3>
                  <p className="text-xs text-slate-500">Log device diagnostics and dispatch repaired shipments.</p>
                </div>
              </div>

              {repairs.length === 0 ? (
                <div className="text-center py-10 text-slate-500">No active repairs queued.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-slate-500 uppercase font-semibold">
                        <th className="py-2.5 px-4">RMA Case</th>
                        <th className="py-2.5 px-4">Serial ID</th>
                        <th className="py-2.5 px-4">Assigned Tech</th>
                        <th className="py-2.5 px-4">Triage Diagnostics</th>
                        <th className="py-2.5 px-4">Repair Actions</th>
                        <th className="py-2.5 px-4">Spare Parts Logged</th>
                        <th className="py-2.5 px-4">Completion Date</th>
                        <th className="py-2.5 px-4">Status</th>
                        {canWriteRepair && <th className="py-2.5 px-4 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300">
                      {repairs.map(rep => (
                        <tr key={rep.id} className="hover:bg-slate-850/10">
                          <td className="py-3 px-4 font-mono font-bold text-precision-cyanLight">{rep.rma_case?.rma_number}</td>
                          <td className="py-3 px-4 font-mono">{rep.rma_case?.serial_number}</td>
                          <td className="py-3 px-4 font-semibold text-slate-400">{rep.assigned_engineer?.full_name || 'Unassigned'}</td>
                          <td className="py-3 px-4 text-slate-300 font-medium max-w-xs truncate" title={rep.diagnostics}>{rep.diagnostics || '—'}</td>
                          <td className="py-3 px-4 text-slate-300 font-medium max-w-xs truncate" title={rep.repair_action}>{rep.repair_action || '—'}</td>
                          <td className="py-3 px-4 font-semibold text-amber-400">
                            {rep.parts_requested.length > 0 ? (
                              <div className="flex flex-col gap-0.5">
                                {rep.parts_requested.map(pr => (
                                  <span key={pr.id}>{pr.spare_part?.part_number} (x{pr.quantity_requested})</span>
                                ))}
                              </div>
                            ) : 'None'}
                          </td>
                          <td className="py-3 px-4 font-mono">{rep.completion_date ? new Date(rep.completion_date).toLocaleDateString() : '—'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getRepairStatusClass(rep.status)}`}>
                              {rep.status.replace('_', ' ')}
                            </span>
                          </td>
                          {canWriteRepair && (
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button 
                                onClick={() => openRepairEdit(rep)}
                                className="text-precision-cyan hover:text-precision-cyanLight font-bold px-2 py-1 bg-precision-cyan/5 rounded border border-precision-cyan/20"
                              >
                                Log Diagnostics
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 4: WARRANTY VALIDATION */}
        {activeTab === 'warranties' && (
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Warranty validation form */}
            <div className="glass-panel p-6 h-fit">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Device Warranty Check</h3>
              <form onSubmit={handleCheckWarranty} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Enter Serial Number</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. SN-ACME-001"
                    value={checkSerialNumber}
                    onChange={(e) => setCheckSerialNumber(e.target.value)}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none font-mono"
                  />
                </div>
                <button type="submit" className="w-full bg-precision-cyan hover:bg-precision-cyanLight text-obsidian-950 font-bold py-2 rounded text-xs">Check Warranty Status</button>
              </form>

              {/* Checked results */}
              {checkedWarranty && (
                <div className="mt-6 p-4 border border-slate-800 bg-obsidian-950/40 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Registration</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      checkedWarranty.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {checkedWarranty.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Expiry Date</span>
                    <span className="text-xs font-mono font-bold text-slate-200">{new Date(checkedWarranty.expiry_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Logged Claims</span>
                    <span className="text-xs font-mono font-bold text-slate-200">{checkedWarranty.claim_count} claims</span>
                  </div>
                  <div className="pt-2 flex items-center gap-1 text-[11px] text-slate-400">
                    {checkedWarranty.status === 'Active' ? (
                      <>
                        <Shield className="text-emerald-400" size={14} />
                        <span>Coverage active. Free RMA allowed.</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="text-rose-400" size={14} />
                        <span>Coverage expired. Out-of-warranty fees apply.</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {checkedWarrantyError && (
                <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded">
                  {checkedWarrantyError}
                </div>
              )}
            </div>

            {/* List of warranties catalog */}
            <div className="glass-panel p-6 md:col-span-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Warranty Registration Database</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-slate-500 uppercase font-semibold">
                      <th className="py-2.5 px-4">Serial Number</th>
                      <th className="py-2.5 px-4">Expiration Date</th>
                      <th className="py-2.5 px-4">Claims Count</th>
                      <th className="py-2.5 px-4">Warranty Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                    {warranties.map(w => (
                      <tr key={w.id} className="hover:bg-slate-850/10">
                        <td className="py-3 px-4 font-mono font-bold text-slate-200">{w.serial_number}</td>
                        <td className="py-3 px-4 font-mono">{new Date(w.expiry_date).toLocaleDateString()}</td>
                        <td className="py-3 px-4 font-semibold text-slate-300">{w.claim_count} logged claims</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            w.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {w.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: COMPLAINTS LOG */}
        {activeTab === 'complaints' && (
          <div className="space-y-6">
            
            <div className="glass-panel p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-200">Customer Complaints Logbook</h3>
                  <p className="text-xs text-slate-500">Address customer feedback and trace root cause resolutions.</p>
                </div>
                {canWriteRMA && (
                  <button 
                    onClick={() => {
                      setComplaintForm({
                        customer_name: '',
                        complaint_text: '',
                        root_cause: '',
                        resolution: '',
                        status: 'Open',
                        customer_feedback_score: 5
                      });
                      setShowComplaintModal(true);
                    }}
                    className="flex items-center gap-1 bg-precision-cyan hover:bg-precision-cyanLight text-obsidian-950 text-xs font-bold px-2.5 py-1.5 rounded"
                  >
                    <Plus size={12} /> Log Complaint
                  </button>
                )}
              </div>

              {complaints.length === 0 ? (
                <div className="text-center py-10 text-slate-500">No customer complaints logged.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-slate-500 uppercase font-semibold">
                        <th className="py-2.5 px-4">Logged Date</th>
                        <th className="py-2.5 px-4">Customer Name</th>
                        <th className="py-2.5 px-4">Complaint Text</th>
                        <th className="py-2.5 px-4">Root Cause Failure</th>
                        <th className="py-2.5 px-4">Resolution Action</th>
                        <th className="py-2.5 px-4">Feedback Score</th>
                        <th className="py-2.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300">
                      {complaints.map(comp => (
                        <tr key={comp.id} className="hover:bg-slate-850/10">
                          <td className="py-3 px-4 font-mono">{new Date(comp.logged_at).toLocaleDateString()}</td>
                          <td className="py-3 px-4 font-bold text-slate-200">{comp.customer_name}</td>
                          <td className="py-3 px-4 text-slate-300 max-w-sm truncate" title={comp.complaint_text}>{comp.complaint_text}</td>
                          <td className="py-3 px-4 text-slate-400 max-w-xs truncate" title={comp.root_cause}>{comp.root_cause || '—'}</td>
                          <td className="py-3 px-4 text-slate-400 max-w-xs truncate" title={comp.resolution}>{comp.resolution || '—'}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-0.5 text-amber-400">
                              {comp.customer_feedback_score ? (
                                Array.from({ length: comp.customer_feedback_score }).map((_, i) => (
                                  <Star key={i} size={11} fill="currentColor" />
                                ))
                              ) : '—'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              comp.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {comp.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* RMA INTAKE MODAL */}
      {showRMAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowRMAModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="glass-panel w-full max-w-md p-6 relative z-10 border border-slate-700/50 glow-cyan">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-base font-bold text-slate-100">
                {editingRMA ? 'Modify RMA Case' : 'Log Customer Return (RMA)'}
              </h3>
              <button onClick={() => setShowRMAModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>
            
            {rmaFormError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded mb-4">
                {rmaFormError}
              </div>
            )}

            <form onSubmit={handleSaveRMA} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Target Project</label>
                <select 
                  required
                  value={rmaForm.project_id}
                  onChange={(e) => setRmaForm({ ...rmaForm, project_id: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                >
                  <option value="">Select target project...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">RMA Number</label>
                  <input 
                    type="text" 
                    required
                    value={rmaForm.rma_number}
                    onChange={(e) => setRmaForm({ ...rmaForm, rma_number: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Failure Reason Code</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. RF_Noise"
                    value={rmaForm.reason_code}
                    onChange={(e) => setRmaForm({ ...rmaForm, reason_code: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Device Serial ID</label>
                  <input 
                    type="text" 
                    placeholder="e.g. SN-ACME-011"
                    value={rmaForm.serial_number}
                    onChange={(e) => setRmaForm({ ...rmaForm, serial_number: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Priority</label>
                  <select 
                    value={rmaForm.priority}
                    onChange={(e) => setRmaForm({ ...rmaForm, priority: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Customer Name</label>
                  <input 
                    type="text" 
                    placeholder="Dave Miller"
                    value={rmaForm.customer_name}
                    onChange={(e) => setRmaForm({ ...rmaForm, customer_name: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Customer Email</label>
                  <input 
                    type="email" 
                    placeholder="dave@gmail.com"
                    value={rmaForm.customer_email}
                    onChange={(e) => setRmaForm({ ...rmaForm, customer_email: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">RMA Status</label>
                <select 
                  value={rmaForm.status}
                  onChange={(e) => setRmaForm({ ...rmaForm, status: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                >
                  <option value="Requested">Requested</option>
                  <option value="In_Triage">In Triage</option>
                  <option value="Repairing">Repairing</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowRMAModal(false)}
                  className="px-3.5 py-1.5 border border-slate-800 text-slate-300 text-xs font-semibold rounded hover:bg-slate-800/40"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={rmaSubmitting}
                  className="bg-precision-cyan text-obsidian-950 font-bold px-4 py-1.5 rounded text-xs hover:bg-precision-cyanLight"
                >
                  {rmaSubmitting ? 'Saving...' : 'Save RMA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPAIR DIAGNOSTICS LOG MODAL */}
      {showRepairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowRepairModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="glass-panel w-full max-w-md p-6 relative z-10 border border-slate-700/50 glow-cyan">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-base font-bold text-slate-100">Log Repair Actions & Spare Parts</h3>
              <button onClick={() => setShowRepairModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>
            
            <form onSubmit={handleUpdateRepair} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Triage Diagnostics Summary</label>
                <textarea 
                  rows={2}
                  required
                  placeholder="Found loose FPC connector header..."
                  value={repairForm.diagnostics}
                  onChange={(e) => setRepairForm({ ...repairForm, diagnostics: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Action Performed</label>
                <textarea 
                  rows={2}
                  required
                  placeholder="Reflowed FPC header solder pads..."
                  value={repairForm.repair_action}
                  onChange={(e) => setRepairForm({ ...repairForm, repair_action: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              {/* Allocate spare parts */}
              <div className="p-3 bg-obsidian-950 border border-slate-800 rounded-lg space-y-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Request Spare Component From Stock</span>
                <div className="grid grid-cols-3 gap-3">
                  <select 
                    value={requestSparePartId}
                    onChange={(e) => setRequestSparePartId(e.target.value)}
                    className="col-span-2 bg-obsidian-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 outline-none"
                  >
                    <option value="">Select Spare Component...</option>
                    {spareParts.map(sp => (
                      <option key={sp.id} value={sp.id} disabled={sp.stock <= 0}>
                        {sp.part_number} ({sp.name} - stock {sp.stock})
                      </option>
                    ))}
                  </select>
                  <input 
                    type="number" 
                    min={1}
                    value={requestQuantity}
                    onChange={(e) => setRequestQuantity(e.target.value)}
                    className="bg-obsidian-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Repair Status</label>
                  <select 
                    value={repairForm.status}
                    onChange={(e) => setRepairForm({ ...repairForm, status: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="Pending_Diagnostics">Pending Diagnostics</option>
                    <option value="In_Progress">In Progress</option>
                    <option value="Under_QA">Under QA</option>
                    <option value="Completed">Completed (RMA Closed)</option>
                    <option value="Scrap">Scrap</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Completion Date</label>
                  <input 
                    type="date" 
                    value={repairForm.completion_date}
                    onChange={(e) => setRepairForm({ ...repairForm, completion_date: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowRepairModal(false)}
                  className="px-3.5 py-1.5 border border-slate-800 text-slate-300 text-xs font-semibold rounded hover:bg-slate-800/40"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={repairSubmitting}
                  className="bg-precision-cyan text-obsidian-950 font-bold px-4 py-1.5 rounded text-xs hover:bg-precision-cyanLight"
                >
                  {repairSubmitting ? 'Logging...' : 'Save Diagnosis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLAINTS INTAKE MODAL */}
      {showComplaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowComplaintModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="glass-panel w-full max-w-sm p-6 relative z-10 border border-slate-700/50 glow-cyan">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-base font-bold text-slate-100">Log Customer Complaint</h3>
              <button onClick={() => setShowComplaintModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>
            
            <form onSubmit={handleSaveComplaint} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Customer Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Alice Smith"
                  value={complaintForm.customer_name}
                  onChange={(e) => setComplaintForm({ ...complaintForm, customer_name: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Complaint Content</label>
                <textarea 
                  rows={3}
                  required
                  placeholder="Battery dies after 2 hours..."
                  value={complaintForm.complaint_text}
                  onChange={(e) => setComplaintForm({ ...complaintForm, complaint_text: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Resolution Action</label>
                  <input 
                    type="text" 
                    placeholder="Recall lot and replace battery"
                    value={complaintForm.resolution}
                    onChange={(e) => setComplaintForm({ ...complaintForm, resolution: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Feedback Rating (1-5)</label>
                  <select 
                    value={complaintForm.customer_feedback_score}
                    onChange={(e) => setComplaintForm({ ...complaintForm, customer_feedback_score: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="5">5 Stars (Excellent)</option>
                    <option value="4">4 Stars (Good)</option>
                    <option value="3">3 Stars (Average)</option>
                    <option value="2">2 Stars (Poor)</option>
                    <option value="1">1 Star (Fail)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</label>
                <select 
                  value={complaintForm.status}
                  onChange={(e) => setComplaintForm({ ...complaintForm, status: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                >
                  <option value="Open">Open</option>
                  <option value="Investigating">Investigating</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowComplaintModal(false)}
                  className="px-3.5 py-1.5 border border-slate-800 text-slate-300 text-xs font-semibold rounded hover:bg-slate-800/40"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-precision-cyan text-obsidian-950 font-bold px-4 py-1.5 rounded text-xs hover:bg-precision-cyanLight"
                >
                  Log Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AfterSales;
