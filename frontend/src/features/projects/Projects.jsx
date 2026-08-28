import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import projectService from '../../services/projectService';
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  FolderGit2,
  Calendar,
  AlertCircle,
  TrendingUp,
  FileText
} from 'lucide-react';

const Projects = () => {
  const navigate = useNavigate();
  const { activeRole } = useAuth();
  
  // Project list states
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState([]);

  // Filter states
  const [search, setSearch] = useState('');
  const [programId, setProgramId] = useState('');
  const [stage, setStage] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    program_id: '',
    current_stage: 'R&D',
    target_date: '',
    status: 'Active',
    priority: 'Medium'
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canWrite = activeRole === 'Admin' || activeRole === 'Project_Mgr';

  // Load programs on mount
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const data = await projectService.getPrograms();
        setPrograms(data);
      } catch (err) {
        console.error('Failed to load programs', err);
      }
    };
    fetchPrograms();
  }, []);

  // Fetch projects list when filters/page changes
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 8,
        search: search || undefined,
        program_id: programId || undefined,
        stage: stage || undefined,
        status: status || undefined,
        priority: priority || undefined
      };
      const data = await projectService.getProjects(params);
      setProjects(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page, programId, stage, status, priority]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProjects();
  };

  const resetFilters = () => {
    setSearch('');
    setProgramId('');
    setStage('');
    setStatus('');
    setPriority('');
    setPage(1);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!newProject.name.trim()) return setFormError('Project name is required');
    if (!newProject.program_id) return setFormError('Program is required');
    if (!newProject.target_date) return setFormError('Target completion date is required');

    setSubmitting(true);
    try {
      await projectService.createProject(newProject);
      setShowCreateModal(false);
      // Reset form
      setNewProject({
        name: '',
        program_id: '',
        current_stage: 'R&D',
        target_date: '',
        status: 'Active',
        priority: 'Medium'
      });
      setPage(1);
      fetchProjects();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityBadgeClass = (p) => {
    switch (p) {
      case 'Critical': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'High': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      case 'Medium': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-700/30';
    }
  };

  const getStatusBadgeClass = (s) => {
    switch (s) {
      case 'Completed': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'On_Hold': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Cancelled': return 'bg-rose-950/20 text-rose-400 border border-rose-900/30';
      default: return 'bg-cyan-500/10 text-precision-cyanLight border border-precision-cyan/20';
    }
  };

  const getStageBadgeClass = (stg) => {
    switch (stg) {
      case 'Mass_Prod': return 'bg-purple-500/10 text-purple-300 border border-purple-500/20';
      case 'Qual': return 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20';
      case 'NPI': return 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20';
      case 'Proto': return 'bg-teal-500/10 text-teal-300 border border-teal-500/20';
      default: return 'bg-blue-950/20 text-blue-300 border border-blue-900/30'; // R&D
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FolderGit2 size={24} className="text-precision-cyan" />
            <span>Programs & Projects Portfolio</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Monitor portfolio stage gates, milestone compliance, and bill of materials revisions.
          </p>
        </div>
        {canWrite && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-precision-cyan to-blue-600 hover:from-precision-cyanLight hover:to-blue-500 text-obsidian-950 text-sm font-semibold px-4 py-2.5 rounded-lg shadow-lg shadow-precision-cyan/10 transition-all duration-300 transform active:scale-95"
          >
            <Plus size={18} />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Filter and Search Panel */}
      <div className="glass-panel p-5">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4 relative">
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-obsidian-950/80 border border-slate-800/80 focus:border-precision-cyan/80 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none transition-colors"
            />
            <Search className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
          </div>

          <div className="md:col-span-2">
            <select 
              value={programId}
              onChange={(e) => { setProgramId(e.target.value); setPage(1); }}
              className="w-full bg-obsidian-950/80 border border-slate-800/80 focus:border-precision-cyan/80 rounded-lg px-3 py-2.5 text-sm text-slate-300 outline-none cursor-pointer"
            >
              <option value="">All Programs</option>
              {programs.map(prg => (
                <option key={prg.id} value={prg.id}>{prg.name}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select 
              value={stage}
              onChange={(e) => { setStage(e.target.value); setPage(1); }}
              className="w-full bg-obsidian-950/80 border border-slate-800/80 focus:border-precision-cyan/80 rounded-lg px-3 py-2.5 text-sm text-slate-300 outline-none cursor-pointer"
            >
              <option value="">All Stages</option>
              <option value="R&D">R&D</option>
              <option value="Proto">Prototype</option>
              <option value="NPI">NPI</option>
              <option value="Qual">Qualification</option>
              <option value="Mass_Prod">Mass Prod</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select 
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full bg-obsidian-950/80 border border-slate-800/80 focus:border-precision-cyan/80 rounded-lg px-3 py-2.5 text-sm text-slate-300 outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On_Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="md:col-span-2 flex gap-2">
            <select 
              value={priority}
              onChange={(e) => { setPriority(e.target.value); setPage(1); }}
              className="w-full bg-obsidian-950/80 border border-slate-800/80 focus:border-precision-cyan/80 rounded-lg px-3 py-2.5 text-sm text-slate-300 outline-none cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
            
            <button 
              type="button"
              onClick={resetFilters}
              className="p-2.5 bg-obsidian-950/60 hover:bg-obsidian-900 border border-slate-800/80 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
              title="Reset Filters"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </form>
      </div>

      {/* Main Content: Projects Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="h-10 w-10 rounded-full border-2 border-t-precision-cyan border-slate-800 animate-spin"></div>
          <p className="text-sm text-slate-500">Querying enterprise database...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-panel py-20 text-center flex flex-col items-center justify-center">
          <AlertCircle size={40} className="text-slate-600 mb-3" />
          <h4 className="text-slate-300 font-semibold">No Projects Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Try adjusting your search criteria or program filters.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {projects.map((proj) => {
            const milestonePercent = proj.milestone_count > 0 
              ? Math.round((proj.completed_milestones / proj.milestone_count) * 100)
              : 0;

            return (
              <div 
                key={proj.id} 
                onClick={() => navigate(`/projects/${proj.id}`)}
                className="glass-card flex flex-col justify-between hover:scale-[1.01] hover:-translate-y-0.5 cursor-pointer glow-cyan-hover group"
              >
                {/* Card Header */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getStageBadgeClass(proj.current_stage)}`}>
                      {proj.current_stage} Stage
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getPriorityBadgeClass(proj.priority)}`}>
                      {proj.priority}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-200 group-hover:text-precision-cyanLight text-[15px] transition-colors leading-tight line-clamp-2">
                      {proj.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-1 truncate">
                      {proj.program?.name || 'Unassigned Program'}
                    </p>
                  </div>
                </div>

                {/* Card Footer & Stats */}
                <div className="mt-6 pt-4 border-t border-slate-800/40 space-y-4">
                  {/* Progress Indicator */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 flex items-center gap-1">
                        <TrendingUp size={11} /> Milestones Completed
                      </span>
                      <span className="text-slate-300 font-semibold font-mono">
                        {proj.completed_milestones}/{proj.milestone_count} ({milestonePercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-obsidian-950/80 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-precision-cyan h-full rounded-full transition-all duration-500" 
                        style={{ width: `${milestonePercent}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar size={12} className="text-slate-500" />
                      <span>Target: {new Date(proj.target_date).toLocaleDateString()}</span>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${getStatusBadgeClass(proj.status)}`}>
                      {proj.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {projects.length > 0 && !loading && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <p className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-400">{projects.length}</span> of <span className="font-semibold text-slate-400">{total}</span> portfolio projects
          </p>
          
          <div className="flex items-center gap-1.5">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-2 bg-obsidian-900 border border-slate-800/80 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:hover:text-slate-400 rounded-lg transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            
            {Array.from({ length: pages }, (_, i) => i + 1).map(pageNum => (
              <button 
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`w-9 h-9 rounded-lg text-xs font-semibold transition-colors ${
                  pageNum === page 
                    ? 'bg-precision-cyan/15 border border-precision-cyan/40 text-precision-cyanLight' 
                    : 'bg-obsidian-900/60 border border-slate-800/80 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button 
              disabled={page === pages}
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              className="p-2 bg-obsidian-900 border border-slate-800/80 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:hover:text-slate-400 rounded-lg transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            onClick={() => setShowCreateModal(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          ></div>
          
          {/* Form Content */}
          <div className="glass-panel w-full max-w-lg p-6 relative z-10 border border-slate-700/50 glow-cyan">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Plus size={20} className="text-precision-cyan" />
                  <span>Initiate New Portfolio Project</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Define metadata and initialize default stage-gates.</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2 mb-4">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Project Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Acme G5 Subassembly Mount"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Program Portfolio</label>
                  <select 
                    required
                    value={newProject.program_id}
                    onChange={(e) => setNewProject({ ...newProject, program_id: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="">Select program...</option>
                    {programs.map(prg => (
                      <option key={prg.id} value={prg.id}>{prg.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Target Completion Date</label>
                  <input 
                    type="date" 
                    required
                    value={newProject.target_date}
                    onChange={(e) => setNewProject({ ...newProject, target_date: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Initial Stage</label>
                  <select 
                    value={newProject.current_stage}
                    onChange={(e) => setNewProject({ ...newProject, current_stage: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="R&D">R&D</option>
                    <option value="Proto">Prototype</option>
                    <option value="NPI">NPI</option>
                    <option value="Qual">Qualification</option>
                    <option value="Mass_Prod">Mass Prod</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                  <select 
                    value={newProject.status}
                    onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="On_Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Priority</label>
                  <select 
                    value={newProject.priority}
                    onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })}
                    className="w-full bg-obsidian-950 border border-slate-800 focus:border-precision-cyan/80 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800/40 text-slate-300 text-sm font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-gradient-to-r from-precision-cyan to-blue-600 hover:from-precision-cyanLight hover:to-blue-500 text-obsidian-950 text-sm font-bold px-5 py-2 rounded-lg transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Launch Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
