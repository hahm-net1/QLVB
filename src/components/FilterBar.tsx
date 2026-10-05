import React from 'react';
import { Search, Table, Calendar, RefreshCw } from 'lucide-react';
import { FilterState } from '../types';

interface FilterBarProps {
  filterState: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  assignees: string[];
  onResetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filterState,
  onFilterChange,
  assignees,
  onResetFilters,
}) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-6 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3">
      {/* Search Input */}
      <div className="relative flex-1">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={filterState.searchQuery}
          onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
          placeholder="Tìm kiếm theo số văn bản, trích yếu, nội dung..."
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30 focus:border-[#005BAB]"
        />
      </div>

      {/* Select Filters & View Mode */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status Filter */}
        <select
          value={filterState.status}
          onChange={(e) => onFilterChange({ status: e.target.value })}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="Đang thực hiện">Đang thực hiện</option>
          <option value="Hoàn thành">Hoàn thành</option>
          <option value="Tạm dừng">Tạm dừng</option>
          <option value="Chờ duyệt">Chờ duyệt</option>
        </select>

        {/* Assignee Filter */}
        <select
          value={filterState.assignee}
          onChange={(e) => onFilterChange({ assignee: e.target.value })}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30 max-w-[180px] truncate"
        >
          <option value="all">Tất cả CBKT phụ trách</option>
          {assignees.map((item, idx) => (
            <option key={idx} value={item}>
              {item}
            </option>
          ))}
        </select>

        {/* Urgency Filter */}
        <select
          value={filterState.urgency}
          onChange={(e) => onFilterChange({ urgency: e.target.value })}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30"
        >
          <option value="all">Tất cả mức hạn</option>
          <option value="overdue">🔴 Quá hạn / Hạn hôm nay (≤1 ngày)</option>
          <option value="warning3">🟠 Sắp đến hạn (≤3 ngày)</option>
          <option value="warning5">🟡 Cảnh báo tuần (≤5 ngày)</option>
          <option value="safe">🟢 Còn nhiều thời gian (&gt;5 ngày)</option>
        </select>

        {/* Reset Filter Button */}
        {(filterState.searchQuery ||
          filterState.status !== 'all' ||
          filterState.assignee !== 'all' ||
          filterState.urgency !== 'all') && (
          <button
            onClick={onResetFilters}
            className="p-2 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs flex items-center space-x-1 transition"
            title="Xóa bộ lọc"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* View Mode Toggle: Only Table & Calendar */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 ml-auto sm:ml-0">
          <button
            type="button"
            onClick={() => onFilterChange({ viewMode: 'table' })}
            className={`px-2.5 py-1.5 rounded-md transition flex items-center space-x-1 text-xs cursor-pointer ${
              filterState.viewMode === 'table'
                ? 'bg-white text-[#005BAB] shadow-sm font-semibold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Dạng Bảng thống kê (Table)"
          >
            <Table className="w-4 h-4" />
            <span className="hidden md:inline">Bảng</span>
          </button>
          <button
            type="button"
            onClick={() => onFilterChange({ viewMode: 'calendar' })}
            className={`px-2.5 py-1.5 rounded-md transition flex items-center space-x-1 text-xs cursor-pointer ${
              filterState.viewMode === 'calendar'
                ? 'bg-white text-[#005BAB] shadow-sm font-semibold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Dạng Lịch hoàn thành (Calendar)"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden md:inline">Lịch hoàn thành</span>
          </button>
        </div>
      </div>
    </div>
  );
};
