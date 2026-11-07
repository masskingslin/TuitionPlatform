import React, { useState, useEffect } from 'react';
import { Activity, Gauge, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

export interface RenderMetric {
  id: string;
  phase: 'mount' | 'update' | 'nested-update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
  timestamp: string;
}

// Global store for dev perf metrics
const metricsStore: RenderMetric[] = [];
const listeners: Set<() => void> = new Set();

export const logComponentRender = (
  id: string,
  phase: 'mount' | 'update' | 'nested-update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) => {
  if (!import.meta.env.DEV) return;

  const metric: RenderMetric = {
    id,
    phase,
    actualDuration: Number(actualDuration.toFixed(2)),
    baseDuration: Number(baseDuration.toFixed(2)),
    startTime: Number(startTime.toFixed(2)),
    commitTime: Number(commitTime.toFixed(2)),
    timestamp: new Date().toLocaleTimeString()
  };

  metricsStore.unshift(metric);
  if (metricsStore.length > 50) metricsStore.pop();

  // Log formatted message to browser console for optimization analysis
  console.log(
    `%c[Perf Monitor]%c ${id} (%c${phase}%c) — actual: %c${metric.actualDuration}ms%c | base: ${metric.baseDuration}ms`,
    'color: #0ea5e9; font-weight: bold;',
    'color: inherit; font-weight: bold;',
    phase === 'mount' ? 'color: #10b981;' : 'color: #f59e0b;',
    'color: inherit;',
    'color: #3b82f6; font-weight: bold;',
    'color: #64748b;'
  );

  listeners.forEach((listener) => listener());
};

export const DevPerfMonitorOverlay: React.FC = () => {
  const [metrics, setMetrics] = useState<RenderMetric[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [fps, setFps] = useState(60);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const updateMetrics = () => setMetrics([...metricsStore]);
    listeners.add(updateMetrics);
    updateMetrics();

    // FPS Counter
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const calcFps = () => {
      frameCount++;
      const now = performance.now();
      if (now >= lastTime + 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      animationFrameId = requestAnimationFrame(calcFps);
    };

    animationFrameId = requestAnimationFrame(calcFps);

    return () => {
      listeners.delete(updateMetrics);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (!import.meta.env.DEV) return null;

  const latestMetric = metrics[0];

  return (
    <div className="fixed bottom-4 left-4 z-50 font-sans text-xs">
      {/* Small Compact Badge */}
      <div className="flex items-center gap-2 bg-slate-900/95 dark:bg-slate-950/95 text-slate-100 backdrop-blur-md px-3 py-2 rounded-xl shadow-xl border border-slate-700/80 text-xs">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-teal-400 font-bold">
          <Gauge className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span>{fps} FPS</span>
        </div>

        <div className="w-px h-3.5 bg-slate-700" />

        {latestMetric ? (
          <div className="flex items-center gap-1.5 font-mono">
            <span className="font-semibold text-sky-400">{latestMetric.id}</span>
            <span className="text-slate-400">({latestMetric.phase}):</span>
            <span className="font-bold text-amber-300">{latestMetric.actualDuration}ms</span>
          </div>
        ) : (
          <span className="text-slate-400 italic">Perf Monitor Ready</span>
        )}

        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          title={isExpanded ? 'Collapse Perf Inspector' : 'Expand Perf Inspector'}
          aria-label="Toggle performance inspector"
        >
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Metrics Panel */}
      {isExpanded && (
        <div className="mt-2 w-80 bg-slate-900/95 text-slate-100 backdrop-blur-md p-3.5 rounded-2xl shadow-2xl border border-slate-700 space-y-2.5 max-h-72 overflow-y-auto animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
              <Activity className="w-4 h-4 text-sky-400" />
              <span>Lazy Components Render Log</span>
            </div>
            <button
              onClick={() => {
                metricsStore.length = 0;
                setMetrics([]);
              }}
              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Clear Logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            {metrics.length === 0 ? (
              <p className="text-slate-500 text-center py-2 text-xs">No renders recorded yet.</p>
            ) : (
              metrics.slice(0, 10).map((m, idx) => (
                <div
                  key={`${m.id}-${m.startTime}-${idx}`}
                  className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-sky-300 block">{m.id}</span>
                    <span className="text-[10px] text-slate-400">
                      {m.timestamp} · {m.phase}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-300 block">{m.actualDuration}ms</span>
                    <span className="text-[10px] text-slate-500">base: {m.baseDuration}ms</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
