import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, CreditCard, Shield, Zap, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const QRPaymentsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-primary/20 shadow-[0_4px_30px_rgba(var(--primary),0.15)]">
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="container mx-auto px-4 py-4 flex items-center justify-between relative">
          <Link to="/">
            <Button variant="outline" size="sm" className="bg-background/50 hover:bg-primary/10 hover:text-primary border-primary/20 transition-all shadow-sm">
              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            <CreditCard className="w-5 h-5 text-primary" />
            <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent tracking-wide">
              QR Payments
            </h1>
          </div>
          <div className="w-[88px]" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto">
          
          <div className="text-center mb-12">
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-6">
              <CreditCard className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Instant, Secure Payments
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Pay in seconds with QR code scanning. Powered by Stripe for maximum security.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 text-center">
              <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Complete payments in under 3 seconds
              </p>
            </Card>

            <Card className="p-6 text-center">
              <Shield className="w-12 h-12 text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Bank-Level Security</h3>
              <p className="text-muted-foreground">
                PCI-DSS compliant encryption
              </p>
            </Card>

            <Card className="p-6 text-center">
              <CheckCircle className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Zero Contact</h3>
              <p className="text-muted-foreground">
                Completely contactless experience
              </p>
            </Card>
          </div>

          {/* QR Code Display */}
          <Card className="p-8 mb-8 text-center">
            <h3 className="text-2xl font-bold mb-6">Scan to Pay</h3>
            <div className="inline-flex flex-col items-center">
              <div className="w-48 h-48 bg-white p-4 rounded-xl shadow-lg mb-4">
                {/* QR Code Pattern */}
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* QR Code corners */}
                  <rect x="5" y="5" width="25" height="25" fill="black" />
                  <rect x="8" y="8" width="19" height="19" fill="white" />
                  <rect x="11" y="11" width="13" height="13" fill="black" />
                  
                  <rect x="70" y="5" width="25" height="25" fill="black" />
                  <rect x="73" y="8" width="19" height="19" fill="white" />
                  <rect x="76" y="11" width="13" height="13" fill="black" />
                  
                  <rect x="5" y="70" width="25" height="25" fill="black" />
                  <rect x="8" y="73" width="19" height="19" fill="white" />
                  <rect x="11" y="76" width="13" height="13" fill="black" />
                  
                  {/* QR Code data pattern */}
                  <rect x="35" y="5" width="5" height="5" fill="black" />
                  <rect x="45" y="5" width="5" height="5" fill="black" />
                  <rect x="55" y="5" width="5" height="5" fill="black" />
                  <rect x="35" y="15" width="5" height="5" fill="black" />
                  <rect x="50" y="15" width="5" height="5" fill="black" />
                  <rect x="60" y="15" width="5" height="5" fill="black" />
                  
                  <rect x="5" y="35" width="5" height="5" fill="black" />
                  <rect x="15" y="35" width="5" height="5" fill="black" />
                  <rect x="5" y="45" width="5" height="5" fill="black" />
                  <rect x="20" y="45" width="5" height="5" fill="black" />
                  <rect x="5" y="55" width="5" height="5" fill="black" />
                  <rect x="15" y="55" width="5" height="5" fill="black" />
                  
                  <rect x="35" y="35" width="30" height="30" rx="5" fill="none" stroke="black" strokeWidth="3" />
                  <rect x="45" y="45" width="10" height="10" fill="black" />
                  
                  <rect x="70" y="35" width="5" height="5" fill="black" />
                  <rect x="80" y="35" width="5" height="5" fill="black" />
                  <rect x="90" y="35" width="5" height="5" fill="black" />
                  <rect x="75" y="45" width="5" height="5" fill="black" />
                  <rect x="85" y="45" width="5" height="5" fill="black" />
                  <rect x="70" y="55" width="5" height="5" fill="black" />
                  <rect x="90" y="55" width="5" height="5" fill="black" />
                  
                  <rect x="35" y="70" width="5" height="5" fill="black" />
                  <rect x="45" y="70" width="5" height="5" fill="black" />
                  <rect x="55" y="70" width="5" height="5" fill="black" />
                  <rect x="40" y="80" width="5" height="5" fill="black" />
                  <rect x="50" y="80" width="5" height="5" fill="black" />
                  <rect x="60" y="80" width="5" height="5" fill="black" />
                  <rect x="35" y="90" width="5" height="5" fill="black" />
                  <rect x="55" y="90" width="5" height="5" fill="black" />
                  
                  <rect x="70" y="70" width="25" height="25" fill="none" stroke="black" strokeWidth="2" />
                  <rect x="75" y="75" width="5" height="5" fill="black" />
                  <rect x="85" y="75" width="5" height="5" fill="black" />
                  <rect x="80" y="85" width="5" height="5" fill="black" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground mb-2">Table #12 • Order #4582</p>
              <p className="text-2xl font-bold text-primary">$47.50</p>
            </div>
          </Card>

          <Card className="p-8 mb-8 bg-gradient-to-br from-card to-card/50">
            <h3 className="text-2xl font-bold mb-6 text-center">How It Works</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                <div>
                  <h4 className="font-bold mb-1">Scan QR Code</h4>
                  <p className="text-muted-foreground">Simply scan the QR code on your table or receipt</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                <div>
                  <h4 className="font-bold mb-1">Review Your Order</h4>
                  <p className="text-muted-foreground">Check your items and add a tip if you'd like</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                <div>
                  <h4 className="font-bold mb-1">Confirm Payment</h4>
                  <p className="text-muted-foreground">Pay securely with Apple Pay, Google Pay, or card</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="text-center">
            <Link to="/menu">
              <Button size="lg">
                Try Demo Payment
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>);

};

export default QRPaymentsPage;