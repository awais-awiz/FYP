import { useOrders } from "@/hooks/useOrders";
import { useService } from "@/hooks/useService";
import { useKitchenSocket } from "@/hooks/useKitchenSocket";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ConciergeBell, Clock, Search, Utensils, AlertCircle, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

const ServerDashboard = () => {
  const { orders, refreshKitchen, updateOrderStatus } = useOrders();
  const { requests, resolveService, refresh: refreshService } = useService();
  const location = useLocation();
  const isAdminView = location.pathname.startsWith('/admin');
  const [now, setNow] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState('ready');
  const [confirmingOrderId, setConfirmingOrderId] = useState(null);

  useEffect(() => {
    refreshKitchen();
    refreshService({ status_filter: "pending" }).catch(() => {});
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [refreshKitchen, refreshService]);

  // Listen for real-time updates from the kitchen
  useKitchenSocket(() => refreshKitchen());

  const serverOrders = orders.filter((order) => 
    order.status === 'ready' || order.status === 'completed'
  );

  const serviceRequests = requests.filter((req) =>
    (req.type === 'help' || req.type === 'bill') && req.status === 'pending'
  );

  const filteredOrders = useMemo(() => {
    let result = serverOrders.filter((o) => o.status === activeTab);

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((o) =>
        o.orderId.toLowerCase().includes(lowerQuery) ||
        o.tableNumber.toString().includes(lowerQuery)
      );
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [serverOrders, activeTab, searchQuery]);

  const handleComplete = async (orderId, tableNumber) => {
    try {
      await updateOrderStatus(orderId, 'completed');
      toast.success(`Order for Table ${tableNumber} marked as served!`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleServiceRequest = async (id, tableNumber, type) => {
    await resolveService(id);
    toast.success(`${type === 'help' ? 'Help' : 'Bill'} request for Table ${tableNumber} resolved!`);
  };

  const getElapsedTime = (createdAt) => {
    return Math.floor((now.getTime() - new Date(createdAt).getTime()) / 60000);
  };

  const stats = useMemo(() => {
    return {
      ready: serverOrders.filter((o) => o.status === 'ready').length,
      completed: serverOrders.filter((o) => o.status === 'completed').length,
      serviceRequests: serviceRequests.length
    };
  }, [serverOrders, serviceRequests]);

  const filterTabs = [
    { id: 'ready', label: 'Ready to Serve', count: stats.ready },
    { id: 'completed', label: 'Served', count: stats.completed }
  ];

  return (
    <div className="h-[calc(100vh-80px)] bg-background text-foreground flex flex-col overflow-hidden">
      {isAdminView && (
        <div className="px-6 py-4 border-b border-border bg-card/30">
          <div className="flex items-center gap-3">
            <ConciergeBell className="w-6 h-6 text-amber-500" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Server Portal</h1>
              <p className="text-sm text-muted-foreground">Order delivery & service management</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card/50 border-b border-border px-6 py-2 flex items-center justify-between text-xs font-mono text-muted-foreground">
        <div className="flex gap-6">
          <span className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-primary" /> 
            Active: <span className="text-foreground font-bold">{stats.ready}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            Status: <span className={`font-bold ${stats.ready === 0 ? 'text-green-500' : 'text-amber-500'}`}>
              {stats.ready === 0 ? 'Clear' : 'Active'}
            </span>
          </span>
        </div>
      </div>

      <header className="px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-center z-10 bg-background/50 backdrop-blur-sm sticky top-0">
        <div className="flex gap-2 p-1 bg-muted/50 rounded-lg border border-border backdrop-blur-sm w-full md:w-auto overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id 
                  ? "bg-amber-500/20 text-amber-500 border border-amber-500/50 shadow-[0_0_10px_-4px_rgba(245,158,11,0.5)]" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="flex gap-4 items-center w-full md:w-auto shrink-0">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              className="pl-9 bg-input border-input focus:border-amber-500 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 p-6 pt-2">
        {serviceRequests.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-purple-500" />
              Service Requests
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
              {serviceRequests.map((req) => (
                <motion.div key={req.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <Card className="p-4 bg-card border-purple-500/30 hover-glow-purple">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-2xl font-bold">Table {req.tableNumber}</h3>
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20 mt-1">
                          {req.type === 'help' ? 'Help Needed' : 'Bill Request'}
                        </Badge>
                      </div>
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-500"
                      onClick={() => handleServiceRequest(req.id, req.tableNumber, req.type)}
                    >
                      Resolve
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="pb-20">
          {filteredOrders.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {filteredOrders.map((order) => {
                  const elapsed = getElapsedTime(order.createdAt);
                  const isReady = order.status === 'ready';

                  return (
                    <motion.div
                      key={order.orderId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      layout
                    >
                      <Card className={`p-6 bg-card ${isReady ? "border-amber-500/30 hover-glow-amber" : "border-slate-500/30 hover-glow-slate"} shadow-lg relative overflow-hidden cursor-pointer`}>
                        <div className={`absolute top-0 left-0 w-1 h-full ${isReady ? "bg-amber-500" : "bg-slate-500"}`} />
                        <div className="mb-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Table</span>
                              <h3 className="text-4xl font-bold text-foreground mt-1">{order.tableNumber}</h3>
                            </div>
                            <Badge variant="outline" className={isReady ? "bg-amber-500/10 text-amber-500 border-amber-500/30" : "bg-slate-500/10 text-slate-400 border-slate-500/30"}>
                              {isReady ? "Ready to Serve" : "Served"}
                            </Badge>
                          </div>

                          <div className="mt-4 space-y-2">
                            {order.items.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="flex gap-2 text-sm text-muted-foreground">
                                <span className="font-bold">{item.quantity}x</span>
                                <span>{item.name}</span>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <p className="text-xs text-muted-foreground italic">+ {order.items.length - 3} more items</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-muted-foreground text-sm mt-4 bg-muted/50 p-2 rounded-lg">
                            <Clock className="w-4 h-4" />
                            {elapsed}m ago
                          </div>
                        </div>

                        {isReady && confirmingOrderId !== order.orderId && (
                          <Button
                            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium py-6 text-lg"
                            onClick={() => setConfirmingOrderId(order.orderId)}
                          >
                            Mark as Served
                          </Button>
                        )}
                        {isReady && confirmingOrderId === order.orderId && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="flex-1 py-6 border-muted-foreground/30 hover:bg-muted"
                              onClick={() => setConfirmingOrderId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              className="flex-1 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 font-bold py-6"
                              onClick={() => {
                                handleComplete(order.orderId, order.tableNumber);
                                setConfirmingOrderId(null);
                              }}
                            >
                              Confirm
                            </Button>
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-2xl border border-dashed border-muted-foreground/20">
              <Utensils className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold text-muted-foreground">No {activeTab} Orders</h2>
              <p className="text-muted-foreground/80">Orders will appear here when available</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ServerDashboard;