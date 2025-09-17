"""Generate toolbar icons for the Demo Header Logo Hider extension.

The repository does not store binary assets, so run this script to create the
PNG icon files that the extension references. The script uses only the Python
standard library.
"""
from __future__ import annotations

import struct
import zlib
from pathlib import Path
from typing import Iterable

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "extension" / "icons"
SIZES: Iterable[int] = (16, 32, 48, 128)

ACTIVE_COLOR = (15, 157, 88, 255)  # Google green
INACTIVE_COLOR = (95, 99, 104, 255)  # Neutral grey
ACCENT_COLOR = (255, 255, 255, 255)


def write_png(path: Path, width: int, height: int, rgba_bytes: bytes) -> None:
  """Write an RGBA image to *path* in PNG format."""
  signature = b"\x89PNG\r\n\x1a\n"

  def chunk(chunk_type: bytes, data: bytes) -> bytes:
    length = struct.pack(">I", len(data))
    crc = struct.pack(">I", zlib.crc32(chunk_type + data) & 0xFFFFFFFF)
    return length + chunk_type + data + crc

  ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
  row_stride = width * 4
  raw = bytearray()
  for row in range(height):
    raw.append(0)  # No filter for this row.
    start = row * row_stride
    raw.extend(rgba_bytes[start : start + row_stride])
  compressed = zlib.compress(bytes(raw), level=9)

  with path.open("wb") as file:
    file.write(signature)
    file.write(chunk(b"IHDR", ihdr))
    file.write(chunk(b"IDAT", compressed))
    file.write(chunk(b"IEND", b""))


def build_icon_pixels(size: int, active: bool) -> bytes:
  """Return a bytes object containing RGBA pixels for the icon."""
  background = ACTIVE_COLOR if active else INACTIVE_COLOR
  pixels = bytearray(background * size * size)  # type: ignore[operator]

  bar_width = max(2, size // 6)
  margin = max(2, size // 5)
  crossbar_height = max(2, bar_width)
  crossbar_top = size // 2 - crossbar_height // 2
  crossbar_bottom = crossbar_top + crossbar_height

  def set_pixel(x: int, y: int, color: tuple[int, int, int, int]) -> None:
    index = (y * size + x) * 4
    pixels[index : index + 4] = bytes(color)

  # Draw left vertical bar.
  for y in range(margin, size - margin):
    for x in range(margin, margin + bar_width):
      set_pixel(x, y, ACCENT_COLOR)

  # Draw right vertical bar.
  for y in range(margin, size - margin):
    for x in range(size - margin - bar_width, size - margin):
      set_pixel(x, y, ACCENT_COLOR)

  # Draw crossbar.
  for y in range(crossbar_top, crossbar_bottom):
    for x in range(margin, size - margin):
      set_pixel(x, y, ACCENT_COLOR)

  return bytes(pixels)


def generate_icons() -> None:
  OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
  for size in SIZES:
    active_path = OUTPUT_DIR / f"active-{size}.png"
    inactive_path = OUTPUT_DIR / f"inactive-{size}.png"
    write_png(active_path, size, size, build_icon_pixels(size, active=True))
    write_png(inactive_path, size, size, build_icon_pixels(size, active=False))
    print(f"Created {active_path.relative_to(Path.cwd())}")
    print(f"Created {inactive_path.relative_to(Path.cwd())}")


if __name__ == "__main__":
  generate_icons()


