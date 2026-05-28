import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, ChefHat, CheckCircle2, Package, Utensils, Home, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";

import { useOrders } from "@/hooks/useOrders";
import { useService } from "@/hooks/useService";
import { useCustomerSession } from "@/hooks/useCustomerSession";

const statusConfig = {
  pending:   { label: "Pending",   icon: Clock,        color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",             step: 1 },
  confirmed: { label: "Confirmed", icon: CheckCircle2, color: "bg-blue-500/20 text-blue-400 border-blue-500/30",                   step: 2 },
  preparing: { label: "Preparing", icon: ChefHat,      color: "bg-orange-500/20 text-orange-400 border-orange-500/30",             step: 3 },
  ready:     { label: "Ready",     icon: Package,      color: "bg-green-500/20 text-green-400 border-green-500/30",                step: 4 },
  completed: { label: "Completed", icon: Utensils,     color: "bg-muted text-muted-foreground border-muted",                      step: 5 },
  cancelled: { label: "Cancelled", icon: Utensils,     color: "bg-destructive/20 text-destructive-foreground border-destructive/30", step: 0 },
};

const TARGET_PREP_TIME = 20;

const OrdersPage = () => {
  const { tableNumber } = useCustomerSession();
  const { orders, refreshForTable, loading } = useOrders();
  const { requestService, requests, refresh: refreshService } = useService();

  useEffect(() => {
    if (!tableNumber) return;
    refreshForTable(tableNumber);
    refreshService({ table_number: tableNumber }).catch(() => {});
    const t = setInterval(() => refreshForTable(tableNumber), 5000);
    return () => clearInterval(t);
  }, [tableNumber, refreshForTable, refreshService]);

  const myOrders = useMemo(
    () => orders.filter((o) => !tableNumber || o.tableNumber === tableNumber),
    [orders, tableNumber],
  );
  const completedOrders = myOrders.filter((o) => o.status === "completed");
  const rawActiveOrders = myOrders.filter((o) => o.status !== "completed" && o.status !== "cancelled");



  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const activeOrders = useMemo(() =>
    rawActiveOrders.map((order) => {
      const createdAt = new Date(order.createdAt);
      const elapsed = (now.getTime() - createdAt.getTime()) / 60000;
      const progress = Math.min((elapsed / TARGET_PREP_TIME) * 100, 100);
      const estimatedTime = Math.max(0, Math.round(TARGET_PREP_TIME - elapsed));
      return { ...order, progress, estimatedTime };
    }),
    [rawActiveOrders, now],
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-primary/20 shadow-[0_4px_30px_rgba(var(--primary),0.15)]"
      >
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="container mx-auto px-4 py-4 flex items-center justify-between relative">
          <Link to="/">
            <Button variant="outline" size="sm" className="bg-background/50 hover:bg-primary/10 hover:text-primary border-primary/20 transition-all shadow-sm">
              <Home className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            <Clock className="w-5 h-5 text-primary" />
            <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent tracking-wide">
              My Orders
            </h1>
          </div>
          <div className="w-[88px]" />
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Table Info Banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Card className="glass-morphism p-4 border-2 border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">You are seated at</p>
                <p className="text-2xl font-bold text-gradient-primary">Table #{tableNumber || "—"}</p>
              </div>
              <p className="text-sm text-muted-foreground max-w-[200px] text-right">
                Only your orders for this table are shown here
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <Card className="glass-morphism p-4 text-center border-2 border-primary/20">
            <p className="text-3xl font-bold text-gradient-primary">{activeOrders.length}</p>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </Card>
          <Card className="glass-morphism p-4 text-center">
            <p className="text-3xl font-bold text-green-400">{completedOrders.length}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </Card>
        </motion.div>



        {/* Orders Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" />
            Your Orders
          </h2>

          {loading && activeOrders.length === 0 ? (
            <Card className="glass-morphism p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            </Card>
          ) : activeOrders.length === 0 ? (
            <Card className="glass-morphism p-12 text-center border-2 border-dashed border-border">
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                <Utensils className="w-20 h-20 mx-auto mb-6 text-muted-foreground/50" />
                <h3 className="text-2xl font-semibold mb-2">No Active Orders</h3>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                  Start ordering from our menu to see your orders here
                </p>
                <Link to="/menu">
                  <Button variant="hero" size="lg">Browse Menu</Button>
                </Link>
              </motion.div>
            </Card>
          ) : (
            <div className="space-y-6">
              {activeOrders.map((order, idx) => {
                const cfg = statusConfig[order.status] || statusConfig.pending;
                const StatusIcon = cfg.icon;
                const currentStep = cfg.step;

                return (
                  <motion.div
                    key={order.orderId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    layout
                  >
                    <Card className="glass-morphism overflow-hidden border-2 border-primary/30">
                      {/* Order Header */}
                      <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 border-b border-border">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Order Number</p>
                            <h3 className="text-2xl font-bold text-gradient-primary tracking-wider">
                              {order.orderId}
                            </h3>
                          </div>
                          <Badge className={`${cfg.color} px-4 py-2 text-sm`}>
                            <StatusIcon className="w-4 h-4 mr-2" />
                            {cfg.label}
                          </Badge>
                        </div>
                      </div>

                      {/* Live Progress Bar */}
                      {order.status !== "completed" && (
                        <div className="px-6 pt-6 pb-4">
                          <div className="flex justify-between items-end mb-3">
                            <span className="text-sm font-semibold text-primary flex items-center gap-2 uppercase tracking-widest">
                              <Clock className="w-4 h-4 animate-spin-slow" />
                              Estimated Wait
                            </span>
                            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                              {order.status === "ready" ? "Ready!" : `~${order.estimatedTime} min`}
                            </span>
                          </div>
                          <div className="h-3 bg-muted/50 rounded-full overflow-hidden shadow-inner border border-border/50 relative">
                            {/* Animated scanning light effect */}
                            <div className="absolute top-0 bottom-0 w-20 bg-white/20 blur-xl animate-scan pointer-events-none z-10" />
                            <motion.div
                              className={`h-full relative shadow-[0_0_15px_rgba(var(--primary),0.5)] ${
                                order.status === "ready"
                                  ? "bg-gradient-to-r from-green-500 to-emerald-400"
                                  : order.progress > 85
                                  ? "bg-gradient-to-r from-red-500 to-rose-400"
                                  : order.progress > 50
                                  ? "bg-gradient-to-r from-orange-500 to-amber-400"
                                  : "bg-gradient-to-r from-primary to-accent"
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${order.progress}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Progress Steps */}
                      <div className="px-6 py-8 border-b border-border/50 bg-background/30">
                        <div className="flex items-center justify-between relative max-w-lg mx-auto">
                          <div className="absolute top-5 left-4 right-4 h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-primary via-purple-500 to-accent"
                              initial={{ width: "0%" }}
                              animate={{ width: `${((currentStep - 1) / 4) * 100}%` }}
                              transition={{ duration: 0.8, ease: "easeInOut" }}
                            />
                          </div>
                          {["pending", "confirmed", "preparing", "ready", "completed"].map((status, i) => {
                            const c = statusConfig[status];
                            const Icon = c.icon;
                            const isActive = currentStep > i;
                            const isCurrent = currentStep === i + 1;
                            return (
                              <div key={status} className="relative z-10 flex flex-col items-center">
                                <motion.div
                                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                                    isActive
                                      ? "bg-gradient-to-br from-primary to-accent text-white shadow-primary/40 border border-white/20"
                                      : isCurrent
                                      ? "bg-background text-primary border-2 border-primary shadow-[0_0_20px_rgba(var(--primary),0.3)]"
                                      : "bg-muted text-muted-foreground border border-border"
                                  }`}
                                  animate={isCurrent ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : {}}
                                  transition={{ duration: 2, repeat: isCurrent ? Infinity : 0, ease: "easeInOut" }}
                                >
                                  <Icon className={`${isCurrent ? "w-5 h-5 md:w-6 md:h-6 text-primary" : "w-4 h-4 md:w-5 md:h-5"} drop-shadow-sm`} />
                                </motion.div>
                                <span className={`text-xs mt-2 ${isCurrent ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                                  {c.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Table #{order.tableNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="text-2xl font-bold text-gradient-primary">
                              Rs. {Math.round(Number(order.totalPrice))}
                            </p>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="bg-muted/30 rounded-lg p-4">
                          <p className="text-sm font-semibold mb-3">
                            {order.items.reduce((acc, i) => acc + i.quantity, 0)} Items
                          </p>
                          <div className="space-y-2">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex justify-between items-center text-sm p-2 hover:bg-background/50 rounded-md transition-colors">
                                <span className="flex items-center gap-3">
                                  <span className="w-7 h-7 bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 text-primary rounded-lg flex items-center justify-center text-sm font-black shadow-sm">
                                    {item.quantity}
                                  </span>
                                  <span className="font-medium text-foreground">{item.name}</span>
                                </span>
                                <span className="font-semibold text-primary">
                                  Rs. {Math.round(item.price * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.section>
      </main>
    </div>
  );
};

export default OrdersPage;
