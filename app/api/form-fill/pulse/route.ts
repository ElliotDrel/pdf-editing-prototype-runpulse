// app/api/form-fill/pulse/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildInstructions, fillForm } from '@/lib/pulse';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface RequestBody {
  fields: Array<{ id: string; label: string; value: string; type: 'text' | 'checkbox' }>;
}

export async function POST(req: NextRequest) {
  try {
    const { fields } = (await req.json()) as RequestBody;
    if (!Array.isArray(fields)) {
      return NextResponse.json({ error: 'fields must be array' }, { status: 400 });
    }

    const pdfPath = resolve(process.cwd(), 'public/sample-prior-auth.pdf');
    const sourcePdf = new Uint8Array(readFileSync(pdfPath));

    const instructions = buildInstructions(fields);
    const filled = await fillForm(sourcePdf, instructions, []);

    return new NextResponse(filled as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="pulse_render.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('pulse route error:', err);
    return NextResponse.json({ error: 'pulse fill failed' }, { status: 500 });
  }
}
