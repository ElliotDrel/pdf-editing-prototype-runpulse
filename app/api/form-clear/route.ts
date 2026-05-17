// app/api/form-clear/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { clearForm } from '@/lib/pulse';
import type { PdfKey } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { pdfKey?: string };
  const pdfKey = (body.pdfKey === 'referral' ? 'referral' : 'prior-auth') as PdfKey;
  const filename = pdfKey === 'referral' ? 'sample-referral.pdf' : 'sample-prior-auth.pdf';

  try {
    const pdfPath = resolve(process.cwd(), 'public', filename);
    const pdf = new Uint8Array(readFileSync(pdfPath));
    const cleared = await clearForm(pdf);

    return new NextResponse(cleared as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('form-clear route error:', err);
    return NextResponse.json({ error: 'form clear failed' }, { status: 500 });
  }
}
