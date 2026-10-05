import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Support large uploads for multi-page PDF or high-resolution images
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      time: new Date().toISOString(),
    });
  });

  // API Route: Scan & Extract Document
  app.post('/api/scan-document', async (req, res) => {
    try {
      const { fileBase64, mimeType, textContent } = req.body;

      if (!fileBase64 && !textContent) {
        return res.status(400).json({
          success: false,
          error: 'Vui lòng cung cấp hình ảnh, tệp PDF hoặc nội dung văn bản để quét.',
        });
      }

      const contentsParts: any[] = [];

      if (fileBase64 && mimeType) {
        // Strip base64 prefix if provided (e.g. data:image/png;base64,...)
        const cleanBase64 = fileBase64.includes('base64,')
          ? fileBase64.split('base64,')[1]
          : fileBase64;

        contentsParts.push({
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64,
          },
        });
      }

      const promptInstruction = `
Bạn là chuyên gia phân tích và trích xuất dữ liệu văn bản hành chính, văn bản giao việc kỹ thuật viễn thông (VNPT).
Nhiệm vụ của bạn là đọc kỹ hình ảnh, tệp PDF hoặc nội dung văn bản được cung cấp và trích xuất chính xác các trường thông tin quản lý sau thành định dạng JSON:

1. docCodeNum: Số văn bản (chỉ lấy phần số, ví dụ "458", "123", "89", "02").
2. docIssuer: Phòng/ban giao NV (ký hiệu đơn vị ban hành gắn liền với số hiệu văn bản sau dấu '/', ví dụ "P.KT", "P.KHĐT", "PKTTC", "PNS", "P.HCTH", "Đài VT", "X.VT", "X.HT", "VNPT-KT", v.v.).
3. fullDocNumber: Toàn bộ số và ký hiệu văn bản đầy đủ (ví dụ "458/P.KT", "123/VNPT-KT").
4. title: Trích yếu nội dung văn bản (V/v...). Viết ngắn gọn, rõ ràng, nêu đúng bản chất công việc cần làm.
5. issueDate: Ngày ký/ban hành văn bản (định dạng YYYY-MM-DD). Nếu văn bản ghi dạng "ngày... tháng... năm...", hãy chuyển đổi về YYYY-MM-DD.
6. dueDate: Hạn báo cáo / hạn hoàn thành công việc (định dạng YYYY-MM-DD). Hãy tìm trong các câu chỉ đạo như "yêu cầu hoàn thành trước ngày...", "báo cáo trước ngày...", "thực hiện xong trong ngày...", v.v. Nếu không có hạn cụ thể, mặc định lấy ngày ban hành cộng thêm 7 ngày.
7. priority: Mức độ ưu tiên ("Bình thường", "Quan trọng", hoặc "Khẩn cấp"). Nếu văn bản có đóng dấu "HỎA TỐC", "THƯỢNG KHẨN", "KHẨN" thì là "Khẩn cấp". Nếu có tính chất chỉ đạo đột xuất hoặc khắc phục sự cố thì là "Quan trọng". Bình thường thì chọn "Bình thường".
8. assignee: Cán bộ kỹ thuật / người chịu trách nhiệm chính thực hiện (tìm trong phần Kính gửi, Giao cho, Nơi nhận, hoặc người được chỉ định phân công).
9. department: Phòng ban / Đơn vị phối hợp (các đơn vị được yêu cầu phối hợp thực hiện cùng. Chú ý: TUYỆT ĐỐI KHÔNG điền đơn vị giao NV ở mục 2 vào ô này; nếu văn bản không có đơn vị phối hợp riêng biệt thì để trống "").
10. notes: Tóm tắt 1-2 câu ngắn gọn các yêu cầu chỉ đạo quan trọng cần thực hiện trong văn bản.
11. confidence: Điểm tin cậy trích xuất của bạn từ 0 đến 100.
${textContent ? `\n\nNội dung văn bản đính kèm:\n${textContent}` : ''}
`;

      contentsParts.push({ text: promptInstruction });

      const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
      let lastError: any = null;
      let response: any = null;

      for (const modelName of candidateModels) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: { parts: contentsParts },
            config: {
              systemInstruction:
                'Bạn là chuyên gia phân tích văn bản hành chính & điều hành tác nghiệp VNPT. Luôn trích xuất chính xác và trả về định dạng JSON theo schema được yêu cầu.',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  docCodeNum: { type: Type.STRING, description: 'Phần số của văn bản (VD: 458)' },
                  docIssuer: { type: Type.STRING, description: 'Phòng/ban giao NV gắn liền sau dấu / (VD: P.KT, P.KHĐT)' },
                  fullDocNumber: { type: Type.STRING, description: 'Toàn bộ số hiệu văn bản (VD: 458/P.KT)' },
                  title: { type: Type.STRING, description: 'Trích yếu nội dung văn bản' },
                  issueDate: { type: Type.STRING, description: 'Ngày ban hành YYYY-MM-DD' },
                  dueDate: { type: Type.STRING, description: 'Hạn hoàn thành YYYY-MM-DD' },
                  priority: {
                    type: Type.STRING,
                    enum: ['Bình thường', 'Quan trọng', 'Khẩn cấp'],
                    description: 'Mức độ ưu tiên',
                  },
                  assignee: { type: Type.STRING, description: 'Cán bộ kỹ thuật thực hiện' },
                  department: { type: Type.STRING, description: 'Phòng ban / Đơn vị phối hợp (nếu có, không trùng với phòng/ban giao NV)' },
                  notes: { type: Type.STRING, description: 'Tóm tắt nội dung chỉ đạo' },
                  confidence: { type: Type.INTEGER, description: 'Độ tin cậy trích xuất 0-100' },
                },
                required: ['fullDocNumber', 'title', 'issueDate', 'dueDate', 'priority'],
              },
            },
          });
          if (response && response.text) {
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Model ${modelName} failed, trying next candidate...`, err?.message || err);
          // Small pause before fallback
          await new Promise((r) => setTimeout(r, 600));
        }
      }

      if (!response || !response.text) {
        throw lastError || new Error('Không thể kết nối với dịch vụ AI phân tích văn bản.');
      }

      const responseText = response.text || '{}';
      const extractedData = JSON.parse(responseText);

      return res.json({
        success: true,
        data: extractedData,
      });
    } catch (error: any) {
      console.error('Scan document error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Lỗi khi phân tích văn bản với AI. Vui lòng thử lại.',
      });
    }
  });

  // Vite in dev mode, static files in production mode
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
