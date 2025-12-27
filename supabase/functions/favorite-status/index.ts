import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getAuthenticatedClient, jsonResponse } from "../_shared/client.ts";

serve(async (req) => {
  const authResult = await getAuthenticatedClient(req);
  if (authResult instanceof Response) {
    return authResult;
  }

  const { supabase, user } = authResult;
  const url = new URL(req.url);
  const enterpriseId =
    url.searchParams.get("enterpriseId") ||
    url.pathname
      .split("/functions/v1/favorite-status")[1]
      ?.replace(/^\\/+/, "") ||
    "";

  if (!enterpriseId) {
    return jsonResponse(
      { error: "enterpriseId is required as query or path parameter" },
      400,
    );
  }

  const { data, error } = await supabase
    .from("user_favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("enterprise_id", enterpriseId)
    .maybeSingle();

  if (error) {
    console.error("Failed to check favorite status", error);
    return jsonResponse(
      { error: "Failed to check favorite status", details: error.message },
      500,
    );
  }

  return jsonResponse({ isFavorited: !!data });
});
