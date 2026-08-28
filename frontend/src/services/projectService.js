import api from './api';

const projectService = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get('/projects/dashboard/stats');
    return response.data;
  },

  // Get list of programs
  getPrograms: async () => {
    const response = await api.get('/projects/programs');
    return response.data;
  },

  // Get paginated projects list with filters and search query
  getProjects: async (params = {}) => {
    const response = await api.get('/projects/', { params });
    return response.data;
  },

  // Get detailed information of a single project
  getProjectDetails: async (projectId) => {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  },

  // Create a new project
  createProject: async (projectData) => {
    const response = await api.post('/projects/', projectData);
    return response.data;
  },

  // Update project details (metadata, stage change)
  updateProject: async (projectId, projectData) => {
    const response = await api.put(`/projects/${projectId}`, projectData);
    return response.data;
  },

  // Delete a project
  deleteProject: async (projectId) => {
    const response = await api.delete(`/projects/${projectId}`);
    return response.data;
  },

  // Add a milestone to a project
  createMilestone: async (projectId, milestoneData) => {
    const response = await api.post(`/projects/${projectId}/milestones`, milestoneData);
    return response.data;
  },

  // Update milestone details
  updateMilestone: async (milestoneId, milestoneData) => {
    const response = await api.put(`/projects/milestones/${milestoneId}`, milestoneData);
    return response.data;
  },

  // Delete a milestone
  deleteMilestone: async (milestoneId) => {
    const response = await api.delete(`/projects/milestones/${milestoneId}`);
    return response.data;
  },

  // Add a BOM part to a project
  createBOMItem: async (projectId, bomData) => {
    const response = await api.post(`/projects/${projectId}/bom`, bomData);
    return response.data;
  },

  // Update BOM part details
  updateBOMItem: async (bomId, bomData) => {
    const response = await api.put(`/projects/bom/${bomId}`, bomData);
    return response.data;
  },

  // Delete a BOM part
  deleteBOMItem: async (bomId) => {
    const response = await api.delete(`/projects/bom/${bomId}`);
    return response.data;
  },

  // Toggle stage gate checklist item completion status
  toggleStageGateItem: async (itemId) => {
    const response = await api.put(`/projects/stage-gate/${itemId}`);
    return response.data;
  },
};

export default projectService;
