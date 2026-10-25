
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bird,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Egg,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout/DashboardLayout";
import { getFlocks } from "../services/flockService";
import {
  getProduction,
  createProduction,
  getDailySummary,
  getProductionSummaryByRange,
} from "../services/productionService";

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const initialForm = {
  flock_id: "",
  production_date: getLocalDate(),
  eggs_collected: "",
  broken_eggs: "0",
  notes: "",
};

const inputClass =
  "w-full rounded-lg border border-white/10 bg-[#1b1b1b] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/15";

const cardClass =
  "rounded-xl border border-white/15 bg-[#111111]/75 p-5 text-white shadow-lg backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-[#111111]/80";

function formatNumber(value) {
  return (Number(value) || 0).toLocaleString();
}

function formatDate(value) {
  if (!value) return "—";
  return String(value).slice(0, 10);
}

function Production() {
  const [records, setRecords] = useState([]);
  const [flocks, setFlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [flockError, setFlockError] = useState("");
  const [summaryError, setSummaryError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  const [selectedDate, setSelectedDate] = useState(getLocalDate());
  const [startDate, setStartDate] = useState(getDateDaysAgo(6));
  const [endDate, setEndDate] = useState(getLocalDate());

  const [dailySummary, setDailySummary] = useState(null);
  const [rangeSummary, setRangeSummary] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadRecords = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");
    setFlockError("");

    const [productionResult, flocksResult] = await Promise.allSettled([
      getProduction(),
      getFlocks(),
    ]);

    if (productionResult.status === "fulfilled") {
      setRecords(productionResult.value);
    } else {
      setError(
        productionResult.reason?.message ||
          "Unable to load production records."
      );
    }

    if (flocksResult.status === "fulfilled") {
      setFlocks(flocksResult.value);
    } else {
      setFlockError(
        flocksResult.reason?.message || "Unable to load flocks."
      );
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  const loadSummaries = useCallback(async () => {
    setSummaryError("");

    if (!selectedDate || !startDate || !endDate || startDate > endDate) {
      setDailySummary(null);
      setRangeSummary(null);
      return;
    }

    const [dailyResult, rangeResult] = await Promise.allSettled([
      getDailySummary(selectedDate),
      getProductionSummaryByRange(startDate, endDate),
    ]);

    if (dailyResult.status === "fulfilled") {
      setDailySummary(dailyResult.value);
    } else {
      setDailySummary(null);
      setSummaryError(
        dailyResult.reason?.message ||
          "Unable to load the daily summary."
      );
    }

    if (rangeResult.status === "fulfilled") {
      setRangeSummary(rangeResult.value);
    } else {
      setRangeSummary(null);
      setSummaryError((current) =>
        current
          ? `${current} The date-range summary could not be loaded.`
          : rangeResult.reason?.message ||
            "Unable to load the date-range summary."
      );
    }
  }, [selectedDate, startDate, endDate]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    loadSummaries();
  }, [loadSummaries]);

  const activeFlocks = useMemo(
    () =>
      flocks.filter(
        (flock) => String(flock.status).toLowerCase() === "active"
      ),
    [flocks]
  );

  const flockNames = useMemo(
    () => new Map(flocks.map((flock) => [flock.id, flock.name])),
    [flocks]
  );

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return records;

    return records.filter((record) => {
      const flockName = flockNames.get(record.flock_id) || "";

      return (
        flockName.toLowerCase().includes(term) ||
        String(record.production_date ?? "").slice(0, 10).includes(term) ||
        String(record.eggs_collected ?? "").includes(term) ||
        String(record.notes ?? "").toLowerCase().includes(term)
      );
    });
  }, [records, search, flockNames]);

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

    const eggsCollected = Number(form.eggs_collected);
    const brokenEggs = Number(form.broken_eggs);

    if (!form.flock_id) {
      setFormError("Please select an active flock.");
      return;
    }

    if (!form.production_date) {
      setFormError("Please select a production date.");
      return;
    }

    if (
      !Number.isSafeInteger(eggsCollected) ||
      eggsCollected < 0
    ) {
      setFormError("Eggs collected must be a non-negative whole number.");
      return;
    }

    if (
      !Number.isSafeInteger(brokenEggs) ||
      brokenEggs < 0 ||
      brokenEggs > eggsCollected
    ) {
      setFormError(
        "Broken eggs must be a whole number between zero and eggs collected."
      );
      return;
    }

    if (form.notes.length > 2000) {
      setFormError("Notes must not exceed 2,000 characters.");
      return;
    }

    setSaving(true);

    try {
      await createProduction({
        flock_id: form.flock_id,
        production_date: form.production_date,
        eggs_collected: eggsCollected,
        broken_eggs: brokenEggs,
        notes: form.notes.trim() || null,
      });

      setNotice("Egg production recorded successfully.");
      setForm({
        ...initialForm,
        production_date: getLocalDate(),
      });
      setShowForm(false);

      await loadRecords(true);
      await loadSummaries();
    } catch (err) {
      setFormError(err.message || "Unable to record egg production.");
    } finally {
      setSaving(false);
    }
  };

  const summaryCards = [
    {
      label: "Eggs collected",
      value: rangeSummary?.eggs_collected,
      icon: Egg,
      description: "Across the selected period",
    },
    {
      label: "Intact eggs",
      value: rangeSummary?.intact_eggs,
      icon: CheckCircle2,
      description: "Eggs excluding broken ones",
    },
    {
      label: "Broken eggs",
      value: rangeSummary?.broken_eggs,
      icon: AlertCircle,
      description: "Across the selected period",
    },
    {
      label: "Flocks recorded",
      value: rangeSummary?.flocks_count,
      icon: Bird,
      description: "Distinct flocks in the selected period",
    },
  ];

  return (
    <DashboardLayout background="dashboard">
      <div className="space-y-6">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-[11px] font-extrabold tracking-[1.5px] text-orange-400">
              FARM MANAGEMENT
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Egg Production
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
              Record daily egg collection, monitor broken eggs, and review
              production totals for your farm.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setFormError("");
              setNotice("");
              setForm({
                ...initialForm,
                production_date: getLocalDate(),
              });
              setShowForm(true);
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-400 sm:self-auto"
          >
            <Plus size={18} />
            Record Production
          </button>
        </section>

        {notice && (
          <div className="flex items-start gap-2 rounded-lg border border-green-400/20 bg-green-500/10 p-3 text-sm text-green-200">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <p className="flex-1">{notice}</p>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
              className="shrink-0"
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

        {flockError && (
          <div
            role="alert"
            className="rounded-lg border border-yellow-400/20 bg-yellow-500/10 p-3 text-sm text-yellow-100"
          >
            Flock options could not be loaded: {flockError}
          </div>
        )}

        {/* Summary cards: always two columns */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4">
          {summaryCards.map(({ label, value, icon: Icon, description }) => (
            <article key={label} className={cardClass}>
              <div className="mb-3 flex items-center justify-between gap-2 sm:mb-5">
                <div className="grid size-9 place-items-center rounded-lg bg-white/10 text-orange-400 sm:size-11 sm:rounded-xl">
                  <Icon size={21} />
                </div>
                <ClipboardList
                  size={17}
                  className="shrink-0 text-white/35"
                />
              </div>
              <p className="text-xs text-white/75 sm:text-sm">{label}</p>
              <h3 className="mt-1 break-words text-2xl font-extrabold tabular-nums sm:text-3xl">
                {value === undefined ? "—" : formatNumber(value)}
              </h3>
              <p className="mt-2 text-[11px] leading-4 text-white/60 sm:text-xs sm:leading-5">
                {description}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-xl border border-white/15 bg-[#111111]/75 p-4 text-white shadow-lg backdrop-blur-sm sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays size={19} className="text-orange-400" />
            <h3 className="font-bold">Production summaries</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="summary-date"
                className="mb-1.5 block text-xs font-semibold text-white/70"
              >
                Daily summary date
              </label>
              <input
                id="summary-date"
                type="date"
                value={selectedDate}
                max={getLocalDate()}
                onChange={(event) => setSelectedDate(event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="start-date"
                className="mb-1.5 block text-xs font-semibold text-white/70"
              >
                Period starts
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                max={endDate || getLocalDate()}
                onChange={(event) => setStartDate(event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="end-date"
                className="mb-1.5 block text-xs font-semibold text-white/70"
              >
                Period ends
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                min={startDate}
                max={getLocalDate()}
                onChange={(event) => setEndDate(event.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {startDate && endDate && startDate > endDate && (
            <p className="mt-3 text-sm text-red-300">
              The start date must be on or before the end date.
            </p>
          )}

          {summaryError && (
            <p role="alert" className="mt-3 text-sm text-red-300">
              {summaryError}
            </p>
          )}

          {dailySummary && (
            <div className="mt-5 rounded-lg border border-white/15 bg-black/25 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-orange-400">
                Daily summary · {formatDate(dailySummary.production_date)}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <MiniStat label="Eggs collected" value={dailySummary.eggs_collected} />
                <MiniStat label="Intact eggs" value={dailySummary.intact_eggs} />
                <MiniStat label="Broken eggs" value={dailySummary.broken_eggs} />
                <MiniStat label="Records" value={dailySummary.records_count} />
              </div>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-white/15 bg-[#111111]/75 text-white shadow-lg backdrop-blur-sm">
          <div className="flex flex-col gap-4 border-b border-white/15 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h3 className="font-bold">Production records</h3>
              <p className="mt-1 text-xs text-white/60">
                {filteredRecords.length}{" "}
                {filteredRecords.length === 1 ? "record" : "records"} displayed
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
                  placeholder="Search production..."
                  aria-label="Search production records"
                  className={`${inputClass} pl-9 sm:w-64`}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  loadRecords(true);
                  loadSummaries();
                }}
                disabled={refreshing || loading}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/15 px-3 text-sm text-white/85 transition hover:bg-white/10 disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-black/20 text-xs uppercase tracking-wide text-white/60">
                <tr>
                  <th className="px-5 py-4 font-semibold">Production date</th>
                  <th className="px-5 py-4 font-semibold">Flock</th>
                  <th className="px-5 py-4 font-semibold">Collected</th>
                  <th className="px-5 py-4 font-semibold">Broken</th>
                  <th className="px-5 py-4 font-semibold">Intact</th>
                  <th className="px-5 py-4 font-semibold">Notes</th>
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
                        Loading production records...
                      </p>
                    </td>
                  </tr>
                ) : error && records.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-white/70"
                    >
                      Unable to load production records. Try refreshing.
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <Egg size={30} className="mx-auto text-white/40" />
                      <p className="mt-3 font-semibold text-white">
                        No production records found
                      </p>
                      <p className="mt-1 text-xs text-white/60">
                        Try another search or record your first collection.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => {
                    const intactEggs =
                      Number(record.eggs_collected || 0) -
                      Number(record.broken_eggs || 0);

                    return (
                      <tr
                        key={record.id}
                        className="transition-colors hover:bg-black/20"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-white/80">
                          {formatDate(record.production_date)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-orange-400">
                              <Bird size={18} />
                            </div>
                            <div>
                              <p className="font-semibold text-white">
                                {flockNames.get(record.flock_id) ||
                                  "Unknown flock"}
                              </p>
                              <p className="mt-1 text-xs text-white/50">
                                {String(record.flock_id).slice(0, 8)}…
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-semibold tabular-nums">
                          {formatNumber(record.eggs_collected)}
                        </td>
                        <td className="px-5 py-4 tabular-nums text-red-300">
                          {formatNumber(record.broken_eggs)}
                        </td>
                        <td className="px-5 py-4 font-semibold tabular-nums text-green-300">
                          {formatNumber(intactEggs)}
                        </td>
                        <td className="max-w-xs px-5 py-4 text-white/75">
                          <span className="block truncate">
                            {record.notes || "—"}
                          </span>
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
            aria-labelledby="production-form-title"
            className="my-auto w-full max-w-lg rounded-2xl border border-white/10 bg-[#111111] text-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h3
                  id="production-form-title"
                  className="text-lg font-bold"
                >
                  Record egg production
                </h3>
                <p className="mt-1 text-xs text-white/60">
                  Enter the collection details for one active flock.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={saving}
                aria-label="Close form"
                className="grid size-9 place-items-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
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
                  htmlFor="production-flock"
                  className="mb-1.5 block text-xs font-semibold text-white/80"
                >
                  Active flock
                </label>
                <select
                  id="production-flock"
                  name="flock_id"
                  value={form.flock_id}
                  onChange={updateField}
                  required
                  className={inputClass}
                >
                  <option value="">Select a flock</option>
                  {activeFlocks.map((flock) => (
                    <option key={flock.id} value={flock.id}>
                      {flock.name} · {flock.breed || flock.bird_type}
                    </option>
                  ))}
                </select>
                {activeFlocks.length === 0 && !flockError && (
                  <p className="mt-1.5 text-xs text-yellow-200/80">
                    There are no active flocks available. Create or activate
                    a flock before recording production.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="production-date"
                  className="mb-1.5 block text-xs font-semibold text-white/80"
                >
                  Production date
                </label>
                <input
                  id="production-date"
                  name="production_date"
                  type="date"
                  value={form.production_date}
                  max={getLocalDate()}
                  onChange={updateField}
                  required
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="eggs-collected"
                    className="mb-1.5 block text-xs font-semibold text-white/80"
                  >
                    Eggs collected
                  </label>
                  <input
                    id="eggs-collected"
                    name="eggs_collected"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={form.eggs_collected}
                    onChange={updateField}
                    placeholder="e.g. 240"
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="broken-eggs"
                    className="mb-1.5 block text-xs font-semibold text-white/80"
                  >
                    Broken eggs
                  </label>
                  <input
                    id="broken-eggs"
                    name="broken_eggs"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={form.broken_eggs}
                    onChange={updateField}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="production-notes"
                  className="mb-1.5 block text-xs font-semibold text-white/80"
                >
                  Notes <span className="font-normal text-white/40">(optional)</span>
                </label>
                <textarea
                  id="production-notes"
                  name="notes"
                  value={form.notes}
                  onChange={updateField}
                  rows={3}
                  maxLength={2000}
                  placeholder="Any observations about today's collection..."
                  className={inputClass}
                />
                <p className="mt-1 text-right text-[11px] text-white/50">
                  {form.notes.length}/2000 characters
                </p>
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
                  disabled={saving || activeFlocks.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && (
                    <RefreshCw size={16} className="animate-spin" />
                  )}
                  {saving ? "Saving..." : "Save production"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}

function MiniStat({ label, value }) {
  return (
    <div>
      <p className="text-xs text-white/60">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-white">
        {formatNumber(value)}
      </p>
    </div>
  );
}

export default Production;
