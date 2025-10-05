import { createContext, useContext, ReactNode, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { 
  getLocalStorageProgress, 
  setLocalStorageProgress, 
  isVisitorFlow 
} from '@/lib/onboardingStorage';

export interface OnboardingProgress {
  completed: boolean;
  steps: Record<string, boolean>;
  completedAt?: string;
}

export interface OnboardingContextType {
  currentFlow: string | null;
  setCurrentFlow: (flowKey: string | null) => void;
  
  getProgress: (flowKey: string) => OnboardingProgress | null;
  isLoading: (flowKey: string) => boolean;
  isAuthLoading: boolean;
  isVisitor: boolean;
  
  startFlow: (flowKey: string) => Promise<void>;
  completeStep: (flowKey: string, stepId: string) => Promise<void>;
  completeFlow: (flowKey: string) => Promise<void>;
  dismissFlow: (flowKey: string) => void;
  
  isFlowComplete: (flowKey: string) => boolean;
  isStepComplete: (flowKey: string, stepId: string) => boolean;
  getCurrentStepIndex: (flowKey: string, stepIds: string[]) => number;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();
  const [currentFlow, setCurrentFlow] = useState<string | null>(null);
  const [dismissedFlows, setDismissedFlows] = useState<Set<string>>(new Set());

  const isVisitor = !isAuthenticated;
  const flowQueryKey = (flowKey: string) => ['/api/onboarding/progress', flowKey];

  const getProgress = (flowKey: string): OnboardingProgress | null => {
    if (isVisitor || isVisitorFlow(flowKey)) {
      return getLocalStorageProgress(flowKey);
    }
    
    const data = queryClient.getQueryData<{ progress: OnboardingProgress }>(flowQueryKey(flowKey));
    if (data?.progress) {
      return data.progress;
    }
    
    return getLocalStorageProgress(flowKey);
  };

  const isLoading = (flowKey: string): boolean => {
    if (isVisitor || isVisitorFlow(flowKey)) {
      return false;
    }
    
    const state = queryClient.getQueryState(flowQueryKey(flowKey));
    return state?.fetchStatus === 'fetching';
  };

  const startFlowMutation = useMutation({
    mutationFn: async (flowKey: string) => {
      if (isVisitor || isVisitorFlow(flowKey)) {
        const progress: OnboardingProgress = {
          completed: false,
          steps: {},
        };
        setLocalStorageProgress(flowKey, progress);
        return { flowKey, progress };
      }

      try {
        const response = await apiRequest('PUT', `/api/onboarding/progress/${flowKey}`, {
          completed: false,
          steps: {},
        });
        const data = await response.json();
        setLocalStorageProgress(flowKey, data.progress);
        return data;
      } catch (error) {
        console.error('API error, falling back to localStorage:', error);
        const progress: OnboardingProgress = {
          completed: false,
          steps: {},
        };
        setLocalStorageProgress(flowKey, progress);
        return { flowKey, progress };
      }
    },
    onSuccess: (data, flowKey) => {
      if (!isVisitor && !isVisitorFlow(flowKey)) {
        queryClient.setQueryData(flowQueryKey(flowKey), data);
      }
      setCurrentFlow(flowKey);
    },
  });

  const completeStepMutation = useMutation({
    mutationFn: async ({ flowKey, stepId }: { flowKey: string; stepId: string }) => {
      const currentProgress = getProgress(flowKey) || { completed: false, steps: {} };
      const updatedProgress: OnboardingProgress = {
        ...currentProgress,
        steps: {
          ...currentProgress.steps,
          [stepId]: true,
        },
      };

      if (isVisitor || isVisitorFlow(flowKey)) {
        setLocalStorageProgress(flowKey, updatedProgress);
        return { flowKey, progress: updatedProgress };
      }

      try {
        const response = await apiRequest('POST', `/api/onboarding/progress/${flowKey}/step/${stepId}`, {});
        const data = await response.json();
        setLocalStorageProgress(flowKey, data.progress);
        return data;
      } catch (error) {
        console.error('API error, falling back to localStorage:', error);
        setLocalStorageProgress(flowKey, updatedProgress);
        return { flowKey, progress: updatedProgress };
      }
    },
    onSuccess: (data, { flowKey }) => {
      if (!isVisitor && !isVisitorFlow(flowKey)) {
        queryClient.setQueryData(flowQueryKey(flowKey), data);
        queryClient.invalidateQueries({ queryKey: flowQueryKey(flowKey) });
      }
    },
  });

  const completeFlowMutation = useMutation({
    mutationFn: async (flowKey: string) => {
      const currentProgress = getProgress(flowKey) || { completed: false, steps: {} };
      const updatedProgress: OnboardingProgress = {
        ...currentProgress,
        completed: true,
        completedAt: new Date().toISOString(),
      };

      if (isVisitor || isVisitorFlow(flowKey)) {
        setLocalStorageProgress(flowKey, updatedProgress);
        return { flowKey, progress: updatedProgress };
      }

      try {
        const response = await apiRequest('POST', `/api/onboarding/progress/${flowKey}/complete`, {});
        const data = await response.json();
        setLocalStorageProgress(flowKey, data.progress);
        return data;
      } catch (error) {
        console.error('API error, falling back to localStorage:', error);
        setLocalStorageProgress(flowKey, updatedProgress);
        return { flowKey, progress: updatedProgress };
      }
    },
    onSuccess: (data, flowKey) => {
      if (!isVisitor && !isVisitorFlow(flowKey)) {
        queryClient.setQueryData(flowQueryKey(flowKey), data);
        queryClient.invalidateQueries({ queryKey: flowQueryKey(flowKey) });
      }
      if (currentFlow === flowKey) {
        setCurrentFlow(null);
      }
    },
  });

  const startFlow = async (flowKey: string) => {
    await startFlowMutation.mutateAsync(flowKey);
  };

  const completeStep = async (flowKey: string, stepId: string) => {
    await completeStepMutation.mutateAsync({ flowKey, stepId });
  };

  const completeFlow = async (flowKey: string) => {
    await completeFlowMutation.mutateAsync(flowKey);
  };

  const dismissFlow = (flowKey: string) => {
    setDismissedFlows(prev => new Set(prev).add(flowKey));
    if (currentFlow === flowKey) {
      setCurrentFlow(null);
    }
  };

  const isFlowComplete = (flowKey: string): boolean => {
    if (dismissedFlows.has(flowKey)) return true;
    const progress = getProgress(flowKey);
    return progress?.completed || false;
  };

  const isStepComplete = (flowKey: string, stepId: string): boolean => {
    const progress = getProgress(flowKey);
    return progress?.steps[stepId] || false;
  };

  const getCurrentStepIndex = (flowKey: string, stepIds: string[]): number => {
    const progress = getProgress(flowKey);
    if (!progress) return 0;

    for (let i = 0; i < stepIds.length; i++) {
      if (!progress.steps[stepIds[i]]) {
        return i;
      }
    }
    
    return stepIds.length - 1;
  };

  const contextValue: OnboardingContextType = {
    currentFlow,
    setCurrentFlow,
    getProgress,
    isLoading,
    isAuthLoading,
    isVisitor,
    startFlow,
    completeStep,
    completeFlow,
    dismissFlow,
    isFlowComplete,
    isStepComplete,
    getCurrentStepIndex,
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboardingContext must be used within an OnboardingProvider');
  }
  return context;
}
