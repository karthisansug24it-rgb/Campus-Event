import React, { useState, useEffect } from 'react';
import { 
  Download, 
  X, 
  Sparkles, 
  Share, 
  PlusSquare, 
  CheckCircle2, 
  ExternalLink,
  Smartphone,
  Star
} from 'lucide-react';

const MobileAppBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode (already installed & running as app)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone || 
                         document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently (within 24 hours)
    const dismissedAt = localStorage.getItem('fxec_pwa_dismissed');
    if (dismissedAt) {
      const hoursPassed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60);
      if (hoursPassed < 24) {
        return;
      }
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // Listen for Chrome / Android PWA install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // If mobile device, show recommendation after 2 seconds
    const isMobileDevice = /android|iphone|ipad|ipod|mobile/.test(userAgent) || window.innerWidth < 800;
    const timer = setTimeout(() => {
      if (isMobileDevice && !isStandalone) {
        setIsVisible(true);
      }
    }, 1500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback guide if browser blocked automated prompt
      alert(
        "To install on your phone:\n\n1. Tap the 3 dots (⋮) in the top-right corner of Chrome.\n2. Tap 'Install app' or 'Add to Home screen'!"
      );
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowIOSGuide(false);
    localStorage.setItem('fxec_pwa_dismissed', String(Date.now()));
  };

  if (isInstalled || !isVisible) {
    return null;
  }

  return (
    <>
      {/* Sticky Bottom CCBP-Style Mobile App Recommendation Bar */}
      <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-[60] p-3 sm:p-4 bg-gradient-to-t from-slate-950/90 via-slate-950/80 to-transparent pointer-events-none animate-slide-up">
        <div className="max-w-md mx-auto bg-white/98 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-4 shadow-2xl pointer-events-auto flex items-center justify-between gap-3 text-slate-800">
          
          {/* App Icon & Details */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-md shadow-slate-200/80 flex items-center justify-center shrink-0 border border-slate-100 p-1 overflow-hidden">
              <img
                src="/fxec-logo.png"
                alt="FXEC Events Icon"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <Smartphone className="w-6 h-6 text-white hidden" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-display font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight truncate">
                  FXEC Campus Events
                </h4>
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-mono font-bold border border-amber-200 shrink-0">
                  <Star className="w-2.5 h-2.5 fill-current text-amber-500" />
                  4.9
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans truncate">
                Install app for instant updates & 1-tap registration
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-blue-600/25 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Install App</span>
            </button>

            <button
              onClick={handleDismiss}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chrome 3-Dot Hint */}
        <p className="text-center text-[10px] font-mono text-white/90 mt-1.5 drop-shadow-sm">
          💡 Or tap Chrome's top-right <span className="font-bold">⋮ menu</span> ➔ <span className="font-bold underline">Install app</span>
        </p>
      </div>

      {/* iOS Safari "Add to Home Screen" Instructions Modal */}
      {showIOSGuide && (
        <div 
          className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowIOSGuide(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-slate-800 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-extrabold text-base text-slate-900">
                Install on iPhone / iPad
              </h3>
              <button 
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">1. Tap the Share Button</p>
                  <p className="text-[11px] text-slate-500">At the bottom toolbar of Safari</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">2. Select "Add to Home Screen"</p>
                  <p className="text-[11px] text-slate-500">Scroll down and tap the plus icon</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">3. Tap "Add" at the Top Right</p>
                  <p className="text-[11px] text-slate-500">FXEC Events will be added as a native app</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-2xl bg-blue-600 text-white font-extrabold text-xs shadow-md shadow-blue-600/20"
            >
              Got it, thank you!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileAppBanner;
