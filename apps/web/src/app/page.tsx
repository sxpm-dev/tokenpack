import { AlgorithmFamilies } from '@/components/AlgorithmFamilies/AlgorithmFamilies'
import { Benchmark } from '@/components/Benchmark/Benchmark'
import { CallToAction } from '@/components/CallToAction/CallToAction'
import { CompareTable } from '@/components/CompareTable/CompareTable'
import { DecodeSection } from '@/components/DecodeSection/DecodeSection'
import { DiffTokens } from '@/components/DiffTokens/DiffTokens'
import { EncodeShapes } from '@/components/EncodeShapes/EncodeShapes'
import { Hero } from '@/components/Hero/Hero'
import { HowItWorks } from '@/components/HowItWorks/HowItWorks'
import { LandingNav } from '@/components/LandingNav/LandingNav'
import { Pillars } from '@/components/Pillars/Pillars'
import { RangeFetchSection } from '@/components/RangeFetchSection/RangeFetchSection'
import { UseCases } from '@/components/UseCases/UseCases'
import { WhyPngToken } from '@/components/WhyPngToken/WhyPngToken'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-tp-bg text-tp-fg">
      <LandingNav />
      <main>
        <Hero />
        <EncodeShapes />
        <AlgorithmFamilies />
        <DecodeSection />
        <WhyPngToken />
        <DiffTokens />
        <RangeFetchSection />
        <Pillars />
        <HowItWorks />
        <UseCases />
        <CompareTable />
        <Benchmark />
        <CallToAction />
      </main>
    </div>
  )
}
