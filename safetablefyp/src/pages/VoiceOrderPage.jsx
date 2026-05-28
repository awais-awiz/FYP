import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { voiceApi } from "@/lib/api";
import { useCustomerSession } from "@/hooks/useCustomerSession";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "ur", name: "Urdu" },
  { code: "de", name: "German" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "hi", name: "Hindi" },
  { code: "ko", name: "Korean" },
  { code: "it", name: "Italian" },
  { code: "ar", name: "Arabic" },
  { code: "ru", name: "Russian" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" }
];

const VoiceOrderPage = () => {
  const { toast } = useToast();
  const { tableNumber, hasTicket, start, loading } = useCustomerSession();

  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [orderStatus, setOrderStatus] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const audioPlayerRef = useRef(typeof Audio !== "undefined" ? new Audio() : null);

  // Cleanup on unmount
  useEffect(() => () => {
    stopRecording();
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = "";
    }
  }, []);


  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.start(100);
      setIsListening(true);
      setTranscript("");
      setAiResponse("");
      setOrderStatus(null);
    } catch {
      toast({ title: "Microphone error", description: "Please allow microphone access to use voice ordering.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    setIsListening(false);
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
  };

  const processAudioPayload = async () => {
    if (audioChunksRef.current.length === 0) return;
    setIsProcessing(true);
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

    try {
      const data = await voiceApi.order({
        audio: audioBlob,
        language: selectedLanguage,
        table_number: tableNumber,
      });

      if (data?.success) {
        setTranscript(data.transcript || "");
        setAiResponse(data.response_text || "");
        if (data.order_placed) setOrderStatus(`Order Confirmed: ${data.order_id}`);

        if (data.audio_base64 && audioPlayerRef.current) {
          audioPlayerRef.current.src = `data:${data.audio_content_type || "audio/mp3"};base64,${data.audio_base64}`;
          audioPlayerRef.current.play().catch(() => {});
          audioPlayerRef.current.onended = () => { audioPlayerRef.current.src = ""; };
        } else if (data.use_browser_tts && data.response_text) {
          const utterance = new SpeechSynthesisUtterance(data.response_text);
          utterance.lang = selectedLanguage;
          window.speechSynthesis?.speak(utterance);
        }
      } else if (data?.response_text) {
        setAiResponse(data.response_text);
      }
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes("no audio")) {
        setAiResponse("I didn't quite catch that. Please tap the mic and try again.");
      } else {
        toast({ title: "Voice order failed", description: err.message, variant: "destructive" });
      }
    } finally {
      setIsProcessing(false);
      audioChunksRef.current = [];
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopRecording();
      processAudioPayload();
    } else {
      startRecording();
    }
  };

  const handleStartSession = async () => {
    const result = await start(tableInput);
    if (!result?.success) {
      toast({
        title: "Unable to start session",
        description: result?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!hasTicket) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="glass-morphism p-8 max-w-md w-full border-2 border-yellow-500/30">
          <div className="flex items-start gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
            <div>
              <h2 className="font-bold text-xl mb-1">Session Required</h2>
              <p className="text-sm text-muted-foreground">Please select your table number to enable voice commands and order synchronization.</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Button onClick={async () => {
              const result = await start("en");
              if (!result?.success) {
                toast({
                  title: "Unable to start session",
                  description: result?.message || "Please try again.",
                  variant: "destructive",
                });
              }
            }} disabled={loading} className="w-full">
              {loading ? "Starting Session…" : "Start Automated Session"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
            <Mic className="w-5 h-5 text-primary" />
            <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent tracking-wide">
              Voice Assistant
            </h1>
          </div>
          <div className="bg-primary/10 px-3 py-1.5 rounded-full text-sm font-bold text-primary shadow-sm border border-primary/20">
            Table #{tableNumber}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-2">Speak to Order</h1>
        <p className="text-muted-foreground mb-8 text-center max-w-sm">
          Select your language and tap the mic to order.
        </p>

        <div className="mb-8 z-10 relative">
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage} disabled={isProcessing || isListening}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(lang => (
                <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="glass-morphism border-2 border-primary/30 p-8 w-full max-w-2xl relative overflow-hidden">
          <div className="flex justify-center mb-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleListening}
              disabled={isProcessing}
              className={`relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl group ${
                isListening 
                  ? "bg-gradient-to-br from-destructive to-red-600 shadow-[0_0_50px_rgba(239,68,68,0.6)]" 
                  : isProcessing
                  ? "bg-gradient-to-br from-muted to-muted-foreground shadow-none"
                  : "bg-gradient-to-br from-primary via-purple-500 to-accent shadow-[0_0_40px_rgba(var(--primary),0.5)]"
              }`}
            >
              {/* Outer pulsing ring when listening */}
              {isListening && (
                <div className="absolute inset-0 rounded-full border-4 border-destructive animate-ping opacity-20" />
              )}
              
              {/* Inner glass ring */}
              <div className="absolute inset-2 rounded-full border-2 border-white/20" />

              {isProcessing ? <Loader2 className="w-14 h-14 text-white animate-spin drop-shadow-md" /> :
               isListening ? <MicOff className="w-14 h-14 text-white drop-shadow-md" /> :
                             <Mic className="w-14 h-14 text-white drop-shadow-md transition-transform group-hover:scale-110" />}
            </motion.button>
          </div>

          <div className="space-y-4">
            {transcript && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">You said:</p>
                <p className="text-lg">{transcript}</p>
              </motion.div>
            )}

            {aiResponse && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-card border shadow-sm">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">SAGE Assistant:</p>
                <p className="text-lg italic">"{aiResponse}"</p>
                {orderStatus && (
                  <div className="mt-3 py-2 px-3 bg-green-500/10 rounded-lg flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <p className="text-green-600 text-sm font-bold">{orderStatus}</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default VoiceOrderPage;