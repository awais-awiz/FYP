import { motion } from "framer-motion";
import { Mic, Box, Sparkles, CreditCard, Lightbulb, Globe, Clock, Bell } from "lucide-react";


import { Link } from "react-router-dom";

const features = [
{
  icon: Mic,
  title: "Voice Ordering",
  description: "Order in any language with AI-powered speech recognition. Natural conversation, zero friction.",
  gradient: "from-primary to-primary/50",
  link: "/voice-order"
},
{
  icon: Box,
  title: "3D AR Menu",
  description: "See every dish in stunning 3D detail. Rotate, zoom, and explore textures before ordering.",
  gradient: "from-secondary to-secondary/50",
  link: "/menu"
},
{
  icon: Sparkles,
  title: "AI Personalization",
  description: "Smart recommendations based on preferences, dietary needs, and past orders.",
  gradient: "from-accent to-accent/50",
  link: "/ai-personalization"
},
{
  icon: CreditCard,
  title: "QR Payments",
  description: "Instant, secure, contactless payments via QR code. Powered by Stripe.",
  gradient: "from-primary to-secondary",
  link: "/qr-payments"
},
{
  icon: Globe,
  title: "12 Languages",
  description: "Multilingual support powered by GPT-4 and Whisper AI. Everyone speaks your language.",
  gradient: "from-accent to-primary",
  link: "/languages"
},
{
  icon: Clock,
  title: "Kitchen Status",
  description: "Track your order in real-time with live progress updates and step-by-step kitchen tracking.",
  gradient: "from-green-500 to-emerald-700",
  link: "/kitchen-status"
},
{
  icon: Bell,
  title: "Instant Service",
  description: "Call a waiter, request cleaning, get your bill — one tap and staff are on their way.",
  gradient: "from-purple-500 to-indigo-500",
  link: "/instant-service"
}];



const Features = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card to-background" />

      <div className="container relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16">
          
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Powered by <span className="text-gradient-primary">Advanced AI</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A complete ecosystem of intelligent features designed for the future of dining
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) =>
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="group relative">
            
              <Link to={feature.link} className="block h-full">
                <div className="glass-morphism rounded-2xl p-8 h-full border-2 border-border hover-glow relative overflow-hidden">
                  {/* Hover Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                  <div className="relative z-10">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 group-hover:shadow-lg transition-shadow duration-300`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>

                    <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>

                    <p className="text-muted-foreground leading-relaxed mb-4">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </section>);

};

export default Features;