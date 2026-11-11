'use client'

import { ArrowLeftIcon } from '@phosphor-icons/react'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'

import { findScenario } from '@/scenarios/registry'

import { ScenarioPageBody } from './components/ScenarioPageBody'

export default function ScenarioPage() {
  const params = useParams<{ scenarioId: string }>()
  const scenario = findScenario(params.scenarioId)

  if (!scenario) {
    notFound()
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 space-y-5">
      <Link
        className="inline-flex items-center gap-2 text-xs text-tp-muted hover:text-tp-fg"
        href="/experiments"
      >
        <ArrowLeftIcon size={14} /> All scenarios
      </Link>

      <div>
        <h1 className="text-xl font-semibold tracking-tight">{scenario.name}</h1>
        <p className="mt-1 text-sm text-tp-muted">{scenario.description}</p>
      </div>

      <ScenarioPageBody scenario={scenario} />
    </main>
  )
}
