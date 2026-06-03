import { useState, useCallback } from 'react';
import { FileUploadBox } from '@/components/common/FileUploadBox';
import { DataTable } from '@/components/common/DataTable';
import type { Column } from '@/components/common/DataTable';
import type { UploadedFile, FileCategory } from '@/types';
import { FILE_CATEGORY_LABELS } from '@/types';
import { parseCSV, guessFileCategory } from '@/lib/fileParser';
import Papa from 'papaparse';
import { Upload, FileText, Database } from 'lucide-react';

export function DataUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);

  const handleFilesAdded = useCallback(async (newFiles: UploadedFile[]) => {
    // Try parsing the first CSV for preview
    const csvFile = newFiles.find((f) => f.type === 'csv');
    setFiles((prev) => [...prev, ...newFiles]);

    if (csvFile) {
      // We don't have the actual File object here, just metadata
      // In a real app, we'd read from the actual File
      setPreviewFile(csvFile);
    }
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (previewFile?.id === id) {
      setPreviewFile(null);
      setPreviewData([]);
    }
  }, [previewFile]);

  const columns: Column<UploadedFile>[] = [
    { key: 'name', header: '文件名', render: (r) => <span className="text-xs font-medium">{r.name}</span> },
    { key: 'size', header: '大小', render: (r) => <span className="text-xs">{(r.size / 1024).toFixed(1)} KB</span> },
    { key: 'type', header: '类型', render: (r) => <span className="chip bg-white/5 text-text-muted border-white/10 text-xs">{r.type.toUpperCase()}</span> },
    { key: 'category', header: '分类', render: (r) => (
      <select defaultValue={r.category} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-text-primary outline-none">
        {Object.entries(FILE_CATEGORY_LABELS).map(([k, v]) => (
          <option key={k} value={k} className="bg-bg-dark">{v}</option>
        ))}
      </select>
    )},
    { key: 'uploadedAt', header: '上传时间', render: (r) => <span className="text-xs">{new Date(r.uploadedAt).toLocaleString('zh-CN')}</span> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">数据投喂</h1>
        <p className="text-sm text-text-secondary mt-1">
          上传每日/每周/月度报表 · 第一版本地预览，后续接入 Cloudflare R2 + D1
        </p>
      </div>

      {/* Upload zone */}
      <div className="panel-card">
        <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Upload size={16} /> 上传报表
        </h2>
        <FileUploadBox
          files={files}
          onFilesAdded={handleFilesAdded}
          onRemoveFile={removeFile}
        />
        <p className="text-xs text-text-muted mt-3">
          支持 .csv / .xlsx / .xls · 文件不会上传到服务器，仅本地预览
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <FileText size={16} /> 已添加文件 ({files.length})
          </h2>
          <DataTable columns={columns} data={files} searchable={false} />
        </div>
      )}

      {/* Architecture note */}
      <div className="panel-card border-accent-cyan/20">
        <div className="flex items-start gap-3">
          <Database size={20} className="text-accent-cyan shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-accent-cyan">后续架构</h3>
            <div className="text-xs text-text-secondary mt-2 space-y-1">
              <p><strong>第一版（当前）:</strong> 本地文件选择 + CSV/XLSX 预览</p>
              <p><strong>第二版:</strong> 上传到 Cloudflare R2 存储</p>
              <p><strong>第三版:</strong> 解析后写入 Cloudflare D1 数据库</p>
              <p><strong>第四版:</strong> 接入腾讯文档 API 自动同步</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
