import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Globe, Check, Volume2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";

const languages = [
{ name: "English", code: "en", flag: "🇬🇧" },
{ name: "Urdu", code: "ur", flag: "🇵🇰" },
{ name: "German", code: "de", flag: "🇩🇪" },
{ name: "Spanish", code: "es", flag: "🇪🇸" },
{ name: "French", code: "fr", flag: "🇫🇷" },
{ name: "Hindi", code: "hi", flag: "🇮🇳" },
{ name: "Korean", code: "ko", flag: "🇰🇷" },
{ name: "Italian", code: "it", flag: "🇮🇹" },
{ name: "Arabic", code: "ar", flag: "🇸🇦" },
{ name: "Russian", code: "ru", flag: "🇷🇺" },
{ name: "Chinese", code: "zh", flag: "🇨🇳" },
{ name: "Japanese", code: "ja", flag: "🇯🇵" }
];

const LanguagesPage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const handleLanguageSelect = (code, name) => {
    setSelectedLanguage(code);
    toast.success(`Language changed to ${name}`, {
      description: "Menu and interface will now display in " + name
    });
  };

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
            <Globe className="w-5 h-5 text-primary" />
            <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent tracking-wide">
              12 Languages
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
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-accent to-primary mb-6">
              <Globe className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Everyone Speaks Your Language
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powered by GPT-4 and Whisper AI for real-time translation and voice recognition
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-12">
            {languages.map((lang, idx) =>
            <motion.div
              key={lang.code}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}>
              
                <Card
                className={`p-4 transition-all cursor-pointer group ${
                selectedLanguage === lang.code ?
                "border-primary bg-primary/10 ring-2 ring-primary/20" :
                "hover:border-primary/50"}`
                }
                onClick={() => handleLanguageSelect(lang.code, lang.name)}>
                
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{lang.flag}</span>
                      <span className={`font-medium transition-colors ${
                    selectedLanguage === lang.code ? "text-primary" : "group-hover:text-primary"}`
                    }>
                        {lang.name}
                      </span>
                    </div>
                    <Check className={`w-5 h-5 text-primary transition-opacity ${
                  selectedLanguage === lang.code ? "opacity-100" : "opacity-0"}`
                  } />
                  </div>
                </Card>
              </motion.div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6">
              <Volume2 className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Real-time Translation</h3>
              <p className="text-muted-foreground">
                Speak in any language and the menu instantly translates. Powered by Whisper AI for 90%+ accuracy.
              </p>
            </Card>

            <Card className="p-6">
              <Globe className="w-8 h-8 text-secondary mb-4" />
              <h3 className="text-xl font-bold mb-2">Cultural Adaptation</h3>
              <p className="text-muted-foreground">
                Not just translation - menu descriptions adapt to cultural preferences and dietary norms.
              </p>
            </Card>
          </div>

          <div className="text-center">
            <Link to="/voice-order">
              <Button size="lg" className="group">
                Try Voice Translation
                <Volume2 className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>);

};

export default LanguagesPage;