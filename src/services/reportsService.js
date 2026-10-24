
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "https://poultry-management-z9j1.onrender.com"
).replace(/\/+$/, "");

function getAuthHeaders() {
  const token = sessionStorage.getItem("dincom_token");

  if (!token) {
    throw new Error("Your session has expired. Please log in again.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function parseJsonResponse(response) {
  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || result.error || `Request failed (${response.status}).`
    );
  }

  return result;
}

function buildQueryParams(filters = {}) {
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

export async function getReportSummary(filters = {}) {
  const response = await fetch(
    `${API_BASE_URL}/api/reports/summary${buildQueryParams(filters)}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  const result = await parseJsonResponse(response);
  return result.data;
}

export async function getDailyReport(filters = {}) {
  const response = await fetch(
    `${API_BASE_URL}/api/reports/daily${buildQueryParams(filters)}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  const result = await parseJsonResponse(response);
  return Array.isArray(result.data) ? result.data : [];
}

export async function downloadFarmReportPdf(filters = {}) {
  const response = await fetch(
    `${API_BASE_URL}/api/reports/pdf${buildQueryParams(filters)}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    let message = "Failed to download the farm report.";

    try {
      const result = await response.json();
      message = result.message || result.error || message;
    } catch {
      // Keep the fallback error message.
    }

    throw new Error(message);
  }

  return response.blob();
}
