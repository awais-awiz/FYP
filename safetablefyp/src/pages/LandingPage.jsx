import Hero from "@/components/Hero";
import Features from "@/components/Features";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChefHat } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useOrders } from "@/hooks/useOrders";
import { useCustomerSession } from "@/hooks/useCustomerSession";

const LandingPage = () => {
  const { tableNumber } = useCustomerSession();
  const { orders, refreshForTable } = useOrders();
  
  // Filter for active orders belonging to this specific table
  const activeOrders = orders.filter(
    (o) => o.tableNumber === tableNumber && o.status !== "completed" && o.status !== "cancelled",
  );

  // Auto-refresh orders when the landing page loads to show the correct count
  useEffect(() => {
    if (tableNumber) refreshForTable(tableNumber);
  }, [tableNumber, refreshForTable]);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Floating Orders Indicator - Shows when there are items in the kitchen */}
      <AnimatePresence>
        {activeOrders.length > 0 && (
          <Link to="/orders">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              whileHover={{ scale: 1.05, x: -5 }}
              whileTap={{ scale: 0.95 }}
              className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center gap-3 bg-green-600 text-white rounded-l-2xl py-4 px-5 shadow-[0_4px_25px_rgba(34,197,94,0.5)] cursor-pointer transition-all duration-300 hover:brightness-110"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <ChefHat className="w-6 h-6" />
              </motion.div>
              <div className="flex flex-col items-start">
                <span className="text-xs opacity-80">Active Orders</span>
                <span className="text-lg font-bold leading-tight">{activeOrders.length}</span>
              </div>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </motion.div>
          </Link>
        )}
      </AnimatePresence>

      {/* Top Navigation / Status Bar */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-4">
        <Link to="/login">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
            Staff Login
          </Button>
        </Link>
        <div className="bg-background/80 backdrop-blur-md border border-primary/20 px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${tableNumber ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
          <span className="text-sm font-medium">
            {tableNumber ? `Table #${tableNumber}` : "No table"}
          </span>
        </div>
      </div>

      <Hero />
      <Features />

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-card via-card/50 to-background" />

        <div className="container relative z-10 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Ready to Experience the{" "}
              <span className="text-gradient-primary">Future</span>?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join restaurants worldwide who are revolutionizing their dining experience with <span className="text-gradient-primary font-semibold">S.A.F.E.</span> Table
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/menu">
                <Button variant="hero" size="xl">
                  Try the Demo
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="xl">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 <span className="text-gradient-primary font-semibold">S.A.F.E.</span> Table. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
              <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;