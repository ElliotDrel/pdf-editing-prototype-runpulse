// app/api/form-fill/reviewer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { stampFields } from '@/lib/pdf-stamp';

export const runtime = 'nodejs';
export const maxDuration = 15;

interface RequestBody {
  fields: Array<{ id: string; value: string; type: 'text' | 'checkbox' }>;
}

export async function POST(req: NextRequest) {
  try {
    const { fields } = (await req.json()) as RequestBody;
    if (!Array.isArray(fields)) {
      return NextResponse.json({ error: 'fields must be array' }, { status: 400 });
    }

    const pdfPath = resolve(process.cwd(), 'public/sample-prior-auth.pdf');
    const source = new Uint8Array(readFileSync(pdfPath));

    const stamped = await stampFields(source, fields);

    return new NextResponse(stamped as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="reviewer_render.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('reviewer route error:', err);
    return NextResponse.json({ error: 'reviewer stamp failed' }, { status: 500 });
  }
}
