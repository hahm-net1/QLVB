import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScannedDocumentData } from '../types';
import {
  X,
  ScanLine,
  UploadCloud,
  Camera,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Eye,
  FileCheck,
  Zap,
  Calendar,
  User,
  Building2,
  Save,
  HelpCircle,
  FileCode,
} from 'lucide-react';

interface DocumentScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyScannedData: (data: ScannedDocumentData, saveDirectly?: boolean) => void;
  assignees: string[];
}

type ScanSourceTab = 'upload' | 'camera' | 'text';

const DEPARTMENT_PRESETS = [
  'P.KT',
  'P.KHĐT',
  'PKTTC',
  'PNS',
  'P.HCTH',
  'Đài VT',
  'X.VT',
  'X.HT',
];

const SAMPLE_TEXT = `TẬP ĐOÀN BƯU CHÍNH VIỄN THÔNG VIỆT NĂM
VNPT TỈNH / THÀNH PHỐ
Số: 458/P.KT
V/v: Triển khai kiểm tra và bảo dưỡng định kỳ hệ thống mạng cáp quang băng rộng Quý 4 năm 2026.

Kính gửi: Các Đơn vị trực thuộc, Đài Viễn thông, Xưởng Viễn thông.

Thực hiện kế hoạch nâng cao chất lượng mạng lưới, Phòng Kỹ thuật yêu cầu:
1. Giao đồng chí Trần Văn Bình (P.KT) chủ trì phối hợp cùng các đài trạm tổ chức đo kiểm, rà soát toàn bộ các tuyến truyền dẫn trục chính.
2. Hoàn thành toàn bộ công tác kiểm tra, khắc phục tồn tại và lập báo cáo kết quả trước ngày 20/10/2026.
3. Đây là nhiệm vụ trọng tâm, yêu cầu các đơn vị triển khai khẩn trương, nghiêm túc.

Nơi nhận:
- Như trên;
- Lưu: VT, P.KT.
TRƯỞNG PHÒNG KỸ THUẬT
(Đã ký)`;

