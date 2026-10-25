
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  Eye,
  Factory,
  Layers3,
  LoaderCircle,
  Package,
  Plus,
  RefreshCw,
  Search,
  Wheat,
  X,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout/DashboardLayout";
import {
  createFeedProductionBatch,
  getFeedProductionBatches,
  getFeedProductionBatchById,
} from "../services/feedProductionService";
import { getFeedFormulas } from "../services/feedFormulaService";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-[#1b1b1b] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/15";

const cardClass =
  "rounded-xl border border-white/15 bg-[#111111]/75 p-4 text-white shadow-lg backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-[#111111]/80 sm:p-5";

const today = () => {
  const date = new Date();
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );
  return localDate.toISOString().slice(0, 10);
};

const number = (value, decimals = 2) =>
  Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });

const money = (value) =>
  `KSh ${Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const birdLabel = (value) => {
  const labels = {
    broiler: "Broiler",
    layer: "Layer",
    dual_purpose: "Dual Purpose",
  };

  return labels[value] || value || "—";
};

function Notification({ notification, onClose }) {
  if (!notification) return null;

  const success = notification.type === "success";

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 ${
        success
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
          : "border-red-400/20 bg-red-400/10 text-red-300"
      }`}
      role="status"
    >
      {success ? (
        <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
      ) : (
        <AlertCircle size={20} className="mt-0.5 shrink-0" />
      )}

      <p className="flex-1 text-sm leading-6">{notification.message}</p>

      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-1 transition hover:bg-white/10"
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function SummaryCard({ title, value, description, icon: Icon }) {
  return (
    <div className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-white/50 sm:text-sm">
            {title}
          </p>
          <p className="mt-2 break-words text-2xl font-extrabold text-white sm:text-3xl">
            {value}
          </p>
          <p className="mt-1 text-xs text-white/40">{description}</p>
        </div>

        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-orange-400 sm:size-10">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function BirdTypeBadge({ type }) {
  return (
    <span className="inline-flex rounded-full border border-orange-400/20 bg-orange-400/10 px-2.5 py-1 text-xs font-medium text-orange-300">
      {birdLabel(type)}
    </span>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="block space-y-2">
      <span className="block text-sm font-medium text-white/80">{label}</span>
      {children}
      {hint && <span className="block text-xs text-white/40">{hint}</span>}
    </label>
  );
}

function ProductionDetails({ batch, onClose }) {
  if (!batch) return null;

  const ingredients = Array.isArray(batch.ingredients)
    ? batch.ingredients
    : [];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="my-auto w-full max-w-3xl rounded-2xl border border-white/15 bg-[#111111] text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
              Production record
            </p>
            <h2 className="mt-2 break-all text-xl font-bold">
              {batch.batch_number || "Production batch"}
            </h2>
            <p className="mt-1 text-sm text-white/45">
              {batch.formula_name || "Feed formula"} ·{" "}
              {formatDate(batch.production_date)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Close details"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Planned", `${number(batch.planned_quantity_kg)} kg`],
              ["Produced", `${number(batch.actual_quantity_kg)} kg`],
              ["Material cost", money(batch.total_material_cost)],
              ["Cost per kg", money(batch.cost_per_kg)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
              >
                <p className="text-xs text-white/45">{label}</p>
                <p className="mt-2 break-words text-sm font-bold sm:text-base">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {batch.notes && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Notes</h3>
              <p className="whitespace-pre-wrap text-sm leading-6 text-white/65">
                {batch.notes}
              </p>
            </div>
          )}

          <div>
            <h3 className="mb-3 font-semibold">Ingredients consumed</h3>

            {ingredients.length === 0 ? (
              <p className="rounded-lg border border-white/10 p-4 text-sm text-white/45">
                No ingredient details were returned for this batch.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full min-w-[540px] text-left text-sm">
                  <thead className="bg-white/[0.04] text-xs uppercase text-white/45">
                    <tr>
                      <th className="px-4 py-3">Raw material</th>
                      <th className="px-4 py-3 text-right">Quantity</th>
                      <th className="px-4 py-3 text-right">Unit cost</th>
                      <th className="px-4 py-3 text-right">Total cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {ingredients.map((item, index) => (
                      <tr
                        key={item.id || item.raw_material_id || index}
                        className="text-white/75"
                      >
                        <td className="px-4 py-3">
                          {item.raw_material_name || "Raw material"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {number(item.quantity_used_kg)} kg
                        </td>
                        <td className="px-4 py-3 text-right">
                          {money(item.unit_cost)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {money(item.total_cost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-white/10 p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white/75 transition hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function RecordProductionModal({
  formulas,
  onClose,
  onSubmit,
  saving,
}) {
  const [form, setForm] = useState({
    formula_id: "",
    planned_quantity_kg: "",
    actual_quantity_kg: "",
    production_date: today(),
    notes: "",
  });

  const [error, setError] = useState("");

  const selectedFormula = formulas.find(
    (formula) => formula.id === form.formula_id
  );

  const planned = Number(form.planned_quantity_kg);
  const actual = Number(form.actual_quantity_kg);
  const formulaSize = Number(selectedFormula?.batch_size_kg || 0);

  const ingredients = Array.isArray(selectedFormula?.ingredients)
    ? selectedFormula.ingredients
    : [];

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.formula_id) {
      setError("Please select a feed formula.");
      return;
    }

    if (!Number.isFinite(planned) || planned <= 0) {
      setError("Planned quantity must be greater than zero.");
      return;
    }

    if (!Number.isFinite(actual) || actual <= 0) {
      setError("Actual quantity must be greater than zero.");
      return;
    }

    if (!form.production_date) {
      setError("Please select a production date.");
      return;
    }

    try {
      await onSubmit({
        formula_id: form.formula_id,
        planned_quantity_kg: planned,
        actual_quantity_kg: actual,
        production_date: form.production_date,
        notes: form.notes.trim() || null,
      });
    } catch (submitError) {
      setError(submitError.message || "Unable to record production.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div className="my-auto w-full max-w-2xl rounded-2xl border border-white/15 bg-[#111111] text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
              Feed production
            </p>
            <h2 className="mt-2 text-xl font-bold">Record production batch</h2>
            <p className="mt-1 text-sm text-white/45">
              Select a formula and enter the production quantities.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
            aria-label="Close form"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          {error && (
            <div className="flex gap-2 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Field label="Feed formula">
            <div className="relative">
              <select
                className={`${inputClass} appearance-none pr-10`}
                value={form.formula_id}
                onChange={(event) =>
                  updateField("formula_id", event.target.value)
                }
                required
              >
                <option value="" className="bg-[#1b1b1b]">
                  Select an active formula
                </option>
                {formulas.map((formula) => (
                  <option
                    key={formula.id}
                    value={formula.id}
                    className="bg-[#1b1b1b]"
                  >
                    {formula.name} — {birdLabel(formula.bird_type)}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40"
              />
            </div>
          </Field>

          {selectedFormula && (
            <div className="rounded-xl border border-orange-400/20 bg-orange-400/[0.06] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{selectedFormula.name}</p>
                  <p className="mt-1 text-xs text-white/45">
                    Standard formula batch: {number(formulaSize)} kg
                  </p>
                </div>
                <BirdTypeBadge type={selectedFormula.bird_type} />
              </div>

              {ingredients.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/45">
                    Estimated ingredient requirements
                  </p>
                  <div className="space-y-2">
                    {ingredients.map((ingredient, index) => {
                      const recipeQuantity = Number(
                        ingredient.quantity_kg || 0
                      );
                      const required =
                        formulaSize > 0 && actual > 0
                          ? (recipeQuantity * actual) / formulaSize
                          : 0;

                      return (
                        <div
                          key={
                            ingredient.raw_material_id ||
                            ingredient.id ||
                            index
                          }
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="text-white/65">
                            {ingredient.raw_material_name ||
                              "Raw material"}
                          </span>
                          <span className="shrink-0 font-medium text-white">
                            {number(required, 3)} kg
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-white/40">
                    Estimates are based on the formula recipe and actual
                    quantity. Final ingredient usage and stock availability
                    are validated by the server.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Planned quantity (kg)">
              <input
                type="number"
                min="0.001"
                step="0.001"
                className={inputClass}
                placeholder="e.g. 500"
                value={form.planned_quantity_kg}
                onChange={(event) =>
                  updateField("planned_quantity_kg", event.target.value)
                }
                required
              />
            </Field>

            <Field label="Actual quantity produced (kg)">
              <input
                type="number"
                min="0.001"
                step="0.001"
                className={inputClass}
                placeholder="e.g. 485"
                value={form.actual_quantity_kg}
                onChange={(event) =>
                  updateField("actual_quantity_kg", event.target.value)
                }
                required
              />
            </Field>

            <Field label="Production date">
              <input
                type="date"
                max={today()}
                className={inputClass}
                value={form.production_date}
                onChange={(event) =>
                  updateField("production_date", event.target.value)
                }
                required
              />
            </Field>

            <Field label="Notes (optional)">
              <input
                type="text"
                maxLength={1000}
                className={inputClass}
                placeholder="e.g. Morning production shift"
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
              />
            </Field>
          </div>

          {planned > 0 && actual > 0 && (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-white/50">Production variance</span>
                <span
                  className={
                    actual >= planned
                      ? "font-semibold text-emerald-300"
                      : "font-semibold text-orange-300"
                  }
                >
                  {actual - planned > 0 ? "+" : ""}
                  {number(actual - planned)} kg
                </span>
              </div>
              <div className="mt-2 flex justify-between gap-3">
                <span className="text-white/50">Achievement</span>
                <span className="font-semibold text-white">
                  {number((actual / planned) * 100, 1)}%
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10 disabled:opacity-40"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || formulas.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <CheckCircle2 size={17} />
                  Record production
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FeedProduction() {
  const [batches, setBatches] = useState([]);
  const [formulas, setFormulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [birdFilter, setBirdFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [notification, setNotification] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [batchData, formulaData] = await Promise.all([
        getFeedProductionBatches(),
        getFeedFormulas(),
      ]);

      setBatches(batchData);
      setFormulas(
        formulaData.filter((formula) => formula.is_active !== false)
      );
    } catch (error) {
      setNotification({
        type: "error",
        message: error.message || "Unable to load feed production data.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const totalProduced = batches.reduce(
      (sum, batch) => sum + Number(batch.actual_quantity_kg || 0),
      0
    );

    const totalCost = batches.reduce(
      (sum, batch) => sum + Number(batch.total_material_cost || 0),
      0
    );

    return {
      totalBatches: batches.length,
      totalProduced,
      totalCost,
      averageCost: totalProduced > 0 ? totalCost / totalProduced : 0,
    };
  }, [batches]);

  const filteredBatches = useMemo(() => {
    const query = search.trim().toLowerCase();
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    return batches.filter((batch) => {
      const searchable = [
        batch.batch_number,
        batch.formula_name,
        batch.bird_type,
        batch.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (query && !searchable.includes(query)) return false;

      if (birdFilter !== "all" && batch.bird_type !== birdFilter) {
        return false;
      }

      if (dateFilter !== "all") {
        const date = new Date(batch.production_date);
        if (Number.isNaN(date.getTime())) return false;

        if (dateFilter === "today" && date < startOfToday) return false;

        if (dateFilter === "week") {
          const weekAgo = new Date(startOfToday);
          weekAgo.setDate(weekAgo.getDate() - 6);
          if (date < weekAgo) return false;
          if (date > now) return false;
        }

        if (dateFilter === "month") {
          const monthStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
          );
          if (date < monthStart) return false;
          if (date > now) return false;
        }
      }

      return true;
    });
  }, [batches, search, birdFilter, dateFilter]);

  const handleCreate = async (payload) => {
    setSaving(true);

    try {
      await createFeedProductionBatch(payload);
      setShowModal(false);
      setNotification({
        type: "success",
        message:
          "Production batch recorded. Raw material stock and finished-feed inventory have been updated by the server.",
      });
      await loadData();
    } catch (error) {
      setNotification({
        type: "error",
        message: error.message || "Unable to record production.",
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const openDetails = async (batch) => {
    setDetailsLoading(true);
    setSelectedBatch(batch);

    try {
      const detail = await getFeedProductionBatchById(batch.id);
      setSelectedBatch(detail || batch);
    } catch (error) {
      setNotification({
        type: "error",
        message: error.message || "Unable to load batch details.",
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <DashboardLayout background="feedProduction">
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-400">
              FARM MANAGEMENT
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Feed Production
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
              Produce feed from your formulas, monitor production costs, and
              keep finished-feed inventory updated.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-3.5 py-2.5 text-sm font-semibold text-white/75 transition hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              disabled={formulas.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/10 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={18} />
              Record production
            </button>
          </div>
        </div>

        <Notification
          notification={notification}
          onClose={() => setNotification(null)}
        />

        {!loading && formulas.length === 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-orange-400/20 bg-orange-400/[0.06] p-4 text-orange-200">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">No active feed formulas</p>
              <p className="mt-1 text-sm leading-6 text-white/55">
                Create and activate a feed formula before recording
                production.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <SummaryCard
            title="Production batches"
            value={number(stats.totalBatches, 0)}
            description="All recorded batches"
            icon={ClipboardList}
          />
          <SummaryCard
            title="Feed produced"
            value={`${number(stats.totalProduced)} kg`}
            description="Total recorded output"
            icon={Wheat}
          />
          <SummaryCard
            title="Material cost"
            value={money(stats.totalCost)}
            description="Total production material cost"
            icon={Layers3}
          />
          <SummaryCard
            title="Average cost / kg"
            value={money(stats.averageCost)}
            description="Weighted average across batches"
            icon={Activity}
          />
        </div>

        <div className="rounded-xl border border-white/15 bg-[#111111]/75 p-4 text-white shadow-lg backdrop-blur-sm sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Search size={18} className="text-orange-400" />
            <h2 className="font-semibold">Search and filter production</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_200px_200px]">
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
              />
              <input
                type="search"
                className={`${inputClass} pl-9`}
                placeholder="Search batch, formula, or notes..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              className={inputClass}
              value={birdFilter}
              onChange={(event) => setBirdFilter(event.target.value)}
              aria-label="Filter by bird type"
            >
              <option value="all">All bird types</option>
              <option value="broiler">Broiler</option>
              <option value="layer">Layer</option>
              <option value="dual_purpose">Dual Purpose</option>
            </select>

            <select
              className={inputClass}
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              aria-label="Filter by production date"
            >
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="week">Last 7 days</option>
              <option value="month">This month</option>
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/40">
            <span>
              Showing {filteredBatches.length} of {batches.length} batches
            </span>
            {(search || birdFilter !== "all" || dateFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setBirdFilter("all");
                  setDateFilter("all");
                }}
                className="font-semibold text-orange-400 transition hover:text-orange-300"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/15 bg-[#111111]/75 text-white shadow-lg backdrop-blur-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:p-5">
            <div>
              <h2 className="font-bold">Production history</h2>
              <p className="mt-1 text-xs text-white/40">
                Review production output and material costs.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/45">
              <Clock size={15} />
              Most recent batches first
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-white/50">
              <LoaderCircle
                size={28}
                className="animate-spin text-orange-400"
              />
              <p className="text-sm">Loading production records...</p>
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center">
              <div className="grid size-12 place-items-center rounded-xl bg-white/5 text-orange-400">
                <Factory size={24} />
              </div>
              <h3 className="mt-4 font-semibold">
                {batches.length === 0
                  ? "No production batches yet"
                  : "No matching batches"}
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/40">
                {batches.length === 0
                  ? "Record your first feed production batch to see production history and costs here."
                  : "Try changing your search term or filters."}
              </p>
              {batches.length === 0 && formulas.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-400"
                >
                  <Plus size={17} />
                  Record first batch
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-white/45">
                  <tr>
                    <th className="px-4 py-4 font-semibold">Batch</th>
                    <th className="px-4 py-4 font-semibold">Feed formula</th>
                    <th className="px-4 py-4 font-semibold">Bird type</th>
                    <th className="px-4 py-4 font-semibold">Date</th>
                    <th className="px-4 py-4 text-right font-semibold">
                      Planned (kg)
                    </th>
                    <th className="px-4 py-4 text-right font-semibold">
                      Produced (kg)
                    </th>
                    <th className="px-4 py-4 text-right font-semibold">
                      Material cost
                    </th>
                    <th className="px-4 py-4 text-right font-semibold">
                      Cost / kg
                    </th>
                    <th className="px-4 py-4 text-right font-semibold">
                      Details
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.07]">
                  {filteredBatches.map((batch) => (
                    <tr
                      key={batch.id}
                      className="transition hover:bg-white/[0.025]"
                    >
                      <td className="px-4 py-4">
                        <div className="font-semibold text-white">
                          {batch.batch_number || "—"}
                        </div>
                        {batch.notes && (
                          <p className="mt-1 max-w-40 truncate text-xs text-white/35">
                            {batch.notes}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-white/75">
                        {batch.formula_name || "—"}
                      </td>
                      <td className="px-4 py-4">
                        <BirdTypeBadge type={batch.bird_type} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-white/55">
                        {formatDate(batch.production_date)}
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums text-white/65">
                        {number(batch.planned_quantity_kg)}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold tabular-nums text-white">
                        {number(batch.actual_quantity_kg)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums text-white/75">
                        {money(batch.total_material_cost)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums text-white/75">
                        {money(batch.cost_per_kg)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openDetails(batch)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-orange-300 transition hover:border-orange-400/30 hover:bg-orange-400/10"
                        >
                          <Eye size={15} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && batches.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3 text-xs text-white/40 sm:px-5">
              <span>{filteredBatches.length} batches displayed</span>
              <span>Quantities are shown in kilograms (kg).</span>
            </div>
          )}
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4 text-white/50">
          <Package size={19} className="mt-0.5 shrink-0 text-orange-400" />
          <div>
            <p className="text-sm font-semibold text-white/75">
              Production and inventory
            </p>
            <p className="mt-1 text-xs leading-5">
              A successful production record consumes raw materials and adds
              the produced quantity to finished-feed inventory. If the server
              reports insufficient raw material stock, record the purchase
              before trying again.
            </p>
          </div>
        </div>

        {showModal && (
          <RecordProductionModal
            formulas={formulas}
            saving={saving}
            onClose={() => {
              if (!saving) setShowModal(false);
            }}
            onSubmit={handleCreate}
          />
        )}

        {selectedBatch && (
          <ProductionDetails
            batch={selectedBatch}
            onClose={() => setSelectedBatch(null)}
          />
        )}

        {detailsLoading && (
          <div className="fixed bottom-5 right-5 z-[80] flex items-center gap-2 rounded-xl border border-white/15 bg-[#111111] px-4 py-3 text-sm text-white shadow-xl">
            <LoaderCircle size={17} className="animate-spin text-orange-400" />
            Loading batch details...
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
