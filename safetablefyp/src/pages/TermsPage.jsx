import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const TermsPage = () => {
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
            <FileText className="w-5 h-5 text-primary" />
            <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent tracking-wide whitespace-nowrap">
              Terms of Service
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
          <h2 className="text-3xl font-bold mb-6">Terms of Service</h2>
          <p className="text-muted-foreground mb-8">
            Last updated: May 2026
          </p>

          <div className="space-y-8 text-foreground/80">
            <section>
              <h3 className="text-xl font-bold text-foreground mb-4">1. Agreement to Terms</h3>
              <p>
                By accessing or using the S.A.F.E. Table platform, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-foreground mb-4">2. Intellectual Property</h3>
              <p>
                The Service and its original content, features, and functionality are and will remain the exclusive property of S.A.F.E. Table and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of S.A.F.E. Table.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-foreground mb-4">3. User Responsibilities</h3>
              <p>
                As a user of our platform, whether as a restaurant partner or a diner, you agree not to misuse our services. This includes not interfering with our services or trying to access them using a method other than the interface and the instructions that we provide.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-foreground mb-4">4. Limitation of Liability</h3>
              <p>
                In no event shall S.A.F.E. Table, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-foreground mb-4">5. Changes to Terms</h3>
              <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.
              </p>
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default TermsPage;
