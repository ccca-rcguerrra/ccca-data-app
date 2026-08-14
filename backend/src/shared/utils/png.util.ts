/**
 * Validates the PNG magic bytes at the start of a buffer:
 *   0x89 'P' 'N' 'G' 0x0D 0x0A 0x1A 0x0A (the 8-byte PNG signature).
 *
 * Rejects HTML error pages (e.g. a GEE/Google 502 page returned in place of the
 * thumbnail) and any other non-PNG payload before we stream it to the browser.
 */
export function isPngMagic(buffer: Buffer): boolean {
  if (buffer.length < 8) {
    return false;
  }
  return (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  );
}

/**
 * Validates the JPEG magic bytes at the start of a buffer (0xFF 0xD8 0xFF).
 * GEE map tiles (getMap) are served as JPEG by default, unlike the PNG
 * thumbnails from getThumbURL(format:'png').
 */
export function isJpegMagic(buffer: Buffer): boolean {
  return (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  );
}

/**
 * Detects the MIME type of an image buffer from its magic bytes, limited to the
 * formats GEE returns (PNG thumbnails, JPEG tiles). Returns null for anything
 * else (e.g. an HTML error page) so callers never relay garbage to the browser.
 */
export function detectImageMime(
  buffer: Buffer,
): 'image/png' | 'image/jpeg' | null {
  if (isPngMagic(buffer)) {
    return 'image/png';
  }
  if (isJpegMagic(buffer)) {
    return 'image/jpeg';
  }
  return null;
}
