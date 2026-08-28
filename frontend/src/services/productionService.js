import api from './api';

const productionService = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get('/production/dashboard/stats');
    return response.data;
  },

  // Get production lines and nested machines
  getProductionLines: async () => {
    const response = await api.get('/production/lines');
    return response.data;
  },

  // Toggle machine status (Active/Error/Offline)
  toggleMachineStatus: async (machineId, statusData) => {
    const response = await api.put(`/production/machines/${machineId}`, statusData);
    return response.data;
  },

  // Get paginated list of work orders with filters
  getWorkOrders: async (params = {}) => {
    const response = await api.get('/production/work-orders', { params });
    return response.data;
  },

  // Create a new work order
  createWorkOrder: async (woData) => {
    const response = await api.post('/production/work-orders', woData);
    return response.data;
  },

  // Update work order details
  updateWorkOrder: async (woId, woData) => {
    const response = await api.put(`/production/work-orders/${woId}`, woData);
    return response.data;
  },

  // Delete a work order
  deleteWorkOrder: async (woId) => {
    const response = await api.delete(`/production/work-orders/${woId}`);
    return response.data;
  },
};

export default productionService;
