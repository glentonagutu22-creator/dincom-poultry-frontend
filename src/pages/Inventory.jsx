
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Egg,
  Factory,
  Layers3,
  Package,
  RefreshCw,
  Search,
  Wheat,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout/DashboardLayout";
import {
  getInventoryOverview,
  getRawMaterialInventory,
  getFinishedFeedInventory,
} from "../services/inventoryService";

const panelClass =
  "rounded-2xl border border-white/10 bg-[#171717]/80 shadow-lg shadow-black/10";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#202020] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-orange-500";

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-200 transition hover:bg-white/10 disabled:opacity-50";

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value, maximumFractionDigits = 2) {
  return numberValue(value).toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
}

function formatMoney(value) {
  return `KSh ${numberValue(value).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function birdTypeLabel(value) {
  const labels = {
    broiler: "Broiler",
    layer: "Layer",
    dual_purpose: "Dual purpose",
  };

  return labels[value] || value || "Unspecified";
}

function SummaryCard({ title, value, description, icon: Icon, warning }) {
  return (
    <div
      className={`${panelClass} p-5 transition duration-200 hover:border-white/20`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-400">{title}</p>
          <p
            className={`mt-3 break-words text-2xl font-bold ${
              warning ? "text-red-400" : "text-white"
            }`}
          >
            {value}
          </p>
          <p className="mt-2 text-xs text-gray-500">{description}</p>
        </div>

        <div
          className={`rounded-xl p-3 ${
            warning ? "bg-red-500/10 text-red-400" : "bg-orange-500/10 text-orange-400"
          }`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, description, count }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-orange-500/10 p-3 text-orange-400">
          <Icon size={22} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm text-gray-400">{description}</p>
        </div>
      </div>

      {count !== undefined && (
        <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
          {count} records
        </span>
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="px-5 py-12 text-center">
      <Package className="mx-auto text-gray-600" size={36} />
      <p className="mt-3 text-sm text-gray-300">{message}</p>
    </div>
  );
}

export default function Inventory() {
  const [overview, setOverview] = useState(null);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [finishedFeed, setFinishedFeed] = useState([]);

  const [activeTab, setActiveTab] = useState("raw-materials");
  const [search, setSearch] = useState("");
  const [birdTypeFilter, setBirdTypeFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [overviewData, materialsData, feedData] = await Promise.all([
        getInventoryOverview(),
        getRawMaterialInventory(),
        getFinishedFeedInventory(),
      ]);

      setOverview(overviewData || {});
      setRawMaterials(materialsData);
      setFinishedFeed(feedData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err.message ||
          "Unable to load inventory. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const rawSummary = overview?.raw_materials || {};
  const feedSummary = overview?.finished_feed || {};

  const negativeStockCount = numberValue(
    rawSummary.materials_with_negative_stock
  );

  const filteredRawMaterials = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rawMaterials.filter((item) => {
      const matchesSearch = [
        item.raw_material_name,
        item.base_unit,
      ].some((value) => String(value || "").toLowerCase().includes(query));

      return matchesSearch;
    });
  }, [rawMaterials, search]);

  const filteredFinishedFeed = useMemo(() => {
    const query = search.trim().toLowerCase();

    return finishedFeed.filter((item) => {
      const matchesSearch = [
        item.formula_name,
        item.batch_number,
        item.bird_type,
      ].some((value) => String(value || "").toLowerCase().includes(query));

      const matchesBirdType =
        birdTypeFilter === "all" || item.bird_type === birdTypeFilter;

      return matchesSearch && matchesBirdType;
    });
  }, [finishedFeed, search, birdTypeFilter]);

  const tabs = [
    {
      id: "raw-materials",
      label: "Raw Materials",
      count: rawMaterials.length,
      icon: Wheat,
    },
    {
      id: "finished-feed",
      label: "Finished Feed",
      count: finishedFeed.length,
      icon: Layers3,
    },
  ];

  return (
    <DashboardLayout background="eggs">
      <div className="min-h-screen space-y-6 bg-[#111111]/75 px-4 py-6 text-white sm:px-6 lg:px-8">
        {/* Page heading */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-orange-400">
              <Boxes size={16} />
              <span>Farm Operations</span>
              <span className="text-gray-600">/</span>
              <span className="text-gray-400">Inventory</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Inventory Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
              Monitor raw materials, finished feed, stock balances, and
              estimated inventory value.
            </p>

            {lastUpdated && (
              <p className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <CalendarDays size={14} />
                Updated {lastUpdated.toLocaleTimeString("en-KE")}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={loadInventory}
            disabled={loading}
            className={secondaryButtonClass}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            {loading ? "Refreshing..." : "Refresh inventory"}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={20}
                className="mt-0.5 shrink-0 text-red-400"
              />
              <div>
                <p className="font-medium text-red-300">
                  Inventory could not be fully loaded
                </p>
                <p className="mt-1 text-sm text-red-200/80">{error}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadInventory}
              className="w-fit rounded-lg border border-red-400/20 px-3 py-2 text-sm text-red-200 hover:bg-red-500/10"
            >
              Try again
            </button>
          </div>
        )}

        {/* Overview cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Raw Material Types"
            value={loading && !overview ? "—" : formatNumber(rawSummary.raw_material_types, 0)}
            description="Active raw materials"
            icon={Wheat}
          />

          <SummaryCard
            title="Estimated Raw Stock Value"
            value={loading && !overview ? "—" : formatMoney(rawSummary.estimated_remaining_stock_value)}
            description="Based on purchases and production usage"
            icon={Package}
          />

          <SummaryCard
            title="Finished Feed Remaining"
            value={
              loading && !overview
                ? "—"
                : `${formatNumber(feedSummary.total_remaining_kg)} kg`
            }
            description={`${formatNumber(feedSummary.inventory_records, 0)} inventory records`}
            icon={Layers3}
          />

          <SummaryCard
            title="Stock Warnings"
            value={loading && !overview ? "—" : formatNumber(negativeStockCount, 0)}
            description="Raw materials with negative estimated stock"
            icon={AlertTriangle}
            warning={negativeStockCount > 0}
          />
        </div>

        {/* Additional financial and production summary */}
        <div className={`${panelClass} p-5`}>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-orange-500/10 p-3 text-orange-400">
              <Factory size={21} />
            </div>
            <div>
              <h2 className="font-semibold text-white">Inventory Summary</h2>
              <p className="mt-1 text-sm text-gray-400">
                Combined overview of raw materials and manufactured feed.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-xs text-gray-500">Total raw-material purchase cost</p>
              <p className="mt-2 text-lg font-semibold">
                {loading && !overview ? "—" : formatMoney(rawSummary.total_purchase_cost)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Estimated finished-feed value</p>
              <p className="mt-2 text-lg font-semibold">
                {loading && !overview ? "—" : formatMoney(feedSummary.remaining_stock_value)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Total feed produced</p>
              <p className="mt-2 text-lg font-semibold">
                {loading && !overview
                  ? "—"
                  : `${formatNumber(feedSummary.total_produced_kg)} kg`}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Combined estimated stock value</p>
              <p className="mt-2 text-lg font-semibold text-orange-400">
                {loading && !overview
                  ? "—"
                  : formatMoney(
                      numberValue(rawSummary.estimated_remaining_stock_value) +
                        numberValue(feedSummary.remaining_stock_value)
                    )}
              </p>
            </div>
          </div>

          <p className="mt-5 border-t border-white/5 pt-4 text-xs leading-5 text-gray-500">
            Values are estimates from the inventory API. Raw-material purchase
            cost is historical spend, not current stock value. The combined
            stock value adds the estimated remaining raw-material value to the
            remaining finished-feed value.
          </p>
        </div>

        {/* Inventory lists */}
        <div className={`${panelClass} overflow-hidden`}>
          <div className="space-y-5 border-b border-white/10 p-5">
            <SectionHeading
              icon={Boxes}
              title="Stock Catalogue"
              description="Review material balances and finished-feed batches."
            />

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={
                    activeTab === "raw-materials"
                      ? "Search raw materials..."
                      : "Search formula or batch..."
                  }
                  className={`${inputClass} pl-10`}
                />
              </div>

              {activeTab === "finished-feed" && (
                <div className="relative lg:w-56">
                  <select
                    value={birdTypeFilter}
                    onChange={(event) => setBirdTypeFilter(event.target.value)}
                    className={`${inputClass} appearance-none pr-10`}
                    aria-label="Filter by bird type"
                  >
                    <option value="all">All bird types</option>
                    <option value="broiler">Broiler</option>
                    <option value="layer">Layer</option>
                    <option value="dual_purpose">Dual purpose</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSearch("");
                      setBirdTypeFilter("all");
                    }}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-orange-500 text-white"
                        : "border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        isActive ? "bg-white/20" : "bg-white/10"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === "raw-materials" ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-5 py-4 font-medium">Raw Material</th>
                    <th className="px-5 py-4 text-right font-medium">Purchased</th>
                    <th className="px-5 py-4 text-right font-medium">Used</th>
                    <th className="px-5 py-4 text-right font-medium">Estimated Remaining</th>
                    <th className="px-5 py-4 text-right font-medium">Average Unit Cost</th>
                    <th className="px-5 py-4 text-right font-medium">Estimated Stock Value</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {loading && rawMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                        Loading raw-material inventory...
                      </td>
                    </tr>
                  ) : filteredRawMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <EmptyState message="No raw materials match your search." />
                      </td>
                    </tr>
                  ) : (
                    filteredRawMaterials.map((item) => {
                      const remaining = numberValue(item.estimated_remaining_stock);
                      const isNegative = remaining < 0;

                      return (
                        <tr
                          key={item.raw_material_id}
                          className="transition hover:bg-white/[0.025]"
                        >
                          <td className="px-5 py-4">
                            <div className="font-medium text-white">
                              {item.raw_material_name || "Unnamed material"}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              Unit: {item.base_unit || "—"}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-right text-gray-300">
                            {formatNumber(item.total_purchased)} {item.base_unit || ""}
                          </td>

                          <td className="px-5 py-4 text-right text-gray-300">
                            {formatNumber(item.total_used)} kg
                          </td>

                          <td
                            className={`px-5 py-4 text-right font-semibold ${
                              isNegative ? "text-red-400" : "text-white"
                            }`}
                          >
                            {formatNumber(remaining)} {item.base_unit || ""}
                          </td>

                          <td className="px-5 py-4 text-right text-gray-300">
                            {formatMoney(item.average_purchase_cost_per_unit)}
                            <span className="text-xs text-gray-500">
                              {" "}/ {item.base_unit || "unit"}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right text-gray-300">
                            {formatMoney(item.estimated_remaining_stock_value)}
                          </td>

                          <td className="px-5 py-4">
                            {isNegative ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs text-red-300">
                                <AlertTriangle size={13} />
                                Negative stock
                              </span>
                            ) : remaining === 0 ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-1 text-xs text-yellow-300">
                                <AlertTriangle size={13} />
                                No stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
                                <CheckCircle2 size={13} />
                                Positive balance
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
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-5 py-4 font-medium">Feed Formula</th>
                    <th className="px-5 py-4 font-medium">Production Batch</th>
                    <th className="px-5 py-4 font-medium">Bird Type</th>
                    <th className="px-5 py-4 font-medium">Production Date</th>
                    <th className="px-5 py-4 text-right font-medium">Produced</th>
                    <th className="px-5 py-4 text-right font-medium">Remaining</th>
                    <th className="px-5 py-4 text-right font-medium">Cost / kg</th>
                    <th className="px-5 py-4 text-right font-medium">Stock Value</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {loading && finishedFeed.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                        Loading finished-feed inventory...
                      </td>
                    </tr>
                  ) : filteredFinishedFeed.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <EmptyState message="No finished-feed batches match your filters." />
                      </td>
                    </tr>
                  ) : (
                    filteredFinishedFeed.map((item) => (
                      <tr
                        key={item.inventory_id}
                        className="transition hover:bg-white/[0.025]"
                      >
                        <td className="px-5 py-4">
                          <div className="font-medium text-white">
                            {item.formula_name || "Unknown formula"}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {item.formula_id
                              ? `Formula ID: ${item.formula_id}`
                              : "No formula linked"}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-gray-300">
                          {item.batch_number || "—"}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-300">
                            {birdTypeLabel(item.bird_type)}
                          </span>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap text-gray-400">
                          {formatDate(item.production_date)}
                        </td>

                        <td className="px-5 py-4 text-right text-gray-300">
                          {formatNumber(item.quantity_produced_kg)} kg
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-white">
                          {formatNumber(item.quantity_remaining_kg)} kg
                        </td>

                        <td className="px-5 py-4 text-right text-gray-300">
                          {formatMoney(item.cost_per_kg)}
                        </td>

                        <td className="px-5 py-4 text-right font-medium text-orange-400">
                          {formatMoney(item.remaining_stock_value)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-white/10 px-5 py-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing{" "}
              {activeTab === "raw-materials"
                ? filteredRawMaterials.length
                : filteredFinishedFeed.length}{" "}
              of{" "}
              {activeTab === "raw-materials"
                ? rawMaterials.length
                : finishedFeed.length}{" "}
              records
            </span>
            <span>Inventory data is supplied by the DINCOM API.</span>
          </div>
        </div>

        {/* Important note */}
        <div className="flex items-start gap-3 rounded-xl border border-orange-500/15 bg-orange-500/5 p-4">
          <AlertTriangle size={19} className="mt-0.5 shrink-0 text-orange-400" />
          <p className="text-sm leading-6 text-gray-400">
            <span className="font-medium text-orange-300">Stock accuracy:</span>{" "}
            raw-material balances are estimated from purchase quantities minus
            recorded production usage. Finished feed is tracked using recorded
            production batches. These endpoints currently provide inventory
            viewing only; they do not add purchases or issue stock.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
