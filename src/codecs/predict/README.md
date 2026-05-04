# predict codec (id=10)

Linear prediction codec that stores residuals after extrapolating from the last two bytes.

## Encoding

- First 2 bytes stored as-is.
- For byte n (n >= 2): `predicted = (2 * byte[n-1] - byte[n-2]) mod 256`
- Store: `output[n] = (input[n] - predicted + 256) mod 256`

## Decoding

- First 2 bytes taken directly.
- For byte n (n >= 2): `predicted = (2 * output[n-1] - output[n-2]) mod 256`
- Recover: `output[n] = (pixels[n] + predicted) mod 256`

## When to use

Best for data with linear trends such as audio samples, sensor time-series, or incrementing counters. The residuals cluster near zero, allowing PNG's DEFLATE to achieve good compression.

Streaming compatible: yes.
