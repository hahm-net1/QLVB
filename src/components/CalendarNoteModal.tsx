import React, { useState, useEffect } from 'react';
import { CalendarNote, UserRole } from '../types';
import {
  X,
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  BookmarkCheck,
  FileText,
  Tag,
} from 'lucide-react';

interface CalendarNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteData: Omit<CalendarNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialDate?: string;
  editingNote?: CalendarNote | null;
  assignees?: string[];
  userRole: UserRole;
}

export const CalendarNoteModal: React.FC<CalendarNoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDate,
  editingNote,
  assignees = [],
  userRole,
}) => {
  const [title, setTitle] = useState('');
  const [noteDate, setNoteDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignee, setAssignee] = useState('');
  const [priority, setPriority] = useState<'Bình thường' | 'Quan trọng' | 'Khẩn cấp'>('Bình thường');
  const [details, setDetails] = useState('');
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title);
      setNoteDate(editingNote.noteDate);
      setDueDate(editingNote.dueDate);
      setAssignee(editingNote.assignee || '');
      setPriority(editingNote.priority || 'Bình thường');
      setDetails(editingNote.details || '');
      setCompleted(editingNote.completed);
    } else {
      const defaultDate = initialDate || new Date().toISOString().slice(0, 10);
      setTitle('');
      setNoteDate(defaultDate);
      setDueDate(defaultDate);
      setAssignee('');
      setPriority('Bình thường');
      setDetails('');
      setCompleted(false);
    }
    setError(null);
  }, [editingNote, initialDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập nội dung ghi chú / việc cần làm.');
      return;
    }
    if (!dueDate) {
      setError('Vui lòng chọn hạn hoàn thành / báo cáo.');
      return;
    }

    onSave({
      title: title.trim(),
      noteDate: noteDate || dueDate,
      dueDate,
      assignee: assignee.trim() || '',
      priority: priority || 'Bình thường',
      details: details.trim() || '',
      completed,
      completedAt: completed ? (editingNote?.completedAt || new Date().toISOString().replace('T', ' ').slice(0, 16)) : '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#005BAB] via-[#004885] to-[#003366] text-white px-5 sm:px-6 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 text-amber-300">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold leading-tight">
                {editingNote ? 'Chỉnh sửa Note Lịch' : 'Thêm Note Lịch Hoàn Thành'}
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Nhắc việc & cảnh báo hạn hoàn thành trên lịch công tác
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-red-700 font-medium">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Tiêu đề / Nội dung Note việc cần làm <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Họp giao ban kỹ thuật quý 4; Kiểm tra tuyến cáp trục..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30 focus:border-[#005BAB]"
            />
          </div>

          {/* Dates: Note Date & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Ngày đặt Note
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={noteDate}
                  onChange={(e) => setNoteDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Hạn hoàn thành / Báo cáo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-red-700 focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30"
                />
              </div>
            </div>
          </div>

          {/* Assignee & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                CBKT Phụ trách thực hiện
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="calendar-assignee-list"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  placeholder="Nhập hoặc chọn CBKT..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30"
                />
                <datalist id="calendar-assignee-list">
                  {assignees.map((name, idx) => (
                    <option key={`${name}-${idx}`} value={name} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Mức độ ưu tiên
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30"
              >
                <option value="Bình thường">Bình thường</option>
                <option value="Quan trọng">Quan trọng</option>
                <option value="Khẩn cấp">Khẩn cấp (Hỏa tốc)</option>
              </select>
            </div>
          </div>

          {/* Details / Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Ghi chú chi tiết / Kết quả thực hiện
            </label>
            <textarea
              rows={2}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Ghi chú thêm về yêu cầu, địa điểm, kết quả kiểm tra..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30"
            />
          </div>

          {/* Status Checkbox */}
          <div className="pt-1">
            <label className="inline-flex items-center space-x-2.5 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer transition w-full">
              <input
                type="checkbox"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
                className="w-4 h-4 text-[#005BAB] rounded border-slate-300 focus:ring-[#005BAB]"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800">
                  {completed ? 'Đã hoàn thành công việc (100%)' : 'Đang thực hiện (Chưa xong)'}
                </span>
                <span className="block text-slate-500 text-[11px]">
                  {completed
                    ? 'Note sẽ được gắn nhãn hoàn thành và không phát cảnh báo quá hạn nữa'
                    : 'Hệ thống sẽ tự động quét và cảnh báo khi sắp đến hạn hoàn thành'}
                </span>
              </div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm text-white bg-[#005BAB] hover:bg-[#004885] rounded-xl font-bold shadow-md transition cursor-pointer flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingNote ? 'Lưu thay đổi' : 'Tạo Note Lịch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
