import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { OnboardingStep } from '@/lib/onboardingFlows';
import { useOnboardingActions, useFlowProgress } from '@/hooks/useOnboarding';
import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingChecklistProps {
  flowKey: string;
  steps: OnboardingStep[];
  collapsible?: boolean;
  title?: string;
  description?: string;
}

export function OnboardingChecklist({
  flowKey,
  steps,
  collapsible = true,
  title = 'Getting Started',
  description = 'Complete these steps to get the most out of your account',
}: OnboardingChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { completeStep } = useOnboardingActions(flowKey);
  const { isStepComplete, isComplete, completedSteps } = useFlowProgress(flowKey);

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const totalCount = steps.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleStepToggle = async (stepId: string, currentlyComplete: boolean) => {
    if (!currentlyComplete) {
      await completeStep(stepId);
    }
  };

  if (isComplete) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800" data-testid="onboarding-checklist-complete">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" data-testid="icon-checklist-complete" />
            <CardTitle className="text-green-900 dark:text-green-100" data-testid="text-checklist-complete-title">
              All Done!
            </CardTitle>
          </div>
          <CardDescription className="text-green-700 dark:text-green-300" data-testid="text-checklist-complete-description">
            You've completed all onboarding steps
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card data-testid="onboarding-checklist">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg" data-testid="text-checklist-title">
              {title}
            </CardTitle>
            <CardDescription className="mt-1" data-testid="text-checklist-description">
              {description}
            </CardDescription>
          </div>
          {collapsible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              data-testid="button-checklist-toggle"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm" data-testid="text-checklist-progress">
            <span className="text-muted-foreground">
              {completedCount} of {totalCount} completed
            </span>
            <span className="font-medium">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2" 
            data-testid="progress-checklist"
          />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="space-y-3" data-testid="checklist-steps">
            {steps.map((step, index) => {
              const isCompleted = isStepComplete(step.id);
              const StepIcon = step.icon;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                    isCompleted 
                      ? "bg-muted/50 border-muted" 
                      : "bg-card border-border hover:bg-accent/50"
                  )}
                  data-testid={`checklist-step-${step.id}`}
                >
                  <Checkbox
                    id={`step-${step.id}`}
                    checked={isCompleted}
                    onCheckedChange={() => handleStepToggle(step.id, isCompleted)}
                    disabled={isCompleted}
                    className="mt-1"
                    data-testid={`checkbox-step-${step.id}`}
                  />
                  
                  <div className="flex-1 space-y-1">
                    <label
                      htmlFor={`step-${step.id}`}
                      className={cn(
                        "text-sm font-medium leading-none cursor-pointer",
                        isCompleted && "line-through text-muted-foreground"
                      )}
                      data-testid={`label-step-${step.id}`}
                    >
                      <div className="flex items-center gap-2">
                        {StepIcon && (
                          <StepIcon className="h-4 w-4" data-testid={`icon-step-${step.id}`} />
                        )}
                        {step.title}
                      </div>
                    </label>
                    <p 
                      className={cn(
                        "text-sm text-muted-foreground",
                        isCompleted && "line-through"
                      )}
                      data-testid={`description-step-${step.id}`}
                    >
                      {step.description}
                    </p>
                    {step.action && !isCompleted && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-primary"
                        onClick={() => handleStepToggle(step.id, isCompleted)}
                        data-testid={`button-action-${step.id}`}
                      >
                        {step.action} →
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
