import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Clock,
  ChefHat,
  CheckCircle2,
  Package,
  Utensils,
  Loader2,
  RefreshCw,
  UtensilsCrossed,
} from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { useCustomerSession } from "@/hooks/useCustomerSession";

// ─── Status config ──────────────────────────────────────────────────────────
const STATUS = {
  pending:   { label: "Pending",   icon: Clock,        color: "text-primary",         bg: "bg-primary/10 border-primary/20",        step: 1 },
  confirmed: { label: "Confirmed", icon: CheckCircle2, color: "text-blue-400",         bg: "bg-blue-500/10 border-blue-500/20",       step: 2 },
  preparing: { label: "Preparing", icon: ChefHat,      color: "text-orange-400",       bg: "bg-orange-500/10 border-orange-500/20",   step: 3 },
  ready:     { label: "Ready!",    icon: Package,      color: "text-green-400",        bg: "bg-green-500/10 border-green-500/20",     step: 4 },
  completed: { label: "Completed", icon: Utensils,     color: "text-muted-foreground", bg: "bg-muted/20 border-muted",                step: 5 },
  cancelled: { label: "Cancelled", icon: UtensilsCrossed, color: "text-destructive",   bg: "bg-destructive/10 border-destructive/30", step: 0 },
};

const STEPS = [
  { key: "pending",   label: "Order Placed", icon: Clock },
  { key: "confirmed", label: "Confirmed",    icon: CheckCircle2 },
  { key: "preparing", label: "Preparing",    icon: ChefHat },
  { key: "ready",     label: "Ready",        icon: Package },
];

const TARGET_PREP_TIME = 20; // minutes

