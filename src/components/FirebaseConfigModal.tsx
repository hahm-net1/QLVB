import React from 'react';
import { X, Cloud, CheckCircle2, Smartphone, Monitor, ShieldCheck, Database } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFirebaseActive: boolean;
  onToggleFirebase?: (enabled: boolean) => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({
  isOpen,
  onClose,
  isFirebaseActive,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#005BAB] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Cloud className="w-5 h-5 text-emerald-300" />
            <h2 className="text-base sm:text-lg font-bold">Đồng bộ Đám mây (Firebase Firestore)</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-slate-800">
          {/* Status Box */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-emerald-900 text-sm">
                Đám mây đã được kích hoạt & Đồng bộ thời gian thực
              </p>
              <p className="text-emerald-700 leading-relaxed">
                Mọi dữ liệu văn bản, giao việc và ghi chú tiến độ được tự động lưu lên Firestore Cloud.
                Bạn có thể mở đồng thời trên <strong>Máy tính</strong> và <strong>Điện thoại</strong> để xem dữ liệu cập nhật tức thì.
              </p>
            </div>
          </div>

          {/* Sync Architecture Illustration */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Mô hình đồng bộ đa thiết bị:
            </p>
            <div className="flex items-center justify-around text-center py-2 bg-white rounded-lg border border-slate-200">
              <div className="flex flex-col items-center">
                <Monitor className="w-6 h-6 text-blue-600 mb-1" />
                <span className="text-[11px] font-medium text-slate-700">Máy tính (Web)</span>
              </div>
              <div className="flex flex-col items-center">
                <Cloud className="w-6 h-6 text-emerald-500 mb-1 animate-pulse" />
                <span className="text-[11px] font-semibold text-emerald-700">Firestore Cloud</span>
              </div>
              <div className="flex flex-col items-center">
                <Smartphone className="w-6 h-6 text-blue-600 mb-1" />
                <span className="text-[11px] font-medium text-slate-700">Điện thoại di động</span>
              </div>
            </div>
          </div>

          {/* Technical Info */}
          <div className="text-xs space-y-1.5 bg-slate-50 rounded-xl p-3 border border-slate-200 font-mono text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Project ID:</span>
              <span className="font-semibold text-slate-700">{firebaseConfig.projectId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Database ID:</span>
              <span className="font-semibold text-slate-700 truncate max-w-[200px]">
                {firebaseConfig.firestoreDatabaseId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Trạng thái kết nối:</span>
              <span className="font-semibold text-emerald-600">Trực tuyến (Real-time active)</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-[#005BAB] hover:bg-[#004a8b] text-white font-semibold rounded-xl text-sm transition shadow cursor-pointer"
            >
              Đã hiểu & Đóng cửa sổ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
