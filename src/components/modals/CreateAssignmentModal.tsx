// src/components/modals/CreateAssignmentModal.tsx
import { useState } from 'react';
import { User, CreateAssignmentForm, OrderFormItem } from '../../types';
import { assignmentApi } from '../../services/api';
import { useStore } from '../../services/store';
import { X, Plus, Trash2, MapPin } from 'lucide-react';

interface Props {
  drivers: User[];
  onClose: () => void;
  onCreated: () => void;
}

const emptyOrder = (): OrderFormItem => ({
  recipientName: '',
  recipientPhone: '',
  deliveryAddress: '',
  addressLat: '',
  addressLng: '',
  orderNote: '',
  amountToCollect: '',
});

export function CreateAssignmentModal({ drivers, onClose, onCreated }: Props) {
  const [form, setForm] = useState<CreateAssignmentForm>({
    driverId: '',
    orders: [emptyOrder()],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateOrder = (i: number, field: keyof OrderFormItem, value: string) => {
    setForm(prev => ({
      ...prev,
      orders: prev.orders.map((o, idx) => idx === i ? { ...o, [field]: value } : o),
    }));
  };

  const addOrder = () => setForm(prev => ({ ...prev, orders: [...prev.orders, emptyOrder()] }));

  const removeOrder = (i: number) =>
      setForm(prev => ({ ...prev, orders: prev.orders.filter((_, idx) => idx !== i) }));

  const handleSubmit = async () => {
    if (!form.driverId) { setError('Chọn tài xế'); return; }
    if (form.orders.some(o => !o.recipientName || !o.deliveryAddress)) {
      setError('Điền đầy đủ thông tin người nhận và địa chỉ');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await assignmentApi.create(form);
      onCreated();
      onClose();
    } catch (e) {
      setError('Tạo chuyến thất bại. Thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Tạo chuyến giao hàng</h2>
              <p className="text-sm text-gray-500">Assign tài xế và thêm các điểm giao</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Driver select */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tài xế *</label>
              <select
                  value={form.driverId}
                  onChange={e => setForm(prev => ({ ...prev, driverId: e.target.value }))}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Chọn tài xế --</option>
                {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.fullName} ({d.phone})</option>
                ))}
              </select>
            </div>

            {/* Orders */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-700">
                  Điểm giao hàng ({form.orders.length} điểm)
                </label>
                <button
                    onClick={addOrder}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus size={16} /> Thêm điểm
                </button>
              </div>

              <div className="space-y-4">
                {form.orders.map((order, i) => (
                    <div key={i} className="border rounded-xl p-4 relative">
                      <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      Điểm {i + 1}
                    </span>
                        {form.orders.length > 1 && (
                            <button onClick={() => removeOrder(i)} className="text-red-400 hover:text-red-600">
                              <Trash2 size={16} />
                            </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500">Tên người nhận *</label>
                          <input
                              value={order.recipientName}
                              onChange={e => updateOrder(i, 'recipientName', e.target.value)}
                              placeholder="Nguyễn Văn A"
                              className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Số điện thoại</label>
                          <input
                              value={order.recipientPhone}
                              onChange={e => updateOrder(i, 'recipientPhone', e.target.value)}
                              placeholder="0901234567"
                              className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin size={12} /> Địa chỉ giao *
                          </label>
                          <input
                              value={order.deliveryAddress}
                              onChange={e => updateOrder(i, 'deliveryAddress', e.target.value)}
                              placeholder="123 Đường ABC, Quận 1, TP.HCM"
                              className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-gray-500 flex items-center gap-1">
                            📍 Tọa độ (paste từ Google Maps)
                          </label>
                          <input
                              placeholder="10.963159, 106.843042"
                              className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onChange={e => {
                                const val = e.target.value.trim();
                                // Parse "lat, lng" hoặc "lat,lng"
                                const parts = val.split(',').map(s => s.trim());
                                if (parts.length === 2) {
                                  updateOrder(i, 'addressLat', parts[0]);
                                  updateOrder(i, 'addressLng', parts[1]);
                                }
                              }}
                              defaultValue={order.addressLat && order.addressLng ? `${order.addressLat}, ${order.addressLng}` : ''}
                          />
                          {order.addressLat && order.addressLng && (
                              <p className="text-xs text-green-600 mt-1">
                                ✓ {parseFloat(order.addressLat).toFixed(6)}, {parseFloat(order.addressLng).toFixed(6)}
                              </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Số tiền COD (₫)</label>
                          <input
                              value={order.amountToCollect}
                              onChange={e => updateOrder(i, 'amountToCollect', e.target.value)}
                              placeholder="150000"
                              type="number"
                              className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Ghi chú</label>
                          <input
                              value={order.orderNote}
                              onChange={e => updateOrder(i, 'orderNote', e.target.value)}
                              placeholder="Gọi trước khi giao..."
                              className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                  {error}
                </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t">
            <button onClick={onClose} className="px-6 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">
              Huỷ
            </button>
            <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 text-sm font-semibold bg-blue-900 text-white rounded-xl hover:bg-blue-800 disabled:opacity-50"
            >
              {loading ? 'Đang tạo...' : 'Tạo chuyến giao'}
            </button>
          </div>
        </div>
      </div>
  );
}