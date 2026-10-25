
import { useCallback, useEffect, useState } from "react";
import {
  Wallet,
  Plus,
  Search,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  Receipt,
  TrendingDown,
  Sprout,
  Layers3,
  Pencil,
  Trash2,
  Filter,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout/DashboardLayout";
import {
  getExpenses,
  getExpenseSummary,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../services/expenseService";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const CATEGORIES = [
  { value: "labour", label: "Labour" },
  { value: "veterinary", label: "Veterinary" },
  { value: "medicine", label: "Medicine" },
  { value: "vaccines", label: "Vaccines" },
  { value: "transport", label: "Transport" },
  { value: "electricity", label: "Electricity" },
  { value: "water", label: "Water" },
  { value: "repairs", label: "Repairs" },
  { value: "equipment", label: "Equipment" },
  { value: "packaging", label: "Packaging" },
  { value: "other", label: "Other" },
];

const CATEGORY_LABELS = Object.fromEntries(
  CATEGORIES.map(({ value, label }) => [value, label])
);

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonthStart() {
  const date = new Date();

  return getLocalDateForDate(
    new Date(date.getFullYear(), date.getMonth(), 1)
  );
}

function getLocalDateForDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createInitialFilters() {
  return {
    start_date: getMonthStart(),
    end_date: getLocalDate(),
    category: "all",
  };
}

function createInitialForm() {
  return {
    category: "other",
    amount: "",
    expense_date: getLocalDate(),
    description: "",
  };
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-[#1b1b1b] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/15";

const cardClass =
  "rounded-xl border border-white/15 bg-[#111111]/75 p-4 text-white shadow-lg backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-[#111111]/80 sm:p-5";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatMoney(value) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "—";

  const dateString = String(value).slice(0, 10);
  const [year, month, day] = dateString.split("-");

  if (!year || !month || !day) return dateString;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  ).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* -------------------------------------------------------------------------- */
/* Expenses page                                                              */
/* -------------------------------------------------------------------------- */

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(createInitialFilters);
  const [appliedFilters, setAppliedFilters] = useState(createInitialFilters);

  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [form, setForm] = useState(createInitialForm);

  /* ------------------------------------------------------------------------ */
  /* Load expenses and summary                                                */
  /* ------------------------------------------------------------------------ */

  const loadExpenses = useCallback(
    async (showRefresh = false, selectedFilters = appliedFilters) => {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const apiFilters = {
          start_date: selectedFilters.start_date,
          end_date: selectedFilters.end_date,
          ...(selectedFilters.category !== "all"
            ? { category: selectedFilters.category }
            : {}),
        };

        const [expenseData, summaryData] = await Promise.all([
          getExpenses(apiFilters),
          getExpenseSummary(
            selectedFilters.start_date,
            selectedFilters.end_date
          ),
        ]);

        setExpenses(expenseData);
        setSummary(summaryData);
      } catch (err) {
        setError(err.message || "Unable to load expenses.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [appliedFilters]
  );

  useEffect(() => {
    loadExpenses(false, appliedFilters);
  }, [loadExpenses, appliedFilters]);

  /* ------------------------------------------------------------------------ */
  /* Search                                                                   */
  /* ------------------------------------------------------------------------ */

  const filteredExpenses = expenses.filter((expense) => {
    const searchTerm = search.trim().toLowerCase();

    return (
      !searchTerm ||
      [
        expense.category,
        expense.description,
        expense.flock_name,
        expense.id,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(searchTerm)
      )
    );
  });

  /* ------------------------------------------------------------------------ */
  /* Summary calculations                                                     */
  /* ------------------------------------------------------------------------ */

  const totalExpenses = Number(summary.total_expenses) || 0;
  const recordCount = Number(summary.records_count) || 0;
  const flockSpecificExpenses =
    Number(summary.flock_specific_expenses) || 0;
  const generalFarmExpenses =
    Number(summary.general_farm_expenses) || 0;

  /* ------------------------------------------------------------------------ */
  /* Filters                                                                  */
  /* ------------------------------------------------------------------------ */

  const updateFilter = (event) => {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleApplyFilters = (event) => {
    event.preventDefault();

    setError("");
    setNotice("");

    if (!filters.start_date || !filters.end_date) {
      setError("Please select both the start date and end date.");
      return;
    }

    if (filters.start_date > filters.end_date) {
      setError("The start date cannot be later than the end date.");
      return;
    }

    if (filters.end_date > getLocalDate()) {
      setError("The end date cannot be in the future.");
      return;
    }

    setAppliedFilters({ ...filters });
  };

  const handleResetFilters = () => {
    const initialFilters = createInitialFilters();

    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setSearch("");
    setError("");
    setNotice("");
  };

  /* ------------------------------------------------------------------------ */
  /* Form                                                                     */
  /* ------------------------------------------------------------------------ */

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const openCreateForm = () => {
    setEditingExpense(null);
    setForm(createInitialForm());
    setFormError("");
    setError("");
    setNotice("");
    setShowForm(true);
  };

  const openEditForm = (expense) => {
    setEditingExpense(expense);

    setForm({
      category: expense.category || "other",
      amount: expense.amount ?? "",
      expense_date: expense.expense_date
        ? String(expense.expense_date).slice(0, 10)
        : getLocalDate(),
      description: expense.description || "",
    });

    setFormError("");
    setError("");
    setNotice("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingExpense(null);
    setForm(createInitialForm());
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setError("");
    setNotice("");

    const amount = Number(form.amount);

    if (!CATEGORIES.some((category) => category.value === form.category)) {
      setFormError("Please select a valid expense category.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Expense amount must be greater than zero.");
      return;
    }

    if (form.expense_date && form.expense_date > getLocalDate()) {
      setFormError("Expense date cannot be in the future.");
      return;
    }

    const payload = {
      category: form.category,
      amount,
      expense_date: form.expense_date || null,
      description: form.description.trim() || null,
    };

    setSaving(true);

    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, payload);
        setNotice("Expense updated successfully.");
      } else {
        await createExpense(payload);
        setNotice("Expense recorded successfully.");
      }

      setShowForm(false);
      setEditingExpense(null);
      setForm(createInitialForm());

      await loadExpenses(false, appliedFilters);
    } catch (err) {
      setFormError(err.message || "Unable to save expense.");
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Delete                                                                   */
  /* ------------------------------------------------------------------------ */

  const handleDelete = async (expense) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this expense of ${formatMoney(
        expense.amount
      )}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(expense.id);
    setError("");
    setNotice("");

    try {
      await deleteExpense(expense.id);

      setNotice("Expense deleted successfully.");

      await loadExpenses(false, appliedFilters);
    } catch (err) {
      setError(err.message || "Unable to delete expense.");
    } finally {
      setDeletingId(null);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
   <DashboardLayout background="feedProduction">
      <div className="space-y-6">
        {/* Page heading */}
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-[11px] font-extrabold tracking-[1.5px] text-orange-400">
              FARM MANAGEMENT
            </p>

            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Expenses
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
              Record farm expenditure, monitor operating costs, and keep track
              of where your money goes.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-400 sm:self-auto"
          >
            <Plus size={18} />
            Record Expense
          </button>
        </section>

        {/* Success notification */}
        {notice && (
          <div className="flex items-start gap-2 rounded-lg border border-green-400/20 bg-green-500/10 p-3 text-sm text-green-200">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />

            <p className="flex-1">{notice}</p>

            <button
              type="button"
              onClick={() => setNotice("")}
              className="ml-auto"
              aria-label="Dismiss notification"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />

            <p className="flex-1">{error}</p>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Summary cards: same design and two-column layout as Flocks */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4">
          <SummaryCard
            label="Total expenses"
            value={formatMoney(totalExpenses)}
            icon={Wallet}
          />

          <SummaryCard
            label="Expense records"
            value={recordCount.toLocaleString("en-KE")}
            icon={Receipt}
          />

          <SummaryCard
            label="Flock-specific expenses"
            value={formatMoney(flockSpecificExpenses)}
            icon={Sprout}
          />

          <SummaryCard
            label="General farm expenses"
            value={formatMoney(generalFarmExpenses)}
            icon={Layers3}
          />
        </section>

        {/* Expense filters */}
        <section className="rounded-xl border border-white/15 bg-[#111111]/75 p-4 text-white shadow-lg backdrop-blur-sm sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Filter size={17} className="text-orange-400" />

            <h3 className="font-bold text-white">Filter expenses</h3>
          </div>

          <form
            onSubmit={handleApplyFilters}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            <div>
              <label
                htmlFor="expense-start-date"
                className="mb-1.5 block text-xs font-semibold text-white/80"
              >
                Start date
              </label>

              <input
                id="expense-start-date"
                type="date"
                name="start_date"
                value={filters.start_date}
                max={filters.end_date || getLocalDate()}
                onChange={updateFilter}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="expense-end-date"
                className="mb-1.5 block text-xs font-semibold text-white/80"
              >
                End date
              </label>

              <input
                id="expense-end-date"
                type="date"
                name="end_date"
                value={filters.end_date}
                min={filters.start_date || undefined}
                max={getLocalDate()}
                onChange={updateFilter}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="expense-category-filter"
                className="mb-1.5 block text-xs font-semibold text-white/80"
              >
                Category
              </label>

              <select
                id="expense-category-filter"
                name="category"
                value={filters.category}
                onChange={updateFilter}
                className={inputClass}
              >
                <option value="all">All categories</option>

                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-400"
              >
                <Filter size={16} />
                Apply
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/15 px-3 text-sm text-white/85 transition hover:bg-white/10"
                title="Reset filters"
                aria-label="Reset filters"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </form>

          <p className="mt-3 text-xs text-white/50">
            Summary totals use the selected date range. Category filtering
            applies to the expense records below.
          </p>
        </section>

        {/* Expenses table */}
        <section className="overflow-hidden rounded-xl border border-white/15 bg-[#111111]/75 text-white shadow-lg backdrop-blur-sm">
          <div className="flex flex-col gap-4 border-b border-white/15 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h3 className="font-bold text-white">All expenses</h3>

              <p className="mt-1 text-xs text-white/60">
                {filteredExpenses.length}{" "}
                {filteredExpenses.length === 1 ? "expense" : "expenses"}{" "}
                displayed
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search expenses..."
                  aria-label="Search expenses"
                  className={`${inputClass} pl-9 sm:w-56`}
                />
              </div>

              <button
                type="button"
                onClick={() => loadExpenses(true, appliedFilters)}
                disabled={refreshing || loading}
                title="Refresh expenses"
                aria-label="Refresh expenses"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/15 px-3 text-sm text-white/85 transition hover:bg-white/10 disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />

                <span className="sm:hidden">Refresh</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-black/20 text-xs uppercase tracking-wide text-white/60">
                <tr>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Category</th>
                  <th className="px-5 py-4 font-semibold">Description</th>
                  <th className="px-5 py-4 font-semibold">Flock</th>
                  <th className="px-5 py-4 font-semibold">Amount</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <RefreshCw
                        size={22}
                        className="mx-auto animate-spin text-orange-400"
                      />

                      <p className="mt-3 text-sm text-white/70">
                        Loading expenses...
                      </p>
                    </td>
                  </tr>
                ) : error && expenses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-white/70"
                    >
                      Unable to load expenses. Check the error above and try
                      refreshing.
                    </td>
                  </tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <Receipt
                        size={30}
                        className="mx-auto text-white/40"
                      />

                      <p className="mt-3 font-semibold text-white">
                        No expenses found
                      </p>

                      <p className="mt-1 text-xs text-white/60">
                        Try another search or filter, or record your first
                        expense.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="transition-colors hover:bg-black/20"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-white/75">
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays
                            size={15}
                            className="text-white/50"
                          />

                          {formatDate(expense.expense_date)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-300">
                          {CATEGORY_LABELS[expense.category] ||
                            expense.category}
                        </span>
                      </td>

                      <td className="max-w-xs px-5 py-4 text-white/80">
                        <span className="block truncate">
                          {expense.description || "No description"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-white/70">
                        {expense.flock_name || "General farm"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-bold tabular-nums text-white">
                        {formatMoney(expense.amount)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(expense)}
                            aria-label="Edit expense"
                            title="Edit expense"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-2 text-xs font-semibold text-white/80 transition hover:border-orange-400/30 hover:bg-orange-500/10 hover:text-orange-300"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(expense)}
                            disabled={deletingId === expense.id}
                            aria-label="Delete expense"
                            title="Delete expense"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-2 text-xs font-semibold text-white/80 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                          >
                            <Trash2 size={14} />

                            {deletingId === expense.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Create / Edit expense modal */}
        {showForm && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                !saving
              ) {
                closeForm();
              }
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="expense-form-title"
              className="my-auto w-full max-w-lg rounded-2xl border border-white/10 bg-[#111111] text-white shadow-2xl"
            >
              <header className="flex items-center justify-between border-b border-white/10 p-5">
                <div>
                  <h3
                    id="expense-form-title"
                    className="text-lg font-bold text-white"
                  >
                    {editingExpense ? "Edit expense" : "Record new expense"}
                  </h3>

                  <p className="mt-1 text-xs text-white/60">
                    Enter the details of the farm expenditure.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  aria-label="Close form"
                  className="grid size-9 place-items-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </header>

              <form onSubmit={handleSubmit} className="space-y-4 p-5">
                {formError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200"
                  >
                    {formError}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="expense-category"
                    className="mb-1.5 block text-xs font-semibold text-white/80"
                  >
                    Expense category
                  </label>

                  <select
                    id="expense-category"
                    name="category"
                    value={form.category}
                    onChange={updateField}
                    required
                    className={inputClass}
                  >
                    {CATEGORIES.map((category) => (
                      <option
                        key={category.value}
                        value={category.value}
                      >
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="expense-amount"
                    className="mb-1.5 block text-xs font-semibold text-white/80"
                  >
                    Amount (KES)
                  </label>

                  <input
                    id="expense-amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    value={form.amount}
                    onChange={updateField}
                    placeholder="e.g. 2500.00"
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="expense-date"
                    className="mb-1.5 block text-xs font-semibold text-white/80"
                  >
                    Expense date
                  </label>

                  <input
                    id="expense-date"
                    name="expense_date"
                    type="date"
                    value={form.expense_date}
                    max={getLocalDate()}
                    onChange={updateField}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="expense-description"
                    className="mb-1.5 block text-xs font-semibold text-white/80"
                  >
                    Description
                  </label>

                  <textarea
                    id="expense-description"
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    rows={3}
                    maxLength={5000}
                    placeholder="e.g. Purchased vaccines for the farm"
                    className={`${inputClass} resize-y`}
                  />
                </div>

                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs leading-5 text-white/60">
                  Flock assignment is not included in this form because the
                  current backend does not expose a flock-list endpoint.
                  These expenses will be recorded as general farm costs.
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/5 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving && (
                      <RefreshCw size={16} className="animate-spin" />
                    )}

                    {saving
                      ? "Saving..."
                      : editingExpense
                        ? "Save changes"
                        : "Record expense"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/* -------------------------------------------------------------------------- */
/* Summary card: matches Flocks.jsx                                           */
/* -------------------------------------------------------------------------- */

function SummaryCard({ label, value, icon: Icon }) {
  return (
    <article className={cardClass}>
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-xs text-white/75 sm:text-sm">
          {label}
        </p>

        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-orange-400 sm:size-10">
          <Icon size={21} />
        </div>
      </div>

      <p className="mt-3 break-words text-2xl font-extrabold tabular-nums sm:mt-4 sm:text-3xl">
        {value}
      </p>
    </article>
  );
}

export default Expenses;
