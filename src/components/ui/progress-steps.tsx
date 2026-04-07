"use client"

import { Check, Loader2 } from "lucide-react"

interface Step {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'error'
}

interface ProgressStepsProps {
  steps: Step[]
  currentStep?: string
}

export function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep
        const isCompleted = step.status === 'completed'
        const isError = step.status === 'error'
        const isInProgress = step.status === 'in_progress'

        return (
          <div key={step.id} className="flex items-start gap-3">
            {/* Step indicator */}
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 flex-shrink-0 mt-0.5 ${
              isCompleted
                ? 'bg-success-bg border-success text-success-foreground'
                : isError
                ? 'bg-error-bg border-error text-error-foreground'
                : isInProgress
                ? 'bg-info-bg border-info text-info-foreground'
                : 'bg-brand-bg-alt border-brand-border text-brand-text-secondary'
            }`}>
              {isCompleted ? (
                <Check className="h-4 w-4" />
              ) : isInProgress ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>

            {/* Step content */}
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-medium ${
                isCompleted
                  ? 'text-success-foreground'
                  : isError
                  ? 'text-error-foreground'
                  : isInProgress
                  ? 'text-info-foreground'
                  : 'text-brand-text'
              }`}>
                {step.title}
              </h4>
              <p className={`text-xs mt-1 ${
                isCompleted
                  ? 'text-success'
                  : isError
                  ? 'text-error'
                  : isInProgress
                  ? 'text-brand-indigo'
                  : 'text-brand-text-secondary'
              }`}>
                {step.description}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}