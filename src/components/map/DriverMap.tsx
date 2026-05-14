// src/components/map/DriverMap.tsx
import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AssignmentRoute, Assignment } from '../../types';
import { assignmentApi } from '../../services/api';
import { useStore } from '../../services/store';
import { speedToColor, formatDistance, formatDate } from '../../utils';

// Fix leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const driverIcon = L.divIcon({
  html: `<div style="
    width:36px;height:36px;border-radius:50%;
    background:linear-gradient(135deg,#1A237E,#3949AB);
    border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);
    display:flex;align-items:center;justify-content:center;
    font-size:18px;
  ">🚚</div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const deliveryIcon = (completed: boolean) => L.divIcon({
  html: `<div style="position:relative;width:28px;height:38px;">
    <svg viewBox="0 0 24 32" width="28" height="38" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8z"
        fill="${completed ? '#22c55e' : '#EF4444'}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="8" r="3.5" fill="white"/>
    </svg>
  </div>`,
  className: '',
  iconSize: [28, 38],
  iconAnchor: [14, 38],
  popupAnchor: [0, -38],
});

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current) return;
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
      fitted.current = true;
    } else if (points.length === 1) {
      map.setView(points[0], 15);
      fitted.current = true;
    }
  }, [points.length]);
  return null;
}

interface Props {
  assignment: Assignment;
  onClose: () => void;
}

export function DriverMap({ assignment, onClose }: Props) {
  const [route, setRoute] = useState<AssignmentRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSegments, setShowSegments] = useState(false);
  const { driverRealtime } = useStore();

  const isActive = assignment.status === 'ACTIVE';
  const isCompleted = assignment.status === 'COMPLETED';
  const realtime = driverRealtime[assignment.driverId];

  useEffect(() => {
    assignmentApi.getRoute(assignment.id).then(r => {
      setRoute(r);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [assignment.id]);

  // Refresh route mỗi 30s nếu đang active
  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => {
      assignmentApi.getRoute(assignment.id).then(setRoute).catch(() => {});
    }, 30000);
    return () => clearInterval(timer);
  }, [isActive, assignment.id]);

  const routePoints: [number, number][] = route?.points.map(p => [p.lat, p.lng]) ?? [];
  const currentPos: [number, number] | null =
      isActive && (realtime?.lat ?? assignment.currentLat)
          ? [realtime?.lat ?? assignment.currentLat!, realtime?.lng ?? assignment.currentLng!]
          : null;

  // Tất cả bounds points
  const allPoints: [number, number][] = [
    ...routePoints,
    ...(currentPos ? [currentPos] : []),
    ...assignment.orders.map(o => [o.addressLat, o.addressLng] as [number, number]),
  ];

  // Tạo polyline segments với màu theo tốc độ
  const coloredSegments = route?.points.slice(1).map((point, i) => ({
    positions: [[route.points[i].lat, route.points[i].lng], [point.lat, point.lng]] as [number, number][],
    color: speedToColor(route.points[i].speedKmh),
  })) ?? [];

  return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {assignment.driverName}
              {isActive && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full animate-pulse">
                ● ĐANG CHẠY
              </span>
              )}
            </h2>
            <p className="text-sm text-gray-500">Chuyến #{assignment.id} • {assignment.orders.length} điểm giao</p>
          </div>
          <div className="flex items-center gap-2">
            {route && (
                <button
                    onClick={() => setShowSegments(!showSegments)}
                    className="text-sm px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                >
                  {showSegments ? 'Ẩn' : 'Xem'} chi tiết route
                </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1" style={{ minHeight: 0, position: 'relative' }}>
          {loading ? (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
                <div className="text-gray-500">Đang tải bản đồ...</div>
              </div>
          ) : (
              <MapContainer
                  center={currentPos ?? (routePoints[0] ?? [10.7769, 106.7009])}
                  zoom={13}
                  style={{ position: 'absolute', inset: 0, height: '100%', width: '100%' }}
                  zoomControl={true}
              >
                <TileLayer
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {allPoints.length > 0 && <FitBounds points={allPoints} />}

                {/* Route polyline với màu tốc độ */}
                {coloredSegments.map((seg, i) => (
                    <Polyline
                        key={i}
                        positions={seg.positions}
                        color={seg.color}
                        weight={2}
                        opacity={0.85}
                    />
                ))}

                {/* Nếu không có route chi tiết, vẽ đường thẳng qua các điểm giao */}
                {routePoints.length === 0 && assignment.orders.length > 1 && (
                    <Polyline
                        positions={assignment.orders.map(o => [o.addressLat, o.addressLng])}
                        color="#3b82f6"
                        weight={3}
                        dashArray="8,6"
                        opacity={0.6}
                    />
                )}

                {/* Marker điểm giao - luôn hiển thị kể cả khi completed */}
                {assignment.orders.map((order) => (
                    <Marker
                        key={order.id}
                        position={[order.addressLat, order.addressLng]}
                        icon={deliveryIcon(order.status === 'COMPLETED')}
                    >
                      <Popup>
                        <div className="min-w-48">
                          <p className="font-bold text-sm">{order.recipientName}</p>
                          <p className="text-xs text-gray-500">{order.recipientPhone}</p>
                          <p className="text-xs mt-1">{order.deliveryAddress}</p>
                          <p className="text-xs text-green-600 font-semibold mt-1">
                            {new Intl.NumberFormat('vi-VN').format(order.amountToCollect)}₫
                          </p>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                              order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                      {order.status === 'COMPLETED' ? '✓ Đã giao' : '⏳ Chờ giao'}
                    </span>
                        </div>
                      </Popup>
                    </Marker>
                ))}

                {/* Current position (đang active) - bỏ CircleMarker vì gây shift */}
                {currentPos && isActive && (
                    <Marker position={currentPos} icon={driverIcon}>
                      <Popup>
                        <div>
                          <p className="font-bold">{assignment.driverName}</p>
                          <p className="text-xs">🔋 {realtime?.battery ?? '-'}%</p>
                          <p className="text-xs">⚡ {realtime?.speed?.toFixed(1) ?? '-'} km/h</p>
                          <p className="text-xs">📍 {formatDistance(realtime?.totalKm ?? 0)} đã đi</p>
                        </div>
                      </Popup>
                    </Marker>
                )}

                {/* Start point */}
                {routePoints.length > 0 && (() => {
                  const startIcon = L.divIcon({
                    html: `<div style="width:14px;height:14px;border-radius:50%;background:#1A237E;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
                    className: '',
                    iconSize: [14, 14],
                    iconAnchor: [7, 7],
                  });
                  return (
                      <Marker position={routePoints[0]} icon={startIcon}>
                        <Popup>Điểm xuất phát</Popup>
                      </Marker>
                  );
                })()}
              </MapContainer>
          )}
        </div>

        {/* Route segments detail */}
        {showSegments && route && route.segments.length > 0 && (
            <div className="bg-white border-t p-4 max-h-52 overflow-y-auto">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Chi tiết lộ trình</h3>
              <div className="space-y-2">
                {route.segments.map((seg, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-500 truncate block text-xs">{seg.fromLabel}</span>
                        <span className="text-gray-400 text-xs">↓</span>
                        <span className="text-gray-700 truncate block text-xs">{seg.toLabel}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-blue-600">{formatDistance(seg.distanceKm)}</p>
                        <p className="text-gray-400 text-xs">{seg.durationMinutes} phút</p>
                      </div>
                    </div>
                ))}
                <div className="pt-2 border-t flex justify-between text-sm font-bold">
                  <span>Tổng cộng</span>
                  <span className="text-blue-600">
                {formatDistance(route.totalDistanceKm)} • {route.totalDurationMinutes} phút
              </span>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}