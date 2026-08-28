import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import qualityService from '../../services/qualityService';
import projectService from '../../services/projectService';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
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
  ArrowRight
} from 'lucide-react';

const Quality = () => {
  const { activeRole } = useAuth();
  
  // Tab states: 'dashboard', 'ncr', 'capa', 'spc', 'compliance', 'docs'
  const [activeTab, setActiveTab] = useState('dashboard');

  const [stats, setStats] = useState(null);
  const [ncrs, setNcrs] = useState([]);
  const [ncrTotal, setNcrTotal] = useState(0);
  const [ncrPage, setNcrPage] = useState(1);
  const [ncrPages, setNcrPages] = useState(1);
  const [spcData, setSpcData] = useState([]);
  const [audits, setAudits] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [certs, setCerts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // NCR filter states
  const [searchNCR, setSearchNCR] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // NCR modals state
  const [showNCRModal, setShowNCRModal] = useState(false);
  const [editingNCR, setEditingNCR] = useState(null);
  const [ncrForm, setNcrForm] = useState({
    project_id: '',
    ncr_number: '',
    defect_description: '',
    defect_type: 'Solder_Bridge',
    severity: 'Major',
    priority: 'Medium',
    status: 'Draft',
    assigned_engineer_id: ''
  });
  const [ncrFormError, setNcrFormError] = useState('');
  const [ncrSubmitting, setNcrSubmitting] = useState(false);

  // CAPA modals state
  const [showCAPAModal, setShowCAPAModal] = useState(false);
  const [editingCAPA, setEditingCAPA] = useState(null);
  const [capaForm, setCapaForm] = useState({
    ncr_id: '',
    containment_actions: '',
    root_cause_5_why: '',
    corrective_actions: '',
    preventive_actions: '',
    effectiveness_verified: false,
    owner_id: '',
    due_date: '',
    status: 'Open'
  });
  const [capaFormError, setCapaFormError] = useState('');
  const [capaSubmitting, setCapaSubmitting] = useState(false);

  // Audit modal state
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditForm, setAuditForm] = useState({
    audit_number: '',
    auditor_name: '',
    audit_date: '',
    findings_count: '0',
    status: 'Scheduled',
    score: '100'
  });

  // Inspection modal state
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionForm, setInspectionForm] = useState({
    project_id: '',
    date: '',
    lot_size: '',
    sample_size: '',
    defects_found: ''
  });

  // Docs filter state
  const [docSearch, setDocSearch] = useState('');
  const [docType, setDocType] = useState('');

  const canWrite = activeRole === 'Admin' || activeRole === 'Quality_Eng';
  const canCapaWrite = activeRole === 'Admin' || activeRole === 'Quality_Eng' || activeRole === 'Project_Mgr';

  // Load auxiliary lists on mount
  useEffect(() => {
    const fetchAuxData = async () => {
      try {
        const [usersData, projData] = await Promise.all([
          qualityService.getUsers(),
          projectService.getProjects({ limit: 100 })
        ]);
        setUsers(usersData);
        setProjects(projData.items);
      } catch (err) {
        console.error('Failed to load auxiliary lists', err);
      }
    };
    fetchAuxData();
  }, []);

  // Fetch NCRs
  const fetchNCRs = async () => {
    try {
      const params = {
        page: ncrPage,
        limit: 5,
        search: searchNCR || undefined,
        severity: severityFilter || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined
      };
      const data = await qualityService.getNCRs(params);
      setNcrs(data.items);
      setNcrTotal(data.total);
      setNcrPages(data.pages);
    } catch (err) {
      console.error('Failed to load NCR list', err);
    }
  };

  // Fetch Documents
  const fetchDocuments = async () => {
    try {
      const params = {
        search: docSearch || undefined,
        type: docType || undefined
      };
      const data = await qualityService.getDocuments(params);
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load document list', err);
    }
  };

  const loadAllQMSData = async () => {
    try {
      setError('');
      const [statsData, spcVals, auditsList, insList, certsList] = await Promise.all([
        qualityService.getDashboardStats(),
        qualityService.getSPCMeasurements(),
        qualityService.getAudits(),
        qualityService.getInspections(),
        qualityService.getCertifications()
      ]);
      setStats(statsData);
      setSpcData(spcVals);
      setAudits(auditsList);
      setInspections(insList);
      setCerts(certsList);
    } catch (err) {
      setError('Failed to fetch QMS dashboard data');
    }
  };

  const initData = async () => {
    setLoading(true);
    await Promise.all([
      loadAllQMSData(),
      fetchNCRs(),
      fetchDocuments()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    initData();
  }, [ncrPage, severityFilter, statusFilter, priorityFilter, docType]);

  const handleNCRSearchSubmit = (e) => {
    e.preventDefault();
    setNcrPage(1);
    fetchNCRs();
  };

  const handleDocSearchSubmit = (e) => {
    e.preventDefault();
    fetchDocuments();
  };

  // Save NCR
  const handleSaveNCR = async (e) => {
    e.preventDefault();
    setNcrFormError('');
    if (!ncrForm.project_id) return setNcrFormError('Project is required');
    if (!ncrForm.ncr_number.trim()) return setNcrFormError('NCR number is required');
    if (!ncrForm.defect_description.trim()) return setNcrFormError('Defect description is required');

    setNcrSubmitting(true);
    try {
      if (editingNCR) {
        await qualityService.updateNCR(editingNCR.id, {
          defect_description: ncrForm.defect_description,
          defect_type: ncrForm.defect_type,
          severity: ncrForm.severity,
          priority: ncrForm.priority,
          status: ncrForm.status,
          assigned_engineer_id: ncrForm.assigned_engineer_id || null
        });
      } else {
        await qualityService.createNCR({
          project_id: ncrForm.project_id,
          ncr_number: ncrForm.ncr_number,
          defect_description: ncrForm.defect_description,
          defect_type: ncrForm.defect_type,
          severity: ncrForm.severity,
          priority: ncrForm.priority,
          status: ncrForm.status,
          assigned_engineer_id: ncrForm.assigned_engineer_id || null
        });
      }
      setShowNCRModal(false);
      initData();
    } catch (err) {
      setNcrFormError(err.response?.data?.detail || 'Failed to save NCR');
    } finally {
      setNcrSubmitting(false);
    }
  };

  const openNCREdit = (ncr) => {
    setEditingNCR(ncr);
    setNcrForm({
      project_id: ncr.project_id,
      ncr_number: ncr.ncr_number,
      defect_description: ncr.defect_description,
      defect_type: ncr.defect_type,
      severity: ncr.severity,
      priority: ncr.priority,
      status: ncr.status,
      assigned_engineer_id: ncr.assigned_engineer_id || ''
    });
    setNcrFormError('');
    setShowNCRModal(true);
  };

  const openNCRCreate = () => {
    setEditingNCR(null);
    setNcrForm({
      project_id: '',
      ncr_number: `NCR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      defect_description: '',
      defect_type: 'Solder_Bridge',
      severity: 'Major',
      priority: 'Medium',
      status: 'Draft',
      assigned_engineer_id: ''
    });
    setNcrFormError('');
    setShowNCRModal(true);
  };

  const handleDeleteNCR = async (ncrId) => {
    if (!window.confirm('Are you sure you want to delete this NCR?')) return;
    try {
      await qualityService.deleteNCR(ncrId);
      initData();
    } catch (err) {
      alert('Failed to delete NCR');
    }
  };

  // Save CAPA
  const handleSaveCAPA = async (e) => {
    e.preventDefault();
    setCapaFormError('');
    if (!capaForm.containment_actions.trim()) return setCapaFormError('Containment actions description is required');
    if (!capaForm.root_cause_5_why.trim()) return setCapaFormError('Root cause 5 Whys is required');

    setCapaSubmitting(true);
    try {
      const payload = {
        ...capaForm,
        due_date: capaForm.due_date || null,
        owner_id: capaForm.owner_id || null
      };

      if (editingCAPA) {
        await qualityService.updateCAPA(editingCAPA.id, payload);
      } else {
        await qualityService.createCAPA(payload);
      }
      setShowCAPAModal(false);
      initData();
    } catch (err) {
      setCapaFormError(err.response?.data?.detail || 'Failed to save CAPA 8D');
    } finally {
      setCapaSubmitting(false);
    }
  };

  const openCAPAEdit = (capa) => {
    setEditingCAPA(capa);
    setCapaForm({
      ncr_id: capa.ncr_id,
      containment_actions: capa.containment_actions || '',
      root_cause_5_why: capa.root_cause_5_why || '',
      corrective_actions: capa.corrective_actions || '',
      preventive_actions: capa.preventive_actions || '',
      effectiveness_verified: capa.effectiveness_verified,
      owner_id: capa.owner_id || '',
      due_date: capa.due_date || '',
      status: capa.status
    });
    setCapaFormError('');
    setShowCAPAModal(true);
  };

  const openCAPACreate = (ncrId) => {
    setEditingCAPA(null);
    setCapaForm({
      ncr_id: ncrId,
      containment_actions: '',
      root_cause_5_why: '',
      corrective_actions: '',
      preventive_actions: '',
      effectiveness_verified: false,
      owner_id: '',
      due_date: '',
      status: 'Open'
    });
    setCapaFormError('');
    setShowCAPAModal(true);
  };

  // Add Audit
  const handleCreateAudit = async (e) => {
    e.preventDefault();
    if (!auditForm.audit_number.trim() || !auditForm.auditor_name.trim() || !auditForm.audit_date) {
      alert('Fill all required fields');
      return;
    }
    try {
      await qualityService.createAudit({
        audit_number: auditForm.audit_number,
        auditor_name: auditForm.auditor_name,
        audit_date: auditForm.audit_date,
        findings_count: Number(auditForm.findings_count),
        status: auditForm.status,
        score: Number(auditForm.score)
      });
      setShowAuditModal(false);
      loadAllQMSData();
    } catch (err) {
      alert('Failed to register audit');
    }
  };

  // Add Inspection
  const handleCreateInspection = async (e) => {
    e.preventDefault();
    if (!inspectionForm.project_id || !inspectionForm.date || !inspectionForm.lot_size || !inspectionForm.sample_size) {
      alert('Fill all required fields');
      return;
    }
    try {
      await qualityService.createInspection({
        project_id: inspectionForm.project_id,
        date: inspectionForm.date,
        lot_size: Number(inspectionForm.lot_size),
        sample_size: Number(inspectionForm.sample_size),
        defects_found: Number(inspectionForm.defects_found)
      });
      setShowInspectionModal(false);
      loadAllQMSData();
    } catch (err) {
      alert('Failed to log inspection');
    }
  };

  // Calculate Cp & Cpk for SPC
  const calculateSPCMetrics = () => {
    if (spcData.length === 0) return { Cp: 0, Cpk: 0 };
    const values = spcData.map(d => d.value);
    const target = spcData[0].target;
    const ucl = spcData[0].ucl;
    const lcl = spcData[0].lcl;

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const stdev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length) || 1;

    const Cp = (ucl - lcl) / (6 * stdev);
    const Cpk = Math.min((ucl - mean) / (3 * stdev), (mean - lcl) / (3 * stdev));

    return { Cp: Cp.toFixed(2), Cpk: Cpk.toFixed(2) };
  };

  const { Cp, Cpk } = calculateSPCMetrics();

  const getPriorityClass = (p) => {
    switch (p) {
      case 'Critical': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'High': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'; // Medium
    }
  };

  const getSeverityClass = (s) => {
    switch (s) {
      case 'Critical': return 'text-red-400 font-bold';
      case 'Major': return 'text-amber-400 font-semibold';
      default: return 'text-slate-300';
    }
  };

  const getStatusClass = (s) => {
    switch (s) {
      case 'Closed': return 'bg-slate-700/20 text-slate-400 border border-slate-700/40';
      case '8D_Active': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'Under_RCA': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default: return 'bg-cyan-500/10 text-precision-cyanLight border border-precision-cyan/20'; // Draft / Contained
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck size={24} className="text-precision-cyan" />
            <span>Quality & CAPA Excellence Portal</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Audit logs, corrective actions (8D), statistical process control, and lot inspection compliance.
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
          Executive Quality Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('ncr')}
          className={`px-4 py-3 text-xs uppercase tracking-wider font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'ncr' ? 'border-precision-cyan text-precision-cyanLight bg-precision-cyan/5' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          NCR Registry
        </button>
        <button 
          onClick={() => setActiveTab('capa')}
          className={`px-4 py-3 text-xs uppercase tracking-wider font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'capa' ? 'border-precision-cyan text-precision-cyanLight bg-precision-cyan/5' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          CAPA (8D) Manager
        </button>
        <button 
          onClick={() => setActiveTab('spc')}
          className={`px-4 py-3 text-xs uppercase tracking-wider font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'spc' ? 'border-precision-cyan text-precision-cyanLight bg-precision-cyan/5' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          SPC Analytics
        </button>
        <button 
          onClick={() => setActiveTab('compliance')}
          className={`px-4 py-3 text-xs uppercase tracking-wider font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'compliance' ? 'border-precision-cyan text-precision-cyanLight bg-precision-cyan/5' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Audits & Inspections
        </button>
        <button 
          onClick={() => setActiveTab('docs')}
          className={`px-4 py-3 text-xs uppercase tracking-wider font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'docs' ? 'border-precision-cyan text-precision-cyanLight bg-precision-cyan/5' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Document Control
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">

        {/* TAB 1: EXECUTIVE QUALITY DASHBOARD */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            
            {/* KPI metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <div className="glass-card text-center p-4">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Open NCRs</span>
                <p className="text-xl font-bold text-amber-400 mt-1 font-mono">{stats.open_ncrs}</p>
              </div>
              <div className="glass-card text-center p-4">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Closed NCRs</span>
                <p className="text-xl font-bold text-slate-300 mt-1 font-mono">{stats.closed_ncrs}</p>
              </div>
              <div className="glass-card text-center p-4">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">CAPAs In Progress</span>
                <p className="text-xl font-bold text-precision-cyanLight mt-1 font-mono">{stats.capas_in_progress}</p>
              </div>
              <div className="glass-card text-center p-4">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Defect PPM</span>
                <p className="text-xl font-bold text-slate-200 mt-1 font-mono">{stats.defect_ppm}</p>
              </div>
              <div className="glass-card text-center p-4">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">First Pass Yield</span>
                <p className="text-xl font-bold text-emerald-400 mt-1 font-mono">{stats.first_pass_yield}%</p>
              </div>
              <div className="glass-card text-center p-4">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">RMAs / Complaints</span>
                <p className="text-xl font-bold text-slate-300 mt-1 font-mono">{stats.customer_complaints}</p>
              </div>
              <div className="glass-card text-center p-4">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Major Supplier Defects</span>
                <p className="text-xl font-bold text-rose-400 mt-1 font-mono">{stats.supplier_defects}</p>
              </div>
              <div className="glass-card text-center p-4">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Audit Compliance</span>
                <p className="text-xl font-bold text-emerald-400 mt-1 font-mono">{stats.audit_compliance_rate}%</p>
              </div>
            </div>

            {/* Recharts defects breakdown */}
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Defect Pareto Chart */}
              <div className="glass-panel p-6">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Defects Pareto Distribution</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.defect_pareto} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="defect_type" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '11px', color: '#06B6D4' }}
                      />
                      <Bar dataKey="count" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Defects by Assembly Station */}
              <div className="glass-panel p-6">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Failed Parts by Inspection Station</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.defect_stations} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="station_name" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '11px', color: '#22d3ee' }}
                      />
                      <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Defects by Shift */}
              <div className="glass-panel p-6">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Defect count by Shift</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.defect_shifts} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="shift_name" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '11px', color: '#10B981' }}
                      />
                      <Bar dataKey="count" fill="#06B6D4" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Defect Customers */}
              <div className="glass-panel p-6">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Logged Defects by Customer Accounts</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.defect_customers} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="customer_name" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '11px', color: '#a855f7' }}
                      />
                      <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: NCR REGISTRY */}
        {activeTab === 'ncr' && (
          <div className="space-y-6">
            
            <div className="glass-panel p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-200">Non-Conformance Reports (NCR)</h3>
                  <p className="text-xs text-slate-500">Record component quality deviations and define disposition routing.</p>
                </div>
                {canWrite && (
                  <button 
                    onClick={openNCRCreate}
                    className="flex items-center gap-1.5 bg-precision-cyan hover:bg-precision-cyanLight text-obsidian-950 text-xs font-bold px-3.5 py-2 rounded-lg transition-all active:scale-95"
                  >
                    <Plus size={14} /> Log Quality NCR
                  </button>
                )}
              </div>

              {/* Search and Filters */}
              <form onSubmit={handleNCRSearchSubmit} className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-6">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search NCRs..." 
                    value={searchNCR}
                    onChange={(e) => setSearchNCR(e.target.value)}
                    className="w-full bg-obsidian-950 border border-slate-800/80 focus:border-precision-cyan/80 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 outline-none"
                  />
                  <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                </div>

                <select 
                  value={severityFilter}
                  onChange={(e) => { setSeverityFilter(e.target.value); setNcrPage(1); }}
                  className="bg-obsidian-950 border border-slate-800/80 focus:border-precision-cyan/80 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                >
                  <option value="">All Severities</option>
                  <option value="Critical">Critical</option>
                  <option value="Major">Major</option>
                  <option value="Minor">Minor</option>
                </select>

                <select 
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setNcrPage(1); }}
                  className="bg-obsidian-950 border border-slate-800/80 focus:border-precision-cyan/80 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Contained">Contained</option>
                  <option value="Under_RCA">Under RCA</option>
                  <option value="8D_Active">8D Active</option>
                  <option value="Closed">Closed</option>
                </select>

                <select 
                  value={priorityFilter}
                  onChange={(e) => { setPriorityFilter(e.target.value); setNcrPage(1); }}
                  className="bg-obsidian-950 border border-slate-800/80 focus:border-precision-cyan/80 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                >
                  <option value="">All Priorities</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>

                <button 
                  type="button"
                  onClick={() => {
                    setSearchNCR('');
                    setSeverityFilter('');
                    setStatusFilter('');
                    setPriorityFilter('');
                    setNcrPage(1);
                  }}
                  className="flex items-center justify-center gap-1.5 p-2 bg-obsidian-950/60 hover:bg-obsidian-900 border border-slate-800/80 text-slate-400 hover:text-slate-200 rounded-lg transition-colors text-xs font-semibold"
                >
                  <RotateCcw size={14} /> Clear Filters
                </button>
              </form>

              {/* List */}
              {ncrs.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">No non-conformances registered.</div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800/80 text-slate-500 uppercase font-semibold tracking-wider">
                          <th className="py-2.5 px-4">NCR Number</th>
                          <th className="py-2.5 px-4">Project</th>
                          <th className="py-2.5 px-4">Defect Description</th>
                          <th className="py-2.5 px-4">Defect Type</th>
                          <th className="py-2.5 px-4">Severity</th>
                          <th className="py-2.5 px-4">Priority</th>
                          <th className="py-2.5 px-4">Status</th>
                          <th className="py-2.5 px-4">Engineer Assigned</th>
                          {canCapaWrite && <th className="py-2.5 px-4 text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 text-slate-300">
                        {ncrs.map(ncr => (
                          <tr key={ncr.id} className="hover:bg-slate-850/20 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-precision-cyanLight">{ncr.ncr_number}</td>
                            <td className="py-3 px-4 font-semibold text-slate-200">{ncr.project?.name || '—'}</td>
                            <td className="py-3 px-4 max-w-xs truncate" title={ncr.defect_description}>{ncr.defect_description}</td>
                            <td className="py-3 px-4 font-medium">{ncr.defect_type.replace('_', ' ')}</td>
                            <td className={`py-3 px-4 ${getSeverityClass(ncr.severity)}`}>{ncr.severity}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getPriorityClass(ncr.priority)}`}>
                                {ncr.priority}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getStatusClass(ncr.status)}`}>
                                {ncr.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-400">
                              {ncr.assigned_engineer ? ncr.assigned_engineer.full_name : <span className="text-slate-600 italic">Unassigned</span>}
                            </td>
                            {canCapaWrite && (
                              <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                                {canWrite && (
                                  <>
                                    <button 
                                      onClick={() => openNCREdit(ncr)}
                                      className="text-slate-400 hover:text-slate-200 transition-colors p-1"
                                      title="Edit NCR"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteNCR(ncr.id)}
                                      className="text-red-400 hover:text-red-300 transition-colors p-1"
                                      title="Delete NCR"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </>
                                )}
                                {!ncr.capa_8d && ncr.status !== 'Closed' && (
                                  <button 
                                    onClick={() => openCAPACreate(ncr.id)}
                                    className="text-[10px] font-bold px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded hover:bg-purple-500/20"
                                  >
                                    + Start 8D CAPA
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[11px] text-slate-500">Showing {ncrs.length} NCR logs</span>
                    <div className="flex items-center gap-1.5">
                      <button 
                        disabled={ncrPage === 1}
                        onClick={() => setNcrPage(p => Math.max(1, p - 1))}
                        className="p-1.5 bg-obsidian-900 border border-slate-800/80 text-slate-400 hover:text-slate-200 disabled:opacity-40 rounded"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="text-xs text-slate-400 font-mono">{ncrPage} / {ncrPages}</span>
                      <button 
                        disabled={ncrPage === ncrPages}
                        onClick={() => setNcrPage(p => Math.min(ncrPages, p + 1))}
                        className="p-1.5 bg-obsidian-900 border border-slate-800/80 text-slate-400 hover:text-slate-200 disabled:opacity-40 rounded"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: CAPA 8D MANAGER */}
        {activeTab === 'capa' && (
          <div className="space-y-6">
            
            <div className="glass-panel p-6">
              <div className="mb-6">
                <h3 className="text-base font-bold text-slate-200">Corrective & Preventive Action (CAPA 8D) logs</h3>
                <p className="text-xs text-slate-500">Linked to open NCR root causes for standard ISO/Compliance audits.</p>
              </div>

              {ncrs.filter(n => n.capa_8d).length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No CAPA corrective action reports initiated yet. Start one by clicking "+ Start 8D CAPA" next to an open NCR log.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {ncrs.filter(n => n.capa_8d).map(ncr => {
                    const capa = ncr.capa_8d;
                    return (
                      <div key={capa.id} className="p-5 border border-slate-800/60 bg-obsidian-900/20 rounded-xl space-y-4">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800/40 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-200">CAPA linked to {ncr.ncr_number}</h4>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                capa.status === 'Closed' ? 'bg-slate-700/20 text-slate-400' : 'bg-purple-500/10 text-purple-400'
                              }`}>
                                {capa.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{ncr.defect_description}</p>
                          </div>
                          
                          {canCapaWrite && (
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => openCAPAEdit(capa)}
                                className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-slate-100 text-[10px] font-bold px-2.5 py-1.5 rounded transition-all"
                              >
                                <Edit2 size={10} /> Edit 8D Report
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Actions mapping grid */}
                        <div className="grid md:grid-cols-4 gap-4 text-xs">
                          <div className="p-3 bg-obsidian-950/20 border border-slate-800/40 rounded-lg">
                            <span className="text-[10px] text-slate-500 font-bold block mb-1">Containment Actions</span>
                            <p className="text-slate-300 leading-tight">{capa.containment_actions || '—'}</p>
                          </div>
                          <div className="p-3 bg-obsidian-950/20 border border-slate-800/40 rounded-lg">
                            <span className="text-[10px] text-slate-500 font-bold block mb-1">Root Cause (5 Whys)</span>
                            <p className="text-slate-300 leading-tight whitespace-pre-line">{capa.root_cause_5_why || '—'}</p>
                          </div>
                          <div className="p-3 bg-obsidian-950/20 border border-slate-800/40 rounded-lg">
                            <span className="text-[10px] text-slate-500 font-bold block mb-1">Corrective Actions</span>
                            <p className="text-slate-300 leading-tight">{capa.corrective_actions || '—'}</p>
                          </div>
                          <div className="p-3 bg-obsidian-950/20 border border-slate-800/40 rounded-lg">
                            <span className="text-[10px] text-slate-500 font-bold block mb-1">Preventive Actions</span>
                            <p className="text-slate-300 leading-tight">{capa.preventive_actions || '—'}</p>
                          </div>
                        </div>

                        {/* Verification & Metadata */}
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-3 border-t border-slate-800/40 text-xs text-slate-400">
                          <div className="flex gap-4">
                            <span>Owner: <strong className="text-slate-300">{capa.owner ? capa.owner.full_name : 'Unassigned'}</strong></span>
                            {capa.due_date && (
                              <span>Due Date: <strong className="text-slate-300">{new Date(capa.due_date).toLocaleDateString()}</strong></span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">Effectiveness Verification Status:</span>
                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                              capa.effectiveness_verified 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {capa.effectiveness_verified ? 'Verified & Validated' : 'Pending Verification'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 4: SPC DASHBOARD */}
        {activeTab === 'spc' && (
          <div className="space-y-6">
            
            {/* Control Limits & Index metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="glass-panel p-5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Target Nominal</span>
                <h4 className="text-xl font-bold text-slate-200 mt-1 font-mono">120.0 µm</h4>
                <p className="text-[10px] text-slate-500 mt-1">Solder paste thickness target</p>
              </div>
              <div className="glass-panel p-5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Upper Control Limit (UCL)</span>
                <h4 className="text-xl font-bold text-slate-200 mt-1 font-mono">135.0 µm</h4>
                <p className="text-[10px] text-rose-500 mt-1">Upper limit threshold</p>
              </div>
              <div className="glass-panel p-5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Lower Control Limit (LCL)</span>
                <h4 className="text-xl font-bold text-slate-200 mt-1 font-mono">105.0 µm</h4>
                <p className="text-[10px] text-rose-500 mt-1">Lower limit threshold</p>
              </div>
              <div className="glass-panel p-5 grid grid-cols-2 gap-2">
                <div className="border-r border-slate-800 pr-2">
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Cp Index</span>
                  <p className="text-lg font-bold text-emerald-400 mt-1 font-mono">{Cp}</p>
                </div>
                <div className="pl-2">
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Cpk Index</span>
                  <p className="text-lg font-bold text-emerald-400 mt-1 font-mono">{Cpk}</p>
                </div>
              </div>
            </div>

            {/* SPC Control Chart */}
            <div className="glass-panel p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Statistical Process Control (SPC) Chart</h3>
                  <p className="text-xs text-slate-500">Live plotting of Solder Paste thickness measurements mapped to control limits.</p>
                </div>
                
                {/* Warning trigger logic representation */}
                {spcData.some(d => d.value > d.ucl || d.value < d.lcl) ? (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-1 rounded flex items-center gap-2">
                    <AlertTriangle size={14} /> Out of Control Point Detected
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded flex items-center gap-2">
                    <CheckCircle size={14} /> Process Capability stable
                  </div>
                )}
              </div>

              <div className="h-72">
                {spcData.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-20">No measurements loaded.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={spcData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="measured_at" stroke="#64748b" fontSize={9} tickFormatter={(tick) => new Date(tick).toLocaleTimeString()} />
                      <YAxis stroke="#64748b" fontSize={10} domain={[100, 140]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        labelFormatter={(label) => new Date(label).toLocaleString()}
                        itemStyle={{ fontSize: '11px' }}
                      />
                      {/* UCL */}
                      <ReferenceLine y={135.0} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'UCL (135.0)', fill: '#EF4444', fontSize: 10, position: 'top' }} />
                      {/* LCL */}
                      <ReferenceLine y={105.0} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'LCL (105.0)', fill: '#EF4444', fontSize: 10, position: 'bottom' }} />
                      {/* Target */}
                      <ReferenceLine y={120.0} stroke="#10B981" strokeDasharray="5 5" label={{ value: 'Target (120.0)', fill: '#10B981', fontSize: 10, position: 'top' }} />
                      
                      <Line type="monotone" dataKey="value" stroke="#06B6D4" strokeWidth={2.5} dot={{ r: 4, fill: '#0B0F19', stroke: '#06B6D4', strokeWidth: 2 }} activeDot={{ r: 6 }} name="Measured Depth" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: AUDITS & INSPECTIONS */}
        {activeTab === 'compliance' && (
          <div className="space-y-6">
            
            {/* Certifications and audits summary */}
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Audits */}
              <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">ISO & Compliance Audits</h3>
                    <p className="text-xs text-slate-500">Record external audits schedules, findings, and scoring logs.</p>
                  </div>
                  {canWrite && (
                    <button 
                      onClick={() => {
                        setAuditForm({
                          audit_number: `AUD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                          auditor_name: '',
                          audit_date: '',
                          findings_count: '0',
                          status: 'Scheduled',
                          score: '100'
                        });
                        setShowAuditModal(true);
                      }}
                      className="flex items-center gap-1 bg-precision-cyan hover:bg-precision-cyanLight text-obsidian-950 text-xs font-bold px-2.5 py-1.5 rounded"
                    >
                      <Plus size={12} /> Add Audit
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-slate-500 uppercase font-semibold">
                        <th className="py-2 px-3">Audit Number</th>
                        <th className="py-2 px-3">Auditor</th>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Findings</th>
                        <th className="py-2 px-3">Score</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300">
                      {audits.map(a => (
                        <tr key={a.id} className="hover:bg-slate-850/10">
                          <td className="py-3 px-3 font-mono font-bold text-precision-cyanLight">{a.audit_number}</td>
                          <td className="py-3 px-3 font-semibold text-slate-200">{a.auditor_name}</td>
                          <td className="py-3 px-3 font-mono">{new Date(a.audit_date).toLocaleDateString()}</td>
                          <td className={`py-3 px-3 font-semibold ${a.findings_count > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                            {a.findings_count}
                          </td>
                          <td className="py-3 px-3 font-mono font-semibold">
                            {a.status === 'Completed' ? `${a.score}%` : '—'}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${
                              a.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Active Certifications */}
              <div className="glass-panel p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 mb-6">Registered Quality Certifications</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {certs.map(c => (
                      <div key={c.id} className="p-4 border border-slate-850 bg-obsidian-950/20 rounded-lg flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">{c.name}</h4>
                          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Issuer: {c.issuer}</p>
                          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                            <Clock size={12} className="text-slate-500" />
                            <span>Valid Until: {new Date(c.valid_until).toLocaleDateString()}</span>
                          </p>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <p className="text-[10px] text-slate-500 italic mt-6 leading-relaxed">
                  Notice: All manufacturing activities at SZ-1 follow aerospace standards AS9100D and FDA Medical ISO 13485 regulations. Recertification cycles occur annually.
                </p>
              </div>

            </div>

            {/* Inspections Grid */}
            <div className="glass-panel p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-200">Lot QA Inspections</h3>
                  <p className="text-xs text-slate-500">Record incoming components and packaging batch samples inspections.</p>
                </div>
                {canWrite && (
                  <button 
                    onClick={() => {
                      setInspectionForm({
                        project_id: '',
                        date: new Date().toISOString().split('T')[0],
                        lot_size: '',
                        sample_size: '',
                        defects_found: '0'
                      });
                      setShowInspectionModal(true);
                    }}
                    className="flex items-center gap-1 bg-precision-cyan hover:bg-precision-cyanLight text-obsidian-950 text-xs font-bold px-2.5 py-1.5 rounded"
                  >
                    <Plus size={12} /> Log Inspection
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-slate-500 uppercase font-semibold">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Project Product</th>
                      <th className="py-2 px-3">Lot Size</th>
                      <th className="py-2 px-3">Sample size</th>
                      <th className="py-2 px-3">Defects found</th>
                      <th className="py-2 px-3">Inspector</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                    {inspections.map(ins => (
                      <tr key={ins.id} className="hover:bg-slate-850/10">
                        <td className="py-3 px-3 font-mono">{new Date(ins.date).toLocaleDateString()}</td>
                        <td className="py-3 px-3 font-semibold text-slate-200">{ins.project?.name}</td>
                        <td className="py-3 px-3 font-mono">{ins.lot_size}</td>
                        <td className="py-3 px-3 font-mono">{ins.sample_size}</td>
                        <td className={`py-3 px-3 font-semibold font-mono ${ins.defects_found > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                          {ins.defects_found}
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-semibold">{ins.inspector?.full_name}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            ins.status === 'Passed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {ins.status}
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

        {/* TAB 6: DOCUMENT CONTROL */}
        {activeTab === 'docs' && (
          <div className="space-y-6">
            
            <div className="glass-panel p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-200">Quality Document Library</h3>
                  <p className="text-xs text-slate-500">Access and verify controlled procedures, blueprints, and drawings revisions.</p>
                </div>
              </div>

              {/* Filters search */}
              <form onSubmit={handleDocSearchSubmit} className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    placeholder="Search documents by number or title..." 
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                    className="w-full bg-obsidian-950 border border-slate-800/80 focus:border-precision-cyan/80 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 outline-none"
                  />
                  <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                </div>
                
                <select 
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="bg-obsidian-950 border border-slate-800/80 focus:border-precision-cyan/80 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                >
                  <option value="">All Document Types</option>
                  <option value="SOP">SOP (Standard Operating Procedure)</option>
                  <option value="Drawing">Engineering Drawing</option>
                  <option value="Quality Manual">Quality Manual</option>
                </select>

                <button 
                  type="button" 
                  onClick={() => {
                    setDocSearch('');
                    setDocType('');
                    fetchDocuments();
                  }}
                  className="p-2 bg-obsidian-950/60 hover:bg-obsidian-900 border border-slate-800/80 text-slate-400 hover:text-slate-200 rounded-lg"
                >
                  <RotateCcw size={14} />
                </button>
              </form>

              {/* Documents table */}
              {documents.length === 0 ? (
                <div className="text-center py-10 text-slate-600 text-xs">No matching documents found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-slate-500 uppercase font-semibold">
                        <th className="py-2.5 px-4">Doc Number</th>
                        <th className="py-2.5 px-4">Document Title</th>
                        <th className="py-2.5 px-4">Type</th>
                        <th className="py-2.5 px-4">Revision</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">Approved By</th>
                        <th className="py-2.5 px-4">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300">
                      {documents.map(doc => (
                        <tr key={doc.id} className="hover:bg-slate-850/20 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-precision-cyanLight">{doc.document_number}</td>
                          <td className="py-3 px-4 font-bold text-slate-200">{doc.title}</td>
                          <td className="py-3 px-4 font-semibold text-slate-400">{doc.type}</td>
                          <td className="py-3 px-4 font-mono font-semibold">{doc.revision}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {doc.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-400">{doc.approved_by || '—'}</td>
                          <td className="py-3 px-4 font-mono">{new Date(doc.updated_at).toLocaleDateString()}</td>
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

      {/* NCR CREATION/EDIT DIALOG */}
      {showNCRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowNCRModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="glass-panel w-full max-w-md p-6 relative z-10 border border-slate-700/50 glow-cyan">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-base font-bold text-slate-100">
                {editingNCR ? 'Modify NCR Record' : 'Log Non-Conformance'}
              </h3>
              <button onClick={() => setShowNCRModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>
            
            {ncrFormError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2 mb-4">
                <AlertCircle size={16} />
                <span>{ncrFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNCR} className="space-y-4">
              {!editingNCR && (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Target Product Project</label>
                  <select 
                    required
                    value={ncrForm.project_id}
                    onChange={(e) => setNcrForm({ ...ncrForm, project_id: e.target.value })}
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
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">NCR Number</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. NCR-2026-905"
                  value={ncrForm.ncr_number}
                  onChange={(e) => setNcrForm({ ...ncrForm, ncr_number: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Defect Description</label>
                <textarea 
                  required
                  rows="3"
                  placeholder="Provide detailed description of quality deviation..."
                  value={ncrForm.defect_description}
                  onChange={(e) => setNcrForm({ ...ncrForm, defect_description: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Defect Type</label>
                  <select 
                    value={ncrForm.defect_type}
                    onChange={(e) => setNcrForm({ ...ncrForm, defect_type: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="Solder_Bridge">Solder Bridge</option>
                    <option value="Component_Missing">Component Missing</option>
                    <option value="Mechanical_Scratch">Mechanical Scratch</option>
                    <option value="Functional_Fail">Functional Failure</option>
                    <option value="Delamination">Delamination</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Severity</label>
                  <select 
                    value={ncrForm.severity}
                    onChange={(e) => setNcrForm({ ...ncrForm, severity: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="Minor">Minor Deviation</option>
                    <option value="Major">Major Outage</option>
                    <option value="Critical">Critical Failure</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Priority</label>
                  <select 
                    value={ncrForm.priority}
                    onChange={(e) => setNcrForm({ ...ncrForm, priority: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Status Workflow</label>
                  <select 
                    value={ncrForm.status}
                    onChange={(e) => setNcrForm({ ...ncrForm, status: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Contained">Contained</option>
                    <option value="Under_RCA">Under RCA</option>
                    <option value="8D_Active">8D Active</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Assign Engineer</label>
                <select 
                  value={ncrForm.assigned_engineer_id}
                  onChange={(e) => setNcrForm({ ...ncrForm, assigned_engineer_id: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                >
                  <option value="">Select engineer...</option>
                  {users.filter(u => u.role === 'Quality_Eng' || u.role === 'Admin').map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowNCRModal(false)}
                  className="px-3.5 py-1.5 border border-slate-800 hover:bg-slate-800/40 text-slate-300 text-xs font-semibold rounded"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={ncrSubmitting}
                  className="bg-precision-cyan text-obsidian-950 font-bold px-4 py-1.5 rounded text-xs hover:bg-precision-cyanLight"
                >
                  {ncrSubmitting ? 'Logging...' : 'Save NCR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CAPA DIALOG */}
      {showCAPAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowCAPAModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="glass-panel w-full max-w-lg p-6 relative z-10 border border-slate-700/50 glow-cyan">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-base font-bold text-slate-100">
                {editingCAPA ? 'Edit 8D CAPA Action Plan' : 'Initiate 8D CAPA Log'}
              </h3>
              <button onClick={() => setShowCAPAModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>
            
            {capaFormError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2 mb-4">
                <AlertCircle size={16} />
                <span>{capaFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCAPA} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">D3: Containment Actions</label>
                <input 
                  type="text" 
                  required
                  placeholder="Actions taken to quarantine defective stock..."
                  value={capaForm.containment_actions}
                  onChange={(e) => setCapaForm({ ...capaForm, containment_actions: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">D4: Root Cause (5 Whys Analysis)</label>
                <textarea 
                  required
                  rows="4"
                  placeholder="1. Why did it happen?&#10;2. Why?&#10;3. Why?&#10;4. Why?&#10;5. Why?"
                  value={capaForm.root_cause_5_why}
                  onChange={(e) => setCapaForm({ ...capaForm, root_cause_5_why: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none resize-none font-mono"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">D5: Corrective Actions</label>
                  <input 
                    type="text" 
                    placeholder="Actions to fix the root cause..."
                    value={capaForm.corrective_actions}
                    onChange={(e) => setCapaForm({ ...capaForm, corrective_actions: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">D6: Preventive Actions</label>
                  <input 
                    type="text" 
                    placeholder="Process changes to prevent recurrence..."
                    value={capaForm.preventive_actions}
                    onChange={(e) => setCapaForm({ ...capaForm, preventive_actions: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Action Owner</label>
                  <select 
                    value={capaForm.owner_id}
                    onChange={(e) => setCapaForm({ ...capaForm, owner_id: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none"
                  >
                    <option value="">Select owner...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Target Due Date</label>
                  <input 
                    type="date" 
                    value={capaForm.due_date}
                    onChange={(e) => setCapaForm({ ...capaForm, due_date: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center pt-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">CAPA Status</label>
                  <select 
                    value={capaForm.status}
                    onChange={(e) => setCapaForm({ ...capaForm, status: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none"
                  >
                    <option value="Open">Open</option>
                    <option value="In_Progress">In Progress</option>
                    <option value="Verified">Verified</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <input 
                    type="checkbox"
                    id="effectiveness_verified"
                    checked={capaForm.effectiveness_verified}
                    onChange={(e) => setCapaForm({ ...capaForm, effectiveness_verified: e.target.checked })}
                    className="h-4 w-4 text-precision-cyan rounded border-slate-800 bg-obsidian-950 focus:ring-precision-cyan cursor-pointer"
                  />
                  <label htmlFor="effectiveness_verified" className="text-xs font-semibold text-slate-300 cursor-pointer">Effectiveness Checked</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowCAPAModal(false)}
                  className="px-3.5 py-1.5 border border-slate-800 hover:bg-slate-800/40 text-slate-300 text-xs font-semibold rounded"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={capaSubmitting}
                  className="bg-precision-cyan text-obsidian-950 font-bold px-4 py-1.5 rounded text-xs hover:bg-precision-cyanLight"
                >
                  {capaSubmitting ? 'Saving...' : 'Save CAPA Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUDIT DIALOG */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowAuditModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="glass-panel w-full max-w-sm p-6 relative z-10 border border-slate-700/50 glow-cyan">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-base font-bold text-slate-100">Schedule Audit</h3>
              <button onClick={() => setShowAuditModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>
            
            <form onSubmit={handleCreateAudit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Audit Number</label>
                <input 
                  type="text" 
                  required
                  value={auditForm.audit_number}
                  onChange={(e) => setAuditForm({ ...auditForm, audit_number: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Auditor Entity</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. UL Registrar"
                  value={auditForm.auditor_name}
                  onChange={(e) => setAuditForm({ ...auditForm, auditor_name: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Audit Date</label>
                  <input 
                    type="date" 
                    required
                    value={auditForm.audit_date}
                    onChange={(e) => setAuditForm({ ...auditForm, audit_date: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Score (%)</label>
                  <input 
                    type="number" 
                    required
                    value={auditForm.score}
                    onChange={(e) => setAuditForm({ ...auditForm, score: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Findings count</label>
                  <input 
                    type="number" 
                    required
                    value={auditForm.findings_count}
                    onChange={(e) => setAuditForm({ ...auditForm, findings_count: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Audit Status</label>
                  <select 
                    value={auditForm.status}
                    onChange={(e) => setAuditForm({ ...auditForm, status: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Corrective_Action">Corrective Action Required</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAuditModal(false)}
                  className="px-3.5 py-1.5 border border-slate-800 hover:bg-slate-800/40 text-slate-300 text-xs font-semibold rounded"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-precision-cyan text-obsidian-950 font-bold px-4 py-1.5 rounded text-xs hover:bg-precision-cyanLight"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECTION DIALOG */}
      {showInspectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowInspectionModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="glass-panel w-full max-w-sm p-6 relative z-10 border border-slate-700/50 glow-cyan">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-base font-bold text-slate-100">Log QA Lot Inspection</h3>
              <button onClick={() => setShowInspectionModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>
            
            <form onSubmit={handleCreateInspection} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Target Product Project</label>
                <select 
                  required
                  value={inspectionForm.project_id}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, project_id: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                >
                  <option value="">Select project...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Inspection Date</label>
                <input 
                  type="date" 
                  required
                  value={inspectionForm.date}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, date: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Lot Size</label>
                  <input 
                    type="number" 
                    required
                    placeholder="500"
                    value={inspectionForm.lot_size}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, lot_size: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Sample Size</label>
                  <input 
                    type="number" 
                    required
                    placeholder="50"
                    value={inspectionForm.sample_size}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, sample_size: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Defects Found</label>
                  <input 
                    type="number" 
                    required
                    placeholder="0"
                    value={inspectionForm.defects_found}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, defects_found: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowInspectionModal(false)}
                  className="px-3.5 py-1.5 border border-slate-800 hover:bg-slate-800/40 text-slate-300 text-xs font-semibold rounded"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-precision-cyan text-obsidian-950 font-bold px-4 py-1.5 rounded text-xs hover:bg-precision-cyanLight"
                >
                  Log Lot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Quality;
