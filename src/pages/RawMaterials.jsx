
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Banknote,
  Boxes,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Eye,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Truck,
  X,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout/DashboardLayout";
import {
  getRawMaterials,
  createRawMaterial,
  getRawMaterialStockSummary,
  getRawMaterialPurchases,
  createRawMaterialPurchase,
} from "../services/rawMaterialService";

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const initialMaterialForm = {
  name: "",
  base_unit: "kg",
  description: "",
};

const initialPurchaseForm = {
  raw_material_id: "",
  purchase_date: getLocalDate(),
  supplier_name: "",
  quantity: "",
  unit_cost: "",
  notes: "",
};

const inputClass =
  "w-full rounded-lg border border-white/10 bg-[#1b1b1b] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/15";

const cardClass =
  "rounded-xl border border-white/15 bg-[#111111]/75 p-5 text-white shadow-lg backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-[#111111]/80";

function formatNumber(value, maximumFractionDigits = 2) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number.toLocaleString(undefined, {
        maximumFractionDigits,
      })
    : "0";
}

function formatMoney(value) {
  return `KSh ${formatNumber(value)}`;
}

function formatDate(value) {
  if (!value) return "—";

  const dateString = String(value).slice(0, 10);
  const date = new Date(`${dateString}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? dateString
    : date.toLocaleDateString();
}

function getErrorMessage(error, fallback) {
  return error?.message || fallback;
}

function SummaryCard({ label, value, icon: Icon, description }) {
  return (
    <article className={cardClass}>
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

      <h3 className="mt-1 break-words text-xl font-extrabold tabular-nums sm:text-2xl lg:text-3xl">
        {value}
      </h3>

      <p className="mt-2 text-[11px] leading-4 text-white/60 sm:text-xs sm:leading-5">
        {description}
      </p>
    </article>
  );
}

function MiniStat({ label, value, unit }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/20 p-3">
      <p className="text-xs leading-5 text-white/60">{label}</p>

      <p className="mt-1 break-words text-lg font-bold tabular-nums text-white sm:text-xl">
        {value}
        {unit ? (
          <span className="ml-1 text-xs font-medium text-white/60">
            {unit}
          </span>
        ) : null}
      </p>
    </div>
  );
}

function RawMaterials() {
  const [materials, setMaterials] = useState([]);
  const [purchases, setPurchases] = useState([]);

  const [selectedId, setSelectedId] = useState("");
  const [stockSummary, setStockSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [purchaseError, setPurchaseError] = useState("");
  const [stockError, setStockError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [purchaseFilter, setPurchaseFilter] = useState("");

  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);

  const [materialForm, setMaterialForm] = useState(initialMaterialForm);
  const [purchaseForm, setPurchaseForm] = useState(initialPurchaseForm);

  const loadMaterials = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const result = await getRawMaterials();

      setMaterials(result);

      setSelectedId((current) => {
        if (current && result.some((item) => item.id === current)) {
          return current;
        }

        return result[0]?.id || "";
      });
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to load raw materials.")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadPurchases = useCallback(async () => {
    setPurchaseError("");

    try {
      const result = await getRawMaterialPurchases(purchaseFilter);
      setPurchases(result);
    } catch (err) {
      setPurchases([]);
      setPurchaseError(
        getErrorMessage(err, "Unable to load purchase records.")
      );
    }
  }, [purchaseFilter]);

  const loadStockSummary = useCallback(async (id) => {
    if (!id) {
      setStockSummary(null);
      setStockError("");
      return;
    }

    setStockLoading(true);
    setStockError("");

    try {
      const summary = await getRawMaterialStockSummary(id);
      setStockSummary(summary);
    } catch (err) {
      setStockSummary(null);
      setStockError(
        getErrorMessage(err, "Unable to load the stock summary.")
      );
    } finally {
      setStockLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  useEffect(() => {
    loadStockSummary(selectedId);
  }, [selectedId, loadStockSummary]);

  useEffect(() => {
    setPurchaseForm((current) => ({
      ...current,
      raw_material_id: selectedId || "",
    }));
  }, [selectedId]);

  const selectedMaterial = useMemo(
    () => materials.find((material) => material.id === selectedId),
    [materials, selectedId]
  );

  const filteredMaterials = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return materials;

    return materials.filter((material) =>
      [
        material.name,
        material.base_unit,
        material.description,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(term)
      )
    );
  }, [materials, search]);

  const purchaseTotals = useMemo(
    () =>
      purchases.reduce(
        (totals, purchase) => ({
          quantity:
            totals.quantity + Number(purchase.quantity || 0),
          cost:
            totals.cost + Number(purchase.total_cost || 0),
        }),
        { quantity: 0, cost: 0 }
      ),
    [purchases]
  );

  const summaryCards = [
    {
      label: "Registered materials",
      value: formatNumber(materials.length, 0),
      icon: Boxes,
      description: "Different materials in the catalogue",
    },
    {
      label: "Purchase records",
      value: formatNumber(purchases.length, 0),
      icon: ShoppingCart,
      description: "Records matching the current filter",
    },
    {
      label: "Quantity purchased",
      value: formatNumber(purchaseTotals.quantity),
      icon: Package,
      description: "Combined quantities in the displayed records",
    },
    {
      label: "Purchase value",
      value: formatMoney(purchaseTotals.cost),
      icon: Banknote,
      description: "Combined cost of displayed purchases",
    },
  ];

  function clearFeedback() {
    setError("");
    setPurchaseError("");
    setStockError("");
    setFormError("");
    setNotice("");
  }

  function updateMaterialField(event) {
    const { name, value } = event.target;

    setMaterialForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updatePurchaseField(event) {
    const { name, value } = event.target;

    setPurchaseForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function openMaterialForm() {
    clearFeedback();
    setMaterialForm(initialMaterialForm);
    setShowMaterialForm(true);
  }

  function openPurchaseForm() {
    clearFeedback();

    setPurchaseForm({
      ...initialPurchaseForm,
      raw_material_id: selectedId || materials[0]?.id || "",
      purchase_date: getLocalDate(),
    });

    setShowPurchaseForm(true);
  }

  async function handleCreateMaterial(event) {
    event.preventDefault();

    setFormError("");
    setNotice("");

    const name = materialForm.name.trim();
    const description = materialForm.description.trim();

    if (!name) {
      setFormError("Please enter a material name.");
      return;
    }

    if (name.length > 150) {
      setFormError("Material name must not exceed 150 characters.");
      return;
    }

    setSaving(true);

    try {
      const result = await createRawMaterial({
        name,
        base_unit: materialForm.base_unit,
        description: description || null,
      });

      // createRawMaterial returns the full API response.
      const created = result.data?.material ?? result.material;

      setMaterialForm(initialMaterialForm);
      setShowMaterialForm(false);
      setNotice("Raw material registered successfully.");

      await loadMaterials(true);

      if (created?.id) {
        setSelectedId(created.id);
      }
    } catch (err) {
      setFormError(
        getErrorMessage(err, "Unable to register the raw material.")
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCreatePurchase(event) {
    event.preventDefault();

    setFormError("");
    setNotice("");

    const quantity = Number(purchaseForm.quantity);
    const unitCost = Number(purchaseForm.unit_cost);

    if (!purchaseForm.raw_material_id) {
      setFormError("Please select a raw material.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setFormError("Quantity must be greater than zero.");
      return;
    }

    if (!Number.isFinite(unitCost) || unitCost < 0) {
      setFormError("Unit cost cannot be negative.");
      return;
    }

    setSaving(true);

    try {
      await createRawMaterialPurchase({
        raw_material_id: purchaseForm.raw_material_id,
        purchase_date: purchaseForm.purchase_date || undefined,
        supplier_name: purchaseForm.supplier_name.trim() || null,
        quantity,
        unit_cost: unitCost,
        notes: purchaseForm.notes.trim() || null,
      });

      const purchasedMaterialId = purchaseForm.raw_material_id;

      setShowPurchaseForm(false);
      setPurchaseForm({
        ...initialPurchaseForm,
        raw_material_id: selectedId || "",
        purchase_date: getLocalDate(),
      });

      setNotice("Raw material purchase recorded successfully.");

      await Promise.all([
        loadPurchases(),
        loadStockSummary(purchasedMaterialId),
      ]);
    } catch (err) {
      setFormError(
        getErrorMessage(err, "Unable to record the purchase.")
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRefresh() {
    clearFeedback();

    await Promise.all([
      loadMaterials(true),
      loadPurchases(),
      selectedId ? loadStockSummary(selectedId) : Promise.resolve(),
    ]);
  }

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
              Raw Materials
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
              Manage feed ingredients and farm supplies, record purchases,
              and monitor material consumption, remaining quantities, and costs.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openMaterialForm}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              <Plus size={17} />
              Add material
            </button>

            <button
              type="button"
              onClick={openPurchaseForm}
              disabled={materials.length === 0}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingCart size={17} />
              Record purchase
            </button>
          </div>
        </section>

        {/* Success notification */}
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

        {/* General error */}
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
              className="shrink-0"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Summary cards: always two columns */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4">
          {summaryCards.map((item) => (
            <SummaryCard key={item.label} {...item} />
          ))}
        </section>

        {/* Stock summary */}
        <section className="rounded-xl border border-white/15 bg-[#111111]/75 p-4 text-white shadow-lg backdrop-blur-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Boxes size={19} className="text-orange-400" />
                <h3 className="font-bold">Material stock summary</h3>
              </div>

              <p className="mt-1 text-xs leading-5 text-white/60">
                View purchased quantities, feed-production consumption,
                remaining stock, and estimated value.
              </p>
            </div>

            <div className="w-full sm:max-w-xs">
              <label
                htmlFor="stock-material"
                className="mb-1.5 block text-xs font-semibold text-white/70"
              >
                Select material
              </label>

              <select
                id="stock-material"
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
                className={inputClass}
              >
                <option value="">Select a material</option>

                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {stockError && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200"
            >
              {stockError}
            </div>
          )}

          {stockLoading ? (
            <div className="py-10 text-center text-sm text-white/65">
              <RefreshCw
                size={22}
                className="mx-auto animate-spin text-orange-400"
              />
              <p className="mt-3">Loading stock summary...</p>
            </div>
          ) : stockSummary ? (
            <>
              <div className="mb-4 rounded-lg border border-white/10 bg-black/25 p-4">
                <p className="text-xs text-white/55">Selected material</p>

                <h4 className="mt-1 text-xl font-bold">
                  {stockSummary.name || selectedMaterial?.name || "Material"}
                </h4>

                <p className="mt-1 text-xs text-white/60">
                  Base unit:{" "}
                  {stockSummary.base_unit ||
                    selectedMaterial?.base_unit ||
                    "—"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <MiniStat
                  label="Total purchased"
                  value={formatNumber(stockSummary.total_quantity_purchased)}
                  unit={stockSummary.base_unit}
                />

                <MiniStat
                  label="Total consumed"
                  value={formatNumber(stockSummary.total_quantity_used)}
                  unit={stockSummary.base_unit}
                />

                <MiniStat
                  label="Quantity remaining"
                  value={formatNumber(stockSummary.quantity_remaining)}
                  unit={stockSummary.base_unit}
                />

                <MiniStat
                  label="Average unit cost"
                  value={formatMoney(stockSummary.average_unit_cost)}
                />

                <MiniStat
                  label="Remaining stock value"
                  value={formatMoney(stockSummary.remaining_stock_value)}
                />
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-white/15 px-4 py-10 text-center">
              <Package size={30} className="mx-auto text-white/35" />

              <p className="mt-3 font-semibold text-white">
                {materials.length
                  ? "Select a material to view its stock."
                  : "No materials registered yet."}
              </p>

              <p className="mt-1 text-xs text-white/55">
                {materials.length
                  ? "Choose a material from the dropdown above."
                  : "Register your first raw material to get started."}
              </p>
            </div>
          )}
        </section>

        {/* Materials catalogue */}
        <section className="overflow-hidden rounded-xl border border-white/15 bg-[#111111]/75 text-white shadow-lg backdrop-blur-sm">
          <div className="flex flex-col gap-4 border-b border-white/15 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h3 className="font-bold">Raw materials catalogue</h3>

              <p className="mt-1 text-xs text-white/60">
                {filteredMaterials.length}{" "}
                {filteredMaterials.length === 1 ? "material" : "materials"} displayed
              </p>
            </div>

            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search materials..."
                aria-label="Search raw materials"
                className={`${inputClass} pl-9 sm:w-64`}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-black/20 text-xs uppercase tracking-wide text-white/60">
                <tr>
                  <th className="px-5 py-4 font-semibold">Material</th>
                  <th className="px-5 py-4 font-semibold">Base unit</th>
                  <th className="px-5 py-4 font-semibold">Description</th>
                  <th className="px-5 py-4 font-semibold">Created</th>
                  <th className="px-5 py-4 text-right font-semibold">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <RefreshCw
                        size={22}
                        className="mx-auto animate-spin text-orange-400"
                      />
                      <p className="mt-3 text-sm text-white/70">
                        Loading raw materials...
                      </p>
                    </td>
                  </tr>
                ) : error && materials.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-white/70"
                    >
                      Unable to load raw materials. Try refreshing.
                    </td>
                  </tr>
                ) : filteredMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <Package
                        size={30}
                        className="mx-auto text-white/40"
                      />

                      <p className="mt-3 font-semibold text-white">
                        No raw materials found
                      </p>

                      <p className="mt-1 text-xs text-white/60">
                        Try another search or register a new material.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredMaterials.map((material) => (
                    <tr
                      key={material.id}
                      className={`transition-colors hover:bg-black/20 ${
                        selectedId === material.id
                          ? "bg-orange-500/[0.06]"
                          : ""
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-orange-400">
                            <Package size={18} />
                          </div>

                          <div>
                            <p className="font-semibold text-white">
                              {material.name}
                            </p>

                            <p className="mt-1 text-xs text-white/45">
                              {String(material.id).slice(0, 8)}…
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-white/80">
                        {material.base_unit}
                      </td>

                      <td className="max-w-xs px-5 py-4 text-white/65">
                        <span className="block truncate">
                          {material.description || "—"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-white/65">
                        {formatDate(material.created_at)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedId(material.id)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-orange-400/20 px-3 py-2 text-xs font-semibold text-orange-300 transition hover:bg-orange-500/10"
                        >
                          <Eye size={14} />
                          View stock
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Purchase history */}
        <section className="overflow-hidden rounded-xl border border-white/15 bg-[#111111]/75 text-white shadow-lg backdrop-blur-sm">
          <div className="flex flex-col gap-4 border-b border-white/15 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <div className="flex items-center gap-2">
                <Truck size={19} className="text-orange-400" />
                <h3 className="font-bold">Purchase history</h3>
              </div>

              <p className="mt-1 text-xs text-white/60">
                Review material purchases, suppliers, and costs.
              </p>
            </div>

            <div className="w-full sm:max-w-xs">
              <label
                htmlFor="purchase-filter"
                className="mb-1.5 block text-xs font-semibold text-white/70"
              >
                Filter by material
              </label>

              <select
                id="purchase-filter"
                value={purchaseFilter}
                onChange={(event) => setPurchaseFilter(event.target.value)}
                className={inputClass}
              >
                <option value="">All materials</option>

                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {purchaseError && (
            <div
              role="alert"
              className="m-4 rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200"
            >
              {purchaseError}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-black/20 text-xs uppercase tracking-wide text-white/60">
                <tr>
                  <th className="px-5 py-4 font-semibold">Purchase date</th>
                  <th className="px-5 py-4 font-semibold">Material</th>
                  <th className="px-5 py-4 font-semibold">Supplier</th>
                  <th className="px-5 py-4 font-semibold">Quantity</th>
                  <th className="px-5 py-4 font-semibold">Unit cost</th>
                  <th className="px-5 py-4 font-semibold">Total cost</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {purchaseError ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-white/70"
                    >
                      Unable to load purchase history.
                    </td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <ShoppingCart
                        size={30}
                        className="mx-auto text-white/40"
                      />

                      <p className="mt-3 font-semibold text-white">
                        No purchases found
                      </p>

                      <p className="mt-1 text-xs text-white/60">
                        Record a purchase to start building your history.
                      </p>
                    </td>
                  </tr>
                ) : (
                  purchases.map((purchase) => {
                    const materialName =
                      purchase.raw_material_name ||
                      materials.find(
                        (material) =>
                          material.id === purchase.raw_material_id
                      )?.name ||
                      "Unknown material";

                    return (
                      <tr
                        key={purchase.id}
                        className="transition-colors hover:bg-black/20"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-white/75">
                          <span className="inline-flex items-center gap-2">
                            <CalendarDays
                              size={15}
                              className="text-white/40"
                            />
                            {formatDate(purchase.purchase_date)}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-semibold text-white">
                          {materialName}
                        </td>

                        <td className="px-5 py-4 text-white/65">
                          {purchase.supplier_name || "—"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-white/80">
                          {formatNumber(purchase.quantity)}{" "}
                          {purchase.base_unit || ""}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-white/80">
                          {formatMoney(purchase.unit_cost)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-orange-300">
                          {formatMoney(purchase.total_cost)}
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

      {/* Register material modal */}
      {showMaterialForm && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowMaterialForm(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="material-form-title"
            className="my-auto w-full max-w-lg rounded-2xl border border-white/10 bg-[#111111] text-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h3 id="material-form-title" className="text-lg font-bold">
                  Register raw material
                </h3>

                <p className="mt-1 text-xs text-white/60">
                  Add an ingredient or supply to the farm catalogue.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowMaterialForm(false)}
                disabled={saving}
                aria-label="Close form"
                className="grid size-9 place-items-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </header>

            <form
              onSubmit={handleCreateMaterial}
              className="space-y-4 p-5"
            >
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
                  htmlFor="material-name"
                  className="mb-1.5 block text-xs font-semibold text-white/80"
                >
                  Material name
                </label>

                <input
                  id="material-name"
                  name="name"
                  value={materialForm.name}
                  onChange={updateMaterialField}
                  placeholder="e.g. Maize"
                  maxLength={150}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="material-unit"
                  className="mb-1.5 block text-xs font-semibold text-white/80"
                >
                  Base unit
                </label>

                <select
                  id="material-unit"
                  name="base_unit"
                  value={materialForm.base_unit}
                  onChange={updateMaterialField}
                  className={inputClass}
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="litre">Litres</option>
                  <option value="piece">Pieces</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="material-description"
                  className="mb-1.5 block text-xs font-semibold text-white/80"
                >
                  Description{" "}
                  <span className="font-normal text-white/40">(optional)</span>
                </label>

                <textarea
                  id="material-description"
                  name="description"
                  value={materialForm.description}
                  onChange={updateMaterialField}
                  rows={3}
                  placeholder="Describe this material..."
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowMaterialForm(false)}
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
                  {saving ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}

                  {saving ? "Saving..." : "Register material"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Record purchase modal */}
      {showPurchaseForm && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowPurchaseForm(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="purchase-form-title"
            className="my-auto w-full max-w-lg rounded-2xl border border-white/10 bg-[#111111] text-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h3 id="purchase-form-title" className="text-lg font-bold">
                  Record material purchase
                </h3>

                <p className="mt-1 text-xs text-white/60">
                  Enter the purchase quantity, supplier, and cost.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPurchaseForm(false)}
                disabled={saving}
                aria-label="Close form"
                className="grid size-9 place-items-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </header>

            <form
              onSubmit={handleCreatePurchase}
              className="space-y-4 p-5"
            >
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
                  htmlFor="purchase-material"
                  className="mb-1.5 block text-xs font-semibold text-white/80"
                >
                  Raw material
                </label>

                <select
                  id="purchase-material"
                  name="raw_material_id"
                  value={purchaseForm.raw_material_id}
                  onChange={updatePurchaseField}
                  required
                  className={inputClass}
                >
                  <option value="">Select a material</option>

                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name} · {material.base_unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="purchase-date"
                    className="mb-1.5 block text-xs font-semibold text-white/80"
                  >
                    Purchase date
                  </label>

                  <input
                    id="purchase-date"
                    name="purchase_date"
                    type="date"
                    max={getLocalDate()}
                    value={purchaseForm.purchase_date}
                    onChange={updatePurchaseField}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="purchase-supplier"
                    className="mb-1.5 block text-xs font-semibold text-white/80"
                  >
                    Supplier{" "}
                    <span className="font-normal text-white/40">(optional)</span>
                  </label>

                  <input
                    id="purchase-supplier"
                    name="supplier_name"
                    value={purchaseForm.supplier_name}
                    onChange={updatePurchaseField}
                    placeholder="Supplier name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="purchase-quantity"
                    className="mb-1.5 block text-xs font-semibold text-white/80"
                  >
                    Quantity
                  </label>

                  <input
                    id="purchase-quantity"
                    name="quantity"
                    type="number"
                    min="0.001"
                    step="any"
                    value={purchaseForm.quantity}
                    onChange={updatePurchaseField}
                    placeholder="e.g. 100"
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="purchase-unit-cost"
                    className="mb-1.5 block text-xs font-semibold text-white/80"
                  >
                    Unit cost (KSh)
                  </label>

                  <input
                    id="purchase-unit-cost"
                    name="unit_cost"
                    type="number"
                    min="0"
                    step="any"
                    value={purchaseForm.unit_cost}
                    onChange={updatePurchaseField}
                    placeholder="e.g. 55"
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-orange-400/20 bg-orange-500/5 p-3">
                <p className="text-xs text-white/60">
                  Estimated purchase total
                </p>

                <p className="mt-1 text-xl font-extrabold text-orange-300">
                  {formatMoney(
                    Number(purchaseForm.quantity || 0) *
                      Number(purchaseForm.unit_cost || 0)
                  )}
                </p>
              </div>

              <div>
                <label
                  htmlFor="purchase-notes"
                  className="mb-1.5 block text-xs font-semibold text-white/80"
                >
                  Notes{" "}
                  <span className="font-normal text-white/40">(optional)</span>
                </label>

                <textarea
                  id="purchase-notes"
                  name="notes"
                  value={purchaseForm.notes}
                  onChange={updatePurchaseField}
                  rows={3}
                  placeholder="Additional purchase details..."
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowPurchaseForm(false)}
                  disabled={saving}
                  className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || materials.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <ShoppingCart size={16} />
                  )}

                  {saving ? "Saving..." : "Save purchase"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}

export default RawMaterials;
