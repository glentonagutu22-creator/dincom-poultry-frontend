
import { useCallback, useEffect, useState } from "react";
import {
  Bird,
  Plus,
  Search,
  RefreshCw,
  X,
  FlaskConical,
  CheckCircle2,
  AlertCircle,
  Eye,
  Hash,
  Trash2,
  ChevronDown,
  Layers,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout/DashboardLayout";
import { getRawMaterials } from "../services/rawMaterialService";
import {
  getFeedFormulas,
  createFeedFormula,
  getFeedFormulaById,
} from "../services/feedFormulaService";

const BIRD_TYPES = [
  { value: "broiler", label: "Broiler" },
  { value: "layer", label: "Layer" },
  { value: "dual_purpose", label: "Dual purpose" },
];

const initialForm = {
  name: "",
  bird_type: "broiler",
  batch_size_kg: "100",
  description: "",
  ingredients: [{ raw_material_id: "", quantity_kg: "" }],
};

const inputClass =
  "w-full rounded-lg border border-white/10 bg-[#1b1b1b] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/15";

const cardClass =
  "rounded-xl border border-white/15 bg-[#111111]/75 p-4 text-white shadow-lg backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-[#111111]/80 sm:p-5";

function formatNumber(value) {
  const number = Number(value);

  return new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0);
}

function getBirdLabel(value) {
  return (
    BIRD_TYPES.find((type) => type.value === value)?.label ||
    String(value || "Unknown").replaceAll("_", " ")
  );
}

function getIngredients(formula) {
  return Array.isArray(formula?.ingredients) ? formula.ingredients : [];
}

function FlockTypeBadge({ type }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-semibold capitalize text-orange-300">
      <Bird size={13} />
      {getBirdLabel(type)}
    </span>
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

function Notification({ message, type = "error", onDismiss }) {
  if (!message) return null;

  const isSuccess = type === "success";

  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
        isSuccess
          ? "border-green-400/20 bg-green-500/10 text-green-200"
          : "border-red-400/20 bg-red-500/10 text-red-200"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
      ) : (
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
      )}

      <p className="flex-1">{message}</p>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="ml-auto"
        >
          <X size={17} />
        </button>
      )}
    </div>
  );
}

