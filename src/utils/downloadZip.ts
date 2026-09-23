import JSZip from 'jszip';
import { TaskDocument } from '../types';

export async function downloadNetlifyZip(tasks?: TaskDocument[]) {
  try {
    const cacheBuster = `t=${Date.now()}`;
    const response = await fetch(`/quan-ly-cv-netlify.zip?${cacheBuster}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quan-ly-cv-netlify-v3.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      return true;
    }
  } catch (err) {
    console.warn('Prebuilt netlify zip fetch failed, generating dynamically...', err);
  }

  // Fallback: Generate a clean deploy package on-the-fly using JSZip
  const zip = new JSZip();
  if (tasks && tasks.length > 0) {
    zip.file('tasks_data_backup.json', JSON.stringify(tasks, null, 2));
  }
  zip.file('_redirects', `/*    /index.html   200\n`);
  zip.file(
    'README_NETLIFY.txt',
    `HUONG DAN DEPLOY APP QUAN LY CV LEN NETLIFY\n1. Truy cap https://app.netlify.com/drop\n2. Keo tha file ZIP vao de deploy.\n`
  );

  const content = await zip.generateAsync({ type: 'blob' });
  const url = window.URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `quan-ly-cv-netlify-v3.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  return true;
}

export async function downloadGitHubZip(tasks?: TaskDocument[]) {
  try {
    const cacheBuster = `t=${Date.now()}`;
    const response = await fetch(`/quan-ly-cv-github.zip?${cacheBuster}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quan-ly-cv-github-repo.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      return true;
    }
  } catch (err) {
    console.warn('Prebuilt github zip fetch failed, generating dynamically...', err);
  }

  // Fallback dynamic zip
  const zip = new JSZip();
  if (tasks && tasks.length > 0) {
    zip.file('tasks_data_backup.json', JSON.stringify(tasks, null, 2));
  }
  zip.file(
    'HUONG_DAN_GITHUB.md',
    `# HƯỚNG DẪN DEPLOY LÊN GITHUB PAGES\n1. Tạo repository tại https://github.com/new\n2. Upload mã nguồn lên GitHub.\n3. Vào Settings > Pages > Chọn Source: GitHub Actions.\n`
  );
  zip.file(
    '.github/workflows/deploy.yml',
    `name: Deploy to GitHub Pages\non:\n  push:\n    branches: ["main"]\npermissions:\n  contents: read\n  pages: write\n  id-token: write\n`
  );

  const content = await zip.generateAsync({ type: 'blob' });
  const url = window.URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `quan-ly-cv-github-repo.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  return true;
}
