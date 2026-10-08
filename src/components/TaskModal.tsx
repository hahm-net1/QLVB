import React, { useState, useEffect } from 'react';
import { TaskDocument, TaskStatus, UserRole, ScannedDocumentData } from '../types';
import {
  X,
  Save,
  FileText,
  CheckCircle2,
  TrendingUp,
  Lock,
  MessageSquare,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  ScanLine,
  Send,
} from 'lucide-react';

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
  scannedData?: ScannedDocumentData | null;
  onOpenScan?: () => void;
  assignees: string[];
  userRole: UserRole;
  onRequestAdmin?: () => void;
  onOpenReminder?: (task: TaskDocument) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTask,
  scannedData,
  onOpenScan,
  assignees,
  userRole,
  onRequestAdmin,
  onOpenReminder,
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
  const [formError, setFormError] = useState('');

  const isGuestMode = userRole === 'guest' && Boolean(editingTask);

  useEffect(() => {
    setFormError('');
    if (editingTask) {
      const parts = editingTask.docNumber.split('/');
      setDocCodeNum(parts[0] || '458');
      const matchedUnit = UNIT_OPTIONS.find((u) => editingTask.docNumber.includes(u));
      setDocIssuer(matchedUnit || parts[1] || UNIT_OPTIONS[0]);

      setTitle(editingTask.title);
      setIssueDate(editingTask.issueDate);
      setDueDate(editingTask.dueDate);
      setAssignee(editingTask.assignee || '');
      setDepartment(editingTask.department || UNIT_OPTIONS[0]);
      setPriority(editingTask.priority);
      setStatus(editingTask.status);
      setProgressPercent(editingTask.progressPercent);
      setInitialNote('');
    } else if (scannedData) {
      let parsedNum = scannedData.docCodeNum || '';
      let parsedIssuer = scannedData.docIssuer || '';
      if (!parsedNum || !parsedIssuer) {
        const parts = scannedData.fullDocNumber.split('/');
        if (!parsedNum) parsedNum = parts[0] || '';
        if (!parsedIssuer) parsedIssuer = parts.slice(1).join('/') || UNIT_OPTIONS[0];
      }

      setDocCodeNum(parsedNum);
      setDocIssuer(parsedIssuer || UNIT_OPTIONS[0]);

      setTitle(scannedData.title || '');
      setIssueDate(scannedData.issueDate || new Date().toISOString().slice(0, 10));
      setDueDate(scannedData.dueDate || new Date().toISOString().slice(0, 10));
      setAssignee(scannedData.assignee || '');

      // Phòng/ban giao NV là parsedIssuer (ô ngay cạnh số hiệu).
      // Ô "Phòng ban / Đơn vị phối hợp" chỉ điền nếu văn bản chỉ định đơn vị phối hợp khác với đơn vị giao NV.
      if (
        scannedData.department &&
        scannedData.department.toLowerCase() !== parsedIssuer.toLowerCase() &&
        scannedData.department.toLowerCase() !== 'không có'
      ) {
        setDepartment(scannedData.department);
      } else {
        setDepartment('');
      }

      setPriority(scannedData.priority || 'Bình thường');
      setStatus('Đang thực hiện');
      setProgressPercent(0);
      setInitialNote(scannedData.notes ? `[Chỉ đạo]: ${scannedData.notes}` : '');
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
  }, [editingTask, scannedData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isGuestMode && editingTask) {
      // Guest only updates progressPercent, status, and adds progress note
      onSave(
        {
          status,
          progressPercent: status === 'Hoàn thành' ? 100 : progressPercent,
        },
        initialNote.trim() ? initialNote.trim() : undefined
      );
      onClose();
      return;
    }

    if (!docCodeNum.trim() || !title.trim() || !assignee.trim()) {
      setFormError('Vui lòng nhập đầy đủ Số văn bản, Trích yếu nội dung và CBKT thực hiện!');
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

  const handleQuickPreset = (percent: number, targetStatus?: TaskStatus) => {
    setProgressPercent(percent);
    if (targetStatus) {
      setStatus(targetStatus);
    } else if (percent === 100) {
      setStatus('Hoàn thành');
    } else if (status === 'Hoàn thành' && percent < 100) {
      setStatus('Đang thực hiện');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="bg-[#005BAB] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            {isGuestMode ? (
              <TrendingUp className="w-5 h-5 text-amber-300" />
            ) : (
              <FileText className="w-5 h-5 text-amber-300" />
            )}
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                {isGuestMode
                  ? 'Cập nhật Tiến độ & Báo cáo Hoàn thành'
                  : editingTask
                  ? 'Chỉnh sửa Văn bản & Công việc (Admin)'
                  : 'Giao Văn bản / Công việc mới (Admin)'}
              </h2>
              <p className="text-[11px] text-blue-200">
                {isGuestMode
                  ? 'Nhóm Guest: Cập nhật tỷ lệ hoàn thành, trạng thái và ghi chú báo cáo'
                  : 'Nhóm Admin: Toàn quyền chỉnh sửa thông tin văn bản và phân công'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {onOpenScan && !editingTask && (
              <button
                type="button"
                onClick={onOpenScan}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                title="Quét tài liệu từ ảnh/PDF/Camera để tự động điền các ô"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                <span className="hidden sm:inline">Quét AI (Ảnh/PDF)</span>
                <span className="sm:hidden">Quét AI</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-red-700 font-medium">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* If Guest Mode: Read-only summary of the Document */}
          {isGuestMode && editingTask ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-[#005BAB] bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                    {editingTask.docNumber}
                  </span>
                  <span className="text-xs font-medium text-slate-600">
                    • Ưu tiên: <strong className="text-slate-800">{editingTask.priority}</strong>
                  </span>
                </div>
                {onRequestAdmin && (
                  <button
                    type="button"
                    onClick={onRequestAdmin}
                    className="inline-flex items-center space-x-1 text-[11px] text-[#005BAB] hover:underline font-medium cursor-pointer"
                    title="Đăng nhập Admin để sửa thông tin gốc của văn bản"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Mở quyền Admin để sửa VB</span>
                  </button>
                )}
              </div>

              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase">
                  Trích yếu nội dung
                </div>
                <p className="text-sm font-semibold text-slate-900 mt-0.5 leading-snug">
                  {editingTask.title}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[11px]">CBKT Phụ trách:</span>
                  <strong className="text-slate-800">{editingTask.assignee}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Đơn vị:</span>
                  <strong className="text-slate-800">{editingTask.department || 'P.KT'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Hạn báo cáo:</span>
                  <strong className="text-slate-800 font-mono tabular-nums">{editingTask.dueDate}</strong>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Admin Full Edit Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Số / Ký hiệu Văn bản <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={docCodeNum}
                    onChange={(e) => setDocCodeNum(e.target.value)}
                    placeholder="Số VB (VD: 458)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Phòng/ban giao NV <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      list="doc-issuer-options"
                      value={docIssuer}
                      onChange={(e) => setDocIssuer(e.target.value)}
                      placeholder="Chọn hoặc gõ (VD: P.KT)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30"
                    />
                    <datalist id="doc-issuer-options">
                      {UNIT_OPTIONS.map((unit) => (
                        <option key={unit} value={unit} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="sm:col-span-3">
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
                    <option value="Khẩn cấp">Khẩn cấp</option>
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
                  <div className="relative">
                    <input
                      type="text"
                      list="unit-coop-options"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Đơn vị phối hợp (để trống nếu không có)..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30"
                    />
                    <datalist id="unit-coop-options">
                      <option value="Không có" />
                      {UNIT_OPTIONS.map((unit) => (
                        <option key={unit} value={unit} />
                      ))}
                    </datalist>
                  </div>
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30"
                  />
                </div>
              </div>
            </>
          )}

          {/* Progress & Completion Section (Available to both Guest and Admin) */}
          <div className="bg-blue-50/50 border border-blue-200/80 rounded-xl p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#005BAB] uppercase tracking-wider">
                Cập nhật Tiến độ & Trạng thái báo cáo
              </span>
              {/* Quick Completion & Progress Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[25, 50, 75].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleQuickPreset(pct, 'Đang thực hiện')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono tabular-nums font-semibold border transition cursor-pointer ${
                      progressPercent === pct && status !== 'Hoàn thành'
                        ? 'bg-[#005BAB] text-white border-[#005BAB]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleQuickPreset(100, 'Hoàn thành')}
                  className={`inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    status === 'Hoàn thành' || progressPercent === 100
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Báo cáo Hoàn thành (100%)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30"
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
                <div className="flex items-center space-x-3 pt-1.5">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progressPercent}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setProgressPercent(val);
                      if (val === 100) setStatus('Hoàn thành');
                      else if (status === 'Hoàn thành') setStatus('Đang thực hiện');
                    }}
                    className="w-full accent-[#005BAB] cursor-pointer"
                  />
                  <span className="text-sm font-mono tabular-nums font-bold text-slate-800 w-11 text-right">
                    {progressPercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Report Note Input (Always shown for both new & existing tasks) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {editingTask
                  ? 'Nội dung báo cáo tiến độ / Ghi chú bổ sung'
                  : 'Ghi chú tiến độ ban đầu (Tùy chọn)'}
              </label>
              <textarea
                rows={2}
                value={initialNote}
                onChange={(e) => setInitialNote(e.target.value)}
                placeholder={
                  editingTask
                    ? 'Nhập báo cáo kết quả thực hiện, vướng mắc hoặc ghi chú hoàn thành...'
                    : 'Nhập ghi chú hoặc ý kiến chỉ đạo ban đầu...'
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30"
              />
            </div>

            {/* Existing Notes History */}
            {editingTask && editingTask.notes.length > 0 && (
              <div className="pt-2 border-t border-blue-200/60 space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600">
                  <MessageSquare className="w-3.5 h-3.5 text-[#005BAB]" />
                  <span>Lịch sử báo cáo tiến độ ({editingTask.notes.length})</span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {editingTask.notes.map((n) => (
                    <div
                      key={n.id}
                      className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                    >
                      <div className="text-slate-700">
                        <strong className="text-slate-900">{n.author}:</strong> {n.content}
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                        {n.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <div>
              {editingTask && onOpenReminder && (
                <button
                  type="button"
                  onClick={() => onOpenReminder(editingTask)}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs sm:text-sm text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg font-semibold transition cursor-pointer"
                  title="Nhắc việc / Sao chép tin nhắn, gửi Viber"
                >
                  <Send className="w-3.5 h-3.5 text-amber-700" />
                  <span>Xuất tin nhắn nhắc việc</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="flex items-center space-x-1.5 px-5 py-2 text-sm text-white bg-[#005BAB] hover:bg-[#004a8b] rounded-lg font-semibold shadow-md transition active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>
                  {isGuestMode
                    ? 'Lưu báo cáo tiến độ'
                    : editingTask
                    ? 'Lưu thay đổi'
                    : 'Tạo mới văn bản'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
