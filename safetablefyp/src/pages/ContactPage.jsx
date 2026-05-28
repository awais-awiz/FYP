import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Mail, Phone, MapPin, Send, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success("Message sent successfully!", {
      description: "We'll get back to you within 24 hours."
    });

    setFormData({ name: "", email: "", subject: "", message: "" });
    setIsSubmitting(false);
  };

  const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    value: "hello@aifusion.restaurant",
    link: "mailto:hello@aifusion.restaurant"
  },
  {
    icon: Phone,
    title: "Phone",
    value: "+1 (555) 123-4567",
    link: "tel:+15551234567"
  },
  {
    icon: MapPin,
    title: "Address",
    value: "123 Innovation Drive, Tech City, TC 10001",
    link: "#"
  },
  {
    icon: Clock,
    title: "Hours",
    value: "Mon-Sun: 11AM - 11PM",
    link: "#"
  }];


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
            <Mail className="w-5 h-5 text-primary" />
            <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent tracking-wide whitespace-nowrap">
              Contact Us
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
          className="max-w-6xl mx-auto">
          
          <div className="text-center mb-12">
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-6">
              <Mail className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4">Get in Touch</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Have questions about our AI-powered dining experience? We'd love to hear from you.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-6">Send us a Message</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Name</label>
                    <Input
                      name="name"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={handleChange}
                      required />
                    
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email</label>
                    <Input
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      required />
                    
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Subject</label>
                  <Input
                    name="subject"
                    placeholder="How can we help?"
                    value={formData.subject}
                    onChange={handleChange}
                    required />
                  
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Message</label>
                  <Textarea
                    name="message"
                    placeholder="Tell us more about your inquiry..."
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    required />
                  
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}>
                  
                  {isSubmitting ?
                  "Sending..." :

                  <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  }
                </Button>
              </form>
            </Card>

            {/* Contact Info */}
            <div className="space-y-6">
              <Card className="p-8">
                <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
                <div className="space-y-6">
                  {contactInfo.map((info, idx) =>
                  <motion.a
                    key={idx}
                    href={info.link}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-4 group hover:bg-muted/50 p-3 rounded-lg transition-colors -mx-3">
                    
                      <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-secondary">
                        <info.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{info.title}</p>
                        <p className="font-medium group-hover:text-primary transition-colors">
                          {info.value}
                        </p>
                      </div>
                    </motion.a>
                  )}
                </div>
              </Card>

              {/* Map Placeholder */}
              <Card className="p-6 overflow-hidden">
                <h3 className="text-lg font-bold mb-4">Find Us</h3>
                <div className="aspect-video bg-muted rounded-xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
                  <div className="text-center relative z-10">
                    <MapPin className="w-12 h-12 text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      123 Innovation Drive<br />
                      Tech City, TC 10001
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      </main>
    </div>);

};

export default ContactPage;