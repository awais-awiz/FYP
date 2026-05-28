import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const PrivacyPage = () => {
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
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent tracking-wide whitespace-nowrap">
              Privacy Policy
            </h1>
          </div>
          <div className="w-[88px]" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-12 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-invert prose-lg max-w-none"
        >
          <h2 className="text-3xl font-bold mb-6">Your Privacy Matters</h2>
          <p className="text-muted-foreground mb-8">
            Last updated: May 2026
          </p>

          <div className="space-y-8 text-foreground/80">
            <section>
              <h3 className="text-xl font-bold text-foreground mb-4">1. Information We Collect</h3>
              <p>
                At S.A.F.E. Table, we collect information that you provide directly to us when using our platform. This includes table session data, order history, and optionally, your voice data if you choose to use our voice ordering features. We do not store your payment information directly; all transactions are securely processed by Stripe.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-foreground mb-4">2. How We Use Your Information</h3>
              <p>
                We use the information we collect to provide, maintain, and improve our services. This includes processing your orders, providing personalized menu recommendations based on your preferences, and communicating with you about your order status.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-foreground mb-4">3. Data Security</h3>
              <p>
                We implement state-of-the-art security measures designed to protect your information from unauthorized access and use. Our systems are regularly monitored and updated to ensure the highest level of security for our restaurant partners and their customers.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-foreground mb-4">4. Sharing of Information</h3>
              <p>
                We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted third parties who assist us in operating our platform, conducting our business, or servicing you, so long as those parties agree to keep this information confidential.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-foreground mb-4">5. Contact Us</h3>
              <p>
                If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@aifusion.restaurant" className="text-primary hover:underline">privacy@aifusion.restaurant</a>.
              </p>
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default PrivacyPage;
