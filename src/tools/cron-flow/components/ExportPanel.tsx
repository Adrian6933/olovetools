import React, { useMemo, useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { EXPORTS, EXPORT_FILENAME, generate } from '../lib/exporters';
import type { ExportId } from '../lib/exporters';
import type { Cron } from '../lib/cron';

// ============================================================================
// Export panel
// ----------------------------------------------------------------------------
// The expression is rarely the deliverable. This turns it into the seven
// artefacts people actually paste somewhere, and hands the active one to the
// download button and to the cross-tool handoff.
// ============================================================================

interface ExportPanelProps {
  cron: Cron;
  timezone: string;
  t: any;
  /** Kept in the parent so the handoff can serialise the same snippet. */
  command: string;
  onCommandChange: (value: string) => void;
  name: string;
  onNameChange: (value: string) => void;
  active: ExportId;
  onActiveChange: (id: ExportId) => void;
}

const LABELS: Record<ExportId, string> = {
  crontab: 'crontab',
  github: 'GitHub Actions',
  k8s: 'Kubernetes',
  systemd: 'systemd',
  aws: 'EventBridge',
  nodecron: 'node-cron',
  spring: 'Spring',
};

export const ExportPanel: React.FC<ExportPanelProps> = ({
  cron,
  timezone,
  t,
  command,
  onCommandChange,
  name,
  onNameChange,
  active,
  onActiveChange,
}) => {
  const [copied, setCopied] = useState(false);

  const snippet = useMemo(
    () => generate(active, { cron, timezone, command, name }),
    [active, cron, timezone, command, name]
  );

  const copy = () => {
    navigator.clipboard.writeText(snippet).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      },
      () => setCopied(false)
    );
  };

  const download = () => {
    const blob = new Blob([snippet], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = EXPORT_FILENAME[active];
    a.click();
    // Revoking on the next tick rather than never: the old build leaked one
    // object URL per download for the lifetime of the tab.
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {EXPORTS.map(id => (
          <button
            key={id}
            onClick={() => onActiveChange(id)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer outline-none ${
              id === active
                ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/25'
                : 'bg-[#160a24] border-white/5 text-slate-400 hover:text-white hover:border-violet-500/30'
            }`}
          >
            {LABELS[id]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="space-y-1.5 block">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
            {t.export_nameLabel || 'Job name'}
          </span>
          <input
            value={name}
            onChange={e => onNameChange(e.target.value)}
            placeholder={t.export_namePlaceholder || 'Nightly backup'}
            className="w-full px-3 py-2 rounded-xl bg-[#12081e] border border-white/10 focus:border-violet-500/50 text-slate-200 text-sm outline-none transition-colors"
          />
        </label>
        <label className="space-y-1.5 block">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
            {t.export_commandLabel || 'Command to run'}
          </span>
          <input
            value={command}
            onChange={e => onCommandChange(e.target.value)}
            spellCheck={false}
            placeholder="/usr/local/bin/my-job.sh"
            className="w-full px-3 py-2 rounded-xl bg-[#12081e] border border-white/10 focus:border-violet-500/50 text-violet-200 font-mono text-xs outline-none transition-colors"
          />
        </label>
      </div>

      <div className="relative">
        <pre className="overflow-x-auto rounded-2xl bg-[#0d0518] border border-white/5 p-4 text-[11px] leading-relaxed text-violet-100 font-mono whitespace-pre">
          {snippet}
        </pre>
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={copy}
            title={t.export_copy || 'Copy'}
            className="w-8 h-8 rounded-lg bg-[#1a0d2b]/90 border border-white/10 text-slate-300 hover:text-white hover:border-violet-500/40 flex items-center justify-center transition-all cursor-pointer outline-none"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={download}
            title={t.export_download || 'Download'}
            className="w-8 h-8 rounded-lg bg-[#1a0d2b]/90 border border-white/10 text-slate-300 hover:text-white hover:border-violet-500/40 flex items-center justify-center transition-all cursor-pointer outline-none"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel;
