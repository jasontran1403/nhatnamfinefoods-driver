// src/services/api.ts
import axios from 'axios';
import { Assignment, AssignmentRoute, User, CreateAssignmentForm, OptimalPath } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({ baseURL: BASE_URL, headers: { 'ngrok-skip-browser-warning': 'true' } });

// Interceptor thêm token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  login: async (username: string, password: string) => {
    const { data } = await api.post('/api/auth/login', { username, password });
    localStorage.setItem('admin_token', data.token);
    return data;
  },
  logout: () => localStorage.removeItem('admin_token'),
};

export const driversApi = {
  getAll: (): Promise<User[]> =>
      api.get('/api/admin/drivers').then(r => r.data),

  createDriver: (body: { username: string; password: string; fullName: string; phone: string }) =>
      api.post('/api/auth/create-driver', body).then(r => r.data),
};

export const assignmentApi = {
  getActive: (): Promise<Assignment[]> =>
      api.get('/api/admin/assignments/active').then(r => r.data),

  getAll: (): Promise<Assignment[]> =>
      api.get('/api/admin/assignments').then(r => r.data),

  getByDriver: (driverId: number): Promise<Assignment[]> =>
      api.get(`/api/admin/drivers/${driverId}/assignments`).then(r => r.data),

  create: (form: CreateAssignmentForm): Promise<Assignment> =>
      api.post('/api/admin/assignments', {
        driverId: Number(form.driverId),
        orders: form.orders.map(o => ({
          recipientName: o.recipientName,
          recipientPhone: o.recipientPhone,
          deliveryAddress: o.deliveryAddress,
          addressLat: parseFloat(o.addressLat) || 10.7769,
          addressLng: parseFloat(o.addressLng) || 106.7009,
          orderNote: o.orderNote,
          amountToCollect: parseFloat(o.amountToCollect) || 0,
        })),
      }).then(r => r.data),

  getRoute: (assignmentId: number): Promise<AssignmentRoute> =>
      api.get(`/api/admin/assignments/${assignmentId}/route`).then(r => r.data),

  getOptimalPath: (assignmentId: number): Promise<OptimalPath> =>
      api.get(`/api/admin/assignments/${assignmentId}/optimal-path`).then(r => r.data),

  delete: (id: number): Promise<void> =>
      api.delete(`/api/admin/assignments/${id}`).then(r => r.data),
};