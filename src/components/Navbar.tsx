import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Plus,
  Download,
  Cloud,
  Database,
  FolderArchive,
  ChevronDown,
  FileSpreadsheet,
  Github,
  ShieldCheck,
  KeyRound,
  UserCheck,
  LogOut as LogOutIcon,
  ScanLine,
  Sparkles,
} from 'lucide-react';
import { TaskDocument, DailyTodoNote, UserRole, AppTab } from '../types';
import { NotificationCenter } from './NotificationCenter';
import { LogIn, LogOut, User as UserIcon, ListTodo } from 'lucide-react';

interface NavbarProps {
  onOpenNewTask: () => void;
  onOpenScanDocument?: () => void;
  onExportExcel: () => void;
  onDownloadZip: () => void;
  onDownloadGitHub?: () => void;
  onOpenBackupModal: () => void;
  totalCount: number;
  tasks: TaskDocument[];
  dailyNotes?: DailyTodoNote[];
  onSelectTask?: (task: TaskDocument) => void;
  onSelectNote?: (note: DailyTodoNote) => void;
  isCloudConnected?: boolean;
  currentUser?: { email: string | null; displayName: string | null; photoURL: string | null } | null;
  onSignInGoogle?: () => void;
  onSignOut?: () => void;
  userRole: UserRole;
  onOpenAdminAuth: () => void;
  onSwitchToGuest: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewTask,
  onOpenScanDocument,
  onExportExcel,
  onDownloadZip,
  onDownloadGitHub,
  onOpenBackupModal,
  totalCount,
  tasks,
  dailyNotes = [],
  onSelectTask,
  onSelectNote,
  isCloudConnected = true,
  currentUser,
  onSignInGoogle,
  onSignOut,
  userRole,
  onOpenAdminAuth,
  onSwitchToGuest,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header className="bg-[#005BAB] text-white shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Title */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-xs font-semibold text-blue-100">
                  VNPT Kỹ thuật
                </span>
                <span className="text-xs text-blue-300 hidden md:inline">•</span>
                <span className="text-xs text-blue-200 hidden md:inline-block">
                  Hệ thống điều hành tác nghiệp
                </span>
              </div>
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-white whitespace-nowrap">
                <span className="sm:hidden font-extrabold tracking-wide">QLVB</span>
                <span className="hidden sm:inline">Quản lý Văn bản & Công việc</span>
              </h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5">
            {/* Role Switcher: Guest vs Admin */}
            {userRole === 'admin' ? (
              <div className="flex items-center bg-amber-500/20 border border-amber-300/50 rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 mr-1 sm:mr-1.5 shrink-0" />
                <span className="font-bold text-amber-100 whitespace-nowrap">
                  <span className="hidden sm:inline">Quyền: </span>Admin
                </span>
                <button
                  type="button"
                  onClick={onSwitchToGuest}
                  className="ml-1.5 sm:ml-2 pl-1.5 sm:pl-2 border-l border-amber-300/40 text-[10px] sm:text-[11px] text-white/90 hover:text-white underline cursor-pointer whitespace-nowrap"
                  title="Thoát quyền Admin, chuyển về chế độ Guest"
                >
                  <span className="hidden sm:inline">Về </span>Guest
                </button>
              </div>
            ) : (
              <div className="flex items-center bg-white/10 border border-white/25 rounded-lg p-0.5 text-xs">
                <span
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 flex items-center space-x-1 text-blue-100 font-medium whitespace-nowrap"
                  title="Nhóm Guest: Được phép cập nhật tiến độ và báo cáo hoàn thành"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span className="hidden xs:inline">Guest</span>
                </span>
                <button
                  type="button"
                  onClick={onOpenAdminAuth}
                  className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-600 text-white px-2 sm:px-2.5 py-1 rounded-md font-semibold transition cursor-pointer whitespace-nowrap shadow-2xs"
                  title="Đăng nhập nhóm Admin"
                >
                  <KeyRound className="w-3 h-3 shrink-0" />
                  <span>Admin</span>
                </button>
              </div>
            )}

