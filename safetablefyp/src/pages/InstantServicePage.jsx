import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Home,
  Bell,
  Wind,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Coffee,
} from "lucide-react";
import { useCustomerSession } from "@/hooks/useCustomerSession";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const SERVICE_TYPES = [
  {
    id: "waiter",
    icon: Bell,
    label: "Call Waiter",
    desc: "Need assistance? A waiter will be with you shortly.",
    gradient: "from-blue-500 to-indigo-600",
    shadow: "shadow-blue-500/40",
    glow: "rgba(99,102,241,0.4)",
    emoji: "🛎️",
  },
  {
    id: "cleaner",
    icon: Wind,
    label: "Call Cleaner",
    desc: "Table needs a quick clean? We'll send someone right over.",
    gradient: "from-emerald-500 to-teal-600",
    shadow: "shadow-emerald-500/40",
    glow: "rgba(16,185,129,0.4)",
    emoji: "🧹",
  },
  {
    id: "napkins",
    icon: Coffee,
    label: "Extra Napkins",
    desc: "Need extra napkins or condiments? Just ask!",
    gradient: "from-pink-500 to-rose-600",
    shadow: "shadow-pink-500/40",
    glow: "rgba(244,63,94,0.4)",
    emoji: "🍃",
  },
  {
    id: "emergency",
    icon: AlertCircle,
    label: "Emergency",
    desc: "Urgent matter? This will immediately alert the entire staff.",
    gradient: "from-red-500 to-rose-700",
    shadow: "shadow-red-500/40",
    glow: "rgba(239,68,68,0.5)",
    emoji: "🚨",
  },
];

const InstantServicePage = () => {
  const { tableNumber } = useCustomerSession();
  const [loading, setLoading] = useState(null);
  const [sent, setSent] = useState({});

  const handleRequest = async (type) => {
    if (!tableNumber) {
      toast.error("No table assigned. Please scan your QR code first.");
      return;
    }
    setLoading(type);
    try {
      const res = await fetch(`${API_BASE}/api/service-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table_number: String(tableNumber), request_type: type }),
      });
      if (!res.ok) throw new Error("Request failed");
      setSent((prev) => ({ ...prev, [type]: true }));
      const service = SERVICE_TYPES.find((s) => s.id === type);
      toast.success(`${service?.emoji} ${service?.label} sent!`, {
        description: `Staff has been notified for Table #${tableNumber}`,
      });
      // Auto-reset the sent state after 30 seconds
      setTimeout(() => setSent((prev) => ({ ...prev, [type]: false })), 30000);
    } catch {
      toast.error("Could not send request. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-primary/20 shadow-[0_4px_30px_rgba(var(--primary),0.15)]">
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="container mx-auto px-4 py-4 flex items-center justify-between relative">
          <Link to="/">
            <Button variant="outline" size="sm" className="bg-background/50 hover:bg-primary/10 hover:text-primary border-primary/20 transition-all shadow-sm">
              <Home className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            <Bell className="w-5 h-5 text-primary" />
            <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent tracking-wide whitespace-nowrap">
              Instant Service
            </h1>
          </div>
          {tableNumber && (
            <div className="bg-primary/10 px-3 py-1.5 rounded-full text-sm font-bold text-primary shadow-sm border border-primary/20">
              Table #{tableNumber}
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-3xl">
        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <p className="text-5xl mb-3">🛎️</p>
          <h2 className="text-3xl md:text-4xl font-black mb-3">
            How can we{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              help you?
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Tap a button below and our staff will be with you in moments. No waiting, no guessing.
          </p>
        </motion.div>

        {/* Service Buttons Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {SERVICE_TYPES.map((service, idx) => {
            const isSent = sent[service.id];
            const isLoading = loading === service.id;
            const Icon = service.icon;

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, ease: "easeOut" }}
                whileHover={!isSent ? { y: -4, scale: 1.02 } : {}}
                className="h-full"
              >
                <Card
                  className={`relative overflow-hidden border transition-all duration-300 cursor-pointer group h-full min-h-[160px] ${
                    isSent
                      ? "border-green-500/40 bg-green-500/5"
                      : "border-border/60 hover:border-primary/40 bg-card/60 backdrop-blur-sm"
                  }`}
                  onClick={() => !isSent && !isLoading && handleRequest(service.id)}
                >
                  {/* Hover gradient overlay */}
                  {!isSent && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  )}

                  <div className="p-6 relative z-10">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`relative flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center shadow-lg ${service.shadow} group-hover:scale-110 transition-transform duration-300`}>
                        <AnimatePresence mode="wait">
                          {isSent ? (
                            <motion.div
                              key="check"
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0 }}
                            >
                              <CheckCircle2 className="w-7 h-7 text-white" />
                            </motion.div>
                          ) : isLoading ? (
                            <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                              <Loader2 className="w-7 h-7 text-white animate-spin" />
                            </motion.div>
                          ) : (
                            <motion.div key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                              <Icon className="w-7 h-7 text-white" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {/* Pulsing ring when sent */}
                        {isSent && (
                          <div className="absolute inset-0 rounded-2xl bg-green-400/30 animate-ping" />
                        )}
                      </div>

                      {/* Text — fixed height container so card never shrinks */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-lg font-bold mb-1 transition-colors ${isSent ? "text-green-500" : "text-foreground group-hover:text-primary"}`}>
                          {isSent ? "Request Sent! ✓" : service.label}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed min-h-[40px]">
                          {isSent ? `Staff notified for Table #${tableNumber}` : service.desc}
                        </p>
                      </div>
                    </div>

                    {/* Bottom action hint — always present to keep card height stable */}
                    <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between">
                      {isSent ? (
                        <span className="text-xs text-green-500 font-semibold">✓ Staff has been notified</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">{service.emoji} Tap to notify staff</span>
                      )}
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${service.gradient} ${isSent ? "opacity-60" : "opacity-20 group-hover:opacity-60"} transition-opacity`} />
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* No table warning */}
        <AnimatePresence>
          {!tableNumber && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center gap-3 text-amber-600"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">
                No table detected. Please scan your table's QR code to use this service.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default InstantServicePage;
