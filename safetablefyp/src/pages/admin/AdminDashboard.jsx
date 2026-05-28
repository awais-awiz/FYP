import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, DollarSign, Activity, Clock, CheckCircle2, Flame, Bell, Utensils, Sparkles, ConciergeBell } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { adminApi, ordersApi, tasksApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useKitchenSocket } from "@/hooks/useKitchenSocket";

const getStatusColor = (status) => {
  switch (status) {
    case "pending":   return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "confirmed": return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20";
    case "preparing": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    case "ready":     return "bg-green-500/10 text-green-500 border-green-500/20";
    default:          return "bg-muted text-muted-foreground";
  }
};

const getStatusIcon = (s) => (s === "pending" ? Bell : s === "preparing" ? Flame : s === "ready" ? CheckCircle2 : Clock);

const AdminDashboard = () => {
  const { approvedUsers, refreshStaff } = useAuth();
  const [now, setNow] = useState(new Date());

  // Fetch Summary Stats (Revenue, Total Orders, etc)
  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminApi.dashboardStats(),
    refetchInterval: 10000,
  });

  // Fetch Live Kitchen Orders
  const { data: activeOrders, refetch: refetchOrders } = useQuery({
    queryKey: ["orders", "kitchen", "active"],
    queryFn: () => ordersApi.kitchenActive(),
    refetchInterval: 5000,
  });

  // Fetch Service and Cleaning Tasks
  const { data: pendingTasks } = useQuery({
    queryKey: ["tasks", "active"],
    queryFn: () => tasksApi.list({ status_filter: "pending" }),
    refetchInterval: 10000,
  });

  useEffect(() => {
    refreshStaff().catch(() => {});
  }, [refreshStaff]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Listen for real-time socket events to update the feed instantly
  useKitchenSocket(() => refetchOrders());

  const cleanTasks = useMemo(
    () => (pendingTasks?.tasks || []).filter((t) => t.role === "cleaner"),
    [pendingTasks]
  );
  const serviceTasks = useMemo(
    () => (pendingTasks?.tasks || []).filter((t) => t.role === "server"),
    [pendingTasks]
  );

  const cards = [
    { 
      title: "Kitchen Orders", 
      value: stats?.active_orders ?? "—", 
      label: "Active", 
      icon: Utensils, 
      color: "text-orange-500", 
      bg: "bg-orange-500/10" 
    },
    { 
      title: "Service Requests", 
      value: serviceTasks.length, 
      label: "Active", 
      icon: ConciergeBell, 
      color: "text-amber-500", 
      bg: "bg-amber-500/10" 
    },
    { 
      title: "Cleaning Tasks", 
      value: cleanTasks.length, 
      label: "Pending", 
      icon: Sparkles, 
      color: "text-purple-500", 
      bg: "bg-purple-500/10" 
    },
    { 
      title: "Staff on Duty", 
      value: approvedUsers.filter((u) => u.is_active !== false).length, 
      label: "Active", 
      icon: Users, 
      color: "text-blue-500", 
      bg: "bg-blue-500/10" 
    },
  ];

  const recentOrders = (activeOrders?.orders || [])
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8 p-6 bg-background min-h-screen text-foreground">
      <div>
        <h1 className="text-3xl font-bold mb-2 tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">Real-time restaurant performance metrics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((s, idx) => (
          <motion.div 
            key={s.title} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="p-6 bg-card border-border backdrop-blur-sm hover-glow group h-full">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl ${s.bg} group-hover:scale-110 transition-transform duration-300`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-bold text-foreground">{s.value}</h3>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {s.label} {s.title}
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 bg-card border-border hover-glow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Live Kitchen Feed
            </h2>
            <Link to="/kitchen">
              <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10">
                View Kitchen <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => {
                  const StatusIcon = getStatusIcon(order.status);
                  const elapsed = Math.floor((now.getTime() - new Date(order.created_at).getTime()) / 60000);
                  return (
                    <motion.div 
                      key={order.order_id} 
                      initial={{ opacity: 0, x: -20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 rounded-xl bg-muted/30 border border-border flex items-center justify-between hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${getStatusColor(order.status)}`}>
                          <StatusIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">Table {order.table_number}</span>
                            <span className="text-xs text-muted-foreground font-mono">
                              #{(order.order_id || "").split("-")[1]}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> {elapsed}m ago
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className={`${getStatusColor(order.status)} capitalize`}>
                        {order.status}
                      </Badge>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p>All caught up! No active orders.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border hover-glow">
          <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/admin/staff">
              <Button variant="outline" className="w-full h-24 flex-col gap-2 hover:bg-muted transition-all">
                <Users className="w-6 h-6 mb-1 text-purple-500" /> Staff Management
              </Button>
            </Link>
            <Link to="/admin/sales">
              <Button variant="outline" className="w-full h-24 flex-col gap-2 hover:bg-muted transition-all">
                <DollarSign className="w-6 h-6 mb-1 text-green-500" /> Sales Report
              </Button>
            </Link>
          </div>
          
          {stats && (
            <div className="mt-6 pt-6 border-t border-border space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Today's Revenue</span>
                <span className="text-lg font-bold text-green-500">
                  ${Number(stats.total_revenue_today).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Orders Today</span>
                <span className="font-semibold">{stats.total_orders_today}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Tables</span>
                <span className="font-semibold">{stats.active_tables}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Rating</span>
                <div className="flex items-center gap-1 font-semibold">
                  <Sparkles className="w-3 h-3 text-amber-500" /> {stats.average_rating || "N/A"}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;