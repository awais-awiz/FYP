import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Building2, ChefHat, ConciergeBell, Sparkles, 
  Activity, AlertTriangle, CheckCircle2, ArrowRight 
} from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useService } from "@/hooks/useService";

const ManagerDashboard = () => {
  const { orders, refreshKitchen } = useOrders();
  const { approvedUsers, refreshStaff } = useAuth();
  const { requests, refresh: refreshService } = useService();
  const [now, setNow] = useState(new Date());

  // Sync with backend every 5 seconds for real-time supervision
  useEffect(() => {
    refreshKitchen();
    refreshStaff().catch(() => {});
    refreshService({ status_filter: "pending" }).catch(() => {});
    
    const t = setInterval(() => {
      refreshKitchen();
      setNow(new Date());
    }, 5000);
    
    return () => clearInterval(t);
  }, [refreshKitchen, refreshStaff, refreshService]);

  // Calculate aggregated stats across all operational portals
  const portalStats = useMemo(() => {
    const activeOrders = orders.filter((o) => o.status !== "completed" && o.status !== "cancelled");

    // Kitchen stats (Mapping 'confirmed' and 'pending' as the initial queue)
    const kitchenPending = orders.filter((o) => o.status === "pending" || o.status === "confirmed").length;
    const kitchenPreparing = orders.filter((o) => o.status === "preparing").length;
    const kitchenReady = orders.filter((o) => o.status === "ready").length;

    // Server stats
    const serverDeliveries = orders.filter((o) => o.status === "ready").length;

    // Cleaner stats
    const cleaningPending = requests.filter((r) => r.type === "clean" && r.status === "pending").length;

    return {
      kitchen: { pending: kitchenPending, preparing: kitchenPreparing, ready: kitchenReady },
      server: { inTransit: serverDeliveries },
      cleaner: { pending: cleaningPending },
      total: {
        active: activeOrders.length
      }
    };
  }, [orders, requests]);

  const metrics = useMemo(() => {
    const activeStaff = (approvedUsers || []).filter((u) => u.is_active !== false).length;
    return { staffOnDuty: activeStaff };
  }, [approvedUsers]);

  const overviewCards = [
    {
      title: "Active Orders",
      value: portalStats.kitchen.pending + portalStats.kitchen.preparing,
      subtitle: "Kitchen Pending & Prep",
      icon: ChefHat,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      link: "/manager/kitchen"
    },
    {
      title: "Ready to Serve",
      value: portalStats.server.inTransit,
      subtitle: "Awaiting Delivery",
      icon: ConciergeBell,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      link: "/manager/server"
    },
    {
      title: "Active Cleaning",
      value: portalStats.cleaner.pending,
      subtitle: "Pending Requests",
      icon: Sparkles,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      link: "/manager/cleaner"
    },
    {
      title: "Active Staff",
      value: metrics.staffOnDuty,
      subtitle: "Team members on duty",
      icon: Building2,
      color: "text-teal-500",
      bg: "bg-teal-500/10",
      border: "border-teal-500/20"
    }
  ];

  // Logic for detecting delayed orders (> 20 mins)
  const alerts = useMemo(() => {
    const items = [];
    const activeOrders = orders.filter((o) => o.status !== "completed" && o.status !== "cancelled");
    
    activeOrders.forEach((o) => {
      const elapsed = (now.getTime() - new Date(o.createdAt).getTime()) / 60000;
      if (elapsed > 20) {
        items.push({
          type: "warning",
          message: `Table ${o.tableNumber} - Order #${(o.orderId || "").slice(-4)} delayed (${Math.floor(elapsed)}m)`,
          time: new Date(o.createdAt).toLocaleTimeString(),
        });
      }
    });
    return items.slice(0, 5); // Display top 5 most urgent alerts
  }, [orders, now]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-teal-500/10 rounded-lg border border-teal-500/20">
          <Building2 className="w-8 h-8 text-teal-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manager Dashboard</h1>
          <p className="text-sm text-muted-foreground">Unified Operations Supervision</p>
        </div>
      </div>

      {/* Overview Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className={`p-6 ${card.bg} border ${card.border} hover:scale-105 transition-transform cursor-pointer`}>
              {card.link ? (
                <Link to={card.link}>
                  <div className="flex items-start justify-between mb-3">
                    <card.icon className={`w-6 h-6 ${card.color}`} />
                    <ArrowRight className={`w-4 h-4 ${card.color} opacity-70`} />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-1">{card.value}</div>
                  <div className="text-xs font-medium text-muted-foreground mb-2">{card.title}</div>
                  <div className="text-xs text-muted-foreground">{card.subtitle}</div>
                </Link>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <card.icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-1">{card.value}</div>
                  <div className="text-xs font-medium text-muted-foreground mb-2">{card.title}</div>
                  <div className="text-xs text-muted-foreground">{card.subtitle}</div>
                </>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Live Alerts Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Live Alerts</h2>
          <Badge variant="outline" className="text-teal-500 border-teal-500/30">
            <Activity className="w-3 h-3 mr-1" />
            Real-time
          </Badge>
        </div>
        
        {alerts.length > 0 ? (
          <div className="space-y-2">
            {alerts.map((alert, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-lg border ${alert.type === 'warning' ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-blue-500/5 border-blue-500/20'}`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-4 h-4 mt-0.5 ${alert.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'}`} />
                  <div className="flex-1">
                    <p className="text-sm text-foreground font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">All operations running smoothly</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ManagerDashboard;