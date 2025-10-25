'use client';

interface WorkflowProgressProps {
  currentStep: number;
  className?: string;
  isCompleted?: boolean;
}

export default function WorkflowProgress({ currentStep, className = '', isCompleted = false }: WorkflowProgressProps) {
  const steps = [
    { number: 1, title: 'Upload', description: 'Upload your data file' },
    { number: 2, title: 'Metadata', description: 'Add dataset information' },
    { number: 3, title: 'Review', description: 'Preview your data' },
    { number: 4, title: 'Download', description: 'Get your OpenGIN files' }
  ];

  return (
    <div className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 ${className}`}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {steps.map((step, index) => {
          const stepCompleted = step.number < currentStep || (step.number === currentStep && isCompleted);
          const isCurrent = step.number === currentStep && !stepCompleted;
          const isUpcoming = step.number > currentStep;
          
          return (
            <div
              key={step.number}
              className={`text-center p-4 rounded-xl transition-all duration-300 ${
                stepCompleted
                  ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30'
                  : isCurrent
                  ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30'
                  : 'bg-gray-800/30 border border-gray-600/50'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 mx-auto transition-all duration-300 ${
                stepCompleted
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                  : isCurrent
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                  : 'bg-gradient-to-r from-gray-500 to-gray-600'
              }`}>
                {stepCompleted ? (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-white font-bold">{step.number}</span>
                )}
              </div>
              <h3 className={`text-sm font-semibold mb-1 ${
                stepCompleted ? 'text-green-300' : isCurrent ? 'text-blue-300' : 'text-gray-400'
              }`}>
                {step.title}
              </h3>
              <p className={`text-xs ${
                stepCompleted ? 'text-green-400' : isCurrent ? 'text-blue-400' : 'text-gray-500'
              }`}>
                {step.description}
              </p>
              {stepCompleted && (
                <div className="mt-2 text-xs text-green-400 font-medium">
                  ✓ Complete
                </div>
              )}
              {isCurrent && (
                <div className="mt-2 text-xs text-blue-400 font-medium">
                  → Current
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
