import { OnboardingProgress } from '@/contexts/OnboardingContext';

const VISITOR_FLOW = 'visitor';

export function getLocalStorageKey(flowKey: string): string {
  return `onboarding_progress_${flowKey}`;
}

export function getLocalStorageProgress(flowKey: string): OnboardingProgress | null {
  try {
    const stored = localStorage.getItem(getLocalStorageKey(flowKey));
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading onboarding progress from localStorage:', error);
    return null;
  }
}

export function setLocalStorageProgress(flowKey: string, progress: OnboardingProgress): void {
  try {
    localStorage.setItem(getLocalStorageKey(flowKey), JSON.stringify(progress));
  } catch (error) {
    console.error('Error writing onboarding progress to localStorage:', error);
  }
}

export function isVisitorFlow(flowKey: string): boolean {
  return flowKey === VISITOR_FLOW;
}
