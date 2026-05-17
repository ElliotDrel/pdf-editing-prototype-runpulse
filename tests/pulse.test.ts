import { describe, expect, it, vi, afterEach } from 'vitest';
import { fillForm } from '@/lib/pulse';

describe('pulse client', () => {
  afterEach(() => vi.restoreAllMocks());

  it('throws if PULSE_API_KEY missing', async () => {
    const saved = process.env.PULSE_API_KEY;
    delete process.env.PULSE_API_KEY;
    await expect(
      fillForm(new Uint8Array([1, 2]), 'instructions', [])
    ).rejects.toThrow(/PULSE_API_KEY/);
    process.env.PULSE_API_KEY = saved;
  });

  it('posts multipart and returns pdf bytes when response has pdf_url', async () => {
    process.env.PULSE_API_KEY = 'test-key';
    const fakePdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({
        pdf_url: 'https://example.com/results/abc/pdf',
        form_id: 'fid-1',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(fakePdf, { status: 200 }));

    const result = await fillForm(new Uint8Array([1, 2, 3]), 'fill it', []);
    expect(result.byteLength).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
