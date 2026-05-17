// components/ReviewPane.tsx
'use client';

import type { Field } from '@/lib/types';

interface Props {
  fields: Field[];
  activeFieldId: string | null;
  onSelectField: (id: string) => void;
  onUpdateField: (id: string, patch: Partial<Field>) => void;
}

function badgeColor(tier: Field['tier']): string {
  if (tier === 'high') return 'text-accent border-accent/40';
  if (tier === 'mid') return 'text-warn border-warn/40';
  return 'text-danger border-danger/40';
}

export function ReviewPane({ fields, activeFieldId, onSelectField, onUpdateField }: Props) {
  return (
    <div className="bg-bg-elev-2 rounded-md p-4 max-h-[460px] overflow-y-auto">
      <ul className="space-y-3">
        {fields.map((f) => (
          <li
            key={f.id}
            onClick={() => onSelectField(f.id)}
            className={`p-3 rounded border cursor-pointer ${activeFieldId === f.id ? 'border-accent bg-accent/5' : 'border-border'}`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">{f.label}</div>
              <div className={`font-mono text-[10px] px-1.5 py-0.5 border rounded ${badgeColor(f.tier)}`}>
                {Math.round(f.confidence * 100)}% · {f.source}
              </div>
            </div>
            <input
              type="text"
              value={f.value}
              onChange={(e) => onUpdateField(f.id, { value: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-transparent font-mono text-sm text-fg outline-none focus:bg-bg/40 px-1 min-h-[44px]"
            />
            {f.flag && (
              <div className="mt-1 italic text-xs text-fg-muted">{f.flag}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
