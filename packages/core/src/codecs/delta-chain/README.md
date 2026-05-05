# delta-chain codec (id=8)

Delta-chain encoding across the entire pixel buffer linearly.

## Encoding

- First byte stored as-is (prev = 0).
- Each subsequent byte: `output[i] = (input[i] - input[i-1] + 256) % 256`.

## Decoding

- `output[0] = pixels[0]`
- `output[n] = (pixels[n] + output[n-1]) % 256`

## When to use

Best for data with slowly drifting or monotonically changing byte values (e.g. binary files with gradual offsets). Makes adjacent pixel values small, which significantly improves PNG's internal DEFLATE compression of the pixel data.

Streaming compatible: yes.
