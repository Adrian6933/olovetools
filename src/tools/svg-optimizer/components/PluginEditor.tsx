import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { GROUP_ORDER, PLUGINS } from '../lib/catalog';
import type { OptimizerSettings, PluginGroup, PluginRisk } from '../lib/types';

// ============================================================================
// The manual control surface: every plugin, individually.
// ----------------------------------------------------------------------------
// The point of exposing all of them is that automation gets things wrong on
// real files — a `<use>` that only resolves at runtime, an id another stylesheet
// depends on, geometry deliberately parked outside the viewBox — and the person
// holding the file is the only one who knows. Risk badges say which switches can
// change what you see.
// ============================================================================

interface PluginEditorProps {
  settings: OptimizerSettings;
  onChange: (next: OptimizerSettings) => void;
  t: any;
}

const RISK_STYLE: Record<PluginRisk, string> = {
  safe: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  careful: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
  risky: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
};

export const PluginEditor: React.FC<PluginEditorProps> = ({ settings, onChange, t }) => {
  const [open, setOpen] = useState<PluginGroup | null>('cleanup');

  const grouped = useMemo(
    () =>
      GROUP_ORDER.map(group => ({
        group,
        plugins: PLUGINS.filter(p => p.group === group),
      })),
    []
  );

  const toggle = (id: string, value: boolean) =>
    onChange({ ...settings, enabled: { ...settings.enabled, [id]: value } });

  const setGroup = (group: PluginGroup, value: boolean) => {
    const enabled = { ...settings.enabled };
    for (const plugin of PLUGINS) {
      // Bulk-enabling never silently arms the switches that change behaviour;
      // those stay an explicit, individual decision.
      if (plugin.group === group && (!value || plugin.risk !== 'risky')) {
        enabled[plugin.id] = value;
      }
    }
    onChange({ ...settings, enabled });
  };

  return (
    <div className="space-y-2">
      {grouped.map(({ group, plugins }) => {
        const activeCount = plugins.filter(p => settings.enabled[p.id]).length;
        const isOpen = open === group;

        return (
          <div key={group} className="rounded-2xl border border-white/5 bg-black/20 overflow-hidden">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : group)}
              aria-expanded={isOpen}
              className="w-full px-4 py-3 flex items-center gap-3 text-left bg-transparent border-none cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <ChevronDown
                className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
              <span className="text-sm font-bold text-white flex-1 min-w-0 truncate">
                {t[`group_${group}`] || group}
              </span>
              <span className="text-[10px] font-mono font-bold text-cyan-400/70 tabular-nums shrink-0">
                {activeCount}/{plugins.length}
              </span>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  {t[`group_${group}_desc`] || ''}
                </p>

                <div className="flex flex-wrap gap-2 pb-1">
                  <button
                    type="button"
                    onClick={() => setGroup(group, true)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {t.btn_group_all || 'Enable all'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroup(group, false)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {t.btn_group_none || 'Disable all'}
                  </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                  {plugins.map(plugin => {
                    const on = !!settings.enabled[plugin.id];
                    return (
                      <label
                        key={plugin.id}
                        className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                          on
                            ? 'bg-cyan-500/[0.08] border-cyan-500/20 hover:border-cyan-500/35'
                            : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                        }`}
                      >
                        <span className="relative shrink-0 mt-0.5">
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={e => toggle(plugin.id, e.target.checked)}
                            className="sr-only peer"
                          />
                          <span
                            className={`block w-9 h-5 rounded-full transition-colors ${
                              on ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'bg-white/10'
                            }`}
                          />
                          <span
                            className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                              on ? 'left-[18px] bg-white' : 'left-0.5 bg-gray-400'
                            }`}
                          />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-1.5">
                            {/* svgo's own id, kept verbatim so it can be looked
                                up in svgo's docs and pasted into svgo.config.js */}
                            <code
                              className={`text-[11px] font-mono font-bold break-all ${
                                on ? 'text-cyan-200' : 'text-gray-400'
                              }`}
                            >
                              {plugin.id}
                            </code>
                            <span
                              className={`px-1.5 py-px rounded text-[9px] font-black uppercase tracking-wider border ${RISK_STYLE[plugin.risk]}`}
                            >
                              {t[`risk_${plugin.risk}`] || plugin.risk}
                            </span>
                          </span>
                          <span className="block text-[11px] text-gray-500 leading-snug mt-1">
                            {t[`plugin_${plugin.id}`] || ''}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PluginEditor;
