import React from 'react';
import { TaskDocument, UserRole } from '../types';
import { getUrgencyBadge, getPriorityBadge, getStatusBadge } from '../utils/taskUtils';
import { Edit3, Trash2, CheckCircle2, TrendingUp, Send, MessageSquare } from 'lucide-react';

interface TaskTableProps {
  tasks: TaskDocument[];
  userRole: UserRole;
  onEdit: (task: TaskDocument) => void;
  onDelete: (id: string) => void;
  onQuickComplete: (taskId: string) => void;
  onOpenReminder?: (task: TaskDocument) => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  userRole,
  onEdit,
  onDelete,
  onQuickComplete,
  onOpenReminder,
}) => {
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
        <p className="text-slate-500 text-sm">Không tìm thấy văn bản hoặc công việc nào phù hợp.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <th className="py-3.5 px-4">STT</th>
              <th className="py-3.5 px-4">Số / Ký hiệu VB</th>
              <th className="py-3.5 px-4 max-w-xs">Trích yếu nội dung</th>
              <th className="py-3.5 px-4">CBKT Phụ trách</th>
              <th className="py-3.5 px-4">Hạn báo cáo</th>
              <th className="py-3.5 px-4">Mức hạn</th>
              <th className="py-3.5 px-4">Trạng thái</th>
              <th className="py-3.5 px-4">Tiến độ</th>
              <th className="py-3.5 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
            {tasks.map((task, index) => {
              const urgency = getUrgencyBadge(task);
              const priorityClass = getPriorityBadge(task.priority);
              const statusClass = getStatusBadge(task.status);
              const latestNote = task.notes.length > 0 ? task.notes[task.notes.length - 1] : null;

              return (
                <tr key={task.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-500">{index + 1}</td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-[#005BAB] bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-xs">
                      {task.docNumber}
                    </span>
                    <div className="mt-1">
                      <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded ${priorityClass}`}>
                        {task.priority}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <p className="font-medium text-slate-900 line-clamp-2 leading-snug">{task.title}</p>
                    {latestNote && (
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic">
                        Ghi chú ({task.notes.length}): {latestNote.author} — {latestNote.content}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800">{task.assignee}</div>
                    <div className="text-[11px] text-slate-400">{task.department}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums font-medium text-slate-700">
                    {task.dueDate}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium border ${urgency.className}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${urgency.dotColor}`} />
                      <span>{urgency.label}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusClass}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            task.progressPercent === 100 ? 'bg-emerald-500' : 'bg-[#005BAB]'
                          }`}
                          style={{ width: `${task.progressPercent}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono tabular-nums font-semibold">
                        {task.progressPercent}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      {task.status !== 'Hoàn thành' && (
                        <button
                          type="button"
                          onClick={() => onQuickComplete(task.id)}
                          className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer"
                          title="Báo cáo hoàn thành (100%)"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline">Hoàn thành</span>
                        </button>
                      )}
                      {/* Nhắc việc / Sao chép / Viber */}
                      {onOpenReminder && (
                        <button
                          type="button"
                          onClick={() => onOpenReminder(task)}
                          className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition cursor-pointer"
                          title="Nhắc việc / Sao chép tin nhắn, gửi Viber"
                        >
                          <Send className="w-3.5 h-3.5 text-amber-700" />
                          <span className="hidden xl:inline">Nhắc việc</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEdit(task)}
                        className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium text-[#005BAB] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition cursor-pointer"
                        title={
                          userRole === 'admin'
                            ? 'Chỉnh sửa toàn bộ thông tin & tiến độ'
                            : 'Cập nhật tiến độ & Báo cáo kết quả'
                        }
                      >
                        {userRole === 'admin' ? (
                          <>
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Sửa</span>
                          </>
                        ) : (
                          <>
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Cập nhật tiến độ</span>
                          </>
                        )}
                      </button>
                      {userRole === 'admin' && (
                        <button
                          type="button"
                          onClick={() => onDelete(task.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition cursor-pointer"
                          title="Xóa văn bản (Chỉ Admin)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
