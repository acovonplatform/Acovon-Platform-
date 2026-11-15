export interface SafeJsonResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  rawText: string;
  isJson: boolean;
  errorMessage?: string;
}

/**
 * Strips any characters outside printable ASCII (0x20-0x7E) so HTTP headers
 * never throw `TypeError: String contains non ISO-8859-1 code point` (e.g. macOS U+202F).
 */
export function sanitizeHeaderValue(value: unknown, fallback = ''): string {
  const str = String(value ?? '').normalize('NFKD');
  const ascii = str.replace(/[^\x20-\x7E]/g, '').trim();
  return ascii || fallback;
}

/**
 * Produces an ASCII-safe filename for `x-file-name` headers and storage paths.
 */
export function sanitizeUploadFileName(name: unknown, fallback = 'upload.bin'): string {
  const normalized = String(name ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 180);
  if (!normalized || normalized === '.' || normalized === '..') {
    return fallback;
  }
  return normalized;
}

/**
 * Safely parses a Fetch Response without throwing
 * `SyntaxError: Failed to execute 'json' on 'Response': Unexpected end of JSON input`.
 */
export async function safeReadJsonResponse<T = any>(res: Response): Promise<SafeJsonResult<T>> {
  let rawText = '';
  try {
    rawText = await res.text();
  } catch {
    return {
      ok: false,
      status: res.status,
      data: null,
      rawText: '',
      isJson: false,
      errorMessage: `Network connection closed before response completed (HTTP ${res.status || 0}).`
    };
  }

  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      ok: res.ok,
      status: res.status,
      data: null,
      rawText: '',
      isJson: false,
      errorMessage: res.ok
        ? undefined
        : `Server returned an empty response (HTTP ${res.status}). Please retry.`
    };
  }

  try {
    const parsed = JSON.parse(trimmed) as T;
    return {
      ok: res.ok,
      status: res.status,
      data: parsed,
      rawText,
      isJson: true,
      errorMessage:
        !res.ok && parsed && typeof parsed === 'object' && 'error' in (parsed as Record<string, unknown>)
          ? String((parsed as Record<string, unknown>).error || `Request failed (HTTP ${res.status}).`)
          : undefined
    };
  } catch {
    const looksLikeHtml = /^<!doctype html|<html/i.test(trimmed);
    return {
      ok: false,
      status: res.status,
      data: null,
      rawText,
      isJson: false,
      errorMessage: looksLikeHtml
        ? `Server gateway returned an HTML error page (HTTP ${res.status}). Please try again.`
        : `Server returned an invalid response (HTTP ${res.status}). Please retry.`
    };
  }
}

/**
 * Convenience wrapper for `.then(r => safeJson(r))` promise chains.
 */
export async function safeJson<T = any>(res: Response, fallback: T | null = null): Promise<T | null> {
  const parsed = await safeReadJsonResponse<T>(res);
  return parsed.data ?? fallback;
}

/**
 * Reads a File/Blob into raw base64 (without `data:...;base64,` prefix).
 */
export function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Failed to read image file from device.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Normalizes and compresses large camera/screenshot images client-side so verification uploads
 * avoid 413/timeout issues over mobile connections and work reliably with non-ASCII filenames.
 */
export async function compressImageForUpload(
  file: File,
  maxDimension = 1920,
  maxBytes = 1.8 * 1024 * 1024
): Promise<File> {
  if (typeof document === 'undefined' || !file) return file;
  const mime = String(file.type || '').toLowerCase();
  if (!mime.startsWith('image/') || mime === 'image/gif' || mime === 'image/svg+xml') {
    return file;
  }

  const standardWebMime = mime === 'image/jpeg' || mime === 'image/jpg' || mime === 'image/png' || mime === 'image/webp';
  if (standardWebMime && file.size <= 400 * 1024) {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Image decode skipped'));
      el.src = objectUrl;
    });

    const srcW = img.naturalWidth || img.width;
    const srcH = img.naturalHeight || img.height;
    if (!srcW || !srcH) return file;

    const scale = Math.min(1, maxDimension / Math.max(srcW, srcH));
    const targetW = Math.max(1, Math.round(srcW * scale));
    const targetH = Math.max(1, Math.round(srcH * scale));

    if (scale === 1 && standardWebMime && file.size <= maxBytes) {
      return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const encodeJpeg = (quality: number): Promise<Blob | null> =>
      new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/jpeg', quality));

    let blob = await encodeJpeg(0.86);
    if (blob && blob.size > maxBytes) {
      blob = await encodeJpeg(0.74);
    }
    if (!blob || blob.size === 0) return file;

    const baseName = sanitizeUploadFileName(file.name, 'verification.jpg').replace(/\.[^.]+$/, '') || 'verification';
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
