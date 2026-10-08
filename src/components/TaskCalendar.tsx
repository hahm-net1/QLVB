import React, { useState, useMemo } from 'react';
import { TaskDocument, CalendarNote, UserRole } from '../types';
import {
  calculateDaysRemaining,
  formatVietnameseDateLabel,
  getUrgencyBadge,
  getPriorityBadge,
  getStatusBadge,
} from '../utils/taskUtils';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Edit3,
  Trash2,
  FileText,
  Clock,
  AlertTriangle,
  User,
  Building2,
  MessageSquare,
  Plus,
  BookmarkCheck,
  CheckSquare,
  Square,
  Sparkles,
  Send,
} from 'lucide-react';
import { CalendarNoteModal } from './CalendarNoteModal';

interface TaskCalendarProps {
  tasks: TaskDocument[];
  calendarNotes?: CalendarNote[];
  userRole: UserRole;
  assignees?: string[];
  onEdit: (task: TaskDocument) => void;
  onDelete: (id: string) => void;
  onQuickComplete: (id: string) => void;
  onAddNote?: (noteData: Omit<CalendarNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateNote?: (id: string, updated: Partial<CalendarNote>) => void;
  onDeleteNote?: (id: string) => void;
  onToggleCompleteNote?: (id: string) => void;
  onOpenTaskReminder?: (task: TaskDocument) => void;
  onOpenNoteReminder?: (note: CalendarNote) => void;
}

interface CalendarDayCell {
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: TaskDocument[];
  notes: CalendarNote[];
}

const WEEKDAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

function formatDateYMD(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export const TaskCalendar: React.FC<TaskCalendarProps> = ({
  tasks,
  calendarNotes = [],
  userRole,
  assignees = [],
  onEdit,
  onDelete,
  onQuickComplete,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onToggleCompleteNote,
  onOpenTaskReminder,
  onOpenNoteReminder,
}) => {
  const todayObj = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => todayObj.toISOString().slice(0, 10), [todayObj]);

  const [currentYear, setCurrentYear] = useState<number>(todayObj.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(todayObj.getMonth()); // 0 - 11
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Note Modal state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<CalendarNote | null>(null);
  const [noteModalDate, setNoteModalDate] = useState<string>(todayStr);

  // Group all tasks by dueDate (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskDocument[]>();
    tasks.forEach((task) => {
      if (!task.dueDate) return;
      const key = task.dueDate.slice(0, 10);
      const list = map.get(key) || [];
      list.push(task);
      map.set(key, list);
    });

    // Sort tasks inside each day: uncompleted first, then by priority
    const priorityOrder = { 'Khẩn cấp': 0, 'Quan trọng': 1, 'Bình thường': 2 };
    for (const [, list] of map.entries()) {
      list.sort((a, b) => {
        const doneA = a.status === 'Hoàn thành';
        const doneB = b.status === 'Hoàn thành';
        if (doneA !== doneB) return doneA ? 1 : -1;
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    }
    return map;
  }, [tasks]);

  // Group all notes by dueDate or noteDate (YYYY-MM-DD)
  const notesByDate = useMemo(() => {
    const map = new Map<string, CalendarNote[]>();
    calendarNotes.forEach((note) => {
      const key = (note.dueDate || note.noteDate || '').slice(0, 10);
      if (!key) return;
      const list = map.get(key) || [];
      list.push(note);
      map.set(key, list);
    });

    // Sort notes inside each day: uncompleted first
    for (const [, list] of map.entries()) {
      list.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const prioMap = { 'Khẩn cấp': 0, 'Quan trọng': 1, 'Bình thường': 2 };
        return (prioMap[a.priority || 'Bình thường'] ?? 2) - (prioMap[b.priority || 'Bình thường'] ?? 2);
      });
    }
    return map;
  }, [calendarNotes]);

