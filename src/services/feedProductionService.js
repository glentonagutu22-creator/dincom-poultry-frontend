
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "https://poultry-management-z9j1.onrender.com"
).replace(/\/+$/, "");

async function request(endpoint, options = {}) {
  const token = sessionStorage.getItem("dincom_token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Unable to connect to the server. Check your internet connection and try again."
    );
  }

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Something went wrong.");
  }

  return result;
}

export async function getFeedProductionBatches() {
  const result = await request("/api/feed-production");
  const batches = result.data?.batches ?? result.batches ?? [];

  if (!Array.isArray(batches)) {
    throw new Error("Invalid feed production response from the server.");
  }

  return batches;
}

export async function getFeedProductionBatchById(id) {
  if (!id) {
    throw new Error("A production batch ID is required.");
  }

  const result = await request(
    `/api/feed-production/${encodeURIComponent(id)}`
  );

  return result.data?.batch ?? result.batch;
}

export async function createFeedProductionBatch(batchData) {
  const result = await request("/api/feed-production", {
    method: "POST",
    body: JSON.stringify(batchData),
  });

  return result.data;
}
