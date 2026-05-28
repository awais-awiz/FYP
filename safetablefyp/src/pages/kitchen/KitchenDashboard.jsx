import { useOrders } from "@/hooks/useOrders";
import { useKitchenSocket } from "@/hooks/useKitchenSocket";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, Flame, ChefHat, Bell, AlertCircle, Search, ArrowUpDown, Activity, TrendingUp, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "react-router-dom";

const ITEMS_PER_PAGE = 8;
const TARGET_PREP_TIME = 20;

const elapsedMinutes = (createdAt, now) =>
  Math.floor((now.getTime() - new Date(createdAt).getTime()) / 60000);

const KitchenDashboard = () => {
  const { orders, refreshKitchen, updateOrderStatus, loading } = useOrders();
  const location = useLocation();
  const isAdminView = location.pathname.startsWith("/admin");

  const [now, setNow] = useState(new Date());
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { refreshKitchen(); }, [refreshKitchen]);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useKitchenSocket((msg) => {
    if (msg?.type === "new_order") {
      const utt = new SpeechSynthesisUtterance(`New order for Table ${msg.data.table_number}`);
      utt.rate = 1.1;
      utt.pitch = 1.1;
      window.speechSynthesis?.speak(utt);
    }
    refreshKitchen();
  });

  const filteredOrders = useMemo(() => {
    let result = orders.filter((o) => o.status !== "completed" && o.status !== "cancelled");
    if (statusFilter !== "all") result = result.filter((o) => o.status === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((o) =>
        o.orderId.toLowerCase().includes(q) ||
        String(o.tableNumber).includes(q) ||
        o.items.some((i) => i.name.toLowerCase().includes(q)),
      );
    }
    result.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      if (sortBy === "newest") return tb - ta;
      if (sortBy === "oldest") return ta - tb;
      if (sortBy === "time_elapsed") return ta - tb;
      return 0;
    });
    return result;
  }, [orders, statusFilter, searchQuery, sortBy]);

  const stats = useMemo(() => ({
    activeCount: orders.filter((o) => o.status !== "completed" && o.status !== "cancelled").length,
    completedCount: orders.filter((o) => o.status === "completed").length,
  }), [orders]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const filterTabs = [
    { id: "pending",   label: "New Orders" },
    { id: "confirmed", label: "Confirmed" },
    { id: "preparing", label: "In Progress" },
    { id: "ready",     label: "Ready" },
    { id: "all",       label: "All Active" },
  ];

  const getStatusConfig = (status) => {
    switch (status) {
      case "pending":   return { hover: "hover-glow-blue", color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/50",   label: "Received",  icon: Bell };
      case "confirmed": return { hover: "hover-glow", color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/50",   label: "Confirmed", icon: CheckCircle2 };
      case "preparing": return { hover: "hover-glow-amber", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/50", label: "Preparing", icon: Flame };
      case "ready":     return { hover: "hover-glow-green", color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/50",  label: "Ready",     icon: CheckCircle2 };
      default:          return { hover: "hover-glow", color: "text-slate-400",  bg: "bg-slate-500/10",  border: "border-slate-500/50",  label: "—",         icon: TrendingUp };
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] bg-background text-foreground flex flex-col overflow-hidden">
      {isAdminView && (
        <div className="px-6 py-4 border-b border-border bg-card/30">
          <div className="flex items-center gap-3">
            <ChefHat className="w-6 h-6 text-orange-500" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Kitchen Display</h1>
              <p className="text-sm text-muted-foreground">Live order management</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="bg-card/50 border-b border-border px-6 py-2 flex items-center justify-between text-xs font-mono text-muted-foreground">
        <div className="flex gap-6">
          <span className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-primary" />
            Active: <span className="text-foreground font-bold">{stats.activeCount}</span>
          </span>
          {loading && (
            <span className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Syncing
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            Status:{" "}
            <span className={`font-bold ${stats.activeCount === 0 ? "text-green-500" : "text-orange-500"}`}>
              {stats.activeCount === 0 ? "Clear" : "Busy"}
            </span>
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <header className="px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-center z-10 bg-background/50 backdrop-blur-sm sticky top-0">
        <div className="flex gap-2 p-1 bg-muted/50 rounded-lg border border-border backdrop-blur-sm w-full md:w-auto overflow-x-auto">
          {filterTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-primary/20 text-primary border border-primary/50 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-4 items-center w-full md:w-auto shrink-0">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              className="pl-9 bg-input border-input focus:border-primary w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] bg-input border-input">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Sort" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="time_elapsed">Most Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Order Cards */}
      <ScrollArea className="flex-1 p-6 pt-2">
        {paginatedOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            <AnimatePresence mode="popLayout">
              {paginatedOrders.map((order) => {
                const cfg = getStatusConfig(order.status);
                const elapsed = elapsedMinutes(order.createdAt, now);
                const progress = Math.min((elapsed / TARGET_PREP_TIME) * 100, 100);
                const isLate = elapsed > TARGET_PREP_TIME && order.status !== "ready";
                const StatusIcon = cfg.icon;
                const progressColor = progress > 85 ? "bg-red-500" : progress > 50 ? "bg-yellow-500" : "bg-green-500";

                return (
                  <motion.div
                    key={order.orderId}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative group"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Card className={`h-full border bg-card/60 backdrop-blur-sm overflow-hidden cursor-pointer ${cfg.hover} ${cfg.border} ${isLate ? "ring-2 ring-destructive/50" : ""}`}>
                      <div className={`p-3 border-b ${cfg.border} ${cfg.bg} flex justify-between items-center`}>
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
                          <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${isLate ? "bg-destructive/20 text-destructive-foreground" : "bg-muted text-muted-foreground"}`}>
                          <Clock className="w-3 h-3" />
                          <span className="text-xs font-mono font-bold">{elapsed}m</span>
                        </div>
                      </div>

                      {order.status !== "ready" && (
                        <div className="h-1 w-full bg-slate-800">
                          <div className={`h-full ${progressColor} transition-all duration-1000`} style={{ width: `${progress}%` }} />
                        </div>
                      )}

                      <div className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-2xl font-bold text-white">Table {order.tableNumber}</h3>
                          <Badge variant="outline" className="text-slate-500 border-slate-700 font-mono text-[10px]">
                            #{order.orderId.split("-")[1]}
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {order.items.slice(0, 4).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start text-sm">
                              <div className="flex gap-2">
                                <span className="font-bold text-slate-200 w-5">{item.quantity}x</span>
                                <span className="text-slate-300">{item.name}</span>
                              </div>
                            </div>
                          ))}
                          {order.items.length > 4 && (
                            <p className="text-xs text-slate-500 italic pt-1">+ {order.items.length - 4} more items...</p>
                          )}
                        </div>
                        {isLate && (
                          <div className="absolute top-2 right-2 animate-pulse">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col items-center justify-center text-muted-foreground py-20"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="p-8 rounded-full bg-gradient-to-br from-card via-muted/50 to-card mb-6 border-2 border-border"
            >
              <ChefHat className="w-16 h-16 text-muted-foreground/50" />
            </motion.div>
            <h3 className="text-2xl font-bold text-muted-foreground mb-2">All Clear in the Kitchen</h3>
            <p className="text-muted-foreground/80 text-center max-w-md">
              {statusFilter === "all" || statusFilter === "pending"
                ? "Waiting for orders... The kitchen is ready!"
                : `No ${statusFilter} orders at the moment.`}
            </p>
          </motion.div>
        )}
      </ScrollArea>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    isActive={currentPage === i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className="cursor-pointer"
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <OrderDetailsDialog
        order={selectedOrder}
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
        onUpdateStatus={updateOrderStatus}
      />
    </div>
  );
};

const OrderDetailsDialog = ({ order, open, onOpenChange, onUpdateStatus }) => {
  const [checkedItems, setCheckedItems] = useState({});
  useEffect(() => { if (open) setCheckedItems({}); }, [open]);
  if (!order) return null;

  const toggleItem = (id) => {
    if (order.status !== "preparing") return;
    setCheckedItems((p) => ({ ...p, [id]: !p[id] }));
  };

  const allChecked = order.items.every((item, idx) => checkedItems[`${item.id}-${idx}`]);

  let nextStatus = "", buttonLabel = "", isButtonDisabled = false;
  if (order.status === "pending")   { nextStatus = "confirmed";  buttonLabel = "Confirm"; }
  else if (order.status === "confirmed") { nextStatus = "preparing"; buttonLabel = "Begin Preparation"; }
  else if (order.status === "preparing") {
    nextStatus = "ready";
    buttonLabel = allChecked ? "Mark as Ready" : "Verify Items Before Completion";
    isButtonDisabled = !allChecked;
  } else if (order.status === "ready") {
    nextStatus = "completed";
    buttonLabel = "Mark Completed";
  }

  const handleSubmit = async () => {
    if (!nextStatus) return;
    try {
      await onUpdateStatus(order.orderId, nextStatus);
      onOpenChange(false);
    } catch (err) {
      alert(`Couldn't update: ${err.message}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border text-foreground max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden sm:max-w-2xl">
        <DialogHeader className="p-6 pb-2 bg-muted/30 border-b border-border">
          <div className="flex justify-between items-center pr-8">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                Table #{order.tableNumber}
                <Badge variant="secondary" className="bg-muted text-muted-foreground border border-border">
                  {order.status.toUpperCase()}
                </Badge>
              </DialogTitle>
              <p className="text-muted-foreground font-mono text-sm mt-1">{order.orderId}</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6 pt-2">
          <div className="space-y-6">
            {order.status === "preparing" && (
              <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-4 mb-6">
                <h4 className="text-blue-200 font-bold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Verify each item
                </h4>
                <p className="text-slate-300 text-sm">Tap each line as it's plated.</p>
              </div>
            )}
            <div className="space-y-4">
              {order.items.map((item, idx) => {
                const uid = `${item.id}-${idx}`;
                const isPreparing = order.status === "preparing";
                const isChecked = checkedItems[uid];
                return (
                  <div
                    key={uid}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${isPreparing ? "cursor-pointer hover:border-primary/50" : ""} ${
                      isChecked ? "bg-green-500/10 border-green-500/30 opacity-60" : "bg-card border-border hover:bg-muted/50"
                    }`}
                    onClick={() => toggleItem(uid)}
                  >
                    {isPreparing && (
                      <Checkbox
                        checked={isChecked || false}
                        className="mt-1 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className={`font-bold text-lg ${isChecked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                          {item.quantity}x {item.name}
                        </h3>
                        <span className="text-muted-foreground font-mono">${item.price}</span>
                      </div>
                      {item.notes && (
                        <div className="mt-2 bg-orange-500/10 text-orange-400 px-3 py-1.5 rounded text-sm font-medium inline-block border border-orange-500/20">
                          Note: {item.notes}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 bg-muted/30 border-t border-border">
          <div className="flex w-full gap-4">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            {order.status !== "completed" && (
              <Button
                disabled={isButtonDisabled}
                className="flex-[2] text-lg font-bold"
                onClick={handleSubmit}
              >
                {buttonLabel}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default KitchenDashboard;