  // Build 42-cell (6 weeks) or 35-cell (5 weeks) calendar grid starting on Monday
  const calendarCells = useMemo<CalendarDayCell[]>(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    // Convert JS getDay() (0=Sun..6=Sat) to Monday-first index (0=Mon..6=Sun)
    const startWeekday = (firstDayOfMonth.getDay() + 6) % 7;

    const cells: CalendarDayCell[] = [];

    // Leading days from previous month
    const prevMonthLastDate = new Date(currentYear, currentMonth, 0).getDate();
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;

    for (let i = startWeekday - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDate - i;
      const dateStr = formatDateYMD(prevYear, prevMonth, dayNum);
      cells.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        tasks: tasksByDate.get(dateStr) || [],
        notes: notesByDate.get(dateStr) || [],
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDateYMD(currentYear, currentMonth, day);
      cells.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        tasks: tasksByDate.get(dateStr) || [],
        notes: notesByDate.get(dateStr) || [],
      });
    }

    // Trailing days from next month to fill complete weeks
    const totalCells = cells.length <= 35 ? 35 : 42;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    let nextDay = 1;
    while (cells.length < totalCells) {
      const dateStr = formatDateYMD(nextYear, nextMonth, nextDay);
      cells.push({
        dateStr,
        dayNumber: nextDay,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        tasks: tasksByDate.get(dateStr) || [],
        notes: notesByDate.get(dateStr) || [],
      });
      nextDay++;
    }

    return cells;
  }, [currentYear, currentMonth, todayStr, tasksByDate, notesByDate]);

  // Month statistics
  const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const monthTasks = useMemo(
    () => tasks.filter((t) => t.dueDate && t.dueDate.startsWith(monthPrefix)),
    [tasks, monthPrefix]
  );
  const monthNotes = useMemo(
    () => calendarNotes.filter((n) => (n.dueDate || n.noteDate).startsWith(monthPrefix)),
    [calendarNotes, monthPrefix]
  );
  const monthCompleted = monthTasks.filter((t) => t.status === 'Hoàn thành').length +
    monthNotes.filter((n) => n.completed).length;

  const monthUrgent = monthTasks.filter(
    (t) => t.status !== 'Hoàn thành' && calculateDaysRemaining(t.dueDate) <= 1
  ).length +
    monthNotes.filter(
      (n) => !n.completed && calculateDaysRemaining(n.dueDate) <= 1
    ).length;

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(todayObj.getFullYear());
    setCurrentMonth(todayObj.getMonth());
    setSelectedDate(todayStr);
  };

  // Open note modal for creating a new note on a specific date (via double click or button)
  const handleOpenAddNote = (targetDate?: string) => {
    const d = targetDate || selectedDate || todayStr;
    setEditingNote(null);
    setNoteModalDate(d);
    setIsNoteModalOpen(true);
  };

  // Open note modal for editing an existing note
  const handleOpenEditNote = (note: CalendarNote) => {
    setEditingNote(note);
    setNoteModalDate(note.dueDate || note.noteDate);
    setIsNoteModalOpen(true);
  };

  const handleSaveNoteModal = (noteData: Omit<CalendarNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingNote && onUpdateNote) {
      onUpdateNote(editingNote.id, noteData);
    } else if (onAddNote) {
      onAddNote(noteData);
    }
  };

  // Tasks and notes for the currently selected date
  const selectedDateTasks = useMemo(
    () => tasksByDate.get(selectedDate) || [],
    [tasksByDate, selectedDate]
  );
  const selectedDateNotes = useMemo(
    () => notesByDate.get(selectedDate) || [],
    [notesByDate, selectedDate]
  );

  // Helper for task pill color inside a calendar cell
  const getCalendarChipStyle = (task: TaskDocument) => {
    if (task.status === 'Hoàn thành') {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100';
    }
    const days = calculateDaysRemaining(task.dueDate);
    if (days < 0) {
      return 'bg-red-100 text-red-900 border-red-300 hover:bg-red-200 font-semibold';
    }
    if (days <= 1) {
      return 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100 font-semibold';
    }
    if (days <= 3) {
      return 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100';
    }
    if (days <= 5) {
      return 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100';
    }
    return 'bg-blue-50 text-[#005BAB] border-blue-200 hover:bg-blue-100';
  };

  const yearOptions = useMemo(() => {
    const baseYear = todayObj.getFullYear();
    const years = new Set<number>();
    for (let y = baseYear - 2; y <= baseYear + 3; y++) years.add(y);
    tasks.forEach((t) => {
      const y = parseInt(t.dueDate?.slice(0, 4), 10);
      if (!isNaN(y)) years.add(y);
    });
    calendarNotes.forEach((n) => {
      const y = parseInt(n.dueDate?.slice(0, 4), 10);
      if (!isNaN(y)) years.add(y);
    });
    return Array.from(years).sort((a, b) => a - b);
  }, [tasks, calendarNotes, todayObj]);

  return (
    <div className="space-y-6">
      {/* 1. Main Calendar Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Calendar Top Controls Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-blue-50/40 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Month / Year Navigator */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center space-x-1.5">
              <CalendarIcon className="w-5 h-5 text-[#005BAB]" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Lịch Hoàn Thành
              </h3>
            </div>

            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-slate-600 hover:text-[#005BAB] hover:bg-white transition cursor-pointer"
                title="Tháng trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, idx) => (
                  <option key={idx} value={idx}>
                    Tháng {String(idx + 1).padStart(2, '0')}
                  </option>
                ))}
              </select>

              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs sm:text-sm font-bold font-mono text-slate-800 focus:outline-none cursor-pointer"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-slate-600 hover:text-[#005BAB] hover:bg-white transition cursor-pointer"
                title="Tháng tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleGoToday}
                className="px-2.5 py-1 text-xs font-semibold text-[#005BAB] bg-white hover:bg-blue-50 border border-blue-200 rounded-lg transition cursor-pointer"
              >
                Hôm nay
              </button>
            </div>
          </div>

          {/* Right Action: Quick Add Note Button & Metrics */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 text-xs text-slate-600">
            <button
              type="button"
              onClick={() => handleOpenAddNote(selectedDate)}
              className="inline-flex items-center space-x-1.5 bg-[#005BAB] hover:bg-[#004885] text-white px-3 py-1.5 rounded-xl font-bold shadow-xs transition active:scale-95 cursor-pointer"
              title="Thêm Note ghi chú / việc cần làm vào ngày đang chọn"
            >
              <Plus className="w-4 h-4" />
              <span>+ Note ngày {selectedDate.slice(8, 10)}/{selectedDate.slice(5, 7)}</span>
            </button>

            <div className="flex items-center space-x-3 text-slate-600">
              <span>
                Trong tháng: <strong className="font-mono text-slate-900">{monthTasks.length}</strong> VB •{' '}
                <strong className="font-mono text-indigo-700">{monthNotes.length}</strong> Note
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Cảnh báo hạn:{' '}
                <strong className="font-mono text-red-600 font-bold">{monthUrgent}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Urgency Color Legend & Double-click Notice */}
        <div className="bg-slate-50/90 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="font-semibold text-slate-700">Mức hạn:</span>
            <span className="inline-flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
              <span>Quá hạn / ≤ 1 ngày</span>
            </span>
            <span className="inline-flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>Sắp đến hạn (≤ 3 ngày)</span>
            </span>
            <span className="inline-flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Cảnh báo tuần (≤ 5 ngày)</span>
            </span>
            <span className="inline-flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#005BAB]" />
              <span>An toàn (&gt; 5 ngày)</span>
            </span>
            <span className="inline-flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Đã hoàn thành</span>
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] text-[#005BAB] font-semibold bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
            <span>Mẹo: Click đúp vào ô ngày bất kỳ để nhập Note & đặt cảnh báo hạn!</span>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-slate-100/80 border-b border-slate-200 text-center">
          {WEEKDAYS.map((dayName, idx) => (
            <div
              key={dayName}
              className={`py-2 text-xs font-bold ${
                idx >= 5 ? 'text-orange-700' : 'text-slate-700'
              }`}
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 bg-white">
          {calendarCells.map((cell) => {
            const isSelected = cell.dateStr === selectedDate;
            const hasUrgentTask = cell.tasks.some(
              (t) => t.status !== 'Hoàn thành' && calculateDaysRemaining(t.dueDate) <= 1
            );
            const hasUrgentNote = cell.notes.some(
              (n) => !n.completed && calculateDaysRemaining(n.dueDate) <= 1
            );
            const hasUrgent = hasUrgentTask || hasUrgentNote;

            return (
              <div
                key={cell.dateStr}
                onClick={() => setSelectedDate(cell.dateStr)}
                onDoubleClick={() => handleOpenAddNote(cell.dateStr)}
                className={`min-h-[110px] sm:min-h-[136px] p-1.5 sm:p-2 transition cursor-pointer flex flex-col justify-between group ${
                  !cell.isCurrentMonth
                    ? 'bg-slate-50/60 text-slate-400'
                    : isSelected
                    ? 'bg-blue-50/40 ring-2 ring-inset ring-[#005BAB]'
                    : hasUrgent
                    ? 'bg-red-50/20 hover:bg-red-50/40'
                    : 'hover:bg-slate-50/80'
                }`}
                title={`Ngày ${cell.dateStr} (Click đúp để tạo Note mới)`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1">
                    <span
                      className={`inline-flex items-center justify-center text-xs font-mono font-bold w-6 h-6 rounded-full ${
                        cell.isToday
                          ? 'bg-[#005BAB] text-white shadow-xs'
                          : isSelected
                          ? 'bg-blue-100 text-[#005BAB]'
                          : cell.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Quick "+" add note icon visible on hover or mobile */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAddNote(cell.dateStr);
                      }}
                      className="opacity-60 group-hover:opacity-100 hover:bg-[#005BAB] hover:text-white text-slate-500 rounded p-0.5 transition cursor-pointer"
                      title="Thêm Note ngày này"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-1">
                    {cell.tasks.length > 0 && (
                      <span
                        className={`text-[9px] sm:text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                          hasUrgentTask
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                        title={`${cell.tasks.length} văn bản có hạn ngày này`}
                      >
                        {cell.tasks.length} VB
                      </span>
                    )}
                    {cell.notes.length > 0 && (
                      <span
                        className={`text-[9px] sm:text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                          hasUrgentNote
                            ? 'bg-red-100 text-red-700'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                        title={`${cell.notes.length} Note ghi chú ngày này`}
                      >
                        {cell.notes.length} Note
                      </span>
                    )}
                  </div>
                </div>

                {/* Items chips inside Day Cell */}
                <div className="space-y-1 flex-1 overflow-hidden">
                  {/* Task Chips */}
                  {cell.tasks.slice(0, 2).map((task) => {
                    const urgency = getUrgencyBadge(task);
                    return (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(cell.dateStr);
                          onEdit(task);
                        }}
                        title={`${task.docNumber}: ${task.title}\nCBKT: ${task.assignee} (${task.progressPercent}%)\nTrạng thái: ${urgency.label}`}
                        className={`px-1.5 py-0.5 rounded-md border text-[11px] leading-tight transition truncate flex items-center justify-between gap-1 ${getCalendarChipStyle(
                          task
                        )}`}
                      >
                        <div className="flex items-center space-x-1 truncate">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${urgency.dotColor}`}
                          />
                          <span className="font-mono truncate font-medium">
                            {task.docNumber}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono opacity-80 shrink-0 hidden sm:inline">
                          {task.progressPercent}%
                        </span>
                      </div>
                    );
                  })}

                  {/* Note Chips */}
                  {cell.notes.slice(0, 2).map((note) => {
                    const days = calculateDaysRemaining(note.dueDate);
                    const isOverdue = !note.completed && days <= 1;
                    const isWarning = !note.completed && days <= 3;
                    return (
                      <div
                        key={note.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(cell.dateStr);
                          handleOpenEditNote(note);
                        }}
                        title={`[Note]: ${note.title}\nHạn: ${note.dueDate}\nCBKT: ${note.assignee || 'Chung'}\nTrạng thái: ${note.completed ? 'Đã hoàn thành' : 'Đang thực hiện'}`}
                        className={`px-1.5 py-0.5 rounded-md border text-[11px] leading-tight transition truncate flex items-center justify-between gap-1 cursor-pointer ${
                          note.completed
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 line-through opacity-75'
                            : isOverdue
                            ? 'bg-red-50 text-red-800 border-red-300 font-semibold'
                            : isWarning
                            ? 'bg-amber-50 text-amber-900 border-amber-300 font-medium'
                            : 'bg-indigo-50 text-indigo-900 border-indigo-200'
                        }`}
                      >
                        <div className="flex items-center space-x-1 truncate">
                          <BookmarkCheck
                            className={`w-3 h-3 shrink-0 ${
                              note.completed
                                ? 'text-emerald-600'
                                : isOverdue
                                ? 'text-red-600'
                                : 'text-indigo-600'
                            }`}
                          />
                          <span className="truncate">{note.title}</span>
                        </div>
                        {note.priority === 'Khẩn cấp' && (
                          <span className="text-[9px] bg-red-600 text-white px-1 rounded-xs shrink-0 font-bold">
                            Khẩn
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {cell.tasks.length + cell.notes.length > 4 && (
                    <div className="text-[10px] font-semibold text-[#005BAB] pl-1 pt-0.5">
                      +{cell.tasks.length + cell.notes.length - 4} mục khác...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Selected Date Detail Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
        {/* Date Section Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <CalendarIcon className="w-5 h-5 text-[#005BAB] shrink-0" />
            <h4 className="text-sm sm:text-base font-bold text-slate-900">
              Chi tiết ngày: {formatVietnameseDateLabel(selectedDate)}
            </h4>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-mono font-semibold text-[#005BAB] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                {selectedDateTasks.length} VB
              </span>
              <span className="text-xs font-mono font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                {selectedDateNotes.length} Note
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleOpenAddNote(selectedDate)}
              className="inline-flex items-center space-x-1.5 bg-[#005BAB] hover:bg-[#004885] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Note ngày này</span>
            </button>

            {selectedDate !== todayStr && (
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className="text-xs text-[#005BAB] hover:underline font-semibold cursor-pointer px-2"
              >
                Về hôm nay ({todayStr})
              </button>
            )}
          </div>
        </div>

        {/* Content list for Selected Date */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* A. NOTES SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                <BookmarkCheck className="w-4 h-4 text-indigo-600" />
                <span>Ghi chú lịch & Việc cần làm ({selectedDateNotes.length})</span>
              </h5>
              <button
                type="button"
                onClick={() => handleOpenAddNote(selectedDate)}
                className="text-xs text-[#005BAB] hover:underline font-medium inline-flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Note</span>
              </button>
            </div>

            {selectedDateNotes.length === 0 ? (
              <div className="p-4 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
                Chưa có Note ghi chú nào đặt vào ngày này.{' '}
                <button
                  type="button"
                  onClick={() => handleOpenAddNote(selectedDate)}
                  className="text-[#005BAB] hover:underline font-semibold"
                >
                  Nhấp vào đây
                </button>{' '}
                hoặc click đúp ô ngày trên lịch để tạo Note.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedDateNotes.map((note) => {
                  const days = calculateDaysRemaining(note.dueDate);
                  const isOverdue = !note.completed && days <= 1;
                  const isWarning = !note.completed && days <= 3;

                  return (
                    <div
                      key={note.id}
                      className={`p-3.5 rounded-xl border transition flex flex-col justify-between gap-2.5 ${
                        note.completed
                          ? 'bg-slate-50 border-slate-200 opacity-80'
                          : isOverdue
                          ? 'bg-red-50/50 border-red-200 shadow-2xs'
                          : isWarning
                          ? 'bg-amber-50/40 border-amber-200'
                          : 'bg-white border-slate-200 shadow-2xs hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => onToggleCompleteNote && onToggleCompleteNote(note.id)}
                            className="mt-0.5 text-slate-400 hover:text-[#005BAB] transition cursor-pointer shrink-0"
                            title={note.completed ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
                          >
                            {note.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-400 hover:text-[#005BAB]" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <h6
                              className={`text-sm font-bold leading-tight ${
                                note.completed ? 'line-through text-slate-500' : 'text-slate-900'
                              }`}
                            >
                              {note.title}
                            </h6>
                            {note.details && (
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                {note.details}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Priority / Urgency Badge */}
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          {note.completed ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Đã xong
                            </span>
                          ) : isOverdue ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 animate-pulse">
                              {days < 0 ? `Quá hạn ${Math.abs(days)}n` : 'Hạn hôm nay'}
                            </span>
                          ) : isWarning ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                              Còn {days} ngày
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                              Còn {days} ngày
                            </span>
                          )}

                          {note.priority && note.priority !== 'Bình thường' && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                note.priority === 'Khẩn cấp'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}
                            >
                              {note.priority}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Note Meta & Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100/80 text-[11px] text-slate-500">
                        <div className="flex items-center space-x-2">
                          <span>
                            Hạn: <strong className="font-mono text-slate-700">{note.dueDate}</strong>
                          </span>
                          {note.assignee && (
                            <>
                              <span>•</span>
                              <span>CBKT: <strong className="text-slate-700">{note.assignee}</strong></span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          {onOpenNoteReminder && (
                            <button
                              type="button"
                              onClick={() => onOpenNoteReminder(note)}
                              className="text-amber-700 hover:text-amber-900 font-semibold flex items-center space-x-1 cursor-pointer"
                              title="Nhắc việc / Sao chép tin nhắn, gửi Viber"
                            >
                              <Send className="w-3 h-3 text-amber-600" />
                              <span>Nhắc việc</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditNote(note)}
                            className="text-[#005BAB] hover:underline font-semibold flex items-center space-x-0.5"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Sửa</span>
                          </button>

                          {userRole === 'admin' && onDeleteNote && (
                            <button
                              type="button"
                              onClick={() => onDeleteNote(note.id)}
                              className="text-red-500 hover:text-red-700 font-semibold flex items-center space-x-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Xóa</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* B. TASK DOCUMENTS SECTION */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-[#005BAB]" />
                <span>Văn bản giao việc có hạn ngày này ({selectedDateTasks.length})</span>
              </h5>
            </div>

            {selectedDateTasks.length === 0 ? (
              <div className="p-4 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
                Không có văn bản nào có hạn hoàn thành vào ngày {selectedDate}.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {selectedDateTasks.map((task) => {
                  const urgency = getUrgencyBadge(task);
                  const isCompleted = task.status === 'Hoàn thành';
                  const lastNote =
                    task.notes && task.notes.length > 0
                      ? task.notes[task.notes.length - 1]
                      : null;

                  return (
                    <div
                      key={task.id}
                      className="p-4 hover:bg-slate-50/80 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      {/* Left: Doc Info */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            onClick={() => onEdit(task)}
                            className="font-mono text-sm font-bold text-[#005BAB] hover:underline cursor-pointer"
                          >
                            {task.docNumber}
                          </span>
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${getPriorityBadge(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${getStatusBadge(
                              task.status
                            )}`}
                          >
                            {task.status}
                          </span>
                          <span
                            className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${urgency.className}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${urgency.dotColor}`} />
                            <span>{urgency.label}</span>
                          </span>
                        </div>

                        <p
                          onClick={() => onEdit(task)}
                          className="text-sm font-semibold text-slate-900 cursor-pointer hover:text-[#005BAB] transition"
                        >
                          {task.title}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
                          <span>
                            CBKT phụ trách: <strong className="text-slate-800">{task.assignee}</strong>
                          </span>
                          {task.department && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>
                                Đơn vị: <strong className="text-slate-700">{task.department}</strong>
                              </span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span>
                            Ngày ban hành: <strong className="font-mono text-slate-700">{task.issueDate}</strong>
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            Hạn báo cáo: <strong className="font-mono text-slate-900">{task.dueDate}</strong>
                          </span>
                        </div>

                        {lastNote && (
                          <div className="text-xs text-slate-600 bg-slate-100/80 rounded-lg px-3 py-1.5 border border-slate-200/80 mt-1">
                            <span className="font-semibold text-slate-700">
                              Ghi chú mới nhất ({lastNote.timestamp}):
                            </span>{' '}
                            {lastNote.content}
                          </div>
                        )}
                      </div>

                      {/* Right: Progress Bar & Action Buttons */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-3 shrink-0">
                        <div className="w-32">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-500">Tiến độ</span>
                            <span className="font-mono font-bold text-slate-800">
                              {task.progressPercent}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                isCompleted ? 'bg-emerald-500' : 'bg-[#005BAB]'
                              }`}
                              style={{ width: `${task.progressPercent}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {!isCompleted && (
                            <button
                              type="button"
                              onClick={() => onQuickComplete(task.id)}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                              title="Báo cáo hoàn thành 100%"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Hoàn thành</span>
                            </button>
                          )}

                          {onOpenTaskReminder && (
                            <button
                              type="button"
                              onClick={() => onOpenTaskReminder(task)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                              title="Nhắc việc / Sao chép tin nhắn, gửi Viber"
                            >
                              <Send className="w-3.5 h-3.5 text-amber-700" />
                              <span>Nhắc việc</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onEdit(task)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#005BAB] border border-blue-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{userRole === 'admin' ? 'Sửa / Tiến độ' : 'Cập nhật'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onDelete(task.id)}
                            className={`p-1.5 rounded-xl border transition cursor-pointer ${
                              userRole === 'admin'
                                ? 'text-red-600 border-red-200 hover:bg-red-50'
                                : 'text-slate-300 border-slate-200 hover:text-amber-600 hover:border-amber-200'
                            }`}
                            title={
                              userRole === 'admin'
                                ? 'Xóa văn bản (Admin)'
                                : 'Chỉ Admin được xóa văn bản'
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Note Edit / Add Modal */}
      <CalendarNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSave={handleSaveNoteModal}
        initialDate={noteModalDate}
        editingNote={editingNote}
        assignees={assignees}
        userRole={userRole}
      />
    </div>
  );
};
