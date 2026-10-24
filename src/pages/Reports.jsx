
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  CircleDollarSign,
  Download,
  Egg,
  Factory,
  FileText,
  RefreshCw,
  Search,
  TrendingUp,
  Wallet,
  Wheat,
  X,
} from "lucide-react";

import DashboardLayout from "../components/DashboardLayout/DashboardLayout";
import {
  getReportSummary,
  getDailyReport,
  downloadFarmReportPdf,
} from "../services/reportsService";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-[#1b1b1b] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/15";

const cardClass =
  "rounded-xl border border-white/15 bg-[#111111]/75 p-4 text-white shadow-lg backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-[#111111]/80 sm:p-5";

const currencyFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-KE", {
  maximumFractionDigits: 2,
});

const categoryLabels = {
  egg_production: "Egg production",
  egg_sales: "Egg sales",
  feed_consumption: "Feed consumption",
  feed_production: "Feed production",
  farm_expenses: "Farm expenses",
};

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatNumber(value) {
  const number = Number(value ?? 0);
  return numberFormatter.format(Number.isFinite(number) ? number : 0);
}

function formatCurrency(value) {
  const number = Number(value ?? 0);
  return currencyFormatter.format(Number.isFinite(number) ? number : 0);
}

function formatDate(value) {
  if (!value) return "—";

  const dateString = String(value).slice(0, 10);
  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

function Reports() {
  const [summary, setSummary] = useState(null);
  const [dailyReports, setDailyReports] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadReports = useCallback(
    async (showRefresh = false, filters = {}) => {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const [summaryData, dailyData] = await Promise.all([
          getReportSummary(filters),
          getDailyReport(filters),
        ]);

        setSummary(summaryData || {});
        setDailyReports(Array.isArray(dailyData) ? dailyData : []);
      } catch (err) {
        setError(err.message || "Unable to load farm reports.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const filteredReports = dailyReports.filter((report) => {
    const searchTerm = search.trim().toLowerCase();
    const categoryName =
      categoryLabels[report.category] || report.category || "";

    const matchesSearch =
      !searchTerm ||
      [
        categoryName,
        report.report_date,
        report.quantity,
        report.amount,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(searchTerm)
      );

    const matchesCategory =
      categoryFilter === "all" || report.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const updateDateRange = (event) => {
    const { name, value } = event.target;

    if (name === "start_date") {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
  };

  const handleApplyFilters = async (event) => {
    event.preventDefault();
    setNotice("");

    if (startDate && endDate && startDate > endDate) {
      setError("Start date cannot be after end date.");
      return;
    }

    await loadReports(false, {
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    });
  };

  const handleClearFilters = async () => {
    setStartDate("");
    setEndDate("");
    setSearch("");
    setCategoryFilter("all");
    setNotice("");

    await loadReports(false, {});
  };

  const handleRefresh = async () => {
    await loadReports(true, {
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    });
  };

  const handleDownloadPdf = async () => {
    setError("");
    setNotice("");
    setDownloading(true);

    try {
      const blob = await downloadFarmReportPdf({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "poultry-farm-report.pdf";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      setNotice("Farm report PDF downloaded successfully.");
    } catch (err) {
      setError(err.message || "Unable to download the farm report.");
    } finally {
      setDownloading(false);
    }
  };

  const summaryCards = [
    {
      label: "Eggs collected",
      value: formatNumber(summary?.eggs_collected),
      icon: Egg,
    },
    {
      label: "Egg sales revenue",
      value: formatCurrency(summary?.egg_sales_revenue),
      icon: CircleDollarSign,
    },
    {
      label: "Farm expenses",
      value: formatCurrency(summary?.farm_expenses_total),
      icon: Wallet,
    },
    {
      label: "Estimated operating profit",
      value: formatCurrency(summary?.estimated_operating_profit),
      icon: TrendingUp,
    },
    {
      label: "Feed consumed (kg)",
      value: formatNumber(summary?.feed_consumed_kg),
      icon: Wheat,
    },
    {
      label: "Feed produced (kg)",
      value: formatNumber(summary?.feed_produced_kg),
      icon: Factory,
    },
  ];

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
              Reports
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
              Review farm production, egg sales, feed usage, expenses, and
              estimated operating performance.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={loading || downloading}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
          >
            {downloading ? (
              <RefreshCw size={17} className="animate-spin" />
            ) : (
              <Download size={17} />
            )}
            {downloading ? "Downloading..." : "Export PDF"}
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

        {/* Summary cards */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4">
          {summaryCards.map((card) => (
            <SummaryCard key={card.label} {...card} />
          ))}
        </section>

        {/* Date filters */}
        <section className={cardClass}>
          <div className="mb-4">
            <h3 className="font-bold text-white">Report date range</h3>
            <p className="mt-1 text-xs text-white/60">
              Select a period to filter the summary and daily activity.
            </p>
          </div>

          <form
            onSubmit={handleApplyFilters}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto]"
          >
            <div>
              <label
                htmlFor="report-start-date"
                className="mb-1.5 block text-xs font-semibold text-white/80"
              >
                Start date
              </label>
              <input
                id="report-start-date"
                name="start_date"
                type="date"
                value={startDate}
                max={endDate || getLocalDate()}
                onChange={updateDateRange}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="report-end-date"
                className="mb-1.5 block text-xs font-semibold text-white/80"
              >
                End date
              </label>
              <input
                id="report-end-date"
                name="end_date"
                type="date"
                value={endDate}
                min={startDate || undefined}
                max={getLocalDate()}
                onChange={updateDateRange}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-10 items-center justify-center gap-2 self-end rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-400 disabled:opacity-50"
            >
              <CalendarDays size={16} />
              Apply
            </button>

            <button
              type="button"
              onClick={handleClearFilters}
              disabled={loading}
              className="inline-flex min-h-10 items-center justify-center self-end rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/10 disabled:opacity-50"
            >
              Clear
            </button>
          </form>
        </section>

        {/* Additional metrics */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4">
          <SummaryCard
            label="Broken eggs"
            value={formatNumber(summary?.broken_eggs)}
            icon={Egg}
          />

          <SummaryCard
            label="Intact eggs"
            value={formatNumber(summary?.intact_eggs)}
            icon={CheckCircle2}
          />

          <SummaryCard
            label="Estimated profit margin"
            value={`${formatNumber(summary?.estimated_profit_margin_percent)}%`}
            icon={TrendingUp}
          />

          <SummaryCard
            label="Production batches"
            value={formatNumber(summary?.production_batches)}
            icon={Factory}
          />
        </section>

        {/* Daily reports table */}
        <section className="overflow-hidden rounded-xl border border-white/15 bg-[#111111]/75 text-white shadow-lg backdrop-blur-sm">
          <div className="flex flex-col gap-4 border-b border-white/15 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h3 className="font-bold text-white">Daily farm activity</h3>
              <p className="mt-1 text-xs text-white/60">
                {filteredReports.length}{" "}
                {filteredReports.length === 1 ? "record" : "records"} displayed
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
                  placeholder="Search reports..."
                  aria-label="Search daily reports"
                  className={`${inputClass} pl-9 sm:w-52`}
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                aria-label="Filter by activity category"
                className={inputClass}
              >
                <option value="all">All activities</option>
                <option value="egg_production">Egg production</option>
                <option value="egg_sales">Egg sales</option>
                <option value="feed_consumption">Feed consumption</option>
                <option value="feed_production">Feed production</option>
                <option value="farm_expenses">Farm expenses</option>
              </select>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing || loading}
                title="Refresh reports"
                aria-label="Refresh reports"
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
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-black/20 text-xs uppercase tracking-wide text-white/60">
                <tr>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Activity</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Quantity
                  </th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Amount / value
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-16 text-center">
                      <RefreshCw
                        size={22}
                        className="mx-auto animate-spin text-orange-400"
                      />
                      <p className="mt-3 text-sm text-white/70">
                        Loading reports...
                      </p>
                    </td>
                  </tr>
                ) : error && !summary ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-12 text-center text-white/70"
                    >
                      Unable to load reports. Check the error above and try
                      refreshing.
                    </td>
                  </tr>
                ) : filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-16 text-center">
                      <FileText
                        size={30}
                        className="mx-auto text-white/40"
                      />
                      <p className="mt-3 font-semibold text-white">
                        No reports found
                      </p>
                      <p className="mt-1 text-xs text-white/60">
                        Try another search, activity type, or date range.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report, index) => (
                    <tr
                      key={`${report.report_date}-${report.category}-${index}`}
                      className="transition-colors hover:bg-black/20"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-white/75">
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays
                            size={15}
                            className="text-white/50"
                          />
                          {formatDate(report.report_date)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-orange-400">
                            <Activity size={18} />
                          </div>

                          <span className="font-semibold text-white">
                            {categoryLabels[report.category] ||
                              report.category ||
                              "Other"}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right tabular-nums text-white/80">
                        {formatNumber(report.quantity)}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold tabular-nums text-white">
                        {formatNumber(report.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Financial note */}
        <section className="rounded-xl border border-orange-400/20 bg-orange-500/5 p-4 text-sm text-white/75">
          <div className="flex items-start gap-3">
            <CircleDollarSign
              size={20}
              className="mt-0.5 shrink-0 text-orange-400"
            />

            <div>
              <h3 className="font-bold text-white">
                Understanding the financial summary
              </h3>
              <p className="mt-1 leading-6">
                Estimated operating profit is calculated from egg sales
                revenue minus feed consumption cost and farm expenses. It is
                an estimate rather than a complete accounting profit figure.
                The daily report's amount/value column represents different
                values for different activities, including broken eggs for egg
                production and monetary amounts for sales and expenses.
              </p>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default Reports;
