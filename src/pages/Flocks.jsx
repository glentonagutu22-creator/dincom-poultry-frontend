
import { useCallback, useEffect, useState } from "react";
import {
  Bird,
  Plus,
  Search,
  RefreshCw,
  X,
  CircleStop,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  Hash,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout/DashboardLayout";
import {
  getFlocks,
  createFlock,
  closeFlock,
} from "../services/flockService";

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const initialForm = {
  name: "",
  breed: "",
  bird_type: "layer",
  initial_quantity: "",
  acquisition_date: getLocalDate(),
};

const inputClass =
  "w-full rounded-lg border border-white/10 bg-[#1b1b1b] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/15";

const cardClass =
  "rounded-xl border border-white/15 bg-[#111111]/75 p-4 text-white shadow-lg backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-[#111111]/80 sm:p-5";

function Flocks() {
  const [flocks, setFlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [closingId, setClosingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const loadFlocks = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const data = await getFlocks();
      setFlocks(data);
    } catch (err) {
      setError(err.message || "Unable to load flocks.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFlocks();
  }, [loadFlocks]);

  const filteredFlocks = flocks.filter((flock) => {
    const searchTerm = search.trim().toLowerCase();

    const matchesSearch =
      !searchTerm ||
      [flock.name, flock.breed, flock.bird_type].some((value) =>
        String(value ?? "").toLowerCase().includes(searchTerm)
      );

    const matchesStatus =
      statusFilter === "all" ||
      String(flock.status ?? "").toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = flocks.filter(
    (flock) => String(flock.status).toLowerCase() === "active"
  ).length;

  const totalBirds = flocks.reduce(
    (total, flock) => total + (Number(flock.current_quantity) || 0),
    0
  );

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setFormError("");
    setNotice("");

    const quantity = Number(form.initial_quantity);

    if (!form.name.trim()) {
      setFormError("Please enter a flock name.");
      return;
    }

    if (!form.breed.trim()) {
      setFormError("Please enter the bird breed.");
      return;
    }

    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      setFormError("Initial quantity must be a positive whole number.");
      return;
    }

    if (!form.acquisition_date) {
      setFormError("Please select the acquisition date.");
      return;
    }

    setSaving(true);

    try {
      await createFlock({
        name: form.name.trim(),
        breed: form.breed.trim(),
        bird_type: form.bird_type,
        initial_quantity: quantity,
        acquisition_date: form.acquisition_date,
      });

      setForm({
        ...initialForm,
        acquisition_date: getLocalDate(),
      });

      setShowForm(false);
      setNotice("Flock created successfully.");

      await loadFlocks();
    } catch (err) {
      setFormError(err.message || "Unable to create flock.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (flock) => {
    const confirmed = window.confirm(
      `Are you sure you want to close "${flock.name}"?`
    );

    if (!confirmed) return;

    setClosingId(flock.id);
    setError("");
    setNotice("");

    try {
      await closeFlock(flock.id);
      setNotice(`"${flock.name}" has been closed.`);
      await loadFlocks();
    } catch (err) {
      setError(err.message || "Unable to close flock.");
    } finally {
      setClosingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page heading */}
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-[11px] font-extrabold tracking-[1.5px] text-orange-400">
              FARM MANAGEMENT
            </p>

            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Flocks
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
              Manage your bird batches, monitor flock populations, and track
              acquisition details.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setFormError("");
              setNotice("");
              setForm({
                ...initialForm,
                acquisition_date: getLocalDate(),
              });
              setShowForm(true);
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-400 sm:self-auto"
          >
            <Plus size={18} />
            New Flock
          </button>
        </section>

        {/* Notifications */}
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

        {/* Summary cards: two columns with translucent backgrounds */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4">
          <SummaryCard
            label="Total flocks"
            value={flocks.length}
            icon={Bird}
          />

          <SummaryCard
            label="Active flocks"
            value={activeCount}
            icon={CheckCircle2}
          />

          <SummaryCard
            label="Current bird population"
            value={totalBirds.toLocaleString()}
            icon={Hash}
          />
        </section>

        {/* Flocks table */}
        <section className="overflow-hidden rounded-xl border border-white/15 bg-[#111111]/75 text-white shadow-lg backdrop-blur-sm">
          <div className="flex flex-col gap-4 border-b border-white/15 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h3 className="font-bold text-white">All flocks</h3>
              <p className="mt-1 text-xs text-white/60">
                {filteredFlocks.length}{" "}
                {filteredFlocks.length === 1 ? "flock" : "flocks"} displayed
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
                  placeholder="Search flocks..."
                  aria-label="Search flocks"
                  className={`${inputClass} pl-9 sm:w-56`}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by flock status"
                className={inputClass}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>

              <button
                type="button"
                onClick={() => loadFlocks(true)}
                disabled={refreshing || loading}
                title="Refresh flocks"
                aria-label="Refresh flocks"
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
                  <th className="px-5 py-4 font-semibold">Flock</th>
                  <th className="px-5 py-4 font-semibold">Bird type</th>
                  <th className="px-5 py-4 font-semibold">Initial quantity</th>
                  <th className="px-5 py-4 font-semibold">Current birds</th>
                  <th className="px-5 py-4 font-semibold">Acquisition date</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <RefreshCw
                        size={22}
                        className="mx-auto animate-spin text-orange-400"
                      />
                      <p className="mt-3 text-sm text-white/70">
                        Loading flocks...
                      </p>
                    </td>
                  </tr>
                ) : error && flocks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-white/70"
                    >
                      Unable to load your flocks. Check the error above and
                      try refreshing.
                    </td>
                  </tr>
                ) : filteredFlocks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <Bird size={30} className="mx-auto text-white/40" />
                      <p className="mt-3 font-semibold text-white">
                        No flocks found
                      </p>
                      <p className="mt-1 text-xs text-white/60">
                        Try another search or create your first flock.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredFlocks.map((flock) => {
                    const isActive =
                      String(flock.status).toLowerCase() === "active";

                    return (
                      <tr
                        key={flock.id}
                        className="transition-colors hover:bg-black/20"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/10 text-orange-400">
                              <Bird size={20} />
                            </div>

                            <div>
                              <p className="font-semibold text-white">
                                {flock.name}
                              </p>
                              <p className="mt-1 text-xs capitalize text-white/55">
                                {flock.breed || "Breed not specified"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 capitalize text-white/80">
                          {String(flock.bird_type || "—").replaceAll("_", " ")}
                        </td>

                        <td className="px-5 py-4 tabular-nums text-white/80">
                          {Number(flock.initial_quantity || 0).toLocaleString()}
                        </td>

                        <td className="px-5 py-4 font-semibold tabular-nums text-white">
                          {Number(flock.current_quantity || 0).toLocaleString()}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-white/75">
                          <span className="inline-flex items-center gap-2">
                            <CalendarDays
                              size={15}
                              className="text-white/50"
                            />
                            {flock.acquisition_date
                              ? String(flock.acquisition_date).slice(0, 10)
                              : "—"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              isActive
                                ? "bg-green-500/10 text-green-300"
                                : "bg-white/10 text-white/70"
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${
                                isActive ? "bg-green-400" : "bg-white/50"
                              }`}
                            />
                            {flock.status || "Unknown"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          {isActive ? (
                            <button
                              type="button"
                              onClick={() => handleClose(flock)}
                              disabled={closingId === flock.id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                            >
                              <CircleStop size={14} />
                              {closingId === flock.id
                                ? "Closing..."
                                : "Close flock"}
                            </button>
                          ) : (
                            <span className="text-xs text-white/50">
                              No actions
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Create flock modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowForm(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-flock-title"
            className="my-auto w-full max-w-lg rounded-2xl border border-white/10 bg-[#111111] text-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h3
                  id="new-flock-title"
                  className="text-lg font-bold text-white"
                >
                  Create new flock
                </h3>
                <p className="mt-1 text-xs text-white/60">
                  Enter the details of your new bird batch.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={saving}
                aria-label="Close form"
                className="grid size-9 place-items-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleCreate} className="space-y-4 p-5">
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
                  htmlFor="flock-name"
                  className="mb-1.5 block text-xs font-semibold text-white/80"
                >
                  Flock name
                </label>
                <input
                  id="flock-name"
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder="e.g. Batch 001"
                  required
                  maxLength={100}
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="flock-breed"
                  className="mb-1.5 block text-xs font-semibold text-white/80"
                >
                  Breed
                </label>
                <input
                  id="flock-breed"
                  name="breed"
                  value={form.breed}
                  onChange={updateField}
                  placeholder="e.g. Kienyeji"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="flock-bird-type"
                  className="mb-1.5 block text-xs font-semibold text-white/80"
                >
                  Bird type
                </label>
                <select
                  id="flock-bird-type"
                  name="bird_type"
                  value={form.bird_type}
                  onChange={updateField}
                  required
                  className={inputClass}
                >
                  <option value="broiler">Broiler</option>
                  <option value="layer">Layer</option>
                  <option value="dual_purpose">Dual purpose</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="flock-quantity"
                  className="mb-1.5 block text-xs font-semibold text-white/80"
                >
                  Initial quantity
                </label>
                <input
                  id="flock-quantity"
                  name="initial_quantity"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={form.initial_quantity}
                  onChange={updateField}
                  placeholder="Number of birds"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="flock-date"
                  className="mb-1.5 block text-xs font-semibold text-white/80"
                >
                  Acquisition date
                </label>
                <input
                  id="flock-date"
                  name="acquisition_date"
                  type="date"
                  value={form.acquisition_date}
                  onChange={updateField}
                  required
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
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
                  {saving ? "Creating..." : "Create flock"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}

function SummaryCard({ label, value, icon: Icon }) {
  return (
    <article className={cardClass}>
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-xs text-white/75 sm:text-sm">{label}</p>

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

export default Flocks;
