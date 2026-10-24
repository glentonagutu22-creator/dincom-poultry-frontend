
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "https://poultry-management-z9j1.onrender.com"
).replace(/\/+$/, "");

async function request(endpoint, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
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

export function registerUser({ full_name, email, password }) {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      full_name,
      email,
      password,
    }),
  });
}

export function loginUser({ email, password }) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export function getCurrentUser(token) {
  return request("/api/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
