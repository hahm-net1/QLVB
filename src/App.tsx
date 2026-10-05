import React, { useState, useEffect } from 'react';
import { TaskDocument, CalendarNote, DailyTodoNote, FilterState, TaskStatus, UserRole, ScannedDocumentData } from './types';
import { MOCK_TASKS } from './data/mockData';
import { calculateDaysRemaining } from './utils/taskUtils';
import { exportTasksToExcel } from './utils/exportExcel';
import { downloadNetlifyZip, downloadGitHubZip } from './utils/downloadZip';
import { Navbar } from './components/Navbar';
import { DashboardStats } from './components/DashboardStats';
import { FilterBar } from './components/FilterBar';
import { TaskTable } from './components/TaskTable';
import { TaskCalendar } from './components/TaskCalendar';
import { TaskModal } from './components/TaskModal';
import { DocumentScanModal } from './components/DocumentScanModal';
import { FirebaseConfigModal } from './components/FirebaseConfigModal';
import { BackupModal } from './components/BackupModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import {
  FileText,
  Plus,
  ShieldCheck,
  BellRing,
  X,
  KeyRound,
  UserCheck,
  Trash2,
  CheckCircle2,
  ListTodo,
  ScanLine,
  Sparkles,
} from 'lucide-react';
import {
  getNearDueTasks,
  getNearDueNotes,
  requestNotificationPermission,
  checkAndNotifyNearDueTasks,
} from './utils/notificationService';
import {
  auth,
  subscribeToTasks,
  saveTaskToFirestore,
  deleteTaskFromFirestore,
  seedInitialTasksIfEmpty,
  subscribeToDailyNotes,
  saveDailyNoteToFirestore,
  deleteDailyNoteFromFirestore,
  signInWithGoogle,
  logOut,
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

const LOCAL_STORAGE_KEY = 'vnpt_technical_tasks_v3';
const DAILY_NOTES_STORAGE_KEY = 'vnpt_daily_todo_notes_v1';
const ROLE_SESSION_KEY = 'vnpt_user_role_session';
const DEFAULT_ADMIN_PASS = '1234';

export default function App() {
  const [tasks, setTasks] = useState<TaskDocument[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse local storage tasks', e);
      }
    }
    try {
      localStorage.removeItem('vnpt_technical_tasks_v2');
      localStorage.removeItem('vnpt_technical_tasks_v1');
    } catch (e) {}

    return MOCK_TASKS;
  });

  const [dailyNotes, setDailyNotes] = useState<DailyTodoNote[]>(() => {
    const saved = localStorage.getItem(DAILY_NOTES_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse local storage daily notes', e);
      }
    }
    return [];
  });
  const [focusedNoteId, setFocusedNoteId] = useState<string | null>(null);
  const [deletingDailyNote, setDeletingDailyNote] = useState<DailyTodoNote | null>(null);

  // Default viewMode is 'table' on main page as requested
  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: '',
    status: 'all',
    assignee: 'all',
    urgency: 'all',
    viewMode: 'table',
  });

  // Role management: 'guest' (default) vs 'admin' (password: 1234)
  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      return sessionStorage.getItem(ROLE_SESSION_KEY) === 'admin' ? 'admin' : 'guest';
    } catch {
      return 'guest';
    }
  });
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [pendingAdminAction, setPendingAdminAction] = useState<{
    label?: string;
    callback?: () => void;
  } | null>(null);

  const [dashboardTab, setDashboardTab] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scannedDataForModal, setScannedDataForModal] = useState<ScannedDocumentData | null>(null);
  const [editingTask, setEditingTask] = useState<TaskDocument | null>(null);
  const [deletingTask, setDeletingTask] = useState<TaskDocument | null>(null);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [isFirebaseActive, setIsFirebaseActive] = useState(true);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [showUrgentBanner, setShowUrgentBanner] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // 1. Listen to Firebase Auth state
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubAuth();
  }, []);

  // 2. Real-time sync with Firebase Firestore across devices
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeToTasks(
      (cloudTasks) => {
        if (!isMounted) return;
        setIsCloudConnected(true);
        if (cloudTasks && cloudTasks.length > 0) {
          setTasks(cloudTasks);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cloudTasks));
          } catch (e) {}
        } else {
          const seedData = tasks.length > 0 ? tasks : MOCK_TASKS;
          seedInitialTasksIfEmpty(seedData).catch((err) =>
            console.warn('Initial seeding error:', err)
          );
        }
      },
      (error) => {
        console.warn('Firestore subscription status:', error);
        setIsCloudConnected(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // 2b. Real-time sync for Daily To-Do Notes with Firestore
  useEffect(() => {
    let isMounted = true;
    const unsubscribeNotes = subscribeToDailyNotes(
      (cloudNotes) => {
        if (!isMounted) return;
        setIsCloudConnected(true);
        if (cloudNotes) {
          setDailyNotes(cloudNotes);
          try {
            localStorage.setItem(DAILY_NOTES_STORAGE_KEY, JSON.stringify(cloudNotes));
          } catch (e) {}
        }
      },
      (error) => {
        console.warn('Firestore daily_notes subscription status:', error);
      }
    );

    return () => {
      isMounted = false;
      unsubscribeNotes();
    };
  }, []);

  // Urgent / Near-due tasks & notes (<= 1 day or overdue)
  const urgentNearDueTasks = getNearDueTasks(tasks);
  const urgentNearDueNotes = getNearDueNotes(dailyNotes);

  const handleEnablePushFromBanner = async () => {
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      const { notifiedCount } = checkAndNotifyNearDueTasks(tasks, true, dailyNotes);
      showToast(`Đã bật thông báo trình duyệt! Đã gửi ${notifiedCount} cảnh báo.`);
    } else if (permission === 'denied') {
      showToast('Trình duyệt đang chặn thông báo. Vui lòng cấp quyền trên thanh địa chỉ.');
    }
  };

  // Save to localStorage whenever tasks or dailyNotes change as offline fallback
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {}
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(DAILY_NOTES_STORAGE_KEY, JSON.stringify(dailyNotes));
    } catch (e) {}
  }, [dailyNotes]);

  // Extract unique assignees dynamically from actual entered tasks
  const assigneesList = Array.from(
    new Set(
      tasks
        .map((t) => t.assignee?.trim())
        .filter((a): a is string => Boolean(a && a.length > 0))
    )
  );

  // Role switching handlers
  const handleRequireAdmin = (label?: string, callback?: () => void) => {
    setPendingAdminAction({ label, callback });
    setIsAdminAuthOpen(true);
  };

  const handleAdminAuthSuccess = () => {
    setUserRole('admin');
    try {
      sessionStorage.setItem(ROLE_SESSION_KEY, 'admin');
    } catch {}
    showToast('Đã đăng nhập quyền Admin (Full quyền quản trị & xóa văn bản)');
    if (pendingAdminAction?.callback) {
      pendingAdminAction.callback();
    }
    setPendingAdminAction(null);
  };

  const handleSwitchToGuest = () => {
    setUserRole('guest');
    try {
      sessionStorage.removeItem(ROLE_SESSION_KEY);
    } catch {}
    showToast('Đã chuyển về nhóm Guest (Cập nhật tiến độ & Báo cáo hoàn thành)');
  };

  // Handlers for Task CRUD
  const handleOpenNewTask = () => {
    setScannedDataForModal(null);
    if (userRole !== 'admin') {
      handleRequireAdmin('Giao văn bản / Tạo công việc mới', () => {
        setEditingTask(null);
        setScannedDataForModal(null);
        setIsModalOpen(true);
      });
      return;
    }
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenScanModal = () => {
    setIsScanModalOpen(true);
  };

  const saveScannedTaskDirectly = (scanned: ScannedDocumentData) => {
    const authorName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Admin';
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const parsedIssuer = scanned.docIssuer || scanned.fullDocNumber.split('/')[1] || 'P.KT';
    const parsedNum = scanned.docCodeNum || scanned.fullDocNumber.split('/')[0] || '101';
    const finalDocNumber = scanned.fullDocNumber || `${parsedNum}/${parsedIssuer}`;
    const coopDept =
      scanned.department && scanned.department.toLowerCase() !== parsedIssuer.toLowerCase()
        ? scanned.department
        : '';

    const newTask: TaskDocument = {
      id: `task-${Date.now()}`,
      docNumber: finalDocNumber,
      title: scanned.title || 'Văn bản được quét tự động',
      issueDate: scanned.issueDate || new Date().toISOString().slice(0, 10),
      dueDate: scanned.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      assignee: scanned.assignee || 'CBKT P.KT',
      department: coopDept,
      priority: scanned.priority || 'Bình thường',
      status: 'Đang thực hiện',
      progressPercent: 0,
      notes: scanned.notes
        ? [
            {
              id: `note-${Date.now()}`,
              timestamp: nowStr,
              author: authorName,
              content: `[Quét AI tự động]: ${scanned.notes}`,
            },
          ]
        : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);
    saveTaskToFirestore(newTask).catch((err) => console.error('Save cloud task failed:', err));
    showToast(`Đã thêm văn bản ${newTask.docNumber} từ kết quả quét AI!`);
  };

  const handleApplyScannedData = (scanned: ScannedDocumentData, saveDirectly: boolean = false) => {
    if (saveDirectly) {
      if (userRole !== 'admin') {
        handleRequireAdmin('Lưu văn bản mới được quét vào danh sách', () => {
          saveScannedTaskDirectly(scanned);
        });
        return;
      }
      saveScannedTaskDirectly(scanned);
    } else {
      if (userRole !== 'admin') {
        handleRequireAdmin('Tạo văn bản và giao việc mới từ dữ liệu quét', () => {
          setEditingTask(null);
          setScannedDataForModal(scanned);
          setIsModalOpen(true);
        });
        return;
      }
      setEditingTask(null);
      setScannedDataForModal(scanned);
      setIsModalOpen(true);
    }
  };

  const handleEditTask = (task: TaskDocument) => {
    setScannedDataForModal(null);
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleRequestDeleteTask = (id: string) => {
    if (userRole !== 'admin') {
      handleRequireAdmin('Xóa văn bản trong danh sách (Chỉ Admin mới được xóa)');
      return;
    }
    const target = tasks.find((t) => t.id === id);
    if (target) {
      setDeletingTask(target);
    }
  };

  const handleConfirmDeleteTask = () => {
    if (!deletingTask || userRole !== 'admin') return;
    const id = deletingTask.id;
    const docNum = deletingTask.docNumber;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setDeletingTask(null);
    deleteTaskFromFirestore(id).catch((err) => console.error('Delete cloud task failed:', err));
    showToast(`Đã xóa văn bản ${docNum} khỏi danh sách.`);
  };

  const handleSaveTask = (taskData: Partial<TaskDocument>, initialNote?: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    if (editingTask) {
      const authorName =
        currentUser?.displayName ||
        currentUser?.email?.split('@')[0] ||
        (userRole === 'admin' ? 'Admin' : `CBKT (${editingTask.assignee})`);

      const updatedNotes = [...editingTask.notes];
      if (initialNote) {
        updatedNotes.push({
          id: `note-${Date.now()}`,
          timestamp: nowStr,
          author: authorName,
          content: initialNote,
        });
      }

      // Enforce permissions: Guest can only update status, progressPercent, and notes
      const safeTaskPatch: Partial<TaskDocument> =
        userRole === 'admin'
          ? taskData
          : {
              status: taskData.status ?? editingTask.status,
              progressPercent: taskData.progressPercent ?? editingTask.progressPercent,
            };

      const updatedTask: TaskDocument = {
        ...editingTask,
        ...safeTaskPatch,
        notes: updatedNotes,
        updatedAt: new Date().toISOString(),
      } as TaskDocument;

      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? updatedTask : t)));
      saveTaskToFirestore(updatedTask).catch((err) =>
        console.error('Update cloud task failed:', err)
      );
      showToast(
        userRole === 'admin'
          ? `Đã lưu cập nhật văn bản ${updatedTask.docNumber}`
          : `Đã cập nhật tiến độ (${updatedTask.progressPercent}%) cho văn bản ${updatedTask.docNumber}`
      );
    } else {
      // Only Admin can create new task
      if (userRole !== 'admin') return;
      const authorName =
        currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Admin';

      const newTask: TaskDocument = {
        id: `task-${Date.now()}`,
        docNumber: taskData.docNumber || 'VB-001/VNPT-KT',
        title: taskData.title || '',
        issueDate: taskData.issueDate || new Date().toISOString().slice(0, 10),
        dueDate: taskData.dueDate || new Date().toISOString().slice(0, 10),
        assignee: taskData.assignee || assigneesList[0] || 'Chuyên viên kỹ thuật',
        department: taskData.department || 'P.KT',
        priority: taskData.priority || 'Bình thường',
        status: taskData.status || 'Đang thực hiện',
        progressPercent: taskData.progressPercent ?? 0,
        notes: initialNote
          ? [
              {
                id: `note-${Date.now()}`,
                timestamp: nowStr,
                author: authorName,
                content: initialNote,
              },
            ]
          : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
      saveTaskToFirestore(newTask).catch((err) =>
        console.error('Save cloud task failed:', err)
      );
      showToast(`Đã tạo văn bản mới ${newTask.docNumber}`);
    }
  };

  const handleAddNote = (taskId: string, noteContent: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const authorName =
            currentUser?.displayName ||
            currentUser?.email?.split('@')[0] ||
            (userRole === 'admin' ? 'Admin' : `CBKT (${t.assignee})`);
          const newNoteItem = {
            id: `note-${Date.now()}`,
            timestamp: nowStr,
            author: authorName,
            content: noteContent,
          };
          const updated = {
            ...t,
            notes: [...t.notes, newNoteItem],
            updatedAt: new Date().toISOString(),
          };
          saveTaskToFirestore(updated).catch((err) =>
            console.error('Add note to cloud failed:', err)
          );
          return updated;
        }
        return t;
      })
    );
    showToast('Đã lưu ghi chú tiến độ mới');
  };

  const handleUpdateStatus = (taskId: string, newStatus: TaskStatus, newProgress: number) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const authorName =
            currentUser?.displayName ||
            currentUser?.email?.split('@')[0] ||
            (userRole === 'admin' ? 'Admin' : `CBKT (${t.assignee})`);
          const autoNote =
            newStatus === 'Hoàn thành'
              ? [
                  ...t.notes,
                  {
                    id: `note-${Date.now()}`,
                    timestamp: nowStr,
                    author: authorName,
                    content: 'Báo cáo hoàn thành công việc (100%).',
                  },
                ]
              : t.notes;

          const updated = {
            ...t,
            status: newStatus,
            progressPercent: newProgress,
            notes: autoNote,
            updatedAt: new Date().toISOString(),
          };
          saveTaskToFirestore(updated).catch((err) =>
            console.error('Update status in cloud failed:', err)
          );
          return updated;
        }
        return t;
      })
    );
    if (newStatus === 'Hoàn thành') {
      showToast('Đã báo cáo hoàn thành văn bản (100%)!');
    }
  };

  const handleQuickComplete = (taskId: string) => {
    handleUpdateStatus(taskId, 'Hoàn thành', 100);
  };

  // Handlers for Daily To-Do Notes CRUD
  const handleAddDailyNote = (
    noteData: Omit<DailyTodoNote, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const nowIso = new Date().toISOString();
    const newNote: DailyTodoNote = {
      ...noteData,
      id: `dnote-${Date.now()}`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setDailyNotes((prev) => [newNote, ...prev]);
    saveDailyNoteToFirestore(newNote).catch((err) =>
      console.error('Save cloud daily note failed:', err)
    );
    showToast(`Đã thêm Note công việc ngày ${newNote.noteDate} vào To-Do List`);
  };

  const handleToggleDailyNoteComplete = (noteId: string) => {
    const nowDisplay = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setDailyNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId) {
          const nextCompleted = !n.completed;
          const updated: DailyTodoNote = {
            ...n,
            completed: nextCompleted,
            completedAt: nextCompleted ? nowDisplay : '',
            updatedAt: new Date().toISOString(),
          };
          saveDailyNoteToFirestore(updated).catch((err) =>
            console.error('Toggle daily note in cloud failed:', err)
          );
          return updated;
        }
        return n;
      })
    );
    showToast('Đã cập nhật trạng thái hoàn thành Note To-Do');
  };

  const handleUpdateDailyNote = (noteId: string, updatedFields: Partial<DailyTodoNote>) => {
    setDailyNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId) {
          const updated: DailyTodoNote = {
            ...n,
            ...updatedFields,
            updatedAt: new Date().toISOString(),
          };
          saveDailyNoteToFirestore(updated).catch((err) =>
            console.error('Update daily note in cloud failed:', err)
          );
          return updated;
        }
        return n;
      })
    );
    showToast('Đã lưu cập nhật nội dung & hạn hoàn thành Note');
  };

  const handleRequestDeleteDailyNote = (noteId: string) => {
    if (userRole !== 'admin') {
      handleRequireAdmin('Xóa mục Note trong danh sách To-Do (Chỉ Admin mới được xóa)');
      return;
    }
    const target = dailyNotes.find((n) => n.id === noteId);
    if (target) {
      setDeletingDailyNote(target);
    }
  };

  const handleConfirmDeleteDailyNote = () => {
    if (!deletingDailyNote || userRole !== 'admin') return;
    const id = deletingDailyNote.id;
    setDailyNotes((prev) => prev.filter((n) => n.id !== id));
    setDeletingDailyNote(null);
    deleteDailyNoteFromFirestore(id).catch((err) =>
      console.error('Delete cloud daily note failed:', err)
    );
    showToast('Đã xóa mục Note khỏi danh sách To-Do.');
  };

  // Filter logic
  const filteredTasks = tasks.filter((task) => {
    if (dashboardTab === 'inprogress' && task.status !== 'Đang thực hiện') return false;
    if (dashboardTab === 'completed' && task.status !== 'Hoàn thành') return false;
    if (dashboardTab === 'urgent') {
      if (task.status === 'Hoàn thành') return false;
      const days = calculateDaysRemaining(task.dueDate);
      if (days > 1) return false;
    }

    if (filterState.status !== 'all' && task.status !== filterState.status) return false;
    if (filterState.assignee !== 'all' && task.assignee !== filterState.assignee) return false;

    if (filterState.urgency !== 'all') {
      const days = calculateDaysRemaining(task.dueDate);
      if (filterState.urgency === 'overdue' && (task.status === 'Hoàn thành' || days > 1)) return false;
      if (filterState.urgency === 'warning3' && (task.status === 'Hoàn thành' || days <= 1 || days > 3)) return false;
      if (filterState.urgency === 'warning5' && (task.status === 'Hoàn thành' || days <= 3 || days > 5)) return false;
      if (filterState.urgency === 'safe' && (task.status === 'Hoàn thành' || days <= 5)) return false;
    }

    if (filterState.searchQuery.trim()) {
      const query = filterState.searchQuery.toLowerCase();
      const matchDoc = task.docNumber.toLowerCase().includes(query);
      const matchTitle = task.title.toLowerCase().includes(query);
      const matchAssignee = task.assignee.toLowerCase().includes(query);
      const matchDept = (task.department || '').toLowerCase().includes(query);
      if (!matchDoc && !matchTitle && !matchAssignee && !matchDept) return false;
    }

    return true;
  });

  const handleResetFilters = () => {
    setFilterState({
      searchQuery: '',
      status: 'all',
      assignee: 'all',
      urgency: 'all',
      viewMode: filterState.viewMode,
    });
    setDashboardTab('all');
  };

  const handleExportExcel = () => {
    exportTasksToExcel(filteredTasks.length > 0 ? filteredTasks : tasks, dailyNotes);
  };

  const handleDownloadZip = () => {
    downloadNetlifyZip(tasks);
  };

  const handleDownloadGitHub = () => {
    downloadGitHubZip(tasks);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center space-x-2.5 text-xs sm:text-sm font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onOpenNewTask={handleOpenNewTask}
        onOpenScanDocument={handleOpenScanModal}
        onExportExcel={handleExportExcel}
        onDownloadZip={handleDownloadZip}
        onDownloadGitHub={handleDownloadGitHub}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        totalCount={tasks.length}
        tasks={tasks}
        dailyNotes={dailyNotes}
        onSelectTask={(task) => {
          handleEditTask(task);
        }}
        onSelectNote={(note) => {
          setFilterState((prev) => ({ ...prev, viewMode: 'calendar' }));
        }}
        isCloudConnected={isCloudConnected}
        currentUser={
          currentUser
            ? {
                displayName: currentUser.displayName,
                email: currentUser.email,
                photoURL: currentUser.photoURL,
              }
            : null
        }
        onSignInGoogle={() => signInWithGoogle().catch(console.error)}
        onSignOut={() => logOut().catch(console.error)}
        userRole={userRole}
        onOpenAdminAuth={() => handleRequireAdmin()}
        onSwitchToGuest={handleSwitchToGuest}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Sub-header Bar with Overview and Role Permission Status */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#005BAB]/10 text-[#005BAB] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Quản lý Điều hành Văn bản & Lịch Hoàn Thành
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Hệ thống đôn đốc hạn xử lý • Thống kê {tasks.length} văn bản & {dailyNotes.length} note lịch
              </p>
            </div>
          </div>

          {/* Current Permission Group Indicator */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            {userRole === 'admin' ? (
              <div className="inline-flex items-center space-x-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  Quyền <strong>Admin</strong> (Toàn quyền quản trị & xóa)
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center space-x-2 text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
                <UserCheck className="w-3.5 h-3.5 text-[#005BAB] shrink-0" />
                <span>
                  Nhóm <strong>Guest</strong>: Cập nhật tiến độ & Báo cáo hoàn thành
                </span>
                <button
                  type="button"
                  onClick={() => handleRequireAdmin()}
                  className="text-[#005BAB] hover:underline font-semibold inline-flex items-center space-x-1 pl-1.5 border-l border-slate-200 cursor-pointer"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Đăng nhập Admin</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Statistics Overview */}
        <DashboardStats
          tasks={tasks}
          selectedFilter={dashboardTab}
          onSelectFilter={(tab) => {
            setDashboardTab(tab);
            if (tab === 'inprogress') setFilterState((prev) => ({ ...prev, status: 'Đang thực hiện' }));
            else if (tab === 'completed') setFilterState((prev) => ({ ...prev, status: 'Hoàn thành' }));
            else setFilterState((prev) => ({ ...prev, status: 'all' }));
          }}
        />

            {/* Urgent Task Notification Banner (<= 1 ngày) */}
            {urgentNearDueTasks.length > 0 && showUrgentBanner && (
              <div className="mb-5 bg-gradient-to-r from-amber-50 to-red-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-start space-x-3">
                  <div className="p-2.5 bg-red-100 text-red-600 rounded-xl shrink-0 mt-0.5 shadow-xs">
                    <BellRing className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-red-950 flex items-center space-x-2">
                      <span>
                        Cảnh báo tiến độ: Có {urgentNearDueTasks.length} văn bản sắp đến hạn (≤ 1 ngày) hoặc quá hạn!
                      </span>
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Đã kích hoạt hệ thống đôn đốc. Nhấp vào biểu tượng chuông thông báo trên thanh menu hoặc bật Thông báo đẩy trình duyệt để nhận nhắc nhở tự động.
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0 justify-end">
                  <button
                    type="button"
                    onClick={handleEnablePushFromBanner}
                    className="px-3.5 py-2 bg-[#005BAB] hover:bg-[#004885] text-white text-xs font-semibold rounded-xl shadow-sm transition active:scale-95 whitespace-nowrap cursor-pointer"
                  >
                    Bật thông báo đẩy
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUrgentBanner(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
                    title="Đóng thông báo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Filter Bar & Search */}
            <FilterBar
              filterState={filterState}
              onFilterChange={(newF) => setFilterState((prev) => ({ ...prev, ...newF }))}
              assignees={assigneesList}
              onResetFilters={handleResetFilters}
            />

            {/* Task List Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 px-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-800">
                  Danh sách Văn bản & Công việc Kỹ thuật
                </h2>
                <span className="text-xs font-mono tabular-nums font-semibold text-[#005BAB] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                  {filteredTasks.length} văn bản
                </span>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleOpenScanModal}
                  className="sm:hidden flex items-center space-x-1 text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 px-2.5 py-1.5 rounded-lg font-bold shadow cursor-pointer whitespace-nowrap active:scale-95"
                  title="Scan & Trích xuất tự động văn bản (AI)"
                >
                  <ScanLine className="w-3.5 h-3.5" />
                  <span>Scan</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenNewTask}
                  className="sm:hidden flex items-center space-x-1 text-xs bg-[#005BAB] text-white px-3 py-1.5 rounded-lg font-medium shadow cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>CV mới</span>
                </button>
              </div>
            </div>

            {/* Content View: Only Table (default) & Calendar */}
            {filterState.viewMode === 'calendar' ? (
              <TaskCalendar
                tasks={filteredTasks}
                calendarNotes={dailyNotes}
                userRole={userRole}
                assignees={assigneesList}
                onEdit={handleEditTask}
                onDelete={handleRequestDeleteTask}
                onQuickComplete={handleQuickComplete}
                onAddNote={handleAddDailyNote}
                onUpdateNote={handleUpdateDailyNote}
                onDeleteNote={handleRequestDeleteDailyNote}
                onToggleCompleteNote={handleToggleDailyNoteComplete}
              />
            ) : tasks.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 sm:p-14 text-center border border-slate-200 shadow-sm space-y-4">
                <div className="w-16 h-16 bg-blue-50 text-[#005BAB] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-800">Chưa có văn bản / công việc nào</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    Hãy bấm nút <strong>"CV mới"</strong> để giao việc và nhập họ tên CBKT thực hiện.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenNewTask}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#005BAB] hover:bg-[#004a8b] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo CV mới ngay</span>
                </button>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
                <div className="w-16 h-16 bg-blue-50 text-[#005BAB] rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Không tìm thấy văn bản nào</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Không có văn bản hoặc công việc nào khớp với từ khóa tìm kiếm và bộ lọc hiện tại của bạn.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-[#005BAB] text-white text-xs font-medium rounded-lg hover:bg-[#004a8b] transition inline-block cursor-pointer"
                >
                  Xóa bộ lọc & Xem tất cả
                </button>
              </div>
            ) : (
              <TaskTable
                tasks={filteredTasks}
                userRole={userRole}
                onEdit={handleEditTask}
                onDelete={handleRequestDeleteTask}
                onQuickComplete={handleQuickComplete}
              />
            )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          {/* Tiện ích Xuất & Sao lưu phụ trợ cho chế độ Mobile */}
          <div className="flex sm:hidden items-center justify-center space-x-3 pb-2 text-xs text-[#005BAB] font-semibold border-b border-slate-100">
            <button
              type="button"
              onClick={handleExportExcel}
              className="hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>Xuất Excel</span>
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={() => setIsBackupModalOpen(true)}
              className="hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>Sao lưu dữ liệu</span>
            </button>
          </div>
          <p className="font-medium text-slate-700">
            Hệ thống Quản lý, Phân công & Đôn đốc Văn bản Giao việc Chuyên viên Kỹ thuật (VNPT)
          </p>
          <p>© 2026 VNPT Technical Operations Suite • Phân quyền Guest & Admin</p>
        </div>
      </footer>

      {/* Task Modal (Supports both Guest progress update and Admin full edit) */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setScannedDataForModal(null);
        }}
        onSave={handleSaveTask}
        editingTask={editingTask}
        scannedData={scannedDataForModal}
        onOpenScan={() => {
          setIsModalOpen(false);
          setIsScanModalOpen(true);
        }}
        assignees={assigneesList}
        userRole={userRole}
        onRequestAdmin={() => {
          handleRequireAdmin('Mở quyền Admin để chỉnh sửa thông tin văn bản gốc');
        }}
      />

      {/* AI Document Scan Modal (Images, PDFs, Camera, Text) */}
      <DocumentScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onApplyScannedData={handleApplyScannedData}
        assignees={assigneesList}
      />

      {/* Admin Password Login Modal (Default pass: 1234) */}
      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => {
          setIsAdminAuthOpen(false);
          setPendingAdminAction(null);
        }}
        onSuccess={handleAdminAuthSuccess}
        adminPassword={DEFAULT_ADMIN_PASS}
        pendingActionLabel={pendingAdminAction?.label}
      />

      {/* Custom Delete Confirmation Modal (Admin Only) */}
      {deletingTask && userRole === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-bold">Xác nhận xóa văn bản (Admin)</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeletingTask(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-700">
                Bạn có chắc chắn muốn xóa văn bản{' '}
                <strong className="font-mono text-[#005BAB]">{deletingTask.docNumber}</strong> ra khỏi danh sách không?
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
                <div className="font-semibold text-slate-800 line-clamp-2">{deletingTask.title}</div>
                <div className="mt-1 text-slate-500">CBKT phụ trách: {deletingTask.assignee}</div>
              </div>
              <div className="pt-2 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setDeletingTask(null)}
                  className="px-4 py-2 text-xs sm:text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteTask}
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs sm:text-sm text-white bg-red-600 hover:bg-red-700 rounded-xl font-semibold shadow-sm transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa văn bản</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal for Daily Note (Admin Only) */}
      {deletingDailyNote && userRole === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-bold">Xác nhận xóa Note công việc (Admin)</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeletingDailyNote(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-700">
                Bạn có chắc chắn muốn xóa mục Note công việc ngày{' '}
                <strong className="font-mono text-[#005BAB]">{deletingDailyNote.noteDate}</strong> khỏi danh sách To-Do không?
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
                <div className="font-semibold text-slate-800 line-clamp-2">{deletingDailyNote.title}</div>
                <div className="mt-1 text-slate-500">Hạn hoàn thành: {deletingDailyNote.dueDate}</div>
              </div>
              <div className="pt-2 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setDeletingDailyNote(null)}
                  className="px-4 py-2 text-xs sm:text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteDailyNote}
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs sm:text-sm text-white bg-red-600 hover:bg-red-700 rounded-xl font-semibold shadow-sm transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa Note</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Firebase / Cloud Config Modal */}
      <FirebaseConfigModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
        isFirebaseActive={isFirebaseActive}
        onToggleFirebase={(active) => setIsFirebaseActive(active)}
      />

      {/* Backup & Netlify Guide Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        tasks={tasks}
        onRestoreTasks={(restored) => {
          setTasks(restored);
          for (const t of restored) {
            saveTaskToFirestore(t).catch(console.error);
          }
        }}
      />
    </div>
  );
}
