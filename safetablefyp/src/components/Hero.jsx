import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mic, Menu, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-dining.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }} />
        
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[100px]"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }} />
        
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8">
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>The Future of Dining</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
              <span className="text-gradient-primary">S.A.F.E.</span>
              <br />
              <span className="text-foreground">Table</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
              Experience the revolutionary smart dining system with{" "}
              <span className="text-primary font-semibold">voice ordering</span>,{" "}
              <span className="text-secondary font-semibold">3D AR menus</span>, and{" "}
              <span className="text-accent font-semibold">AI-powered</span> personalization.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/menu">
                <Button variant="hero" size="xl" className="group">
                  <Menu className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                  Explore 3D Menu
                </Button>
              </Link>
              <Link to="/voice-order">
                <Button variant="outline" size="xl" className="group">
                  <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Voice Order
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              {[
              { value: "12", label: "Languages" },
              { value: "90%", label: "Voice Accuracy" },
              { value: "3D", label: "AR Menu" }].
              map((stat, idx) =>
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="text-center">
                
                  <div className="text-3xl font-bold text-gradient-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Right Column - Hero Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative">
            
            <div className="relative rounded-2xl overflow-hidden border-2 border-primary/20 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-secondary/20 z-10" />
              <img
                src={heroImage}
                alt="S.A.F.E. Table - Futuristic smart dining experience with holographic AR menu"
                className="w-full h-auto object-cover" />
              
              
              {/* Floating Elements */}
              <motion.div
                className="absolute top-8 right-8 glass-morphism px-4 py-2 rounded-lg z-20"
                animate={{
                  y: [0, -10, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}>
                
                <div className="text-sm font-semibold text-primary">AI Powered</div>
              </motion.div>

              <motion.div
                className="absolute bottom-8 left-8 glass-morphism px-4 py-2 rounded-lg z-20"
                animate={{
                  y: [0, -10, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.5
                }}>
                
                <div className="text-sm font-semibold text-accent">Voice Ready</div>
              </motion.div>
            </div>

            {/* Glow Effect */}
            <div className="absolute inset-0 -z-10 blur-3xl opacity-30">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary via-secondary to-accent" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>);

};

export default Hero;