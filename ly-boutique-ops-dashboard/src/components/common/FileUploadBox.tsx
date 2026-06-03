import { useState, useCallback } from 'react';
import { Upload, File, X, FileSpreadsheet, FileText } from 'lucide-react';
import type { UploadedFile, FileCategory } from '@/types';
import { FILE_CATEGORY_LABELS } from '@/types';

interface FileUploadBoxProps {
  onFilesAdded: (files: UploadedFile[]) => void;
  files: UploadedFile[];
  onRemoveFile: (id: string) => void;
}

export function FileUploadBox({ onFilesAdded, files, onRemoveFile }: FileUploadBoxProps) {
  const [dragOver, setDragOver] = useState(false);

  const processFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: UploadedFile[] = Array.from(fileList).map((f) => ({
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: f.name,
        size: f.size,
        type: f.name.endsWith('.csv') ? 'csv' : f.name.endsWith('.xlsx') || f.name.endsWith('.xls') ? 'xlsx' : 'unknown',
        category: 'other' as FileCategory,
        uploader: '当前用户',
        uploadedAt: new Date().toISOString(),
        store: '',
        site: '',
        period: '',
        purpose: '',
      }));
      onFilesAdded(newFiles);
    },
    [onFilesAdded]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  };

  const getIcon = (type: string) => {
    if (type === 'csv') return <FileText size={18} className="text-accent-green" />;
    if (type === 'xlsx') return <FileSpreadsheet size={18} className="text-accent-green" />;
    return <File size={18} className="text-text-muted" />;
  };

  return (
    <div className="space-y-3">
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center h-36 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
          dragOver ? 'border-accent-cyan bg-accent-cyan/5' : 'border-white/15 hover:border-accent-cyan/40'
        }`}
      >
        <input
          type="file"
          multiple
          accept=".csv,.xlsx,.xls"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
          className="hidden"
        />
        <Upload size={28} className={`mb-2 ${dragOver ? 'text-accent-cyan' : 'text-text-muted'}`} />
        <span className="text-sm text-text-secondary">
          拖入或<span className="text-accent-cyan font-medium">选择报表文件</span>
        </span>
        <span className="text-xs text-text-muted mt-1">支持 .csv / .xlsx / .xls</span>
      </label>

      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((f) => (
            <div key={f.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/8">
              <div className="flex items-center gap-2.5 min-w-0">
                {getIcon(f.type)}
                <div className="min-w-0">
                  <p className="text-sm text-text-primary truncate">{f.name}</p>
                  <p className="text-[11px] text-text-muted">
                    {(f.size / 1024).toFixed(1)} KB · {f.category === 'other' ? '未分类' : FILE_CATEGORY_LABELS[f.category]}
                  </p>
                </div>
              </div>
              <button onClick={() => onRemoveFile(f.id)} className="text-text-muted hover:text-accent-red transition-colors shrink-0">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
