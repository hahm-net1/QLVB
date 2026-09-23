import React, { useState, useEffect } from 'react';
import { TaskDocument, TaskStatus } from '../types';
import { X, Save, FileText, Calendar, User, Building2, AlertCircle, Percent } from 'lucide-react';

const UNIT_OPTIONS = [
  'P.KT',
  'P.KHĐT',
  'PKTTC',
  'PNS',
  'P.HCTH',
  'Đài VT',
  'X.VT',
  'X.HT',
];

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<TaskDocument>, newNote?: string) => void;
  editingTask: TaskDocument | null;
  assignees: string[];
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTask,
  assignees,
}) => {
  const [docCodeNum, setDocCodeNum] = useState('');
  const [docIssuer, setDocIssuer] = useState(UNIT_OPTIONS[0]);
  const [title, setTitle] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [assignee, setAssignee] = useState('');
  const [department, setDepartment] = useState(UNIT_OPTIONS[0]);
  const [priority, setPriority] = useState<'Bình thường' | 'Quan trọng' | 'Khẩn cấp'>('Bình thường');
  const [status, setStatus] = useState<TaskStatus>('Đang thực hiện');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [initialNote, setInitialNote] = useState('');

  useEffect(() => {
    if (editingTask) {
      // Parse docNumber e.g. "458/P.KT" or fallback
      const parts = editingTask.docNumber.split('/');
      setDocCodeNum(parts[0] || '458');
      const matchedUnit = UNIT_OPTIONS.find((u) => editingTask.docNumber.includes(u));
      setDocIssuer(matchedUnit || UNIT_OPTIONS[0]);

      setTitle(editingTask.title);
      setIssueDate(editingTask.issueDate);
      setDueDate(editingTask.dueDate);
      setAssignee(editingTask.assignee || '');
      setDepartment(editingTask.department || UNIT_OPTIONS[0]);
      setPriority(editingTask.priority);
      setStatus(editingTask.status);
      setProgressPercent(editingTask.progressPercent);
      setInitialNote('');
    } else {
      setDocCodeNum(String(Math.floor(100 + Math.random() * 900)));
      setDocIssuer(UNIT_OPTIONS[0]);
      setTitle('');
      setIssueDate(new Date().toISOString().slice(0, 10));
      setDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
      setAssignee('');
      setDepartment(UNIT_OPTIONS[0]);
      setPriority('Bình thường');
      setStatus('Đang thực hiện');
      setProgressPercent(0);
      setInitialNote('');
    }
  }, [editingTask, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docCodeNum.trim() || !title.trim() || !assignee.trim()) {
      alert('Vui lòng nhập đầy đủ Số văn bản, Trích yếu nội dung và CBKT thực hiện!');
      return;
    }

    const fullDocNumber = `${docCodeNum.trim()}/${docIssuer}`;

    onSave(
      {
        docNumber: fullDocNumber,
        title: title.trim(),
        issueDate,
        dueDate,
        assignee: assignee.trim(),
        department,
        priority,
        status,
        progressPercent: status === 'Hoàn thành' ? 100 : progressPercent,
      },
      initialNote.trim() ? initialNote.trim() : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="bg-[#005BAB] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <h2 className="text-lg font-bold">
              {editingTask ? 'Cập nhật Văn bản & Công việc' : 'Giao văn bản / Công việc mới'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Doc Number & Issuer & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Số / Ký hiệu Văn bản <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  required
                  value={docCodeNum}
                  onChange={(e) => setDocCodeNum(e.target.value)}
                  placeholder="Số VB (VD: 458)"
                  className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30"
                />
                <select
                  value={docIssuer}
                  onChange={(e) => setDocIssuer(e.target.value)}
                  className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30 font-medium"
                >
                  {UNIT_OPTIONS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Mức độ ưu tiên
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30"
              >
                <option value="Bình thường">Bình thường</option>
                <option value="Quan trọng">Quan trọng</option>
                <option value="Khẩn cấp">🚨 Khẩn cấp</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Trích yếu nội dung công việc <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập nội dung trích yếu của văn bản giao việc..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30 focus:border-[#005BAB]"
            />
          </div>

          {/* Department & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Phòng ban / Đơn vị phối hợp
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30"
              >
                {UNIT_OPTIONS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                CBKT chịu trách nhiệm chính <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                list="cbkt-suggestions"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="Nhập họ tên CBKT thực hiện..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30 focus:border-[#005BAB]"
              />
              <datalist id="cbkt-suggestions">
                {assignees.map((item, idx) => (
                  <option key={idx} value={item} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Ngày ban hành
              </label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Hạn hoàn thành / báo cáo <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30"
              />
            </div>
          </div>

          {/* Status & Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Trạng thái thực hiện
              </label>
              <select
                value={status}
                onChange={(e) => {
                  const val = e.target.value as TaskStatus;
                  setStatus(val);
                  if (val === 'Hoàn thành') setProgressPercent(100);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30"
              >
                <option value="Đang thực hiện">Đang thực hiện</option>
                <option value="Hoàn thành">Hoàn thành</option>
                <option value="Tạm dừng">Tạm dừng</option>
                <option value="Chờ duyệt">Chờ duyệt</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Tỷ lệ hoàn thành ({progressPercent}%)
              </label>
              <div className="flex items-center space-x-3 pt-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progressPercent}
                  disabled={status === 'Hoàn thành'}
                  onChange={(e) => setProgressPercent(Number(e.target.value))}
                  className="w-full accent-[#005BAB]"
                />
                <span className="text-sm font-bold text-slate-700 w-10 text-right">
                  {progressPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Initial Note (for new or extra update) */}
          {!editingTask && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Ghi chú tiến độ ban đầu (Tùy chọn)
              </label>
              <textarea
                rows={2}
                value={initialNote}
                onChange={(e) => setInitialNote(e.target.value)}
                placeholder="Nhập ghi chú hoặc ý kiến chỉ đạo ban đầu..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30"
              />
            </div>
          )}

          {/* Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 text-sm text-white bg-[#005BAB] hover:bg-[#004a8b] rounded-lg font-semibold shadow-md transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{editingTask ? 'Lưu thay đổi' : 'Tạo mới văn bản'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
