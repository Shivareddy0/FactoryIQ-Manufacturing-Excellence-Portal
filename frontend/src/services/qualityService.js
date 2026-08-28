import api from './api';

const qualityService = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get('/quality/dashboard/stats');
    return response.data;
  },

  // Get SPC measurements
  getSPCMeasurements: async () => {
    const response = await api.get('/quality/spc');
    return response.data;
  },

  // NCR CRUD operations
  getNCRs: async (params = {}) => {
    const response = await api.get('/quality/ncrs', { params });
    return response.data;
  },

  getNCRDetails: async (ncrId) => {
    const response = await api.get(`/quality/ncrs/${ncrId}`);
    return response.data;
  },

  createNCR: async (ncrData) => {
    const response = await api.post('/quality/ncrs', ncrData);
    return response.data;
  },

  updateNCR: async (ncrId, ncrData) => {
    const response = await api.put(`/quality/ncrs/${ncrId}`, ncrData);
    return response.data;
  },

  deleteNCR: async (ncrId) => {
    const response = await api.delete(`/quality/ncrs/${ncrId}`);
    return response.data;
  },

  // CAPA CRUD operations
  getCAPAs: async () => {
    const response = await api.get('/quality/capas');
    return response.data;
  },

  createCAPA: async (capaData) => {
    const response = await api.post('/quality/capas', capaData);
    return response.data;
  },

  updateCAPA: async (capaId, capaData) => {
    const response = await api.put(`/quality/capas/${capaId}`, capaData);
    return response.data;
  },

  deleteCAPA: async (capaId) => {
    const response = await api.delete(`/quality/capas/${capaId}`);
    return response.data;
  },

  // Inspections list & create
  getInspections: async () => {
    const response = await api.get('/quality/inspections');
    return response.data;
  },

  createInspection: async (inspectionData) => {
    const response = await api.post('/quality/inspections', inspectionData);
    return response.data;
  },

  // Audits list & create
  getAudits: async () => {
    const response = await api.get('/quality/audits');
    return response.data;
  },

  createAudit: async (auditData) => {
    const response = await api.post('/quality/audits', auditData);
    return response.data;
  },

  // Certifications list
  getCertifications: async () => {
    const response = await api.get('/quality/certifications');
    return response.data;
  },

  // Documents list & search
  getDocuments: async (params = {}) => {
    const response = await api.get('/quality/documents', { params });
    return response.data;
  },

  // Users list for assignments
  getUsers: async () => {
    const response = await api.get('/auth/users');
    return response.data;
  },
};

export default qualityService;
