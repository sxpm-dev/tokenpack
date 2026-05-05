# palette-pixel codec (id=11)

Palette-based encoding that maps byte values to frequency-ranked palette indices, clustering the pixel value distribution for better DEFLATE compression.

## Format

- First 255 bytes of output: palette (top-255 most frequent byte values, sorted by frequency descending).
- Remaining bytes: encoded data.
  - In-palette byte: 1 output byte (palette index 0-254).
  - Out-of-palette byte: 2 output bytes (escape 0xFF + raw byte value).

## Benefit

For typical source code where ~30-50 byte values cover 90%+ of content, the encoded pixel sequence clusters heavily in the range 0-30 (high-frequency characters like space, newline, letters). PNG's DEFLATE then compresses this clustered sequence significantly better than the original spread-out distribution.

## When to use

Best for text-heavy or source code content with a skewed byte distribution. Less effective for already-compressed or random binary data.

Streaming compatible: yes (palette is fixed at encode time, stored inline).
