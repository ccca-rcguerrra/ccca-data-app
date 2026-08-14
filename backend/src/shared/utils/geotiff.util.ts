/**
 * Validates the TIFF magic bytes at the start of a buffer:
 *   - "II*\0" (0x49 0x49 0x2A 0x00) little-endian
 *   - "MM\0*" (0x4D 0x4D 0x00 0x2A) big-endian
 *
 * Rejects HTML error pages (e.g. a Google 502 page saved as .tif) and any
 * other non-TIFF payload. Only the first 4 bytes are inspected.
 */
export function isGeoTiffMagic(buffer: Buffer): boolean {
  if (buffer.length < 4) {
    return false;
  }
  const [b0, b1, b2, b3] = buffer;
  const littleEndian = b0 === 0x49 && b1 === 0x49 && b2 === 0x2a && b3 === 0x00;
  const bigEndian = b0 === 0x4d && b1 === 0x4d && b2 === 0x00 && b3 === 0x2a;
  return littleEndian || bigEndian;
}
