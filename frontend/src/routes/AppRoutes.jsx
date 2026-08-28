import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import Login from '../features/auth/Login';
import Dashboard from '../features/dashboard/Dashboard';
import Projects from '../features/projects/Projects';
import ProjectDetails from '../features/projects/ProjectDetails';
import Production from '../features/production/Production';
import Quality from '../features/quality/Quality';
import SupplyChain from '../features/supply-chain/SupplyChain';
import AfterSales from '../features/after-sales/AfterSales';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetails />} />
        <Route path="production" element={<Production />} />
        <Route path="quality" element={<Quality />} />
        <Route path="supply-chain" element={<SupplyChain />} />
        <Route path="after-sales" element={<AfterSales />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
