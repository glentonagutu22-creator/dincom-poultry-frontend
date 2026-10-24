
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "https://poultry-management-z9j1.onrender.com"
).replace(/\/+$/, "");

async function request(endpoint) {
  const token = sessionStorage.getItem("dincom_token");

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

export async function getInventoryOverview() {
  const result = await request("/api/inventory");
  return result.data;
}

export async function getRawMaterialInventory() {
  const result = await request("/api/inventory/raw-materials");
  return Array.isArray(result.data) ? result.data : [];
}

export async function getFinishedFeedInventory() {
  const result = await request("/api/inventory/finished-feed");
  return Array.isArray(result.data) ? result.data : [];
}
