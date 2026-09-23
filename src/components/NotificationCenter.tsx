import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  BellRing,
  AlertTriangle,
  Clock,
  CheckCircle,
  X,
  ExternalLink,
  Volume2,
  ShieldAlert,
} from 'lucide-react';
import { TaskDocument } from '../types';
import {
  getNotificationPermission,
  requestNotificationPermission,
  getNearDueTasks,
  checkAndNotifyNearDueTasks,
  NotificationStatus,
} from '../utils/notificationService';

interface NotificationCenterProps {
  tasks: TaskDocument[];
  onSelectTask?: (task: TaskDocument) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  tasks,
  onSelectTask,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationStatus>(getNotificationPermission());
  const [lastScanMessage, setLastScanMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const urgentList = getNearDueTasks(tasks);
  const urgentCount = urgentList.length;

  // Sync permission state
  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  // Auto-scan on load or when tasks change if permission is granted
  useEffect(() => {
    if (permission === 'granted' && urgentCount > 0) {
      checkAndNotifyNearDueTasks(tasks, false);
    }
  }, [tasks, permission, urgentCount]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      const { notifiedCount } = checkAndNotifyNearDueTasks(tasks, true);
      setLastScanMessage(`Đã bật thông báo! Đã phát ${notifiedCount} cảnh báo.`);
    } else if (result === 'denied') {
      alert('Bạn đã từ chối nhận thông báo. Để bật lại, hãy nhấn vào biểu tượng ổ khóa/cài đặt trên thanh địa chỉ trình duyệt.');
    }
  };

  const handleManualScan = () => {
    if (permission !== 'granted') {
      handleRequestPermission();
      return;
    }
    const { notifiedCount } = checkAndNotifyNearDueTasks(tasks, true);
    setLastScanMessage(
      notifiedCount > 0
        ? `Đã gửi ${notifiedCount} thông báo đẩy đến trình duyệt!`
        : 'Không có văn bản nào cần gửi thông báo đẩy lúc này.'
    );
    setTimeout(() => setLastScanMessage(null), 5000);
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition cursor-pointer"
        title="Thông báo văn bản đến hạn (<= 1 ngày)"
      >
        {urgentCount > 0 ? (
          <BellRing className="w-5 h-5 text-amber-300 animate-bounce" />
        ) : (
          <Bell className="w-5 h-5 text-white/90" />
        )}

        {/* Badge Count */}
        {urgentCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[11px] font-bold h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center border-2 border-[#005BAB] shadow-md animate-pulse">
            {urgentCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="bg-[#005BAB] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BellRing className="w-4 h-4 text-amber-300" />
              <h3 className="text-sm font-bold tracking-tight">Đôn đốc văn bản cận hạn</h3>
            </div>
            <span className="text-[11px] font-semibold bg-white/20 px-2 py-0.5 rounded-full">
              {urgentCount} văn bản
            </span>
          </div>

          {/* Browser Permission Control Banner */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
                <Volume2 className="w-3.5 h-3.5 text-[#005BAB]" />
                <span>Thông báo đẩy trình duyệt:</span>
              </span>
              {permission === 'granted' ? (
                <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold text-[11px] bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  <span>Đã bật</span>
                </span>
              ) : permission === 'denied' ? (
                <span className="inline-flex items-center space-x-1 text-red-700 font-bold text-[11px] bg-red-100 px-2 py-0.5 rounded-full">
                  <ShieldAlert className="w-3 h-3" />
                  <span>Bị chặn</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 text-amber-700 font-bold text-[11px] bg-amber-100 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" />
                  <span>Chưa bật</span>
                </span>
              )}
            </div>

            {permission !== 'granted' ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-800 space-y-2">
                <p className="leading-snug text-[11px]">
                  Bật quyền thông báo để trình duyệt tự động gửi cảnh báo popup trên màn hình máy tính khi văn bản còn ≤ 1 ngày.
                </p>
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="w-full py-1.5 bg-[#005BAB] hover:bg-[#004885] text-white font-semibold rounded-lg text-xs shadow-sm transition active:scale-95"
                >
                  Bật thông báo ngay
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  Tự động gửi cảnh báo khi còn ≤ 1 ngày
                </span>
                <button
                  type="button"
                  onClick={handleManualScan}
                  className="text-xs text-[#005BAB] hover:underline font-semibold flex items-center space-x-1"
                >
                  <span>Báo nhắc lại ngay</span>
                </button>
              </div>
            )}

            {lastScanMessage && (
              <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-1.5 text-center font-medium">
                {lastScanMessage}
              </div>
            )}
          </div>

          {/* List of Urgent Tasks */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 p-1">
            {urgentList.length === 0 ? (
              <div className="p-6 text-center text-slate-500 space-y-1">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">Tất cả tiến độ đều an toàn</p>
                <p className="text-[11px] text-slate-400">
                  Hiện tại không có văn bản nào cận hạn (≤ 1 ngày) hoặc quá hạn.
                </p>
              </div>
            ) : (
              urgentList.map(({ task, daysRemaining }) => {
                const isOverdue = daysRemaining < 0;
                const isDueToday = daysRemaining === 0;

                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      if (onSelectTask) {
                        onSelectTask(task);
                        setIsOpen(false);
                      }
                    }}
                    className="p-3 hover:bg-slate-50 transition cursor-pointer rounded-xl group space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#005BAB] group-hover:underline">
                        {task.docNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isOverdue
                            ? 'bg-red-100 text-red-700 border border-red-200 animate-pulse'
                            : isDueToday
                            ? 'bg-orange-100 text-orange-700 border border-orange-200'
                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isOverdue
                          ? `Quá hạn ${Math.abs(daysRemaining)} ngày`
                          : isDueToday
                          ? 'Hạn hôm nay'
                          : 'Còn 1 ngày'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                      {task.title}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span>CBKT: <strong className="text-slate-700">{task.assignee || 'Chưa phân công'}</strong></span>
                      <span>Hạn: <strong className="text-slate-700">{task.dueDate}</strong></span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {urgentCount > 0 && (
            <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
              <span className="text-[11px] text-slate-500">
                Hãy nhắc nhở chuyên viên kỹ thuật hoàn thành đúng thời hạn giao.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
