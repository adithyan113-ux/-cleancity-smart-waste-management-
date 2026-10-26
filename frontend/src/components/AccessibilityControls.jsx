import React, { useState, useEffect } from 'react';
import {
  Eye,
  Type,
  Minimize2,
  Check,
  HelpCircle,
  Sparkles,
  Sliders
} from 'lucide-react';

export default function AccessibilityControls() {
  const [isOpen, setIsOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState('normal'); // 'normal' | 'large' | 'xlarge'
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // High contrast toggle
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    // Font sizing
    const root = document.documentElement;
    if (fontSize === 'large') {
      root.style.fontSize = '112.5%'; // ~18px
    } else if (fontSize === 'xlarge') {
      root.style.fontSize = '125%'; // ~20px
    } else {
      root.style.fontSize = '100%'; // 16px default
    }
  }, [fontSize]);

  return (
    <>
      {/* Floating Accessibility Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 md:bottom-6 right-3 z-30 min-h-[44px] min-w-[44px] px-3 py-2 bg-slate-900/90 hover:bg-slate-900 text-white rounded-full shadow-lg backdrop-blur-xs text-xs font-bold flex items-center gap-1.5 border border-slate-700/50 focus:ring-2 focus:ring-emerald-500"
        aria-label="Open Accessibility and Display Preferences"
        aria-expanded={isOpen}
      >
        <Sliders className="w-4 h-4 text-emerald-400" aria-hidden="true" />
        <span className="hidden sm:inline">A11y</span>
      </button>

      {/* Accessibility Preferences Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="a11y-title"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                <h2 id="a11y-title" className="text-base font-bold text-slate-900">
                  Accessibility & Display
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="min-h-[40px] min-w-[40px] text-slate-400 hover:text-slate-700 rounded-lg flex items-center justify-center"
                aria-label="Close accessibility settings"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              
              {/* High Contrast Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <strong className="block text-slate-900 font-bold">High Contrast Mode</strong>
                  <span className="text-slate-500 text-[11px]">Boosts border and text contrast for WCAG AA</span>
                </div>
                <button
                  onClick={() => setHighContrast(!highContrast)}
                  className={`min-h-[44px] min-w-[56px] px-3 py-1.5 rounded-xl font-bold transition-colors ${
                    highContrast ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                  aria-pressed={highContrast}
                >
                  {highContrast ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Text Resizing */}
              <div>
                <strong className="block text-slate-900 font-bold mb-1">Text Resizing</strong>
                <span className="text-slate-500 text-[11px] block mb-2">Adjust readable font size across the interface</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'normal', label: '100%' },
                    { id: 'large', label: '115%' },
                    { id: 'xlarge', label: '125%' }
                  ].map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setFontSize(size.id)}
                      className={`min-h-[44px] py-1.5 rounded-lg font-bold border transition-colors ${
                        fontSize === size.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reduced Motion */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  <strong className="block text-slate-900 font-bold">Reduced Motion</strong>
                  <span className="text-slate-500 text-[11px]">Minimizes transitions and spinning animations</span>
                </div>
                <button
                  onClick={() => setReducedMotion(!reducedMotion)}
                  className={`min-h-[44px] min-w-[56px] px-3 py-1.5 rounded-xl font-bold transition-colors ${
                    reducedMotion ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                  aria-pressed={reducedMotion}
                >
                  {reducedMotion ? 'ON' : 'OFF'}
                </button>
              </div>

            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
