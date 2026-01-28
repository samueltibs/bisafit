import { useState, useEffect, useCallback } from 'react';
import { Bug, Eye, EyeOff, Wrench, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScrollDebugInfo {
  userAgent: string;
  documentElement: {
    overflow: string;
    height: string;
    position: string;
  };
  body: {
    overflow: string;
    position: string;
    height: string;
    top: string;
    pointerEvents: string;
    dataScrollLocked: string | null;
  };
  appShell: {
    selector: string;
    found: boolean;
    overflowY: string;
    height: string;
    maxHeight: string;
    position: string;
    scrollHeight: number;
    clientHeight: number;
    scrollTop: number;
  } | null;
  settingsContainer: {
    selector: string;
    found: boolean;
    overflowY: string;
    height: string;
    scrollHeight: number;
    clientHeight: number;
  } | null;
}

/**
 * iOS-only debug panel for diagnosing scroll issues.
 * Only renders on iOS devices in development/preview mode.
 */
export function IOSScrollDebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [highlightEnabled, setHighlightEnabled] = useState(false);
  const [debugInfo, setDebugInfo] = useState<ScrollDebugInfo | null>(null);

  // Check if we should show this panel (iOS + dev/preview mode)
  const isIOS = typeof navigator !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
  
  const isDev = import.meta.env.DEV || 
    window.location.hostname.includes('preview') ||
    window.location.hostname.includes('lovable');

  const collectDebugInfo = useCallback((): ScrollDebugInfo => {
    const docEl = document.documentElement;
    const body = document.body;
    const docStyle = window.getComputedStyle(docEl);
    const bodyStyle = window.getComputedStyle(body);

    // Find app shell scroll container
    const appShellSelectors = [
      'main[class*="flex-1"]',
      '.app-layout-main',
      'main',
      '[data-scroll-container]'
    ];
    
    let appShellEl: HTMLElement | null = null;
    let appShellSelector = '';
    
    for (const selector of appShellSelectors) {
      const el = document.querySelector(selector) as HTMLElement;
      if (el) {
        const style = window.getComputedStyle(el);
        // Look for the scrollable main container
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
          appShellEl = el;
          appShellSelector = selector;
          break;
        }
      }
    }
    
    // Fallback: just grab main
    if (!appShellEl) {
      appShellEl = document.querySelector('main') as HTMLElement;
      appShellSelector = 'main (fallback)';
    }

    // Find Settings container
    const settingsSelectors = [
      '.container.space-y-6',
      '[class*="Settings"]',
      'main > div.container'
    ];
    
    let settingsEl: HTMLElement | null = null;
    let settingsSelector = '';
    
    for (const selector of settingsSelectors) {
      const el = document.querySelector(selector) as HTMLElement;
      if (el) {
        settingsEl = el;
        settingsSelector = selector;
        break;
      }
    }

    return {
      userAgent: navigator.userAgent.substring(0, 100) + '...',
      documentElement: {
        overflow: docStyle.overflow,
        height: docStyle.height,
        position: docStyle.position,
      },
      body: {
        overflow: bodyStyle.overflow,
        position: bodyStyle.position,
        height: bodyStyle.height,
        top: bodyStyle.top,
        pointerEvents: bodyStyle.pointerEvents,
        dataScrollLocked: body.getAttribute('data-scroll-locked'),
      },
      appShell: appShellEl ? {
        selector: appShellSelector,
        found: true,
        overflowY: window.getComputedStyle(appShellEl).overflowY,
        height: window.getComputedStyle(appShellEl).height,
        maxHeight: window.getComputedStyle(appShellEl).maxHeight,
        position: window.getComputedStyle(appShellEl).position,
        scrollHeight: appShellEl.scrollHeight,
        clientHeight: appShellEl.clientHeight,
        scrollTop: appShellEl.scrollTop,
      } : null,
      settingsContainer: settingsEl ? {
        selector: settingsSelector,
        found: true,
        overflowY: window.getComputedStyle(settingsEl).overflowY,
        height: window.getComputedStyle(settingsEl).height,
        scrollHeight: settingsEl.scrollHeight,
        clientHeight: settingsEl.clientHeight,
      } : null,
    };
  }, []);

  // Refresh debug info periodically when visible
  useEffect(() => {
    if (!isVisible) return;
    
    const refresh = () => setDebugInfo(collectDebugInfo());
    refresh();
    
    const interval = setInterval(refresh, 1000);
    return () => clearInterval(interval);
  }, [isVisible, collectDebugInfo]);

  // Toggle highlight mode
  useEffect(() => {
    if (highlightEnabled) {
      document.body.classList.add('debug-scroll-highlight');
    } else {
      document.body.classList.remove('debug-scroll-highlight');
    }
    return () => {
      document.body.classList.remove('debug-scroll-highlight');
    };
  }, [highlightEnabled]);

  const forceScrollFix = useCallback(() => {
    console.log('[iOS Debug] Applying force scroll fix...');
    
    // Find and fix the main scroll container
    const main = document.querySelector('main') as HTMLElement;
    if (main) {
      main.style.flex = '1';
      main.style.overflowY = 'auto';
      main.style.setProperty('-webkit-overflow-scrolling', 'touch');
      main.style.touchAction = 'pan-y';
      main.style.minHeight = '0'; // Critical for flex scroll
      console.log('[iOS Debug] Fixed main container styles');
    }

    // Ensure html/body are locked (app-shell scrolling)
    document.documentElement.style.height = '100%';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.height = '100%';
    document.body.style.overflow = 'hidden';
    document.body.removeAttribute('data-scroll-locked');
    document.body.style.pointerEvents = '';

    // Refresh debug info
    setDebugInfo(collectDebugInfo());
    console.log('[iOS Debug] Force fix applied, refreshed debug info');
  }, [collectDebugInfo]);

  // Don't render if not iOS or not in dev mode
  if (!isIOS || !isDev) {
    return null;
  }

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsVisible(true)}
        className="fixed top-4 right-4 z-[9999] h-10 w-10 rounded-full shadow-lg bg-orange-500 text-white border-orange-600 hover:bg-orange-600"
        title="Open iOS Scroll Debug"
      >
        <Bug className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div 
      className="fixed top-4 right-4 z-[9999] bg-black/90 text-white text-xs rounded-lg shadow-xl max-w-[320px] max-h-[80vh] overflow-hidden flex flex-col"
      style={{ fontSize: '10px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-white/20 bg-orange-600">
        <div className="flex items-center gap-2">
          <Bug className="h-3 w-3" />
          <span className="font-bold">iOS Scroll Debug</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 text-white hover:bg-white/20"
          >
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 text-white hover:bg-white/20"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {isExpanded && debugInfo && (
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {/* User Agent */}
          <div className="bg-white/10 rounded p-1.5">
            <div className="font-bold text-orange-300 mb-1">User Agent</div>
            <div className="break-all opacity-80">{debugInfo.userAgent}</div>
          </div>

          {/* Document Element */}
          <div className="bg-white/10 rounded p-1.5">
            <div className="font-bold text-orange-300 mb-1">documentElement</div>
            <div className="grid grid-cols-2 gap-1">
              <span className="opacity-60">overflow:</span>
              <span className="text-green-300">{debugInfo.documentElement.overflow}</span>
              <span className="opacity-60">height:</span>
              <span>{debugInfo.documentElement.height}</span>
              <span className="opacity-60">position:</span>
              <span>{debugInfo.documentElement.position}</span>
            </div>
          </div>

          {/* Body */}
          <div className="bg-white/10 rounded p-1.5">
            <div className="font-bold text-orange-300 mb-1">body</div>
            <div className="grid grid-cols-2 gap-1">
              <span className="opacity-60">overflow:</span>
              <span className="text-green-300">{debugInfo.body.overflow}</span>
              <span className="opacity-60">position:</span>
              <span>{debugInfo.body.position}</span>
              <span className="opacity-60">height:</span>
              <span>{debugInfo.body.height}</span>
              <span className="opacity-60">top:</span>
              <span>{debugInfo.body.top}</span>
              <span className="opacity-60">pointerEvents:</span>
              <span>{debugInfo.body.pointerEvents || 'auto'}</span>
              <span className="opacity-60">data-scroll-locked:</span>
              <span className={debugInfo.body.dataScrollLocked ? 'text-red-400' : 'text-green-300'}>
                {debugInfo.body.dataScrollLocked || 'null'}
              </span>
            </div>
          </div>

          {/* App Shell Container */}
          <div className="bg-white/10 rounded p-1.5">
            <div className="font-bold text-orange-300 mb-1">App Shell Container</div>
            {debugInfo.appShell ? (
              <>
                <div className="opacity-60 mb-1">selector: {debugInfo.appShell.selector}</div>
                <div className="grid grid-cols-2 gap-1">
                  <span className="opacity-60">overflowY:</span>
                  <span className={debugInfo.appShell.overflowY === 'auto' ? 'text-green-300' : 'text-red-400'}>
                    {debugInfo.appShell.overflowY}
                  </span>
                  <span className="opacity-60">height:</span>
                  <span>{debugInfo.appShell.height}</span>
                  <span className="opacity-60">maxHeight:</span>
                  <span>{debugInfo.appShell.maxHeight}</span>
                  <span className="opacity-60">position:</span>
                  <span>{debugInfo.appShell.position}</span>
                  <span className="opacity-60">scrollHeight:</span>
                  <span>{debugInfo.appShell.scrollHeight}px</span>
                  <span className="opacity-60">clientHeight:</span>
                  <span>{debugInfo.appShell.clientHeight}px</span>
                  <span className="opacity-60">scrollTop:</span>
                  <span>{debugInfo.appShell.scrollTop}px</span>
                </div>
              </>
            ) : (
              <div className="text-red-400">Not found</div>
            )}
          </div>

          {/* Settings Container */}
          <div className="bg-white/10 rounded p-1.5">
            <div className="font-bold text-orange-300 mb-1">Settings Container</div>
            {debugInfo.settingsContainer ? (
              <>
                <div className="opacity-60 mb-1">selector: {debugInfo.settingsContainer.selector}</div>
                <div className="grid grid-cols-2 gap-1">
                  <span className="opacity-60">overflowY:</span>
                  <span>{debugInfo.settingsContainer.overflowY}</span>
                  <span className="opacity-60">height:</span>
                  <span>{debugInfo.settingsContainer.height}</span>
                  <span className="opacity-60">scrollHeight:</span>
                  <span>{debugInfo.settingsContainer.scrollHeight}px</span>
                  <span className="opacity-60">clientHeight:</span>
                  <span>{debugInfo.settingsContainer.clientHeight}px</span>
                </div>
              </>
            ) : (
              <div className="opacity-60">Not on Settings page</div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {isExpanded && (
        <div className="p-2 border-t border-white/20 space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHighlightEnabled(!highlightEnabled)}
            className="w-full h-8 text-xs bg-transparent border-white/30 text-white hover:bg-white/20"
          >
            {highlightEnabled ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
            {highlightEnabled ? 'Hide Highlights' : 'Highlight Scroll Containers'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={forceScrollFix}
            className="w-full h-8 text-xs bg-orange-600 border-orange-500 text-white hover:bg-orange-700"
          >
            <Wrench className="h-3 w-3 mr-1" />
            Force Scroll Fix (temp)
          </Button>
        </div>
      )}
    </div>
  );
}