export const DocumentScanModal: React.FC<DocumentScanModalProps> = ({
  isOpen,
  onClose,
  onApplyScannedData,
  assignees,
}) => {
  const [activeTab, setActiveTab] = useState<ScanSourceTab>('upload');

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string | null>(null);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Text state
  const [textContent, setTextContent] = useState<string>('');

  // Processing state
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStepMessage, setScanStepMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extracted data state
  const [extractedData, setExtractedData] = useState<ScannedDocumentData | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      stopCamera();
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(
        'Không thể mở Camera. Vui lòng cấp quyền truy cập máy ảnh hoặc dùng tính năng Tải tệp lên.'
      );
      setIsCameraActive(false);
    }
  }, [stopCamera]);

  // Clean up camera stream and object URLs on unmount / close
  useEffect(() => {
    return () => {
      stopCamera();
      if (filePreviewUrl && filePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl, stopCamera]);

  // Reset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setSelectedFile(null);
      setFilePreviewUrl(null);
      setFileBase64(null);
      setFileMimeType(null);
      setTextContent('');
      setExtractedData(null);
      setErrorMessage(null);
      setIsScanning(false);
    }
  }, [isOpen, stopCamera]);

  if (!isOpen) return null;

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setFilePreviewUrl(dataUrl);
    setFileBase64(dataUrl);
    setFileMimeType('image/jpeg');
    stopCamera();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);
    setExtractedData(null);

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isText =
      file.type.startsWith('text/') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md');

    if (isImage || isPdf) {
      setFileMimeType(file.type || (isPdf ? 'application/pdf' : 'image/jpeg'));
      const preview = URL.createObjectURL(file);
      setFilePreviewUrl(preview);

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setFileBase64(result);
      };
      reader.readAsDataURL(file);
    } else if (isText) {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        setTextContent(text);
        setActiveTab('text');
      };
      reader.readAsText(file);
    } else {
      // Try data URL fallback for other formats
      setFileMimeType(file.type || 'application/octet-stream');
      const reader = new FileReader();
      reader.onload = () => {
        setFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Perform AI Scan Request to Server
  const handlePerformScan = async () => {
    setErrorMessage(null);
    setIsScanning(true);
    setScanStepMessage('Đang kết nối AI và phân tích tài liệu...');

    try {
      let payload: any = {};

      if (activeTab === 'text') {
        if (!textContent.trim()) {
          throw new Error('Vui lòng nhập hoặc dán nội dung văn bản để AI phân tích.');
        }
        payload = { textContent: textContent.trim() };
      } else {
        if (!fileBase64) {
          throw new Error('Vui lòng chọn hoặc chụp ảnh/tệp PDF văn bản trước khi quét.');
        }
        payload = {
          fileBase64: fileBase64,
          mimeType: fileMimeType || 'image/jpeg',
          textContent: textContent.trim() || undefined,
        };
      }

      setScanStepMessage('Đang nhận diện số hiệu, trích yếu, người phụ trách và thời hạn...');

      const response = await fetch('/api/scan-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || contentType.includes('text/html')) {
        if (contentType.includes('text/html') || response.status === 404) {
          throw new Error(
            'Không kết nối được máy chủ AI (/api/scan-document). Website này đang mở ở chế độ Web tĩnh (Netlify/GitHub Pages) nên không có máy chủ Node.js chạy ngầm để gọi AI Gemini. Vui lòng mở bằng đường link ứng dụng trực tiếp trên AI Studio / Cloud Run hoặc chạy với máy chủ Node.js đầy đủ.'
          );
        }
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Lỗi máy chủ (${response.status}) khi quét văn bản.`);
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'AI không trích xuất được dữ liệu hợp lệ từ văn bản.');
      }

      setScanStepMessage('Hoàn tất trích xuất thông tin!');
      let parsedNum = result.data.docCodeNum || '';
      let parsedIssuer = result.data.docIssuer || '';
      if (!parsedNum || !parsedIssuer) {
        const parts = (result.data.fullDocNumber || '').split('/');
        if (!parsedNum) parsedNum = parts[0] || '';
        if (!parsedIssuer) parsedIssuer = parts.slice(1).join('/') || '';
      }

      let sanitizedDept = result.data.department || '';
      if (
        sanitizedDept.toLowerCase() === parsedIssuer.toLowerCase() ||
        sanitizedDept.toLowerCase() === 'không có'
      ) {
        sanitizedDept = '';
      }

      setExtractedData({
        ...result.data,
        docCodeNum: parsedNum,
        docIssuer: parsedIssuer,
        fullDocNumber: `${parsedNum}/${parsedIssuer}`.replace(/^\/|\/$/g, ''),
        department: sanitizedDept,
      });
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMessage(err.message || 'Có lỗi xảy ra khi quét văn bản. Vui lòng thử lại.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleApplyToForm = (saveDirectly: boolean = false) => {
    if (!extractedData) return;
    const finalDocNumber =
      extractedData.docCodeNum && extractedData.docIssuer
        ? `${extractedData.docCodeNum.trim()}/${extractedData.docIssuer.trim()}`
        : extractedData.fullDocNumber;

    onApplyScannedData(
      {
        ...extractedData,
        fullDocNumber: finalDocNumber,
      },
      saveDirectly
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 my-auto flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#005BAB] via-[#004885] to-[#003366] text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner text-amber-300">
              <ScanLine className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold leading-tight">
                  Quét & Trích Xuất Văn Bản Tự Động (AI Scan)
                </h2>
                <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1 shadow-xs">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Gemini 3.8</span>
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Tự động nhận diện số hiệu, trích yếu, cán bộ thực hiện và hạn hoàn thành từ Ảnh, PDF, Camera hoặc Text
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* If extractedData is ready, show review & edit screen */}
          {extractedData ? (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              {/* Extraction Header Summary */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <span>Đã trích xuất thông tin văn bản thành công!</span>
                      {typeof extractedData.confidence === 'number' && (
                        <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                          Độ tin cậy: {extractedData.confidence}%
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Vui lòng kiểm tra lại các trường thông tin bên dưới trước khi áp dụng vào hệ thống.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0 justify-end">
                  <button
                    type="button"
                    onClick={() => setExtractedData(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl font-medium transition cursor-pointer flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Quét lại</span>
                  </button>
                </div>
              </div>

              {/* Editable Fields Grid */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#005BAB]" />
                  <span>Dữ liệu văn bản được AI trích xuất</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                  {/* Ô 1: Số văn bản */}
                  <div className="sm:col-span-5">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Số / Ký hiệu văn bản <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={extractedData.docCodeNum || ''}
                      onChange={(e) => {
                        const newNum = e.target.value;
                        const issuer = extractedData.docIssuer || '';
                        setExtractedData({
                          ...extractedData,
                          docCodeNum: newNum,
                          fullDocNumber: `${newNum}/${issuer}`,
                        });
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold text-[#005BAB] focus:ring-2 focus:ring-[#005BAB]/30 focus:border-[#005BAB]"
                      placeholder="Số VB (VD: 458)"
                    />
                  </div>

                  {/* Ô 2 (ngay cạnh): Phòng/ban giao NV */}
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phòng/ban giao NV <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        list="scan-doc-issuer-list"
                        value={extractedData.docIssuer || ''}
                        onChange={(e) => {
                          const newIssuer = e.target.value;
                          const num = extractedData.docCodeNum || '';
                          setExtractedData({
                            ...extractedData,
                            docIssuer: newIssuer,
                            fullDocNumber: `${num}/${newIssuer}`,
                          });
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#005BAB]/30 focus:border-[#005BAB]"
                        placeholder="Chọn hoặc gõ (VD: P.KT)"
                      />
                      <datalist id="scan-doc-issuer-list">
                        {DEPARTMENT_PRESETS.map((dept) => (
                          <option key={dept} value={dept} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {/* Ô 3: Mức độ ưu tiên */}
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Độ ưu tiên
                    </label>
                    <select
                      value={extractedData.priority}
                      onChange={(e) =>
                        setExtractedData({
                          ...extractedData,
                          priority: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#005BAB]/30 focus:border-[#005BAB]"
                    >
                      <option value="Bình thường">Bình thường</option>
                      <option value="Quan trọng">Quan trọng</option>
                      <option value="Khẩn cấp">Khẩn cấp</option>
                    </select>
                  </div>
                </div>

                {/* Trích yếu nội dung */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trích yếu nội dung văn bản <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={extractedData.title}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, title: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#005BAB]/30 focus:border-[#005BAB]"
                    placeholder="Nội dung tóm tắt văn bản..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Cán bộ kỹ thuật phụ trách */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      CBKT Phụ trách thực hiện <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={extractedData.assignee || ''}
                        onChange={(e) =>
                          setExtractedData({ ...extractedData, assignee: e.target.value })
                        }
                        list="scan-assignees-list"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 font-medium focus:ring-2 focus:ring-[#005BAB]/30 focus:border-[#005BAB]"
                        placeholder="Nhập hoặc chọn tên CBKT..."
                      />
                      <datalist id="scan-assignees-list">
                        {assignees.map((a) => (
                          <option key={a} value={a} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {/* Phòng ban / Đơn vị phối hợp */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phòng ban / Đơn vị phối hợp
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        list="scan-coop-options"
                        value={extractedData.department || ''}
                        onChange={(e) =>
                          setExtractedData({ ...extractedData, department: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#005BAB]/30 focus:border-[#005BAB]"
                        placeholder="Đơn vị phối hợp (để trống nếu không có)..."
                      />
                      <datalist id="scan-coop-options">
                        <option value="Không có" />
                        {DEPARTMENT_PRESETS.map((dept) => (
                          <option key={dept} value={dept} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ngày ban hành
                    </label>
                    <input
                      type="date"
                      value={extractedData.issueDate}
                      onChange={(e) =>
                        setExtractedData({ ...extractedData, issueDate: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hạn hoàn thành / báo cáo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={extractedData.dueDate}
                      onChange={(e) =>
                        setExtractedData({ ...extractedData, dueDate: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold text-red-700"
                    />
                  </div>
                </div>

                {/* Ghi chú chỉ đạo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ghi chú chỉ đạo quan trọng (Tự động tóm tắt)
                  </label>
                  <input
                    type="text"
                    value={extractedData.notes || ''}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, notes: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400"
                    placeholder="Tóm tắt yêu cầu cần lưu ý..."
                  />
                </div>
              </div>

              {/* Document Preview Thumbnail if available */}
              {filePreviewUrl && (
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex items-center space-x-3">
                  <div className="w-14 h-14 bg-white border border-slate-200 rounded-lg overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                    {fileMimeType?.includes('pdf') ? (
                      <FileText className="w-7 h-7 text-red-500" />
                    ) : (
                      <img
                        src={filePreviewUrl}
                        alt="Tài liệu gốc"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="text-xs text-slate-600 flex-1 truncate">
                    <div className="font-semibold text-slate-800">
                      Tệp nguồn: {selectedFile?.name || 'Ảnh chụp từ camera'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Đã được đối soát và trích xuất tự động qua mô hình nhận diện thị giác đa phương thức Gemini 3.8.
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Input Selection & Upload Screen */
            <div className="space-y-4">
              {/* Tab Selector */}
              <div className="flex border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setActiveTab('upload');
                  }}
                  className={`pb-3 px-4 text-xs sm:text-sm font-semibold flex items-center space-x-2 border-b-2 transition cursor-pointer ${
                    activeTab === 'upload'
                      ? 'border-[#005BAB] text-[#005BAB]'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Tải ảnh / File PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('camera');
                    startCamera();
                  }}
                  className={`pb-3 px-4 text-xs sm:text-sm font-semibold flex items-center space-x-2 border-b-2 transition cursor-pointer ${
                    activeTab === 'camera'
                      ? 'border-[#005BAB] text-[#005BAB]'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Chụp từ Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setActiveTab('text');
                  }}
                  className={`pb-3 px-4 text-xs sm:text-sm font-semibold flex items-center space-x-2 border-b-2 transition cursor-pointer ${
                    activeTab === 'text'
                      ? 'border-[#005BAB] text-[#005BAB]'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FileCode className="w-4 h-4" />
                  <span>Dán văn bản / Email</span>
                </button>
              </div>

              {/* Tab 1: File Upload */}
              {activeTab === 'upload' && (
                <div className="space-y-3">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition ${
                      selectedFile
                        ? 'border-emerald-400 bg-emerald-50/20'
                        : 'border-slate-300 hover:border-[#005BAB] bg-slate-50/50 hover:bg-blue-50/20'
                    }`}
                  >
                    <input
                      type="file"
                      id="doc-scan-upload"
                      accept="image/*,application/pdf,.txt,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {selectedFile && filePreviewUrl ? (
                      <div className="space-y-3">
                        <div className="max-w-xs mx-auto max-h-48 overflow-hidden rounded-xl border border-slate-200 shadow-sm relative group bg-white">
                          {fileMimeType?.includes('pdf') ? (
                            <div className="p-8 text-center space-y-2">
                              <FileText className="w-12 h-12 text-red-500 mx-auto" />
                              <p className="text-xs font-semibold text-slate-700 truncate">
                                {selectedFile.name}
                              </p>
                              <span className="text-[10px] text-slate-400 font-mono">
                                (Tài liệu PDF điện tử)
                              </span>
                            </div>
                          ) : (
                            <img
                              src={filePreviewUrl}
                              alt="Xem trước tài liệu"
                              className="w-full h-full object-contain mx-auto"
                            />
                          )}
                        </div>

                        <div className="flex items-center justify-center space-x-3 text-xs">
                          <span className="font-semibold text-slate-700">{selectedFile.name}</span>
                          <span className="text-slate-400">
                            ({(selectedFile.size / 1024).toFixed(0)} KB)
                          </span>
                          <label
                            htmlFor="doc-scan-upload"
                            className="text-[#005BAB] hover:underline font-semibold cursor-pointer"
                          >
                            Đổi tệp khác
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label htmlFor="doc-scan-upload" className="cursor-pointer block space-y-3">
                        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#005BAB] flex items-center justify-center mx-auto border border-blue-100 shadow-sm">
                          <UploadCloud className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            Kéo thả hoặc nhấp để chọn Hình ảnh / File PDF văn bản
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Hỗ trợ tài liệu scan, ảnh chụp văn bản (.jpg, .png, .webp) hoặc file .pdf, .txt
                          </p>
                        </div>
                        <span className="inline-block px-4 py-2 bg-white text-[#005BAB] border border-blue-200 rounded-xl text-xs font-semibold shadow-xs hover:bg-blue-50 transition">
                          Chọn tệp từ máy tính / điện thoại
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Camera Capture */}
              {activeTab === 'camera' && (
                <div className="space-y-3">
                  {cameraError ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-2">
                      <div className="font-bold flex items-center space-x-1">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Không thể kích hoạt máy ảnh</span>
                      </div>
                      <p>{cameraError}</p>
                      <div className="pt-2">
                        <label className="inline-block px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold cursor-pointer">
                          Chụp ảnh bằng ứng dụng camera máy
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ) : filePreviewUrl && !isCameraActive ? (
                    <div className="text-center space-y-3">
                      <div className="max-w-md mx-auto max-h-56 overflow-hidden rounded-xl border border-slate-200 shadow-md">
                        <img
                          src={filePreviewUrl}
                          alt="Ảnh vừa chụp"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-center space-x-3">
                        <span className="text-xs text-emerald-700 font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Đã chụp ảnh văn bản</span>
                        </span>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="text-xs text-[#005BAB] hover:underline font-semibold cursor-pointer"
                        >
                          Chụp lại
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-w-lg mx-auto shadow-inner flex items-center justify-center">
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {/* Document alignment overlay guideline */}
                      <div className="absolute inset-6 border-2 border-white/60 border-dashed rounded-xl pointer-events-none flex flex-col justify-between p-2">
                        <span className="text-[11px] text-white/90 bg-black/60 px-2 py-0.5 rounded self-center">
                          Căn chỉnh văn bản nằm trọn trong khung hình
                        </span>
                      </div>

                      {/* Snap Button */}
                      <div className="absolute bottom-4 inset-x-0 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={handleCaptureSnapshot}
                          className="w-14 h-14 rounded-full bg-white text-[#005BAB] p-1 shadow-lg hover:scale-105 active:scale-95 transition flex items-center justify-center cursor-pointer border-4 border-white/50"
                          title="Chụp ảnh ngay"
                        >
                          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white">
                            <Camera className="w-5 h-5" />
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Paste Text */}
              {activeTab === 'text' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-slate-700">
                      Dán nội dung công văn, chỉ đạo hoặc email vào đây:
                    </label>
                    <button
                      type="button"
                      onClick={() => setTextContent(SAMPLE_TEXT)}
                      className="text-[#005BAB] hover:underline font-medium cursor-pointer"
                    >
                      Dùng mẫu văn bản thử nghiệm
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Dán toàn bộ nội dung văn bản, thông báo điều hành hoặc email giao việc vào đây..."
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30 focus:border-[#005BAB] focus:bg-white transition"
                  />
                </div>
              )}

              {/* Scanning Laser Animation & Progress indicator */}
              {isScanning && (
                <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-5 text-center space-y-3 shadow-xs">
                  <div className="relative w-12 h-12 mx-auto">
                    <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-[#005BAB] animate-spin" />
                    <Sparkles className="w-5 h-5 text-amber-500 absolute inset-0 m-auto" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900">{scanStepMessage}</p>
                    <p className="text-xs text-slate-500">
                      Mô hình Gemini đang đọc kỹ trích yếu, số hiệu và trích lọc thông tin người nhận...
                    </p>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <div className="flex-1">
                    <p className="font-semibold">Không thể quét văn bản</p>
                    <p className="mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Scan Trigger Button */}
              {!isScanning && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handlePerformScan}
                    disabled={
                      (activeTab === 'upload' && !fileBase64) ||
                      (activeTab === 'camera' && !fileBase64) ||
                      (activeTab === 'text' && !textContent.trim())
                    }
                    className="w-full py-3 px-5 bg-gradient-to-r from-[#005BAB] to-[#004885] hover:from-[#004885] hover:to-[#003366] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Bắt đầu Quét & Trích xuất thông tin (AI)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center space-x-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Tự động hóa hoàn toàn quy trình lập hồ sơ theo dõi văn bản</span>
          </div>

          <div className="flex items-center space-x-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl font-medium transition cursor-pointer"
            >
              Đóng
            </button>

            {extractedData && (
              <>
                <button
                  type="button"
                  onClick={() => handleApplyToForm(false)}
                  className="px-4 py-2 text-xs sm:text-sm text-[#005BAB] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl font-semibold transition cursor-pointer flex items-center space-x-1.5"
                  title="Mở form tạo CV mới với đầy đủ thông tin vừa trích xuất để kiểm tra chi tiết"
                >
                  <span>Chuyển vào Form chi tiết</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyToForm(true)}
                  className="px-4 py-2 text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold shadow-sm transition cursor-pointer flex items-center space-x-1.5 active:scale-95"
                  title="Lưu thẳng văn bản này vào danh sách quản lý"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu nhanh vào Danh sách</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
