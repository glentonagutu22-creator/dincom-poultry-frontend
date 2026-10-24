
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

function buildQuery(filters = {}) {
  const params = new URLSearchParams();

  if (filters.start_date) params.set("start_date", filters.start_date);
  if (filters.end_date) params.set("end_date", filters.end_date);
  if (filters.category) params.set("category", filters.category);
  if (filters.flock_id) params.set("flock_id", filters.flock_id);

  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function getExpenses(filters = {}) {
  const result = await request(
    `/api/expenses${buildQuery(filters)}`
  );

  return Array.isArray(result.data) ? result.data : [];
}

export async function getExpenseSummary(startDate, endDate) {
  if (!startDate || !endDate) {
    throw new Error("Select both a start date and an end date.");
  }

  const query = buildQuery({
    start_date: startDate,
    end_date: endDate,
  });

  const result = await request(`/api/expenses/summary${query}`);

  return result.data || {};
}

export async function createExpense(expenseData) {
  return request("/api/expenses", {
    method: "POST",
    body: JSON.stringify(expenseData),
  });
}

export async function updateExpense(id, expenseData) {
  return request(`/api/expenses/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(expenseData),
  });
}

export async function deleteExpense(id) {
  return request(`/api/expenses/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function getExpenseById(id) {
  const result = await request(
    `/api/expenses/${encodeURIComponent(id)}`
  );

  return result.data;
}
