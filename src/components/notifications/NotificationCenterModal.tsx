import React, { useState } from 'react';
import { useTuition } from '../../context/TuitionContext';
import { StudentNotification, StudentNavScreen } from '../../types';
import {
  Bell,
  CheckCircle2,
  Trash2,
  CheckCheck,
  FileText,
  BookOpen,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (screen: StudentNavScreen) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications
  } = useTuition();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  if (!isOpen) return null;

  const filteredList =
    activeFilter === 'UNREAD' ? notifications.filter((n) => !n.read) : notifications;

  const handleActionClick = (notif: StudentNotification) => {
    markNotificationAsRead(notif.id);
    if (notif.actionScreen && onNavigate) {
      onNavigate(notif.actionScreen);
      onClose();
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'HOMEWORK_POSTED':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'RESOURCE_ADDED':
        return <BookOpen className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-amber-600" />;
    }
  };

  const getNotifBadgeClass = (type: string) => {
    switch (type) {
      case 'HOMEWORK_POSTED':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'RESOURCE_ADDED':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      default:
        return 'text-amber-700 bg-amber-50 border-amber-200';
    }
  };

  const getNotifLabel = (type: string) => {
    switch (type) {
      case 'HOMEWORK_POSTED':
        return 'New Assignment';
      case 'RESOURCE_ADDED':
        return 'Shared Material';
      default:
        return 'Tuition Notice';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100/80 rounded-xl text-blue-700">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Student Notifications</h3>
                {unreadNotificationsCount > 0 && (
                  <span className="text-[11px] font-mono font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                    {unreadNotificationsCount} unread
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Live alerts for newly assigned homework and learning materials</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg leading-none p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Close notifications"
          >
            ✕
          </button>
        </div>

        {/* Toolbar & Filter Tabs */}
        <div className="px-4 sm:px-5 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-white">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('UNREAD')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                activeFilter === 'UNREAD'
                  ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Unread ({unreadNotificationsCount})
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {unreadNotificationsCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all as read</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="text-slate-400 hover:text-rose-600 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                title="Clear notification list"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear history</span>
              </button>
            )}
          </div>
        </div>

        {/* Notification List Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 divide-y divide-slate-100">
          {filteredList.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">You're all caught up!</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {activeFilter === 'UNREAD'
                  ? 'There are no unread notifications right now.'
                  : 'Whenever a teacher posts a new homework or uploads a learning resource, alerts will appear here.'}
              </p>
            </div>
          ) : (
            filteredList.map((notif) => (
              <div
                key={notif.id}
                className={`pt-3 first:pt-0 p-3.5 rounded-xl border transition-all space-y-2 ${
                  notif.read
                    ? 'bg-white border-slate-200/70 hover:border-slate-300'
                    : 'bg-blue-50/40 border-blue-200 shadow-2xs hover:bg-blue-50/70'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs shrink-0 mt-0.5">
                      {getNotifIcon(notif.type)}
                    </span>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getNotifBadgeClass(notif.type)}`}>
                          {getNotifLabel(notif.type)}
                        </span>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 inline-block animate-pulse" title="Unread" />
                        )}
                        <h4 className={`text-xs font-bold ${notif.read ? 'text-slate-800' : 'text-slate-900 font-extrabold'}`}>
                          {notif.title}
                        </h4>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                        <span>By {notif.authorName}</span>
                        {notif.targetBatchTitle && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{notif.targetBatchTitle}</span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {notif.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!notif.read && (
                      <button
                        onClick={() => markNotificationAsRead(notif.id)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100/50 rounded-md transition-colors cursor-pointer"
                        title="Mark as read"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notif.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      title="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-slate-200/60">
                  {notif.message}
                </p>

                {notif.actionScreen && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleActionClick(notif)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>
                        {notif.actionScreen === 'ASSIGNMENTS'
                          ? 'View Homework & Deadlines'
                          : 'Open Learning Material'}
                      </span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Instant sync with teacher updates</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
