import { TaskDocument, DailyTodoNote } from '../types';

export function calculateDaysRemaining(dueDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatVietnameseDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  if (isNaN(target.getTime())) return dateStr;

  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const weekdays = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayOfWeek = weekdays[target.getDay()];
  const [y, m, d] = dateStr.split('-');
  const formatted = `${d}/${m}/${y}`;

  if (diffDays === 0) return `Hôm nay • ${dayOfWeek}, ${formatted}`;
  if (diffDays === -1) return `Hôm qua • ${dayOfWeek}, ${formatted}`;
  if (diffDays === 1) return `Ngày mai • ${dayOfWeek}, ${formatted}`;
  return `${dayOfWeek}, ${formatted}`;
}

export function getNoteUrgencyBadge(note: DailyTodoNote) {
  if (note.completed) {
    return {
      label: 'Đã hoàn thành',
      className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      dotColor: 'bg-emerald-500',
      level: 'completed' as const,
    };
  }

  const days = calculateDaysRemaining(note.dueDate);

  if (days < 0) {
    return {
      label: `Quá hạn ${Math.abs(days)} ngày`,
      className: 'bg-red-100 text-red-800 border-red-300 animate-pulse',
      dotColor: 'bg-red-600',
      level: 'overdue' as const,
    };
  } else if (days <= 1) {
    return {
      label: days === 0 ? 'Hạn hôm nay' : 'Còn 1 ngày',
      className: 'bg-red-100 text-red-700 border-red-300',
      dotColor: 'bg-red-600',
      level: 'critical' as const,
    };
  } else if (days <= 3) {
    return {
      label: `Còn ${days} ngày`,
      className: 'bg-orange-100 text-orange-700 border-orange-300',
      dotColor: 'bg-orange-500',
      level: 'warning3' as const,
    };
  } else if (days <= 5) {
    return {
      label: `Còn ${days} ngày`,
      className: 'bg-amber-100 text-amber-700 border-amber-300',
      dotColor: 'bg-amber-500',
      level: 'warning5' as const,
    };
  } else {
    return {
      label: `Còn ${days} ngày`,
      className: 'bg-slate-100 text-slate-700 border-slate-300',
      dotColor: 'bg-blue-500',
      level: 'safe' as const,
    };
  }
}

export function getUrgencyBadge(task: TaskDocument) {
  if (task.status === 'Hoàn thành') {
    return {
      label: 'Đã hoàn thành',
      className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      dotColor: 'bg-emerald-500',
    };
  }

  const days = calculateDaysRemaining(task.dueDate);

  if (days < 0) {
    return {
      label: `Quá hạn ${Math.abs(days)} ngày`,
      className: 'bg-red-100 text-red-800 border-red-300 animate-pulse',
      dotColor: 'bg-red-600',
    };
  } else if (days <= 1) {
    return {
      label: days === 0 ? 'Hạn hôm nay' : 'Còn 1 ngày',
      className: 'bg-red-100 text-red-700 border-red-300',
      dotColor: 'bg-red-600',
    };
  } else if (days <= 3) {
    return {
      label: `Còn ${days} ngày`,
      className: 'bg-orange-100 text-orange-700 border-orange-300',
      dotColor: 'bg-orange-500',
    };
  } else if (days <= 5) {
    return {
      label: `Còn ${days} ngày`,
      className: 'bg-amber-100 text-amber-700 border-amber-300',
      dotColor: 'bg-amber-500',
    };
  } else {
    return {
      label: `Còn ${days} ngày`,
      className: 'bg-slate-100 text-slate-700 border-slate-300',
      dotColor: 'bg-blue-500',
    };
  }
}

export function getPriorityBadge(priority: string) {
  switch (priority) {
    case 'Khẩn cấp':
      return 'bg-red-50 text-red-700 border border-red-200';
    case 'Quan trọng':
      return 'bg-orange-50 text-orange-700 border border-orange-200';
    default:
      return 'bg-blue-50 text-blue-700 border border-blue-200';
  }
}

export function getStatusBadge(status: string) {
  switch (status) {
    case 'Hoàn thành':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'Đang thực hiện':
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'Tạm dừng':
      return 'bg-slate-100 text-slate-600 border border-slate-200';
    case 'Chờ duyệt':
      return 'bg-purple-50 text-purple-700 border border-purple-200';
    default:
      return 'bg-gray-100 text-gray-700 border border-gray-200';
  }
}
