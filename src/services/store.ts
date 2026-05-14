// src/services/store.ts
import { create } from 'zustand';
import { Assignment, WsMessage, DriverStatus } from '../types';

interface DriverRealtime {
  lat: number;
  lng: number;
  speed: number;
  battery: number;
  totalKm: number;
  totalBytes: number;
  status: DriverStatus;
  lastUpdate: number;
}

interface AppStore {
  // Auth
  token: string | null;
  adminName: string;
  setAuth: (token: string, name: string) => void;
  clearAuth: () => void;

  // Assignments
  assignments: Assignment[];
  setAssignments: (assignments: Assignment[]) => void;
  updateAssignment: (updated: Partial<Assignment> & { id: number }) => void;

  // Realtime driver positions
  driverRealtime: Record<number, DriverRealtime>; // key: driverId
  updateDriverRealtime: (driverId: number, data: Omit<DriverRealtime, 'lastUpdate'>) => void;

  // Selected driver/assignment for map
  selectedAssignmentId: number | null;
  setSelectedAssignment: (id: number | null) => void;

  // WebSocket
  wsConnected: boolean;
  setWsConnected: (v: boolean) => void;
  handleWsMessage: (msg: WsMessage) => void;
}

export const useStore = create<AppStore>((set, get) => ({
  token: localStorage.getItem('admin_token'),
  adminName: '',
  setAuth: (token, name) => {
    localStorage.setItem('admin_token', token);
    set({ token, adminName: name });
  },
  clearAuth: () => {
    localStorage.removeItem('admin_token');
    set({ token: null, adminName: '' });
  },

  assignments: [],
  setAssignments: (assignments) => set({ assignments }),
  updateAssignment: (updated) =>
    set((state) => ({
      assignments: state.assignments.map((a) =>
        a.id === updated.id ? { ...a, ...updated } : a
      ),
    })),

  driverRealtime: {},
  updateDriverRealtime: (driverId, data) =>
    set((state) => ({
      driverRealtime: {
        ...state.driverRealtime,
        [driverId]: { ...data, lastUpdate: Date.now() },
      },
    })),

  selectedAssignmentId: null,
  setSelectedAssignment: (id) => set({ selectedAssignmentId: id }),

  wsConnected: false,
  setWsConnected: (v) => set({ wsConnected: v }),

  handleWsMessage: (msg) => {
    const state = get();
    if (msg.type === 'LOCATION_UPDATE') {
      state.updateDriverRealtime(msg.driverId, {
        lat: msg.lat,
        lng: msg.lng,
        speed: msg.speed ?? 0,
        battery: msg.battery ?? 0,
        totalKm: msg.totalKm,
        totalBytes: msg.totalBytes,
        status: msg.driverStatus,
      });
      // Cập nhật assignment
      const assignment = state.assignments.find(
        (a) => a.id === msg.assignmentId
      );
      if (assignment) {
        state.updateAssignment({
          id: msg.assignmentId,
          currentLat: msg.lat,
          currentLng: msg.lng,
          totalDistanceKm: msg.totalKm,
          totalBandwidthBytes: msg.totalBytes,
          driverStatus: msg.driverStatus,
          lastPingAt: new Date().toISOString(),
        });
      }
    } else if (msg.type === 'ASSIGNMENT_STARTED') {
      state.updateAssignment({ id: msg.assignmentId, status: 'ACTIVE' });
    } else if (msg.type === 'ASSIGNMENT_COMPLETED') {
      state.updateAssignment({ id: msg.assignmentId, status: 'COMPLETED' });
    }
  },
}));
