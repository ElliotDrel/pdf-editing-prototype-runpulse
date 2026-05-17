// components/PdfPane.tsx
'use client';

import type { Field } from '@/lib/types';

interface Props {
  fields: Field[];
  activeFieldId: string | null;
  onSelectField: (id: string) => void;
}

function tintFor(tier: Field['tier'], active: boolean): string {
  if (active) return 'bg-accent/10 border-accent';
  if (tier === 'low') return 'bg-danger/10 border-paper-line border-dashed';
  if (tier === 'mid') return 'bg-warn/10 border-paper-line border-dashed';
  return 'border-paper-line border-dashed';
}

function FieldCell({ field, active, onSelect }: { field: Field; active: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`block w-full text-left px-3 py-2 border-b ${tintFor(field.tier, active)} transition-colors hover:bg-paper-ink/5`}
    >
      <div className="font-mono text-[10px] uppercase tracking-wider text-paper-ink/60">
        {field.label}
      </div>
      <div className="font-body text-paper-ink text-sm mt-1">
        {field.type === 'checkbox' && field.value === 'Routine' ? '☒ Routine' : field.value || ' '}
      </div>
    </button>
  );
}

export function PdfPane({ fields, activeFieldId, onSelectField }: Props) {
  const byId = Object.fromEntries(fields.map((f) => [f.id, f])) as Record<string, Field>;
  const rows: Array<[string, string?]> = [
    ['patient_name', 'dob'],
    ['member_id', 'group_number'],
    ['icd10', 'service_date'],
    ['place_of_service'],
    ['urgency'],
    ['provider'],
  ];

  return (
    <div className="bg-paper text-paper-ink rounded-md p-6 font-body">
      <div className="font-display text-xl mb-1 text-center">PRIOR AUTHORIZATION REQUEST</div>
      <div className="font-mono text-[10px] text-paper-ink/60 text-center mb-5">PA-2026-04421 · MEDPLAN COMMERCIAL</div>
      {rows.map((row, i) => (
        <div key={i} className={`grid gap-0 ${row.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {row.map((id) =>
            id && byId[id] ? (
              <FieldCell key={id} field={byId[id]} active={activeFieldId === id} onSelect={() => onSelectField(id)} />
            ) : null
          )}
        </div>
      ))}
    </div>
  );
}
