import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Enterprise } from "@shared/schema";

export function useFeaturedEnterprises() {
  return useQuery<Enterprise[]>({
    queryKey: ["/api/admin/featured-enterprises"],
  });
}

export function useFeatureEnterprise() {
  return useMutation({
    mutationFn: async (enterpriseId: string) => {
      return await apiRequest(
        "POST",
        `/api/admin/featured-enterprises/${enterpriseId}/feature`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/featured-enterprises"] });
      queryClient.invalidateQueries({ queryKey: ["/api/enterprises"] });
    },
  });
}

export function useUnfeatureEnterprise() {
  return useMutation({
    mutationFn: async (enterpriseId: string) => {
      return await apiRequest(
        "DELETE",
        `/api/admin/featured-enterprises/${enterpriseId}/unfeature`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/featured-enterprises"] });
      queryClient.invalidateQueries({ queryKey: ["/api/enterprises"] });
    },
  });
}

export function useReorderFeaturedEnterprises() {
  return useMutation({
    mutationFn: async (items: { id: string; featuredOrder: number }[]) => {
      return await apiRequest(
        "PATCH",
        "/api/admin/featured-enterprises/reorder",
        { items }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/featured-enterprises"] });
      queryClient.invalidateQueries({ queryKey: ["/api/enterprises"] });
    },
  });
}
