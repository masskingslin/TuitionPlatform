import React, { useRef, useState, useEffect } from 'react';
import { CourseBatch } from '../../types';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  Eraser,
  PenTool,
  RotateCcw,
  BookOpen,
  MessageSquare,
  CheckCircle2,
  X
} from 'lucide-react';

interface VirtualClassroomModalProps {
  batch: CourseBatch;
  onClose: () => void;
  isTeacher?: boolean;
}

export const VirtualClassroomModal: React.FC<VirtualClassroomModalProps> = ({
  batch,
  onClose,
  isTeacher = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#1E88E5');
  const [penWidth, setPenWidth] = useState(3);
  const [micOn, setMicOn] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [activeTab, setActiveTab] = useState<'NOTES' | 'CHAT'>('NOTES');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: 'Mr. Kingslin', text: 'Welcome batch! We are starting on Quadratic Formula derivations.', time: '05:01 PM' },
    { sender: 'Divya Sharma', text: 'Present sir!', time: '05:02 PM' }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw initial grid/board background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid dots
    ctx.fillStyle = '#E2E8F0';
    for (let x = 20; x < canvas.width; x += 30) {
      for (let y = 20; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Default instructor welcome formula
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#0F172A';
    ctx.fillText(`${batch.title} - Digital Whiteboard`, 24, 36);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#1E88E5';
    ctx.fillText('Topic: ' + batch.nextTopic, 24, 60);

    ctx.font = 'italic 16px serif';
    ctx.fillStyle = '#00695C';
    ctx.fillText('Formula: x = [-b ± √(b² - 4ac)] / 2a', 24, 96);
  }, [batch]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [
      ...prev,
      {
        sender: isTeacher ? 'Mr. Kingslin (Faculty)' : 'Aravind Kumar',
        text: inputMessage.trim(),
        time: now
      }
    ]);
    setInputMessage('');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[92vh] max-h-[850px] flex flex-col overflow-hidden shadow-2xl border border-slate-700">
        {/* Classroom Top Bar */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <h3 className="font-bold text-sm tracking-tight">{batch.title} · Live Lecture</h3>
              <p className="text-[11px] text-slate-400">
                Instructor: {batch.teacherName} · Room: {batch.roomOrMeetingLink} · {batch.activeStudentCount} connected
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Leave Class</span>
            </button>
          </div>
        </div>

        {/* Classroom Body (Split View: Whiteboard + Side Deck) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-100">
          {/* Main Whiteboard Stage */}
          <div className="flex-1 flex flex-col p-3 overflow-hidden">
            {/* Whiteboard Toolbar */}
            <div className="bg-white rounded-xl p-2 border border-slate-200 shadow-2xs mb-2 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1">
                  <PenTool className="w-3.5 h-3.5 text-blue-600" />
                  Whiteboard Pen
                </span>

                {['#1E88E5', '#00695C', '#DC2626', '#0F172A'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setPenColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      penColor === color ? 'border-slate-800 scale-110 shadow-xs' : 'border-white'
                    }`}
                    title={color}
                  />
                ))}

                <div className="w-px h-5 bg-slate-200 mx-1" />

                <button
                  onClick={() => {
                    setPenColor('#FFFFFF');
                    setPenWidth(16);
                  }}
                  className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1 ${
                    penColor === '#FFFFFF' ? 'bg-slate-200 text-slate-900 border-slate-400' : 'text-slate-600 hover:bg-slate-50 border-slate-200'
                  }`}
                  title="Eraser"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Eraser</span>
                </button>

                <button
                  onClick={clearCanvas}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-slate-50 border border-slate-200 text-xs font-semibold transition-colors flex items-center gap-1"
                  title="Clear Board"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>

              <div className="text-xs text-slate-500 font-mono hidden sm:inline-block">
                Interactive Drawing Canvas
              </div>
            </div>

            {/* Drawing Canvas */}
            <div className="flex-1 bg-white rounded-xl border border-slate-300 shadow-inner overflow-hidden relative">
              <canvas
                ref={canvasRef}
                width={800}
                height={550}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full h-full cursor-crosshair block"
              />
            </div>
          </div>

          {/* Right Side Deck (Lecture Notes / Chat Q&A) */}
          <div className="w-full md:w-80 bg-white border-l border-slate-200 flex flex-col shrink-0">
            {/* Tab Header */}
            <div className="grid grid-cols-2 border-b border-slate-200 p-1 bg-slate-50 text-xs font-bold shrink-0">
              <button
                onClick={() => setActiveTab('NOTES')}
                className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'NOTES' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Lecture Notes</span>
              </button>
              <button
                onClick={() => setActiveTab('CHAT')}
                className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'CHAT' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                <span>Class Doubts ({chatMessages.length})</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 text-xs">
              {activeTab === 'NOTES' ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Today's Topic</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">{batch.nextTopic}</h4>
                  </div>

                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                    <span className="font-bold text-blue-950 block">Key Derivation Rules</span>
                    <ul className="space-y-1.5 text-blue-900 text-[11px]">
                      <li>• Discriminant Δ = b² - 4ac</li>
                      <li>• If Δ &gt; 0: two distinct real roots</li>
                      <li>• If Δ = 0: two equal real roots (-b/2a)</li>
                      <li>• If Δ &lt; 0: no real roots (complex pair)</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <span className="font-semibold text-slate-700 block">Session Materials</span>
                    <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                      <span className="font-medium text-slate-800">Unit_4_Practice_Set.pdf</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span className="font-bold text-slate-800">{msg.sender}</span>
                          <span>{msg.time}</span>
                        </div>
                        <p className="text-slate-700 text-xs">{msg.text}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-100 flex gap-2">
                    <input
                      type="text"
                      placeholder="Ask faculty in lecture..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      className="flex-1 text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                    >
                      Send
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Bottom Stream Controls */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMicOn(!micOn)}
                  className={`p-2 rounded-lg border transition-colors ${
                    micOn ? 'bg-slate-900 text-white border-slate-900' : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                  title={micOn ? 'Mute Mic' : 'Unmute Mic'}
                >
                  {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setVideoOn(!videoOn)}
                  className={`p-2 rounded-lg border transition-colors ${
                    videoOn ? 'bg-slate-900 text-white border-slate-900' : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                  title={videoOn ? 'Stop Camera' : 'Start Camera'}
                >
                  {videoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>
              </div>

              {!isTeacher && (
                <button
                  onClick={() => setHandRaised(!handRaised)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    handRaised
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Hand className="w-3.5 h-3.5 text-amber-600" />
                  <span>{handRaised ? 'Hand Raised' : 'Raise Hand'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
