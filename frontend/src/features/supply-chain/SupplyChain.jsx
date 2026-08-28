import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import supplyChainService from '../../services/supplyChainService';
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
  Truck,
  Package,
  DollarSign,
  UserCheck,
  Grid
} from 'lucide-react';

const SupplyChain = () => {
  const { activeRole } = useAuth();
  
  // Tab states: 'dashboard', 'suppliers', 'pos', 'inventory', 'inspections'
  const [activeTab, setActiveTab] = useState('dashboard');

  const [stats, setStats] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierTotal, setSupplierTotal] = useState(0);
  const [supplierPage, setSupplierPage] = useState(1);
  const [supplierPages, setSupplierPages] = useState(1);

  const [pos, setPos] = useState([]);
  const [poTotal, setPoTotal] = useState(0);
  const [poPage, setPoPage] = useState(1);
  const [poPages, setPoPages] = useState(1);

  const [inventory, setInventory] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [shipments, setShipments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Suppliers search/filter
  const [searchSupplier, setSearchSupplier] = useState('');
  
  // POs search/filter
  const [searchPO, setSearchPO] = useState('');
  const [poStatusFilter, setPoStatusFilter] = useState('');

  // Supplier modal
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    rating: 'A',
    email: '',
    phone: '',
    contact_name: ''
  });
  const [supplierFormError, setSupplierFormError] = useState('');
  const [supplierSubmitting, setSupplierSubmitting] = useState(false);

  // PO modal
  const [showPOModal, setShowPOModal] = useState(false);
  const [editingPO, setEditingPO] = useState(null);
  const [poForm, setPoForm] = useState({
    supplier_id: '',
    po_number: '',
    status: 'Issued',
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    approval_status: 'Pending_Approval',
    delivery_eta: '',
    priority: 'Medium',
    total_amount: ''
  });
  const [poFormError, setPoFormError] = useState('');
  const [poSubmitting, setPoSubmitting] = useState(false);

  // Inspection modal
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionForm, setInspectionForm] = useState({
    purchase_order_id: '',
    material_id: '',
    inspection_date: new Date().toISOString().split('T')[0],
    qty_received: '',
    qty_accepted: '',
    qty_rejected: '',
    defect_reason: '',
    status: 'Pending'
  });

  const canWriteSCM = activeRole === 'Admin' || activeRole === 'SC_Manager';
  const canWriteInv = activeRole === 'Admin' || activeRole === 'SC_Manager' || activeRole === 'Warehouse_Manager';
  const canWriteInsp = activeRole === 'Admin' || activeRole === 'Quality_Eng' || activeRole === 'SC_Manager';

  // Load static resources
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const [whList, matList] = await Promise.all([
          supplyChainService.getWarehouses(),
          supplyChainService.getMaterials()
        ]);
        setWarehouses(whList);
        setMaterials(matList);
      } catch (err) {
        console.error('Failed to load warehouses or material list', err);
      }
    };
    fetchResources();
  }, []);

  // Fetch Suppliers
  const fetchSuppliers = async () => {
    try {
      const params = {
        page: supplierPage,
        limit: 5,
        search: searchSupplier || undefined
      };
      const data = await supplyChainService.getSuppliers(params);
      setSuppliers(data.items);
      setSupplierTotal(data.total);
      setSupplierPages(data.pages);
    } catch (err) {
      console.error('Failed to fetch suppliers list', err);
    }
  };

  // Fetch POs
  const fetchPOs = async () => {
    try {
      const params = {
        page: poPage,
        limit: 5,
        search: searchPO || undefined,
        status_filter: poStatusFilter || undefined
      };
      const data = await supplyChainService.getPOs(params);
      setPos(data.items);
      setPoTotal(data.total);
      setPoPages(data.pages);
    } catch (err) {
      console.error('Failed to fetch PO list', err);
    }
  };

  const loadAllDashboardData = async () => {
    try {
      setError('');
      const [statsData, invList, inspList, shipList] = await Promise.all([
        supplyChainService.getDashboardStats(),
        supplyChainService.getInventory(),
        supplyChainService.getIncomingInspections(),
        supplyChainService.getShipments()
      ]);
      setStats(statsData);
      setInventory(invList);
      setInspections(inspList);
      setShipments(shipList);
    } catch (err) {
      setError('Failed to fetch SCM dashboard stats');
    }
  };

  const initData = async () => {
    setLoading(true);
    await Promise.all([
      loadAllDashboardData(),
      fetchSuppliers(),
      fetchPOs()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    initData();
  }, [supplierPage, poPage, poStatusFilter]);

  const handleSupplierSearch = (e) => {
    e.preventDefault();
    setSupplierPage(1);
    fetchSuppliers();
  };

  const handlePOSearch = (e) => {
    e.preventDefault();
    setPoPage(1);
    fetchPOs();
  };

  // Save Supplier
  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    setSupplierFormError('');
    if (!supplierForm.name.trim()) return setSupplierFormError('Supplier name is required');

    setSupplierSubmitting(true);
    try {
      if (editingSupplier) {
        await supplyChainService.updateSupplier(editingSupplier.id, supplierForm);
      } else {
        await supplyChainService.createSupplier(supplierForm);
      }
      setShowSupplierModal(false);
      initData();
    } catch (err) {
      setSupplierFormError(err.response?.data?.detail || 'Failed to save supplier details');
    } finally {
      setSupplierSubmitting(false);
    }
  };

  const openSupplierEdit = (s) => {
    setEditingSupplier(s);
    setSupplierForm({
      name: s.name,
      rating: s.rating,
      email: s.email || '',
      phone: s.phone || '',
      contact_name: s.contact_name || ''
    });
    setSupplierFormError('');
    setShowSupplierModal(true);
  };

  const openSupplierCreate = () => {
    setEditingSupplier(null);
    setSupplierForm({
      name: '',
      rating: 'A',
      email: '',
      phone: '',
      contact_name: ''
    });
    setSupplierFormError('');
    setShowSupplierModal(true);
  };

  const handleDeleteSupplier = async (supplierId) => {
    if (!window.confirm('Are you sure you want to delete this supplier? All related POs will be removed.')) return;
    try {
      await supplyChainService.deleteSupplier(supplierId);
      initData();
    } catch (err) {
      alert('Failed to delete supplier');
    }
  };

  // Save PO
  const handleSavePO = async (e) => {
    e.preventDefault();
    setPoFormError('');
    if (!poForm.supplier_id) return setPoFormError('Supplier is required');
    if (!poForm.po_number.trim()) return setPoFormError('PO number is required');
    if (!poForm.total_amount) return setPoFormError('Total amount is required');

    setPoSubmitting(true);
    try {
      const payload = {
        ...poForm,
        total_amount: Number(poForm.total_amount),
        delivery_date: poForm.delivery_date || null,
        delivery_eta: poForm.delivery_eta || null
      };

      if (editingPO) {
        await supplyChainService.updatePO(editingPO.id, payload);
      } else {
        await supplyChainService.createPO(payload);
      }
      setShowPOModal(false);
      initData();
    } catch (err) {
      setPoFormError(err.response?.data?.detail || 'Failed to save Purchase Order');
    } finally {
      setPoSubmitting(false);
    }
  };

  const openPOEdit = (po) => {
    setEditingPO(po);
    setPoForm({
      supplier_id: po.supplier_id,
      po_number: po.po_number,
      status: po.status,
      order_date: po.order_date,
      delivery_date: po.delivery_date || '',
      approval_status: po.approval_status,
      delivery_eta: po.delivery_eta || '',
      priority: po.priority,
      total_amount: po.total_amount.toString()
    });
    setPoFormError('');
    setShowPOModal(true);
  };

  const openPOCreate = () => {
    setEditingPO(null);
    setPoForm({
      supplier_id: '',
      po_number: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Issued',
      order_date: new Date().toISOString().split('T')[0],
      delivery_date: '',
      approval_status: 'Pending_Approval',
      delivery_eta: '',
      priority: 'Medium',
      total_amount: ''
    });
    setPoFormError('');
    setShowPOModal(true);
  };

  const handleDeletePO = async (poId) => {
    if (!window.confirm('Are you sure you want to delete this Purchase Order?')) return;
    try {
      await supplyChainService.deletePO(poId);
      initData();
    } catch (err) {
      alert('Failed to delete PO');
    }
  };

  // Add Incoming Inspection
  const handleCreateIncomingInspection = async (e) => {
    e.preventDefault();
    if (!inspectionForm.purchase_order_id || !inspectionForm.material_id || !inspectionForm.qty_received) {
      alert('Fill all required fields');
      return;
    }
    try {
      await supplyChainService.createIncomingInspection({
        purchase_order_id: inspectionForm.purchase_order_id,
        material_id: inspectionForm.material_id,
        inspection_date: inspectionForm.inspection_date,
        qty_received: Number(inspectionForm.qty_received),
        qty_accepted: Number(inspectionForm.qty_accepted || 0),
        qty_rejected: Number(inspectionForm.qty_rejected || 0),
        defect_reason: inspectionForm.defect_reason || null,
        status: inspectionForm.status
      });
      setShowInspectionModal(false);
      loadAllDashboardData();
    } catch (err) {
      alert('Failed to log incoming quality inspection check');
    }
  };

  const getPriorityClass = (p) => {
    switch (p) {
      case 'High': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'Medium': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'; // Low
    }
  };

  const getPOStatusClass = (s) => {
    switch (s) {
      case 'Completed': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Shipped': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'In_Inspection': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default: return 'bg-slate-700/20 text-slate-400 border border-slate-700/40'; // Issued / Cancelled
    }
  };

  const getApprovalStatusClass = (as) => {
    switch (as) {
      case 'Approved': return 'text-emerald-400 font-bold';
      case 'Rejected': return 'text-red-400 font-bold';
      default: return 'text-slate-400 italic';
    }
  };

  const COLORS = ['#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Procurement Trend data
  const procurementTrendData = [
    { month: 'Mar', value: 8500 },
    { month: 'Apr', value: 12000 },
    { month: 'May', value: 9200 },
    { month: 'Jun', value: 15000 },
    { month: 'Jul', value: 18500 },
    { month: 'Aug', value: stats ? stats.active_pos * 4500 : 12500 }
  ];

  return (
    <div className="space-y-6">
      {/* Top Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Truck size={24} className="text-precision-cyan" />
            <span>Supply Chain & Materials Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Supplier scorecards, inventory levels tracking, procurement POs, and logistics tracking.
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
          SCM Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-3 text-xs uppercase tracking-wider font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'suppliers' ? 'border-precision-cyan text-precision-cyanLight bg-precision-cyan/5' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Suppliers Directory
        </button>
        <button 
          onClick={() => setActiveTab('pos')}
          className={`px-4 py-3 text-xs uppercase tracking-wider font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'pos' ? 'border-precision-cyan text-precision-cyanLight bg-precision-cyan/5' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Purchase Orders
        </button>
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-3 text-xs uppercase tracking-wider font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'inventory' ? 'border-precision-cyan text-precision-cyanLight bg-precision-cyan/5' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Inventory Control
        </button>
        <button 
          onClick={() => setActiveTab('inspections')}
          className={`px-4 py-3 text-xs uppercase tracking-wider font-bold transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'inspections' ? 'border-precision-cyan text-precision-cyanLight bg-precision-cyan/5' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Incoming Quality Checks
        </button>
      </div>

      {/* Panels */}
      <div className="space-y-6">

        {/* TAB 1: SCM DASHBOARD */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <div className="glass-card text-center p-4">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Total Suppliers</span>
                <p className="text-xl font-bold text-slate-200 mt-1 font-mono">{stats.total_suppliers}</p>
              </div>
              <div className="glass-card text-center p-4">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Active POs</span>
                <p className="text-xl font-bold text-precision-cyanLight mt-1 font-mono">{stats.active_pos}</p>
              </div>
              <div className="glass-card text-center p-4">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Delayed Shipments</span>
                <p className="text-xl font-bold text-rose-400 mt-1 font-mono">{stats.delayed_shipments}</p>
              </div>
              <div className="glass-card text-center p-4">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Inventory Value</span>
                <p className="text-lg font-bold text-emerald-400 mt-1.5 font-mono">${stats.inventory_value.toLocaleString()}</p>
              </div>
              <div className="glass-card text-center p-4">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Low Stock Items</span>
                <p className="text-xl font-bold text-amber-400 mt-1 font-mono">{stats.low_stock_items_count}</p>
              </div>
              <div className="glass-card text-center p-4">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">On-Time Delivery</span>
                <p className="text-xl font-bold text-emerald-400 mt-1 font-mono">{stats.on_time_delivery_rate}%</p>
              </div>
              <div className="glass-card text-center p-4">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Inspection Pass Rate</span>
                <p className="text-xl font-bold text-emerald-400 mt-1 font-mono">{stats.incoming_inspection_pass_rate}%</p>
              </div>
              <div className="glass-card text-center p-4">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Supplier Rating</span>
                <p className="text-xl font-bold text-precision-cyanLight mt-1 font-mono">{stats.average_supplier_rating}</p>
              </div>
            </div>

            {/* Visual Analytics */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Supplier Rating score charts */}
              <div className="glass-panel p-6">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Supplier Performance Scorecards</h4>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.supplier_ratings} layout="vertical" margin={{ top: 0, right: 10, left: 15, bottom: 0 }}>
                      <XAxis type="number" stroke="#64748b" fontSize={9} domain={[0, 100]} />
                      <YAxis dataKey="supplier_name" type="category" stroke="#64748b" fontSize={8} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '11px', color: '#06B6D4' }}
                      />
                      <Bar dataKey="rating" fill="#06B6D4" radius={[0, 4, 4, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Inventory by Category Pie */}
              <div className="glass-panel p-6">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Stock Value by Material Category</h4>
                <div className="h-60 flex flex-col justify-between">
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.inventory_by_category}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="category"
                        >
                          {stats.inventory_by_category.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                          formatter={(val) => `$${val.toLocaleString()}`}
                          itemStyle={{ fontSize: '11px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Legend list */}
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] text-slate-400">
                    {stats.inventory_by_category.map((c, i) => (
                      <span key={c.category} className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full block" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                        {c.category}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Monthly Procurement Trend */}
              <div className="glass-panel p-6 md:col-span-2 lg:col-span-1">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Monthly Procurement Volume ($)</h4>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={procurementTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        formatter={(val) => `$${val.toLocaleString()}`}
                        itemStyle={{ fontSize: '11px', color: '#10B981' }}
                      />
                      <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Low stock Alert Panel */}
            {stats.low_stock_materials.length > 0 && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-amber-400 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-amber-400">Low Stock Reorder Warning</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">The following materials are below critical safety stock thresholds. Expedited PO generation recommended:</p>
                    <div className="flex flex-wrap gap-4 mt-3">
                      {stats.low_stock_materials.map(m => (
                        <span key={m.part_number} className="text-[11px] font-mono bg-obsidian-950 px-2.5 py-1 border border-slate-800 rounded text-slate-300">
                          {m.part_number} ({m.name}): <strong className="text-rose-400">{m.available_stock} pcs</strong> / Min: {m.minimum_stock}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Shipment tracking status */}
            <div className="glass-panel p-6">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Logistics Shipment Tracking</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-slate-500 uppercase font-semibold">
                      <th className="py-2 px-3">Tracking Number</th>
                      <th className="py-2 px-3">Carrier</th>
                      <th className="py-2 px-3">Target PO</th>
                      <th className="py-2 px-3">Transit Progress</th>
                      <th className="py-2 px-3">ETA</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                    {shipments.map(s => (
                      <tr key={s.id} className="hover:bg-slate-850/10">
                        <td className="py-2.5 px-3 font-mono font-bold text-precision-cyanLight">{s.tracking_number}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-200">{s.carrier_name}</td>
                        <td className="py-2.5 px-3 font-mono">{s.purchase_order?.po_number}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2 max-w-[120px]">
                            <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-precision-cyan h-full rounded-full" style={{ width: `${s.transit_progress}%` }}></div>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-400">{s.transit_progress}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono">{new Date(s.eta).toLocaleDateString()}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            {s.status.replace('_', ' ')}
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

        {/* TAB 2: SUPPLIERS DIRECTORY */}
        {activeTab === 'suppliers' && (
          <div className="space-y-6">
            
            <div className="glass-panel p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-200">Suppliers Performance Index</h3>
                  <p className="text-xs text-slate-500">Manage raw material suppliers, contacts, and delivery performance metrics.</p>
                </div>
                {canWriteSCM && (
                  <button 
                    onClick={openSupplierCreate}
                    className="flex items-center gap-1 bg-precision-cyan hover:bg-precision-cyanLight text-obsidian-950 text-xs font-bold px-3.5 py-2 rounded-lg"
                  >
                    <Plus size={14} /> Add Supplier
                  </button>
                )}
              </div>

              {/* Search */}
              <form onSubmit={handleSupplierSearch} className="flex gap-3 mb-6 max-w-md">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    placeholder="Search by supplier name..." 
                    value={searchSupplier}
                    onChange={(e) => setSearchSupplier(e.target.value)}
                    className="w-full bg-obsidian-950 border border-slate-800/80 focus:border-precision-cyan/80 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 outline-none"
                  />
                  <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                </div>
                <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold px-4 py-2 rounded-lg">Search</button>
              </form>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-slate-500 uppercase font-semibold">
                      <th className="py-2.5 px-4">Supplier Name</th>
                      <th className="py-2.5 px-4">Rating</th>
                      <th className="py-2.5 px-4">On-Time Rate</th>
                      <th className="py-2.5 px-4">Defect PPM</th>
                      <th className="py-2.5 px-4">Contact Agent</th>
                      <th className="py-2.5 px-4">Email</th>
                      <th className="py-2.5 px-4">Phone</th>
                      {canWriteSCM && <th className="py-2.5 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                    {suppliers.map(s => (
                      <tr key={s.id} className="hover:bg-slate-850/10">
                        <td className="py-3 px-4 font-bold text-slate-200">{s.name}</td>
                        <td className="py-3 px-4 font-mono font-bold text-precision-cyanLight">{s.rating} Grade</td>
                        <td className="py-3 px-4 font-semibold text-emerald-400">{(s.on_time_delivery_rate * 100).toFixed(1)}%</td>
                        <td className="py-3 px-4 font-mono">{s.defect_rate_ppm} PPM</td>
                        <td className="py-3 px-4 text-slate-400 font-semibold">{s.contact_name || '—'}</td>
                        <td className="py-3 px-4">{s.email || '—'}</td>
                        <td className="py-3 px-4 font-mono">{s.phone || '—'}</td>
                        {canWriteSCM && (
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            <button 
                              onClick={() => openSupplierEdit(s)}
                              className="text-slate-400 hover:text-slate-200 transition-colors p-1"
                              title="Edit Supplier"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button 
                              onClick={() => handleDeleteSupplier(s.id)}
                              className="text-red-400 hover:text-red-300 transition-colors p-1"
                              title="Delete Supplier"
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
                <span className="text-[11px] text-slate-500">Showing {suppliers.length} suppliers</span>
                <div className="flex items-center gap-1.5">
                  <button 
                    disabled={supplierPage === 1}
                    onClick={() => setSupplierPage(p => Math.max(1, p - 1))}
                    className="p-1.5 bg-obsidian-900 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-40 rounded"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs text-slate-400 font-mono">{supplierPage} / {supplierPages}</span>
                  <button 
                    disabled={supplierPage === supplierPages}
                    onClick={() => setSupplierPage(p => Math.min(supplierPages, p + 1))}
                    className="p-1.5 bg-obsidian-900 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-40 rounded"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: PURCHASE ORDERS */}
        {activeTab === 'pos' && (
          <div className="space-y-6">
            
            <div className="glass-panel p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-200">Procurement Purchase Orders</h3>
                  <p className="text-xs text-slate-500">Track raw material purchase orders, ETA compliance, and approvals status.</p>
                </div>
                {canWriteSCM && (
                  <button 
                    onClick={openPOCreate}
                    className="flex items-center gap-1 bg-precision-cyan hover:bg-precision-cyanLight text-obsidian-950 text-xs font-bold px-3.5 py-2 rounded-lg"
                  >
                    <Plus size={14} /> Create Purchase Order
                  </button>
                )}
              </div>

              {/* Filters */}
              <form onSubmit={handlePOSearch} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search PO number..." 
                    value={searchPO}
                    onChange={(e) => setSearchPO(e.target.value)}
                    className="w-full bg-obsidian-950 border border-slate-800/80 focus:border-precision-cyan/80 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 outline-none"
                  />
                  <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                </div>

                <select 
                  value={poStatusFilter}
                  onChange={(e) => setPoStatusFilter(e.target.value)}
                  className="bg-obsidian-950 border border-slate-800/80 focus:border-precision-cyan/80 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="Issued">Issued</option>
                  <option value="Shipped">Shipped</option>
                  <option value="In_Inspection">In Inspection</option>
                  <option value="Completed">Completed</option>
                </select>
                
                <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold py-2 rounded-lg">Search</button>
                
                <button 
                  type="button" 
                  onClick={() => { setSearchPO(''); setPoStatusFilter(''); fetchPOs(); }}
                  className="p-2 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg"
                >
                  Clear Filters
                </button>
              </form>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-slate-500 uppercase font-semibold">
                      <th className="py-2.5 px-4">PO Number</th>
                      <th className="py-2.5 px-4">Supplier</th>
                      <th className="py-2.5 px-4">Order Date</th>
                      <th className="py-2.5 px-4">ETA Delivery</th>
                      <th className="py-2.5 px-4">Total Amount</th>
                      <th className="py-2.5 px-4">Priority</th>
                      <th className="py-2.5 px-4">Approval Status</th>
                      <th className="py-2.5 px-4">PO Status</th>
                      {canWriteSCM && <th className="py-2.5 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                    {pos.map(po => (
                      <tr key={po.id} className="hover:bg-slate-850/10">
                        <td className="py-3 px-4 font-mono font-bold text-precision-cyanLight">{po.po_number}</td>
                        <td className="py-3 px-4 font-bold text-slate-200">{po.supplier?.name}</td>
                        <td className="py-3 px-4 font-mono">{new Date(po.order_date).toLocaleDateString()}</td>
                        <td className="py-3 px-4 font-mono">{po.delivery_eta ? new Date(po.delivery_eta).toLocaleDateString() : '—'}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-300">${po.total_amount.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getPriorityClass(po.priority)}`}>
                            {po.priority}
                          </span>
                        </td>
                        <td className={`py-3 px-4 ${getApprovalStatusClass(po.approval_status)}`}>
                          {po.approval_status.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getPOStatusClass(po.status)}`}>
                            {po.status.replace('_', ' ')}
                          </span>
                        </td>
                        {canWriteSCM && (
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            <button 
                              onClick={() => openPOEdit(po)}
                              className="text-slate-400 hover:text-slate-200 p-1"
                              title="Edit PO"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button 
                              onClick={() => handleDeletePO(po.id)}
                              className="text-red-400 hover:text-red-300 p-1"
                              title="Delete PO"
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
                <span className="text-[11px] text-slate-500">Showing {pos.length} Purchase Orders</span>
                <div className="flex items-center gap-1.5">
                  <button 
                    disabled={poPage === 1}
                    onClick={() => setPoPage(p => Math.max(1, p - 1))}
                    className="p-1.5 bg-obsidian-900 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-40 rounded"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs text-slate-400 font-mono">{poPage} / {poPages}</span>
                  <button 
                    disabled={poPage === poPages}
                    onClick={() => setPoPage(p => Math.min(poPages, p + 1))}
                    className="p-1.5 bg-obsidian-900 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-40 rounded"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 4: INVENTORY CONTROL */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            
            <div className="glass-panel p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-200">Material Master Stock Inventory</h3>
                  <p className="text-xs text-slate-500">Warehouse location components balances and reorder alerts.</p>
                </div>
              </div>

              {inventory.length === 0 ? (
                <div className="text-center py-10 text-slate-500">No stock inventory tracked.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-slate-500 uppercase font-semibold">
                        <th className="py-2.5 px-4">Part Number</th>
                        <th className="py-2.5 px-4">Material Name</th>
                        <th className="py-2.5 px-4">Category</th>
                        <th className="py-2.5 px-4">Warehouse</th>
                        <th className="py-2.5 px-4">Lot Batch Number</th>
                        <th className="py-2.5 px-4">Available Stock</th>
                        <th className="py-2.5 px-4">Reserved Stock</th>
                        <th className="py-2.5 px-4">Min stock</th>
                        <th className="py-2.5 px-4">Reorder Level</th>
                        <th className="py-2.5 px-4">Status Alert</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300">
                      {inventory.map(item => {
                        const isLow = item.available_stock < item.minimum_stock;
                        return (
                          <tr key={item.id} className="hover:bg-slate-850/10">
                            <td className="py-3 px-4 font-mono font-bold text-precision-cyanLight">{item.material?.part_number}</td>
                            <td className="py-3 px-4 font-semibold text-slate-200">{item.material?.name}</td>
                            <td className="py-3 px-4 text-slate-400">{item.material?.category}</td>
                            <td className="py-3 px-4 text-slate-300 font-semibold">{item.warehouse?.name}</td>
                            <td className="py-3 px-4 font-mono text-slate-500">{item.batch_lot_number || '—'}</td>
                            <td className={`py-3 px-4 font-mono font-bold ${isLow ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {item.available_stock.toLocaleString()} {item.material?.unit_of_measure}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-500">{item.reserved_stock.toLocaleString()}</td>
                            <td className="py-3 px-4 font-mono">{item.minimum_stock.toLocaleString()}</td>
                            <td className="py-3 px-4 font-mono">{item.reorder_level.toLocaleString()}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                isLow ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {isLow ? 'REORDER NOW' : 'STOCK OK'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 5: INCOMING INSPECTIONS */}
        {activeTab === 'inspections' && (
          <div className="space-y-6">
            
            <div className="glass-panel p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-200">Incoming Lot Inspection (OQC/IQC)</h3>
                  <p className="text-xs text-slate-500">Record verification details of delivered purchase orders components.</p>
                </div>
                {canWriteInsp && (
                  <button 
                    onClick={() => {
                      setInspectionForm({
                        purchase_order_id: '',
                        material_id: '',
                        inspection_date: new Date().toISOString().split('T')[0],
                        qty_received: '',
                        qty_accepted: '',
                        qty_rejected: '',
                        defect_reason: '',
                        status: 'Pending'
                      });
                      setShowInspectionModal(true);
                    }}
                    className="flex items-center gap-1 bg-precision-cyan hover:bg-precision-cyanLight text-obsidian-950 text-xs font-bold px-2.5 py-1.5 rounded"
                  >
                    <Plus size={12} /> Log Inspection
                  </button>
                )}
              </div>

              {inspections.length === 0 ? (
                <div className="text-center py-10 text-slate-500">No incoming quality inspections recorded.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-slate-500 uppercase font-semibold">
                        <th className="py-2.5 px-4">Inspection Date</th>
                        <th className="py-2.5 px-4">PO Number</th>
                        <th className="py-2.5 px-4">Component Material</th>
                        <th className="py-2.5 px-4">Qty Received</th>
                        <th className="py-2.5 px-4">Qty Accepted</th>
                        <th className="py-2.5 px-4">Qty Rejected</th>
                        <th className="py-2.5 px-4">Defect Reason</th>
                        <th className="py-2.5 px-4">Inspector</th>
                        <th className="py-2.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300">
                      {inspections.map(insp => (
                        <tr key={insp.id} className="hover:bg-slate-850/10">
                          <td className="py-3 px-4 font-mono">{new Date(insp.inspection_date).toLocaleDateString()}</td>
                          <td className="py-3 px-4 font-mono font-bold text-precision-cyanLight">{insp.purchase_order?.po_number}</td>
                          <td className="py-3 px-4 font-semibold text-slate-200">{insp.material?.name}</td>
                          <td className="py-3 px-4 font-mono">{insp.qty_received}</td>
                          <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">{insp.qty_accepted}</td>
                          <td className="py-3 px-4 font-mono text-rose-400 font-semibold">{insp.qty_rejected}</td>
                          <td className="py-3 px-4 text-slate-400 max-w-xs truncate" title={insp.defect_reason}>{insp.defect_reason || '—'}</td>
                          <td className="py-3 px-4 font-semibold text-slate-400">{insp.inspector_name}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              insp.status === 'Passed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {insp.status}
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

      {/* SUPPLIER MODAL */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowSupplierModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="glass-panel w-full max-w-sm p-6 relative z-10 border border-slate-700/50 glow-cyan">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-base font-bold text-slate-100">
                {editingSupplier ? 'Modify Supplier Profile' : 'Add Supplier Profile'}
              </h3>
              <button onClick={() => setShowSupplierModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>
            
            {supplierFormError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded mb-4">
                {supplierFormError}
              </div>
            )}

            <form onSubmit={handleSaveSupplier} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Supplier Company Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Avnet Inc."
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Contract Agent Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. John Croft"
                    value={supplierForm.contact_name}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contact_name: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Supplier Grade Rating</label>
                  <select 
                    value={supplierForm.rating}
                    onChange={(e) => setSupplierForm({ ...supplierForm, rating: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="A">Grade A (Preferred)</option>
                    <option value="B">Grade B (Standard)</option>
                    <option value="C">Grade C (Substandard)</option>
                    <option value="D">Grade D (Conditional)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                <input 
                  type="email" 
                  placeholder="e.g. orders@avnet.com"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone</label>
                <input 
                  type="text" 
                  placeholder="e.g. +1-800-555-0199"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowSupplierModal(false)}
                  className="px-3.5 py-1.5 border border-slate-800 text-slate-300 text-xs font-semibold rounded hover:bg-slate-800/40"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={supplierSubmitting}
                  className="bg-precision-cyan text-obsidian-950 font-bold px-4 py-1.5 rounded text-xs hover:bg-precision-cyanLight"
                >
                  {supplierSubmitting ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PO MODAL */}
      {showPOModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowPOModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="glass-panel w-full max-w-md p-6 relative z-10 border border-slate-700/50 glow-cyan">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-base font-bold text-slate-100">
                {editingPO ? 'Edit Purchase Order' : 'Create Purchase Order'}
              </h3>
              <button onClick={() => setShowPOModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>
            
            {poFormError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded mb-4">
                {poFormError}
              </div>
            )}

            <form onSubmit={handleSavePO} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Target Supplier</label>
                <select 
                  required
                  value={poForm.supplier_id}
                  onChange={(e) => setPoForm({ ...poForm, supplier_id: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                >
                  <option value="">Select supplier...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">PO Number</label>
                <input 
                  type="text" 
                  required
                  value={poForm.po_number}
                  onChange={(e) => setPoForm({ ...poForm, po_number: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Amount ($)</label>
                  <input 
                    type="number" 
                    required
                    placeholder="5000"
                    value={poForm.total_amount}
                    onChange={(e) => setPoForm({ ...poForm, total_amount: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Priority</label>
                  <select 
                    value={poForm.priority}
                    onChange={(e) => setPoForm({ ...poForm, priority: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">ETA Delivery</label>
                  <input 
                    type="date" 
                    value={poForm.delivery_eta}
                    onChange={(e) => setPoForm({ ...poForm, delivery_eta: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Approval Status</label>
                  <select 
                    value={poForm.approval_status}
                    onChange={(e) => setPoForm({ ...poForm, approval_status: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="Pending_Approval">Pending Approval</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">PO Status</label>
                <select 
                  value={poForm.status}
                  onChange={(e) => setPoForm({ ...poForm, status: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                >
                  <option value="Issued">Issued</option>
                  <option value="Shipped">Shipped</option>
                  <option value="In_Inspection">In Inspection</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowPOModal(false)}
                  className="px-3.5 py-1.5 border border-slate-800 text-slate-300 text-xs font-semibold rounded hover:bg-slate-800/40"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={poSubmitting}
                  className="bg-precision-cyan text-obsidian-950 font-bold px-4 py-1.5 rounded text-xs hover:bg-precision-cyanLight"
                >
                  {poSubmitting ? 'Saving...' : 'Save Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECTION MODAL */}
      {showInspectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowInspectionModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="glass-panel w-full max-w-sm p-6 relative z-10 border border-slate-700/50 glow-cyan">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-base font-bold text-slate-100">IQC Quality Log</h3>
              <button onClick={() => setShowInspectionModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>
            
            <form onSubmit={handleCreateIncomingInspection} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Target PO</label>
                <select 
                  required
                  value={inspectionForm.purchase_order_id}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, purchase_order_id: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                >
                  <option value="">Select PO...</option>
                  {pos.map(po => (
                    <option key={po.id} value={po.id}>{po.po_number}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Material Component</label>
                <select 
                  required
                  value={inspectionForm.material_id}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, material_id: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                >
                  <option value="">Select Material...</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.part_number} ({m.name})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Qty Received</label>
                  <input 
                    type="number" 
                    required
                    value={inspectionForm.qty_received}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, qty_received: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Qty Accepted</label>
                  <input 
                    type="number" 
                    value={inspectionForm.qty_accepted}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, qty_accepted: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Qty Rejected</label>
                  <input 
                    type="number" 
                    value={inspectionForm.qty_rejected}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, qty_rejected: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Defect Reason</label>
                <input 
                  type="text" 
                  placeholder="e.g. Dimensions out of specs"
                  value={inspectionForm.defect_reason}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, defect_reason: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Inspection Status</label>
                <select 
                  value={inspectionForm.status}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, status: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                >
                  <option value="Passed">Passed</option>
                  <option value="Failed">Failed</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowInspectionModal(false)}
                  className="px-3.5 py-1.5 border border-slate-800 text-slate-300 text-xs font-semibold rounded hover:bg-slate-800/40"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-precision-cyan text-obsidian-950 font-bold px-4 py-1.5 rounded text-xs hover:bg-precision-cyanLight"
                >
                  Log IQC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SupplyChain;
