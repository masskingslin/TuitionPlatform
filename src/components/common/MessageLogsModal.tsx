import React, { useState } from 'react';
import { NotificationLog, MessageChannel } from '../../types';
import {
  MessageSquare,
  Smartphone,
  Bell,
  Search,
  X,
  ShieldCheck
} from 'lucide-react';

interface MessageLogsModalProps {
  logs: NotificationLog[];
  onClose: () => void;
}

export const MessageLogsModal: React.FC<MessageLogsModalProps> = ({ logs, onClose }) => {
  const [selectedChannel, setSelectedChannel] = useState<MessageChannel | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter((log) => {
    const matchesChannel = selectedChannel === 'ALL' || log.channel === selectedChannel;
    const matchesSearch =
      (log.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.recipientPhone || '').includes(searchQuery) ||
      (log.content || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChannel && matchesSearch;
  });

  const smsCount = logs.filter((l) => l.channel === 'SMS').length;
  const waCount = logs.filter((l) => l.channel === 'WHATSAPP').length;
  const fcmCount = logs.filter((l) => l.channel === 'FCM_PUSH').length;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-900 text-white rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-teal-300 bg-teal-900/40 px-2 py-0.5 rounded border border-teal-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>MSG91 · WhatsApp Cloud · FCM Push</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">Firestore Real-time Audit</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight mt-1 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-400" />
              <span>Message & Push Dispatch Log</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Live audit record of SMS and WhatsApp messages sent to guardianPhone and FCM push broadcasts.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aggregate Counters */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">MSG91 SMS</span>
              <span className="text-lg font-bold text-slate-900 font-mono">{smsCount}</span>
            </div>
            <Smartphone className="w-4 h-4 text-blue-600" />
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">WhatsApp Cloud</span>
              <span className="text-lg font-bold text-slate-900 font-mono">{waCount}</span>
            </div>
            <MessageSquare className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">FCM Push</span>
              <span className="text-lg font-bold text-slate-900 font-mono">{fcmCount}</span>
            </div>
            <Bell className="w-4 h-4 text-amber-600" />
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            {(['ALL', 'SMS', 'WHATSAPP', 'FCM_PUSH'] as const).map((ch) => (
              <button
                key={ch}
                onClick={() => setSelectedChannel(ch)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedChannel === ch
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {ch === 'ALL' ? 'All Channels' : ch === 'FCM_PUSH' ? 'FCM Push' : ch}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search phone, student, text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-600 bg-white"
            />
          </div>
        </div>

        {/* Log Entries List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs">No dispatched message records matching current filter.</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-xl p-3.5 border border-slate-200 hover:border-slate-300 shadow-2xs space-y-2 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${
                        log.channel === 'SMS'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : log.channel === 'WHATSAPP'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {log.channel === 'SMS' ? <Smartphone className="w-3 h-3" /> : log.channel === 'WHATSAPP' ? <MessageSquare className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
                      <span>{log.channel}</span>
                    </span>

                    <span className="text-xs font-bold text-slate-900">
                      {log.messageType.replace('_', ' ')}
                    </span>

                    {log.studentName && (
                      <span className="text-xs text-slate-500 font-medium">
                        · For: <strong>{log.studentName}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">{log.sentAt || 'Recorded'}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        log.status === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : log.status === 'SENT'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                </div>

                {log.recipientPhone && (
                  <div className="text-xs text-slate-600 flex items-center gap-2 font-mono bg-slate-50 p-1.5 px-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-400">Recipient Guardian:</span>
                    <span className="font-bold text-slate-900">{log.recipientName || 'Guardian'}</span>
                    <span className="text-teal-700 font-semibold">({log.recipientPhone})</span>
                  </div>
                )}

                <div className="p-2.5 bg-slate-50/70 rounded-lg border border-slate-100 text-xs text-slate-800 font-sans leading-relaxed">
                  {log.title && <div className="font-bold text-slate-900 mb-1">{log.title}</div>}
                  <p>{log.content}</p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 font-mono">
                  <span>Provider: {log.provider}</span>
                  <span>ID: {log.providerMessageId || log.id}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 flex justify-end bg-slate-50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
