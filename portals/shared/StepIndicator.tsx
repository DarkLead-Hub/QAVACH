interface Props {
  currentStep: number
  steps: string[]
}

export default function StepIndicator({ currentStep, steps }: Props) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {steps.map((step, i) => {
        const isActive = i + 1 === currentStep
        const isDone = i + 1 < currentStep
        return (
          <div key={step} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              isDone ? 'bg-green-500 text-white' :
              isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' :
              'bg-gray-200 text-gray-500'
            }`}>
              {isDone ? '✓' : i + 1}
            </div>
            <span className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
              {step}
            </span>
            {i < steps.length - 1 && (
              <div className={`w-10 h-0.5 mx-1 ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
