# Pack explorer
use pack API in dashboard to explore pack content interactively.
not just ALL, but show the list, extract the exact file etc.
interactive UI on a separated page.

also sam page gives API to build pack -> add text are for content, upload file (multiple) etc.

so kind of playground.


# Pack big json object
imagine JSON array for 100k objects, 5M tokens.
so we can pack it as each file separately, means that then we can decode the exact, instead of whole.

# Use case -> deployable token.
pack "build" into token, run it in the playground.


# Chunk router
## Chunks
-> we support chunks for big files, so need to double check it works.
the chunk (any chunk from the same bundle) contains the information about any other chunk.
so the idea is that if we decode any chunk from bundle -> we decode all chunk bundles. 
all chunk are fetched/streamed in parallel, then composed.
The only thing is that we need to think
decode(buffer) - can't contain other chunk sources metadata...
decode(url) -> it can, since it may contain chunk file names within the same baseurl.

## Router
kind simple QR code which ref to the chunk. then fetch/stream the chunk or bundle of chunks.
kind of entry point, which can be read even from smartphone camera.


# Partial fetch
> if i have image on CDN, can i read the exact pixel colors remotely, without fetching the whole image?
---
2. HTTP Range Requests (partial fetches)
You can fetch only parts of the file using:
Range: bytes=0-4096
But this only gives raw compressed bytes, not usable pixel values.
Whether partial bytes are enough depends on the image format:
---

I want to think more about this approach.

# Normilize UI
same UI components use across app, preferable hero ui.
keep it beautiful.


# More realistic runtime benchmark for execution.
so instead of just simple hello word for a few bytes,
lets make some more complex example.
to not write a lot of extract code, mb use threejs and build and package/runtime-benchmark-test-application
which builds a app/threesjs whatever app, using the 



