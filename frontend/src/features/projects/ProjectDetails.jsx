import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import projectService from '../../services/projectService';
import { 
  ArrowLeft,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Search,
  SlidersHorizontal,
  Bookmark,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeRole } = useAuth();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab states: 'timeline', 'stagegate', 'bom'
  const [activeTab, setActiveTab] = useState('timeline');

  // Milestone actions state
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [milestoneForm, setMilestoneForm] = useState({
    name: '',
    planned_date: '',
    actual_date: '',
    status: 'Not_Started',
    critical_path: false
  });
  
  // BOM actions state
  const [showBOMModal, setShowBOMModal] = useState(false);
  const [editingBOM, setEditingBOM] = useState(null);
  const [bomForm, setBomForm] = useState({
    part_number: '',
    description: '',
    revision: 'A',
    lifecycle_status: 'Active'
  });
  const [bomSearch, setBomSearch] = useState('');

  // Editing project metadata state
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [metadataForm, setMetadataForm] = useState({
    name: '',
    current_stage: '',
    status: '',
    priority: '',
    target_date: ''
  });

  const canWrite = activeRole === 'Admin' || activeRole === 'Project_Mgr';

  const fetchProjectDetails = async () => {
    try {
      const data = await projectService.getProjectDetails(id);
      setProject(data);
      setMetadataForm({
        name: data.name,
        current_stage: data.current_stage,
        status: data.status,
        priority: data.priority,
        target_date: data.target_date
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  // Stage Gate Item Toggle
  const handleToggleStageGate = async (itemId) => {
    if (!canWrite) return;
    try {
      await projectService.toggleStageGateItem(itemId);
      fetchProjectDetails();
    } catch (err) {
      alert('Failed to toggle checklist item');
    }
  };

  // Milestone Operations
  const openMilestoneCreate = () => {
    setEditingMilestone(null);
    setMilestoneForm({
      name: '',
      planned_date: '',
      actual_date: '',
      status: 'Not_Started',
      critical_path: false
    });
    setShowMilestoneModal(true);
  };

  const openMilestoneEdit = (m) => {
    setEditingMilestone(m);
    setMilestoneForm({
      name: m.name,
      planned_date: m.planned_date,
      actual_date: m.actual_date || '',
      status: m.status,
      critical_path: m.critical_path
    });
    setShowMilestoneModal(true);
  };

  const handleSaveMilestone = async (e) => {
    e.preventDefault();
    if (!milestoneForm.name.trim() || !milestoneForm.planned_date) {
      alert('Name and planned date are required');
      return;
    }
    
    const payload = {
      ...milestoneForm,
      actual_date: milestoneForm.actual_date || null
    };

    try {
      if (editingMilestone) {
        await projectService.updateMilestone(editingMilestone.id, payload);
      } else {
        await projectService.createMilestone(id, payload);
      }
      setShowMilestoneModal(false);
      fetchProjectDetails();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save milestone');
    }
  };

  const handleDeleteMilestone = async (mId) => {
    if (!window.confirm('Are you sure you want to delete this milestone?')) return;
    try {
      await projectService.deleteMilestone(mId);
      fetchProjectDetails();
    } catch (err) {
      alert('Failed to delete milestone');
    }
  };

  // BOM Operations
  const openBOMCreate = () => {
    setEditingBOM(null);
    setBomForm({
      part_number: '',
      description: '',
      revision: 'A',
      lifecycle_status: 'Active'
    });
    setShowBOMModal(true);
  };

  const openBOMEdit = (bom) => {
    setEditingBOM(bom);
    setBomForm({
      part_number: bom.part_number,
      description: bom.description || '',
      revision: bom.revision,
      lifecycle_status: bom.lifecycle_status
    });
    setShowBOMModal(true);
  };

  const handleSaveBOM = async (e) => {
    e.preventDefault();
    if (!bomForm.part_number.trim()) {
      alert('Part number is required');
      return;
    }

    try {
      if (editingBOM) {
        await projectService.updateBOMItem(editingBOM.id, bomForm);
      } else {
        await projectService.createBOMItem(id, bomForm);
      }
      setShowBOMModal(false);
      fetchProjectDetails();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save BOM part');
    }
  };

  const handleDeleteBOM = async (bomId) => {
    if (!window.confirm('Are you sure you want to delete this BOM part?')) return;
    try {
      await projectService.deleteBOMItem(bomId);
      fetchProjectDetails();
    } catch (err) {
      alert('Failed to delete BOM part');
    }
  };

  // Save Project Metadata Updates
  const handleSaveMetadata = async (e) => {
    e.preventDefault();
    try {
      await projectService.updateProject(id, metadataForm);
      setIsEditingMetadata(false);
      fetchProjectDetails();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update project details');
    }
  };

  // Delete Project entirely
  const handleDeleteProject = async () => {
    if (!window.confirm('WARNING: Deleting this project will permanently remove its milestones, BOM, and checklist logs. Continue?')) return;
    try {
      await projectService.deleteProject(id);
      navigate('/projects');
    } catch (err) {
      alert('Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="h-10 w-10 rounded-full border-2 border-t-precision-cyan border-slate-800 animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Resolving details page details...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="glass-panel p-8 text-center max-w-lg mx-auto mt-12 space-y-4">
        <AlertCircle size={40} className="text-red-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-200">Error Loading Project</h3>
        <p className="text-sm text-slate-400">{error || 'Project not found.'}</p>
        <button 
          onClick={() => navigate('/projects')}
          className="text-xs font-semibold text-precision-cyanLight flex items-center justify-center gap-1.5 mx-auto hover:underline"
        >
          <ArrowLeft size={14} /> Back to Projects list
        </button>
      </div>
    );
  }

  // Group Checklist Items by Stage
  const stages = ['R&D', 'Proto', 'NPI', 'Qual', 'Mass_Prod'];
  const groupedChecklist = stages.reduce((acc, stage) => {
    acc[stage] = project.stage_gate_items.filter(item => item.stage === stage);
    return acc;
  }, {});

  // Calculate Overall Progress
  const totalChecklist = project.stage_gate_items.length;
  const completedChecklist = project.stage_gate_items.filter(item => item.is_completed).length;
  const checklistPercent = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

  // Filter BOM parts based on search string
  const filteredBoms = project.boms.filter(b => 
    b.part_number.toLowerCase().includes(bomSearch.toLowerCase()) ||
    (b.description && b.description.toLowerCase().includes(bomSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Details Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <button 
            onClick={() => navigate('/projects')}
            className="text-xs font-medium text-slate-500 hover:text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Portfolio Manager
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-100">{project.name}</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-800 border border-slate-700/60 rounded-full text-slate-400">
              {project.program?.name}
            </span>
          </div>
        </div>
        
        {canWrite && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsEditingMetadata(!isEditingMetadata)}
              className="text-xs font-semibold px-4 py-2 border border-slate-800 hover:bg-slate-800/40 text-slate-300 rounded-lg transition-all"
            >
              {isEditingMetadata ? 'Cancel Edit' : 'Edit Project Details'}
            </button>
            <button 
              onClick={handleDeleteProject}
              className="p-2 border border-red-950/20 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
              title="Delete Project"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Edit Metadata Panel */}
      {isEditingMetadata && (
        <form onSubmit={handleSaveMetadata} className="glass-panel p-5 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Project Name</label>
            <input 
              type="text" 
              required
              value={metadataForm.name}
              onChange={(e) => setMetadataForm({ ...metadataForm, name: e.target.value })}
              className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Current Stage</label>
            <select 
              value={metadataForm.current_stage}
              onChange={(e) => setMetadataForm({ ...metadataForm, current_stage: e.target.value })}
              className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-2.5 py-1.5 text-xs text-slate-300 outline-none cursor-pointer"
            >
              <option value="R&D">R&D</option>
              <option value="Proto">Prototype</option>
              <option value="NPI">NPI</option>
              <option value="Qual">Qualification</option>
              <option value="Mass_Prod">Mass Prod</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</label>
            <select 
              value={metadataForm.status}
              onChange={(e) => setMetadataForm({ ...metadataForm, status: e.target.value })}
              className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-2.5 py-1.5 text-xs text-slate-300 outline-none cursor-pointer"
            >
              <option value="Active">Active</option>
              <option value="On_Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Priority</label>
            <select 
              value={metadataForm.priority}
              onChange={(e) => setMetadataForm({ ...metadataForm, priority: e.target.value })}
              className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-2.5 py-1.5 text-xs text-slate-300 outline-none cursor-pointer"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Target Date</label>
              <input 
                type="date" 
                required
                value={metadataForm.target_date}
                onChange={(e) => setMetadataForm({ ...metadataForm, target_date: e.target.value })}
                className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none"
              />
            </div>
            <button 
              type="submit"
              className="bg-precision-cyan text-obsidian-950 font-bold px-4 py-2 rounded text-xs hover:bg-precision-cyanLight active:scale-95 transition-all"
            >
              Save
            </button>
          </div>
        </form>
      )}

      {/* Meta Stats Panel */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 rounded-lg text-precision-cyan">
            <Layers size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Current Stage</span>
            <h4 className="text-lg font-bold text-slate-200 mt-0.5">{project.current_stage}</h4>
          </div>
        </div>

        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
            <CheckCircle size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Stage-Gate Completion</span>
            <h4 className="text-lg font-bold text-emerald-400 mt-0.5">{checklistPercent}% ({completedChecklist}/{totalChecklist})</h4>
          </div>
        </div>

        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Target Date</span>
            <h4 className="text-lg font-bold text-slate-200 mt-0.5">{new Date(project.target_date).toLocaleDateString()}</h4>
          </div>
        </div>

        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
            <Bookmark size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">BOM Total Items</span>
            <h4 className="text-lg font-bold text-slate-200 mt-0.5">{project.bom_count} Parts</h4>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-800/80">
        <button 
          onClick={() => setActiveTab('timeline')}
          className={`px-5 py-3.5 text-sm font-semibold transition-all border-b-2 ${
            activeTab === 'timeline'
              ? 'border-precision-cyan text-precision-cyanLight bg-precision-cyan/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
          }`}
        >
          Gantt Chart & Timeline
        </button>
        <button 
          onClick={() => setActiveTab('stagegate')}
          className={`px-5 py-3.5 text-sm font-semibold transition-all border-b-2 ${
            activeTab === 'stagegate'
              ? 'border-precision-cyan text-precision-cyanLight bg-precision-cyan/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
          }`}
        >
          Stage Gate Checklist
        </button>
        <button 
          onClick={() => setActiveTab('bom')}
          className={`px-5 py-3.5 text-sm font-semibold transition-all border-b-2 ${
            activeTab === 'bom'
              ? 'border-precision-cyan text-precision-cyanLight bg-precision-cyan/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
          }`}
        >
          BOM Explorer
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        
        {/* TAB 1: Gantt Chart & Timeline */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            
            {/* Visual Horizontal Timeline (Gantt-like track) */}
            <div className="glass-panel p-6 overflow-x-auto">
              <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-8">
                Interactive Milestone Gantt-style Track
              </h3>
              
              {project.milestones.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">No milestones registered. Add a milestone to build the Gantt chart track.</p>
              ) : (
                <div className="relative min-w-[700px] py-10 px-4">
                  {/* Track line */}
                  <div className="absolute top-[52px] left-0 right-0 h-1 bg-slate-800/80 rounded"></div>
                  
                  {/* Milestones Node mapper */}
                  <div className="flex justify-between relative z-10">
                    {[...project.milestones]
                      .sort((a,b) => new Date(a.planned_date) - new Date(b.planned_date))
                      .map((mil, idx) => {
                        const isCompleted = mil.status === 'Completed';
                        const isDelayed = mil.status === 'Delayed';
                        const isCritical = mil.critical_path;
                        
                        let dotColor = 'bg-slate-700 border-slate-600';
                        if (isCompleted) dotColor = 'bg-emerald-500 border-emerald-400 glow-cyan';
                        else if (isDelayed) dotColor = 'bg-rose-500 border-rose-400';
                        else if (mil.status === 'In_Progress') dotColor = 'bg-cyan-500 border-cyan-400 animate-pulse';

                        return (
                          <div key={mil.id} className="flex flex-col items-center max-w-[140px] text-center group/node relative">
                            {/* Date Bubble */}
                            <span className="text-[9px] font-mono text-slate-500 bg-obsidian-950 border border-slate-800 px-2 py-0.5 rounded-full mb-3">
                              {new Date(mil.planned_date).toLocaleDateString()}
                            </span>
                            
                            {/* Node Dot */}
                            <div className={`h-6 w-6 rounded-full border-4 ${dotColor} flex items-center justify-center cursor-pointer transition-transform group-hover/node:scale-110 relative`}>
                              {isCritical && (
                                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border border-obsidian-950 rounded-full" title="Critical Path Milestone"></div>
                              )}
                            </div>
                            
                            {/* Milestone Title */}
                            <span className="text-xs font-bold text-slate-300 group-hover/node:text-precision-cyanLight transition-colors mt-3 line-clamp-2 px-1">
                              {mil.name}
                            </span>
                            
                            {/* Milestone Status Tag */}
                            <span className={`text-[8px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded mt-1.5 ${
                              isCompleted ? 'bg-emerald-500/10 text-emerald-400' :
                              isDelayed ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {mil.status}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Milestones List & Controls */}
            <div className="glass-panel p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-200">Milestones Registry</h3>
                  <p className="text-xs text-slate-500">Track and manage milestone dates and completion parameters.</p>
                </div>
                {canWrite && (
                  <button 
                    onClick={openMilestoneCreate}
                    className="flex items-center gap-1.5 bg-precision-cyan hover:bg-precision-cyanLight text-obsidian-950 text-xs font-bold px-3 py-2 rounded transition-all active:scale-95"
                  >
                    <Plus size={14} /> Add Milestone
                  </button>
                )}
              </div>

              {project.milestones.length === 0 ? (
                <div className="text-center py-10 text-slate-600 text-sm">
                  No milestones found. Click "Add Milestone" to populate list.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-slate-500 uppercase font-semibold tracking-wider">
                        <th className="py-3 px-4">Milestone</th>
                        <th className="py-3 px-4">Planned Date</th>
                        <th className="py-3 px-4">Actual Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Critical Path</th>
                        {canWrite && <th className="py-3 px-4 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300">
                      {project.milestones.map((mil) => (
                        <tr key={mil.id} className="hover:bg-slate-850/20 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-200">{mil.name}</td>
                          <td className="py-3.5 px-4 font-mono">{new Date(mil.planned_date).toLocaleDateString()}</td>
                          <td className="py-3.5 px-4 font-mono">
                            {mil.actual_date ? new Date(mil.actual_date).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              mil.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              mil.status === 'Delayed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              mil.status === 'In_Progress' ? 'bg-cyan-500/10 text-precision-cyanLight border border-precision-cyan/20' :
                              'bg-slate-800 text-slate-400 border border-slate-700/40'
                            }`}>
                              {mil.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {mil.critical_path ? (
                              <span className="text-red-400 font-bold px-2 py-0.5 bg-red-500/10 rounded border border-red-500/20 text-[9px] uppercase tracking-wider">Yes</span>
                            ) : (
                              <span className="text-slate-500">No</span>
                            )}
                          </td>
                          {canWrite && (
                            <td className="py-3.5 px-4 text-right space-x-2">
                              <button 
                                onClick={() => openMilestoneEdit(mil)}
                                className="text-slate-400 hover:text-slate-200 transition-colors p-1"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button 
                                onClick={() => handleDeleteMilestone(mil.id)}
                                className="text-red-400 hover:text-red-300 transition-colors p-1"
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
              )}
            </div>

          </div>
        )}

        {/* TAB 2: Stage Gate Checklist */}
        {activeTab === 'stagegate' && (
          <div className="space-y-6">
            
            <div className="glass-panel p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-200">Quality Stage Gate Checklists</h3>
                  <p className="text-xs text-slate-500">Requirements checklists verified by QA prior to stage transitions.</p>
                </div>
                
                {/* Progress bar info */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">Project verification compliance:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-obsidian-950 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${checklistPercent}%` }}></div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 font-mono">{checklistPercent}%</span>
                  </div>
                </div>
              </div>

              {/* Grid: Stages Tabs/Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {stages.map((stg) => {
                  const stageItems = groupedChecklist[stg] || [];
                  const isCurrent = project.current_stage === stg;
                  const completedInStage = stageItems.filter(item => item.is_completed).length;
                  const percentInStage = stageItems.length > 0 ? Math.round((completedInStage / stageItems.length) * 100) : 0;

                  return (
                    <div 
                      key={stg} 
                      className={`glass-panel p-4 flex flex-col justify-between transition-all duration-300 ${
                        isCurrent 
                          ? 'border-precision-cyan/40 bg-precision-cyan/[0.02] shadow-lg' 
                          : 'border-slate-800/40 bg-obsidian-950/20'
                      }`}
                    >
                      {/* Stage Card Header */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-bold ${isCurrent ? 'text-precision-cyanLight' : 'text-slate-300'}`}>
                            {stg}
                          </h4>
                          {isCurrent && (
                            <span className="text-[8px] font-bold text-precision-cyan bg-precision-cyan/10 border border-precision-cyan/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Current
                            </span>
                          )}
                        </div>
                        
                        {/* Progress inside stage */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono text-slate-500">
                            <span>Compliance:</span>
                            <span>{completedInStage}/{stageItems.length}</span>
                          </div>
                          <div className="w-full bg-obsidian-950 h-1 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${percentInStage === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                              style={{ width: `${percentInStage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Items Checklist Checklist */}
                      <div className="mt-5 space-y-3 pt-4 border-t border-slate-800/40">
                        {stageItems.length === 0 ? (
                          <span className="text-[10px] text-slate-600 italic">No checklist setup.</span>
                        ) : (
                          stageItems.map(item => (
                            <div 
                              key={item.id} 
                              onClick={() => handleToggleStageGate(item.id)}
                              className={`flex items-start gap-2.5 p-2 rounded cursor-pointer transition-colors ${
                                !canWrite ? 'pointer-events-none' : 'hover:bg-slate-800/30'
                              }`}
                            >
                              <input 
                                type="checkbox"
                                checked={item.is_completed}
                                readOnly
                                className="mt-0.5 h-3.5 w-3.5 text-precision-cyan rounded border-slate-800 bg-obsidian-950 focus:ring-precision-cyan cursor-pointer pointer-events-none"
                              />
                              <span className={`text-[11px] leading-tight ${
                                item.is_completed ? 'text-slate-500 line-through' : 'text-slate-300 font-medium'
                              }`}>
                                {item.task_name}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: BOM Explorer */}
        {activeTab === 'bom' && (
          <div className="space-y-6">
            
            <div className="glass-panel p-6">
              {/* BOM header controllers */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-200">Bill of Materials (BOM) Explorer</h3>
                  <p className="text-xs text-slate-500">Track raw materials and subassemblies bound to this project build.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search parts..." 
                      value={bomSearch}
                      onChange={(e) => setBOMSearch(e.target.value)}
                      className="bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 outline-none w-full sm:w-56"
                    />
                    <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                  </div>
                  {canWrite && (
                    <button 
                      onClick={openBOMCreate}
                      className="flex items-center justify-center gap-1.5 bg-precision-cyan hover:bg-precision-cyanLight text-obsidian-950 text-xs font-bold px-3 py-2 rounded-lg transition-all active:scale-95"
                    >
                      <Plus size={14} /> Add Part
                    </button>
                  )}
                </div>
              </div>

              {/* BOM table */}
              {filteredBoms.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  {bomSearch ? 'No parts matched your query.' : 'BOM is empty. Register parts to build bill of materials.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-slate-500 uppercase font-semibold tracking-wider">
                        <th className="py-3 px-4">Part Number</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Revision</th>
                        <th className="py-3 px-4">Lifecycle Status</th>
                        {canWrite && <th className="py-3 px-4 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300">
                      {filteredBoms.map((bom) => (
                        <tr key={bom.id} className="hover:bg-slate-850/20 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-precision-cyanLight">{bom.part_number}</td>
                          <td className="py-3 px-4 max-w-xs truncate">{bom.description || '—'}</td>
                          <td className="py-3 px-4 font-semibold">{bom.revision}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              bom.lifecycle_status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              bom.lifecycle_status === 'EOL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              'bg-amber-500/10 text-amber-400 border border-amber-500/20' // NRND
                            }`}>
                              {bom.lifecycle_status}
                            </span>
                          </td>
                          {canWrite && (
                            <td className="py-3 px-4 text-right space-x-2">
                              <button 
                                onClick={() => openBOMEdit(bom)}
                                className="text-slate-400 hover:text-slate-200 transition-colors p-1"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button 
                                onClick={() => handleDeleteBOM(bom.id)}
                                className="text-red-400 hover:text-red-300 transition-colors p-1"
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
              )}
            </div>

          </div>
        )}

      </div>

      {/* MILESTONE CREATION/EDIT DIALOG */}
      {showMilestoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowMilestoneModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="glass-panel w-full max-w-md p-6 relative z-10 border border-slate-700/50 glow-cyan">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-base font-bold text-slate-100">
                {editingMilestone ? 'Modify Milestone' : 'Register Milestone'}
              </h3>
              <button onClick={() => setShowMilestoneModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>
            
            <form onSubmit={handleSaveMilestone} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Milestone Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Prototype Quality Freeze"
                  value={milestoneForm.name}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Planned Date</label>
                  <input 
                    type="date" 
                    required
                    value={milestoneForm.planned_date}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, planned_date: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Actual Date (optional)</label>
                  <input 
                    type="date" 
                    value={milestoneForm.actual_date}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, actual_date: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</label>
                  <select 
                    value={milestoneForm.status}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, status: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none"
                  >
                    <option value="Not_Started">Not Started</option>
                    <option value="In_Progress">In Progress</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2 mt-4">
                  <input 
                    type="checkbox"
                    id="critical_path"
                    checked={milestoneForm.critical_path}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, critical_path: e.target.checked })}
                    className="h-4 w-4 text-precision-cyan rounded border-slate-800 bg-obsidian-950 focus:ring-precision-cyan cursor-pointer"
                  />
                  <label htmlFor="critical_path" className="text-xs font-semibold text-slate-300 cursor-pointer">Critical Path</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowMilestoneModal(false)}
                  className="px-3.5 py-1.5 border border-slate-800 hover:bg-slate-800/40 text-slate-300 text-xs font-semibold rounded"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-precision-cyan text-obsidian-950 font-bold px-4 py-1.5 rounded text-xs hover:bg-precision-cyanLight"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOM CREATION/EDIT DIALOG */}
      {showBOMModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowBOMModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="glass-panel w-full max-w-md p-6 relative z-10 border border-slate-700/50 glow-cyan">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-base font-bold text-slate-100">
                {editingBOM ? 'Modify BOM Part' : 'Add BOM Part'}
              </h3>
              <button onClick={() => setShowBOMModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>
            
            <form onSubmit={handleSaveBOM} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Part Number</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. 500-10023-A"
                    value={bomForm.part_number}
                    onChange={(e) => setBomForm({ ...bomForm, part_number: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Revision</label>
                  <input 
                    type="text" 
                    required
                    placeholder="A"
                    value={bomForm.revision}
                    onChange={(e) => setBomForm({ ...bomForm, revision: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Part Description</label>
                <input 
                  type="text" 
                  placeholder="e.g. High-temperature logic controller"
                  value={bomForm.description}
                  onChange={(e) => setBomForm({ ...bomForm, description: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Lifecycle Status</label>
                <select 
                  value={bomForm.lifecycle_status}
                  onChange={(e) => setBomForm({ ...bomForm, lifecycle_status: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded px-3 py-2 text-xs text-slate-300 outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="NRND">NRND (Not Recommended for New Design)</option>
                  <option value="EOL">EOL (End of Life)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowBOMModal(false)}
                  className="px-3.5 py-1.5 border border-slate-800 hover:bg-slate-800/40 text-slate-300 text-xs font-semibold rounded"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-precision-cyan text-obsidian-950 font-bold px-4 py-1.5 rounded text-xs hover:bg-precision-cyanLight"
                >
                  Save Component
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
