import { useState } from 'react';
import { Upload, FileText, X, AlertCircle, FileUp } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';
import { documentParser } from '@/services/aiService';

interface FileUploadProps {
  onContentExtracted: (content: string, fileName: string, fileType: string) => void;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  content: string;
  error?: string;
}

const acceptedTypes = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg', '.webp'];

export function FileUpload({ onContentExtracted }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [parsing, setParsing] = useState(false);

  const handleFiles = async (fileList: FileList) => {
    setParsing(true);
    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(fileList)) {
      try {
        const content = await documentParser.parseFile(file);
        newFiles.push({
          name: file.name,
          size: file.size,
          type: file.type || 'unknown',
          content,
        });
        onContentExtracted(content, file.name, file.type || 'unknown');
      } catch {
        newFiles.push({
          name: file.name,
          size: file.size,
          type: file.type || 'unknown',
          content: '',
          error: 'Failed to parse file',
        });
      }
    }

    setFiles((prev) => [...prev, ...newFiles]);
    setParsing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200',
          dragActive
            ? 'border-primary-400 bg-primary-50/50 dark:bg-primary-900/20 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-600 hover:border-primary-300 dark:hover:border-primary-600',
        )}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="absolute inset-0 opacity-0 cursor-pointer"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-3">
          <div className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center transition-all',
            dragActive
              ? 'bg-primary-500 text-white scale-110'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500',
          )}>
            {parsing ? <FileUp size={24} className="animate-pulse" /> : <Upload size={24} />}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {parsing ? 'Parsing files...' : 'Drag & drop files here or click to browse'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Supports PDF, DOC, DOCX, TXT, and Images
            </p>
          </div>
        </label>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border animate-fade-in',
                file.error
                  ? 'border-error-200 dark:border-error-800/50 bg-error-50 dark:bg-error-900/20'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30',
              )}
            >
              <div className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                file.error ? 'bg-error-100 dark:bg-error-900/40 text-error-500' : 'bg-primary-100 dark:bg-primary-900/40 text-primary-500',
              )}>
                {file.error ? <AlertCircle size={18} /> : <FileText size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{file.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatFileSize(file.size)}
                  {file.error && <span className="text-error-500 ml-2">— {file.error}</span>}
                </p>
              </div>
              <button
                onClick={() => removeFile(i)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
