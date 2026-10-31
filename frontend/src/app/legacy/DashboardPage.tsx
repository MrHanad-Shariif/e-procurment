import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCheck,
  ChevronRight,
  CircleCheck,
  ClipboardList,
  Clock3,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/features/identity/hooks/useAuth";
import { useDashboard } from "@/features/administration/dashboard/hooks/useDashboard";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Badge } from "@/shared/ui/procurement/badge";
import { Button } from "@/shared/ui/procurement/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/procurement/card";
import { Input } from "@/shared/ui/procurement/input";
import { Skeleton } from "@/shared/ui/procurement/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/procurement/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/procurement/table";
import { cn } from "@/shared/lib/utils";
import type { PurchaseOrder, PurchaseRequisition } from "@/shared/types/procurement";

function StatCard({
  label,
  value,
  hint,
  icon,
  color,
  loading,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  color: string;
  loading: boolean;
}) {
  return (
    <Card className="dashboard-card gap-4 rounded-xl border py-5 ring-0">
      <CardContent className="px-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground text-xs font-medium">{label}</span>
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-lg [&>svg]:size-[18px]",
              color
            )}
          >
            {icon}
          </span>
        </div>
        {loading ? (
          <Skeleton className="mt-3 h-9 w-24" />
        ) : (
          <p className="mt-2 truncate text-[30px] leading-tight font-semibold tracking-tight tabular-nums">
            {value}
          </p>
        )}
        <p className="text-muted-foreground mt-2 text-[11px] leading-relaxed">{hint}</p>
      </CardContent>
    </Card>
  );
}

function ActivityChart({
  requests,
  orders,
  days,
}: {
  requests: PurchaseRequisition[];
  orders: PurchaseOrder[];
  days: number;
}) {
  const { t, i18n } = useTranslation("dashboard");
  const mobile = useIsMobile();
  const bucketCount = mobile ? 6 : 12;
  const [hovered, setHovered] = useState<number | null>(null);
  const buckets = useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);
    const duration = (end.getTime() - start.getTime() + 1) / bucketCount;
    return Array.from({ length: bucketCount }, (_, index) => {
      const from = start.getTime() + index * duration;
      const to = from + duration;
      return {
        date: new Date(from),
        requests: requests.filter((row) => {
          const date = Date.parse(row.createdAt);
          return date >= from && date < to;
        }).length,
        orders: orders.filter((row) => {
          const date = Date.parse(row.createdAt);
          return date >= from && date < to;
        }).length,
      };
    });
  }, [requests, orders, days, bucketCount]);
  const activeBucket = hovered === null ? undefined : buckets[hovered];
  const max = Math.max(4, ...buckets.flatMap((bucket) => [bucket.requests, bucket.orders]));
  const ceiling = Math.ceil(max / 4) * 4;
  const hasData = buckets.some((bucket) => bucket.requests || bucket.orders);
  const date = (value: Date) =>
    new Intl.DateTimeFormat(i18n.language, { month: "short", day: "numeric" }).format(value);
  const points = (field: "requests" | "orders") =>
    buckets
      .map((bucket, index) => `${44 + index * 56},${180 - (bucket[field] / ceiling) * 145}`)
      .join(" ");
  return (
    <div className="relative mt-5" dir="ltr">
      <svg
        viewBox={`0 0 ${mobile ? 370 : 700} 224`}
        className="w-full overflow-visible"
        role="img"
        aria-label={t("activity")}
      >
        <defs>
          <linearGradient id="request-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((step) => (
          <g key={step}>
            <line
              x1="40"
              x2={mobile ? 348 : 678}
              y1={180 - step * 36.25}
              y2={180 - step * 36.25}
              stroke="var(--border)"
              strokeDasharray="3 4"
            />
            <text
              x="25"
              y={184 - step * 36.25}
              fill="var(--muted-foreground)"
              fontSize="10"
              textAnchor="end"
            >
              {(ceiling / 4) * step}
            </text>
          </g>
        ))}
        {hasData && (
          <>
            <polygon points={`44,180 ${points("requests")} ${44 + (bucketCount - 1) * 56},180`} fill="url(#request-fill)" />
            <polyline
              points={points("requests")}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <polyline
              points={points("orders")}
              fill="none"
              stroke="#14b8a6"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </>
        )}
        {buckets.map((bucket, index) => (
          <g key={index}>
            {(mobile || index % 2 === 0) && (
              <text
                x={44 + index * 56}
                y="212"
                textAnchor="middle"
                fill="var(--muted-foreground)"
                fontSize="10"
              >
                {date(bucket.date)}
              </text>
            )}
            {hasData && (
              <rect
                x={20 + index * 56}
                y="20"
                width="56"
                height="170"
                fill="transparent"
                tabIndex={0}
                role="button"
                aria-label={`${date(bucket.date)}: ${t("requestsLegend")} ${bucket.requests}, ${t("ordersLegend")} ${bucket.orders}`}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(index)}
                onBlur={() => setHovered(null)}
              />
            )}
            {hovered === index && hasData && (
              <>
                <line
                  x1={44 + index * 56}
                  x2={44 + index * 56}
                  y1="28"
                  y2="180"
                  stroke="#94a3b8"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={44 + index * 56}
                  cy={180 - (bucket.requests / ceiling) * 145}
                  r="4"
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="2"
                />
              </>
            )}
          </g>
        ))}
      </svg>
      {!hasData && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pb-6 text-center">
          <span className="bg-card mb-3 flex size-10 items-center justify-center rounded-xl border shadow-sm">
            <Activity className="text-muted-foreground size-5" />
          </span>
          <p className="bg-card/90 px-3 text-sm font-medium">{t("noActivity")}</p>
          <p className="bg-card/90 text-muted-foreground mt-1 max-w-64 px-3 text-xs leading-relaxed">
            {t("noActivityHint")}
          </p>
        </div>
      )}
      {activeBucket && hasData && (
        <div className="bg-card pointer-events-none absolute start-1/2 top-0 z-10 rounded-lg border px-3 py-2 text-xs shadow-md">
          <p className="mb-1 font-medium">{date(activeBucket.date)}</p>
          <p className="text-blue-600">
            {t("requestsLegend")}: {activeBucket.requests}
          </p>
          <p className="text-teal-600">
            {t("ordersLegend")}: {activeBucket.orders}
          </p>
        </div>
      )}
    </div>
  );
}