            {/* Cloud Sync Active Status (chỉ hiện trên màn hình lớn Desktop) */}
            <div
              className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                isCloudConnected
                  ? 'bg-emerald-600/30 text-emerald-100 border-emerald-400/40'
                  : 'bg-amber-600/30 text-amber-100 border-amber-400/40'
              }`}
              title={
                isCloudConnected
                  ? 'Đang đồng bộ trực tuyến với Firestore Cloud.'
                  : 'Đang kết nối lại đám mây...'
              }
            >
              <Cloud
                className={`w-3.5 h-3.5 ${
                  isCloudConnected ? 'text-emerald-300' : 'text-amber-300'
                }`}
              />
              <span className="whitespace-nowrap">
                {isCloudConnected ? 'Cloud: Bật' : 'Đang kết nối...'}
              </span>
            </div>

            {/* Browser Push & Urgent Notification Center */}
            <NotificationCenter
              tasks={tasks}
              dailyNotes={dailyNotes}
              onSelectTask={onSelectTask}
              onSelectNote={onSelectNote}
            />

            {/* Unified Action Button: Xuất & Sao lưu (Ẩn trên mobile để tối ưu không gian, chỉ hiện trên sm trở lên) */}
            <div className="relative hidden sm:block" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white border border-white/30 px-2.5 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
                title="Xuất Excel, Tải ZIP hoặc Sao lưu dữ liệu"
              >
                <Download className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="hidden md:inline">Sao lưu & Xuất</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-blue-200 transition-transform duration-200 ${
                    isMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Công cụ Sao lưu & Xuất dữ liệu
                    </p>
                  </div>

                  {/* 1. Xuất Excel */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onExportExcel();
                    }}
                    className="w-full px-3.5 py-2.5 flex items-start space-x-3 hover:bg-emerald-50/80 transition text-left group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-emerald-800">
                        Xuất file Excel (.xlsx)
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight">
                        Tải danh sách văn bản và tiến độ xử lý
                      </div>
                    </div>
                  </button>

                  {/* 2. Tải ZIP Netlify */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onDownloadZip();
                    }}
                    className="w-full px-3.5 py-2.5 flex items-start space-x-3 hover:bg-blue-50/80 transition text-left group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#005BAB] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <FolderArchive className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-[#005BAB]">
                        Tải ZIP Netlify (.zip)
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight">
                        Gói đã build sẵn kéo thả lên Netlify Drop
                      </div>
                    </div>
                  </button>

                  {/* 3. Xuất gói GitHub */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (onDownloadGitHub) {
                        onDownloadGitHub();
                      } else {
                        onOpenBackupModal();
                      }
                    }}
                    className="w-full px-3.5 py-2.5 flex items-start space-x-3 hover:bg-slate-100 transition text-left group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <Github className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-black">
                        Xuất gói GitHub (.zip)
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight">
                        Source code + GitHub Actions tự deploy Pages
                      </div>
                    </div>
                  </button>

                  {/* 4. Sao lưu & Khôi phục */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenBackupModal();
                    }}
                    className="w-full px-3.5 py-2.5 flex items-start space-x-3 hover:bg-indigo-50/80 transition text-left group border-t border-slate-100 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-indigo-800">
                        Sao lưu & Khôi phục (.json)
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight">
                        Quản lý backup JSON & hướng dẫn deploy
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Scan Document Button ("Scan VB") */}
            {onOpenScanDocument && (
              <button
                type="button"
                onClick={onOpenScanDocument}
                className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-2.5 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer whitespace-nowrap border border-amber-300/40"
                title="Scan & Trích xuất tự động thông tin văn bản từ Ảnh / PDF / Camera (AI)"
              >
                <ScanLine className="w-4 h-4 text-slate-950" />
                <span className="hidden sm:inline">Scan VB (AI)</span>
                <span className="sm:hidden">Scan</span>
              </button>
            )}

            {/* Add Task Button ("CV mới") */}
            <button
              type="button"
              onClick={onOpenNewTask}
              className="flex items-center space-x-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-md transition active:scale-95 cursor-pointer whitespace-nowrap"
              title={
                userRole === 'admin'
                  ? 'Tạo văn bản / Giao công việc mới'
                  : 'Giao việc mới (Yêu cầu xác thực mật khẩu Admin)'
              }
            >
              <Plus className="w-4 h-4" />
              <span>CV mới</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
