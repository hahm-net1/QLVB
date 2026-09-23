import * as XLSX from 'xlsx';
import { TaskDocument } from '../types';

export function exportTasksToExcel(tasks: TaskDocument[]) {
  const dataToExport = tasks.map((task, index) => {
    const latestNote = task.notes.length > 0 ? task.notes[task.notes.length - 1] : null;
    return {
      'STT': index + 1,
      'Số/Ký hiệu VB': task.docNumber,
      'Trích yếu nội dung công việc': task.title,
      'Phòng ban': task.department || 'N/A',
      'CBKT Phụ trách': task.assignee,
      'Ngày ban hành': task.issueDate,
      'Hạn hoàn thành/báo cáo': task.dueDate,
      'Mức độ ưu tiên': task.priority,
      'Trạng thái': task.status,
      'Tiến độ (%)': `${task.progressPercent}%`,
      'Số lượng ghi chú': task.notes.length,
      'Ghi chú tiến độ gần nhất': latestNote ? `[${latestNote.timestamp}] ${latestNote.author}: ${latestNote.content}` : 'Chưa có ghi chú',
      'Ngày tạo': task.createdAt,
      'Cập nhật lần cuối': task.updatedAt,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);

  // Set column widths for better readability
  const colWidths = [
    { wch: 6 },  // STT
    { wch: 18 }, // Số VB
    { wch: 45 }, // Trích yếu
    { wch: 22 }, // Phòng ban
    { wch: 30 }, // CBKT
    { wch: 14 }, // Ngày BH
    { wch: 14 }, // Hạn báo cáo
    { wch: 15 }, // Ưu tiên
    { wch: 15 }, // Trạng thái
    { wch: 12 }, // Tiến độ
    { wch: 12 }, // Số ghi chú
    { wch: 50 }, // Ghi chú mới nhất
    { wch: 20 }, // Ngày tạo
    { wch: 20 }, // Cập nhật
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bao_Cao_Giao_Viec');

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  XLSX.writeFile(workbook, `Bao_Cao_Van_Ban_Giao_Viec_${dateStr}.xlsx`);
}
