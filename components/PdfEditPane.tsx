// components/PdfEditPane.tsx
'use client';

import type { Field, PdfKey } from '@/lib/types';

interface Props {
  fields: Field[];
  activeFieldId: string | null;
  pdfKey: PdfKey;
  onSelectField: (id: string) => void;
  onUpdateField: (id: string, patch: Partial<Field>) => void;
}

type ByIdMap = Record<string, Field | undefined>;

interface EditorProps {
  field: Field | undefined;
  active: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<Field>) => void;
}

function FieldEditor({ field, active, onSelect, onUpdate }: EditorProps) {
  if (!field) return null;

  return (
    <div
      className={`cursor-text rounded px-1.5 -mx-1.5 py-0.5 transition-colors duration-100 ${
        active ? 'bg-accent/8' : 'hover:bg-paper-ink/[0.04]'
      }`}
      onClick={onSelect}
    >
      <div className="font-mono text-[7px] uppercase tracking-wider text-paper-ink/40 mb-0.5 select-none">
        {field.label}
      </div>

      <div className="flex items-center gap-1.5 border-b border-paper-line pb-1">
        {field.type === 'checkbox' && (
          <span className="text-paper-ink text-[10px] select-none flex-shrink-0">
            {field.value && field.value.toLowerCase() !== 'false' && field.value.toLowerCase() !== 'unchecked'
              ? '☒'
              : '☐'}
          </span>
        )}
        <input
          type="text"
          value={field.value}
          onChange={(e) => onUpdate({ value: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 min-w-0 bg-transparent font-body text-[11px] text-paper-ink outline-none"
          placeholder="—"
        />
      </div>
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="mt-5 mb-3">
      <div className="font-mono text-[7px] uppercase tracking-widest text-paper-ink/35 mb-1.5">
        {label}
      </div>
      <div className="border-t border-paper-line/50" />
    </div>
  );
}

function ep(
  id: string,
  byId: ByIdMap,
  activeFieldId: string | null,
  onSelectField: (id: string) => void,
  onUpdateField: (id: string, patch: Partial<Field>) => void,
): EditorProps {
  return {
    field: byId[id],
    active: activeFieldId === id,
    onSelect: () => onSelectField(id),
    onUpdate: (patch) => onUpdateField(id, patch),
  };
}

function PriorAuthForm({
  byId,
  activeFieldId,
  onSelectField,
  onUpdateField,
}: {
  byId: ByIdMap;
  activeFieldId: string | null;
  onSelectField: (id: string) => void;
  onUpdateField: (id: string, patch: Partial<Field>) => void;
}) {
  const e = (id: string) => ep(id, byId, activeFieldId, onSelectField, onUpdateField);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[3fr_2fr] gap-x-5">
        <FieldEditor {...e('patient_name')} />
        <FieldEditor {...e('dob')} />
      </div>
      <div className="grid grid-cols-2 gap-x-5">
        <FieldEditor {...e('member_id')} />
        <FieldEditor {...e('group_number')} />
      </div>
      <div className="grid grid-cols-2 gap-x-5">
        <FieldEditor {...e('icd10')} />
        <FieldEditor {...e('service_date')} />
      </div>
      <FieldEditor {...e('place_of_service')} />
      <FieldEditor {...e('urgency')} />
      <FieldEditor {...e('provider')} />
    </div>
  );
}

function ReferralForm({
  byId,
  activeFieldId,
  onSelectField,
  onUpdateField,
}: {
  byId: ByIdMap;
  activeFieldId: string | null;
  onSelectField: (id: string) => void;
  onUpdateField: (id: string, patch: Partial<Field>) => void;
}) {
  const e = (id: string) => ep(id, byId, activeFieldId, onSelectField, onUpdateField);
  return (
    <div>
      <SectionDivider label="Patient Information" />
      <div className="space-y-4">
        <div className="grid grid-cols-[3fr_2fr] gap-x-5">
          <FieldEditor {...e('patient_name')} />
          <FieldEditor {...e('dob')} />
        </div>
        <FieldEditor {...e('insurance_id')} />
      </div>

      <SectionDivider label="Referring Provider" />
      <div className="space-y-4">
        <div className="grid grid-cols-[3fr_2fr] gap-x-5">
          <FieldEditor {...e('referring_provider')} />
          <FieldEditor {...e('referring_npi')} />
        </div>
        <FieldEditor {...e('specialty')} />
      </div>

      <SectionDivider label="Clinical Information" />
      <div className="space-y-4">
        <FieldEditor {...e('urgency')} />
        <FieldEditor {...e('diagnosis')} />
        <FieldEditor {...e('clinical_notes')} />
      </div>
    </div>
  );
}

export function PdfEditPane({ fields, activeFieldId, pdfKey, onSelectField, onUpdateField }: Props) {
  const byId = Object.fromEntries(fields.map((f) => [f.id, f])) as ByIdMap;

  const title = pdfKey === 'referral'
    ? 'SPECIALIST REFERRAL REQUEST'
    : 'PRIOR AUTHORIZATION REQUEST';

  const subtitle = pdfKey === 'referral'
    ? 'Form #SR-2026-0872 · BLUE CROSS PREFERRED'
    : 'PA-2026-04421 · MEDPLAN COMMERCIAL';

  return (
    <div
      className="bg-paper text-paper-ink rounded-lg"
      style={{ boxShadow: '0 1px 16px rgba(0,0,0,0.18)' }}
    >
      <div className="px-6 pt-5 pb-6">
        <div className="text-center mb-4">
          <div
            className="font-display text-[14px] tracking-wide text-paper-ink mb-0.5"
            style={{ fontVariant: 'small-caps' }}
          >
            {title}
          </div>
          <div className="font-mono text-[7.5px] text-paper-ink/45">{subtitle}</div>
        </div>
        <div className="border-t border-paper-line/50 mb-4" />

        {pdfKey === 'referral' ? (
          <ReferralForm
            byId={byId}
            activeFieldId={activeFieldId}
            onSelectField={onSelectField}
            onUpdateField={onUpdateField}
          />
        ) : (
          <PriorAuthForm
            byId={byId}
            activeFieldId={activeFieldId}
            onSelectField={onSelectField}
            onUpdateField={onUpdateField}
          />
        )}
      </div>
    </div>
  );
}
