import React, { useState } from 'react';
import { BellRing, ShieldCheck, Calendar, Award, AlertCircle, X, Loader2 } from 'lucide-react';
import { subscribeToPushNotifications } from '../../utils/pushManager';
import { useToast } from '../Toast';
import { Button } from '../ui/Button';

export const PushPromptModal = ({ isOpen, onClose, onSubscribed }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleEnable = async () => {
    setLoading(true);
    setError('');
    try {
      await subscribeToPushNotifications();
      showToast('Browser push notifications enabled successfully!', 'success');
      if (onSubscribed) onSubscribed();
      onClose();
    } catch (err) {
      console.warn('Push subscription failed:', err);
      setError(err.message || 'Could not enable push notifications. Check browser settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      onClick={!loading ? onClose : undefined}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative bg-white text-slate-800 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-modal-pop my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white relative">
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 shadow-inner ring-1 ring-white/30">
            <BellRing className="w-6 h-6 text-white animate-pulse" />
          </div>

          <h3 className="font-display font-extrabold text-xl tracking-tight text-white">
            Never Miss a Campus Event
          </h3>
          <p className="text-xs text-blue-100 mt-1 leading-relaxed">
            Get instant browser notifications about registrations, deadline cutoffs, and reward points.
          </p>
        </div>

        {/* Benefits list */}
        <div className="p-6 space-y-3.5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">New Event Releases</h4>
              <p className="text-[11px] text-slate-500 leading-tight">Be the first to register before max seat quotas fill up.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Seat Confirmations</h4>
              <p className="text-[11px] text-slate-500 leading-tight">Instant confirmation when faculty approve your registration proof.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">24-Hour & 1-Hour Deadline Alerts</h4>
              <p className="text-[11px] text-slate-500 leading-tight">Timely alerts before registration or certificate submission closes.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Reward Points Credited</h4>
              <p className="text-[11px] text-slate-500 leading-tight">Celebrate when your trophy ranking and points are verified.</p>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              Maybe Later
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleEnable}
              loading={loading}
            >
              Enable Notifications
            </Button>
          </div>

          <p className="text-[10px] text-center text-slate-400 font-mono mt-1">
            You can change your preferences or unsubscribe at any time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PushPromptModal;
