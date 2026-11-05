import React, { useState, useRef } from 'react';
import { uploadFileToStorage, validateFile, downloadFile } from '../../services/storageService';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Download
} from 'lucide-react';

interface FileUploadInputProps {
  label: string;
  folder: 'question_papers' | 'answer_sheets' | 'resources';
  onFileUploaded: (result: {
    downloadUrl: string;
    fileName: string;
    fileSizeFormatted: string;
    fileSizeBytes: number;
    contentType: string;
  }) => void;
  currentFileName?: string;
  currentFileSize?: string;
  currentFileUrl?: string;
  accept?: string;
  maxSizeMB?: number;
  required?: boolean;
  accentColor?: 'teal' | 'blue' | 'indigo' | 'purple';
}

export const FileUploadInput: React.FC<FileUploadInputProps> = ({
  label,
  folder,
  onFileUploaded,
  currentFileName,
  currentFileSize,
  currentFileUrl,
  accept = 'application/pdf,image/*',
  maxSizeMB = 10,
  accentColor = 'teal'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedInfo, setUploadedInfo] = useState<{
    name: string;
    size: string;
    url: string;
  } | null>(
    currentFileName
      ? {
          name: currentFileName,
          size: currentFileSize || 'File attached',
          url: currentFileUrl || ''
        }
      : null
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleProcessFile = async (file: File) => {
    setErrorMsg(null);
    const validation = validateFile(file);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Invalid file.');
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadFileToStorage(file, folder);
      setUploadedInfo({
        name: res.fileName,
        size: res.fileSizeFormatted,
        url: res.downloadUrl
      });
      onFileUploaded(res);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload to Firebase Storage failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const isPdf =
    uploadedInfo?.name.toLowerCase().endsWith('.pdf') ||
    uploadedInfo?.name.includes('pdf');

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
        <span className="text-[10px] text-slate-500 font-mono">
          PDF or Image · Max {maxSizeMB} MB
        </span>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {isUploading ? (
        <div className="border border-dashed border-indigo-300 bg-indigo-50/50 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-indigo-900 animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          <span className="text-xs font-semibold">Uploading to Firebase Storage...</span>
          <span className="text-[11px] text-indigo-700/80">Securing file download URL</span>
        </div>
      ) : uploadedInfo ? (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-700">
              {isPdf ? (
                <FileText className="w-5 h-5 text-rose-600" />
              ) : (
                <ImageIcon className="w-5 h-5 text-indigo-600" />
              )}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs text-slate-900 block truncate" title={uploadedInfo.name}>
                {uploadedInfo.name}
              </span>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                <span>{uploadedInfo.size}</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ready
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
            {uploadedInfo.url && (
              <>
                <button
                  type="button"
                  onClick={() => downloadFile(uploadedInfo.url, uploadedInfo.name)}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download</span>
                </button>

                <a
                  href={uploadedInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  title="Open Preview in New Tab"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                  <span>Open</span>
                </a>
              </>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                accentColor === 'teal'
                  ? 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                  : accentColor === 'blue'
                  ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
              }`}
            >
              Replace
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            dragOver
              ? accentColor === 'teal'
                ? 'border-teal-500 bg-teal-50/70 scale-[0.99]'
                : 'border-blue-500 bg-blue-50/70 scale-[0.99]'
              : 'border-slate-300 hover:border-teal-400 bg-slate-50/50 hover:bg-white'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center ${
                accentColor === 'teal'
                  ? 'bg-teal-50 border border-teal-100 text-teal-700'
                  : 'bg-blue-50 border border-blue-100 text-blue-700'
              }`}
            >
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Click to browse or drop file here
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                PDF or image file up to {maxSizeMB} MB
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
