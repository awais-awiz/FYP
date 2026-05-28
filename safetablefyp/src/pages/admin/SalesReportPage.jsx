import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, DollarSign, TrendingUp, CreditCard, ShoppingBag, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { salesApi, adminApi } from "@/lib/api";
import { format } from "date-fns";

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "week",  label: "This Week" },
  { value: "month", label: "This Month" },
];

const SalesReportPage = () => {
  const [period, setPeriod] = useState("week");
  const [chartDays, setChartDays] = useState(30);

  // Data Fetching via React Query for automatic caching and re-validation
  const { data: summary, isLoading: lSum } = useQuery({
    queryKey: ["sales", "summary", period],
    queryFn:  () => salesApi.summary(period),
    refetchInterval: 30_000, // Refresh every 30 seconds
  });

  const { data: chart } = useQuery({
    queryKey: ["sales", "chart", chartDays],
    queryFn:  () => salesApi.revenueChart(chartDays),
  });

  const { data: top } = useQuery({
    queryKey: ["sales", "top", period],
    queryFn:  () => salesApi.topItems(period === "today" ? "today" : period, 10),
  });

  const { data: history } = useQuery({
    queryKey: ["admin", "history"],
    queryFn:  () => adminApi.orderHistory({ skip: 0, limit: 200 }),
  });

  // Calculate Stat Cards
  const stats = useMemo(() => {
    const s = summary || {};
    return [
      { title: "Revenue", value: `Rs. ${Math.round(Number(s.total_revenue ?? 0)).toLocaleString()}`, change: PERIODS.find((p) => p.value === period)?.label, icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10" },
      { title: "Avg. Order Value", value: `Rs. ${Math.round(Number(s.average_order_value ?? 0))}`, change: "Average", icon: ShoppingBag, color: "text-orange-500", bg: "bg-orange-500/10" },
      { title: "Orders", value: String(s.total_orders ?? 0), change: "Count", icon: CreditCard, color: "text-purple-500", bg: "bg-purple-500/10" },
      { title: "Completed", value: String(s.completed_orders ?? 0), change: `Avg ★ ${s.average_rating ?? "—"}`, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
    ];
  }, [summary, period]);

  // Format Chart Data
  const chartData = (chart?.data || []).map((d) => ({
    name: d.date.slice(5), // Show MM-DD
    revenue: d.revenue,
    orders: d.orders,
  }));

  const topItems = (top?.items || []).map((i) => ({
    name: i.name,
    revenue: i.total_revenue,
    sold: i.total_sold,
  }));

  const handleExport = () => {
    const orders = history?.orders || [];
    if (!orders.length) return;
    const headers = ["order_id", "table_number", "total_price", "status", "payment_status", "created_at"];
    const rows = orders.map((o) =>
      [o.order_id, o.table_number, Number(o.total_price).toFixed(2), o.status, o.payment_status, o.created_at].join(","),
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 text-foreground p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Report</h1>
          <p className="text-muted-foreground">Analyze your restaurant's financial performance with real-time data.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[130px] bg-input border-input">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (<SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={String(chartDays)} onValueChange={(v) => setChartDays(Number(v))}>
            <SelectTrigger className="w-[140px] bg-input border-input">
              <SelectValue placeholder="Chart Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.title} className="p-6 bg-card border-border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-xl ${s.bg}`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted border border-border text-muted-foreground">{s.change}</span>
            </div>
            <h3 className="text-2xl font-bold">{s.value}</h3>
            <p className="text-sm text-muted-foreground">{s.title}</p>
          </Card>
        ))}
      </div>

      {/* Revenue Area Chart */}
      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold mb-6">Revenue Trend ({chartDays} days)</h2>
        {lSum ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading chart data...
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: '8px' }} formatter={(v) => [`Rs. ${Math.round(Number(v)).toLocaleString()}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Top Sellers Bar Chart */}
      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold mb-6">Top Sellers ({PERIODS.find((p) => p.value === period)?.label})</h2>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topItems} margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} interval={0} angle={-25} textAnchor="end" dy={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: 'hsl(var(--muted)/0.2)'}} contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: '8px' }} />
              <Bar dataKey="sold" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={40} name="Quantity Sold" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

export default SalesReportPage;