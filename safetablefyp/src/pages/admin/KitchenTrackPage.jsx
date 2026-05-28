import { motion } from "framer-motion";
import { Activity, ChefHat, Flame, CheckCircle, Clock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";

const TARGET_PREP_TIME = 20; // minutes

const statusConfig = {
  pending: {
    icon: Clock,
    label: "Pending",
    color: "text-blue-500",
    bg: "bg-blue-500/20",
    border: "border-blue-500/50"
  },
  confirmed: {
    icon: CheckCircle,
    label: "Confirmed",
    color: "text-blue-500",
    bg: "bg-blue-500/20",
    border: "border-blue-500/50"
  },
  preparing: {
    icon: ChefHat,
    label: "Preparing",
    color: "text-secondary",
    bg: "bg-secondary/20",
    border: "border-secondary/50"
  },
  cooking: { 
    icon: Flame,
    label: "Cooking",
    color: "text-primary",
    bg: "bg-primary/20",
    border: "border-primary/50"
  },
  ready: {
    icon: CheckCircle,
    label: "Ready",
    color: "text-accent",
    bg: "bg-accent/20",
    border: "border-accent/50"
  },
  completed: {
    icon: CheckCircle,
    label: "Completed",
    color: "text-muted-foreground",
    bg: "bg-muted/20",
    border: "border-muted/50"
  }
};

const KitchenTrackPage = () => {
  const { user } = useAuth();
  // Expanded role check to include managers
  const isAdmin = user?.role === "admin" || user?.role === "manager";
  const { orders: storeOrders, refreshKitchen, getAllOrders, getActiveOrders } = useOrders();

  const [orders, setOrders] = useState([]);
  const [now, setNow] = useState(new Date());

  // Initial fetch + 5s polling to keep backend data fresh
  useEffect(() => {
    refreshKitchen();
    const t = setInterval(() => refreshKitchen(), 5000);
    return () => clearInterval(t);
  }, [refreshKitchen]);

  // Real-time update loop for progress bars and UI timers
  useEffect(() => {
    const updateOrders = () => {
      // Logic: Admin/Manager sees everything, Customer sees only their table's active orders
      const sourceOrders = isAdmin ? getAllOrders() : getActiveOrders();
      const currentNow = new Date();
      setNow(currentNow);

      const activeOrders = sourceOrders
        .filter((o) => {
          // Keep display clean by removing orders older than 20 minutes
          const createdAt = new Date(o.createdAt);
          const ageInMinutes = (currentNow.getTime() - createdAt.getTime()) / 60000;
          return ageInMinutes <= 20;
        })
        .map((order) => {
          const createdAt = new Date(order.createdAt);
          const elapsedMinutes = (currentNow.getTime() - createdAt.getTime()) / 60000;
          const estimatedTime = Math.max(0, Math.round(TARGET_PREP_TIME - elapsedMinutes));

          // Map status to progress percentage
          let progress = 25;
          switch (order.status) {
            case 'pending':
            case 'confirmed':
              progress = 25;
              break;
            case 'preparing':
            case 'cooking':
              progress = 50;
              break;
            case 'ready':
              progress = 75;
              break;
            case 'completed':
              progress = 100;
              break;
          }

          return {
            ...order,
            progress,
            estimatedTime
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setOrders(activeOrders);
    };

    updateOrders();
    const interval = setInterval(updateOrders, 1000); // UI updates every second for smooth timers
    return () => clearInterval(interval);
  }, [getAllOrders, getActiveOrders, isAdmin, storeOrders]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container px-4 py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Kitchen Live Track</h1>
              <p className="text-sm text-muted-foreground">Real-time order status</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-4 mb-8 justify-center">
          {Object.entries(statusConfig).map(([key, config]) => (
            <div
              key={key}
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${config.bg} border ${config.border}`}>
              <config.icon className={`w-4 h-4 ${config.color}`} />
              <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
            </div>
          ))}
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order, idx) => {
            const config = statusConfig[order.status] || statusConfig.preparing;
            const StatusIcon = config.icon;

            return (
              <motion.div
                key={order.orderId}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`glass-morphism rounded-2xl p-6 border-2 ${config.border} relative overflow-hidden`}>
                
                {order.status === "preparing" && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }} />
                )}

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{order.orderId}</p>
                      <h3 className="text-xl font-bold">Table {order.tableNumber}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {order.items.length} items • Rs. {Math.round(order.totalPrice)}
                      </p>
                    </div>
                    <motion.div
                      className={`p-3 rounded-xl ${config.bg}`}
                      animate={(order.status === "preparing" || order.status === "cooking") ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}>
                      <StatusIcon className={`w-6 h-6 ${config.color}`} />
                    </motion.div>
                  </div>

                  <div className="mb-4">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full bg-gradient-to-r ${
                          order.status === "ready" ? "from-accent to-accent" :
                          (order.status === "preparing" || order.status === "cooking") ? "from-primary to-secondary" :
                          "from-secondary to-secondary"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${order.progress}%` }}
                        transition={{ duration: 0.5 }} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 text-right">
                      {Math.round(order.progress)}% complete
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${config.color}`}>{config.label}</span>
                    {order.status !== "ready" && order.status !== "completed" && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">~{order.estimatedTime} min</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-lg">
          <motion.div
            className="w-2 h-2 rounded-full bg-accent"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }} />
          <span className="text-sm font-medium">Live Updates</span>
        </motion.div>
      </main>
    </div>
  );
};

export default KitchenTrackPage;