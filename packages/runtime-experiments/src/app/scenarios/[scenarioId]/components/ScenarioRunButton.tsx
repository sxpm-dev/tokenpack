'use client'

import { Button } from '@heroui/react'
import { PlayIcon } from '@phosphor-icons/react'

interface ScenarioRunButtonProps {
  isRunning: boolean
  isDisabled: boolean
  onRun: () => void
}

export function ScenarioRunButton({ isRunning, isDisabled, onRun }: ScenarioRunButtonProps) {
  return (
    <Button isDisabled={isDisabled} isPending={isRunning} onPress={onRun}>
      <PlayIcon className="mr-1.5" size={14} />
      {isRunning ? 'Running…' : 'Run'}
    </Button>
  )
}
