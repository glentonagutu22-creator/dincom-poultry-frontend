
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "https://poultry-management-z9j1.onrender.com"
).replace(/\/+$/, "");

async function request(endpoint, options = {}) {
  const token = sessionStorage.getItem("dincom_token");

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || `Request failed with status ${response.status}.`
    );
  }

  return result;
}

export async function getFeedConsumption() {
  const result = await request("/api/feed-consumption");
  return Array.isArray(result.data?.records) ? result.data.records : [];
}

export async function getFeedConsumptionByFlock(flockId) {
  const result = await request(
    `/api/feed-consumption/flock/${encodeURIComponent(flockId)}`
  );

  return Array.isArray(result.data?.records) ? result.data.records : [];
}

export async function getFeedConsumptionById(id) {
  const result = await request(
    `/api/feed-consumption/${encodeURIComponent(id)}`
  );

  return result.data?.record ?? null;
}

export async function createFeedConsumption(payload) {
  const result = await request("/api/feed-consumption", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return result.data;
}