// ─── Progress Bar ────────────────────────────────────────────────────────────
const ProgressBar = ({ progress, status }) => {
  const isReady = status === "ready" || status === "completed";
  return (
    <div className="relative h-3 bg-muted/40 rounded-full overflow-hidden my-4">
      <motion.div
        className={`h-full rounded-full ${isReady ? "bg-gradient-to-r from-green-500 to-emerald-400" : "bg-gradient-to-r from-primary to-accent"}`}
        initial={{ width: 0 }}
        animate={{ width: `${isReady ? 100 : progress}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      {/* Scan shimmer */}
      {!isReady && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[scan_2s_ease-in-out_infinite]" />
      )}
    </div>
  );
};

// ─── Step Indicator ──────────────────────────────────────────────────────────
const StepIndicator = ({ status }) => {
  const currentStep = STATUS[status]?.step ?? 0;
  return (
    <div className="flex items-center gap-0 my-5">
      {STEPS.map((step, idx) => {
        const stepNum = idx + 1;
        const done = currentStep >= stepNum;
        const active = currentStep === stepNum;
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <motion.div
                animate={active ? { scale: [1, 1.15, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.8 }}
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  done
                    ? "bg-primary border-primary text-white"
                    : "bg-muted/30 border-border text-muted-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
              </motion.div>
              <span className={`text-[10px] font-semibold whitespace-nowrap ${done ? "text-primary" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 rounded transition-colors duration-500 ${currentStep > stepNum ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Single Order Card ───────────────────────────────────────────────────────
const OrderCard = ({ order, now }) => {
  const cfg = STATUS[order.status] ?? STATUS.pending;
  const Icon = cfg.icon;
  const isActive = order.status !== "completed" && order.status !== "cancelled";

  // Status-based progress (doesn't depend on timestamps)
  const statusProgress = { pending: 15, confirmed: 40, preparing: 70, ready: 100 };
  const progress = statusProgress[order.status] ?? 0;

  // Time since order was placed (gracefully handle missing date)
  let timeSincePlaced = null;
  if (order.createdAt) {
    const created = new Date(order.createdAt);
    if (!isNaN(created.getTime())) {
      const diffMs = now - created;
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) timeSincePlaced = "Just now";
      else if (mins < 60) timeSincePlaced = `${mins} min ago`;
      else timeSincePlaced = `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={`border-2 ${cfg.bg} overflow-hidden`}>
        {/* Header strip */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div>
            <p className="text-xs text-muted-foreground font-mono mb-0.5">{order.orderId}</p>
            <p className="text-lg font-black text-foreground">Table #{order.tableNumber}</p>
          </div>
          <div className="text-right">
            <Badge className={`${cfg.bg} ${cfg.color} border font-bold px-3 py-1 text-sm flex items-center gap-1.5`}>
              <Icon className="w-4 h-4" />
              {cfg.label}
            </Badge>
            {timeSincePlaced && (
              <p className="text-[11px] text-muted-foreground mt-1">🕐 Placed {timeSincePlaced}</p>
            )}
          </div>
        </div>

        {/* Progress */}
        {isActive && order.status !== "ready" && (
          <div className="px-5">
            <ProgressBar progress={progress} status={order.status} />
          </div>
        )}
        {order.status === "ready" && (
          <div className="px-5 py-2">
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="text-center py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 font-bold text-sm"
            >
              🎉 Your order is ready — bon appétit!
            </motion.div>
          </div>
        )}

        {/* Step tracker */}
        {isActive && (
          <div className="px-5">
            <StepIndicator status={order.status} />
          </div>
        )}

        {/* Items list */}
        <div className="px-5 pb-5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Items</p>
          <div className="space-y-1.5">
            {(order.items ?? []).map((item, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm text-foreground">
                  <span className="text-primary font-bold mr-1">{item.quantity}×</span>
                  {item.name}
                </span>
                <span className="text-sm font-semibold text-primary">Rs. {Math.round(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border/30 flex justify-between font-black text-base">
            <span>Total</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Rs. {Math.round(Number(order.totalPrice))}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
const KitchenStatusPage = () => {
  const { tableNumber } = useCustomerSession();
  const { orders, refreshForTable, loading } = useOrders();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!tableNumber) return;
    refreshForTable(tableNumber);
    const pollInterval = setInterval(() => refreshForTable(tableNumber), 5000);
    return () => clearInterval(pollInterval);
  }, [tableNumber, refreshForTable]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const myOrders = useMemo(
    () => orders.filter((o) => !tableNumber || o.tableNumber === tableNumber),
    [orders, tableNumber],
  );

  const activeOrders = myOrders.filter((o) => o.status !== "completed" && o.status !== "cancelled");
  const completedOrders = myOrders.filter((o) => o.status === "completed" || o.status === "cancelled");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 relative bg-background/80 backdrop-blur-2xl border-b border-primary/20 shadow-[0_4px_30px_rgba(var(--primary),0.15)]"
      >
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="container mx-auto px-4 py-4 flex items-center justify-between relative">
          <Link to="/">
            <Button variant="outline" size="sm" className="bg-background/50 hover:bg-primary/10 hover:text-primary border-primary/20 transition-all shadow-sm">
              <Home className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            <ChefHat className="w-5 h-5 text-primary" />
            <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent tracking-wide whitespace-nowrap">
              Kitchen Status
            </h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary"
            onClick={() => tableNumber && refreshForTable(tableNumber)}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Table badge */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Card className="p-4 border-2 border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Live tracking for</p>
                <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  Table #{tableNumber ?? "—"}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Live
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Loading */}
        {loading && activeOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Fetching your orders…</p>
          </div>
        )}

        {/* No active orders */}
        {!loading && activeOrders.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <p className="text-6xl mb-4">🍽️</p>
            <h2 className="text-2xl font-bold mb-2">No Active Orders</h2>
            <p className="text-muted-foreground mb-6">Your orders will appear here once you place them.</p>
            <Link to="/menu">
              <Button variant="default" className="bg-gradient-to-r from-primary to-accent text-white font-bold shadow-lg">
                Browse Menu
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Active Orders ({activeOrders.length})
            </h2>
            <AnimatePresence>
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <OrderCard key={order.orderId} order={order} now={now} />
                ))}
              </div>
            </AnimatePresence>
          </div>
        )}

        {/* Completed Orders */}
        {completedOrders.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Past Orders
            </h2>
            <div className="space-y-3 opacity-60">
              {completedOrders.map((order) => (
                <OrderCard key={order.orderId} order={order} now={now} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default KitchenStatusPage;
