import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getAuthenticatedClient, jsonResponse } from "../_shared/client.ts";

const parseNumber = (value: string | null, fallback: number) => {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

serve(async (req) => {
  const authResult = await getAuthenticatedClient(req);
  if (authResult instanceof Response) {
    return authResult;
  }

  const { supabase, user } = authResult;
  const url = new URL(req.url);
  const enterpriseIdFromPath =
    url.pathname.split("/functions/v1/favorites")[1]?.replace(/^\\/+/, "") ??
    "";
  const enterpriseId =
    url.searchParams.get("enterpriseId") || enterpriseIdFromPath || "";

  if (req.method === "GET") {
    const limit = parseNumber(url.searchParams.get("limit"), 50);
    const offset = parseNumber(url.searchParams.get("offset"), 0);

    const { data, error } = await supabase
      .from("user_favorites")
      .select(
        "id,user_id,enterprise_id,notes,created_at,enterprise:enterprises(*)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Failed to fetch favorites", error);
      return jsonResponse(
        { error: "Failed to fetch favorites", details: error.message },
        500,
      );
    }

    const mapped = (data || []).map((favorite) => ({
      id: favorite.id,
      userId: favorite.user_id,
      enterpriseId: favorite.enterprise_id,
      notes: favorite.notes,
      createdAt: favorite.created_at,
      enterprise: favorite.enterprise,
    }));

    return jsonResponse(mapped);
  }

  if (req.method === "POST") {
    const payload = await req.json().catch(() => ({}));
    const targetEnterpriseId = payload.enterpriseId as string | undefined;

    if (!targetEnterpriseId) {
      return jsonResponse(
        { error: "enterpriseId is required in request body" },
        400,
      );
    }

    const { data, error } = await supabase
      .from("user_favorites")
      .upsert({
        user_id: user.id,
        enterprise_id: targetEnterpriseId,
        notes: payload.notes ?? null,
      }, { onConflict: "user_id,enterprise_id" })
      .select()
      .single();

    if (error) {
      console.error("Failed to save favorite", error);
      return jsonResponse(
        { error: "Failed to save favorite", details: error.message },
        500,
      );
    }

    return jsonResponse({
      id: data.id,
      userId: data.user_id,
      enterpriseId: data.enterprise_id,
      notes: data.notes,
      createdAt: data.created_at,
    }, 201);
  }

  if (req.method === "DELETE") {
    if (!enterpriseId) {
      return jsonResponse(
        { error: "enterpriseId query param or path param is required" },
        400,
      );
    }

    const { error } = await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("enterprise_id", enterpriseId);

    if (error) {
      console.error("Failed to remove favorite", error);
      return jsonResponse(
        { error: "Failed to remove favorite", details: error.message },
        500,
      );
    }

    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
});
