import { useService } from "@/hooks/useService";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sparkles, CheckCircle, Clock, Search, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { tablesApi } from "@/lib/api";
import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

const CleanerDashboard = () => {
  const { requests, resolveService, refresh: refreshService } = useService();
  const { user } = useAuth();
  const location = useLocation();
  const isAdminView = location.pathname.startsWith('/admin');
  const [now, setNow] = useState(new Date());
  const prevRequestsLength = useRef(requests.length);

  useEffect(() => {
    // Initial fetch
    refreshService({ role: "cleaner", status_filter: "pending" }).catch(() => {});
    
    // Auto-refresh requests every 8 seconds
    const refreshTimer = setInterval(
      () => refreshService({ role: "cleaner", status_filter: "pending" }).catch(() => {}),
      8000,
    );

    // Update the "minutes ago" counter every minute
    const tickTimer = setInterval(() => setNow(new Date()), 60000);

    return () => { 
      clearInterval(refreshTimer); 
      clearInterval(tickTimer); 
    };
  }, [refreshService]);

  // Sound Alert Logic
  useEffect(() => {
    const currentPending = requests.filter((r) => r.type === 'clean' && r.status === 'pending');

    if (currentPending.length > prevRequestsLength.current) {
      const newRequest = currentPending.sort((a, b) => 
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
      )[0];

      const isRecent = new Date().getTime() - new Date(newRequest.requestedAt).getTime() < 10000;

      if (newRequest && isRecent) {
        const utterance = new SpeechSynthesisUtterance(`Cleaning requested for Table ${newRequest.tableNumber}`);
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);
        toast.info(`New cleaning request: Table ${newRequest.tableNumber}`);
      }
    }
    prevRequestsLength.current = currentPending.length;
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) =>
      req.type === 'clean' && req.status === 'pending'
    ).sort((a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime());
  }, [requests]);

  const handleResolve = async (id, tableNumber) => {
    await resolveService(id);
    await tablesApi.endSession(tableNumber).catch(console.error);
    toast.success(`Table ${tableNumber} marked as clean and available!`);
  };

  const stats = useMemo(() => {
    const pending = requests.filter((req) => req.type === 'clean' && req.status === 'pending').length;

    const completedToday = requests.filter((req) => {
      if (req.type !== 'clean' || req.status !== 'completed' || !req.completedAt) return false;
      const completedDate = new Date(req.completedAt);
      return completedDate.toDateString() === now.toDateString();
    });

    return {
      pending,
      resolved: completedToday.length
    };
  }, [requests, now]);

  return (
    <div className="h-[calc(100vh-80px)] bg-background text-foreground flex flex-col overflow-hidden">
      {isAdminView && (
        <div className="px-6 py-4 border-b border-border bg-card/30">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Cleaner Portal</h1>
              <p className="text-sm text-muted-foreground">Service request management</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card/50 border-b border-border px-6 py-2 flex items-center justify-between text-xs font-mono text-muted-foreground">
        <div className="flex gap-6">
          <span className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-primary" /> 
            Active: <span className="text-foreground font-bold">{stats.pending}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            Status: <span className={`font-bold ${stats.pending === 0 ? 'text-green-500' : 'text-purple-500'}`}>
              {stats.pending === 0 ? 'Clear' : 'Active'}
            </span>
          </span>
        </div>
      </div>

      <header className="px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-center z-10 bg-background/50 backdrop-blur-sm sticky top-0">
        <div className="flex gap-2 p-1 bg-purple-500/10 rounded-lg border border-purple-500/20 backdrop-blur-sm w-full md:w-auto">
          <div className="px-4 py-1.5 rounded-md text-sm font-bold text-purple-500 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Active Cleaning Tasks
          </div>
        </div>

        <div className="flex gap-4 items-center w-full md:w-auto shrink-0">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              className="pl-9 bg-input border-input focus:border-purple-500 w-full"
            />
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 p-6 pt-2">
        <div className="pb-20">
          {filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-2xl border border-dashed border-muted-foreground/20 max-w-2xl mx-auto">
              <CheckCircle className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold text-muted-foreground">All Tables Clean</h2>
              <p className="text-muted-foreground/80">No active cleaning requests at the moment.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {filteredRequests.map((req) => {
                  const elapsedMinutes = Math.floor((now.getTime() - new Date(req.requestedAt).getTime()) / 60000);

                  return (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      layout
                    >
                      <Card className="p-6 bg-card border-purple-500/30 shadow-lg shadow-purple-500/5 relative overflow-hidden h-full flex flex-col justify-between hover:shadow-purple-500/20 transition-all">
                        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Table</span>
                              <h3 className="text-4xl font-bold text-foreground mt-1">{req.tableNumber}</h3>
                            </div>
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Cleanup
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-6 bg-muted/50 p-2 rounded-lg">
                            <Clock className="w-4 h-4" />
                            Requested {elapsedMinutes}m ago
                          </div>
                        </div>
                        <Button
                          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-6 text-lg shadow-lg active:scale-[0.98]"
                          onClick={() => handleResolve(req.id, req.tableNumber)}
                        >
                          Mark as Cleaned
                        </Button>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CleanerDashboard;