import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCheck, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Award, 
  Info, 
  ChevronRight, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { getNotificationPermission } from '../../utils/pushManager';
import { setupForegroundMessageListener } from '../../services/fcm';
import PushPromptModal from './PushPromptModal';

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getCategoryIcon(category) {
  switch (category) {
    case 'event_published':
      return { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' };
    case 'registration_status':
      return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' };
    case 'deadline_reminder':
      return { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' };
    case 'event_updated':
      return { icon: RefreshCw, color: 'text-purple-600', bg: 'bg-purple-50' };
    case 'points_awarded':
      return { icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' };
    default:
      return { icon: Info, color: 'text-slate-600', bg: 'bg-slate-100' };
  }
}

export const NotificationBell = ({ isMobile = false }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);
  const [pushPermission, setPushPermission] = useState('default');
  const dropdownRef = useRef(null);

  // Check push permission state
  useEffect(() => {
    setPushPermission(getNotificationPermission());
  }, []);

  // Fetch unread count periodically if authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    const fetchUnread = () => {
      api.get('/notifications/unread-count')
        .then((res) => {
          if (isMounted && res.data?.success) {
            setUnreadCount(res.data.data.unreadCount || 0);
          }
        })
        .catch(() => {});
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // 30s poll

    // Foreground FCM listener
    const unsubFcm = setupForegroundMessageListener(() => {
      fetchUnread();
    });

    const handleCustomNotif = () => fetchUnread();
    window.addEventListener('campus-event-notification', handleCustomNotif);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (typeof unsubFcm === 'function') unsubFcm();
      window.removeEventListener('campus-event-notification', handleCustomNotif);
    };
  }, [isAuthenticated]);

  // Fetch recent notifications when dropdown opens
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;

    setLoading(true);
    api.get('/notifications?limit=6')
      .then((res) => {
        if (res.data?.success) {
          setNotifications(res.data.data.notifications || []);
          setUnreadCount(res.data.data.unreadCount || 0);
        }
      })
      .catch((err) => console.warn('Failed to load notifications:', err.message))
      .finally(() => setLoading(false));
  }, [isOpen, isAuthenticated]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Mark read error:', err.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Mark all read error:', err.message);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      api.patch(`/notifications/${notif.id}/read`).catch(() => {});
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setIsOpen(false);
    if (notif.action_url) {
      navigate(notif.action_url);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all duration-200 select-none ${
          isOpen
            ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
            : 'text-slate-600 hover:text-blue-700 hover:bg-slate-100'
        }`}
        title="Notifications"
        aria-label="Open notifications"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5 text-blue-600 animate-pulse" />
        ) : (
          <Bell className="w-5 h-5" />
        )}

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-sm ring-2 ring-white animate-scale-in">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div 
          className={`absolute z-50 bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
            isMobile 
              ? 'right-0 w-[calc(100vw-32px)] max-w-sm mt-2' 
              : 'left-0 md:left-full md:-top-4 md:ml-3 w-80 sm:w-96'
          }`}
        >
          {/* Header */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 via-white to-blue-50/30 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-sm text-slate-900 tracking-tight">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-mono text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Browser Push Permission Enable Banner */}
          {pushPermission === 'default' && (
            <div className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <BellRing className="w-4 h-4 shrink-0 animate-bounce" />
                <span className="font-medium truncate">Enable browser push alerts</span>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowPushModal(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-white text-blue-700 font-bold text-[11px] hover:bg-blue-50 shadow-xs shrink-0 transition-all"
              >
                Enable
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 font-mono">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">No notifications yet</p>
                <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                  You'll be notified when new events are published or your registrations update.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const { icon: CategoryIcon, color, bg } = getCategoryIcon(notif.category);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`group px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer relative hover:bg-blue-50/50 ${
                      !notif.is_read ? 'bg-blue-50/20' : 'bg-white'
                    }`}
                  >
                    {/* Unread indicator bar */}
                    {!notif.is_read && (
                      <span className="absolute left-1 top-4 w-1 h-6 rounded-full bg-blue-600" />
                    )}

                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0 mt-0.5 shadow-xs`}>
                      <CategoryIcon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className={`text-xs tracking-tight truncate ${
                          !notif.is_read ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-700'
                        }`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {formatRelativeTime(notif.created_at)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                        {notif.message}
                      </p>
                    </div>

                    {/* Mark Read Check */}
                    {!notif.is_read && (
                      <button
                        onClick={(e) => handleMarkAsRead(e, notif.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-all shrink-0 mt-1"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors"
            >
              <span>View All Notifications</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/notifications?tab=preferences"
              onClick={() => setIsOpen(false)}
              className="text-[11px] text-slate-400 hover:text-slate-700 font-mono"
            >
              Preferences
            </Link>
          </div>
        </div>
      )}

      {/* Push Prompt Modal */}
      <PushPromptModal
        isOpen={showPushModal}
        onClose={() => setShowPushModal(false)}
        onSubscribed={() => setPushPermission('granted')}
      />
    </div>
  );
};

export default NotificationBell;
