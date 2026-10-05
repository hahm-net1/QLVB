import React, { useState } from 'react';
import { TaskDocument, UserRole } from '../types';
import { getUrgencyBadge, getPriorityBadge, getStatusBadge } from '../utils/taskUtils';
import {
  Calendar,
  User,
  Building2,
  MessageSquare,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  Plus,
  ChevronDown,
  ChevronUp,
  TrendingUp,
} from 'lucide-react';

interface TaskCardProps {
  task: TaskDocument;
  userRole: UserRole;
  onEdit: (task: TaskDocument) => void;
  onDelete: (id: string) => void;
  onAddNote: (taskId: string, noteContent: string) => void;
  onUpdateStatus: (taskId: string, newStatus: TaskDocument['status'], newProgress: number) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  userRole,
  onEdit,
  onDelete,
  onAddNote,
  onUpdateStatus,
}) => {
  const [showNotes, setShowNotes] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const urgency = getUrgencyBadge(task);
  const priorityClass = getPriorityBadge(task.priority);
  const statusClass = getStatusBadge(task.status);

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    onAddNote(task.id, newNoteText.trim());
    setNewNoteText('');
    setIsAddingNote(false);
  };

  const handleQuickComplete = () => {
    onUpdateStatus(task.id, 'Hoàn thành', 100);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
      <div>
        {/* Card Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#005BAB] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {task.docNumber}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${priorityClass}`}>
                  {task.priority}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusClass}`}>
                  {task.status}
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-900 mt-2 line-clamp-2 leading-snug">
                {task.title}
              </h3>
            </div>

            {/* Urgency Badge */}
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${urgency.className}`}
            >
              <span className={`w-2 h-2 rounded-full ${urgency.dotColor}`} />
              <span>{urgency.label}</span>
            </div>
          </div>

          {/* Department & Assignee */}
          <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
            {task.department && (
              <div className="flex items-center space-x-1.5 text-slate-500">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{task.department}</span>
              </div>
            )}
            <div className="flex items-center space-x-1.5 font-medium text-slate-800">
              <User className="w-3.5 h-3.5 text-[#005BAB] shrink-0" />
              <span className="truncate">CBKT: {task.assignee}</span>
            </div>
          </div>
        </div>

        {/* Dates & Progress */}
        <div className="p-4 sm:p-5 bg-slate-50/50 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                Ban hành: <strong className="text-slate-800 font-mono tabular-nums">{task.issueDate}</strong>
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span>
                Hạn BC: <strong className="text-slate-800 font-mono tabular-nums">{task.dueDate}</strong>
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-500">Tiến độ thực hiện</span>
              <span
                className={`font-mono tabular-nums ${
                  task.progressPercent === 100 ? 'text-emerald-600 font-bold' : 'text-slate-700'
                }`}
              >
                {task.progressPercent}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  task.progressPercent === 100
                    ? 'bg-emerald-500'
                    : task.progressPercent > 50
                    ? 'bg-[#005BAB]'
                    : 'bg-orange-500'
                }`}
                style={{ width: `${task.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Note History Toggle & Count */}
          <div className="pt-1 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="flex items-center space-x-1 text-xs text-[#005BAB] hover:underline font-medium cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ghi chú tiến độ ({task.notes.length})</span>
              {showNotes ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {task.status !== 'Hoàn thành' && (
              <button
                type="button"
                onClick={handleQuickComplete}
                className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium px-2.5 py-1 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                title="Báo cáo hoàn thành 100%"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Báo cáo hoàn thành</span>
              </button>
            )}
          </div>

          {/* Notes Accordion */}
          {showNotes && (
            <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2.5">
              {task.notes.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Chưa có ghi chú tiến độ nào.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {task.notes.map((note) => (
                    <div key={note.id} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs shadow-2xs">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="font-semibold text-slate-700">{note.author}</span>
                        <span className="font-mono tabular-nums">{note.timestamp}</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Note Form */}
              {isAddingNote ? (
                <form onSubmit={handleAddNoteSubmit} className="space-y-2 mt-2">
                  <textarea
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Nhập ghi chú cập nhật tiến độ mới..."
                    rows={2}
                    className="w-full p-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#005BAB]"
                    autoFocus
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingNote(false)}
                      className="px-2.5 py-1 text-xs text-slate-600 bg-slate-200 hover:bg-slate-300 rounded cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-2.5 py-1 text-xs text-white bg-[#005BAB] hover:bg-[#004a8b] rounded font-medium cursor-pointer"
                    >
                      Lưu ghi chú
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingNote(true)}
                  className="w-full py-1.5 border border-dashed border-blue-300 text-[#005BAB] hover:bg-blue-50/50 rounded-lg text-xs font-medium flex items-center justify-center space-x-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm ghi chú tiến độ</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] font-mono tabular-nums text-slate-400">
          Cập nhật: {task.updatedAt ? task.updatedAt.slice(0, 10) : task.createdAt.slice(0, 10)}
        </span>
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-[#005BAB] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition cursor-pointer"
            title={
              userRole === 'admin'
                ? 'Chỉnh sửa văn bản / công việc'
                : 'Cập nhật tiến độ & Báo cáo hoàn thành'
            }
          >
            {userRole === 'admin' ? (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Chỉnh sửa</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Cập nhật tiến độ</span>
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
      </div>
    </div>
  );
};
