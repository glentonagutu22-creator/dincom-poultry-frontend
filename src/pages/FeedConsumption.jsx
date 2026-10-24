
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Egg,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Wheat,
  X,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout/DashboardLayout";
import { getFlocks } from "../services/flockService";
import { getFinishedFeedInventory } from "../services/inventoryService";
import {
  createFeedConsumption,
  getFeedConsumption,
} from "../services/feedConsumptionService";

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const initialForm = {
  flock_id: "",
  inventory_id: "",
  quantity_kg: "",
  consumption_date: getLocalDate(),
  notes: "",
};

const inputClass =
  "w-full rounded-lg border border-white/10 bg-[#1b1b1b] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/15";

const cardClass =
  "rounded-xl border border-white/15 bg-[#111111]/75 p-4 text-white shadow-lg backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-[#111111]/80 sm:p-5";

function formatNumber(value, maximumFractionDigits = 2) {
  return (Number(value) || 0).toLocaleString(undefined, {
    maximumFractionDigits,
  });
}

function formatCurrency(value) {
  return `KSh ${formatNumber(value)}`;
}

function formatDate(value) {
  if (!value) return "—";
  return String(value).slice(0, 10);
}

function getInventoryId(item) {
  return item.id ?? item.inventory_id ?? "";
}

function getRemainingStock(item) {
  return Number(
    item.quantity_remaining_kg ??
      item.remaining_quantity_kg ??
      item.available_quantity_kg ??
      0
  );
}

function getCostPerKg(item) {
  return Number(item.cost_per_kg ?? 0);
}

function getBirdType(item) {
  return String(
    item.bird_type ??
      item.feed_type ??
      item.formula_bird_type ??
      ""
  ).toLowerCase();
}

function getInventoryLabel(item) {
  const formula =
    item.formula_name ??
    item.feed_formula_name ??
    item.name ??
    item.formula_id ??
    "Feed formula";

  return `${formula} · ${formatNumber(getRemainingStock(item), 3)} kg available`;
}

