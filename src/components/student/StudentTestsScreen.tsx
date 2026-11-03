import React, { useState } from 'react';
import { useTuition } from '../../context/TuitionContext';
import { Award, CheckCircle2, Download, TrendingUp, Calendar } from 'lucide-react';

export const StudentTestsScreen: React.FC = () => {
  const { testResults, currentStudent } = useTuition();
  const [downloadSlip, setDownloadSlip] = useState<string | null>(null);

  // Compute test averages
  const totalScored = testResults.reduce((acc, t) => acc + t.marksScored, 0);
  const totalMax = testResults.reduce((acc, t) => acc + t.maxMarks, 0);
  const overallAvgPercent = totalMax > 0 ? ((totalScored / totalMax) * 100).toFixed(1) : '92.5';

  const handleDownloadReport = (testTitle: string) => {
    setDownloadSlip(testTitle);
    setTimeout(() => setDownloadSlip(null), 4000);
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-28">
      {/* Assessment Performance Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">
              Academic Evaluation Hub
            </span>
            <h2 className="text-xl font-bold tracking-tight">Test Series & Mock Exam Results</h2>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span>{currentStudent.name}</span>
              <span aria-hidden="true">·</span>
              <span>{currentStudent.grade}</span>
              <span aria-hidden="true">·</span>
              <span>Term 1 Unit Assessments</span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/10 px-4 py-2.5 rounded-xl border border-white/20">
            <div>
              <span className="text-[11px] text-indigo-200 block font-medium">Batch Average</span>
              <span className="text-xl font-bold text-white font-mono tabular-nums">{overallAvgPercent}%</span>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div>
              <span className="text-[11px] text-indigo-200 block font-medium">Top Percentile</span>
              <span className="text-xl font-bold text-emerald-400 font-mono tabular-nums">94.2%</span>
            </div>
          </div>
        </div>
      </div>

      {downloadSlip && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Evaluation scorecard & solution key for "{downloadSlip}" ready for download!</span>
        </div>
      )}

      {/* Tests List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">Published Unit & Mock Test Papers</h3>

        {testResults.map((test) => {
          const scorePercent = ((test.marksScored / test.maxMarks) * 100).toFixed(0);
          return (
            <div
              key={test.id}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs hover:border-indigo-300 transition-colors space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600 shrink-0" />
                    <h4 className="font-bold text-slate-900 text-base">{test.testTitle}</h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {test.date}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-slate-700">{test.subject}</span>
                    <span aria-hidden="true">·</span>
                    <span>Batch Highest: {test.highestBatchMarks}/{test.maxMarks}</span>
                  </div>
                </div>

                <div className="text-right self-start sm:self-center shrink-0">
                  <div className="text-xl font-bold text-indigo-900 font-mono tabular-nums">
                    {test.marksScored} <span className="text-xs text-slate-400 font-normal">/ {test.maxMarks}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                    {scorePercent}% Score · {test.percentile} Percentile
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all"
                  style={{ width: `${scorePercent}%` }}
                />
              </div>

              {/* Remarks */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <p>
                  <span className="font-semibold text-slate-800">Faculty Diagnostic Note: </span>
                  {test.remarks}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-400">Answer key verified by course teacher</span>
                <button
                  type="button"
                  onClick={() => handleDownloadReport(test.testTitle)}
                  className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download Evaluated Paper</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
