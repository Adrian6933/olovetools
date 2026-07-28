// FormatFlow real image conversion — server-side sharp, runs as a Vercel Node
// serverless function (same origin as the site). See server/imageConvert.mjs
// for why HEIC/EPS/RAW output stay client-side fallbacks instead of living here.
import type { APIRoute } from 'astro';
import { convertImageBuffer, MAX_INPUT_BYTES, SUPPORTED_OUTPUT_FORMATS } from '../../../server/imageConvert.mjs';

export const prerender = false;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(status: number, data: unknown) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(400, { error: 'invalid_form_data' });
  }

  const file = form.get('file');
  const format = String(form.get('format') || '');
  const quality = Number(form.get('quality') ?? 90);
  const width = form.get('width') ? Number(form.get('width')) : undefined;
  const height = form.get('height') ? Number(form.get('height')) : undefined;

  if (!(file instanceof File)) return json(400, { error: 'missing_file' });
  if (!SUPPORTED_OUTPUT_FORMATS.has(format)) {
    return json(400, { error: 'unsupported_format', supported: Array.from(SUPPORTED_OUTPUT_FORMATS) });
  }
  if (file.size > MAX_INPUT_BYTES) {
    return json(413, { error: 'file_too_large', maxBytes: MAX_INPUT_BYTES });
  }

  try {
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const { buffer, mime } = await convertImageBuffer({ buffer: inputBuffer, format, quality, width, height });
    return new Response(buffer, {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': mime, 'Cache-Control': 'no-store' },
    });
  } catch (e: any) {
    return json(e?.code === 'unsupported_format' ? 400 : 500, { error: e?.code || 'conversion_failed', message: e?.message });
  }
};

export const OPTIONS: APIRoute = async () => new Response(null, { status: 204, headers: CORS_HEADERS });
