import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Heart, TrendingUp, Users, BrainCircuit, Wand2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const AIPersonalizationPage = () => {
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
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent tracking-wide whitespace-nowrap">
              AI Personalization
            </h1>
          </div>
          <div className="w-[88px]" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-2">Smart Recommendations</h1>
        <p className="text-muted-foreground mb-8 text-center max-w-sm">
          Our AI learns your preferences to suggest dishes you'll love.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-12 w-full max-w-4xl">
          {[
            {
              icon: Heart,
              title: "Palate Profiling",
              desc: "Analyzes your past orders and ratings to construct your unique flavor matrix.",
              color: "text-primary",
              bg: "bg-primary/10",
              border: "border-primary/30"
            },
            {
              icon: TrendingUp,
              title: "Nutritional Sync",
              desc: "Filters the menu to perfectly match your macros and dietary restrictions.",
              color: "text-orange-500",
              bg: "bg-orange-500/10",
              border: "border-orange-500/30"
            },
            {
              icon: Users,
              title: "Group Harmony",
              desc: "Cross-references multiple profiles to find dishes that satisfy everyone.",
              color: "text-purple-500",
              bg: "bg-purple-500/10",
              border: "border-purple-500/30"
            },
            {
              icon: Wand2,
              title: "Contextual Suggestions",
              desc: "Recommendations adapt instantly based on time of day, weather, and availability.",
              color: "text-accent",
              bg: "bg-accent/10",
              border: "border-accent/30"
            }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className={`p-6 glass-morphism border-2 ${feature.border} hover-glow cursor-pointer h-full transition-all`}>
                <div className={`inline-flex p-3 rounded-xl ${feature.bg} mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {feature.desc}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link to="/menu">
            <Button size="lg" className="group rounded-full px-8 py-6 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.4)]">
              Try Personalized Menu
              <Sparkles className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </main>
    </div>
  );
};

export default AIPersonalizationPage;