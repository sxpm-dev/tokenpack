# @tokenpack/browser

DX-first browser/DOM/React adapter for TokenPack on top of [`@tokenpack/core`](../core).

> **Status:** Phase 0 scaffold. Real implementation lands in Phase 3 after the core split (Phase 1).

## Planned surface

```ts
import { encode, decode } from '@tokenpack/browser'

// Encode → ergonomic outputs
const { blob, dataURL, image, stream } = await encode(jsonString, { algo: 'linear', compression: 'brotli-6' })

// Decode → accepts whatever you have
const data = await decode('/api/profile.png')      // fetch + decode
const data = await decode(fileBlob)                // <input type="file">
const data = await decode(imgElement)              // existing <img>
const stream = decode(response.body, { stream: true })
```

### React

```tsx
import { TokenImage, useTokenPack } from '@tokenpack/browser/components'

<TokenImage src="/data.png" onDecoded={data => console.log(data)} fallback={<Spinner />} />

const { state, data, error, progress } = useTokenPack('/data.png')
```

### Service Worker / postMessage / inline data URI

```ts
import { handleTokenpackRequest } from '@tokenpack/browser/sw'
import { sendPack, onPack } from '@tokenpack/browser/postMessage'
import { encodeInline } from '@tokenpack/browser/inline'
```

See [IDEAS.md](../../IDEAS.md) for the full architecture and roadmap.
