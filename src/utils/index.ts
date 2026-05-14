// src/utils/index.ts
import { DriverStatus } from '../types';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(2)} km`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

export function formatDate(date: string | undefined): string {
  if (!date) return '-';
  return format(new Date(date), 'HH:mm dd/MM/yyyy', { locale: vi });
}

export function formatTimeAgo(date: string | number | undefined): string {
  if (!date) return '-';
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
}

export function getStatusColor(status: DriverStatus): string {
  switch (status) {
    case 'MOVING': return '#22c55e';   // green
    case 'STOPPED': return '#f59e0b';  // amber
    case 'OFFLINE': return '#6b7280';  // gray
    default: return '#3b82f6';          // blue
  }
}

export function getStatusLabel(status: DriverStatus): string {
  switch (status) {
    case 'MOVING': return 'Đang chạy';
    case 'STOPPED': return 'Đang dừng';
    case 'OFFLINE': return 'Ngoại tuyến';
    default: return 'Rảnh';
  }
}

export function getBatteryIcon(level: number): string {
  if (level > 80) return '🔋';
  if (level > 50) return '🔋';
  if (level > 20) return '🪫';
  return '⚠️';
}

// Tạo màu gradient cho route theo tốc độ
export function speedToColor(speed: number): string {
  if (speed < 5) return '#6b7280';   // dừng - xám
  if (speed < 30) return '#3b82f6';  // chậm - xanh
  if (speed < 60) return '#22c55e';  // trung bình - xanh lá
  return '#ef4444';                   // nhanh - đỏ
}