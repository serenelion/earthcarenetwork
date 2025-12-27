import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getAuthenticatedClient, jsonResponse } from "../_shared/client.ts";

serve(async (req) => {
  const authResult = await getAuthenticatedClient(req);
  if (authResult instanceof Response) {
    return authResult;
  }

  const { supabase, user } = authResult;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Failed to load user profile", error);
    return jsonResponse(
      { error: "Failed to fetch user", details: error.message },
      500,
    );
  }

  return jsonResponse(data);
});
