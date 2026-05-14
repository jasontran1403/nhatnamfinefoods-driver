// src/components/modals/DriverDetailModal.tsx
import { Assignment } from '../../types';
import { useStore } from '../../services/store';
import { DriverMap } from '../map/DriverMap';
import { formatBytes, formatDistance, formatDate, getStatusColor, getStatusLabel } from '../../utils';

interface Props {
  assignment: Assignment;
  onClose: () => void;
}

export function DriverDetailModal({ assignment, onClose }: Props) {
  const { driverRealtime } = useStore();
  const realtime = driverRealtime[assignment.driverId];
  const isActive = assignment.status === 'ACTIVE';
  const isCompleted = assignment.status === 'COMPLETED';

  const status = realtime?.status ?? assignment.driverStatus;
  const battery = realtime?.battery ?? 0;
  const totalKm = realtime?.totalKm ?? assignment.totalDistanceKm;
  const totalBytes = realtime?.totalBytes ?? assignment.totalBandwidthBytes;
  const batteryUsed = assignment.batteryStart != null
      ? assignment.batteryStart - (assignment.batteryEnd ?? battery)
      : null;

  return (
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <div className="flex-1 bg-black/40" onClick={onClose} />

        {/* Panel */}
        <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col">
          {/* Status header */}
          <div
              className="px-6 py-4 text-white"
              style={{
                background: isActive
                    ? `linear-gradient(135deg, #1A237E, #3949AB)`
                    : isCompleted
                        ? `linear-gradient(135deg, #374151, #6b7280)`
                        : `linear-gradient(135deg, #d97706, #f59e0b)`,
              }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{assignment.driverName}</h2>
                <p className="text-white/70 text-sm">{assignment.driverPhone}</p>
              </div>
              <button onClick={onClose} className="text-white/70 hover:text-white text-2xl">✕</button>
            </div>

            {isActive && (
                <div className="mt-3 flex items-center gap-2">
              <span
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: `${getStatusColor(status)}30`, color: '#fff' }}
              >
                ● {getStatusLabel(status)}
              </span>
                  <span className="text-white/60 text-xs">
                Cập nhật: {assignment.lastPingAt ? new Date(assignment.lastPingAt).toLocaleTimeString('vi-VN') : '-'}
              </span>
                </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 divide-x border-b">
            <StatCell label="Quãng đường" value={formatDistance(totalKm)} />
            <StatCell label="Băng thông" value={formatBytes(totalBytes)} />
            {isActive
                ? <StatCell label="Pin còn" value={`${battery}%`} warn={battery < 20} />
                : <StatCell label="Pin dùng" value={batteryUsed != null ? `${batteryUsed}%` : '-'} />
            }
            <StatCell
                label="Đơn hàng"
                value={`${assignment.orders.filter(o => o.status === 'COMPLETED').length}/${assignment.orders.length}`}
            />
          </div>

          {/* Map - chiếm phần lớn không gian */}
          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            <DriverMap assignment={assignment} onClose={onClose} />
          </div>

          {/* Completed summary */}
          {isCompleted && (
              <div className="border-t p-4 bg-gray-50">
                <h3 className="text-sm font-bold text-gray-700 mb-2">Tổng kết chuyến</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Bắt đầu</p>
                    <p className="font-medium">{formatDate(assignment.startedAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Kết thúc</p>
                    <p className="font-medium">{formatDate(assignment.completedAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Pin từ {assignment.batteryStart}% → {assignment.batteryEnd}%</p>
                    <p className="font-medium text-orange-600">Đã dùng {batteryUsed}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Dữ liệu đã dùng</p>
                    <p className="font-medium">{formatBytes(totalBytes)}</p>
                  </div>
                </div>
              </div>
          )}
        </div>
      </div>
  );
}

function StatCell({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
      <div className="py-3 px-4 text-center">
        <p className="text-xs text-gray-400">{label}</p>
        <p className={`text-base font-bold ${warn ? 'text-red-600' : 'text-gray-800'}`}>{value}</p>
      </div>
  );
}