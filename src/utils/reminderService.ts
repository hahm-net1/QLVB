import { TaskDocument, CalendarNote } from '../types';
import { calculateDaysRemaining } from './taskUtils';

/**
 * Tạo nội dung tin nhắn nhắc việc / đôn đốc tiến độ chuẩn hóa cho 1 văn bản
 */
export function generateTaskReminderText(task: TaskDocument): string {
  const days = calculateDaysRemaining(task.dueDate);
  let urgencyLabel = '';
  if (task.status === 'Hoàn thành') {
    urgencyLabel = '✅ Đã hoàn thành (100%)';
  } else if (days < 0) {
    urgencyLabel = `🚨 ĐÃ QUÁ HẠN ${Math.abs(days)} NGÀY!`;
  } else if (days === 0) {
    urgencyLabel = '🚨 HẠN CHÓT LÀ HÔM NAY!';
  } else if (days === 1) {
    urgencyLabel = '⚠️ CÒN 1 NGÀY NỮA ĐẾN HẠN!';
  } else if (days <= 3) {
    urgencyLabel = `⏰ Sắp đến hạn (Còn ${days} ngày)`;
  } else {
    urgencyLabel = `⏰ Còn ${days} ngày nữa đến hạn`;
  }

  const lines = [
    `📌 [ĐÔN ĐỐC TIẾN ĐỘ CÔNG VIỆC - VNPT KỸ THUẬT]`,
    `• Số/Ký hiệu: ${task.docNumber}`,
    `• Trích yếu: ${task.title}`,
    `• CBKT phụ trách: ${task.assignee || 'Chưa gán'}`,
  ];

  if (task.department) {
    lines.push(`• Đơn vị/Phòng: ${task.department}`);
  }

  lines.push(`• Hạn báo cáo: ${task.dueDate} (${urgencyLabel})`);
  lines.push(`• Tiến độ hiện tại: ${task.progressPercent}% (${task.status})`);
  lines.push(`• Mức độ ưu tiên: ${task.priority}`);

  if (task.notes && task.notes.length > 0) {
    const lastNote = task.notes[task.notes.length - 1];
    lines.push(`• Ghi chú gần nhất: [${lastNote.timestamp}] ${lastNote.content}`);
  }

  lines.push(`\n👉 Đề nghị đồng chí khẩn trương xử lý, cập nhật tiến độ và báo cáo đúng thời hạn quy định.`);

  return lines.join('\n');
}

/**
 * Tạo nội dung tin nhắn nhắc việc cho Note lịch
 */
export function generateNoteReminderText(note: CalendarNote): string {
  const days = calculateDaysRemaining(note.dueDate);
  let urgencyLabel = '';
  if (note.completed) {
    urgencyLabel = '✅ Đã hoàn thành';
  } else if (days < 0) {
    urgencyLabel = `🚨 ĐÃ QUÁ HẠN ${Math.abs(days)} NGÀY!`;
  } else if (days === 0) {
    urgencyLabel = '🚨 HẠN HOÀN THÀNH LÀ HÔM NAY!';
  } else if (days === 1) {
    urgencyLabel = '⚠️ CÒN 1 NGÀY NỮA ĐẾN HẠN!';
  } else {
    urgencyLabel = `⏰ Còn ${days} ngày nữa đến hạn`;
  }

  const lines = [
    `📌 [NHẮC VIỆC THEO LỊCH CÔNG TÁC - VNPT]`,
    `• Nội dung: ${note.title}`,
  ];

  if (note.assignee) {
    lines.push(`• CBKT thực hiện: ${note.assignee}`);
  }
  lines.push(`• Ngày hẹn: ${note.noteDate}`);
  lines.push(`• Hạn hoàn thành: ${note.dueDate} (${urgencyLabel})`);

  if (note.details) {
    lines.push(`• Chi tiết/Ghi chú: ${note.details}`);
  }
  lines.push(`• Trạng thái: ${note.completed ? 'Đã hoàn thành' : 'Đang thực hiện'}`);
  lines.push(`\n👉 Đề nghị đồng chí lưu ý thực hiện đúng lịch hẹn.`);

  return lines.join('\n');
}

/**
 * Tạo nội dung tổng hợp tất cả các văn bản & note đến hạn hôm nay để gửi nhóm Zalo giao ban
 */
