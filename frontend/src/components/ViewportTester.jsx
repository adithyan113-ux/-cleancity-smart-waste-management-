import React, { useState } from 'react';
import {
  Smartphone,
  Tablet,
  Monitor,
  Maximize2,
  CheckCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const VIEWPORT_PRESETS = [
  { id: 'full', label: 'Fluid 100%', width: '100%', icon: Maximize2, desc: 'Responsive Default' },
  { id: '320', label: '320px', width: '320px', icon: Smartphone, desc: 'Compact Mobile (Small Phone)' },
  { id: '375', label: '375px', width: '375px', icon: Smartphone, desc: 'iPhone SE / Standard Phone' },
  { id: '390', label: '390px', width: '390px', icon: Smartphone, desc: 'iPhone 14 / Modern Mobile' },
  { id: '768', label: '768px', width: '768px', icon: Tablet, desc: 'iPad / Tablet Portrait' },
  { id: '1024', label: '1024px', width: '1024px', icon: Monitor, desc: 'Tablet Landscape / Laptop' },
  { id: '1440', label: '1440px', width: '1440px', icon: Monitor, desc: 'Desktop Widescreen' },
];

export default function ViewportTester({ activePreset, onPresetChange }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="bg-slate-900 text-white px-3 py-1.5 border-b border-slate-800 text-xs shadow-md z-50 sticky top-0"
      aria-label="Responsive Viewport Simulator Toolbar"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        
        {/* Title & Dimension Status */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
          <span className="font-bold text-slate-200">Responsive Viewport Tester:</span>
          <span className="font-mono text-emerald-400 font-bold px-1.5 py-0.5 bg-slate-800 rounded">
            {activePreset.width === '100%' ? 'Fluid 100% (Native Viewport)' : `${activePreset.width} Frame`}
          </span>
        </div>

        {/* Preset Selector Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 max-w-full">
          {VIEWPORT_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = activePreset.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onPresetChange(preset)}
                className={`min-h-[36px] px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
                aria-pressed={isSelected}
                title={`${preset.desc} (${preset.width})`}
              >
                <Icon className="w-3 h-3" aria-hidden="true" />
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </aside>
  );
}
