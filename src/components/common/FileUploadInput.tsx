import React, { useState } from 'react';
import { validateHttpsUrl, openExternalLink } from '../../services/storageService';
import {
  Link2,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface FileUploadInputProps {
  label: string;
  folder?: 'question_papers' | 'answer_sheets' | 'resources';
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
  onFileUploaded,
  currentFileName,
  currentFileUrl,
  accentColor = 'teal'
}) => {
  const [urlInput, setUrlInput] = useState(currentFileUrl || '');
  const [titleInput, setTitleInput] = useState(currentFileName || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(Boolean(currentFileUrl));

  const handleApplyLink = () => {
    setErrorMsg(null);
    const validation = validateHttpsUrl(urlInput);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Please enter a valid https:// URL.');
      return;
    }

    const trimmedUrl = urlInput.trim();
    let derivedName = titleInput.trim();
    if (!derivedName) {
      try {
        const parsed = new URL(trimmedUrl);
        derivedName = parsed.hostname + parsed.pathname.slice(-20);
      } catch {
        derivedName = 'Shared Cloud Resource';
      }
    }

    setIsConfirmed(true);
    onFileUploaded({
      downloadUrl: trimmedUrl,
      fileName: derivedName,
      fileSizeFormatted: 'HTTPS Cloud Link',
      fileSizeBytes: 0,
      contentType: 'text/html'
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
        <span className="text-[10px] text-slate-500 font-mono">
          Google Drive, YouTube, Docs, etc.
        </span>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isConfirmed && urlInput.trim() ? (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-indigo-600">
              <Link2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs text-slate-900 block truncate">
                {titleInput.trim() || 'Shared Cloud Resource'}
              </span>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 truncate">
                <span className="truncate">{urlInput}</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-0.5 shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Linked
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openExternalLink(urlInput)}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
              <span>Open</span>
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmed(false)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                accentColor === 'teal'
                  ? 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
              }`}
            >
              Edit Link
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
          <div className="space-y-1">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Paste secure link: https://drive.google.com/..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="Link Title (e.g., Chapter 8 Solution PDF)"
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={handleApplyLink}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-xs transition-colors shrink-0"
            >
              <span>Attach Link</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
