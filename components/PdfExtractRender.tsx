// components/PdfExtractRender.tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import type { Field, PdfKey, RenderBlock } from '@/lib/types';
import { zonesForPdf } from '@/lib/input-zones';

const PAGE_W = 612;
const PAGE_H = 792;

interface Props {
  blocks: RenderBlock[];
  fields: Field[];
  pdfKey: PdfKey;
  activeFieldId: string | null;
  onSelectField: (id: string) => void;
  onUpdateField: (id: string, patch: Partial<Field>) => void;
}

function blockInZone(
  bb: number[],
  zone: { x: number; y: number; width: number; height: number },
): boolean {
  // Block bbox center in page points (top-left origin)
  const cx = ((bb[0] + bb[4]) / 2) * PAGE_W;
  const cy = ((bb[1] + bb[5]) / 2) * PAGE_H;

  // Zone converted from bottom-left to top-left origin
  const zTop = PAGE_H - zone.y - zone.height;
  const zBottom = PAGE_H - zone.y;

  return cx >= zone.x && cx <= zone.x + zone.width && cy >= zTop && cy <= zBottom;
}

export function PdfExtractRender({ blocks, fields, pdfKey, activeFieldId, onSelectField, onUpdateField }: Props) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerW(entry.contentRect.width);
    });
    ro.observe(el);
    setContainerW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const zones = zonesForPdf(pdfKey);
  const byId = Object.fromEntries(fields.map((f) => [f.id, f]));

  const zoneFieldIds = new Set(zones.map((z) => z.fieldId));
  const scale = containerW > 0 ? containerW / PAGE_W : 1;

  // Which blocks overlap a field zone? Suppress them — the input replaces the text.
  const zoneRects = zones.map((z) => ({
    x: z.x,
    y: z.y,
    width: z.width,
    height: z.height,
  }));

  const visibleBlocks = blocks.filter(
    (b) => b.page === 1 && !zoneRects.some((z) => blockInZone(b.bbox, z)),
  );

  return (
    <div
      ref={outerRef}
      className="w-full"
      style={{ boxShadow: '0 1px 16px rgba(0,0,0,0.18)', borderRadius: 8 }}
    >
      {/* Aspect-ratio spacer: height = scale * PAGE_H */}
      <div style={{ height: containerW > 0 ? scale * PAGE_H : PAGE_H, position: 'relative' }}>
        {/* Fixed-size page, scaled to container */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: PAGE_W,
            height: PAGE_H,
            transformOrigin: 'top left',
            transform: containerW > 0 ? `scale(${scale})` : 'scale(1)',
            backgroundColor: '#F5F2EB',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {/* Non-field text blocks */}
          {visibleBlocks.map((b, i) => {
            const bb = b.bbox;
            const left = bb[0] * PAGE_W;
            const top = bb[1] * PAGE_H;
            const width = (bb[2] - bb[0]) * PAGE_W;
            const height = (bb[5] - bb[1]) * PAGE_H;
            const fontSize = Math.max(6, height * 0.75);

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left,
                  top,
                  width,
                  height,
                  fontSize,
                  lineHeight: 1,
                  fontFamily: 'Helvetica, Arial, sans-serif',
                  color: '#1A1814',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                {b.content}
              </div>
            );
          })}

          {/* Editable field inputs at zone positions */}
          {zones.map((zone) => {
            const field = byId[zone.fieldId];
            if (!field) return null;

            const top = PAGE_H - zone.y - zone.height;
            const active = activeFieldId === zone.fieldId;

            const borderColor =
              field.tier === 'low'
                ? 'rgba(239,68,68,0.6)'
                : field.tier === 'mid'
                ? 'rgba(234,179,8,0.6)'
                : 'rgba(120,120,100,0.35)';

            const bgColor = active ? 'rgba(196,186,130,0.12)' : 'transparent';

            return (
              <div
                key={zone.fieldId}
                style={{
                  position: 'absolute',
                  left: zone.x,
                  top,
                  width: zone.width,
                  height: zone.height,
                  backgroundColor: bgColor,
                  borderBottom: `1.5px solid ${borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'text',
                  transition: 'background-color 0.1s',
                }}
                onClick={() => onSelectField(zone.fieldId)}
              >
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => onUpdateField(zone.fieldId, { value: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontFamily: 'Helvetica, Arial, sans-serif',
                    fontSize: zone.fontSize,
                    color: '#1A1814',
                    lineHeight: 1,
                    padding: 0,
                  }}
                  placeholder="—"
                />
                {field.tier !== 'high' && (
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 7,
                      color: field.tier === 'low' ? 'rgba(239,68,68,0.8)' : 'rgba(234,179,8,0.8)',
                      flexShrink: 0,
                    }}
                  >
                    {Math.round(field.confidence * 100)}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
