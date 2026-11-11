// Builder for the runtime-benchmark generated script. Lives outside the route
// folder because Next.js disallows non-route exports from route.ts files.

export function buildScript(serverNow: number): string {
  // Tiny self-reporting script. Includes a small synthetic loop so exec isn't
  // a single instruction (would skew timing). Sets `globalThis.__rtbench` so
  // the page-side runner can read the values back without parsing console output.
  return `(function(){
  const tServer = ${serverNow.toFixed(3)};
  const tExec = performance.now();
  let _x = 0;
  for (let i = 0; i < 1000; i++) _x += i;
  const result = { tServer, tExec, _x };
  globalThis.__rtbench = result;
  console.log('runtime-bench:', result);
})();`
}