export function generateDailyDigestReminderText(
  urgentTasks: TaskDocument[],
  urgentNotes: CalendarNote[] = []
): string {
  const todayStr = new Date().toISOString().slice(0, 10);
  const lines = [
    `📋 [TỔNG HỢP CÔNG VIỆC CẦN ĐÔN ĐỐC TIẾN ĐỘ - ${todayStr}]`,
    `Hệ thống QLVB kính gửi danh sách các đầu việc cận hạn (≤ 1 ngày) và quá hạn:`,
    ``,
  ];

  if (urgentTasks.length > 0) {
    lines.push(`--- 📄 VĂN BẢN ĐẾN HẠN (${urgentTasks.length}) ---`);
    urgentTasks.forEach((t, i) => {
      const days = calculateDaysRemaining(t.dueDate);
      const tag = days < 0 ? `[QUÁ HẠN ${Math.abs(days)}N]` : days === 0 ? `[HẠN HÔM NAY]` : `[CÒN 1 NGÀY]`;
      lines.push(`${i + 1}. ${tag} ${t.docNumber} - ${t.assignee}: ${t.title} (Tiến độ: ${t.progressPercent}%)`);
    });
    lines.push(``);
  }

  if (urgentNotes.length > 0) {
    lines.push(`--- 📌 NOTE LỊCH ĐẾN HẠN (${urgentNotes.length}) ---`);
    urgentNotes.forEach((n, i) => {
      const days = calculateDaysRemaining(n.dueDate);
      const tag = days < 0 ? `[QUÁ HẠN ${Math.abs(days)}N]` : days === 0 ? `[HẠN HÔM NAY]` : `[CÒN 1 NGÀY]`;
      lines.push(`${i + 1}. ${tag} ${n.assignee ? `(${n.assignee}) ` : ''}${n.title} (Hạn: ${n.dueDate})`);
    });
    lines.push(``);
  }

  lines.push(`👉 Kính đề nghị các đồng chí CBKT rà soát và cập nhật kết quả kịp thời lên hệ thống.`);
  return lines.join('\n');
}

/**
 * Sao chép văn bản vào bộ nhớ tạm
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard API error, trying fallback', err);
  }
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback copy error', err);
    return false;
  }
}

/**
 * Tạo URL mở ứng dụng SMS trên thiết bị di động
 */
export function createSmsUrl(text: string, phoneNumber = ''): string {
  const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
  const encodedBody = encodeURIComponent(text);
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    return cleanPhone ? `sms:${cleanPhone}&body=${encodedBody}` : `sms:&body=${encodedBody}`;
  }
  return cleanPhone ? `sms:${cleanPhone}?body=${encodedBody}` : `sms:?body=${encodedBody}`;
}

/**
 * Tạo URL mở cuộc trò chuyện Zalo với số điện thoại hoặc Zalo Web
 */
export function createZaloChatUrl(phoneNumber = ''): string {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  if (cleanPhone) {
    return `https://zalo.me/${cleanPhone}`;
  }
  return 'https://chat.zalo.me/';
}

/**
 * Tạo URL mở Viber để chuyển tiếp tin nhắn hoặc chat với số điện thoại
 */
export function createViberUrl(text: string, phoneNumber = ''): string {
  const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
  const encodedText = encodeURIComponent(text);
  if (cleanPhone) {
    return `viber://chat?number=${cleanPhone}`;
  }
  return `viber://forward?text=${encodedText}`;
}

/**
 * Tạo URL mở Telegram để gửi tin nhắn
 */
export function createTelegramUrl(text: string): string {
  return `https://t.me/share/url?url=&text=${encodeURIComponent(text)}`;
}

/**
 * Tạo URL mở WhatsApp
 */
export function createWhatsAppUrl(text: string, phoneNumber = ''): string {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(text);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}

/**
 * Kiểm tra trình duyệt có hỗ trợ Web Share API không
 */
export function canWebShare(): boolean {
  return typeof navigator !== 'undefined' && Boolean(navigator.share);
}

/**
 * Chia sẻ qua Web Share API (mở Zalo, Telegram, Messages, Mail...)
 */
export async function shareViaWebShare(title: string, text: string): Promise<boolean> {
  if (canWebShare()) {
    try {
      await navigator.share({
        title,
        text,
      });
      return true;
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        console.warn('Share error', err);
      }
      return false;
    }
  }
  return false;
}
