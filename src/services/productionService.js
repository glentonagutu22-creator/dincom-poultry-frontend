
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "https://poultry-management-z9j1.onrender.com"
).replace(/\/+$/, "");

async function request(endpoint, options = {}) {
  const token = sessionStorage.getItem("dincom_token");

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Unable to reach the server. Check your internet connection and try again."
    );
  }

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      response.ok
        ? "The server returned an invalid response."
        : `The server returned an error (${response.status}).`
    );
  }

  if (!response.ok || result?.success === false) {
    throw new Error(
      result?.message ||
        result?.error ||
        `Request failed with status ${response.status}.`
    );
  }

  return result;
}

export async function getProduction() {
  const result = await request("/api/production");
  const records = result.data?.production;

  if (!Array.isArray(records)) {
    throw new Error("The server returned an unexpected production response.");
  }

  return records;
}

export async function getProductionByFlock(flockId) {
  const result = await request(
    `/api/production/flock/${encodeURIComponent(flockId)}`
  );

  return result.data?.production ?? [];
}

export async function createProduction(productionData) {
  const result = await request("/api/production", {
    method: "POST",
    body: JSON.stringify(productionData),
  });

  return result.data?.production;
}

export async function getDailySummary(date) {
  const params = new URLSearchParams({ date });
  const result = await request(`/api/production/summary?${params}`);

  return result.data?.summary;
}

export async function getProductionSummaryByRange(startDate, endDate) {
  const params = new URLSearchParams({ startDate, endDate });
  const result = await request(
    `/api/production/summary/range?${params}`
  );

  return result.data?.summary;
}
