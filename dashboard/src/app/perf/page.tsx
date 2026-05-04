import { CodecBenchmark } from '@/components/CodecBenchmark'

export default function PerfPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Codec Benchmark</h1>
        <p className="text-sm text-white/40 mt-1">Encode · Decode · Size — live measurements across all codec configurations</p>
      </div>
      <CodecBenchmark />
    </div>
  )
}
