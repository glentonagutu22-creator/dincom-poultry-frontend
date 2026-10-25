
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Egg,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  ShoppingBasket,
  TrendingUp,
  X,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout/DashboardLayout";
import {
  getEggSales,
  getEggSalesSummary,
  createEggSale,
} from "../services/eggSalesService";

const panelClass =
  "rounded-2xl border border-white/10 bg-[#171717]/80 shadow-lg shadow-black/10";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#202020] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-orange-500";

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-200 transition hover:bg-white/10 disabled:opacity-50";

function numeric(value) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function formatNumber(value) {
  return numeric(value).toLocaleString("en-KE", {
    maximumFractionDigits: 2,
  });
}

function formatMoney(value) {
  return `KSh ${numeric(value).toLocaleString("en-KE", {
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

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function SummaryCard({ title, value, description, icon: Icon }) {
  return (
    <div className={`${panelClass} p-5 transition hover:border-white/20`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-400">{title}</p>
          <p className="mt-3 break-words text-2xl font-bold text-white">
            {value}
          </p>
          <p className="mt-2 text-xs text-gray-500">{description}</p>
        </div>

        <div className="rounded-xl bg-orange-500/10 p-3 text-orange-400">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children, hint }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs leading-5 text-gray-500">{hint}</p>}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="px-5 py-12 text-center">
      <ShoppingBasket className="mx-auto text-gray-600" size={36} />
      <p className="mt-3 text-sm text-gray-300">{message}</p>
    </div>
  );
}

export default function EggSales() {
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState({});

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [saleDate, setSaleDate] = useState(getToday());
  const [buyerName, setBuyerName] = useState("");
  const [flockId, setFlockId] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSales = useCallback(async () => {
    if (startDate && endDate && startDate > endDate) {
      setError("Start date cannot be after end date.");
      return;
    }

    setLoading(true);
    setError("");

    const filters = {
      start_date: startDate,
      end_date: endDate,
    };

    try {
      const [salesData, summaryData] = await Promise.all([
        getEggSales(filters),
        getEggSalesSummary(filters),
      ]);

      setSales(salesData);
      setSummary(summaryData);
    } catch (err) {
      setError(err.message || "Unable to load egg sales.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return sales;

    return sales.filter((sale) =>
      [
        sale.buyer_name,
        sale.notes,
        sale.id,
        sale.flock_id,
        sale.quantity_eggs,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      )
    );
  }, [sales, search]);

  const quantityValue = numeric(quantity);
  const priceValue = numeric(price);
  const previewTotal = quantityValue * priceValue;

  function resetForm() {
    setQuantity("");
    setPrice("");
    setSaleDate(getToday());
    setBuyerName("");
    setFlockId("");
    setNotes("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(price);

    if (!Number.isSafeInteger(parsedQuantity) || parsedQuantity <= 0) {
      setError("Quantity must be a positive whole number of eggs.");
      return;
    }

    if (
      price.trim() === "" ||
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0
    ) {
      setError("Enter a valid, non-negative price per egg.");
      return;
    }

    if (buyerName.length > 150) {
      setError("Buyer name cannot exceed 150 characters.");
      return;
    }

    if (flockId.trim()) {
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      if (!uuidPattern.test(flockId.trim())) {
        setError("Flock ID must be a valid UUID.");
        return;
      }
    }

    if (!saleDate) {
      setError("Please select a sale date.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        quantity_eggs: parsedQuantity,
        price_per_egg: parsedPrice,
        sale_date: saleDate,
        buyer_name: buyerName.trim() || null,
        flock_id: flockId.trim() || null,
        notes: notes.trim() || null,
      };

      await createEggSale(payload);

      resetForm();
      setShowForm(false);
      setSuccess("Egg sale recorded successfully.");

      await loadSales();
    } catch (err) {
      setError(err.message || "Unable to record the egg sale.");
    } finally {
      setSubmitting(false);
    }
  }

  function clearDateFilters() {
    setStartDate("");
    setEndDate("");
    setSearch("");
  }

  return (
    <DashboardLayout background="eggs">
      <div className="min-h-screen space-y-6 bg-[#111111]/75 px-4 py-6 text-white sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-orange-400">
              <Egg size={16} />
              <span>Farm Operations</span>
              <span className="text-gray-600">/</span>
              <span className="text-gray-400">Egg Sales</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Egg Sales
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
              Record egg sales, review revenue, and track your sales history.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadSales}
              disabled={loading}
              className={secondaryButton}
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccess("");
                setShowForm(true);
              }}
              className={primaryButton}
            >
              <Plus size={17} />
              Record Sale
            </button>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200"
          >
            <CheckCircle2
              size={19}
              className="mt-0.5 shrink-0 text-emerald-400"
            />
            <span>{success}</span>
          </div>
        )}

        {/* Date filters */}
        <div className={`${panelClass} p-5`}>
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays size={18} className="text-orange-400" />
            <h2 className="font-semibold">Filter sales by date</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-end">
            <FormField label="Start date">
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => setStartDate(event.target.value)}
                className={inputClass}
              />
            </FormField>

            <FormField label="End date">
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
                className={inputClass}
              />
            </FormField>

            <button
              type="button"
              onClick={loadSales}
              disabled={loading || Boolean(startDate && endDate && startDate > endDate)}
              className={primaryButton}
            >
              Apply filters
            </button>

            <button
              type="button"
              onClick={clearDateFilters}
              className={secondaryButton}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Revenue"
            value={loading && !summary.sales_records ? "—" : formatMoney(summary.total_revenue)}
            description="Revenue for the selected period"
            icon={TrendingUp}
          />

          <SummaryCard
            title="Eggs Sold"
            value={loading && !summary.sales_records ? "—" : formatNumber(summary.eggs_sold)}
            description="Total individual eggs sold"
            icon={Egg}
          />

          <SummaryCard
            title="Sales Records"
            value={loading ? "—" : formatNumber(summary.sales_records)}
            description="Number of recorded sales"
            icon={ClipboardList}
          />

          <SummaryCard
            title="Average Price per Egg"
            value={loading && !summary.sales_records ? "—" : formatMoney(summary.average_selling_price_per_egg)}
            description="Weighted average selling price"
            icon={ShoppingBasket}
          />
        </div>

        {/* Sale form */}
        {showForm && (
          <div className={`${panelClass} overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h2 className="text-lg font-semibold">Record an Egg Sale</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Enter the sale details below.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
                aria-label="Close sale form"
                className="rounded-lg p-2 text-gray-400 transition hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <FormField label="Quantity of eggs *">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    placeholder="e.g. 120"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Price per egg (KSh) *">
                  <input
                    type="number"
                    min="0"
                    max="9999999999.99"
                    step="0.01"
                    required
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    placeholder="e.g. 20"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Sale date *">
                  <input
                    type="date"
                    required
                    value={saleDate}
                    onChange={(event) => setSaleDate(event.target.value)}
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Buyer name" hint="Optional; maximum 150 characters.">
                  <input
                    type="text"
                    maxLength={150}
                    value={buyerName}
                    onChange={(event) => setBuyerName(event.target.value)}
                    placeholder="Customer or business name"
                    className={inputClass}
                  />
                </FormField>

                <FormField
                  label="Flock ID"
                  hint="Optional. Enter the flock's UUID if you know it."
                >
                  <input
                    type="text"
                    value={flockId}
                    onChange={(event) => setFlockId(event.target.value)}
                    placeholder="Flock UUID"
                    className={inputClass}
                  />
                </FormField>

                <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
                  <p className="text-xs text-gray-400">Estimated sale total</p>
                  <p className="mt-2 text-2xl font-bold text-orange-400">
                    {formatMoney(previewTotal)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatNumber(quantityValue)} eggs × {formatMoney(priceValue)}
                  </p>
                </div>
              </div>

              <FormField label="Notes" hint="Optional details about this sale.">
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Add any relevant sale notes..."
                  className={inputClass}
                />
              </FormField>

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                  disabled={submitting}
                  className={secondaryButton}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className={primaryButton}
                >
                  {submitting ? (
                    <>
                      <LoaderCircle size={17} className="animate-spin" />
                      Saving sale...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={17} />
                      Save Sale
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sales history */}
        <div className={`${panelClass} overflow-hidden`}>
          <div className="space-y-4 border-b border-white/10 p-5">
            <div>
              <h2 className="text-lg font-semibold">Sales History</h2>
              <p className="mt-1 text-sm text-gray-400">
                Browse recorded sales for the selected period.
              </p>
            </div>

            <div className="relative max-w-xl">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search buyer, notes, sale ID, or flock ID..."
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-medium">Sale Date</th>
                  <th className="px-5 py-4 font-medium">Buyer</th>
                  <th className="px-5 py-4 text-right font-medium">Eggs Sold</th>
                  <th className="px-5 py-4 text-right font-medium">Price / Egg</th>
                  <th className="px-5 py-4 text-right font-medium">Total Amount</th>
                  <th className="px-5 py-4 font-medium">Notes</th>
                  <th className="px-5 py-4 font-medium">Sale ID</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {loading && sales.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-gray-400"
                    >
                      <LoaderCircle
                        size={20}
                        className="mx-auto mb-2 animate-spin"
                      />
                      Loading egg sales...
                    </td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState message="No sales found for the selected filters." />
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.id} className="transition hover:bg-white/[0.025]">
                      <td className="whitespace-nowrap px-5 py-4 text-gray-300">
                        {formatDate(sale.sale_date)}
                      </td>

                      <td className="px-5 py-4 font-medium text-white">
                        {sale.buyer_name || "Walk-in customer"}
                      </td>

                      <td className="px-5 py-4 text-right text-gray-300">
                        {formatNumber(sale.quantity_eggs)}
                      </td>

                      <td className="px-5 py-4 text-right text-gray-300">
                        {formatMoney(sale.price_per_egg)}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-orange-400">
                        {formatMoney(sale.total_amount)}
                      </td>

                      <td className="max-w-[220px] truncate px-5 py-4 text-gray-400" title={sale.notes || ""}>
                        {sale.notes || "—"}
                      </td>

                      <td
                        className="max-w-[180px] truncate px-5 py-4 font-mono text-xs text-gray-500"
                        title={sale.id || ""}
                      >
                        {sale.id || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-white/10 px-5 py-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {filteredSales.length} of {sales.length} sales
            </span>
            <span>Totals are calculated by the backend.</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
