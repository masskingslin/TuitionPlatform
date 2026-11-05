import React from 'react';
import { X, ExternalLink, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { downloadFile } from '../../services/storageService';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl?: string | null;
  fileName: string;
  title?: string;
  fileSize?: string;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  title = 'Document Preview',
  fileSize
}) => {
  if (!isOpen) return null;

  const isPdf =
    fileName.toLowerCase().endsWith('.pdf') ||
    fileUrl?.includes('application/pdf') ||
    fileUrl?.includes('.pdf');

  const isImage =
    /\.(png|jpe?g|webp|gif|svg)$/i.test(fileName) ||
    fileUrl?.startsWith('data:image/') ||
    fileUrl?.includes('image/');

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-white/10 text-white">
              {isPdf ? <FileText className="w-4 h-4 text-rose-400" /> : <ImageIcon className="w-4 h-4 text-indigo-400" />}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                {title}
              </span>
              <h3 className="text-sm font-bold truncate text-white max-w-md" title={fileName}>
                {fileName}
              </h3>
              {fileSize && <span className="text-[11px] text-slate-400 font-mono">{fileSize}</span>}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {fileUrl && (
              <>
                <button
                  type="button"
                  onClick={() => downloadFile(fileUrl, fileName)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </button>

                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Open in Full Tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open New Tab</span>
                </a>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 p-4 bg-slate-100 overflow-y-auto flex items-center justify-center min-h-[350px]">
          {fileUrl ? (
            isImage ? (
              <div className="max-w-full max-h-[75vh] flex items-center justify-center bg-white p-2 rounded-xl shadow-inner border border-slate-300">
                <img
                  src={fileUrl}
                  alt={fileName}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              </div>
            ) : isPdf ? (
              <iframe
                src={fileUrl}
                title={fileName}
                className="w-full h-[70vh] bg-white rounded-xl border border-slate-300 shadow-sm"
              />
            ) : (
              <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 max-w-md space-y-3 shadow-sm">
                <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">{fileName}</h4>
                <p className="text-xs text-slate-500">
                  Click below to open and review this document in your browser viewer.
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Real File</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => downloadFile(fileUrl, fileName)}
                    className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 max-w-md space-y-2">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">{fileName}</h4>
              <p className="text-xs text-slate-500">
                This item is using a placeholder document from demo seed data. Upload a real file to view live content.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