function FeedFormulas() {
  const [formulas, setFormulas] = useState([]);
  const [materials, setMaterials] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");

  const [search, setSearch] = useState("");
  const [birdFilter, setBirdFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [selectedFormula, setSelectedFormula] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadFormulas = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const data = await getFeedFormulas();
      setFormulas(data);
    } catch (err) {
      setError(err.message || "Unable to load feed formulas.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadMaterials = useCallback(async () => {
    setLoadingMaterials(true);

    try {
      const data = await getRawMaterials();

      // Formula quantities are stored in kilograms.
      // Exclude inactive materials and materials with incompatible units.
      const eligibleMaterials = data.filter(
        (material) =>
          material.is_active !== false &&
          String(material.base_unit || "kg").toLowerCase() === "kg"
      );

      setMaterials(eligibleMaterials);
    } catch (err) {
      setMaterials([]);
      setError(
        err.message || "Unable to load raw materials for the formula."
      );
    } finally {
      setLoadingMaterials(false);
    }
  }, []);

  useEffect(() => {
    loadFormulas();
    loadMaterials();
  }, [loadFormulas, loadMaterials]);

  const filteredFormulas = formulas.filter((formula) => {
    const searchTerm = search.trim().toLowerCase();

    const matchesSearch =
      !searchTerm ||
      [
        formula.name,
        formula.description,
        formula.bird_type,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(searchTerm)
      );

    const matchesBird =
      birdFilter === "all" || formula.bird_type === birdFilter;

    return matchesSearch && matchesBird;
  });

  const broilerCount = formulas.filter(
    (formula) => formula.bird_type === "broiler"
  ).length;

  const layerCount = formulas.filter(
    (formula) => formula.bird_type === "layer"
  ).length;

  const totalBatchSize = formulas.reduce(
    (total, formula) => total + (Number(formula.batch_size_kg) || 0),
    0
  );

  const totalIngredients = formulas.reduce(
    (total, formula) => total + getIngredients(formula).length,
    0
  );

  const batchSize = Number(form.batch_size_kg);

  const ingredientTotal = form.ingredients.reduce(
    (total, ingredient) =>
      total + (Number(ingredient.quantity_kg) || 0),
    0
  );

  const difference = batchSize - ingredientTotal;

  const balanced =
    Number.isFinite(batchSize) &&
    batchSize > 0 &&
    Math.abs(difference) <= 0.001;

  const selectedIds = form.ingredients
    .map((ingredient) => ingredient.raw_material_id)
    .filter(Boolean);

  const hasDuplicates =
    new Set(selectedIds).size !== selectedIds.length;

  const canSubmit =
    form.name.trim().length > 0 &&
    form.name.trim().length <= 150 &&
    balanced &&
    form.ingredients.length > 0 &&
    form.ingredients.every(
      (ingredient) =>
        ingredient.raw_material_id &&
        Number.isFinite(Number(ingredient.quantity_kg)) &&
        Number(ingredient.quantity_kg) > 0
    ) &&
    !hasDuplicates &&
    !saving &&
    !loadingMaterials;

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const updateIngredient = (index, field, value) => {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, i) =>
        i === index
          ? { ...ingredient, [field]: value }
          : ingredient
      ),
    }));
  };

  const addIngredient = () => {
    setForm((current) => ({
      ...current,
      ingredients: [
        ...current.ingredients,
        { raw_material_id: "", quantity_kg: "" },
      ],
    }));
  };

  const removeIngredient = (index) => {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.filter((_, i) => i !== index),
    }));
  };

  const openCreateForm = () => {
    setForm({
      ...initialForm,
      ingredients: [{ raw_material_id: "", quantity_kg: "" }],
    });

    setFormError("");
    setNotice("");
    setError("");
    setShowForm(true);
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    setFormError("");
    setNotice("");

    if (!form.name.trim()) {
      setFormError("Please enter a formula name.");
      return;
    }

    if (!Number.isFinite(batchSize) || batchSize <= 0) {
      setFormError("Batch size must be greater than zero.");
      return;
    }

    if (form.ingredients.length === 0) {
      setFormError("Add at least one ingredient.");
      return;
    }

    if (
      form.ingredients.some(
        (ingredient) =>
          !ingredient.raw_material_id ||
          !Number.isFinite(Number(ingredient.quantity_kg)) ||
          Number(ingredient.quantity_kg) <= 0
      )
    ) {
      setFormError(
        "Select a raw material and enter a positive quantity for every ingredient."
      );
      return;
    }

    if (hasDuplicates) {
      setFormError("A raw material can only appear once in a formula.");
      return;
    }

    if (!balanced) {
      setFormError(
        `Ingredient quantities must equal the batch size. Current total: ${formatNumber(
          ingredientTotal
        )} kg; required: ${formatNumber(batchSize)} kg.`
      );
      return;
    }

    setSaving(true);

    try {
      await createFeedFormula({
        name: form.name.trim(),
        bird_type: form.bird_type,
        batch_size_kg: batchSize,
        description: form.description.trim() || null,
        ingredients: form.ingredients.map((ingredient) => ({
          raw_material_id: ingredient.raw_material_id,
          quantity_kg: Number(ingredient.quantity_kg),
        })),
      });

      setShowForm(false);
      setForm(initialForm);
      setNoticeType("success");
      setNotice("Feed formula created successfully.");

      await loadFormulas();
    } catch (err) {
      setFormError(err.message || "Unable to create feed formula.");
    } finally {
      setSaving(false);
    }
  };

  const handleViewFormula = async (formula) => {
    setSelectedFormula(formula);
    setLoadingDetails(true);
    setError("");

    try {
      const details = await getFeedFormulaById(formula.id);
      setSelectedFormula(details);
    } catch (err) {
      setError(err.message || "Unable to load formula details.");
    } finally {
      setLoadingDetails(false);
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
              Feed Formulas
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
              Create and manage feed recipes for broilers, layers, and
              dual-purpose birds using your registered raw materials.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-400 sm:self-auto"
          >
            <Plus size={18} />
            New Formula
          </button>
        </section>

        {/* Notifications */}
        {notice && (
          <Notification
            message={notice}
            type={noticeType}
            onDismiss={() => setNotice("")}
          />
        )}

        {error && (
          <Notification
            message={error}
            onDismiss={() => setError("")}
          />
        )}

        {/* Summary cards */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4">
          <SummaryCard
            label="Total formulas"
            value={formulas.length}
            icon={FlaskConical}
          />

          <SummaryCard
            label="Broiler formulas"
            value={broilerCount}
            icon={Bird}
          />

          <SummaryCard
            label="Layer formulas"
            value={layerCount}
            icon={Layers}
          />

          <SummaryCard
            label="Total batch sizes"
            value={`${formatNumber(totalBatchSize)} kg`}
            icon={Hash}
          />
        </section>

        {/* Formula catalogue */}
        <section className="overflow-hidden rounded-xl border border-white/15 bg-[#111111]/75 text-white shadow-lg backdrop-blur-sm">
          <div className="flex flex-col gap-4 border-b border-white/15 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h3 className="font-bold text-white">All feed formulas</h3>
              <p className="mt-1 text-xs text-white/60">
                {filteredFormulas.length}{" "}
                {filteredFormulas.length === 1 ? "formula" : "formulas"}{" "}
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
                  placeholder="Search formulas..."
                  aria-label="Search formulas"
                  className={`${inputClass} pl-9 sm:w-56`}
                />
              </div>

              <div className="relative">
                <select
                  value={birdFilter}
                  onChange={(event) => setBirdFilter(event.target.value)}
                  aria-label="Filter by bird type"
                  className={`${inputClass} appearance-none pr-9`}
                >
                  <option value="all">All bird types</option>
                  {BIRD_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  loadFormulas(true);
                  loadMaterials();
                }}
                disabled={refreshing || loading}
                title="Refresh formulas"
                aria-label="Refresh formulas"
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
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-black/20 text-xs uppercase tracking-wide text-white/60">
                <tr>
                  <th className="px-5 py-4 font-semibold">Formula</th>
                  <th className="px-5 py-4 font-semibold">Bird type</th>
                  <th className="px-5 py-4 font-semibold">Batch size</th>
                  <th className="px-5 py-4 font-semibold">Ingredients</th>
                  <th className="px-5 py-4 font-semibold">Created</th>
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
                        Loading feed formulas...
                      </p>
                    </td>
                  </tr>
                ) : error && formulas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-white/70"
                    >
                      Unable to load feed formulas. Check the error above
                      and try refreshing.
                    </td>
                  </tr>
                ) : filteredFormulas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <FlaskConical
                        size={30}
                        className="mx-auto text-white/40"
                      />
                      <p className="mt-3 font-semibold text-white">
                        No formulas found
                      </p>
                      <p className="mt-1 text-xs text-white/60">
                        Try another search or create your first feed formula.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredFormulas.map((formula) => {
                    const ingredients = getIngredients(formula);

                    return (
                      <tr
                        key={formula.id}
                        className="transition-colors hover:bg-black/20"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/10 text-orange-400">
                              <FlaskConical size={20} />
                            </div>

                            <div className="max-w-xs">
                              <p className="font-semibold text-white">
                                {formula.name}
                              </p>
                              <p className="mt-1 truncate text-xs text-white/55">
                                {formula.description ||
                                  "No description provided"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <FlockTypeBadge type={formula.bird_type} />
                        </td>

                        <td className="px-5 py-4 tabular-nums text-white/80">
                          {formatNumber(formula.batch_size_kg)} kg
                        </td>

                        <td className="px-5 py-4 text-white/80">
                          {ingredients.length}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-white/70">
                          {formula.created_at
                            ? String(formula.created_at).slice(0, 10)
                            : "—"}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleViewFormula(formula)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 transition hover:border-orange-400/30 hover:bg-orange-500/10 hover:text-orange-300"
                          >
                            <Eye size={14} />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredFormulas.length > 0 && (
            <div className="border-t border-white/10 px-5 py-3 text-xs text-white/50">
              {filteredFormulas.length} of {formulas.length} formulas ·{" "}
              {totalIngredients} ingredient entries across all formulas
            </div>
          )}
        </section>
      </div>

      {/* Create formula modal */}
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
            aria-labelledby="new-formula-title"
            className="my-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-[#111111] text-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h3
                  id="new-formula-title"
                  className="text-lg font-bold text-white"
                >
                  Create feed formula
                </h3>
                <p className="mt-1 text-xs text-white/60">
                  Define the recipe and its ingredient quantities.
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

            <form
              onSubmit={handleCreate}
              className="max-h-[78vh] space-y-4 overflow-y-auto p-5"
            >
              {formError && (
                <Notification
                  message={formError}
                  onDismiss={() => setFormError("")}
                />
              )}

              <div>
                <label
                  htmlFor="formula-name"
                  className="mb-1.5 block text-xs font-semibold text-white/80"
                >
                  Formula name
                </label>
                <input
                  id="formula-name"
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder="e.g. Broiler Starter Feed"
                  maxLength={150}
                  required
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="formula-bird-type"
                    className="mb-1.5 block text-xs font-semibold text-white/80"
                  >
                    Bird type
                  </label>
                  <select
                    id="formula-bird-type"
                    name="bird_type"
                    value={form.bird_type}
                    onChange={updateField}
                    required
                    className={inputClass}
                  >
                    {BIRD_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="formula-batch-size"
                    className="mb-1.5 block text-xs font-semibold text-white/80"
                  >
                    Batch size (kg)
                  </label>
                  <input
                    id="formula-batch-size"
                    name="batch_size_kg"
                    type="number"
                    min="0.001"
                    step="any"
                    value={form.batch_size_kg}
                    onChange={updateField}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="formula-description"
                  className="mb-1.5 block text-xs font-semibold text-white/80"
                >
                  Description
                </label>
                <textarea
                  id="formula-description"
                  name="description"
                  rows={2}
                  value={form.description}
                  onChange={updateField}
                  placeholder="Optional formula description"
                  className={inputClass}
                />
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-white">Ingredients</h4>
                    <p className="mt-1 text-xs text-white/55">
                      Ingredient quantities must total the batch size.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addIngredient}
                    disabled={loadingMaterials}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/85 transition hover:bg-white/10 disabled:opacity-50"
                  >
                    <Plus size={15} />
                    Add
                  </button>
                </div>

                {loadingMaterials ? (
                  <div className="py-6 text-center text-sm text-white/60">
                    <RefreshCw
                      size={19}
                      className="mx-auto mb-2 animate-spin text-orange-400"
                    />
                    Loading raw materials...
                  </div>
                ) : materials.length === 0 ? (
                  <div className="rounded-lg border border-orange-400/20 bg-orange-500/10 p-3 text-sm text-orange-200">
                    No active raw materials measured in kilograms were found.
                    Register suitable materials in the Raw Materials module
                    and refresh this page.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {form.ingredients.map((ingredient, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-white/10 bg-white/[0.025] p-3"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs font-bold text-white/70">
                            Ingredient {index + 1}
                          </span>

                          {form.ingredients.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeIngredient(index)}
                              className="inline-flex items-center gap-1 text-xs text-red-300 transition hover:text-red-200"
                            >
                              <Trash2 size={14} />
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor={`ingredient-material-${index}`}
                              className="mb-1.5 block text-xs text-white/65"
                            >
                              Raw material
                            </label>
                            <select
                              id={`ingredient-material-${index}`}
                              value={ingredient.raw_material_id}
                              onChange={(event) =>
                                updateIngredient(
                                  index,
                                  "raw_material_id",
                                  event.target.value
                                )
                              }
                              required
                              className={inputClass}
                            >
                              <option value="">Select material</option>
                              {materials.map((material) => {
                                const duplicate =
                                  selectedIds.includes(material.id) &&
                                  ingredient.raw_material_id !== material.id;

                                return (
                                  <option
                                    key={material.id}
                                    value={material.id}
                                    disabled={duplicate}
                                  >
                                    {material.name}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          <div>
                            <label
                              htmlFor={`ingredient-quantity-${index}`}
                              className="mb-1.5 block text-xs text-white/65"
                            >
                              Quantity (kg)
                            </label>
                            <input
                              id={`ingredient-quantity-${index}`}
                              type="number"
                              min="0.001"
                              step="any"
                              value={ingredient.quantity_kg}
                              onChange={(event) =>
                                updateIngredient(
                                  index,
                                  "quantity_kg",
                                  event.target.value
                                )
                              }
                              placeholder="e.g. 25"
                              required
                              className={inputClass}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Batch total */}
              <div
                className={`rounded-lg border p-4 ${
                  balanced
                    ? "border-green-400/20 bg-green-500/10"
                    : "border-white/10 bg-white/[0.025]"
                }`}
              >
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-xs text-white/55">Batch size</p>
                    <p className="mt-1 break-words text-sm font-bold text-white sm:text-base">
                      {formatNumber(batchSize)} kg
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/55">Ingredients</p>
                    <p className="mt-1 break-words text-sm font-bold text-white sm:text-base">
                      {formatNumber(ingredientTotal)} kg
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/55">
                      {difference >= 0 ? "Remaining" : "Over"}
                    </p>
                    <p
                      className={`mt-1 break-words text-sm font-bold sm:text-base ${
                        balanced ? "text-green-300" : "text-orange-300"
                      }`}
                    >
                      {formatNumber(Math.abs(difference))} kg
                    </p>
                  </div>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all ${
                      balanced ? "bg-green-400" : "bg-orange-400"
                    }`}
                    style={{
                      width: `${
                        batchSize > 0
                          ? Math.min(
                              100,
                              (ingredientTotal / batchSize) * 100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-xs text-white/55">
                  {balanced
                    ? "The ingredient quantities match the batch size."
                    : "The total ingredient quantity must equal the batch size before saving."}
                </p>
              </div>

              {hasDuplicates && (
                <Notification message="Each raw material can only appear once in a formula." />
              )}

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
                  disabled={!canSubmit}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && (
                    <RefreshCw size={16} className="animate-spin" />
                  )}
                  {saving ? "Creating..." : "Create formula"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Formula details modal */}
      {selectedFormula && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedFormula(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="formula-details-title"
            className="my-auto w-full max-w-xl rounded-2xl border border-white/10 bg-[#111111] text-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h3
                  id="formula-details-title"
                  className="text-lg font-bold text-white"
                >
                  Formula details
                </h3>
                <p className="mt-1 text-xs text-white/60">
                  Ingredient composition and batch information.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFormula(null)}
                aria-label="Close details"
                className="grid size-9 place-items-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </header>

            <div className="space-y-4 p-5">
              {loadingDetails ? (
                <div className="py-8 text-center text-sm text-white/60">
                  <RefreshCw
                    size={21}
                    className="mx-auto mb-3 animate-spin text-orange-400"
                  />
                  Loading formula details...
                </div>
              ) : (
                <>
                  <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                    <h4 className="break-words text-lg font-bold text-white">
                      {selectedFormula.name}
                    </h4>

                    <p className="mt-1 text-sm text-white/60">
                      {selectedFormula.description ||
                        "No description provided."}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <FlockTypeBadge type={selectedFormula.bird_type} />

                      <span className="text-sm font-semibold text-white/80">
                        {formatNumber(selectedFormula.batch_size_kg)} kg batch
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 font-bold text-white">
                      Ingredients ({getIngredients(selectedFormula).length})
                    </h4>

                    {getIngredients(selectedFormula).length === 0 ? (
                      <p className="rounded-lg border border-white/10 p-4 text-sm text-white/60">
                        No ingredients were returned for this formula.
                      </p>
                    ) : (
                      <div className="overflow-hidden rounded-lg border border-white/10">
                        {getIngredients(selectedFormula).map(
                          (ingredient, index) => {
                            const quantity =
                              Number(ingredient.quantity_kg) || 0;
                            const total =
                              Number(selectedFormula.batch_size_kg) || 0;
                            const percentage =
                              total > 0 ? (quantity / total) * 100 : 0;

                            return (
                              <div
                                key={`${ingredient.raw_material_id}-${index}`}
                                className="border-b border-white/10 p-3 last:border-b-0"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-white">
                                      {ingredient.raw_material_name ||
                                        "Unknown material"}
                                    </p>
                                    <p className="mt-1 text-xs text-white/50">
                                      {formatNumber(percentage)}% of batch
                                    </p>
                                  </div>

                                  <span className="shrink-0 text-sm font-bold text-white/85">
                                    {formatNumber(quantity)} kg
                                  </span>
                                </div>

                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                                  <div
                                    className="h-full rounded-full bg-orange-500"
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        Math.max(0, percentage)
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>

                  {selectedFormula.created_at && (
                    <p className="text-xs text-white/45">
                      Created:{" "}
                      {String(selectedFormula.created_at).slice(0, 10)}
                    </p>
                  )}
                </>
              )}

              <div className="flex justify-end border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedFormula(null)}
                  className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/5"
                >
                  Close
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}

export default FeedFormulas;
