import * as fs from 'fs';
import * as path from 'path';
import {promisify} from 'util';

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

export interface DecodedImage {
  buffer: Buffer;
  mimeType: string;
  extension: string;
}

/**
 * Detect mime type from buffer magic bytes
 */
function detectMimeType(buffer: Buffer): string {
  if (buffer.length < 4) return 'image/jpeg';

  const header = buffer.slice(0, 4);

  // JPEG: FF D8 FF
  if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47
  if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
    return 'image/png';
  }

  // GIF: 47 49 46
  if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46) {
    return 'image/gif';
  }

  // WebP: 52 49 46 46 (RIFF) followed by WEBP
  if (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46) {
    const webpCheck = buffer.slice(8, 12);
    if (webpCheck.toString() === 'WEBP') {
      return 'image/webp';
    }
  }

  return 'image/jpeg'; // default
}

/**
 * Decode base64 string to buffer and extract mime type
 */
export function decodeBase64Image(base64String: string): DecodedImage {
  let mimeType = 'image/jpeg'; // default
  let base64Data = base64String;

  const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

  if (matches && matches.length === 3) {
    mimeType = matches[1];
    base64Data = matches[2];
  }

  const buffer = Buffer.from(base64Data, 'base64');

  // If no data URL was provided, detect from buffer
  if (!matches) {
    mimeType = detectMimeType(buffer);
  }

  let extension = 'jpg'; // default
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    extension = 'jpg';
  } else if (mimeType === 'image/png') {
    extension = 'png';
  } else if (mimeType === 'image/gif') {
    extension = 'gif';
  } else if (mimeType === 'image/webp') {
    extension = 'webp';
  }

  return {buffer, mimeType, extension};
}

/**
 * Save buffer to file in uploads directory
 */
export async function saveImageBuffer(buffer: Buffer, fileName: string): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

  // Ensure uploads directory exists
  try {
    await mkdirAsync(uploadsDir, {recursive: true});
  } catch (error) {
    // Directory might already exist
  }

  const filePath = path.join(uploadsDir, fileName);
  await writeFileAsync(filePath, buffer);

  // Return relative path for URL
  return `/uploads/${fileName}`;
}
