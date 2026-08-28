import api from './api';

const supplyChainService = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get('/supply-chain/dashboard/stats');
    return response.data;
  },

  // Suppliers CRUD
  getSuppliers: async (params = {}) => {
    const response = await api.get('/supply-chain/suppliers', { params });
    return response.data;
  },

  createSupplier: async (supplierData) => {
    const response = await api.post('/supply-chain/suppliers', supplierData);
    return response.data;
  },

  updateSupplier: async (supplierId, supplierData) => {
    const response = await api.put(`/supply-chain/suppliers/${supplierId}`, supplierData);
    return response.data;
  },

  deleteSupplier: async (supplierId) => {
    const response = await api.delete(`/supply-chain/suppliers/${supplierId}`);
    return response.data;
  },

  // Purchase Orders CRUD
  getPOs: async (params = {}) => {
    const response = await api.get('/supply-chain/pos', { params });
    return response.data;
  },

  createPO: async (poData) => {
    const response = await api.post('/supply-chain/pos', poData);
    return response.data;
  },

  updatePO: async (poId, poData) => {
    const response = await api.put(`/supply-chain/pos/${poId}`, poData);
    return response.data;
  },

  deletePO: async (poId) => {
    const response = await api.delete(`/supply-chain/pos/${poId}`);
    return response.data;
  },

  // Inventory & Warehouse logs
  getInventory: async () => {
    const response = await api.get('/supply-chain/inventory');
    return response.data;
  },

  getWarehouses: async () => {
    const response = await api.get('/supply-chain/warehouses');
    return response.data;
  },

  getMaterials: async () => {
    const response = await api.get('/supply-chain/materials');
    return response.data;
  },

  // Incoming quality checks
  getIncomingInspections: async () => {
    const response = await api.get('/supply-chain/incoming-inspections');
    return response.data;
  },

  createIncomingInspection: async (inspectionData) => {
    const response = await api.post('/supply-chain/incoming-inspections', inspectionData);
    return response.data;
  },

  // Logistics tracking
  getShipments: async () => {
    const response = await api.get('/supply-chain/shipments');
    return response.data;
  },
};

export default supplyChainService;
