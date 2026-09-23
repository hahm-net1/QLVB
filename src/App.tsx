import React, { useState, useEffect } from 'react';
import { TaskDocument, FilterState, TaskStatus } from './types';
import { MOCK_TASKS } from './data/mockData';
import { calculateDaysRemaining } from './utils/taskUtils';
import { exportTasksToExcel } from './utils/exportExcel';
import { downloadNetlifyZip, downloadGitHubZip } from './utils/downloadZip';
import { Navbar } from './components/Navbar';
import { DashboardStats } from './components/DashboardStats';
import { FilterBar } from './components/FilterBar';
import { TaskCard } from './components/TaskCard';
import { TaskTable } from './components/TaskTable';
import { TaskModal } from './components/TaskModal';
import { FirebaseConfigModal } from './components/FirebaseConfigModal';
import { BackupModal } from './components/BackupModal';
import { FileText, Plus, ShieldCheck, HelpCircle, BellRing, X, RefreshCw } from 'lucide-react';
import {
  getNearDueTasks,
  requestNotificationPermission,
  checkAndNotifyNearDueTasks,
  getNotificationPermission,
} from './utils/notificationService';
import {
  auth,
  subscribeToTasks,
  saveTaskToFirestore,
  deleteTaskFromFirestore,
  seedInitialTasksIfEmpty,
  signInWithGoogle,
  logOut,
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

const LOCAL_STORAGE_KEY = 'vnpt_technical_tasks_v3';

export default function App() {
  const [tasks, setTasks] = useState<TaskDocument[]>(() => {
    // Check v3 storage
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse local storage tasks', e);
      }
    }
    // Clean legacy storage that had old mock CBKT
    try {
      localStorage.removeItem('vnpt_technical_tasks_v2');
      localStorage.removeItem('vnpt_technical_tasks_v1');
    } catch (e) {}

    return MOCK_TASKS;
  });

  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: '',
    status: 'all',
    assignee: 'all',
    urgency: 'all',
    viewMode: 'grid',
  });

  const [dashboardTab, setDashboardTab] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDocument | null>(null);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [isFirebaseActive, setIsFirebaseActive] = useState(true);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [showUrgentBanner, setShowUrgentBanner] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

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
          // If Firestore is completely empty, seed with current local tasks or MOCK_TASKS
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

  // Urgent / Near-due tasks (<= 1 day or overdue)
  const urgentNearDueTasks = getNearDueTasks(tasks);

  const handleEnablePushFromBanner = async () => {
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      const { notifiedCount } = checkAndNotifyNearDueTasks(tasks, true);
      alert(`Đã bật thông báo trình duyệt thành công! Đã gửi ${notifiedCount} cảnh báo.`);
    } else if (permission === 'denied') {
      alert('Trình duyệt đang chặn thông báo. Vui lòng nhấn vào biểu tượng cài đặt/ổ khóa trên thanh địa chỉ để cấp quyền thông báo.');
    }
  };

  // Save to localStorage whenever tasks change as offline fallback
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {}
  }, [tasks]);

  // Extract unique assignees dynamically from actual entered tasks
  const assigneesList = Array.from(
    new Set(
      tasks
        .map((t) => t.assignee?.trim())
        .filter((a): a is string => Boolean(a && a.length > 0))
    )
  );

  // Handlers for Task CRUD
  const handleOpenNewTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: TaskDocument) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa văn bản giao việc này không?')) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      deleteTaskFromFirestore(id).catch((err) => console.error('Delete cloud task failed:', err));
    }
  };

  const handleSaveTask = (taskData: Partial<TaskDocument>, initialNote?: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const authorName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Cán bộ Quản lý';

    if (editingTask) {
      // Edit existing
      const updatedNotes = [...editingTask.notes];
      if (initialNote) {
        updatedNotes.push({
          id: `note-${Date.now()}`,
          timestamp: nowStr,
          author: authorName,
          content: initialNote,
        });
      }
      const updatedTask: TaskDocument = {
        ...editingTask,
        ...taskData,
        notes: updatedNotes,
        updatedAt: new Date().toISOString(),
      } as TaskDocument;

      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? updatedTask : t)));
      saveTaskToFirestore(updatedTask).catch((err) =>
        console.error('Update cloud task failed:', err)
      );
    } else {
      // Create new
      const newTask: TaskDocument = {
        id: `task-${Date.now()}`,
        docNumber: taskData.docNumber || 'VB-001/VNPT-KT',
        title: taskData.title || '',
        issueDate: taskData.issueDate || new Date().toISOString().slice(0, 10),
        dueDate: taskData.dueDate || new Date().toISOString().slice(0, 10),
        assignee: taskData.assignee || assigneesList[0] || 'Chuyên viên kỹ thuật',
        department: taskData.department || 'Phòng Kỹ thuật',
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
    }
  };

  const handleAddNote = (taskId: string, noteContent: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const authorName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Cán bộ Kỹ thuật';
    const newNoteItem = {
      id: `note-${Date.now()}`,
      timestamp: nowStr,
      author: authorName,
      content: noteContent,
    };
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
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
  };

  const handleUpdateStatus = (taskId: string, newStatus: TaskStatus, newProgress: number) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = {
            ...t,
            status: newStatus,
            progressPercent: newProgress,
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
  };

  const handleQuickComplete = (taskId: string) => {
    handleUpdateStatus(taskId, 'Hoàn thành', 100);
  };

  // Filter logic
  const filteredTasks = tasks.filter((task) => {
    // 1. Dashboard Tab filter
    if (dashboardTab === 'inprogress' && task.status !== 'Đang thực hiện') return false;
    if (dashboardTab === 'completed' && task.status !== 'Hoàn thành') return false;
    if (dashboardTab === 'urgent') {
      if (task.status === 'Hoàn thành') return false;
      const days = calculateDaysRemaining(task.dueDate);
      if (days > 1) return false;
    }

    // 2. Status filter dropdown
    if (filterState.status !== 'all' && task.status !== filterState.status) return false;

    // 3. Assignee filter dropdown
    if (filterState.assignee !== 'all' && task.assignee !== filterState.assignee) return false;

    // 4. Urgency filter dropdown
    if (filterState.urgency !== 'all') {
      const days = calculateDaysRemaining(task.dueDate);
      if (filterState.urgency === 'overdue' && (task.status === 'Hoàn thành' || days > 1)) return false;
      if (filterState.urgency === 'warning3' && (task.status === 'Hoàn thành' || days <= 1 || days > 3)) return false;
      if (filterState.urgency === 'warning5' && (task.status === 'Hoàn thành' || days <= 3 || days > 5)) return false;
      if (filterState.urgency === 'safe' && (task.status === 'Hoàn thành' || days <= 5)) return false;
    }

    // 5. Search query
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
    exportTasksToExcel(filteredTasks.length > 0 ? filteredTasks : tasks);
  };

  const handleDownloadZip = () => {
    downloadNetlifyZip(tasks);
  };

  const handleDownloadGitHub = () => {
    downloadGitHubZip(tasks);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenNewTask={handleOpenNewTask}
        onExportExcel={handleExportExcel}
        onDownloadZip={handleDownloadZip}
        onDownloadGitHub={handleDownloadGitHub}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        totalCount={tasks.length}
        tasks={tasks}
        onSelectTask={(task) => handleEditTask(task)}
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
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Statistics Overview */}
        <DashboardStats
          tasks={tasks}
          selectedFilter={dashboardTab}
          onSelectFilter={(tab) => {
            setDashboardTab(tab);
            // Reset status dropdown if switching dashboard tab
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
                  <span>Cảnh báo tiến độ: Có {urgentNearDueTasks.length} văn bản sắp đến hạn (≤ 1 ngày) hoặc quá hạn!</span>
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

        {/* Task List Header / Count */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              Danh sách Văn bản & Công việc Kỹ thuật
            </h2>
            <span className="bg-blue-100 text-[#005BAB] text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {filteredTasks.length} văn bản
            </span>
          </div>

          <button
            onClick={handleOpenNewTask}
            className="sm:hidden flex items-center space-x-1 text-xs bg-[#005BAB] text-white px-3 py-1.5 rounded-lg font-medium shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>CV mới</span>
          </button>
        </div>

        {/* Content View: Grid vs Table */}
        {tasks.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 sm:p-14 text-center border border-slate-200 shadow-sm space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-[#005BAB] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <FileText className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800">Chưa có văn bản / công việc nào</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Toàn bộ dữ liệu CBKT cũ đã được xóa sạch. Hãy bấm nút <strong>"CV mới"</strong> để giao việc và nhập họ tên CBKT thực hiện.
              </p>
            </div>
            <button
              onClick={handleOpenNewTask}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#005BAB] hover:bg-[#004a8b] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition active:scale-95"
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
              onClick={handleResetFilters}
              className="px-4 py-2 bg-[#005BAB] text-white text-xs font-medium rounded-lg hover:bg-[#004a8b] transition inline-block"
            >
              Xóa bộ lọc & Xem tất cả
            </button>
          </div>
        ) : filterState.viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onAddNote={handleAddNote}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>
        ) : (
          <TaskTable
            tasks={filteredTasks}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onQuickComplete={handleQuickComplete}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-medium text-slate-700">
            Hệ thống Quản lý, Phân công & Đôn đốc Văn bản Giao việc Chuyên viên Kỹ thuật (VNPT)
          </p>
          <p>© 2026 VNPT Technical Operations Suite • Responsive PWA Ready</p>
        </div>
      </footer>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        editingTask={editingTask}
        assignees={assigneesList}
      />

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
