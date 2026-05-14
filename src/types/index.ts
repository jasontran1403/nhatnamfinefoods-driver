// src/types/index.ts

export type DriverStatus = 'MOVING' | 'STOPPED' | 'OFFLINE' | 'IDLE';
export type AssignmentStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED';
export type OrderStatus = 'PENDING' | 'DELIVERING' | 'COMPLETED';

export interface User {
  id: number;
  username: string;
  fullName: string;
  phone: string;
  active: boolean;
}

export interface DeliveryOrder {
  id: number;
  orderIndex: number;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  addressLat: number;
  addressLng: number;
  orderNote?: string;
  amountToCollect: number;
  status: OrderStatus;
  completedAt?: string;
  segmentDistanceKm: number;
  segmentDurationMinutes: number;
}

export interface Assignment {
  id: number;
  driverId: number;
  driverName: string;
  driverPhone: string;
  status: AssignmentStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  totalDistanceKm: number;
  totalBandwidthBytes: number;
  batteryStart?: number;
  batteryEnd?: number;
  orders: DeliveryOrder[];
  driverStatus: DriverStatus;
  currentLat?: number;
  currentLng?: number;
  lastPingAt?: string;
}

export interface RoutePoint {
  lat: number;
  lng: number;
  speedKmh: number;
  batteryLevel?: number;
  timestamp: string;
  distanceFromPrevious: number;
}

export interface RouteSegment {
  fromLabel: string;
  toLabel: string;
  distanceKm: number;
  durationMinutes: number;
}

export interface AssignmentRoute {
  assignmentId: number;
  points: RoutePoint[];
  segments: RouteSegment[];
  totalDistanceKm: number;
  totalBandwidthBytes: number;
  batteryUsed: number;
  totalDurationMinutes: number;
}

// WebSocket messages từ server
export interface WsLocationUpdate {
  type: 'LOCATION_UPDATE';
  driverId: number;
  assignmentId: number;
  lat: number;
  lng: number;
  speed?: number;
  battery?: number;
  totalKm: number;
  totalBytes: number;
  driverStatus: DriverStatus;
  driverName: string;
  ts: number;
}

export interface WsAssignmentUpdate {
  type: 'ASSIGNMENT_CREATED' | 'ASSIGNMENT_STARTED' | 'ASSIGNMENT_COMPLETED';
  assignmentId: number;
  driverId: number;
  driverName: string;
  status: AssignmentStatus;
}

export type WsMessage = WsLocationUpdate | WsAssignmentUpdate;

// Form types
export interface OrderFormItem {
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  addressLat: string;
  addressLng: string;
  orderNote: string;
  amountToCollect: string;
}

export interface CreateAssignmentForm {
  driverId: string;
  orders: OrderFormItem[];
}

export interface OptimalStop {
  orderId: number;
  recipientName: string;
  deliveryAddress: string;
  lat: number;
  lng: number;
  distanceFromPrevKm: number;
  completed: boolean;
  sequence: number;
}

export interface OptimalPath {
  assignmentId: number;
  currentPosition: { lat: number; lng: number };
  stops: OptimalStop[];
  totalEstimatedKm: number;
}
