
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

export async function getFlocks() {
  const result = await request("/api/flocks");
  const flocks = result.data?.flocks ?? result.flocks ?? result.data;

  if (!Array.isArray(flocks)) {
    throw new Error("The server returned an unexpected flocks response.");
  }

  return flocks;
}

export function getFlockById(id) {
  return request(`/api/flocks/${id}`);
}

export function createFlock(flockData) {
  return request("/api/flocks", {
    method: "POST",
    body: JSON.stringify(flockData),
  });
}

export function updateFlock(id, flockData) {
  return request(`/api/flocks/${id}`, {
    method: "PUT",
    body: JSON.stringify(flockData),
  });
}

export function closeFlock(id) {
  return request(`/api/flocks/${id}/close`, {
    method: "PATCH",
  });
}
