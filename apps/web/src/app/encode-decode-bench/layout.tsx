import { BenchmarkProvenance } from '@/components/BenchmarkProvenance'
import { BenchNavigation } from '@/components/BenchNavigation'
import { LandingNav } from '@/components/LandingNav/LandingNav'
export default function ToolLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-tp-bg text-tp-fg">
      <LandingNav />
      <BenchNavigation />
      <BenchmarkProvenance />
      {children}
    </div>
  )
}
