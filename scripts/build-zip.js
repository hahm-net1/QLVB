import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

async function buildAllZipPackages() {
  const distDir = path.resolve('dist');
  const publicDir = path.resolve('public');
  const rootDir = path.resolve('.');

  if (!fs.existsSync(distDir)) {
    console.error('dist directory does not exist! Run vite build first.');
    process.exit(1);
  }

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Ensure 404.html exists in dist for GitHub Pages routing fallback
  const distIndex = path.join(distDir, 'index.html');
  const dist404 = path.join(distDir, '404.html');
  if (fs.existsSync(distIndex)) {
    fs.copyFileSync(distIndex, dist404);
  }

  // Ensure .nojekyll exists in dist for GitHub Pages
  const distNoJekyll = path.join(distDir, '.nojekyll');
  fs.writeFileSync(distNoJekyll, '');

  // Helper recursive directory copier for JSZip
  function addDirToZip(dirPath, zipFolder, excludeFilter) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      if (excludeFilter && excludeFilter(file, dirPath)) {
        continue;
      }
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const subFolder = zipFolder.folder(file);
        addDirToZip(fullPath, subFolder, excludeFilter);
      } else {
        const content = fs.readFileSync(fullPath);
        zipFolder.file(file, content);
      }
    }
  }

  // ==========================================
  // PACKAGE 1: Netlify Deploy ZIP
  // ==========================================
  console.log('Generating Netlify deploy zip...');
  const netlifyZip = new JSZip();
  addDirToZip(distDir, netlifyZip, (file) => file.endsWith('.zip') || file === '.git');

  netlifyZip.file('_redirects', '/*    /index.html   200\n');
  netlifyZip.file(
    'README_NETLIFY.txt',
    `HUONG DAN DEPLOY APP QUAN LY CV LEN NETLIFY
============================================

Cach 1: Netlify Drop (Nhanh nhat - khong can build):
1. Truy cap https://app.netlify.com/drop
2. Dang nhap hoac tao tai khoan Netlify mien phi.
3. Keo tha truc tiep file ZIP nay vao o "Drag and drop your site output folder here".
4. Website se duoc publish truc tuyen trong vai giay!
`
  );

  const netlifyZipBuffer = await netlifyZip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  const netlifyZipPath = path.join(publicDir, 'quan-ly-cv-netlify.zip');
  fs.writeFileSync(netlifyZipPath, netlifyZipBuffer);
  fs.writeFileSync(path.join(distDir, 'quan-ly-cv-netlify.zip'), netlifyZipBuffer);
  console.log(`Generated: ${netlifyZipPath} (${(netlifyZipBuffer.length / 1024).toFixed(1)} KB)`);

  // ==========================================
  // PACKAGE 2: GitHub Repository & Pages ZIP
  // ==========================================
  console.log('Generating GitHub repository zip...');
  const githubZip = new JSZip();

  // 1. Add source files
  const rootFilesToInclude = [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'index.html',
    '.gitignore',
    'HUONG_DAN_GITHUB.md',
  ];

  for (const f of rootFilesToInclude) {
    const fullPath = path.join(rootDir, f);
    if (fs.existsSync(fullPath)) {
      githubZip.file(f, fs.readFileSync(fullPath));
    }
  }

  // Add src directory
  const srcDir = path.join(rootDir, 'src');
  if (fs.existsSync(srcDir)) {
    addDirToZip(srcDir, githubZip.folder('src'), (file) => file === '.DS_Store');
  }

  // Add public directory (excluding zips)
  if (fs.existsSync(publicDir)) {
    addDirToZip(publicDir, githubZip.folder('public'), (file) => file.endsWith('.zip') || file === 'assets');
  }

  // Add .github/workflows/deploy.yml
  const workflowDir = path.join(rootDir, '.github', 'workflows');
  if (fs.existsSync(workflowDir)) {
    addDirToZip(workflowDir, githubZip.folder('.github').folder('workflows'));
  }

  // Add dist static files in a separate folder for 1-click drag & drop
  const staticDistFolder = githubZip.folder('dist_gh_pages');
  addDirToZip(distDir, staticDistFolder, (file) => file.endsWith('.zip'));

  // Add friendly README for GitHub
  githubZip.file(
    'README.md',
    `# Hệ Thống Quản Lý CV - VNPT Kỹ Thuật

Ứng dụng quản lý, phân công và đôn đốc văn bản giao việc chuyên nghiệp cho chuyên viên kỹ thuật VNPT.

## Tính năng nổi bật:
- Quản lý văn bản, hạn báo cáo, đôn đốc tiến độ.
- Hệ thống thông báo đẩy (Browser Push Notification) khi văn bản còn ≤ 1 ngày.
- Xuất báo cáo Excel (.xlsx), sao lưu dữ liệu (.json).
- Tích hợp sẵn GitHub Actions tự động build và deploy lên GitHub Pages miễn phí.

## Cách deploy lên GitHub Pages:
1. Đẩy toàn bộ mã nguồn này lên repository GitHub của bạn:
   \`\`\`bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<username>/<repo-name>.git
   git push -u origin main
   \`\`\`
2. Vào **Settings** > **Pages** trên GitHub repository > Chọn **Source: GitHub Actions**.
3. Website sẽ tự động được triển khai tại: \`https://<username>.github.io/<repo-name>/\`.

Xem chi tiết trong tệp: \`HUONG_DAN_GITHUB.md\` đính kèm.
`
  );

  const githubZipBuffer = await githubZip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  const githubZipPath = path.join(publicDir, 'quan-ly-cv-github.zip');
  fs.writeFileSync(githubZipPath, githubZipBuffer);
  fs.writeFileSync(path.join(distDir, 'quan-ly-cv-github.zip'), githubZipBuffer);
  console.log(`Generated: ${githubZipPath} (${(githubZipBuffer.length / 1024).toFixed(1)} KB)`);
}

buildAllZipPackages().catch((err) => {
  console.error('Build zip packages error:', err);
  process.exit(1);
});
