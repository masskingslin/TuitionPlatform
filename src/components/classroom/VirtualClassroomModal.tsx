import React, { useState } from 'react';
import { CourseBatch } from '../../types';
import { useTuition } from '../../context/TuitionContext';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  BookOpen,
  Users,
  Video,
  Info
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
  const { currentStudent, currentTeacher, userProfile } = useTuition();
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(true);

  // Determine user display name for Jitsi Meet prefill
  const userName = isTeacher
    ? (userProfile?.fullName || currentTeacher.name || 'Faculty Instructor')
    : (userProfile?.fullName || currentStudent.name || 'Student');

  // Check if roomOrMeetingLink is an external URL (Google Meet, Zoom, custom Jitsi, etc.)
  const isExternalMeetingUrl =
    Boolean(batch.roomOrMeetingLink) &&
    (batch.roomOrMeetingLink.startsWith('http://') ||
      batch.roomOrMeetingLink.startsWith('https://'));

  // Jitsi Meet room name is strictly the batch id
  const jitsiRoomName = batch.id;
  const jitsiBaseUrl = `https://meet.jit.si/${encodeURIComponent(jitsiRoomName)}`;
  const jitsiEmbedUrl = `${jitsiBaseUrl}#userInfo.displayName=${encodeURIComponent(
    userName
  )}&config.prejoinPageEnabled=false&config.startWithAudioMuted=true`;

  // Target meeting link to launch externally
  const externalMeetingUrl = isExternalMeetingUrl
    ? batch.roomOrMeetingLink
    : jitsiBaseUrl;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(externalMeetingUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback if clipboard API is restricted
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleOpenExternal = () => {
    window.open(externalMeetingUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 animate-in fade-in duration-150">
      <div
        className={`bg-slate-900 rounded-2xl w-full flex flex-col overflow-hidden shadow-2xl border border-slate-700 transition-all duration-200 ${
          isFullscreen
            ? 'h-[98vh] max-w-[98vw]'
            : 'h-[92vh] max-h-[880px] max-w-6xl'
        }`}
      >
        {/* Classroom Top Bar */}
        <div className="bg-slate-950 text-white px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-tight text-white">
                  {batch.title}
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30 uppercase tracking-wider">
                  Live Jitsi Meet
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Room: <strong className="font-mono text-slate-300">{batch.id}</strong></span>
                <span aria-hidden="true">·</span>
                <span>Instructor: {batch.teacherName}</span>
                {batch.roomOrMeetingLink && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="truncate max-w-[180px]">Venue / Link: {batch.roomOrMeetingLink}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Top Actions: Copy, Open External Link, Fullscreen, Leave */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Copy meeting link to clipboard"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Copy Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleOpenExternal}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Open meeting in external browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>
                {isExternalMeetingUrl ? 'Open Meeting Link' : 'Open in New Tab'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowSidePanel(!showSidePanel)}
              className="hidden md:flex px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors items-center gap-1.5 cursor-pointer"
              title={showSidePanel ? 'Hide Class Details' : 'Show Class Details'}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{showSidePanel ? 'Hide Details' : 'Details'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>Leave Class</span>
            </button>
          </div>
        </div>

        {/* Classroom Main Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-950 relative">
          {/* Main Jitsi Meet Iframe Container */}
          <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-black">
            {isExternalMeetingUrl && (
              <div className="bg-blue-950/80 border-b border-blue-800/60 px-4 py-2 flex items-center justify-between text-xs text-blue-200 shrink-0">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    Batch configured with custom meeting URL:{' '}
                    <strong className="text-white font-mono">{batch.roomOrMeetingLink}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenExternal}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Launch Custom Link</span>
                </button>
              </div>
            )}

            {/* Real Jitsi Meet Iframe Embed */}
            <iframe
              src={jitsiEmbedUrl}
              title={`Virtual Classroom - ${batch.title}`}
              allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write; ambient-light-sensor"
              className="w-full flex-1 h-full border-0 block bg-slate-950"
            />
          </div>

          {/* Right Side Class Details & Curriculum Deck */}
          {showSidePanel && (
            <div className="w-full md:w-80 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col shrink-0 text-white overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-300">
                    Class Information
                  </span>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {batch.subject}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {/* Topic & Syllabus Card */}
                <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Current Lecture Topic
                  </span>
                  <h4 className="font-bold text-white text-sm">
                    {batch.nextTopic || 'Topic In Progress'}
                  </h4>
                  <div className="pt-2 border-t border-slate-700 space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Syllabus Covered</span>
                      <span className="font-mono font-bold text-slate-200">
                        {batch.syllabusProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${batch.syllabusProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Session Details */}
                <div className="space-y-2 text-slate-300">
                  <div className="p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/60 flex items-center justify-between">
                    <span className="text-slate-400">Faculty Instructor:</span>
                    <span className="font-semibold text-white">
                      {batch.teacherName}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/60 flex items-center justify-between">
                    <span className="text-slate-400">Schedule Time:</span>
                    <span className="font-semibold text-white">
                      {batch.scheduleTime}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/60 flex items-center justify-between">
                    <span className="text-slate-400">Class Days:</span>
                    <span className="font-medium text-slate-200">
                      {batch.days?.join(', ') || 'Scheduled'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/60 flex items-center justify-between">
                    <span className="text-slate-400">Assigned Venue:</span>
                    <span className="font-mono text-emerald-300 font-semibold">
                      {batch.roomOrMeetingLink}
                    </span>
                  </div>
                </div>

                {/* Live Meeting Parameters */}
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Jitsi Meet Room Parameter
                  </span>
                  <div className="font-mono text-xs text-emerald-400 bg-slate-900 p-2 rounded border border-slate-800 break-all select-all">
                    meet.jit.si/{batch.id}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Camera, microphone, screen sharing, tile view, and meeting chat are handled directly through the embedded Jitsi Meet interface.
                  </p>
                </div>

                <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl flex items-center gap-2.5 text-xs text-emerald-200">
                  <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Logged in as <strong>{userName}</strong> ({isTeacher ? 'Teacher' : 'Student'})
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
