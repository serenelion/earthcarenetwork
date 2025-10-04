import type { Enterprise } from "@shared/schema";

export interface MurmurationsProfile {
  linked_schemas: string[];
  name: string;
  primary_url: string;
  description?: string;
  latitude?: number | null;
  longitude?: number | null;
  tags?: string[];
  image?: string;
  category?: string;
}

interface MurmurationsIndexResponse {
  data?: {
    node_id: string;
  };
  errors?: Array<{ detail: string }>;
}

const MURMURATIONS_TEST_INDEX_URL = "https://test-index.murmurations.network/v2";

const categoryLabels: Record<string, string> = {
  land_projects: "Land Projects",
  capital_sources: "Capital Sources",
  open_source_tools: "Open Source Tools",
  network_organizers: "Network Organizers",
};

function parseCoordinates(location: string | null): { latitude: number | null; longitude: number | null } {
  if (!location) {
    return { latitude: null, longitude: null };
  }

  const coordRegex = /(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/;
  const match = location.match(coordRegex);

  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { latitude: lat, longitude: lng };
    }
  }

  return { latitude: null, longitude: null };
}

export function generateMurmurationsProfile(enterprise: Enterprise): MurmurationsProfile {
  const instanceUrl = process.env.REPL_SLUG 
    ? `https://${process.env.REPL_ID}.${process.env.REPL_SLUG}.repl.co`
    : "https://localhost:5000";

  const { latitude, longitude } = parseCoordinates(enterprise.location);

  const profile: MurmurationsProfile = {
    linked_schemas: ["organizations_schema-v1.0.0"],
    name: enterprise.name,
    primary_url: enterprise.website || `${instanceUrl}/enterprises/${enterprise.id}`,
  };

  if (enterprise.description) {
    profile.description = enterprise.description;
  }

  if (latitude !== null && longitude !== null) {
    profile.latitude = latitude;
    profile.longitude = longitude;
  }

  if (enterprise.tags && enterprise.tags.length > 0) {
    profile.tags = enterprise.tags;
  }

  if (enterprise.imageUrl) {
    profile.image = enterprise.imageUrl;
  }

  if (enterprise.category) {
    profile.category = categoryLabels[enterprise.category] || enterprise.category;
  }

  return profile;
}

export function validateMurmurationsProfile(profile: any): boolean {
  if (!profile || typeof profile !== "object") {
    return false;
  }

  if (!Array.isArray(profile.linked_schemas) || profile.linked_schemas.length === 0) {
    return false;
  }

  if (!profile.name || typeof profile.name !== "string" || profile.name.trim().length === 0) {
    return false;
  }

  if (!profile.primary_url || typeof profile.primary_url !== "string" || profile.primary_url.trim().length === 0) {
    return false;
  }

  try {
    new URL(profile.primary_url);
  } catch {
    return false;
  }

  return true;
}

export async function submitToMurmurationsIndex(
  enterprise: Enterprise,
  profileUrl: string
): Promise<{ nodeId: string | null; success: boolean }> {
  try {
    const response = await fetch(`${MURMURATIONS_TEST_INDEX_URL}/nodes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        profile_url: profileUrl,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to submit to Murmurations Index: ${response.status} ${response.statusText}`, errorText);
      return { nodeId: null, success: false };
    }

    const data: MurmurationsIndexResponse = await response.json();

    if (data.errors && data.errors.length > 0) {
      console.error("Murmurations Index returned errors:", data.errors);
      return { nodeId: null, success: false };
    }

    if (data.data?.node_id) {
      return { nodeId: data.data.node_id, success: true };
    }

    console.error("Murmurations Index response missing node_id");
    return { nodeId: null, success: false };
  } catch (error) {
    console.error("Error submitting to Murmurations Index:", error);
    return { nodeId: null, success: false };
  }
}

export async function deleteFromMurmurationsIndex(nodeId: string): Promise<boolean> {
  try {
    const response = await fetch(`${MURMURATIONS_TEST_INDEX_URL}/nodes/${nodeId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to delete from Murmurations Index: ${response.status} ${response.statusText}`, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting from Murmurations Index:", error);
    return false;
  }
}
