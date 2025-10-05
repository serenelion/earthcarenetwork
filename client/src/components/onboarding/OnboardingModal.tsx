import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { OnboardingStep } from '@/lib/onboardingFlows';
import { useOnboardingActions, useFlowProgress } from '@/hooks/useOnboarding';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface OnboardingModalProps {
  flowKey: string;
  steps: OnboardingStep[];
  isOpen: boolean;
  onComplete?: () => void;
  onDismiss?: () => void;
}

export function OnboardingModal({
  flowKey,
  steps,
  isOpen,
  onComplete,
  onDismiss,
}: OnboardingModalProps) {
  const { completeStep, completeFlow, dismissFlow } = useOnboardingActions(flowKey);
  const { getCurrentStep, isStepComplete } = useFlowProgress(flowKey);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const stepIds = steps.map(s => s.id);
    const currentIndex = getCurrentStep(stepIds);
    setCurrentStepIndex(currentIndex);
  }, [steps, getCurrentStep]);

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = async () => {
    if (currentStep) {
      await completeStep(currentStep.id);
    }

    if (isLastStep) {
      await completeFlow();
      onComplete?.();
    } else {
      setCurrentStepIndex(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
  };

  const handleSkip = () => {
    dismissFlow();
    onDismiss?.();
  };

  const handleClose = () => {
    onDismiss?.();
  };

  if (!currentStep) return null;

  const StepIcon = currentStep.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className="sm:max-w-[600px]" 
        data-testid="onboarding-modal"
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2" data-testid="onboarding-modal-header">
            {StepIcon && (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10" data-testid="onboarding-step-icon">
                <StepIcon className="h-6 w-6 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <DialogTitle className="text-xl" data-testid="onboarding-step-title">
                {currentStep.title}
              </DialogTitle>
              <div className="text-sm text-muted-foreground mt-1" data-testid="onboarding-step-progress">
                Step {currentStepIndex + 1} of {steps.length}
              </div>
            </div>
          </div>
          
          <Progress 
            value={progressPercentage} 
            className="h-2 mt-4" 
            data-testid="onboarding-progress-bar"
          />
        </DialogHeader>

        <div className="py-6" data-testid="onboarding-step-content">
          <DialogDescription className="text-base leading-relaxed" data-testid="onboarding-step-description">
            {currentStep.description}
          </DialogDescription>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <div className="flex gap-2 flex-1 justify-between w-full">
            <div className="flex gap-2">
              {!isFirstStep && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  data-testid="button-onboarding-previous"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={handleSkip}
                data-testid="button-onboarding-skip"
              >
                <X className="h-4 w-4 mr-1" />
                Skip
              </Button>
              
              <Button
                onClick={handleNext}
                data-testid={isLastStep ? "button-onboarding-done" : "button-onboarding-next"}
              >
                {isLastStep ? (
                  'Done'
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>

        {currentStep.action && (
          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleNext}
              data-testid="button-onboarding-action"
            >
              {currentStep.action}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
