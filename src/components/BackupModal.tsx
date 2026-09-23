import React, { useRef, useState } from 'react';
import {
  X,
  Download,
  Upload,
  Database,
  Globe,
  CheckCircle,
  FolderArchive,
  ExternalLink,
  Github,
  GitBranch,
  Copy,
  Terminal,
  FileCode,
} from 'lucide-react';
import { TaskDocument } from '../types';
import { downloadNetlifyZip, downloadGitHubZip } from '../utils/downloadZip';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskDocument[];
  onRestoreTasks: (tasks: TaskDocument[]) => void;
  initialTab?: 'github' | 'netlify' | 'backup';
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onRestoreTasks,
  initialTab = 'github',
}) => {
  const [activeTab, setActiveTab] = useState<'github' | 'netlify' | 'backup'>(initialTab);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadNetlify = () => {
    downloadNetlifyZip(tasks);
  };

  const handleDownloadGitHub = () => {
    downloadGitHubZip(tasks);
  };

  // Export JSON Backup
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `quan_ly_cv_backup_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import JSON Restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          if (
            window.confirm(
              `Xác nhận khôi phục ${json.length} công việc từ file backup? Dữ liệu hiện tại sẽ được cập nhật.`
            )
          ) {
            onRestoreTasks(json);
            alert('Khôi phục dữ liệu thành công!');
            onClose();
          }
        } else {
          alert('File JSON không đúng định dạng dữ liệu công việc.');
        }
      } catch (err) {
        alert('Lỗi khi đọc file JSON: ' + err);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyGitCommands = () => {
    const commands = `git init\ngit add .\ngit commit -m "Deploy Quan ly CV VNPT"\ngit branch -M main\ngit remote add origin https://github.com/<username>/<repo-name>.git\ngit push -u origin main`;
    navigator.clipboard.writeText(commands);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="bg-[#005BAB] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Github className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Xuất Dữ Liệu & Triển Khai Website</h2>
              <p className="text-xs text-blue-200">Hỗ trợ GitHub Pages, Netlify & Sao lưu JSON</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('github')}
            className={`flex items-center space-x-2 py-2.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition ${
              activeTab === 'github'
                ? 'border-[#005BAB] text-[#005BAB] bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Github className="w-4 h-4" />
            <span>GitHub Pages</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('netlify')}
            className={`flex items-center space-x-2 py-2.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition ${
              activeTab === 'netlify'
                ? 'border-[#005BAB] text-[#005BAB] bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderArchive className="w-4 h-4" />
            <span>Netlify Drop</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`flex items-center space-x-2 py-2.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition ${
              activeTab === 'backup'
                ? 'border-[#005BAB] text-[#005BAB] bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Sao lưu JSON</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* TAB 1: GITHUB */}
          {activeTab === 'github' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-4 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center space-x-1.5">
                    <Github className="w-4 h-4" />
                    <span>Gói Mã Nguồn GitHub & GitHub Actions</span>
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Auto-Deploy
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  File ZIP bao gồm toàn bộ mã nguồn React + Tailwind + cấu hình tự động triển khai
                  <code className="bg-white/10 px-1 py-0.5 rounded text-amber-200 mx-1">.github/workflows/deploy.yml</code>
                  và thư mục tĩnh build sẵn để đưa lên GitHub Pages chạy online miễn phí.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={handleDownloadGitHub}
                    className="flex items-center space-x-1.5 bg-white text-slate-900 hover:bg-slate-100 px-4 py-2 rounded-lg text-xs font-bold shadow transition active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải về Gói GitHub (.zip)</span>
                  </button>
                  <a
                    href="https://github.com/new"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1.5 text-xs text-amber-300 hover:underline px-3 py-2 font-medium"
                  >
                    <span>Mở GitHub tạo Repo mới</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* 4-Step Instructions */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                  <GitBranch className="w-4 h-4 text-[#005BAB]" />
                  <span>4 Bước triển khai lên GitHub Pages (Miễn phí):</span>
                </h4>

                <ol className="list-decimal list-inside space-y-2 text-slate-600 leading-relaxed">
                  <li>
                    <strong>Tạo Repo mới:</strong> Vào{' '}
                    <a
                      href="https://github.com/new"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline font-semibold"
                    >
                      github.com/new
                    </a>
                    , đặt tên (ví dụ: <code className="bg-slate-200 px-1 py-0.5 rounded">quan-ly-cv</code>) và chọn <em>Create repository</em>.
                  </li>
                  <li>
                    <strong>Tải & Giải nén:</strong> Bấm nút <em>"Tải về Gói GitHub (.zip)"</em> ở trên và giải nén ra một thư mục trên máy tính.
                  </li>
                  <li>
                    <strong>Đẩy code lên GitHub:</strong>
                    <div className="mt-1.5 bg-slate-900 text-slate-200 p-2.5 rounded-lg font-mono text-[11px] relative">
                      <button
                        type="button"
                        onClick={copyGitCommands}
                        className="absolute top-2 right-2 p-1 bg-white/10 hover:bg-white/20 text-white rounded transition"
                        title="Sao chép lệnh"
                      >
                        {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <p className="text-slate-400"># Chạy trong thư mục vừa giải nén:</p>
                      <p>git init</p>
                      <p>git add .</p>
                      <p>git commit -m "Deploy Quan ly CV VNPT"</p>
                      <p>git branch -M main</p>
                      <p>git remote add origin https://github.com/&lt;user&gt;/&lt;repo&gt;.git</p>
                      <p>git push -u origin main</p>
                    </div>
                    <span className="text-[11px] text-slate-500 italic block mt-1">
                      (Hoặc kéo thả toàn bộ tệp vào trang GitHub bằng nút "uploading an existing file")
                    </span>
                  </li>
                  <li>
                    <strong>Kích hoạt GitHub Pages:</strong> Tại repository trên GitHub, vào <strong>Settings</strong> &gt; <strong>Pages</strong> (menu trái) &gt; tại mục <em>Source</em> chọn <strong>GitHub Actions</strong>. Trang web của bạn sẽ tự động chạy tại <code className="bg-blue-50 text-blue-700 px-1 py-0.5 rounded">https://&lt;username&gt;.github.io/&lt;repo&gt;/</code>!
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: NETLIFY */}
          {activeTab === 'netlify' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#005BAB] flex items-center space-x-1.5">
                    <FolderArchive className="w-4 h-4 text-[#005BAB]" />
                    <span>Gói ZIP Deploy Trực Tiếp (Netlify Drop)</span>
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Sẵn sàng 1-Click
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tải file <strong>quan-ly-cv-netlify-v3.zip</strong> chứa toàn bộ mã nguồn tĩnh đã build production (gồm file chạy tĩnh <code className="bg-white/80 px-1 py-0.5 rounded text-blue-800">index.html</code>, assets CSS/JS, và file định tuyến <code className="bg-white/80 px-1 py-0.5 rounded text-blue-800">_redirects</code>).
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={handleDownloadNetlify}
                    className="flex items-center space-x-1.5 bg-[#005BAB] hover:bg-[#004885] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow transition active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải về file ZIP Netlify (.zip)</span>
                  </button>
                  <a
                    href="https://app.netlify.com/drop"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1 text-xs text-[#005BAB] hover:underline px-3 py-2 font-medium"
                  >
                    <span>Mở Netlify Drop</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-2">
                <p className="font-semibold text-slate-900">Cách triển khai với Netlify Drop:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600">
                  <li>Nhấn nút <strong>"Tải về file ZIP Netlify (.zip)"</strong> ở trên.</li>
                  <li>Mở trang <a href="https://app.netlify.com/drop" target="_blank" rel="noreferrer" className="text-blue-600 underline font-medium">https://app.netlify.com/drop</a>.</li>
                  <li>Kéo thả trực tiếp file ZIP vào ô tải lên. Website sẽ có link chạy online ngay sau vài giây.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: BACKUP JSON */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                  <Database className="w-4 h-4 text-[#005BAB]" />
                  <span>Quản lý file sao lưu dữ liệu (.JSON)</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tải riêng file dữ liệu danh sách công việc và ghi chú tiến độ hiện tại về máy dưới dạng JSON để lưu trữ dự phòng hoặc chuyển dữ liệu sang thiết bị khác.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center justify-center space-x-2 bg-blue-50 hover:bg-blue-100 text-[#005BAB] border border-blue-200 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải file Dữ liệu (.json)</span>
                  </button>

                  <label className="flex items-center justify-center space-x-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition">
                    <Upload className="w-4 h-4" />
                    <span>Khôi phục từ file</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".json"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200">
            <span className="text-[11px] text-slate-500">
              VNPT Kỹ thuật - Hệ thống Điều hành & Đôn đốc công việc
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-xs rounded-xl transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
