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
} from 'lucide-react';
import { TaskDocument } from '../types';
import { NotificationCenter } from './NotificationCenter';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  onOpenNewTask: () => void;
  onExportExcel: () => void;
  onDownloadZip: () => void;
  onDownloadGitHub?: () => void;
  onOpenBackupModal: () => void;
  totalCount: number;
  tasks: TaskDocument[];
  onSelectTask?: (task: TaskDocument) => void;
  isCloudConnected?: boolean;
  currentUser?: { email: string | null; displayName: string | null; photoURL: string | null } | null;
  onSignInGoogle?: () => void;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewTask,
  onExportExcel,
  onDownloadZip,
  onDownloadGitHub,
  onOpenBackupModal,
  totalCount,
  tasks,
  onSelectTask,
  isCloudConnected = true,
  currentUser,
  onSignInGoogle,
  onSignOut,
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
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase tracking-wider bg-orange-500 text-white px-2 py-0.5 rounded font-semibold">
                  VNPT Kỹ thuật
                </span>
                <span className="text-xs text-blue-200 hidden sm:inline-block">
                  Hệ thống điều hành tác nghiệp
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Quản lý CV
              </h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Cloud Sync Active Badge */}
            <div
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                isCloudConnected
                  ? 'bg-emerald-600/30 text-emerald-100 border-emerald-400/40'
                  : 'bg-amber-600/30 text-amber-100 border-amber-400/40'
              }`}
              title={
                isCloudConnected
                  ? 'Đang đồng bộ trực tuyến với Firestore Cloud. Mọi dữ liệu đều cập nhật tự động giữa Máy tính & Điện thoại.'
                  : 'Đang kết nối lại đám mây...'
              }
            >
              <Cloud
                className={`w-3.5 h-3.5 ${
                  isCloudConnected ? 'text-emerald-300 animate-pulse' : 'text-amber-300'
                }`}
              />
              <span className="hidden md:inline">
                {isCloudConnected ? 'Đồng bộ Đám mây: Bật' : 'Đang kết nối...'}
              </span>
            </div>

            {/* Google User or Sign In */}
            {currentUser ? (
              <div className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded-lg text-xs transition border border-white/20">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-blue-200" />
                )}
                <span className="max-w-[80px] sm:max-w-[120px] truncate font-medium">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    title="Đăng xuất"
                    className="text-white/70 hover:text-white ml-1 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : onSignInGoogle ? (
              <button
                type="button"
                onClick={onSignInGoogle}
                className="hidden sm:flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
                title="Đăng nhập tài khoản Google để lưu danh tính người ghi chú"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-200" />
                <span>Đăng nhập</span>
              </button>
            ) : null}

            {/* Browser Push & Urgent Notification Center */}
            <NotificationCenter tasks={tasks} onSelectTask={onSelectTask} />

            {/* Unified 3-in-1 Action Button: Xuất & Sao lưu */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white border border-white/30 px-3 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium shadow-sm transition active:scale-95 cursor-pointer"
                title="Xuất Excel, Tải ZIP Netlify hoặc Sao lưu dữ liệu"
              >
                <Download className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Sao lưu & Xuất</span>
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
                    className="w-full px-3.5 py-2.5 flex items-start space-x-3 hover:bg-emerald-50/80 transition text-left group"
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
                    className="w-full px-3.5 py-2.5 flex items-start space-x-3 hover:bg-blue-50/80 transition text-left group"
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
                    className="w-full px-3.5 py-2.5 flex items-start space-x-3 hover:bg-slate-100 transition text-left group"
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
                    className="w-full px-3.5 py-2.5 flex items-start space-x-3 hover:bg-indigo-50/80 transition text-left group border-t border-slate-100"
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

            {/* Add Task Button ("CV mới") */}
            <button
              onClick={onOpenNewTask}
              className="flex items-center space-x-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-md transition active:scale-95"
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
