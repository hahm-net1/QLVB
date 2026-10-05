import * as XLSX from 'xlsx';
import { TaskDocument, CalendarNote } from '../types';
import { calculateDaysRemaining } from './taskUtils';

export function exportTasksToExcel(tasks: TaskDocument[], notes: CalendarNote[] = []) {
  // 1. Sheet Van_Ban_Giao_Viec
  const tasksData = tasks.map((task, index) => {
    const latestNote = task.notes.length > 0 ? task.notes[task.notes.length - 1] : null;
    const days = calculateDaysRemaining(task.dueDate);
    let dueStatus = 'Còn nhiều thời gian';
    if (task.status === 'Hoàn thành') {
      dueStatus = 'Đã hoàn thành';
    } else if (days < 0) {
      dueStatus = `Quá hạn ${Math.abs(days)} ngày`;
    } else if (days === 0) {
      dueStatus = 'Hạn hôm nay';
    } else if (days <= 1) {
      dueStatus = 'Còn 1 ngày';
    } else if (days <= 3) {
      dueStatus = `Sắp đến hạn (${days} ngày)`;
    } else if (days <= 5) {
      dueStatus = `Cảnh báo tuần (${days} ngày)`;
    }

    return {
      'STT': index + 1,
      'Số/Ký hiệu VB': task.docNumber,
      'Trích yếu nội dung công việc': task.title,
      'Phòng ban phối hợp': task.department || 'Không có',
      'CBKT Phụ trách': task.assignee,
      'Ngày ban hành': task.issueDate,
      'Hạn hoàn thành/báo cáo': task.dueDate,
      'Cảnh báo hạn': dueStatus,
      'Mức độ ưu tiên': task.priority,
      'Trạng thái': task.status,
      'Tiến độ (%)': `${task.progressPercent}%`,
      'Số lượng ghi chú': task.notes.length,
      'Ghi chú tiến độ gần nhất': latestNote
        ? `[${latestNote.timestamp}] ${latestNote.author}: ${latestNote.content}`
        : 'Chưa có ghi chú',
      'Ngày tạo': task.createdAt,
      'Cập nhật lần cuối': task.updatedAt,
    };
  });

  const taskWorksheet = XLSX.utils.json_to_sheet(tasksData);
  taskWorksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 18 }, // Số VB
    { wch: 45 }, // Trích yếu
    { wch: 22 }, // Phòng ban
    { wch: 28 }, // CBKT
    { wch: 14 }, // Ngày BH
    { wch: 14 }, // Hạn báo cáo
    { wch: 18 }, // Cảnh báo hạn
    { wch: 15 }, // Ưu tiên
    { wch: 15 }, // Trạng thái
    { wch: 12 }, // Tiến độ
    { wch: 12 }, // Số ghi chú
    { wch: 50 }, // Ghi chú mới nhất
    { wch: 20 }, // Ngày tạo
    { wch: 20 }, // Cập nhật
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, taskWorksheet, 'Van_Ban_Giao_Viec');

  // 2. Sheet Ghi_Chu_Lich_Hoan_Thanh (nếu có Notes)
  if (notes.length > 0) {
    const notesData = notes.map((note, index) => {
      const days = calculateDaysRemaining(note.dueDate);
      let dueStatus = 'Bình thường';
      if (note.completed) {
        dueStatus = 'Đã hoàn thành';
      } else if (days < 0) {
        dueStatus = `Quá hạn ${Math.abs(days)} ngày`;
      } else if (days === 0) {
        dueStatus = 'Hạn hôm nay';
      } else if (days <= 1) {
        dueStatus = 'Còn 1 ngày';
      } else if (days <= 3) {
        dueStatus = `Sắp đến hạn (${days} ngày)`;
      } else {
        dueStatus = `Còn ${days} ngày`;
      }

      return {
        'STT': index + 1,
        'Ngày đặt Note': note.noteDate,
        'Hạn hoàn thành/báo cáo': note.dueDate,
        'Nội dung / Tiêu đề Note': note.title,
        'CBKT phụ trách': note.assignee || 'Chưa gán',
        'Mức độ ưu tiên': note.priority || 'Bình thường',
        'Trạng thái': note.completed ? 'Đã hoàn thành' : 'Đang thực hiện',
        'Cảnh báo hạn': dueStatus,
        'Thời điểm hoàn thành': note.completedAt || '',
        'Ghi chú chi tiết / Kết quả': note.details || '',
        'Ngày tạo Note': note.createdAt,
      };
    });

    const notesWorksheet = XLSX.utils.json_to_sheet(notesData);
    notesWorksheet['!cols'] = [
      { wch: 6 },  // STT
      { wch: 14 }, // Ngày Note
      { wch: 14 }, // Hạn hoàn thành
      { wch: 45 }, // Tiêu đề Note
      { wch: 26 }, // CBKT
      { wch: 15 }, // Ưu tiên
      { wch: 18 }, // Trạng thái
      { wch: 18 }, // Cảnh báo hạn
      { wch: 20 }, // Thời điểm xong
      { wch: 45 }, // Ghi chú chi tiết
      { wch: 20 }, // Ngày tạo
    ];

    XLSX.utils.book_append_sheet(workbook, notesWorksheet, 'Ghi_Chu_Lich_Hoan_Thanh');
  }

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  XLSX.writeFile(workbook, `Bao_Cao_Tong_Hop_QLVB_${dateStr}.xlsx`);
}
