import React, { useState } from 'react';
import {
  X,
  Layers,
  Database,
  GitBranch,
  Cpu,
  ShieldCheck,
  BellRing,
  ArrowRight,
  CheckCircle2,
  FileText,
  Server,
  Smartphone,
  Cloud,
  Lock,
  ScanLine,
  Sparkles,
} from 'lucide-react';

interface SystemArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabKey = 'architecture' | 'schema' | 'rbac' | 'ai_scan' | 'notifications';

export const SystemArchitectureModal: React.FC<SystemArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('architecture');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#005BAB] via-[#004885] to-[#003366] text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                Cấu Trúc Dữ Liệu & Thiết Kế Kiến Trúc Hệ Thống
              </h2>
              <p className="text-xs text-blue-100">
                Sơ đồ lưu đồ luồng xử lý, mô hình thực thể dữ liệu (ERD) và phân quyền điều hành
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 overflow-x-auto shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('architecture')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold flex items-center space-x-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'architecture'
                ? 'border-[#005BAB] text-[#005BAB] bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>1. Kiến trúc Tổng thể</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold flex items-center space-x-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'schema'
                ? 'border-[#005BAB] text-[#005BAB] bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>2. Cấu trúc Dữ liệu & ERD</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rbac')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold flex items-center space-x-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'rbac'
                ? 'border-[#005BAB] text-[#005BAB] bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>3. Lưu đồ Phân quyền (RBAC)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai_scan')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold flex items-center space-x-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'ai_scan'
                ? 'border-[#005BAB] text-[#005BAB] bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>4. Luồng Quét AI (OCR)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold flex items-center space-x-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'notifications'
                ? 'border-[#005BAB] text-[#005BAB] bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <BellRing className="w-4 h-4 text-red-500" />
            <span>5. Đôn đốc & Cảnh báo hạn</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-slate-800">
          {/* TAB 1: ARCHITECTURE OVERVIEW */}
          {activeTab === 'architecture' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border border-blue-200 bg-blue-50/50 p-4 rounded-xl text-xs sm:text-sm text-slate-700">
                <p className="font-bold text-[#005BAB] mb-1">
                  Mô hình Kiến trúc 3 Lớp (Modern Full-Stack Hybrid Architecture):
                </p>
                Ứng dụng vận hành theo mô hình phân tách rõ ràng giữa <strong>Giao diện người dùng (Client SPA)</strong>, <strong>Máy chủ trung gian bảo mật (Secure Node/Express Proxy)</strong>, và <strong>Đám mây đồng bộ Firebase Firestore + AI Đa phương thức Gemini</strong>.
              </div>

              {/* Visual Flowchart Box */}
              <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-700 shadow-inner">
                <div className="text-amber-400 font-bold mb-3">// SƠ ĐỒ LƯU ĐỒ KIẾN TRÚC HỆ THỐNG</div>
{`+------------------------------------------------------------------------------------------+
|                        NGƯỜI DÙNG / THIẾT BỊ (Mobile, Tablet, Desktop)                   |
|                        - Trình duyệt Web (Chrome, Safari, Edge, Firefox)                 |
|                        - Camera chụp trực tiếp, Tệp ảnh, PDF, Excel                      |
+------------------------------------------------------------------------------------------+
                                              |
                                              | (HTTP / WSS)
                                              v
+------------------------------------------------------------------------------------------+
|                           CLIENT TẦNG FRONT-END (React 19 + TypeScript)                  |
|  * Giao diện UI: Tailwind CSS + Lucide Icons                                            |
|  * 2 Chế độ xem: Bảng tương tác (Table View) & Lịch công việc (Calendar View)           |
|  * Bộ lọc & Tìm kiếm tức thì: Theo trạng thái, mức gấp, CBKT, đơn vị phối hợp            |
|  * Bộ nhớ đệm cục bộ (Local State Cache) phòng khi mất mạng (Offline fallback)           |
|  * Động cơ thông báo thời gian thực: Web Notifications API                               |
+------------------------------------------------------------------------------------------+
                    |                                                ^
                    | Gọi API Quét tài liệu                          | Đồng bộ Realtime Snapshot
                    v                                                | (onSnapshot / REST)
+----------------------------------------+         +---------------------------------------+
|        SERVER PROXY (Node / Express)   |         |      FIREBASE CLOUD DATABASE          |
|  * Cổng 3000 (Vite SSR Middleware)     |         |  * Firestore DB:                      |
|  * REST Endpoint: /api/scan-document   |         |    - Collection: tasks (Văn bản giao) |
|  * Bảo mật API Key: @google/genai      |         |    - Collection: daily_notes (Nhắc vc)|
|  * Dự phòng tải: Multi-model Fallback  |         |  * Firebase Authentication (Google)   |
+----------------------------------------+         +---------------------------------------+
                    |
                    | Gửi Payload Base64 / Text
                    v
+------------------------------------------------------------------------------------------+
|               GOOGLE GEMINI 3.8 MULTIMODAL AI (Flash & Flash-Lite Engine)               |
|  * Thị giác máy tính nhận diện văn bản (OCR độ chính xác cao)                            |
|  * Trích xuất có cấu trúc qua JSON Schema (ResponseSchema: Object)                       |
|  * Tự động nhận diện: Số VB, Phòng/ban giao NV, Trích yếu, CBKT, Đơn vị phối hợp, Hạn    |
+------------------------------------------------------------------------------------------+`}
              </div>

              {/* Architecture Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#005BAB] flex items-center justify-center font-bold">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">1. Client SPA Tốc độ cao</h4>
                  <p className="text-xs text-slate-600">
                    Phản hồi tức thì không tải lại trang. Hỗ trợ responsive đa màn hình, tối ưu cho cán bộ kỹ thuật kiểm tra trên điện thoại tại hiện trường hoặc máy tính văn phòng.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">2. Đám mây Đồng bộ tức thì</h4>
                  <p className="text-xs text-slate-600">
                    Kết nối Google Firestore qua giao thức WebSocket snapshot. Mọi cập nhật trạng thái tiến độ từ một máy sẽ hiện ngay lập tức trên máy của các thành viên khác.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">3. AI Tự động hóa Trích xuất</h4>
                  <p className="text-xs text-slate-600">
                    Không cần gõ tay công văn. AI phân tích quang học nhận diện chính xác số hiệu, phòng ban giao việc, người chịu trách nhiệm và thời hạn hoàn thành.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATA SCHEMA & ERD */}
          {activeTab === 'schema' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border border-slate-200 bg-slate-50 p-4 rounded-xl text-xs sm:text-sm text-slate-700">
                <p className="font-bold text-slate-900 mb-1">
                  Mô hình Thực thể Dữ liệu (Entity Relationship Diagram - ERD):
                </p>
                Dữ liệu được tổ chức dưới dạng tài liệu NoSQL Firestore chuẩn hóa, gồm 2 Collection độc lập: <strong>tasks</strong> (Văn bản & Giao việc) và <strong>daily_notes</strong> (Sổ tay nhắc việc cá nhân).
              </div>

              {/* ERD Visualization */}
              <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-700 shadow-inner">
                <div className="text-emerald-400 font-bold mb-3">// MÔ HÌNH THỰC THỂ DỮ LIỆU (ERD)</div>
{`+-------------------------------------------------------------+
|                      COLLECTION: tasks                      |
+-------------------------------------------------------------+
| [PK] id              : string (task-1718000...)             |
|      docNumber       : string ("458/P.KT")                  |
|      title           : string (Trích yếu nội dung công văn) |
|      issueDate       : string ("2026-10-18")                |
|      dueDate         : string ("2026-10-25")                |
|      assignee        : string ("Trần Văn Bình")             |
|      department      : string ("Đài VT" - ĐV phối hợp)      |
|      priority        : enum ("Bình thường"|"Quan trọng"|...) |
|      status          : enum ("Đang thực hiện"|"Hoàn thành")  |
|      progressPercent : number (0 đến 100)                   |
|      createdAt       : ISO 8601 Timestamp                   |
|      updatedAt       : ISO 8601 Timestamp                   |
|      notes           : Array<NoteItem>  (Nhật ký tiến độ)    |
+-------------------------------------------------------------+
                               |
                               | 1 : N (Embedded Array)
                               v
               +-------------------------------+
               |           NoteItem            |
               +-------------------------------+
               | id        : string            |
               | timestamp : string (HH:mm...) |
               | author    : string (Tác giả)  |
               | content   : string (Nội dung) |
               +-------------------------------+

+-------------------------------------------------------------+
|                   COLLECTION: daily_notes                   |
+-------------------------------------------------------------+
| [PK] id          : string (note-1718000...)                 |
|      noteDate    : string ("2026-10-18")                    |
|      title       : string (Nội dung việc cần làm cá nhân)   |
|      details     : string (Ghi chú báo cáo chi tiết)        |
|      dueDate     : string ("2026-10-20")                    |
|      completed   : boolean (true / false)                   |
|      completedAt : string (Thời điểm tích hoàn thành)       |
|      createdAt   : ISO 8601 Timestamp                       |
|      updatedAt   : ISO 8601 Timestamp                       |
+-------------------------------------------------------------+`}
              </div>

              {/* Data Dictionary Table */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                  <Database className="w-4 h-4 text-[#005BAB]" />
                  <span>Từ điển Dữ liệu Chi tiết (Collection: tasks)</span>
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Trường dữ liệu</th>
                        <th className="p-3">Kiểu dữ liệu</th>
                        <th className="p-3">Ý nghĩa & Quy tắc lưu trữ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      <tr>
                        <td className="p-3 font-mono font-bold text-[#005BAB]">id</td>
                        <td className="p-3 font-mono text-slate-500">string</td>
                        <td className="p-3 text-slate-700">Khóa chính duy nhất định danh văn bản trên hệ thống</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-slate-900">docNumber</td>
                        <td className="p-3 font-mono text-slate-500">string</td>
                        <td className="p-3 text-slate-700">
                          Ghép từ <code>docCodeNum</code> (Số VB) và <code>docIssuer</code> (Phòng/ban giao NV), ví dụ: <code>458/P.KT</code>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-slate-900">title</td>
                        <td className="p-3 font-mono text-slate-500">string</td>
                        <td className="p-3 text-slate-700">Trích yếu tóm tắt nội dung công việc giao cho cán bộ kỹ thuật</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-slate-900">issueDate</td>
                        <td className="p-3 font-mono text-slate-500">string (YYYY-MM-DD)</td>
                        <td className="p-3 text-slate-700">Ngày ký hoặc phát hành văn bản hành chính</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-red-600">dueDate</td>
                        <td className="p-3 font-mono text-slate-500">string (YYYY-MM-DD)</td>
                        <td className="p-3 text-slate-700">
                          Hạn chót hoàn thành nhiệm vụ hoặc nộp báo cáo kết quả (Căn cứ tính đôn đốc)
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-slate-900">assignee</td>
                        <td className="p-3 font-mono text-slate-500">string</td>
                        <td className="p-3 text-slate-700">Họ tên Cán bộ Kỹ thuật (CBKT) chịu trách nhiệm chính thực hiện</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-slate-900">department</td>
                        <td className="p-3 font-mono text-slate-500">string</td>
                        <td className="p-3 text-slate-700">
                          <strong>Phòng ban / Đơn vị phối hợp</strong> (Đài VT, Xưởng VT... tách biệt với phòng giao NV)
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-slate-900">status</td>
                        <td className="p-3 font-mono text-slate-500">TaskStatus</td>
                        <td className="p-3 text-slate-700">
                          <code>'Đang thực hiện' | 'Hoàn thành' | 'Tạm dừng' | 'Chờ duyệt'</code>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-slate-900">progressPercent</td>
                        <td className="p-3 font-mono text-slate-500">number</td>
                        <td className="p-3 text-slate-700">Tiến độ thực hiện từ 0% đến 100%</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-slate-900">notes</td>
                        <td className="p-3 font-mono text-slate-500">Array&lt;NoteItem&gt;</td>
                        <td className="p-3 text-slate-700">
                          Lịch sử báo cáo tiến độ, thời gian ghi nhận và tên người cập nhật
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RBAC WORKFLOW */}
          {activeTab === 'rbac' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border border-indigo-200 bg-indigo-50/50 p-4 rounded-xl text-xs sm:text-sm text-slate-700">
                <p className="font-bold text-indigo-900 mb-1">
                  Mô hình Phân quyền Vai trò 2 Cấp (Dual Role-Based Access Control):
                </p>
                Phân quyền trực quan giữa <strong>Guest (Cán bộ kỹ thuật)</strong> và <strong>Admin (Lãnh đạo / Người giao việc)</strong> với mật khẩu xác thực trực tiếp <code>1234</code>.
              </div>

              {/* RBAC Flowchart */}
              <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-700 shadow-inner">
                <div className="text-cyan-400 font-bold mb-3">// LƯU ĐỒ LUỒNG PHÂN QUYỀN (RBAC WORKFLOW)</div>
{`                                 [ NGƯỜI DÙNG TRUY CẬP HỆ THỐNG ]
                                                |
                                                v
                                 [ MẶC ĐỊNH: VAI TRÒ GUEST ]
                                                |
                 +------------------------------+-------------------------------+
                 |                                                              |
                 v                                                              v
      [ HÀNH ĐỘNG CỦA GUEST ]                                      [ HÀNH ĐỘNG CỦA ADMIN ]
  * Xem danh sách văn bản (Bảng & Lịch)                        * Tạo công văn / Giao việc mới ("CV mới")
  * Tìm kiếm, lọc theo CBKT, trạng thái                        * Quét văn bản AI & Lưu trực tiếp
  * Cập nhật Tiến độ (% hoàn thành)                            * Chỉnh sửa số hiệu, trích yếu, hạn xử lý
  * Tích chọn Hoàn thành nhanh                                 * Phân công lại CBKT và ĐV phối hợp
  * Thêm ghi chú nhật ký báo cáo                               * Xóa công văn khỏi hệ thống
                 |                                                              ^
                 | Cần tạo việc / sửa thông tin gốc                             |
                 +-------------------> [ YÊU CẦU QUYỀN ADMIN ] -----------------+
                                               |
                                               v
                                [ NHẬP MẬT KHẨU ADMIN: 1234 ]
                                               |
                               +---------------+---------------+
                               |                               |
                           [ Đúng ]                        [ Sai ]
                               |                               |
                               v                               v
                       [ Chuyển Admin ]              [ Báo lỗi & Giữ Guest ]`}
              </div>

              {/* Permissions Matrix */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Thao tác nghiệp vụ</th>
                      <th className="p-3 text-center">Guest (CBKT)</th>
                      <th className="p-3 text-center">Admin (Lãnh đạo)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <tr>
                      <td className="p-3 font-medium">Xem danh sách, tìm kiếm, lọc & xem Lịch</td>
                      <td className="p-3 text-center text-emerald-600 font-bold">✓ Toàn quyền</td>
                      <td className="p-3 text-center text-emerald-600 font-bold">✓ Toàn quyền</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Cập nhật tỷ lệ % tiến độ và trạng thái hoàn thành</td>
                      <td className="p-3 text-center text-emerald-600 font-bold">✓ Được phép</td>
                      <td className="p-3 text-center text-emerald-600 font-bold">✓ Được phép</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Thêm ghi chú tiến độ / báo cáo kết quả</td>
                      <td className="p-3 text-center text-emerald-600 font-bold">✓ Được phép</td>
                      <td className="p-3 text-center text-emerald-600 font-bold">✓ Được phép</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Giao việc mới ("CV mới") / Lưu từ Quét AI</td>
                      <td className="p-3 text-center text-slate-400">Yêu cầu MK Admin (1234)</td>
                      <td className="p-3 text-center text-emerald-600 font-bold">✓ Toàn quyền</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Chỉnh sửa số hiệu, ngày ban hành, hạn báo cáo</td>
                      <td className="p-3 text-center text-slate-400">Khóa (Read-only)</td>
                      <td className="p-3 text-center text-emerald-600 font-bold">✓ Toàn quyền</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Xóa văn bản khỏi hệ thống</td>
                      <td className="p-3 text-center text-red-500 font-bold">✗ Không cho phép</td>
                      <td className="p-3 text-center text-emerald-600 font-bold">✓ Có modal xác nhận</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: AI SCAN FLOW */}
          {activeTab === 'ai_scan' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border border-amber-200 bg-amber-50/50 p-4 rounded-xl text-xs sm:text-sm text-slate-700">
                <p className="font-bold text-amber-900 mb-1">
                  Quy trình Tiếp nhận & Trích xuất Văn bản Tự động (AI Document Ingestion Pipeline):
                </p>
                Tích hợp mô hình Gemini 3.8 Multimodal AI trực tiếp trên máy chủ. Tự động nhận diện và bóc tách các trường quản lý mà không cần cấu hình phức tạp.
              </div>

              {/* AI Scan Flowchart */}
              <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-700 shadow-inner">
                <div className="text-amber-400 font-bold mb-3">// LƯU ĐỒ QUY TRÌNH QUÉT & TRÍCH XUẤT AI</div>
{`+-----------------------------------------------------------------------------------------+
|                                1. NGUỒN TÀI LIỆU ĐẦU VÀO                                |
|  [Tải ảnh (JPG/PNG)]   |   [Tệp PDF Công văn]   |   [Camera Trực tiếp]   |   [Dán Text] |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                               2. TIỀN XỬ LÝ DỮ LIỆU TẠI CLIENT                          |
|  * Chuyển đổi sang chuỗi Base64 Data URL chuẩn hóa                                      |
|  * Xác thực định dạng MIME Type (image/jpeg, application/pdf, text/plain)               |
+-----------------------------------------------------------------------------------------+
                                             |
                                             | POST /api/scan-document
                                             v
+-----------------------------------------------------------------------------------------+
|                       3. MÁY CHỦ PROXY XỬ LÝ & GỌI GEMINI AI                            |
|  * Model: gemini-3.8-flash (Tự động fallback gemini-flash-latest / gemini-3.1-flash-lite)|
|  * Ràng buộc cấu trúc qua ResponseSchema JSON Object:                                   |
|    - docCodeNum : Phần số văn bản (ví dụ "458")                                         |
|    - docIssuer  : Phòng/ban giao NV sau dấu "/" (ví dụ "P.KT")                          |
|    - fullDocNumber: "458/P.KT"                                                          |
|    - title      : Trích yếu nội dung công tác                                           |
|    - issueDate  : Ngày ban hành (YYYY-MM-DD)                                            |
|    - dueDate    : Hạn báo cáo / hoàn thành                                              |
|    - priority   : Phân loại ("Bình thường", "Quan trọng", "Khẩn cấp")                   |
|    - assignee   : CBKT thực hiện chính                                                  |
|    - department : Phòng ban / Đơn vị phối hợp (Đài VT, Xưởng VT...)                    |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                        4. ĐIỀN DỮ LIỆU CHUẨN XÁC VÀO GIAO DIỆN                          |
|  * Ô "Số / Ký hiệu Văn bản"      <--- Điền: docCodeNum (458)                            |
|  * Ô "Phòng/ban giao NV" (kế bên)<--- Điền: docIssuer (P.KT)                            |
|  * Ô "Phòng ban / ĐV phối hợp"   <--- Điền: department (Đơn vị phối hợp, không trùng ĐV) |
|  * Ô "CBKT Phụ trách"            <--- Điền: assignee                                    |
|  * Ô "Hạn hoàn thành"            <--- Điền: dueDate (Tự động tính ngày còn lại)         |
+-----------------------------------------------------------------------------------------+
                                             |
                     +-----------------------+-----------------------+
                     |                                               |
                     v                                               v
    [ CHUYỂN VÀO FORM CHI TIẾT ]                         [ LƯU TRỰC TIẾP VÀO DS ]
(Mở TaskModal để kiểm tra & điều chỉnh)             (Lưu ngay vào Firestore & Đóng modal)`}
              </div>
            </div>
          )}

          {/* TAB 5: NOTIFICATIONS & MONITORING */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border border-red-200 bg-red-50/50 p-4 rounded-xl text-xs sm:text-sm text-slate-700">
                <p className="font-bold text-red-900 mb-1">
                  Cơ chế Giám sát Tiến độ & Đôn đốc Hạn hoàn thành (Deadline Monitoring Engine):
                </p>
                Hệ thống tự động so khớp ngày hạn báo cáo (<code>dueDate</code>) với thời gian thực của máy chủ/thiết bị để phân nhóm cảnh báo màu sắc và kích hoạt thông báo đôn đốc.
              </div>

              {/* Notification Flowchart */}
              <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-700 shadow-inner">
                <div className="text-red-400 font-bold mb-3">// LƯU ĐỒ ĐÔN ĐỐC & CẢNH BÁO TIẾN ĐỘ</div>
{`                      [ MỖI LẦN TRUY CẬP / HOẶC ĐỊNH KỲ MỖI GIỜ ]
                                           |
                                           v
                 [ TÍNH TOÁN KHOẢNG CÁCH NGÀY: Drem = dueDate - today ]
                                           |
       +-------------------+---------------+-------------------+-------------------+
       |                   |                                   |                   |
       v                   v                                   v                   v
[ Drem < 0 hoặc ]    [ 0 <= Drem <= 3 ]                 [ 4 <= Drem <= 5 ]      [ Drem > 5 ]
[ Khẩn cấp (Đỏ) ]    [ Sắp hết hạn (Cam) ]              [ Cảnh báo (Vàng) ]     [ An toàn (Xanh) ]
       |                   |                                   |                   |
       |                   +-----------------+-----------------+                   |
       |                                     |                                     |
       v                                     v                                     v
[ BANNER BÁO ĐỘNG ]                 [ THÔNG BÁO BROWSER ]                  [ HIỂN THỊ BÌNH THƯỜNG ]
Ghim ngay trên cùng Dashboard       Đẩy Web Notification trực tiếp        Cập nhật màu Badge tiến độ
Liệt kê chi tiết tên CBKT & Hạn     vào màn hình điện thoại & máy tính     trên bảng & lịch công việc`}
              </div>

              {/* Urgency Classification Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl space-y-1">
                  <div className="font-bold text-red-700 flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                    <span>Quá hạn / Khẩn cấp</span>
                  </div>
                  <p className="text-slate-600">
                    Hạn đã qua (&lt; 0 ngày) hoặc có tính chất HỎA TỐC. Cần lãnh đạo đôn đốc ngay lập tức.
                  </p>
                </div>

                <div className="bg-orange-50 border border-orange-200 p-3.5 rounded-xl space-y-1">
                  <div className="font-bold text-orange-700 flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span>Sắp đến hạn (≤ 3 ngày)</span>
                  </div>
                  <p className="text-slate-600">
                    Thời gian còn từ 0 đến 3 ngày. Cần tập trung hoàn thành dứt điểm và nộp báo cáo.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl space-y-1">
                  <div className="font-bold text-amber-700 flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Cảnh báo trước (≤ 5 ngày)</span>
                  </div>
                  <p className="text-slate-600">
                    Thời gian còn từ 4 đến 5 ngày. Đưa vào kế hoạch tác nghiệp tuần để chủ động chuẩn bị.
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl space-y-1">
                  <div className="font-bold text-emerald-700 flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span>An toàn (&gt; 5 ngày)</span>
                  </div>
                  <p className="text-slate-600">
                    Tiến độ bình thường, còn nhiều thời gian thực hiện theo quy trình chuẩn.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 sm:px-6 py-3 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tài liệu kỹ thuật hệ thống Quản lý Văn bản VNPT • Phiên bản 2.4</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold bg-[#005BAB] hover:bg-[#004885] text-white rounded-xl shadow-xs transition cursor-pointer"
          >
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
