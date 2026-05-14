// src/pages/DashboardPage.tsx
import { useEffect, useState, useRef } from 'react';
import { Assignment, User, OptimalPath } from '../types';
import { assignmentApi, driversApi } from '../services/api';
import { useStore } from '../services/store';
import { useAdminWebSocket } from '../hooks/useWebSocket';
import { DriverDetailModal } from '../components/modals/DriverDetailModal';
import { CreateAssignmentModal } from '../components/modals/CreateAssignmentModal';
import { CreateDriverModal } from '../components/modals/CreateDriverModal';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Plus, RefreshCw, Wifi, WifiOff, UserPlus, ChevronRight, X } from 'lucide-react';
import { getStatusColor, formatDate } from '../utils';

const DRIVER_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
const getDriverColor = (idx: number) => DRIVER_COLORS[idx % DRIVER_COLORS.length];

// ─── Assignment Picker Modal ───────────────────────────────────────────────────
function AssignmentPickerModal({ driver, assignments, onSelect, onClose, driverColor, loading }: {
  driver: User;
  assignments: Assignment[];
  onSelect: (a: Assignment) => void;
  onClose: () => void;
  driverColor: string;
  loading?: boolean;
}) {
  const groups = [
    { title: 'Đang chạy', icon: '🟢', items: assignments.filter(a => a.status === 'ACTIVE') },
    { title: 'Chờ bắt đầu', icon: '🟡', items: assignments.filter(a => a.status === 'PENDING') },
    { title: 'Đã hoàn thành', icon: '✅', items: assignments.filter(a => a.status === 'COMPLETED') },
  ];

  return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
          <div className="p-5 border-b flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                 style={{ background: driverColor }}>
              {driver.fullName.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-gray-800">Chuyến của {driver.fullName}</h2>
              <p className="text-xs text-gray-400">Chọn chuyến để xem chi tiết</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-sm animate-pulse">Đang tải...</p>
                </div>
            ) : assignments.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <div className="text-4xl mb-2">📭</div>
                  <p>Chưa có chuyến nào</p>
                </div>
            ) : (
                groups.map(g => g.items.length > 0 && (
                    <div key={g.title} className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{g.icon} {g.title}</p>
                      {g.items.map(a => (
                          <div key={a.id} onClick={() => { onSelect(a); onClose(); }}
                               className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 cursor-pointer mb-2 transition-all">
                            <div>
                              <p className="text-sm font-semibold">Chuyến #{a.id}</p>
                              <p className="text-xs text-gray-400">{a.orders.length} điểm · {formatDate(a.createdAt)}</p>
                              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                                {a.orders.map(o => o.deliveryAddress).join(' → ')}
                              </p>
                            </div>
                            <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                          </div>
                      ))}
                    </div>
                ))
            )}
          </div>
        </div>
      </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { assignments, setAssignments, wsConnected, driverRealtime } = useStore();
  const [drivers, setDrivers] = useState<User[]>([]);
  const [selectedAssignment, setSelected] = useState<Assignment | null>(null);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [showCreateDriver, setShowCreateDriver] = useState(false);
  const [loading, setLoading] = useState(false);

  // Driver picker state
  const [showPickerForDriver, setShowPickerForDriver] = useState<User | null>(null);
  const [driverAssignments, setDriverAssignments] = useState<Assignment[]>([]);
  const [loadingDriverAssignments, setLoadingDriverAssignments] = useState(false);
  const [optimalPaths, setOptimalPaths] = useState<Record<number, OptimalPath>>({});

  useAdminWebSocket();

  const loadData = async () => {
    setLoading(true);
    try {
      const [assignmentsData, driversData] = await Promise.all([
        assignmentApi.getAll(),
        driversApi.getAll(),
      ]);
      setAssignments(assignmentsData);
      setDrivers(driversData);

      // Fetch optimal path cho tất cả ACTIVE assignments
      const active = assignmentsData.filter(a => a.status === 'ACTIVE');
      const paths = await Promise.all(
          active.map(a => assignmentApi.getOptimalPath(a.id).catch(() => null))
      );
      const pathMap: Record<number, OptimalPath> = {};
      active.forEach((a, i) => { if (paths[i]) pathMap[a.id] = paths[i]!; });
      setOptimalPaths(pathMap);
    } catch (e) {
      console.error('Load failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleClickDriver = async (driver: User) => {
    setShowPickerForDriver(driver);
    setLoadingDriverAssignments(true);
    try {
      const data = await assignmentApi.getByDriver(driver.id);
      setDriverAssignments(data);
    } catch {
      setDriverAssignments([]);
    } finally {
      setLoadingDriverAssignments(false);
    }
  };

  const activeAssignments = assignments.filter(a => a.status === 'ACTIVE');

  const driverColorMap: Record<number, string> = {};
  drivers.forEach((d, i) => { driverColorMap[d.id] = getDriverColor(i); });

  return (
      <div className="min-h-screen bg-gray-50">
        {/* Navbar */}
        <nav className="bg-[#1A237E] text-white px-6 py-4 shadow-lg">
          <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl">🚚</div>
              <div>
                <h1 className="text-lg font-bold tracking-wide">DELIVERY ADMIN</h1>
                <p className="text-white/60 text-xs">Quản lý giao hàng realtime</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                  wsConnected ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
              }`}>
                {wsConnected ? <><Wifi size={13} /> Realtime ON</> : <><WifiOff size={13} /> Kết nối...</>}
              </div>
              <button onClick={loadData} disabled={loading}
                      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl text-sm">
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
              <button onClick={() => setShowCreateDriver(true)}
                      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm border border-white/20">
                <UserPlus size={15} /> Thêm tài xế
              </button>
              <button onClick={() => setShowCreateAssignment(true)}
                      className="flex items-center gap-2 bg-white text-[#1A237E] hover:bg-blue-50 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm">
                <Plus size={15} /> Tạo chuyến giao
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-screen-2xl mx-auto px-6 py-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Tất cả', count: assignments.length, color: 'bg-slate-700' },
              { label: 'Đang giao', count: activeAssignments.length, color: 'bg-blue-900', pulse: activeAssignments.length > 0 },
              { label: 'Chờ giao', count: assignments.filter(a => a.status === 'PENDING').length, color: 'bg-amber-600' },
              { label: 'Hoàn thành', count: assignments.filter(a => a.status === 'COMPLETED').length, color: 'bg-green-700' },
            ].map(item => (
                <div key={item.label} className={`${item.color} text-white rounded-xl p-4 shadow-sm`}>
                  <div className="flex items-center justify-between">
                    <p className="text-white/70 text-sm">{item.label}</p>
                    {item.pulse && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
                  </div>
                  <p className="text-3xl font-bold mt-1">{item.count}</p>
                </div>
            ))}
          </div>

          {/* Main layout */}
          <div className="flex gap-6">
            {/* Left: Danh sách tài xế */}
            <div className="w-80 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-700 text-sm">Tài xế ({drivers.length})</h2>
                <button onClick={() => setShowCreateDriver(true)}
                        className="flex items-center gap-1 text-xs text-blue-900 hover:underline">
                  <UserPlus size={12} /> Thêm
                </button>
              </div>

              <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
                {drivers.map((driver, idx) => {
                  const color = getDriverColor(idx);
                  const isActive = assignments.some(a => a.driverId === driver.id && a.status === 'ACTIVE');
                  const pendingCount = assignments.filter(a => a.driverId === driver.id && a.status === 'PENDING').length;

                  return (
                      <div key={driver.id} onClick={() => handleClickDriver(driver)}
                           className="bg-white rounded-xl border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                             style={{ background: color }}>
                          {driver.fullName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm truncate">{driver.fullName}</p>
                          <p className="text-xs text-gray-400">{driver.phone || '@' + driver.username}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {isActive
                              ? <span className="text-xs px-2 py-0.5 rounded-full font-medium animate-pulse"
                                      style={{ background: color + '20', color }}>● Đang giao</span>
                              : pendingCount > 0
                                  ? <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{pendingCount} chờ</span>
                                  : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Rảnh</span>
                          }
                          <ChevronRight size={14} className="text-gray-300" />
                        </div>
                      </div>
                  );
                })}

                {drivers.length === 0 && (
                    <div className="text-center py-10 text-gray-400">
                      <div className="text-4xl mb-2">👤</div>
                      <p className="text-sm">Chưa có tài xế</p>
                    </div>
                )}
              </div>

              <button onClick={() => setShowCreateAssignment(true)}
                      className="mt-3 w-full flex items-center justify-center gap-2 bg-[#1A237E] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#283593]">
                <Plus size={15} /> Tạo chuyến giao
              </button>
            </div>

            {/* Right: Map - GIỮ NGUYÊN 100% từ file gốc */}
            <div className="flex-1 bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 260px)' }}>
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <h3 className="font-bold text-gray-700">Bản đồ realtime</h3>
                <span className="text-xs text-gray-400">{activeAssignments.length} tài xế đang chạy</span>
              </div>
              <MapContainer center={[10.7769, 106.7009]} zoom={12} style={{ height: 'calc(100% - 49px)', width: '100%' }}>
                <TileLayer
                    attribution='© OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {activeAssignments.map(a => {
                  const rt = driverRealtime[a.driverId];
                  const lat = rt?.lat ?? a.currentLat;
                  const lng = rt?.lng ?? a.currentLng;
                  const color = driverColorMap[a.driverId] ?? '#1A237E';
                  const path = optimalPaths[a.id];

                  return (
                      <div key={a.id}>
                        {/* Delivery point markers */}
                        {a.orders.map((order, i) => {
                          const isDone = order.status === 'COMPLETED';
                          const seqStop = path?.stops.find((s: any) => s.orderId === order.id);
                          const seq = seqStop?.sequence ?? (i + 1);
                          const icon = L.divIcon({
                            html: `<div style="position:relative;width:26px;height:36px;">
                          <svg viewBox="0 0 24 32" width="26" height="36" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8z"
                              fill="${isDone ? '#9ca3af' : color}" stroke="white" stroke-width="1.5" opacity="${isDone ? 0.5 : 1}"/>
                            <text x="12" y="11" text-anchor="middle" fill="white" font-size="${isDone ? 9 : 8}" font-weight="bold">${isDone ? '✓' : seq}</text>
                          </svg>
                        </div>`,
                            className: '', iconSize: [26, 36], iconAnchor: [13, 36], popupAnchor: [0, -36],
                          });
                          return (
                              <Marker key={order.id} position={[order.addressLat, order.addressLng]} icon={icon}>
                                <Popup>
                                  <p className="font-bold text-xs">{order.recipientName}</p>
                                  <p className="text-xs text-gray-500">{a.driverName}</p>
                                  <p className="text-xs">{order.deliveryAddress}</p>
                                </Popup>
                              </Marker>
                          );
                        })}

                        {/* Optimal path dashed lines */}
                        {lat && lng && path && (() => {
                          const pendingStops = path.stops
                              .filter((s: any) => !s.completed)
                              .sort((a: any, b: any) => a.sequence - b.sequence);
                          if (pendingStops.length === 0) return null;
                          const pts: [number, number][] = [
                            [lat, lng],
                            ...pendingStops.map((s: any) => [s.lat, s.lng] as [number, number]),
                          ];
                          return pts.slice(1).map((pt, i) => (
                              <Polyline key={`path-${a.id}-${i}`}
                                        positions={[pts[i], pt]}
                                        color={color} weight={2} dashArray="8,6" opacity={0.7}
                              />
                          ));
                        })()}

                        {/* Driver marker */}
                        {lat && lng && (() => {
                          const icon = L.divIcon({
                            html: `<div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#1A237E,#3949AB);border:3px solid ${color};box-shadow:0 2px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;">🚚</div>
                        <div style="position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);white-space:nowrap;background:rgba(0,0,0,0.75);color:white;padding:2px 6px;border-radius:4px;font-size:10px;">${a.driverName.split(' ').slice(-1)[0]}</div>`,
                            className: '', iconSize: [38, 58], iconAnchor: [19, 19],
                          });
                          return (
                              <Marker position={[lat, lng]} icon={icon} eventHandlers={{ click: () => setSelected(a) }}>
                                <Popup>
                                  <div className="min-w-40">
                                    <p className="font-bold text-sm">{a.driverName}</p>
                                    <p className="text-xs">🔋 {rt?.battery ?? '-'}%</p>
                                    <p className="text-xs">⚡ {rt?.speed?.toFixed(0) ?? '-'} km/h</p>
                                    {path && <p className="text-xs text-blue-600">~{path.totalEstimatedKm}km còn lại</p>}
                                    <button onClick={() => setSelected(a)} className="mt-2 text-xs text-blue-600 underline">Xem chi tiết →</button>
                                  </div>
                                </Popup>
                              </Marker>
                          );
                        })()}
                      </div>
                  );
                })}
              </MapContainer>
            </div>
          </div>
        </div>

        {/* Modals */}
        {selectedAssignment && (
            <DriverDetailModal assignment={selectedAssignment} onClose={() => setSelected(null)} />
        )}
        {showPickerForDriver && (
            <AssignmentPickerModal
                driver={showPickerForDriver}
                assignments={driverAssignments}
                driverColor={driverColorMap[showPickerForDriver.id] ?? '#1A237E'}
                onSelect={setSelected}
                onClose={() => setShowPickerForDriver(null)}
                loading={loadingDriverAssignments}
            />
        )}
        {showCreateAssignment && (
            <CreateAssignmentModal drivers={drivers} onClose={() => setShowCreateAssignment(false)} onCreated={loadData} />
        )}
        {showCreateDriver && (
            <CreateDriverModal onClose={() => setShowCreateDriver(false)} onCreated={loadData} />
        )}
      </div>
  );
}