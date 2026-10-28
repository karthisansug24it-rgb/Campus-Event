import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Bell, 
  BellRing, 
  CheckCheck, 
  Trash2, 
  Check, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Award, 
  Info, 
  SlidersHorizontal,
  Mail,
  Smartphone,
  ShieldCheck,
  ExternalLink,
  Loader2,
  Sparkles
} from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../components/Toast';
import { Button } from '../../components/ui/Button';
import { 
  isPushNotificationSupported, 
  getNotificationPermission, 
  subscribeToPushNotifications, 
  unsubscribeFromPushNotifications 
} from '../../utils/pushManager';

function getCategoryMeta(category) {
  switch (category) {
    case 'event_published':
      return { label: 'New Event', icon: Calendar, color: 'text-blue-700 bg-blue-50 border-blue-200' };
    case 'registration_status':
      return { label: 'Registration', icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    case 'deadline_reminder':
      return { label: 'Deadline Alert', icon: AlertCircle, color: 'text-amber-700 bg-amber-50 border-amber-200' };
    case 'event_updated':
      return { label: 'Schedule Update', icon: RefreshCw, color: 'text-purple-700 bg-purple-50 border-purple-200' };
    case 'points_awarded':
      return { label: 'Points Credited', icon: Award, color: 'text-amber-800 bg-amber-50 border-amber-300' };
    default:
      return { label: 'System', icon: Info, color: 'text-slate-700 bg-slate-50 border-slate-200' };
  }
}

const Notifications = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const activeTab = searchParams.get('tab') || 'all';
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Preferences State
  const [prefs, setPrefs] = useState({
    email_enabled: 1,
    push_enabled: 1,
    in_app_enabled: 1,
    notify_new_events: 1,
    notify_registration_updates: 1,
    notify_deadlines: 1,
    notify_event_changes: 1,
    notify_reward_points: 1
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [pushStatus, setPushStatus] = useState('default');

  useEffect(() => {
    setPushStatus(getNotificationPermission());
  }, []);

  // Fetch notifications
  const fetchNotifications = async (page = 1) => {
    setLoading(true);
    try {
      let url = `/notifications?page=${page}&limit=15`;
      if (activeTab !== 'all' && activeTab !== 'preferences') {
        url += `&category=${activeTab}`;
      }
      if (unreadOnly) {
        url += '&unread_only=true';
      }

      const res = await api.get(url);
      if (res.data?.success) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
        setPagination(res.data.data.pagination || { page: 1, totalPages: 1, total: 0 });
      }
    } catch (err) {
      console.warn('Failed to load notifications:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch preferences
  const fetchPreferences = async () => {
    try {
      const res = await api.get('/notifications/preferences');
      if (res.data?.success) {
        setPrefs(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to fetch preferences:', err.message);
    }
  };

  useEffect(() => {
    if (activeTab === 'preferences') {
      fetchPreferences();
    } else {
      fetchNotifications(1);
    }
  }, [activeTab, unreadOnly]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      showToast('Notification marked as read', 'info', 2000);
    } catch (err) {
      console.warn('Mark read error:', err.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      showToast('All notifications marked as read', 'success');
    } catch (err) {
      console.warn('Mark all read error:', err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      showToast('Notification removed', 'info', 2000);
    } catch (err) {
      console.warn('Delete notification error:', err.message);
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      await api.put('/notifications/preferences', prefs);
      showToast('Notification preferences updated!', 'success');
    } catch (err) {
      console.warn('Failed to save preferences:', err.message);
      showToast('Failed to save preferences', 'error');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleTogglePush = async () => {
    if (pushStatus === 'granted') {
      await unsubscribeFromPushNotifications();
      setPushStatus(getNotificationPermission());
      showToast('Push notifications disabled on this device', 'info');
    } else {
      try {
        await subscribeToPushNotifications();
        setPushStatus('granted');
        showToast('Push notifications enabled successfully!', 'success');
      } catch (err) {
        showToast(err.message || 'Push permission was denied', 'error');
      }
    }
  };

  const tabs = [
    { id: 'all', label: 'All Alerts' },
    { id: 'event_published', label: 'New Events' },
    { id: 'registration_status', label: 'Registrations' },
    { id: 'deadline_reminder', label: 'Deadlines' },
    { id: 'points_awarded', label: 'Points & Awards' },
    { id: 'preferences', label: 'Preferences' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-display text-slate-900 tracking-tight">
                Notification Center
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Stay updated on registrations, upcoming deadlines, and rewarded points
              </p>
            </div>
          </div>
        </div>

        {activeTab !== 'preferences' && unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-bold"
          >
            <CheckCheck className="w-4 h-4 text-blue-600" />
            <span>Mark All Read ({unreadCount})</span>
          </Button>
        )}
      </div>

      {/* Tabs Bar & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSearchParams({ tab: tab.id })}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab !== 'preferences' && (
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 select-none cursor-pointer self-end sm:self-auto">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
            <span>Unread Only</span>
          </label>
        )}
      </div>

      {/* Tab 1: Preferences Settings */}
      {activeTab === 'preferences' ? (
        <form onSubmit={handleSavePreferences} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold font-display text-slate-900">
              Notification Channels
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Choose how you want to receive important event updates
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* In-App */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(prefs.in_app_enabled)}
                  onChange={(e) => setPrefs(prev => ({ ...prev, in_app_enabled: e.target.checked ? 1 : 0 }))}
                  className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                />
              </div>
              <h4 className="text-xs font-bold text-slate-900">In-App Notification Center</h4>
              <p className="text-[11px] text-slate-500 leading-snug">
                Persist alerts in your student bell dropdown and notification feed.
              </p>
            </div>

            {/* Browser Push */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(prefs.push_enabled)}
                  onChange={(e) => setPrefs(prev => ({ ...prev, push_enabled: e.target.checked ? 1 : 0 }))}
                  className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900">Browser Push Alerts</h4>
                <button
                  type="button"
                  onClick={handleTogglePush}
                  className="text-[10px] font-bold text-blue-600 hover:underline font-mono"
                >
                  {pushStatus === 'granted' ? 'Active ✓' : 'Setup Push'}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Receive instant popups on your mobile device or laptop screen.
              </p>
            </div>

            {/* Email */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(prefs.email_enabled)}
                  onChange={(e) => setPrefs(prev => ({ ...prev, email_enabled: e.target.checked ? 1 : 0 }))}
                  className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                />
              </div>
              <h4 className="text-xs font-bold text-slate-900">College Email Delivery</h4>
              <p className="text-[11px] text-slate-500 leading-snug">
                Send official notification copies to your @francisxavier.ac.in account.
              </p>
            </div>
          </div>

          <div className="border-b border-slate-100 pt-4 pb-2">
            <h3 className="text-base font-extrabold font-display text-slate-900">
              Alert Categories
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Select which notifications you want to receive
            </p>
          </div>

          <div className="space-y-3">
            {[
              { key: 'notify_new_events', label: 'New Event Releases', desc: 'Alert me when new hackathons, workshops, or symposiums are published.' },
              { key: 'notify_registration_updates', label: 'Registration Lifecycle', desc: 'Notify me when my seat is confirmed, approved, or requires proof correction.' },
              { key: 'notify_deadlines', label: 'Deadline Reminders', desc: 'Send 24-hour and 1-hour reminders before registration and certificate deadlines.' },
              { key: 'notify_event_changes', label: 'Schedule Changes & Cancellations', desc: 'Critical alerts if an event venue, date, or timing is modified.' },
              { key: 'notify_reward_points', label: 'Reward Points & Ranking', desc: 'Celebrate when your certificate is verified and reward points are credited.' },
            ].map((cat) => (
              <label key={cat.key} className="flex items-start gap-3 p-3 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                <input
                  type="checkbox"
                  checked={Boolean(prefs[cat.key])}
                  onChange={(e) => setPrefs(prev => ({ ...prev, [cat.key]: e.target.checked ? 1 : 0 }))}
                  className="w-4 h-4 text-blue-600 rounded mt-0.5 cursor-pointer"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">{cat.label}</p>
                  <p className="text-[11px] text-slate-500">{cat.desc}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={savingPrefs}
            >
              Save Preferences
            </Button>
          </div>
        </form>
      ) : (
        /* Tab 2: Notifications List */
        <div className="space-y-3">
          {loading ? (
            <div className="p-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600 font-mono">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200 shadow-xs">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                <Bell className="w-7 h-7" />
              </div>
              <h3 className="font-display font-extrabold text-base text-slate-900">
                {unreadOnly ? 'No Unread Notifications' : 'No Notifications in this Category'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                When campus events are scheduled, your registration is approved, or deadlines approach, you will see your updates here.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const meta = getCategoryMeta(notif.category);
              const CategoryIcon = meta.icon;
              return (
                <div
                  key={notif.id}
                  className={`p-5 rounded-3xl border transition-all duration-200 relative overflow-hidden group ${
                    !notif.is_read
                      ? 'bg-white border-blue-200 shadow-md shadow-blue-500/5 ring-1 ring-blue-100'
                      : 'bg-white/80 border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  {!notif.is_read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600" />
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${meta.color} shadow-xs`}>
                        <CategoryIcon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${meta.color}`}>
                            {meta.label}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {new Date(notif.created_at).toLocaleString('en-US', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                          {!notif.is_read && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                          )}
                        </div>

                        <h3 className={`text-sm tracking-tight ${
                          !notif.is_read ? 'font-extrabold text-slate-900' : 'font-bold text-slate-800'
                        }`}>
                          {notif.title}
                        </h3>

                        <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                          {notif.message}
                        </p>

                        {/* Action Link Button */}
                        {notif.action_url && (
                          <div className="pt-2">
                            <button
                              onClick={() => {
                                if (!notif.is_read) handleMarkAsRead(notif.id);
                                navigate(notif.action_url);
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              <span>View Associated Event / Workflow</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0">
                      {!notif.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notif.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs font-mono text-slate-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} alerts)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchNotifications(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchNotifications(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Notifications;
