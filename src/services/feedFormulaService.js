
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

export async function getFeedFormulas() {
  const result = await request("/api/feed-formulas");
  const formulas = result.data?.formulas ?? result.formulas ?? [];

  if (!Array.isArray(formulas)) {
    throw new Error("Invalid feed formulas response from the server.");
  }

  return formulas;
}

export async function getFeedFormulaById(id) {
  if (!id) {
    throw new Error("A formula ID is required.");
  }

  const result = await request(
    `/api/feed-formulas/${encodeURIComponent(id)}`
  );

  return result.data?.formula ?? result.formula;
}

export async function createFeedFormula(formulaData) {
  const result = await request("/api/feed-formulas", {
    method: "POST",
    body: JSON.stringify(formulaData),
  });

  return result.data?.formula ?? result.formula;
}
