// src/components/drivers/DriverCard.tsx
import { Assignment } from '../../types';
import { useStore } from '../../services/store';
import { formatBytes, formatDistance, formatTimeAgo, getStatusColor, getStatusLabel, getBatteryIcon } from '../../utils';

interface Props {
  assignment: Assignment;
  onClick: () => void;
  onDelete?: (id: number) => void;  // thêm prop này
}

export function DriverCard({ assignment, onClick, onDelete }: Props) {
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
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 cursor-pointer transition-all duration-200 overflow-hidden"
    >
      {/* Top bar */}
      <div
        className="h-1.5"
        style={{ background: isActive ? getStatusColor(status) : isCompleted ? '#6b7280' : '#f59e0b' }}
      />

      <div className="p-4">
        {/* Driver info row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-sm"
              style={{ background: `linear-gradient(135deg, #1A237E, #3949AB)` }}
            >
              {assignment.driverName.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">{assignment.driverName}</p>
              <p className="text-xs text-gray-400">{assignment.driverPhone}</p>
            </div>
          </div>

          {/* Status badge */}
          {isActive ? (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{
                background: `${getStatusColor(status)}20`,
                color: getStatusColor(status),
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: getStatusColor(status) }} />
              {getStatusLabel(status)}
            </div>
          ) : isCompleted ? (
            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
              Hoàn thành
            </span>
          ) : (
            <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">
              Chờ
            </span>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <StatBox
            label="Quãng đường"
            value={formatDistance(totalKm)}
            icon="📍"
          />
          <StatBox
            label="Băng thông"
            value={formatBytes(totalBytes)}
            icon="📶"
          />
          {isActive && battery > 0 && (
            <StatBox
              label="Pin còn"
              value={`${battery}%`}
              icon={getBatteryIcon(battery)}
              valueColor={battery > 20 ? undefined : 'text-red-600'}
            />
          )}
          {batteryUsed != null && (
            <StatBox
              label={isCompleted ? 'Pin đã dùng' : 'Pin dùng'}
              value={`${batteryUsed}%`}
              icon="🔋"
            />
          )}
        </div>

        {/* Orders progress */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Tiến độ giao hàng</span>
            <span>{assignment.orders.filter(o => o.status === 'COMPLETED').length}/{assignment.orders.length} đơn</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(assignment.orders.filter(o => o.status === 'COMPLETED').length / Math.max(assignment.orders.length, 1)) * 100}%`,
                background: 'linear-gradient(90deg, #1A237E, #3949AB)',
              }}
            />
          </div>
        </div>

        {/* Nút xóa - chỉ hiện khi PENDING */}
        {assignment.status === 'PENDING' && onDelete && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <button
                  onClick={(e) => {
                    e.stopPropagation(); // không mở modal detail
                    onDelete(assignment.id);
                  }}
                  className="w-full text-xs text-red-500 hover:text-red-700 hover:bg-red-50 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <span>🗑</span> Xóa chuyến này
              </button>
            </div>
        )}

        {/* Last ping */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Chuyến #{assignment.id}</span>
          {isActive && (
            <span>Cập nhật {formatTimeAgo(assignment.lastPingAt)}</span>
          )}
          {isCompleted && assignment.completedAt && (
            <span>Xong lúc {new Date(assignment.completedAt).toLocaleTimeString('vi-VN')}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({
  label, value, icon, valueColor,
}: {
  label: string;
  value: string;
  icon: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-2.5">
      <p className="text-xs text-gray-400 mb-0.5">{icon} {label}</p>
      <p className={`text-sm font-bold ${valueColor ?? 'text-gray-700'}`}>{value}</p>
    </div>
  );
}
