import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getAuthenticatedClient, jsonResponse } from "../_shared/client.ts";

serve(async (req) => {
  const authResult = await getAuthenticatedClient(req);
  if (authResult instanceof Response) {
    return authResult;
  }

  const { supabase, user } = authResult;

  const { data: favorites, error } = await supabase
    .from("user_favorites")
    .select("enterprise_id, enterprises(category)")
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to build favorites stats", error);
    return jsonResponse(
      { error: "Failed to load favorites stats", details: error.message },
      500,
    );
  }

  const byCategory: Record<string, number> = {};
  (favorites || []).forEach((fav) => {
    // deno-lint-ignore no-explicit-any
    const category = (fav as any).enterprises?.category as string | undefined;
    if (!category) return;
    byCategory[category] = (byCategory[category] || 0) + 1;
  });

  return jsonResponse({
    total: favorites?.length || 0,
    byCategory,
  });
});