function FeedConsumption() {
  const [records, setRecords] = useState([]);
  const [flocks, setFlocks] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [flockFilter, setFlockFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [consumptionData, flockData, inventoryData] =
        await Promise.all([
          getFeedConsumption(),
          getFlocks(),
          getFinishedFeedInventory(),
        ]);

      setRecords(consumptionData);
      setFlocks(Array.isArray(flockData) ? flockData : []);
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
    } catch (err) {
      setError(err.message || "Unable to load feed consumption data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeFlocks = useMemo(
    () =>
      flocks.filter(
        (flock) =>
          String(flock.status ?? "active").toLowerCase() === "active"
      ),
    [flocks]
  );

  const availableInventory = useMemo(
    () =>
      inventory.filter(
        (item) =>
          getRemainingStock(item) > 0 &&
          ["layer", "broiler"].includes(getBirdType(item))
      ),
    [inventory]
  );

  const selectedInventory = inventory.find(
    (item) => String(getInventoryId(item)) === String(form.inventory_id)
  );

  const selectedFlock = flocks.find(
    (flock) => String(flock.id) === String(form.flock_id)
  );

  const quantity = Number(form.quantity_kg);
  const remainingStock = selectedInventory
    ? getRemainingStock(selectedInventory)
    : 0;
  const costPerKg = selectedInventory
    ? getCostPerKg(selectedInventory)
    : 0;
  const estimatedCost =
    Number.isFinite(quantity) && quantity > 0
      ? quantity * costPerKg
      : 0;

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();

    return records.filter((record) => {
      const flockName = String(
        record.flock_name ??
          flocks.find((flock) => flock.id === record.flock_id)?.name ??
          ""
      );

      const matchesSearch =
        !term ||
        [
          flockName,
          record.notes,
          record.quantity_kg,
          record.consumption_date,
        ].some((value) =>
          String(value ?? "").toLowerCase().includes(term)
        );

      const matchesFlock =
        flockFilter === "all" ||
        String(record.flock_id) === String(flockFilter);

      const date = formatDate(record.consumption_date);
      const matchesStart = !startDate || date >= startDate;
      const matchesEnd = !endDate || date <= endDate;

      return (
        matchesSearch &&
        matchesFlock &&
        matchesStart &&
        matchesEnd
      );
    });
  }, [records, search, flockFilter, startDate, endDate, flocks]);

  const totalQuantity = filteredRecords.reduce(
    (total, record) => total + (Number(record.quantity_kg) || 0),
    0
  );

  const totalCost = filteredRecords.reduce(
    (total, record) =>
      total +
      (Number(record.quantity_kg) || 0) *
        (Number(record.cost_per_kg) || 0),
    0
  );

  const flockCount = new Set(
    filteredRecords.map((record) => record.flock_id)
  ).size;

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const openForm = () => {
    setForm({
      ...initialForm,
      consumption_date: getLocalDate(),
    });
    setFormError("");
    setNotice("");
    setShowForm(true);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setFormError("");
    setNotice("");

    if (!selectedFlock) {
      setFormError("Please select a flock.");
      return;
    }

    if (!selectedInventory) {
      setFormError("Please select a finished-feed inventory batch.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setFormError("Quantity must be a positive number.");
      return;
    }

    if (Math.round(quantity * 1000) !== quantity * 1000) {
      setFormError("Quantity can have at most 3 decimal places.");
      return;
    }

    if (quantity > remainingStock) {
      setFormError(
        `Insufficient stock. Only ${formatNumber(remainingStock, 3)} kg is available.`
      );
      return;
    }

    if (!form.consumption_date) {
      setFormError("Please select the consumption date.");
      return;
    }

    setSaving(true);

    try {
      await createFeedConsumption({
        flock_id: form.flock_id,
        inventory_id: form.inventory_id,
        quantity_kg: quantity,
        consumption_date: form.consumption_date,
        notes: form.notes.trim() || null,
      });

      setShowForm(false);
      setForm(initialForm);
      setNotice("Feed consumption recorded successfully.");

      await loadData();
    } catch (err) {
      setFormError(err.message || "Unable to record feed consumption.");
    } finally {
      setSaving(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setFlockFilter("all");
    setStartDate("");
    setEndDate("");
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
              Feed Consumption
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
              Record feed issued to your flocks, monitor consumption costs,
              and keep finished-feed stock accurate.
            </p>
          </div>

          <button
            type="button"
            onClick={openForm}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-400 sm:self-auto"
          >
            <Plus size={18} />
            Record Consumption
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

        {/* Summary cards */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4">
          <SummaryCard
            label="Feed consumed"
            value={`${formatNumber(totalQuantity)} kg`}
            icon={Wheat}
          />

          <SummaryCard
            label="Estimated feed cost"
            value={formatCurrency(totalCost)}
            icon={DollarSign}
          />

          <SummaryCard
            label="Consumption records"
            value={filteredRecords.length.toLocaleString()}
            icon={ClipboardList}
          />

          <SummaryCard
            label="Flocks covered"
            value={flockCount.toLocaleString()}
            icon={Egg}
          />
        </section>

        {/* Consumption table */}
        <section className="overflow-hidden rounded-xl border border-white/15 bg-[#111111]/75 text-white shadow-lg backdrop-blur-sm">
          <div className="flex flex-col gap-4 border-b border-white/15 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-bold text-white">
                  Feed consumption records
                </h3>
                <p className="mt-1 text-xs text-white/60">
                  {filteredRecords.length}{" "}
                  {filteredRecords.length === 1 ? "record" : "records"}{" "}
                  displayed
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadData(true)}
                disabled={refreshing || loading}
                title="Refresh records"
                aria-label="Refresh feed consumption records"
                className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-white/15 px-3 text-sm text-white/85 transition hover:bg-white/10 disabled:opacity-50 sm:self-auto"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <div className="relative sm:col-span-2 lg:col-span-2">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search flock or notes..."
                  aria-label="Search feed consumption"
                  className={`${inputClass} pl-9`}
                />
              </div>

              <select
                value={flockFilter}
                onChange={(event) => setFlockFilter(event.target.value)}
                aria-label="Filter by flock"
                className={inputClass}
              >
                <option value="all">All flocks</option>
                {flocks.map((flock) => (
                  <option key={flock.id} value={flock.id}>
                    {flock.name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={startDate}
                max={endDate || getLocalDate()}
                onChange={(event) => setStartDate(event.target.value)}
                aria-label="Start date"
                className={inputClass}
              />

              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                max={getLocalDate()}
                onChange={(event) => setEndDate(event.target.value)}
                aria-label="End date"
                className={inputClass}
              />
            </div>

            {(search || flockFilter !== "all" || startDate || endDate) && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 self-start text-xs font-semibold text-orange-300 transition hover:text-orange-200"
              >
                <Filter size={14} />
                Clear filters
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-black/20 text-xs uppercase tracking-wide text-white/60">
                <tr>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Flock</th>
                  <th className="px-5 py-4 font-semibold">Quantity</th>
                  <th className="px-5 py-4 font-semibold">Cost per kg</th>
                  <th className="px-5 py-4 font-semibold">Total cost</th>
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
                        Loading feed consumption...
                      </p>
                    </td>
                  </tr>
                ) : error && records.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-white/70"
                    >
                      Unable to load consumption records. Check the error above
                      and try refreshing.
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <Activity
                        size={30}
                        className="mx-auto text-white/40"
                      />
                      <p className="mt-3 font-semibold text-white">
                        No consumption records found
                      </p>
                      <p className="mt-1 text-xs text-white/60">
                        Try changing your filters or record your first feed
                        consumption.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => {
                    const flockName =
                      record.flock_name ??
                      flocks.find((flock) => flock.id === record.flock_id)
                        ?.name ??
                      "Unknown flock";

                    const recordQuantity = Number(record.quantity_kg) || 0;
                    const recordCostPerKg =
                      Number(record.cost_per_kg) || 0;

                    return (
                      <tr
                        key={record.id}
                        className="transition-colors hover:bg-black/20"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-white/75">
                          <span className="inline-flex items-center gap-2">
                            <CalendarDays
                              size={15}
                              className="text-white/50"
                            />
                            {formatDate(record.consumption_date)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/10 text-orange-400">
                              <Egg size={19} />
                            </div>
                            <div>
                              <p className="font-semibold text-white">
                                {flockName}
                              </p>
                              <p className="mt-1 text-xs text-white/50">
                                {String(record.id ?? "").slice(0, 8) || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-semibold tabular-nums text-white">
                          {formatNumber(recordQuantity, 3)} kg
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 tabular-nums text-white/80">
                          {formatCurrency(recordCostPerKg)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-semibold tabular-nums text-white">
                          {formatCurrency(recordQuantity * recordCostPerKg)}
                        </td>

                        <td className="max-w-xs px-5 py-4 text-white/65">
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

      {/* Record consumption modal */}
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
            aria-labelledby="consumption-title"
            className="my-auto w-full max-w-lg rounded-2xl border border-white/10 bg-[#111111] text-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h3
                  id="consumption-title"
                  className="text-lg font-bold text-white"
                >
                  Record feed consumption
                </h3>
                <p className="mt-1 text-xs text-white/60">
                  Select a flock and finished-feed batch.
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
                  className="flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200"
                >
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="consumption-flock"
                  className="mb-1.5 block text-xs font-semibold text-white/80"
                >
                  Flock
                </label>
                <select
                  id="consumption-flock"
                  name="flock_id"
                  value={form.flock_id}
                  onChange={updateField}
                  required
                  className={inputClass}
                >
                  <option value="">Select a flock</option>
                  {activeFlocks.map((flock) => (
                    <option key={flock.id} value={flock.id}>
                      {flock.name}
                      {flock.bird_type ? ` (${flock.bird_type})` : ""}
                    </option>
                  ))}
                </select>
                {activeFlocks.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-300">
                    No active flocks found. Create or activate a flock first.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="consumption-inventory"
                  className="mb-1.5 block text-xs font-semibold text-white/80"
                >
                  Finished-feed inventory batch
                </label>
                <select
                  id="consumption-inventory"
                  name="inventory_id"
                  value={form.inventory_id}
                  onChange={updateField}
                  required
                  className={inputClass}
                >
                  <option value="">Select a feed batch</option>
                  {availableInventory.map((item) => (
                    <option
                      key={getInventoryId(item)}
                      value={getInventoryId(item)}
                    >
                      {getInventoryLabel(item)}
                    </option>
                  ))}
                </select>
                {availableInventory.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-300">
                    No eligible finished-feed stock is available.
                  </p>
                )}
              </div>

              {selectedInventory && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                    <p className="text-xs text-white/55">Available stock</p>
                    <p className="mt-1 font-bold text-white">
                      {formatNumber(remainingStock, 3)} kg
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                    <p className="text-xs text-white/55">Cost per kg</p>
                    <p className="mt-1 font-bold text-white">
                      {formatCurrency(costPerKg)}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="consumption-quantity"
                  className="mb-1.5 block text-xs font-semibold text-white/80"
                >
                  Quantity consumed (kg)
                </label>
                <input
                  id="consumption-quantity"
                  name="quantity_kg"
                  type="number"
                  min="0.001"
                  max={selectedInventory ? remainingStock : undefined}
                  step="0.001"
                  inputMode="decimal"
                  value={form.quantity_kg}
                  onChange={updateField}
                  placeholder="e.g. 12.500"
                  required
                  className={inputClass}
                />
                {selectedInventory && quantity > remainingStock && (
                  <p className="mt-1.5 text-xs text-red-300">
                    Quantity exceeds the available stock.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="consumption-date"
                  className="mb-1.5 block text-xs font-semibold text-white/80"
                >
                  Consumption date
                </label>
                <input
                  id="consumption-date"
                  name="consumption_date"
                  type="date"
                  value={form.consumption_date}
                  max={getLocalDate()}
                  onChange={updateField}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="consumption-notes"
                  className="mb-1.5 block text-xs font-semibold text-white/80"
                >
                  Notes (optional)
                </label>
                <textarea
                  id="consumption-notes"
                  name="notes"
                  value={form.notes}
                  onChange={updateField}
                  placeholder="Add any relevant details..."
                  rows={3}
                  maxLength={1000}
                  className={inputClass}
                />
              </div>

              <div className="rounded-lg border border-orange-400/20 bg-orange-500/10 p-4">
                <p className="text-xs text-white/65">
                  Estimated consumption cost
                </p>
                <p className="mt-1 text-xl font-extrabold tabular-nums text-orange-300">
                  {formatCurrency(estimatedCost)}
                </p>
                <p className="mt-1 text-xs text-white/50">
                  The final cost uses the selected batch's recorded cost per
                  kilogram.
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
                  disabled={
                    saving ||
                    activeFlocks.length === 0 ||
                    availableInventory.length === 0 ||
                    !selectedFlock ||
                    !selectedInventory ||
                    !Number.isFinite(quantity) ||
                    quantity <= 0 ||
                    quantity > remainingStock ||
                    Math.round(quantity * 1000) !== quantity * 1000
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && (
                    <RefreshCw size={16} className="animate-spin" />
                  )}
                  {saving ? "Recording..." : "Record consumption"}
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

export default FeedConsumption;
