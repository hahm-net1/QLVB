import { TaskDocument } from '../types';
import { calculateDaysRemaining } from './taskUtils';

export type NotificationStatus = 'default' | 'granted' | 'denied' | 'unsupported';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationStatus {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission as NotificationStatus;
}

export async function requestNotificationPermission(): Promise<NotificationStatus> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationStatus;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return Notification.permission as NotificationStatus;
  }
}

export function getNearDueTasks(tasks: TaskDocument[]): { task: TaskDocument; daysRemaining: number }[] {
  return tasks
    .filter((task) => task.status !== 'Hoàn thành')
    .map((task) => ({
      task,
      daysRemaining: calculateDaysRemaining(task.dueDate),
    }))
    .filter((item) => item.daysRemaining <= 1)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export function sendBrowserNotification(
  title: string,
  options: NotificationOptions
): Notification | null {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const notification = new Notification(title, {
      icon: '/icon.svg',
      badge: '/icon.svg',
      requireInteraction: true,
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (err) {
    console.error('Failed to trigger Notification:', err);
    return null;
  }
}

export function notifyTaskDeadline(task: TaskDocument, daysRemaining: number): Notification | null {
  let title = '';
  let urgencyText = '';

  if (daysRemaining < 0) {
    const overdueDays = Math.abs(daysRemaining);
    title = `⚠️ [QUÁ HẠN ${overdueDays} NGÀY] Văn bản: ${task.docNumber}`;
    urgencyText = `Đã quá hạn ${overdueDays} ngày (Hạn: ${task.dueDate})`;
  } else if (daysRemaining === 0) {
    title = `🚨 [HẠN HÔM NAY] Văn bản: ${task.docNumber}`;
    urgencyText = `Hạn chót là HÔM NAY (${task.dueDate})`;
  } else {
    title = `⏰ [SẮP ĐẾN HẠN - CÒN 1 NGÀY] Văn bản: ${task.docNumber}`;
    urgencyText = `Còn 1 ngày nữa đến hạn (${task.dueDate})`;
  }

  const assigneeText = task.assignee ? task.assignee : 'Chưa phân công CBKT';
  const body = `CBKT thực hiện: ${assigneeText}\n${urgencyText}\nTrích yếu: ${task.title.slice(0, 90)}${task.title.length > 90 ? '...' : ''}`;

  return sendBrowserNotification(title, {
    body,
    tag: `task-${task.id}-${daysRemaining}`,
  });
}

/**
 * Scan all tasks and trigger notifications for tasks <= 1 day
 * Keeps track of notified tasks in localStorage per day to avoid spamming
 */
export function checkAndNotifyNearDueTasks(
  tasks: TaskDocument[],
  forceAlert = false
): { notifiedCount: number; urgentTasks: { task: TaskDocument; daysRemaining: number }[] } {
  const urgentTasks = getNearDueTasks(tasks);

  if (urgentTasks.length === 0) {
    return { notifiedCount: 0, urgentTasks: [] };
  }

  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return { notifiedCount: 0, urgentTasks };
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  const storageKey = `vnpt_tasks_notified_${todayKey}`;
  const notifiedIds = new Set<string>();

  if (!forceAlert) {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach((id) => notifiedIds.add(id));
        }
      }
    } catch (e) {
      console.warn('Error reading notified tasks cache', e);
    }
  }

  let notifiedCount = 0;

  urgentTasks.forEach(({ task, daysRemaining }, index) => {
    // If not forcing alert, only notify once per task per day
    if (!forceAlert && notifiedIds.has(task.id)) {
      return;
    }

    // Stagger notifications slightly so the browser doesn't swallow multiple simultaneous alerts
    setTimeout(() => {
      notifyTaskDeadline(task, daysRemaining);
    }, index * 400);

    notifiedIds.add(task.id);
    notifiedCount++;
  });

  try {
    localStorage.setItem(storageKey, JSON.stringify(Array.from(notifiedIds)));
  } catch (e) {}

  return { notifiedCount, urgentTasks };
}
