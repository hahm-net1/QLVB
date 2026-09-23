export interface NoteItem {
  id: string;
  timestamp: string;
  author: string;
  content: string;
}

export type TaskStatus = 'Đang thực hiện' | 'Hoàn thành' | 'Tạm dừng' | 'Chờ duyệt';

export interface TaskDocument {
  id: string;
  docNumber: string; // Số/Ký hiệu VB
  title: string; // Trích yếu nội dung chính
  issueDate: string; // Ngày ban hành (YYYY-MM-DD)
  dueDate: string; // Hạn hoàn thành/báo cáo (YYYY-MM-DD)
  assignee: string; // CBKT chịu trách nhiệm chính
  department?: string; // Phòng ban (e.g. Kế hoạch - Kỹ thuật, Truyền dẫn, Di động...)
  priority: 'Bình thường' | 'Quan trọng' | 'Khẩn cấp';
  status: TaskStatus;
  progressPercent: number; // 0 - 100
  notes: NoteItem[]; // Ghi chú tiến độ
  createdAt: string;
  updatedAt: string;
}

export type UrgencyLevel = 'overdue_or_critical' | 'urgent_3days' | 'warning_5days' | 'normal';

export interface FilterState {
  searchQuery: string;
  status: string;
  assignee: string;
  urgency: string;
  viewMode: 'grid' | 'table';
}
