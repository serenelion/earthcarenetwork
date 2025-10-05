import { useQuery } from '@tanstack/react-query';
import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { useAuth } from './useAuth';
import { OnboardingProgress } from '@/contexts/OnboardingContext';
import { isVisitorFlow } from '@/lib/onboardingStorage';

export function useOnboarding() {
  const context = useOnboardingContext();
  const { user, isAuthenticated } = useAuth();

  return {
    ...context,
    user,
    isAuthenticated,
  };
}

export function useOnboardingProgress(flowKey: string) {
  const { isAuthenticated } = useAuth();
  
  return useQuery<{ flowKey: string; progress: OnboardingProgress }>({
    queryKey: ['/api/onboarding/progress', flowKey],
    enabled: isAuthenticated && !!flowKey && !isVisitorFlow(flowKey),
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false;
      
      const errorMessage = error?.toString() || '';
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        return false;
      }
      return true;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useFlowProgress(flowKey: string) {
  const { data, isLoading, error } = useOnboardingProgress(flowKey);
  const { isStepComplete, isFlowComplete, getCurrentStepIndex, getProgress } = useOnboardingContext();
  const { isAuthenticated } = useAuth();

  let progress = data?.progress || null;
  
  if (!isAuthenticated || isVisitorFlow(flowKey) || error) {
    progress = getProgress(flowKey);
  }

  return {
    progress,
    isLoading: !isVisitorFlow(flowKey) && isAuthenticated ? isLoading : false,
    isComplete: isFlowComplete(flowKey),
    isStepComplete: (stepId: string) => isStepComplete(flowKey, stepId),
    getCurrentStep: (stepIds: string[]) => getCurrentStepIndex(flowKey, stepIds),
    completedSteps: progress?.steps || {},
    error: error ? 'Failed to load progress from server, using local storage' : undefined,
  };
}

export function useOnboardingActions(flowKey: string) {
  const { startFlow, completeStep, completeFlow, dismissFlow } = useOnboardingContext();

  return {
    startFlow: () => startFlow(flowKey),
    completeStep: (stepId: string) => completeStep(flowKey, stepId),
    completeFlow: () => completeFlow(flowKey),
    dismissFlow: () => dismissFlow(flowKey),
  };
}

export function useCurrentOnboardingFlow() {
  const { currentFlow, setCurrentFlow } = useOnboardingContext();
  
  return {
    currentFlow,
    setCurrentFlow,
    clearCurrentFlow: () => setCurrentFlow(null),
  };
}

export function useOnboardingStatus(flowKey: string) {
  const { getProgress, isFlowComplete } = useOnboardingContext();
  
  const progress = getProgress(flowKey);
  const isComplete = isFlowComplete(flowKey);
  
  const totalSteps = progress ? Object.keys(progress.steps).length : 0;
  const completedSteps = progress 
    ? Object.values(progress.steps).filter(Boolean).length 
    : 0;
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  
  return {
    progress,
    isComplete,
    totalSteps,
    completedSteps,
    progressPercentage,
  };
}
