import api from './api';

const afterSalesService = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get('/after-sales/dashboard/stats');
    return response.data;
  },

  // RMA CRUD
  getRMAs: async (params = {}) => {
    const response = await api.get('/after-sales/rmas', { params });
    return response.data;
  },

  createRMA: async (rmaData) => {
    const response = await api.post('/after-sales/rmas', rmaData);
    return response.data;
  },

  updateRMA: async (rmaId, rmaData) => {
    const response = await api.put(`/after-sales/rmas/${rmaId}`, rmaData);
    return response.data;
  },

  deleteRMA: async (rmaId) => {
    const response = await api.delete(`/after-sales/rmas/${rmaId}`);
    return response.data;
  },

  // Repair tracking CRUD
  getRepairs: async () => {
    const response = await api.get('/after-sales/repairs');
    return response.data;
  },

  updateRepair: async (repairId, repairData) => {
    const response = await api.put(`/after-sales/repairs/${repairId}`, repairData);
    return response.data;
  },

  // Spare parts management
  getSpareParts: async () => {
    const response = await api.get('/after-sales/spare-parts');
    return response.data;
  },

  getSparePartsRequests: async () => {
    const response = await api.get('/after-sales/spare-parts/requests');
    return response.data;
  },

  createSparePartsRequest: async (repairId, requestData) => {
    const response = await api.post('/after-sales/spare-parts/requests', null, {
      params: { repair_id: repairId },
      data: requestData
    });
    return response.data;
  },

  // Warranties validation
  getWarranties: async () => {
    const response = await api.get('/after-sales/warranties');
    return response.data;
  },

  checkWarranty: async (serialNumber) => {
    const response = await api.get(`/after-sales/warranties/check/${serialNumber}`);
    return response.data;
  },

  // Customer complaints logs
  getComplaints: async () => {
    const response = await api.get('/after-sales/complaints');
    return response.data;
  },

  createComplaint: async (complaintData) => {
    const response = await api.post('/after-sales/complaints', complaintData);
    return response.data;
  },
};

export default afterSalesService;
