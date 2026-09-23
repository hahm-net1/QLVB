import React from 'react';
import { TaskDocument } from '../types';
import { calculateDaysRemaining } from '../utils/taskUtils';
import { FileStack, Clock, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';

interface DashboardStatsProps {
  tasks: TaskDocument[];
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  tasks,
  selectedFilter,
  onSelectFilter,
}) => {
  const total = tasks.length;
  const inProgress = tasks.filter((t) => t.status === 'Đang thực hiện').length;
  const completed = tasks.filter((t) => t.status === 'Hoàn thành').length;

  const urgentOrOverdue = tasks.filter((t) => {
    if (t.status === 'Hoàn thành') return false;
    const days = calculateDaysRemaining(t.dueDate);
    return days <= 1; // Quá hạn hoặc còn <= 1 ngày
  }).length;

  const warning3Days = tasks.filter((t) => {
    if (t.status === 'Hoàn thành') return false;
    const days = calculateDaysRemaining(t.dueDate);
    return days > 1 && days <= 3;
  }).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-4 sm:my-6">
      {/* Total Card */}
      <div
        onClick={() => onSelectFilter('all')}
        className={`bg-white rounded-xl p-4 border shadow-sm cursor-pointer transition-all hover:shadow-md ${
          selectedFilter === 'all' ? 'border-[#005BAB] ring-2 ring-[#005BAB]/20' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-slate-500">Tổng văn bản giao</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{total}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#005BAB]">
            <FileStack className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center">
          <Activity className="w-3.5 h-3.5 mr-1 text-blue-500" />
          <span>Đang theo dõi toàn hệ thống</span>
        </div>
      </div>

      {/* In Progress Card */}
      <div
        onClick={() => onSelectFilter('inprogress')}
        className={`bg-white rounded-xl p-4 border shadow-sm cursor-pointer transition-all hover:shadow-md ${
          selectedFilter === 'inprogress' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-slate-500">Đang thực hiện</p>
            <h3 className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">{inProgress}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center">
          <span>Đang triển khai kỹ thuật</span>
        </div>
      </div>

      {/* Completed Card */}
      <div
        onClick={() => onSelectFilter('completed')}
        className={`bg-white rounded-xl p-4 border shadow-sm cursor-pointer transition-all hover:shadow-md ${
          selectedFilter === 'completed' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-slate-500">Đã hoàn thành</p>
            <h3 className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">{completed}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center">
          <span>Đã nghiệm thu / báo cáo</span>
        </div>
      </div>

      {/* Urgent / Overdue Card */}
      <div
        onClick={() => onSelectFilter('urgent')}
        className={`bg-white rounded-xl p-4 border shadow-sm cursor-pointer transition-all hover:shadow-md ${
          selectedFilter === 'urgent' ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-slate-500">Cảnh báo hạn (≤ 1 ngày / Quá)</p>
            <h3 className="text-xl sm:text-2xl font-bold text-red-600 mt-1">{urgentOrOverdue}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 text-xs text-red-600 font-medium flex items-center">
          <span>Cần đôn đốc gấp ({warning3Days} sắp tới hạn 3 ngày)</span>
        </div>
      </div>
    </div>
  );
};