const statusStyles: Record<string, string> = {
  DRAFT: "border-slate-200 bg-slate-50 text-slate-600",
  SUBMITTED: "border-amber-200 bg-amber-50 text-amber-700",
  UNDER_REVIEW: "border-blue-200 bg-blue-50 text-blue-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  CANCELLED: "border-slate-200 bg-slate-50 text-slate-500",
};

export function DashboardPage() {
  const { t, i18n } = useTranslation(["dashboard", "common"]);
  const { user, hasPermission } = useAuth();
  const data = useDashboard();
  const [days, setDays] = useState(90);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const requests = data.requests.data ?? [];
  const orders = data.orders.data ?? [];
  const suppliers = data.suppliers.data ?? [];
  const currencies = [...new Set(["USD", ...orders.map((order) => order.currency)])].sort();
  const currency = currencies.includes(selectedCurrency) ? selectedCurrency : currencies[0];
  const number = (value: number) => new Intl.NumberFormat(i18n.language).format(value);
  const money = (value: number, unit: string) =>
    new Intl.NumberFormat(i18n.language, {
      style: "currency",
      currency: unit,
      maximumFractionDigits: 0,
    }).format(value);
  const pending =
    requests.filter((row) => ["SUBMITTED", "UNDER_REVIEW"].includes(row.status)).length +
    orders.filter((row) => row.status === "PENDING_APPROVAL").length;
  const orderValue = orders
    .filter((row) => row.currency === currency && row.status !== "CANCELLED")
    .reduce((sum, row) => sum + row.totalAmount, 0);
  const review = requests.filter((row) => ["SUBMITTED", "UNDER_REVIEW"].includes(row.status));
  const recent = [...requests]
    .filter(
      (row) =>
        (tab !== "review" || ["SUBMITTED", "UNDER_REVIEW"].includes(row.status)) &&
        `${row.title} ${row.prNumber}`.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 5);
  const pipeline = [
    {
      label: "draft",
      count: requests.filter((row) => row.status === "DRAFT").length,
      color: "#cbd5e1",
    },
    { label: "review", count: review.length, color: "#fbbf24" },
    {
      label: "approved",
      count: requests.filter((row) => row.status === "APPROVED").length,
      color: "#3b82f6",
    },
    {
      label: "other",
      count: requests.filter((row) => ["REJECTED", "CANCELLED"].includes(row.status)).length,
      color: "#a5b4fc",
    },
  ];
  let cursor = 0;
  const stops = pipeline
    .map((stage) => {
      const start = cursor;
      cursor += requests.length ? (stage.count / requests.length) * 100 : 0;
      return `${stage.color} ${start}% ${cursor}%`;
    })
    .join(", ");
  const quickActions = [
    {
      title: "addSupplier",
      hint: "addSupplierHint",
      href: "/suppliers/new",
      icon: Building2,
      permission: "supplier.create",
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "createRfq",
      hint: "createRfqHint",
      href: "/rfq/new",
      icon: Send,
      permission: "rfq.create",
      color: "bg-violet-50 text-violet-600",
    },
    {
      title: "createOrder",
      hint: "createOrderHint",
      href: "/purchase-orders/new",
      icon: ShoppingBag,
      permission: "purchase_order.create",
      color: "bg-emerald-50 text-emerald-600",
    },
  ].filter((action) => hasPermission(action.permission));

  return (
    <div className="dashboard-enter space-y-6 p-4 sm:p-7 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-muted-foreground mb-2 flex items-center gap-2 text-[11px] font-medium">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {t("live")}
          </div>
          <h1 className="text-[26px] font-semibold tracking-tight sm:text-[28px]">
            {t("dashboard")}
          </h1>
          <p className="text-muted-foreground mt-1.5 text-[13px]">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="icon"
            className="bg-card size-9"
            aria-label={t("refresh")}
            disabled={data.isFetching}
            onClick={() => void data.refresh()}
          >
            <RefreshCw className={cn("size-4", data.isFetching && "animate-spin")} />
          </Button>
          {hasPermission("purchase_request.create") && (
            <Button
              className="h-9 gap-2 px-3.5 text-xs shadow-sm"
              render={<Link to="/purchase-requisitions/new" />}
              nativeButton={false}
            >
              <Plus className="size-4" />
              {t("newRequest")}
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-primary hidden size-10 items-center justify-center rounded-xl border border-blue-100 bg-white sm:flex">
            <CheckCheck className="size-5" />
          </span>
          <div>
            <p className="text-[13px] font-semibold">
              {t("greeting", { name: user?.firstName || "" })}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">{t("today")}</p>
          </div>
        </div>
        <span className="text-primary hidden rounded-full border border-blue-100 bg-white px-2.5 py-1 text-[10px] font-medium whitespace-nowrap sm:block">
          {t("overview")}
        </span>
      </div>
      {data.isError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {t("error")}
        </div>
      )}
      {!data.hasAccess && (
        <Card className="border p-6 ring-0">
          <p className="text-muted-foreground text-sm">{t("restricted")}</p>
        </Card>
      )}
      {data.hasAccess && (
        <>
          <section aria-label={t("overview")} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.canReadRequests && (
              <StatCard
                label={t("requisitions")}
                value={data.requests.isError ? "—" : number(requests.length)}
                hint={t("requisitionsHint")}
                icon={<FileText />}
                color="bg-blue-50 text-blue-600"
                loading={data.requests.isLoading}
              />
            )}
            {(data.canReadRequests || data.canReadOrders) && (
              <StatCard
                label={t("pending")}
                value={data.requests.isError || data.orders.isError ? "—" : number(pending)}
                hint={t("pendingHint")}
                icon={<Clock3 />}
                color="bg-amber-50 text-amber-600"
                loading={data.isLoading}
              />
            )}
            {data.canReadSuppliers && (
              <StatCard
                label={t("suppliers")}
                value={
                  data.suppliers.isError
                    ? "—"
                    : number(suppliers.filter((row) => row.status === "APPROVED").length)
                }
                hint={t("suppliersHint")}
                icon={<Building2 />}
                color="bg-emerald-50 text-emerald-600"
                loading={data.suppliers.isLoading}
              />
            )}
            {data.canReadOrders && (
              <div className="relative">
                <StatCard
                  label={t("orderValue")}
                  value={data.orders.isError ? "—" : money(orderValue, currency)}
                  hint={t("orderValueHint", { currency })}
                  icon={<Wallet />}
                  color="bg-violet-50 text-violet-600"
                  loading={data.orders.isLoading}
                />
                {currencies.length > 1 && (
                  <select
                    aria-label={t("currency")}
                    value={currency}
                    onChange={(event) => setSelectedCurrency(event.target.value)}
                    className="bg-card absolute end-4 bottom-4 max-w-16 rounded border text-[10px]"
                  >
                    {currencies.map((unit) => (
                      <option key={unit}>{unit}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </section>
          <div className="grid items-stretch gap-5 xl:grid-cols-3">
            {(data.canReadRequests || data.canReadOrders) && (
              <Card className="dashboard-card gap-0 border py-5 ring-0 xl:col-span-2">
                <CardHeader className="flex flex-wrap items-start justify-between gap-3 px-5">
                  <div>
                    <CardTitle className="text-sm font-semibold">{t("activity")}</CardTitle>
                    <CardDescription className="mt-1 text-xs">{t("activityHint")}</CardDescription>
                  </div>
                  <select
                    aria-label={t("activity")}
                    value={days}
                    onChange={(event) => setDays(Number(event.target.value))}
                    className="bg-card rounded-md border px-2 py-1.5 text-[11px]"
                  >
                    {[30, 90, 180].map((value) => (
                      <option key={value} value={value}>
                        {t("days", { count: value })}
                      </option>
                    ))}
                  </select>
                </CardHeader>
                <CardContent className="px-5">
                  {data.isLoading ? (
                    <Skeleton className="my-6 h-52 w-full" />
                  ) : data.requests.isError || data.orders.isError ? (
                    <div className="text-muted-foreground flex h-52 items-center justify-center text-sm">
                      {t("unavailable")}
                    </div>
                  ) : (
                    <ActivityChart requests={requests} orders={orders} days={days} />
                  )}
                  <div className="text-muted-foreground mt-3 flex justify-center gap-5 text-[10px]">
                    {data.canReadRequests && (
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-3 rounded-full bg-blue-500" />
                        {t("requestsLegend")}
                      </span>
                    )}
                    {data.canReadOrders && (
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-3 rounded-full bg-teal-500" />
                        {t("ordersLegend")}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            {data.canReadRequests && (
              <Card className="dashboard-card gap-4 border py-5 ring-0">
                <CardHeader className="px-5">
                  <CardTitle className="text-sm font-semibold">{t("pipeline")}</CardTitle>
                  <CardDescription className="text-xs">{t("pipelineHint")}</CardDescription>
                </CardHeader>
                <CardContent className="px-5">
                  {data.requests.isLoading ? (
                    <Skeleton className="mx-auto my-4 size-36 rounded-full" />
                  ) : data.requests.isError ? (
                    <p className="text-muted-foreground py-16 text-center text-sm">
                      {t("unavailable")}
                    </p>
                  ) : (
                    <div
                      className="relative mx-auto mt-1 mb-5 flex size-36 items-center justify-center rounded-full"
                      style={{
                        background: requests.length ? `conic-gradient(${stops})` : "var(--muted)",
                      }}
                      role="img"
                      aria-label={pipeline
                        .map((stage) => `${t(stage.label)}: ${stage.count}`)
                        .join(", ")}
                    >
                      <div className="bg-card flex size-[112px] flex-col items-center justify-center rounded-full">
                        <span className="text-3xl font-semibold tracking-tight">
                          {number(requests.length)}
                        </span>
                        <span className="text-muted-foreground mt-1 text-[9px]">{t("total")}</span>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2.5">
                    {pipeline.map((stage) => (
                      <div
                        key={stage.label}
                        className="flex items-center justify-between text-[11px]"
                      >
                        <span className="text-muted-foreground flex items-center gap-2">
                          <span
                            className="size-2 rounded-full"
                            style={{ background: stage.color }}
                          />
                          {t(stage.label)}
                        </span>
                        <span className="font-medium tabular-nums">
                          {data.requests.isError ? "—" : number(stage.count)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <div className="grid items-start gap-5 xl:grid-cols-3">
            {data.canReadRequests && (
              <Card className="dashboard-card gap-0 border py-0 ring-0 xl:col-span-2">
                <CardHeader className="flex items-center justify-between gap-3 px-5 pt-5">
                  <div>
                    <CardTitle className="text-sm font-semibold">{t("recent")}</CardTitle>
                    <CardDescription className="mt-1 text-xs">{t("recentHint")}</CardDescription>
                  </div>
                  <Link
                    to="/purchase-requisitions"
                    className="text-primary flex items-center gap-1 text-[11px] font-medium whitespace-nowrap"
                  >
                    {t("viewAll")}
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </CardHeader>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-5 pb-4">
                  <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
                    <TabsList className="h-8">
                      <TabsTrigger value="all" className="px-2.5 text-[11px]">
                        {t("all")}
                      </TabsTrigger>
                      <TabsTrigger value="review" className="gap-1.5 px-2.5 text-[11px]">
                        {t("needsReview")}
                        <span className="bg-card rounded px-1 text-[9px]">{review.length}</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <div className="relative w-full sm:w-44">
                    <Search className="text-muted-foreground absolute start-2.5 top-2 size-3.5" />
                    <Input
                      aria-label={t("search")}
                      placeholder={t("search")}
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="bg-card h-8 rounded-md ps-8 text-[11px]!"
                    />
                  </div>
                </div>
                {data.requests.isLoading ? (
                  <div className="space-y-3 px-5 pb-6" aria-label={t("loading")}>
                    {[1, 2, 3].map((value) => (
                      <Skeleton key={value} className="h-11 w-full" />
                    ))}
                  </div>
                ) : data.requests.isError ? (
                  <p className="text-muted-foreground p-10 text-center text-sm">
                    {t("unavailable")}
                  </p>
                ) : requests.length === 0 ? (
                  <div className="flex min-h-60 flex-col items-center justify-center border-t px-6 py-9 text-center">
                    <span className="bg-background mb-3 flex size-12 items-center justify-center rounded-2xl border">
                      <ClipboardList className="text-muted-foreground size-6" />
                    </span>
                    <p className="text-sm font-semibold">{t("empty")}</p>
                    <p className="text-muted-foreground mt-2 max-w-72 text-xs leading-relaxed">
                      {t("emptyHint")}
                    </p>
                    {hasPermission("purchase_request.create") && (
                      <Button
                        variant="outline"
                        className="mt-4 gap-2 text-xs"
                        render={<Link to="/purchase-requisitions/new" />}
                        nativeButton={false}
                      >
                        <Plus className="size-3.5" />
                        {t("newRequest")}
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-background/70">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="ps-5 text-[10px]">{t("request")}</TableHead>
                        <TableHead className="text-[10px]">{t("status")}</TableHead>
                        <TableHead className="text-end text-[10px]">{t("amount")}</TableHead>
                        <TableHead className="pe-5 text-end text-[10px]">{t("date")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recent.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-muted-foreground h-40 text-center text-xs"
                          >
                            {t("noMatches")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        recent.map((row) => (
                          <TableRow key={row.id} className="text-xs">
                            <TableCell className="py-3.5 ps-5">
                              <Link
                                to={`/purchase-requisitions/${row.id}`}
                                className="group flex items-center gap-2.5"
                              >
                                <span className="bg-background flex size-8 shrink-0 items-center justify-center rounded-lg border">
                                  <FileText className="text-muted-foreground size-3.5" />
                                </span>
                                <span className="min-w-0">
                                  <span className="group-hover:text-primary block max-w-44 truncate font-medium">
                                    {row.title}
                                  </span>
                                  <span className="text-muted-foreground mt-0.5 block text-[10px]">
                                    {row.prNumber}
                                  </span>
                                </span>
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "gap-1.5 rounded-md px-1.5 py-0.5 text-[9px] font-medium",
                                  statusStyles[row.status]
                                )}
                              >
                                <span className="size-1 rounded-full bg-current" />
                                {t(`common:pr.status.${row.status}`)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-end text-[11px] tabular-nums">
                              {money(row.totalEstimate, row.currency)}
                            </TableCell>
                            <TableCell className="text-muted-foreground pe-5 text-end text-[10px]">
                              {new Intl.DateTimeFormat(i18n.language, {
                                month: "short",
                                day: "numeric",
                              }).format(new Date(row.createdAt))}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
                <div className="text-muted-foreground flex items-center justify-between border-t px-5 py-3 text-[10px]">
                  <span>
                    {t("total")}: {data.requests.isError ? "—" : number(requests.length)}
                  </span>
                  <Link
                    to="/purchase-requisitions"
                    className="hover:text-primary flex items-center gap-1.5 font-medium"
                  >
                    {t("viewRequests")}
                    <ArrowRight className="size-3 rtl:rotate-180" />
                  </Link>
                </div>
              </Card>
            )}
            {quickActions.length > 0 && (
              <Card className="dashboard-card gap-3 border py-5 ring-0">
                <CardHeader className="px-5">
                  <CardTitle className="text-sm font-semibold">{t("quickActions")}</CardTitle>
                  <CardDescription className="text-xs">{t("quickHint")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1 px-3">
                  {quickActions.map(({ title, hint, href, icon: Icon, color }) => (
                    <Link
                      key={title}
                      to={href}
                      className="group hover:bg-muted flex items-center gap-3 rounded-lg p-2.5 transition-colors"
                    >
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg",
                          color
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="flex-1">
                        <span className="block text-xs font-medium">{t(title)}</span>
                        <span className="text-muted-foreground mt-1 block text-[10px]">
                          {t(hint)}
                        </span>
                      </span>
                      <ChevronRight className="text-muted-foreground size-3.5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
                    </Link>
                  ))}
                </CardContent>
                <div className="text-muted-foreground mx-5 mt-2 flex items-center gap-2 border-t pt-4 text-[10px]">
                  <CircleCheck className="size-3.5 text-emerald-500" />
                  {t("footer")}
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
