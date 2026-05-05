# rle codec (id=9)

Run-length encoding using a packet system that handles both repetitive and non-repetitive data efficiently.

## Packet format

- **Literal packet**: header byte with bit 7 = 0. Low 7 bits N → next (N+1) bytes are literal values.
- **Repeat packet**: header byte with bit 7 = 1. Low 7 bits N → next 1 byte repeated (N+1) times.
- Max literal run: 128 bytes per packet.
- Max repeat run: 128 repetitions per packet.

## When to use

Effective for binary data with runs of repeated bytes (e.g. null-padded sections, image data). Provides nearly lossless storage for random data (small overhead per 128-byte literal packet).

Streaming compatible: yes.
