import React, { useState } from 'react';
import { EducationalResource } from '../../types';
import { downloadFile } from '../../services/storageService';
import {
  X,
  ExternalLink,
  Download,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  FileText,
  Video,
  FileSpreadsheet,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { openExternalUrl } from '../../platform';

interface ResourcePreviewModalProps {
  resource: EducationalResource | null;
  onClose: () => void;
  isTeacher?: boolean;
}

export const ResourcePreviewModal: React.FC<ResourcePreviewModalProps> = ({
  resource,
  onClose,
  isTeacher = false
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfPage, setPdfPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'PREVIEW' | 'NOTES'>('PREVIEW');
  const [iframeError, setIframeError] = useState(false);

  if (!resource) return null;

  const totalPdfPages = resource.fileSizeOrDuration?.includes('pages')
    ? parseInt(resource.fileSizeOrDuration.match(/(\d+)\s*pages/)?.[1] || '6', 10)
    : 6;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(resource.urlOrFilename);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const getCleanUrl = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  const isWebUrl =
    resource.urlOrFilename.startsWith('http://') ||
    resource.urlOrFilename.startsWith('https://') ||
    resource.urlOrFilename.includes('.com') ||
    resource.urlOrFilename.includes('.org') ||
    resource.urlOrFilename.includes('.edu') ||
    resource.urlOrFilename.includes('.nic.in');

  // Render in-app interactive preview based on material type
  const renderPreviewContent = () => {
    // 1. VIDEO PREVIEWS (Khan Academy, YouTube, Lectures)
    if (resource.type === 'VIDEO') {
      const isYouTube = resource.urlOrFilename.includes('youtube.com') || resource.urlOrFilename.includes('youtu.be');
      const embedUrl = isYouTube
        ? resource.urlOrFilename.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')
        : null;

      return (
        <div className="flex-1 flex flex-col bg-slate-950 text-white rounded-xl overflow-hidden relative min-h-[380px]">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={resource.title}
              className="w-full flex-1 border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-gradient-to-b from-slate-900 to-slate-950">
              <div className="w-16 h-16 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Video className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md">
                <h4 className="text-base font-bold text-white">{resource.title}</h4>
                <p className="text-xs text-slate-400">
                  Interactive Video Lecture stream hosted on external educational portal.
                </p>
                <div className="pt-2 text-xs font-mono text-purple-300 bg-purple-950/60 py-1.5 px-3 rounded-lg border border-purple-800/60 truncate">
                  {resource.urlOrFilename}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <a
                  href={getCleanUrl(resource.urlOrFilename)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-md transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Launch Video Stream in New Tab</span>
                </a>
              </div>

              {/* Study Highlights Bar */}
              <div className="w-full max-w-lg mt-6 bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl text-left space-y-2">
                <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider block">
                  Lecture Milestones & Key Concepts
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>02:15 - Core Principles</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>08:40 - Formula Derivation</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>12:20 - Solved Practice</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>16:05 - Exam Questions</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // 2. EXTERNAL WEB LINKS & INTERACTIVE SIMULATIONS (PhET, NCERT, Gov Portals)
    if (resource.type === 'LINK') {
      const isPhet = resource.urlOrFilename.includes('phet.colorado.edu');

      return (
        <div className="flex-1 flex flex-col bg-slate-100 rounded-xl overflow-hidden border border-slate-200 min-h-[420px]">
          {/* In-app Browser Chrome Header */}
          <div className="bg-slate-200/90 border-b border-slate-300 px-3 py-2 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            </div>

            <div className="flex-1 max-w-md mx-2 bg-white px-3 py-1 rounded-md text-[11px] font-mono text-slate-600 truncate border border-slate-300 flex items-center justify-between">
              <span className="truncate">{getCleanUrl(resource.urlOrFilename)}</span>
              <button
                onClick={handleCopyLink}
                className="ml-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Copy URL"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            <a
              href={getCleanUrl(resource.urlOrFilename)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
            >
              <span>External</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Iframe Viewport or Simulation Card */}
          <div className="flex-1 flex flex-col relative bg-white">
            {isWebUrl && !iframeError ? (
              <iframe
                src={getCleanUrl(resource.urlOrFilename)}
                title={resource.title}
                onError={() => setIframeError(true)}
                className="w-full flex-1 border-0 min-h-[380px]"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            ) : null}

            {/* In-app Simulation Overlay / Fallback View */}
            {(iframeError || isPhet || !isWebUrl) && (
              <div className="p-6 flex-1 flex flex-col justify-center items-center text-center space-y-4 bg-gradient-to-b from-blue-50/50 to-white">
                <div className="w-16 h-16 rounded-2xl bg-blue-100/80 border border-blue-200 flex items-center justify-center text-blue-700">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-md">
                  <h4 className="text-base font-bold text-slate-900">{resource.title}</h4>
                  <p className="text-xs text-slate-600">
                    {isPhet
                      ? 'Interactive HTML5 Science Simulation for laboratory experiments and hands-on parameter variation.'
                      : 'Verified Educational Web Portal reference curated by course faculty.'}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl max-w-md w-full text-left text-xs space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span className="font-semibold">Subject Module:</span>
                    <span className="font-bold text-slate-900">{resource.subject}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="font-semibold">Curated by:</span>
                    <span className="text-slate-800">{resource.authorName}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="font-semibold">Access Type:</span>
                    <span className="text-emerald-700 font-bold">Public Educational Resource</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={getCleanUrl(resource.urlOrFilename)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Interactive Portal in Full Window</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // 3. FORMULA CHEATSHEETS (Structured In-App Formula Table & Quick Cards)
    if (resource.type === 'CHEATSHEET') {
      const isChemistry = resource.subject === 'Chemistry';
      const isMath = resource.subject === 'Mathematics';

      return (
        <div className="flex-1 flex flex-col bg-amber-50/30 rounded-xl border border-amber-200/80 p-5 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
            <div>
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                Quick Formula Reference Sheet
              </span>
              <h4 className="text-base font-bold text-slate-900">{resource.title}</h4>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
              {resource.subject}
            </span>
          </div>

          {/* Interactive Cheatsheet Content Blocks */}
          {isChemistry && (
            <div className="space-y-3 text-xs">
              <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs space-y-2">
                <span className="font-bold text-slate-900 block text-xs">
                  1. Oxidation State Assignment Rules
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 font-mono text-[11px]">
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="font-bold text-slate-900">Rule 1:</span> Free element atoms have ox state = 0 (e.g. O₂, Fe, H₂)
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="font-bold text-slate-900">Rule 2:</span> Fluorine is always -1 in all compounds
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="font-bold text-slate-900">Rule 3:</span> Oxygen is typically -2 (-1 in peroxides like H₂O₂)
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="font-bold text-slate-900">Rule 4:</span> Hydrogen is +1 with nonmetals, -1 with metals
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs space-y-2">
                <span className="font-bold text-slate-900 block text-xs">
                  2. Chemical Balancing: Ion-Electron Half-Reaction Steps
                </span>
                <ol className="list-decimal pl-5 space-y-1 text-slate-700">
                  <li>Separate the complete redox equation into oxidation and reduction half-reactions.</li>
                  <li>Balance elements other than Hydrogen and Oxygen first.</li>
                  <li>Balance Oxygen atoms by adding H₂O to the oxygen-deficient side.</li>
                  <li>Balance Hydrogen atoms by adding H⁺ ions to the opposite side.</li>
                  <li>Balance charge by adding electrons (e⁻) and multiply to equalize electron count.</li>
                </ol>
              </div>

              <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs space-y-2">
                <span className="font-bold text-slate-900 block text-xs">
                  3. Common Precipitate Color Indicators
                </span>
                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-center">
                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <span className="block font-bold text-yellow-900">PbI₂</span>
                    <span className="text-yellow-700">Bright Yellow</span>
                  </div>
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                    <span className="block font-bold text-blue-900">Cu(OH)₂</span>
                    <span className="text-blue-700">Light Blue Gel</span>
                  </div>
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded">
                    <span className="block font-bold text-rose-900">Fe(OH)₃</span>
                    <span className="text-rose-700">Reddish Brown</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isMath && (
            <div className="space-y-3 text-xs">
              <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs space-y-2">
                <span className="font-bold text-slate-900 block text-xs">
                  Pythagorean Trigonometric Identities
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                  <div className="p-2.5 bg-blue-50/50 rounded border border-blue-200 text-center font-bold text-blue-900">
                    sin²θ + cos²θ = 1
                  </div>
                  <div className="p-2.5 bg-blue-50/50 rounded border border-blue-200 text-center font-bold text-blue-900">
                    1 + tan²θ = sec²θ
                  </div>
                  <div className="p-2.5 bg-blue-50/50 rounded border border-blue-200 text-center font-bold text-blue-900">
                    1 + cot²θ = cosec²θ
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <span className="font-bold text-slate-900 block text-xs">
                  Standard Trigonometric Ratios Table
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-center font-mono text-[11px]">
                    <thead className="bg-slate-100 text-slate-800">
                      <tr>
                        <th className="p-2 text-left">Angle (θ)</th>
                        <th className="p-2">0°</th>
                        <th className="p-2">30°</th>
                        <th className="p-2">45°</th>
                        <th className="p-2">60°</th>
                        <th className="p-2">90°</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2 font-bold text-left">sin θ</td>
                        <td>0</td>
                        <td>1/2</td>
                        <td>1/√2</td>
                        <td>√3/2</td>
                        <td>1</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-left">cos θ</td>
                        <td>1</td>
                        <td>√3/2</td>
                        <td>1/√2</td>
                        <td>1/2</td>
                        <td>0</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-left">tan θ</td>
                        <td>0</td>
                        <td>1/√3</td>
                        <td>1</td>
                        <td>√3</td>
                        <td>Undefined</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!isChemistry && !isMath && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 text-xs text-slate-700">
              <span className="font-bold text-slate-900 block">General Cheatsheet Notes</span>
              <p className="leading-relaxed">{resource.description}</p>
            </div>
          )}
        </div>
      );
    }

    // Real File Viewer (when uploaded to Firebase Storage)
    if (resource.fileUrl) {
      const isPdf =
        resource.fileUrl.includes('.pdf') ||
        (resource.fileName || resource.urlOrFilename).toLowerCase().endsWith('.pdf');
      const isImg =
        resource.fileUrl.startsWith('data:image/') ||
        /\.(png|jpe?g|webp|gif|svg)$/i.test(resource.fileName || resource.urlOrFilename);

      return (
        <div className="flex-1 flex flex-col bg-slate-900 rounded-xl overflow-hidden border border-slate-700 min-h-[440px]">
          <div className="bg-slate-950 px-4 py-2.5 flex items-center justify-between text-white text-xs border-b border-slate-800">
            <span className="font-mono text-[11px] text-slate-300 truncate max-w-sm">
              {resource.fileName || resource.urlOrFilename}
            </span>
            <div className="flex items-center gap-2">
              <a
                href={resource.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Tab</span>
              </a>
              <button
                type="button"
                onClick={() => downloadFile(resource.fileUrl!, resource.fileName || resource.urlOrFilename)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>
          <div className="flex-1 p-3 sm:p-5 flex items-center justify-center bg-slate-900/60 overflow-auto">
            {isPdf ? (
              <iframe
                src={resource.fileUrl}
                title={resource.title}
                className="w-full h-full min-h-[500px] bg-white rounded-lg border border-slate-700 shadow-xl"
              />
            ) : isImg ? (
              <img
                src={resource.fileUrl}
                alt={resource.title}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-xl"
              />
            ) : (
              <iframe
                src={resource.fileUrl}
                title={resource.title}
                className="w-full h-full min-h-[500px] bg-white rounded-lg border border-slate-700 shadow-xl"
              />
            )}
          </div>
        </div>
      );
    }

    // 4. PDF HANDOUTS & EXAM BOOKLETS (Interactive Document Viewport with Page Flip & Zoom)
    return (
      <div className="flex-1 flex flex-col bg-slate-800 rounded-xl overflow-hidden border border-slate-700 min-h-[420px]">
        {/* Document Viewer Toolbar */}
        <div className="bg-slate-900 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-white text-xs border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-slate-400">
              Page {pdfPage} of {totalPdfPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={pdfPage <= 1}
                onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={pdfPage >= totalPdfPages}
                onClick={() => setPdfPage((p) => Math.min(totalPdfPages, p + 1))}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoomLevel((z) => Math.max(75, z - 15))}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-300 w-10 text-center">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(150, z + 15))}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer ml-1"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Realistic High-Fidelity Rendered PDF Document Canvas */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-slate-900/50">
          <div
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            className="w-full max-w-2xl bg-white text-slate-900 rounded-lg shadow-2xl p-6 sm:p-10 transition-transform duration-150 border border-slate-300 space-y-4"
          >
            {/* Document Header */}
            <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                  Tuition Coaching Institute · Department of {resource.subject}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{resource.title}</h3>
                <p className="text-xs text-slate-500">
                  Target Batch: {resource.batchTitle || 'All Enrolled Batches'} · Academic Year 2026–27
                </p>
              </div>
              <div className="text-right font-mono text-[10px] text-slate-500">
                <span>Ref: {resource.id.toUpperCase()}</span>
                <span className="block font-bold text-slate-700">Section {pdfPage}</span>
              </div>
            </div>

            {/* Document Body for Current Page */}
            <div className="space-y-3 text-xs leading-relaxed text-slate-700">
              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 space-y-1">
                <span className="font-bold text-blue-900 block text-[11px]">
                  Topic Overview & Core Concepts:
                </span>
                <p>{resource.description}</p>
              </div>

              {pdfPage === 1 && (
                <div className="space-y-2">
                  <h5 className="font-bold text-slate-900 text-xs">Section 1.1: Fundamental Formulations</h5>
                  <p>
                    When analyzing this chapter, students should note the symmetry and boundary conditions. All
                    step-wise deductions must cite the corresponding theorem from the state curriculum syllabus.
                  </p>
                  <div className="p-3 bg-slate-50 font-mono text-[11px] rounded border border-slate-200">
                    <span className="text-blue-800 font-bold block mb-1">Standard Proof Equation:</span>
                    <code>ΔH = ΔU + Δn_g RT · [Condition: Isothermal Constant Pressure]</code>
                  </div>
                </div>
              )}

              {pdfPage === 2 && (
                <div className="space-y-2">
                  <h5 className="font-bold text-slate-900 text-xs">Section 1.2: Worked Examples & Exemplar Case</h5>
                  <p>
                    <strong>Problem 1:</strong> Calculate the equilibrium constant given the partial pressures at
                    298 K. State all assumptions regarding ideality of the gas mixture.
                  </p>
                  <div className="p-3 bg-emerald-50 text-emerald-950 font-mono text-[11px] rounded border border-emerald-200">
                    <span className="font-bold block text-emerald-800">Worked Solution Step:</span>
                    <code>K_p = (P_C · P_D) / (P_A · P_B) = 4.25 × 10⁻² atm</code>
                  </div>
                </div>
              )}

              {pdfPage > 2 && (
                <div className="space-y-2">
                  <h5 className="font-bold text-slate-900 text-xs">Section {pdfPage}: Advanced Practice Exercises</h5>
                  <p>
                    Review questions 1 through 15 for home study. Solutions will be discussed in the upcoming
                    session classroom whiteboard.
                  </p>
                  <div className="p-3 bg-slate-50 text-slate-600 rounded border border-slate-200 italic">
                    Faculty Note: Pay special attention to sign conventions in coordinate geometry and vector rays.
                  </div>
                </div>
              )}
            </div>

            {/* Document Footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Faculty: {resource.authorName}</span>
              <span>Page {pdfPage} of {totalPdfPages}</span>
              <span>Tuition Digital Study Bank</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 animate-in fade-in duration-150">
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-200 ${
          isFullscreen ? 'w-full h-full max-w-none rounded-none' : 'max-w-4xl w-full max-h-[90vh]'
        }`}
      >
        {/* Modal Top Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 truncate">
            <span className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 shrink-0">
              {resource.type === 'VIDEO' ? (
                <Video className="w-4 h-4 text-purple-600" />
              ) : resource.type === 'LINK' ? (
                <ExternalLink className="w-4 h-4 text-blue-600" />
              ) : resource.type === 'CHEATSHEET' ? (
                <FileSpreadsheet className="w-4 h-4 text-amber-600" />
              ) : (
                <FileText className="w-4 h-4 text-rose-600" />
              )}
            </span>

            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-white text-slate-700 border-slate-200">
                  {resource.type}
                </span>
                <span className="text-xs font-semibold text-slate-500">{resource.subject}</span>
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  · {isTeacher ? 'Faculty Preview Mode' : 'Student Study View'}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate mt-0.5">
                {resource.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Copy Reference */}
            <button
              onClick={handleCopyLink}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Copy link / filename"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Preview vs Faculty Notes) */}
        <div className="px-4 sm:px-6 py-2 border-b border-slate-200 bg-white flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('PREVIEW')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                activeTab === 'PREVIEW'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Direct In-App Preview
            </button>
            <button
              onClick={() => setActiveTab('NOTES')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                activeTab === 'NOTES'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Faculty Notes & Instructions
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-slate-500 text-[11px]">
            <span>Uploaded {resource.uploadedAt}</span>
            <span aria-hidden="true">·</span>
            <span>By {resource.authorName}</span>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto flex flex-col bg-slate-50">
          {activeTab === 'PREVIEW' ? (
            renderPreviewContent()
          ) : (
            <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-4 max-w-2xl mx-auto w-full text-xs">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                  Faculty Study Guide
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-1">{resource.title}</h4>
              </div>

              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 text-slate-700 space-y-1">
                <span className="font-semibold text-slate-900 block text-xs">Teacher's Note for Batch:</span>
                <p className="leading-relaxed">{resource.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-slate-600">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase">Assigned Course</span>
                  <span className="font-bold text-slate-900 block">{resource.subject}</span>
                  <span className="text-[11px] text-slate-500">Target: {resource.batchTitle || 'All Batches'}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase">File Reference / URL</span>
                  <span className="font-mono text-slate-800 block truncate">{resource.urlOrFilename}</span>
                  {resource.fileSizeOrDuration && (
                    <span className="text-[11px] text-slate-500 block">{resource.fileSizeOrDuration}</span>
                  )}
                </div>
              </div>

              {resource.tags && resource.tags.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase block mb-1.5">
                    Curriculum Tags
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {resource.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-medium text-[11px] border border-slate-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-4 sm:px-6 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
            <span>Batch: {resource.batchTitle || 'All Batches'}</span>
            {resource.fileSizeOrDuration && (
              <>
                <span aria-hidden="true">·</span>
                <span>{resource.fileSizeOrDuration}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>

            {/* Launch or download real file */}
            {resource.fileUrl ? (
              <>
                <button
                  type="button"
                  onClick={() => openExternalUrl(resource.fileUrl!)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Real File</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadFile(resource.fileUrl!, resource.fileName || resource.urlOrFilename)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Real File</span>
                </button>
              </>
            ) : isWebUrl ? (
              <button
                type="button"
                onClick={() => openExternalUrl(getCleanUrl(resource.urlOrFilename))}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Launch in Tab</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  alert(`Downloading offline copy: "${resource.urlOrFilename}"`);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Offline Copy</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
