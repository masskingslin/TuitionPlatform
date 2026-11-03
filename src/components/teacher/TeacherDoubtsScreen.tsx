import React, { useState } from 'react';
import { useTuition } from '../../context/TuitionContext';
import { StudentDoubt } from '../../types';
import { MessageSquare, CheckCircle2, Send, HelpCircle, User } from 'lucide-react';

export const TeacherDoubtsScreen: React.FC = () => {
  const { doubts, replyDoubt } = useTuition();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL');
  const [activeDoubt, setActiveDoubt] = useState<StudentDoubt | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySuccess, setReplySuccess] = useState(false);

  const handleOpenReply = (doubt: StudentDoubt) => {
    setActiveDoubt(doubt);
    setReplyText(doubt.reply || '');
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDoubt || !replyText.trim()) return;
    replyDoubt(activeDoubt.id, replyText.trim());
    setActiveDoubt(null);
    setReplyText('');
    setReplySuccess(true);
    setTimeout(() => setReplySuccess(false), 3000);
  };

  const filtered = doubts.filter((d) => {
    if (filter === 'PENDING') return !d.isResolved;
    if (filter === 'RESOLVED') return d.isResolved;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-28">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Faculty Doubts & Discussion Forum</h2>
          <p className="text-xs text-slate-500">Address student queries, conceptual questions, and problem derivations</p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium self-start sm:self-center">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Doubts ({doubts.length})
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'PENDING' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Unresolved ({doubts.filter((d) => !d.isResolved).length})
          </button>
          <button
            onClick={() => setFilter('RESOLVED')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'RESOLVED' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Answered ({doubts.filter((d) => d.isResolved).length})
          </button>
        </div>
      </div>

      {replySuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Faculty resolution dispatched directly to student's portal!</span>
        </div>
      )}

      {/* Doubts List */}
      <div className="space-y-4">
        {filtered.map((doubt) => (
          <div
            key={doubt.id}
            className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs hover:border-teal-300 transition-colors space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-teal-700 shrink-0" />
                  <span className="font-bold text-slate-900 text-sm">{doubt.topic}</span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {doubt.subject}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1 text-slate-600">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {doubt.studentName}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{doubt.askedAt}</span>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded text-xs font-bold self-start sm:self-center shrink-0 border ${
                  doubt.isResolved
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {doubt.isResolved ? 'Resolved' : 'Pending Response'}
              </span>
            </div>

            <p className="text-sm text-slate-800 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 leading-relaxed">
              {doubt.question}
            </p>

            {doubt.reply && (
              <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3 text-xs text-teal-950 space-y-1">
                <div className="flex justify-between items-center text-[11px] text-teal-800 font-bold">
                  <span>Faculty Reply ({doubt.repliedBy})</span>
                  <span>{doubt.repliedAt}</span>
                </div>
                <p className="leading-relaxed">{doubt.reply}</p>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => handleOpenReply(doubt)}
                className="px-4 py-2 bg-[#00695C] hover:bg-[#005a4e] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{doubt.isResolved ? 'Edit Faculty Answer' : 'Submit Solution'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Reply Modal */}
      {activeDoubt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Resolve Student Doubt</h3>
                <p className="text-xs text-slate-500">Student: {activeDoubt.studentName} · Subject: {activeDoubt.subject}</p>
              </div>
              <button
                onClick={() => setActiveDoubt(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 mb-4 space-y-1">
              <span className="font-semibold text-slate-900 block">Question Topic: {activeDoubt.topic}</span>
              <p>{activeDoubt.question}</p>
            </div>

            <form onSubmit={handleSendReply} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Faculty Detailed Explanation / Solution Steps
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Provide step-by-step mathematical reasoning, reference definitions, and problem clarity..."
                  rows={5}
                  required
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveDoubt(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00695C] hover:bg-[#005a4e] text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Explanation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
