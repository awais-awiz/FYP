import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ChefHat, Mail, User, Phone, ArrowLeft, ArrowRight, Sparkles, ConciergeBell, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const handleNext = () => {
    if (!name || !phone) {
      toast.error("Please fill in all identity details.");
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (pin !== confirmPin) {
      toast.error("Access Codes do not match");
      return;
    }

    if (pin.length !== 6) {
      toast.error("Access Code must be 6 digits");
      return;
    }

    // Ensure all fields are present for the auth hook
    const result = await signup(name, email, username, phone, pin, role);

    if (result.success) {
      toast.success("Signup request sent! Please wait for admin approval.");
      navigate('/login');
    } else {
      toast.error(result.message || "Signup failed");
    }
  };

  const getRoleTheme = (currentRole) => {
    if (currentRole === 'kitchen' || currentRole === 'server') return 'orange';
    if (currentRole === 'cleaner') return 'purple';
    if (currentRole === 'manager') return 'teal';
    return 'orange';
  };

  const getInputClassName = () => {
    const base = "pl-10 h-14 bg-input border-border text-foreground placeholder:text-muted-foreground transition-all duration-300 focus-visible:ring-1 focus-visible:ring-offset-0 rounded-xl w-full";
    const theme = getRoleTheme(role);

    switch (theme) {
      case 'orange': return `${base} focus-visible:border-orange-500 focus-visible:ring-orange-500 selection:bg-orange-500/30 hover:border-orange-500/50`;
      case 'purple': return `${base} focus-visible:border-purple-500 focus-visible:ring-purple-500 selection:bg-purple-500/30 hover:border-purple-500/50`;
      case 'teal': return `${base} focus-visible:border-teal-500 focus-visible:ring-teal-500 selection:bg-teal-500/30 hover:border-teal-500/50`;
      default: return base;
    }
  };

  const getSlotStyling = (currentRole) => {
    const baseClass = "flex-shrink-0 w-9 h-12 text-2xl sm:w-11 sm:h-14 sm:text-3xl md:w-12 md:h-16 md:text-3xl font-black rounded-xl sm:rounded-2xl border-2 bg-background/50 backdrop-blur-xl shadow-inner outline-none overflow-hidden text-muted-foreground/30 transition-all duration-300";
    
    let borderColors = "border-primary/20";
    // We handle the focus/active states via the internal props of InputOTPSlot if your component supports it, 
    // or through conditional class logic here.
    switch (currentRole) {
        case 'kitchen': borderColors = "border-orange-500/20 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20"; break;
        case 'cleaner': borderColors = "border-purple-500/20 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20"; break;
        case 'server': borderColors = "border-amber-500/20 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20"; break;
        case 'manager': borderColors = "border-teal-500/20 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20"; break;
        default: borderColors = "border-primary/20";
    }

    return { className: `${baseClass} ${borderColors}` };
  };

  const theme = getRoleTheme(role);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/5 blur-[100px]" />
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-5 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-24 items-center z-10 relative">
        {/* Left Side: Branding */}
        <div className="md:col-span-2 lg:col-span-1 text-center md:text-left space-y-6 order-2 md:order-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden md:block"
            key={role || 'default'}
          >
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6 transition-colors duration-300
              ${theme === 'orange' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                theme === 'purple' ? 'bg-purple-500/10 border-purple-500/20 text-purple-500' :
                'bg-teal-500/10 border-teal-500/20 text-teal-500'}`}>
              
              {role === 'kitchen' ? <ChefHat className="w-4 h-4" /> : 
               role === 'cleaner' ? <Sparkles className="w-4 h-4" /> : 
               role === 'server' ? <ConciergeBell className="w-4 h-4" /> : 
               role === 'manager' ? <Building2 className="w-4 h-4" /> : 
               <User className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {role === 'kitchen' ? "Join the Kitchen Team" : 
                 role === 'cleaner' ? "Join the Service Team" : 
                 role === 'server' ? "Join the Server Team" : 
                 role === 'manager' ? "Join the Management Team" : "Join S.A.F.E. Team"}
              </span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-4 leading-tight">
              <span className="text-foreground">Master the</span> <br />
              <span className={`text-transparent bg-clip-text bg-gradient-to-r ${theme === 'orange' ? 'from-orange-500 to-red-600' : theme === 'purple' ? 'from-purple-500 to-indigo-600' : 'from-teal-500 to-cyan-600'}`}>
                {role === 'kitchen' ? "Culinary Art" : role === 'cleaner' ? "Art of Service" : role === 'server' ? "Art of Hospitality" : role === 'manager' ? "Art of Management" : "Art of Excellence"}
              </span>
            </h1>
          </motion.div>
        </div>

        {/* Right Side: Signup Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="order-1 md:order-2 md:col-span-3 lg:col-span-1 w-full max-w-md mx-auto"
        >
          <Card className="bg-card border-border p-6 shadow-2xl relative overflow-hidden transition-all duration-300">
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${theme === 'orange' ? 'from-orange-500 to-red-600' : theme === 'purple' ? 'from-purple-500 to-indigo-600' : 'from-teal-500 to-cyan-600'}`} />

            {!role ? (
              <div className="space-y-6 py-4">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-black text-foreground">Select Department</h2>
                  <p className="text-muted-foreground mt-2">Choose your team to request access</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'kitchen', icon: ChefHat, label: 'Kitchen', color: 'hover:text-orange-500' },
                    { id: 'cleaner', icon: Sparkles, label: 'Cleaning', color: 'hover:text-purple-500' },
                    { id: 'server', icon: ConciergeBell, label: 'Server', color: 'hover:text-amber-500' },
                    { id: 'manager', icon: Building2, label: 'Manager', color: 'hover:text-teal-500' }
                  ].map((dept) => (
                    <Button
                      key={dept.id}
                      variant="outline"
                      className={`h-32 flex flex-col gap-3 border-2 transition-all rounded-2xl ${dept.color}`}
                      onClick={() => setRole(dept.id)}
                    >
                      <dept.icon className="w-10 h-10" />
                      <span className="font-bold">{dept.label}</span>
                    </Button>
                  ))}
                </div>
                <div className="text-center pt-4">
                    <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground underline">Back to Login</Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center border-b pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full border-2 ${theme === 'orange' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : theme === 'purple' ? 'bg-purple-500/10 border-purple-500/20 text-purple-500' : 'bg-teal-500/10 border-teal-500/20 text-teal-500'}`}>
                        {role === 'kitchen' && <ChefHat className="w-6 h-6" />}
                        {role === 'cleaner' && <Sparkles className="w-6 h-6" />}
                        {role === 'server' && <ConciergeBell className="w-6 h-6" />}
                        {role === 'manager' && <Building2 className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold capitalize">{role} Signup</h3>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">Step {step} of 2</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => {setRole(null); setStep(1);}}>Switch Role</Button>
                </div>

                <AnimatePresence mode="wait">
                  {step === 1 ? (
                    <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-4 h-5 w-5 text-muted-foreground" />
                            <Input value={name} onChange={e => setName(e.target.value)} className={getInputClassName()} placeholder="Jane Doe" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-4 h-5 w-5 text-muted-foreground" />
                            <Input value={phone} onChange={e => setPhone(e.target.value)} className={getInputClassName()} placeholder="+1..." />
                        </div>
                      </div>
                      <Button onClick={handleNext} className={`w-full h-14 mt-4 ${theme === 'orange' ? 'bg-orange-500' : theme === 'purple' ? 'bg-purple-600' : 'bg-teal-600'}`}>
                        Next Step <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className={getInputClassName()} placeholder="staff@safe.com" />
                      </div>
                      <div className="space-y-2">
                        <Label>Username</Label>
                        <Input value={username} onChange={e => setUsername(e.target.value)} className={getInputClassName()} placeholder="staff_jane" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-center block">6-Digit PIN</Label>
                        <InputOTP maxLength={6} value={pin} onChange={setPin}>
                          <InputOTPGroup className="mx-auto">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                              <InputOTPSlot key={i} index={i} {...getSlotStyling(role)} />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-center block">Confirm PIN</Label>
                        <InputOTP maxLength={6} value={confirmPin} onChange={setConfirmPin}>
                          <InputOTPGroup className="mx-auto">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                              <InputOTPSlot key={i} index={i} {...getSlotStyling(role)} />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button variant="outline" onClick={handleBack} className="flex-1 h-12">Back</Button>
                        <Button onClick={handleSignup} className={`flex-[2] h-12 ${theme === 'orange' ? 'bg-orange-500' : theme === 'purple' ? 'bg-purple-600' : 'bg-teal-600'}`}>Submit</Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;