import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  MessageSquare,
  Sparkles,
  Send,
} from 'lucide-react';
import {
  copyToClipboard,
  createViberUrl,
} from '../utils/reminderService';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialText: string;
  recipientName?: string;
  onNotifyToast?: (msg: string) => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  title,
  initialText,
  recipientName,
  onNotifyToast,
}) => {
  const [text, setText] = useState(initialText);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setText(initialText);
    setIsCopied(false);
  }, [initialText, isOpen]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setIsCopied(true);
      if (onNotifyToast) {
        onNotifyToast('Đã sao chép tin nhắn! Bạn có thể dán vào ứng dụng bất kỳ.');
      }
      setTimeout(() => setIsCopied(false), 3000);
    }
  };

  const handleOpenViber = async () => {
    // Tự động copy nội dung trước để người dùng có thể dán linh hoạt
    await copyToClipboard(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);

    const viberUrl = createViberUrl(text);
    window.location.href = viberUrl;

    if (onNotifyToast) {
      onNotifyToast('Đang mở Viber... Tin nhắn cũng đã được tự động sao chép!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#005BAB] via-[#004885] to-[#003366] text-white px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 text-amber-300 shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold leading-tight truncate">
                {title || 'Đôn Đốc Tiến Độ & Nhắc Việc'}
              </h3>
              <p className="text-[11px] text-blue-100 truncate">
                {recipientName ? `CBKT: ${recipientName}` : 'Soạn tin nhắn đôn đốc'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer shrink-0 ml-2"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-3.5">
          {/* Quick Notice */}
          <div className="px-3 py-2 bg-blue-50 border border-blue-200/80 rounded-xl flex items-center space-x-2 text-xs text-blue-900 leading-snug">
            <Sparkles className="w-4 h-4 text-[#005BAB] shrink-0" />
            <span>Nội dung đã được chuẩn hóa số hiệu, hạn báo cáo và mức cảnh báo.</span>
          </div>

          {/* Text Preview / Edit */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Nội dung tin nhắn
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-[#005BAB] hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy nhanh</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-sans leading-relaxed text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005BAB]/30 focus:border-[#005BAB]"
              placeholder="Nội dung tin nhắn đôn đốc..."
            />
          </div>

          {/* Action Buttons: 2 Big, Touch-Friendly Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* 1. NÚT SAO CHÉP TIN NHẮN */}
            <button
              type="button"
              onClick={handleCopy}
              className={`min-h-[46px] w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer shadow-sm active:scale-95 ${
                isCopied
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-[#005BAB] hover:bg-[#004885] text-white'
              }`}
            >
              {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{isCopied ? 'Đã sao chép tin nhắn!' : 'Sao chép tin nhắn'}</span>
            </button>

            {/* 2. NÚT GỬI QUA VIBER */}
            <button
              type="button"
              onClick={handleOpenViber}
              className="min-h-[46px] w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition active:scale-95 cursor-pointer shadow-sm border border-purple-500"
              title="Mở ứng dụng Viber chuyển tiếp tin nhắn"
            >
              <Send className="w-4 h-4" />
              <span>Gửi qua Viber</span>
            </button>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="bg-slate-50 px-4 sm:px-6 py-2.5 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>💡 <strong>Mẹo:</strong> Bấm <strong>Sao chép</strong> rồi dán (chạm giữ màn hình) vào nhóm chat.</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-bold px-2 py-1"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
