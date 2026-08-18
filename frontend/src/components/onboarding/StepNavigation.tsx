import React from 'react';

interface StepNavigationProps {
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  canSkip: boolean;
  canGoNext: boolean;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  onNext,
  onPrevious,
  onSkip,
  canSkip,
  canGoNext,
}) => {
  return (
    <div className="flex gap-4 mt-8 pt-8 border-t">
      {currentStep > 1 && (
        <button
          onClick={onPrevious}
          className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
        >
          ← Previous
        </button>
      )}

      {canSkip && (
        <button
          onClick={onSkip}
          className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm"
        >
          Skip this step
        </button>
      )}

      <button
        onClick={onNext}
        disabled={!canGoNext}
        className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        Next Step →
      </button>
    </div>
  );
};

export default StepNavigation;
