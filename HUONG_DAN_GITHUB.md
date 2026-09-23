# HƯỚNG DẪN TRIỂN KHAI ỨNG DỤNG "QUẢN LÝ CV" LÊN GITHUB & GITHUB PAGES
===================================================================

Dự án này đã được cấu hình sẵn 100% để triển khai lên GitHub và tự động chạy trên GitHub Pages (hoặc kết nối Vercel, Netlify) hoàn toàn miễn phí.

---

## CÁCH 1: ĐẨY TOÀN BỘ MÃ NGUỒN LÊN GITHUB (KHUYÊN DÙNG - TỰ ĐỘNG BUILD)

### Bước 1: Tạo Repository mới trên GitHub
1. Đăng nhập vào GitHub: https://github.com
2. Bấm vào nút **"New"** (hoặc truy cập trực tiếp: https://github.com/new).
3. Đặt tên Repository (ví dụ: `quan-ly-cv`).
4. Chọn chế độ **Public** (hoặc **Private**).
5. **Không cần** tích chọn "Add a README file" hay ".gitignore" (vì trong gói tải về đã có sẵn).
6. Bấm nút **"Create repository"**.

### Bước 2: Tải và giải nén gói mã nguồn
1. Tải file **`quan-ly-cv-github-repo.zip`** từ ứng dụng về máy tính.
2. Giải nén file ZIP ra một thư mục trên máy tính.

### Bước 3: Đẩy mã nguồn lên GitHub bằng Git Command
Mở terminal (Command Prompt, PowerShell hoặc Git Bash) tại thư mục vừa giải nén và chạy lần lượt các lệnh sau:

```bash
git init
git add .
git commit -m "Khởi tạo hệ thống Quản lý CV VNPT"
git branch -M main
git remote add origin https://github.com/<tên-tài-khoản-của-bạn>/quan-ly-cv.git
git push -u origin main
```
*(Thay `<tên-tài-khoản-của-bạn>` bằng username GitHub của bạn)*

> **Mẹo (Không cần dòng lệnh Git):** Nếu bạn không quen dùng command line, trên trang repository mới tạo trên GitHub, bạn chỉ cần bấm vào dòng chữ **"uploading an existing file"**, kéo thả tất cả các tệp trong thư mục giải nén vào rồi bấm **"Commit changes"**!

### Bước 4: Kích hoạt GitHub Pages (Website trực tuyến)
1. Tại trang Repository trên GitHub, vào mục **Settings** (tab trên cùng).
2. Ở menu bên trái, tìm và bấm chọn **Pages**.
3. Tại phần **Build and deployment > Source**, bấm vào menu chọn **GitHub Actions**.
4. GitHub Actions sẽ tự động phát hiện file cấu hình `.github/workflows/deploy.yml` đã được tạo sẵn và tự động build website trong khoảng 1 phút.
5. Sau khi hoàn tất, đường link website của bạn sẽ xuất hiện ngay tại trang này:
   `https://<tên-tài-khoản>.github.io/quan-ly-cv/`

---

## CÁCH 2: KẾT NỐI VỚI VERCEL HOẶC NETLIFY TỪ GITHUB
Nếu repository của bạn đã ở trên GitHub, bạn cũng có thể liên kết tự động với Vercel hoặc Netlify:
1. Đăng nhập vào https://vercel.com hoặc https://app.netlify.com
2. Bấm **"Add New Project"** > **"Import from GitHub"**.
3. Chọn repo `quan-ly-cv`.
4. Bấm **Deploy**. Mỗi lần bạn cập nhật mã nguồn trên GitHub, website trên Vercel / Netlify sẽ tự động cập nhật theo!
