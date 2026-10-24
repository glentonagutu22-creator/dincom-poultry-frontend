
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

// GET /api/raw-materials
export async function getRawMaterials() {
  const result = await request("/api/raw-materials");
  const materials =
    result.data?.materials ?? result.materials ?? result.data;

  if (!Array.isArray(materials)) {
    throw new Error(
      "The server returned an unexpected raw materials response."
    );
  }

  return materials;
}

// GET /api/raw-materials/:id
export function getRawMaterialById(id) {
  return request(`/api/raw-materials/${encodeURIComponent(id)}`);
}

// POST /api/raw-materials
export function createRawMaterial(materialData) {
  return request("/api/raw-materials", {
    method: "POST",
    body: JSON.stringify(materialData),
  });
}

// GET /api/raw-materials/:id/stock
export async function getRawMaterialStockSummary(id) {
  const result = await request(
    `/api/raw-materials/${encodeURIComponent(id)}/stock`
  );

  const summary = result.data?.summary ?? result.summary;

  if (!summary) {
    throw new Error(
      "The server returned an unexpected stock summary response."
    );
  }

  return summary;
}

// GET /api/raw-materials/purchases
// Optionally filter by raw material ID.
export async function getRawMaterialPurchases(rawMaterialId = "") {
  const query = rawMaterialId
    ? `?raw_material_id=${encodeURIComponent(rawMaterialId)}`
    : "";

  const result = await request(
    `/api/raw-materials/purchases${query}`
  );

  const purchases =
    result.data?.purchases ?? result.purchases ?? result.data;

  if (!Array.isArray(purchases)) {
    throw new Error(
      "The server returned an unexpected purchases response."
    );
  }

  return purchases;
}

// POST /api/raw-materials/purchases
export function createRawMaterialPurchase(purchaseData) {
  return request("/api/raw-materials/purchases", {
    method: "POST",
    body: JSON.stringify(purchaseData),
  });
}
