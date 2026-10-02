import sharp from 'sharp';
import { AnalysisError } from './errors.ts';
export const MAX_IMAGE_BYTES = 8*1024*1024;
export async function validateImage(bytes: Buffer, declaredType: string): Promise<void> {
  if (bytes.length === 0) throw new AnalysisError('Choose a screenshot first.',400);
  if (bytes.length > MAX_IMAGE_BYTES) throw new AnalysisError('That image is too large. Choose an image under 8 MB.',413);
  const format = declaredType === 'image/png' ? 'png' : declaredType === 'image/jpeg' ? 'jpeg' : declaredType === 'image/webp' ? 'webp' : undefined;
  if (!format) throw new AnalysisError('Choose a PNG, JPG, or WebP screenshot.',400);
  try {
    const image = sharp(bytes,{limitInputPixels:20_000_000,failOn:'warning'});
    const info = await image.metadata();
    if (info.format !== format || (info.pages ?? 1) !== 1) throw new Error('type mismatch or animation');
    if (!info.width || !info.height || info.width*info.height > 20_000_000) throw new Error('pixel limit');
    await image.stats(); // Decode as well as inspect headers, so truncated images fail early.
  } catch(error) {
    if (error instanceof Error && /pixel limit/i.test(error.message)) throw new AnalysisError('That image is too large to read. Crop it to just the message and try again.',413);
    throw new AnalysisError('That image could not be read. Choose a clear PNG, JPG, or WebP screenshot.',400);
  }
}
