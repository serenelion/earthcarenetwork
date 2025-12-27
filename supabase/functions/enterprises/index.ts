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

  const { supabase } = authResult;
  const url = new URL(req.url);
  const relativePath =
    url.pathname.split("/functions/v1/enterprises")[1]?.replace(/^\\/+/, "") ??
    "";

  // Currently only list endpoint is supported
  if (relativePath) {
    return jsonResponse({ error: "Not found" }, 404);
  }

  const category = url.searchParams.get("category");
  const search = url.searchParams.get("search");
  const limit = parseNumber(url.searchParams.get("limit"), 50);
  const offset = parseNumber(url.searchParams.get("offset"), 0);

  let query = supabase
    .from("enterprises")
    .select("*")
    .order("featured_order", { ascending: true })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.eq("category", category);
  }

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,description.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch enterprises", error);
    return jsonResponse(
      { error: "Failed to fetch enterprises", details: error.message },
      500,
    );
  }

  return jsonResponse(data ?? []);
});
