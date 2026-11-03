import React, { useState } from 'react';
import { useTuition } from '../../context/TuitionContext';
import { LinkedParent } from '../../types';
import { Users, Copy, Check, RefreshCw, Share2, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';

export const ParentAccessCard: React.FC = () => {
  const { parentLinkCode, createParentLinkCode, linkedParents, revokeParent } = useTuition();
  const [copied, setCopied] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<LinkedParent | null>(null);

  const handleCopy = () => {
    if (!parentLinkCode) return;
    navigator.clipboard?.writeText(
      `Use this code in the Tuition Platform Parent Portal to view my school attendance, homework, and fees: ${parentLinkCode.code}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = () => {
    if (!parentLinkCode) return;
    if (navigator.share) {
      navigator.share({
        title: 'Tuition Platform Parent Access Code',
        text: `Use this code in the Tuition app to view my school progress: ${parentLinkCode.code}`
      }).catch(() => handleCopy());
    } else {
      handleCopy();
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600 shrink-0" />
            <h4 className="font-bold text-slate-900 text-base">Parent Access & Link Code</h4>
          </div>
          <p className="text-xs text-slate-500">
            Let a parent follow your attendance, homework and fees. Generate a code and give it to them — it works for 48 hours. They can only view, not change anything.
          </p>
        </div>

        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 self-start sm:self-center shrink-0 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Read-Only Access</span>
        </span>
      </div>

      {parentLinkCode ? (
        <div className="space-y-3">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">Your Active Parent Code</span>
              <span className="font-mono text-2xl font-bold tracking-wider text-blue-900 block my-0.5">
                {parentLinkCode.code}
              </span>
              <span className="text-[11px] text-slate-500">
                Valid for 48 hours ({parentLinkCode.expiresAt}). Generating a new code replaces this one.
              </span>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Code</span>
              </button>

              <button
                type="button"
                onClick={() => createParentLinkCode()}
                className="p-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-600 rounded-lg transition-colors cursor-pointer"
                title="Generate a fresh code"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => createParentLinkCode()}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>Generate Parent Access Code</span>
          </button>
        </div>
      )}

      {/* Linked Parents List */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Parents Who Can See Your Data ({linkedParents.length})
        </h5>

        {linkedParents.length === 0 ? (
          <div className="p-3 text-xs text-slate-500 bg-slate-50 rounded-lg text-center">
            No parent is currently linked. Generate a code above and hand it to your parent.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {linkedParents.map((parent) => (
              <div key={parent.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{parent.fullName}</span>
                  <span className="text-[11px] text-slate-500">
                    {parent.email} {parent.phone ? `· ${parent.phone}` : ''} · Linked {parent.linkedAt}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setConfirmRemove(parent)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Access</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmRemove && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h4 className="font-bold text-slate-900 text-base">Remove {confirmRemove.fullName}?</h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              They will immediately lose access to your tuition attendance records, homework assignments, and fee status.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmRemove(null)}
                className="px-3.5 py-1.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  revokeParent(confirmRemove.id);
                  setConfirmRemove(null);
                }}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-2xs cursor-pointer"
              >
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
