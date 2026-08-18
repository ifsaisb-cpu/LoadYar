import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { OnboardingStep1 } from '../components/onboarding/OnboardingStep1';
import { OnboardingStep2 } from '../components/onboarding/OnboardingStep2';
import { OnboardingStep3 } from '../components/onboarding/OnboardingStep3';
import { OnboardingStep4 } from '../components/onboarding/OnboardingStep4';
import { OnboardingStep5 } from '../components/onboarding/OnboardingStep5';
import { OnboardingStep6 } from '../components/onboarding/OnboardingStep6';
import { StepNavigation } from '../components/onboarding/StepNavigation';
import { ProgressBar } from '../components/onboarding/ProgressBar';

type Step = 1 | 2 | 3 | 4 | 5 | 6;

interface OnboardingState {
  step_1_company?: boolean;
  step_2_vehicles?: boolean;
  step_3_drivers?: boolean;
  step_4_rates?: boolean;
  step_5_gl_accounts?: boolean;
  step_6_review?: boolean;
  is_active?: boolean;
  activated_at?: string;
}

export const OnboardingWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [progress, setProgress] = useState<OnboardingState>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Fetch progress on mount
  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await axios.get('/api/v1/onboarding/progress');
      setProgress(response.data);

      // Determine which step to show
      if (response.data.step_1_company) setCurrentStep(2);
      if (response.data.step_2_vehicles) setCurrentStep(3);
      if (response.data.step_3_drivers) setCurrentStep(4);
      if (response.data.step_4_rates) setCurrentStep(5);
      if (response.data.step_5_gl_accounts) setCurrentStep(6);
      if (response.data.is_active) setCurrentStep(1); // Go back to start if activated
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = async () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    fetchProgress(); // Refresh progress
  };

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleSkip = async () => {
    try {
      await axios.patch(`/api/v1/onboarding/skip/${currentStep}`);
      handleNext();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to skip step');
    }
  };

  const getProgressPercentage = (): number => {
    const completedSteps = Object.values(progress).filter((v) => v === true).length - 1; // -1 for is_active
    return Math.round((completedSteps / 5) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <p className="text-gray-600">Loading onboarding...</p>
      </div>
    );
  }

  if (progress.is_active) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Onboarding Complete!</h1>
          <p className="text-gray-600 mb-6">
            Your account is now active. You can start using LoadYar immediately.
          </p>
          <a
            href="/dashboard"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to LoadYar</h1>
          <p className="text-gray-600 mt-2">Let's get your account set up (Step {currentStep}/6)</p>
        </div>

        {/* Progress Bar */}
        <ProgressBar progress={getProgressPercentage()} />

        {/* Success Message */}
        {savedSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">✓ Step saved successfully</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Steps */}
        <div className="bg-white rounded-lg shadow p-8">
          {currentStep === 1 && <OnboardingStep1 onComplete={handleStepComplete} />}
          {currentStep === 2 && <OnboardingStep2 onComplete={handleStepComplete} />}
          {currentStep === 3 && <OnboardingStep3 onComplete={handleStepComplete} />}
          {currentStep === 4 && <OnboardingStep4 onComplete={handleStepComplete} />}
          {currentStep === 5 && <OnboardingStep5 onComplete={handleStepComplete} />}
          {currentStep === 6 && <OnboardingStep6 />}

          {/* Navigation */}
          {currentStep < 6 && (
            <StepNavigation
              currentStep={currentStep}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSkip={handleSkip}
              canSkip={currentStep > 1}
              canGoNext={
                (currentStep === 1 && progress.step_1_company) ||
                (currentStep === 2 && progress.step_2_vehicles) ||
                (currentStep === 3 && progress.step_3_drivers) ||
                (currentStep === 4 && progress.step_4_rates) ||
                (currentStep === 5 && progress.step_5_gl_accounts)
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
