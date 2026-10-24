
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

function buildDateQuery(filters = {}) {
  const params = new URLSearchParams();

  if (filters.start_date) {
    params.set("start_date", filters.start_date);
  }

  if (filters.end_date) {
    params.set("end_date", filters.end_date);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function getEggSales(filters = {}) {
  const result = await request(
    `/api/egg-sales${buildDateQuery(filters)}`
  );

  return Array.isArray(result.data) ? result.data : [];
}

export async function getEggSalesSummary(filters = {}) {
  const result = await request(
    `/api/egg-sales/summary${buildDateQuery(filters)}`
  );

  return result.data || {};
}

export async function createEggSale(saleData) {
  return request("/api/egg-sales", {
    method: "POST",
    body: JSON.stringify(saleData),
  });
}

export async function getEggSaleById(id) {
  const result = await request(
    `/api/egg-sales/${encodeURIComponent(id)}`
  );

  return result.data;
}
