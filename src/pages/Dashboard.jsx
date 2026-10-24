

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bird,
  Egg,
  Wheat,
  Wallet,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  Hash,
  TrendingUp,
  Activity,
  ArrowUpRight,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout/DashboardLayout";
import { getFlocks } from "../services/flockService";
import { getProduction } from "../services/productionService";
import { getFinishedFeedInventory } from "../services/inventoryService";
import { getExpenseSummary } from "../services/expenseService";

const cardClass =
  "rounded-xl border border-white/15 bg-[#111111]/75 p-4 text-white shadow-lg backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-[#111111]/80 sm:p-5";

const getLocalDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getMonthStart = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-01`;
};

const formatNumber = (value, decimals = 0) =>
  Number(value ?? 0).toLocaleString("en-KE", {
    maximumFractionDigits: decimals,
  });

const formatCurrency = (value) =>
  `KSh ${formatNumber(value, 2)}`;

const formatDate = (value) => {
  if (!value) return "—";

  // Preserve the calendar date supplied by the API.
  const datePart = String(value).slice(0, 10);
  const date = new Date(`${datePart}T12:00:00`);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getProductionDate = (record) => {
  if (!record?.production_date) return "";

  return String(record.production_date).slice(0, 10);
};

function SummaryCard({ label, value, icon: Icon, description }) {
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

      {description && (
        <p className="mt-2 text-xs leading-5 text-white/55">
          {description}
        </p>
      )}
    </article>
  );
}

function SectionHeading({ title, description, action }) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <h3 className="font-bold text-white">{title}</h3>
        {description && (
          <p className="mt-1 text-xs leading-5 text-white/60">
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

function Dashboard() {
  const [flocks, setFlocks] = useState([]);
  const [production, setProduction] = useState([]);
  const [finishedFeed, setFinishedFeed] = useState([]);
  const [expenseSummary, setExpenseSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const today = getLocalDate();
  const monthStart = getMonthStart();

  const loadDashboard = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setErrors({});
    setNotice("");

    const startDate = getMonthStart();
    const endDate = getLocalDate();

    const results = await Promise.allSettled([
      getFlocks(),
      getProduction(),
      getFinishedFeedInventory(),
      getExpenseSummary(startDate, endDate),
    ]);

    const nextErrors = {};

    const [flocksResult, productionResult, feedResult, expensesResult] =
      results;

    if (
      flocksResult.status === "fulfilled" &&
      Array.isArray(flocksResult.value)
    ) {
      setFlocks(flocksResult.value);
    } else {
      nextErrors.flocks =
        flocksResult.status === "rejected"
          ? flocksResult.reason?.message || "Unable to load flocks."
          : "Unexpected response from the flocks API.";
    }

    if (
      productionResult.status === "fulfilled" &&
      Array.isArray(productionResult.value)
    ) {
      setProduction(productionResult.value);
    } else {
      nextErrors.production =
        productionResult.status === "rejected"
          ? productionResult.reason?.message ||
            "Unable to load production records."
          : "Unexpected response from the production API.";
    }

    if (
      feedResult.status === "fulfilled" &&
      Array.isArray(feedResult.value)
    ) {
      setFinishedFeed(feedResult.value);
    } else {
      nextErrors.feed =
        feedResult.status === "rejected"
          ? feedResult.reason?.message ||
            "Unable to load finished feed inventory."
          : "Unexpected response from the inventory API.";
    }

    if (
      expensesResult.status === "fulfilled" &&
      expensesResult.value &&
      typeof expensesResult.value === "object"
    ) {
      setExpenseSummary(expensesResult.value);
    } else {
      nextErrors.expenses =
        expensesResult.status === "rejected"
          ? expensesResult.reason?.message ||
            "Unable to load expense summary."
          : "Unexpected response from the expense API.";
    }

    setErrors(nextErrors);
    setLastUpdated(new Date());

    if (Object.keys(nextErrors).length === 0) {
      setNotice("Dashboard data loaded successfully.");
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Flock statistics
  const activeFlocks = useMemo(
    () =>
      flocks.filter(
        (flock) => String(flock.status).toLowerCase() === "active"
      ),
    [flocks]
  );

  const totalBirds = useMemo(
    () =>
      flocks.reduce(
        (total, flock) =>
          total + (Number(flock.current_quantity) || 0),
        0
      ),
    [flocks]
  );

  const activeBirds = useMemo(
    () =>
      activeFlocks.reduce(
        (total, flock) =>
          total + (Number(flock.current_quantity) || 0),
        0
      ),
    [activeFlocks]
  );

  // Today's egg production
  const todayRecords = useMemo(
    () =>
      production.filter(
        (record) => getProductionDate(record) === today
      ),
    [production, today]
  );

  const eggsToday = useMemo(
    () =>
      todayRecords.reduce(
        (total, record) =>
          total + (Number(record.eggs_collected) || 0),
        0
      ),
    [todayRecords]
  );

  const brokenEggsToday = useMemo(
    () =>
      todayRecords.reduce(
        (total, record) =>
          total + (Number(record.broken_eggs) || 0),
        0
      ),
    [todayRecords]
  );

  const usableEggsToday = Math.max(0, eggsToday - brokenEggsToday);

  // Finished feed inventory
  const totalFeedKg = useMemo(
    () =>
      finishedFeed.reduce(
        (total, item) =>
          total + (Number(item.quantity_remaining_kg) || 0),
        0
      ),
    [finishedFeed]
  );

  const totalFeedValue = useMemo(
    () =>
      finishedFeed.reduce(
        (total, item) =>
          total + (Number(item.remaining_stock_value) || 0),
        0
      ),
    [finishedFeed]
  );

  // Monthly expenses
  const totalExpenses = Number(expenseSummary?.total_expenses) || 0;
  const expenseRecords = Number(expenseSummary?.records_count) || 0;
  const flockExpenses =
    Number(expenseSummary?.flock_specific_expenses) || 0;
  const generalExpenses =
    Number(expenseSummary?.general_farm_expenses) || 0;

  // Seven-day production summary
  const weeklyProduction = useMemo(() => {
    const days = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - offset);

      const key = getLocalDate(date);

      const total = production
        .filter((record) => getProductionDate(record) === key)
        .reduce(
          (sum, record) =>
            sum + (Number(record.eggs_collected) || 0),
          0
        );

      days.push({
        key,
        label: date.toLocaleDateString("en-KE", {
          weekday: "short",
        }),
        dateLabel: date.toLocaleDateString("en-KE", {
          day: "numeric",
          month: "short",
        }),
        total,
      });
    }

    return days;
  }, [production]);

  const maxEggs = Math.max(
    1,
    ...weeklyProduction.map((day) => day.total)
  );

  const recentProduction = useMemo(
    () =>
      [...production]
        .sort((a, b) =>
          getProductionDate(b).localeCompare(getProductionDate(a))
        )
        .slice(0, 5),
    [production]
  );

  const hasErrors = Object.keys(errors).length > 0;

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
              Dashboard
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
              Monitor your poultry farm, track egg production, check feed
              inventory, and review farm expenses.
            </p>

            <p className="mt-2 flex items-center gap-2 text-xs text-white/50">
              <CalendarDays size={14} />
              {new Date().toLocaleDateString("en-KE", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {lastUpdated && (
                <span>
                  · Updated{" "}
                  {lastUpdated.toLocaleTimeString("en-KE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadDashboard(true)}
            disabled={loading || refreshing}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg border border-white/15 px-4 py-2.5 text-sm font-bold text-white/85 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw
              size={16}
              className={refreshing || loading ? "animate-spin" : ""}
            />
            {refreshing || loading ? "Refreshing..." : "Refresh data"}
          </button>
        </section>

        {/* Notifications */}
        {notice && !hasErrors && (
          <div className="flex items-start gap-2 rounded-lg border border-green-400/20 bg-green-500/10 p-3 text-sm text-green-200">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <p className="flex-1">{notice}</p>
          </div>
        )}

        {hasErrors && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">
                Some dashboard information could not be loaded.
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-red-200/80">
                {Object.entries(errors).map(([key, message]) => (
                  <li key={key}>{message}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-red-200/70">
                Use Refresh data to try again. A failed request is not treated
                as a confirmed zero.
              </p>
            </div>
          </div>
        )}

        {/* Summary cards */}
        <section>
          <div className="mb-4">
            <h3 className="font-bold text-white">Farm Overview</h3>
            <p className="mt-1 text-xs text-white/60">
              Live figures from your connected modules.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <SummaryCard
              label="Total flocks"
              value={loading && flocks.length === 0 && errors.flocks ? "—" : formatNumber(flocks.length)}
              icon={Bird}
              description={`${formatNumber(activeFlocks.length)} active`}
            />

            <SummaryCard
              label="Current bird population"
              value={formatNumber(totalBirds)}
              icon={Hash}
              description={`${formatNumber(activeBirds)} birds in active flocks`}
            />

            <SummaryCard
              label="Eggs collected today"
              value={formatNumber(eggsToday)}
              icon={Egg}
              description={`${formatNumber(brokenEggsToday)} broken · ${formatNumber(usableEggsToday)} usable`}
            />

            <SummaryCard
              label="Finished feed stock"
              value={`${formatNumber(totalFeedKg, 2)} kg`}
              icon={Wheat}
              description={`Stock value: ${formatCurrency(totalFeedValue)}`}
            />

            <SummaryCard
              label="Expenses this month"
              value={formatCurrency(totalExpenses)}
              icon={Wallet}
              description={`${formatNumber(expenseRecords)} expense records`}
            />

            <SummaryCard
              label="Feed batches"
              value={formatNumber(finishedFeed.length)}
              icon={Activity}
              description="Finished feed inventory batches"
            />
          </div>
        </section>

        {/* Production and expenses */}
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {/* Egg production */}
          <div className="rounded-xl border border-white/15 bg-[#111111]/75 p-4 text-white shadow-lg backdrop-blur-sm sm:p-5">
            <SectionHeading
              title="Egg Production"
              description="Eggs collected over the last seven days."
              action={
                <a
                  href="/production"
                  className="inline-flex items-center gap-1 self-start text-xs font-bold text-orange-400 transition hover:text-orange-300"
                >
                  View production <ArrowUpRight size={14} />
                </a>
              }
            />

            {loading && production.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-white/60">
                <RefreshCw size={18} className="mr-2 animate-spin" />
                Loading production...
              </div>
            ) : errors.production ? (
              <div className="flex h-48 items-center justify-center text-sm text-white/60">
                Production information is unavailable.
              </div>
            ) : (
              <>
                <div className="mt-5 flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-lg bg-white/10 text-orange-400">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-white/60">
                      Collected today
                    </p>
                    <p className="text-xl font-extrabold text-white">
                      {formatNumber(eggsToday)} eggs
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid h-40 grid-cols-7 items-end gap-2 sm:gap-3">
                  {weeklyProduction.map((day) => (
                    <div
                      key={day.key}
                      title={`${day.dateLabel}: ${formatNumber(day.total)} eggs`}
                      className="flex h-full min-w-0 flex-col items-center justify-end"
                    >
                      <span className="mb-2 text-[10px] tabular-nums text-white/65">
                        {formatNumber(day.total)}
                      </span>

                      <div className="flex h-full w-full items-end justify-center">
                        <div
                          className={`w-full max-w-9 rounded-t-md transition-all ${
                            day.key === today
                              ? "bg-orange-400"
                              : "bg-orange-500/50"
                          }`}
                          style={{
                            height: `${Math.max(
                              day.total > 0 ? 6 : 2,
                              (day.total / maxEggs) * 100
                            )}%`,
                          }}
                        />
                      </div>

                      <span className="mt-2 text-[10px] text-white/55">
                        {day.label}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 border-t border-white/10 pt-3 text-xs text-white/45">
                  Historical records are grouped by production date. Days
                  without records show zero.
                </p>
              </>
            )}
          </div>

          {/* Expense breakdown */}
          <div className="rounded-xl border border-white/15 bg-[#111111]/75 p-4 text-white shadow-lg backdrop-blur-sm sm:p-5">
            <SectionHeading
              title="Expense Overview"
              description={`From ${formatDate(monthStart)} to ${formatDate(today)}.`}
              action={
                <a
                  href="/expenses"
                  className="inline-flex items-center gap-1 self-start text-xs font-bold text-orange-400 transition hover:text-orange-300"
                >
                  View expenses <ArrowUpRight size={14} />
                </a>
              }
            />

            {loading && !expenseSummary ? (
              <div className="flex h-48 items-center justify-center text-sm text-white/60">
                <RefreshCw size={18} className="mr-2 animate-spin" />
                Loading expenses...
              </div>
            ) : errors.expenses ? (
              <div className="flex h-48 items-center justify-center text-sm text-white/60">
                Expense information is unavailable.
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/60">
                    Total expenses this month
                  </p>
                  <p className="mt-2 break-words text-2xl font-extrabold text-orange-400">
                    {formatCurrency(totalExpenses)}
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    {formatNumber(expenseRecords)} records
                  </p>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm text-white/70">
                      Flock-specific expenses
                    </span>
                    <span className="text-sm font-bold text-white">
                      {formatCurrency(flockExpenses)}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-orange-400"
                      style={{
                        width: `${
                          totalExpenses > 0
                            ? Math.min(
                                100,
                                (flockExpenses / totalExpenses) * 100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm text-white/70">
                      General farm expenses
                    </span>
                    <span className="text-sm font-bold text-white">
                      {formatCurrency(generalExpenses)}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-white/50"
                      style={{
                        width: `${
                          totalExpenses > 0
                            ? Math.min(
                                100,
                                (generalExpenses / totalExpenses) * 100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {expenseRecords === 0 && (
                  <p className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-white/55">
                    No expense records have been returned for this period.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Finished feed inventory */}
        <section className="overflow-hidden rounded-xl border border-white/15 bg-[#111111]/75 text-white shadow-lg backdrop-blur-sm">
          <div className="flex flex-col gap-3 border-b border-white/15 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <SectionHeading
              title="Finished Feed Inventory"
              description="Remaining feed stock and its value."
            />

            <a
              href="/inventory"
              className="inline-flex items-center gap-1 self-start text-xs font-bold text-orange-400 transition hover:text-orange-300"
            >
              View inventory <ArrowUpRight size={14} />
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-black/20 text-xs uppercase tracking-wide text-white/60">
                <tr>
                  <th className="px-5 py-4 font-semibold">Feed formula</th>
                  <th className="px-5 py-4 font-semibold">Bird type</th>
                  <th className="px-5 py-4 font-semibold">Batch number</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Remaining stock
                  </th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Stock value
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {loading && finishedFeed.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <RefreshCw
                        size={21}
                        className="mx-auto animate-spin text-orange-400"
                      />
                      <p className="mt-3 text-sm text-white/60">
                        Loading feed inventory...
                      </p>
                    </td>
                  </tr>
                ) : errors.feed ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-white/60"
                    >
                      Unable to load finished feed inventory.
                    </td>
                  </tr>
                ) : finishedFeed.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <Wheat
                        size={28}
                        className="mx-auto text-white/40"
                      />
                      <p className="mt-3 font-semibold text-white">
                        No finished feed found
                      </p>
                      <p className="mt-1 text-xs text-white/60">
                        Feed batches will appear here when available.
                      </p>
                    </td>
                  </tr>
                ) : (
                  finishedFeed.slice(0, 5).map((item) => (
                    <tr
                      key={item.inventory_id}
                      className="transition-colors hover:bg-black/20"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">
                          {item.formula_name || "Unnamed formula"}
                        </p>
                        <p className="mt-1 text-xs text-white/50">
                          {formatDate(item.production_date)}
                        </p>
                      </td>

                      <td className="px-5 py-4 capitalize text-white/75">
                        {String(item.bird_type || "—").replaceAll("_", " ")}
                      </td>

                      <td className="px-5 py-4 text-white/60">
                        {item.batch_number || "—"}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold tabular-nums text-orange-400">
                        {formatNumber(item.quantity_remaining_kg, 2)} kg
                      </td>

                      <td className="px-5 py-4 text-right tabular-nums text-white/80">
                        {formatCurrency(item.remaining_stock_value)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {finishedFeed.length > 5 && (
            <p className="border-t border-white/10 px-5 py-3 text-xs text-white/50">
              Showing 5 of {finishedFeed.length} finished feed batches.
            </p>
          )}
        </section>

        {/* Recent production records */}
        <section className="overflow-hidden rounded-xl border border-white/15 bg-[#111111]/75 text-white shadow-lg backdrop-blur-sm">
          <div className="flex flex-col gap-3 border-b border-white/15 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <SectionHeading
              title="Recent Production"
              description="The latest egg collection records from your flocks."
            />

            <a
              href="/production"
              className="inline-flex items-center gap-1 self-start text-xs font-bold text-orange-400 transition hover:text-orange-300"
            >
              All records <ArrowUpRight size={14} />
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[550px] text-left text-sm">
              <thead className="bg-black/20 text-xs uppercase tracking-wide text-white/60">
                <tr>
                  <th className="px-5 py-4 font-semibold">Production date</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Eggs collected
                  </th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Broken eggs
                  </th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Usable eggs
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {loading && production.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center">
                      <RefreshCw
                        size={21}
                        className="mx-auto animate-spin text-orange-400"
                      />
                      <p className="mt-3 text-sm text-white/60">
                        Loading production records...
                      </p>
                    </td>
                  </tr>
                ) : errors.production ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-12 text-center text-white/60"
                    >
                      Unable to load production records.
                    </td>
                  </tr>
                ) : recentProduction.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center">
                      <Egg size={28} className="mx-auto text-white/40" />
                      <p className="mt-3 font-semibold text-white">
                        No production records yet
                      </p>
                      <p className="mt-1 text-xs text-white/60">
                        Recorded egg collections will appear here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  recentProduction.map((record) => {
                    const collected =
                      Number(record.eggs_collected) || 0;
                    const broken = Number(record.broken_eggs) || 0;
                    const usable = Math.max(0, collected - broken);

                    return (
                      <tr
                        key={record.id}
                        className="transition-colors hover:bg-black/20"
                      >
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2 text-white/80">
                            <CalendarDays
                              size={15}
                              className="text-white/50"
                            />
                            {formatDate(record.production_date)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right font-semibold tabular-nums text-white">
                          {formatNumber(collected)}
                        </td>

                        <td className="px-5 py-4 text-right tabular-nums text-white/70">
                          {formatNumber(broken)}
                        </td>

                        <td className="px-5 py-4 text-right font-semibold tabular-nums text-green-300">
                          {formatNumber(usable)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick actions */}
        <section className="space-y-4">
          <div>
            <h3 className="font-bold text-white">Quick Actions</h3>
            <p className="mt-1 text-xs text-white/60">
              Open a farm management module.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <a
              href="/flocks"
              className="group flex items-center justify-between gap-2 rounded-xl border border-white/15 bg-[#111111]/75 p-4 text-white transition hover:border-white/25 hover:bg-[#111111]/90"
            >
              <div>
                <div className="mb-3 grid size-9 place-items-center rounded-lg bg-white/10 text-orange-400">
                  <Bird size={20} />
                </div>
                <p className="text-sm font-bold">Manage Flocks</p>
                <p className="mt-1 text-xs text-white/55">
                  Manage bird batches
                </p>
              </div>
              <ArrowUpRight
                size={17}
                className="shrink-0 text-white/40 transition group-hover:text-orange-400"
              />
            </a>

            <a
              href="/production"
              className="group flex items-center justify-between gap-2 rounded-xl border border-white/15 bg-[#111111]/75 p-4 text-white transition hover:border-white/25 hover:bg-[#111111]/90"
            >
              <div>
                <div className="mb-3 grid size-9 place-items-center rounded-lg bg-white/10 text-orange-400">
                  <Egg size={20} />
                </div>
                <p className="text-sm font-bold">Production</p>
                <p className="mt-1 text-xs text-white/55">
                  Record egg collection
                </p>
              </div>
              <ArrowUpRight
                size={17}
                className="shrink-0 text-white/40 transition group-hover:text-orange-400"
              />
            </a>

            <a
              href="/inventory"
              className="group flex items-center justify-between gap-2 rounded-xl border border-white/15 bg-[#111111]/75 p-4 text-white transition hover:border-white/25 hover:bg-[#111111]/90"
            >
              <div>
                <div className="mb-3 grid size-9 place-items-center rounded-lg bg-white/10 text-orange-400">
                  <Wheat size={20} />
                </div>
                <p className="text-sm font-bold">Inventory</p>
                <p className="mt-1 text-xs text-white/55">
                  Check feed stock
                </p>
              </div>
              <ArrowUpRight
                size={17}
                className="shrink-0 text-white/40 transition group-hover:text-orange-400"
              />
            </a>

            <a
              href="/expenses"
              className="group flex items-center justify-between gap-2 rounded-xl border border-white/15 bg-[#111111]/75 p-4 text-white transition hover:border-white/25 hover:bg-[#111111]/90"
            >
              <div>
                <div className="mb-3 grid size-9 place-items-center rounded-lg bg-white/10 text-orange-400">
                  <Wallet size={20} />
                </div>
                <p className="text-sm font-bold">Expenses</p>
                <p className="mt-1 text-xs text-white/55">
                  Review farm spending
                </p>
              </div>
              <ArrowUpRight
                size={17}
                className="shrink-0 text-white/40 transition group-hover:text-orange-400"
              />
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-center gap-2 border-t border-white/10 py-4 text-xs text-white/45">
          <Activity size={14} />
          <span>DINCOM Farm Management</span>
          <span>·</span>
          <span>Connected farm modules</span>
        </footer>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;
