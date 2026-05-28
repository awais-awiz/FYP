import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lock, KeyRound, ShieldAlert, Save } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const SecuritySettings = () => {
  const { user, updateCredentials } = useAuth();

  const isStaff = user?.role !== 'admin';
  const credentialLabel = isStaff ? "Access Code" : "Password";
  const credentialType = isStaff ? "text" : "password";

  const [formData, setFormData] = useState({
    currentCredential: "",
    newCredential: "",
    confirmCredential: ""
  });

  const [isLoading, setIsLoading] = useState(false);

  const getThemeColor = () => {
    switch (user?.role) {
      case 'admin': return 'text-primary';
      case 'kitchen': return 'text-orange-500';
      case 'server': return 'text-amber-500';
      case 'cleaner': return 'text-purple-500';
      case 'manager': return 'text-cyan-500';
      default: return 'text-primary';
    }
  };

  const getButtonColor = () => {
    switch (user?.role) {
      case 'admin': return 'bg-primary hover:bg-primary/90';
      case 'kitchen': return 'bg-orange-600 hover:bg-orange-500';
      case 'server': return 'bg-amber-600 hover:bg-amber-500';
      case 'cleaner': return 'bg-purple-600 hover:bg-purple-500';
      case 'manager': return 'bg-cyan-600 hover:bg-cyan-500';
      default: return 'bg-primary hover:bg-primary/90';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOTPChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newCredential !== formData.confirmCredential) {
      toast.error(`${credentialLabel}s do not match`);
      return;
    }

    if (formData.newCredential.length < 6) {
      toast.error(`${credentialLabel} must be at least 6 characters`);
      return;
    }

    if (!formData.currentCredential) {
      toast.error(`Enter your current ${credentialLabel.toLowerCase()}`);
      return;
    }

    setIsLoading(true);
    try {
      // updateCredentials now hits the real /api/auth/change-password route.
      const result = await updateCredentials(formData.currentCredential, formData.newCredential);
      if (result.success) {
        toast.success(`${credentialLabel} updated successfully`);
        setFormData({ currentCredential: "", newCredential: "", confirmCredential: "" });
      } else {
        toast.error(result.message || `Failed to update ${credentialLabel.toLowerCase()}`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl px-4 py-8 mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-8">
          <div className={`p-3 rounded-xl bg-card border border-border ${getThemeColor()}`}>
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Security Settings</h1>
            <p className="text-muted-foreground">Manage your account security</p>
          </div>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Change {credentialLabel}</CardTitle>
            <CardDescription>
              Update your login {credentialLabel.toLowerCase()} to keep your account secure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentCredential">Current {credentialLabel}</Label>
                {isStaff ? (
                  <div className="flex justify-start pt-1">
                    <InputOTP
                      maxLength={6}
                      value={formData.currentCredential}
                      onChange={(val) => handleOTPChange('currentCredential', val)}
                    >
                      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2">
                        <InputOTPGroup className="gap-1.5">
                          {[0, 1, 2].map((i) => (
                            <InputOTPSlot
                              key={i}
                              index={i}
                              className={`w-9 h-11 xs:w-10 xs:h-12 text-base font-bold rounded-lg border-2 transition-all duration-200 bg-input
                                ${user?.role === 'kitchen' ? 'border-orange-500/30 focus-within:border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.2)]' :
                                user?.role === 'cleaner' ? 'border-purple-500/30 focus-within:border-purple-500 shadow-[0_0_12px_rgba(147,51,234,0.2)]' :
                                user?.role === 'server' ? 'border-amber-500/30 focus-within:border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.2)]' :
                                'border-teal-500/30 focus-within:border-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.2)]'}`}
                            />
                          ))}
                        </InputOTPGroup>
                        <div className="hidden sm:block text-muted-foreground/30 font-bold select-none">-</div>
                        <div className="sm:hidden w-6 h-[1px] bg-muted-foreground/20 my-0.5 rounded-full" />
                        <InputOTPGroup className="gap-1.5">
                          {[3, 4, 5].map((i) => (
                            <InputOTPSlot
                              key={i}
                              index={i}
                              className={`w-9 h-11 xs:w-10 xs:h-12 text-base font-bold rounded-lg border-2 transition-all duration-200 bg-input
                                ${user?.role === 'kitchen' ? 'border-orange-500/30 focus-within:border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.2)]' :
                                user?.role === 'cleaner' ? 'border-purple-500/30 focus-within:border-purple-500 shadow-[0_0_12px_rgba(147,51,234,0.2)]' :
                                user?.role === 'server' ? 'border-amber-500/30 focus-within:border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.2)]' :
                                'border-teal-500/30 focus-within:border-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.2)]'}`}
                            />
                          ))}
                        </InputOTPGroup>
                      </div>
                    </InputOTP>
                  </div>
                ) : (
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="currentCredential"
                      name="currentCredential"
                      type={credentialType}
                      placeholder="••••••••"
                      className="pl-9"
                      value={formData.currentCredential}
                      onChange={handleChange}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newCredential">New {credentialLabel}</Label>
                  {isStaff ? (
                    <div className="flex justify-start pt-1">
                      <InputOTP
                        maxLength={6}
                        value={formData.newCredential}
                        onChange={(val) => handleOTPChange('newCredential', val)}
                      >
                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2">
                          <InputOTPGroup className="gap-1.5">
                            {[0, 1, 2].map((i) => (
                              <InputOTPSlot
                                key={i}
                                index={i}
                                className={`w-9 h-11 xs:w-10 xs:h-12 text-base font-bold rounded-lg border-2 transition-all duration-200 bg-input
                                  ${user?.role === 'kitchen' ? 'border-orange-500/30 focus-within:border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.2)]' :
                                  user?.role === 'cleaner' ? 'border-purple-500/30 focus-within:border-purple-500 shadow-[0_0_12px_rgba(147,51,234,0.2)]' :
                                  user?.role === 'server' ? 'border-amber-500/30 focus-within:border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.2)]' :
                                  'border-teal-500/30 focus-within:border-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.2)]'}`}
                              />
                            ))}
                          </InputOTPGroup>
                          <div className="hidden sm:block text-muted-foreground/30 font-bold select-none">-</div>
                          <div className="sm:hidden w-6 h-[1px] bg-muted-foreground/20 my-0.5 rounded-full" />
                          <InputOTPGroup className="gap-1.5">
                            {[3, 4, 5].map((i) => (
                              <InputOTPSlot
                                key={i}
                                index={i}
                                className={`w-9 h-11 xs:w-10 xs:h-12 text-base font-bold rounded-lg border-2 transition-all duration-200 bg-input
                                  ${user?.role === 'kitchen' ? 'border-orange-500/30 focus-within:border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.2)]' :
                                  user?.role === 'cleaner' ? 'border-purple-500/30 focus-within:border-purple-500 shadow-[0_0_12px_rgba(147,51,234,0.2)]' :
                                  user?.role === 'server' ? 'border-amber-500/30 focus-within:border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.2)]' :
                                  'border-teal-500/30 focus-within:border-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.2)]'}`}
                              />
                            ))}
                          </InputOTPGroup>
                        </div>
                      </InputOTP>
                    </div>
                  ) : (
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newCredential"
                        name="newCredential"
                        type={credentialType}
                        placeholder="••••••••"
                        className="pl-9"
                        value={formData.newCredential}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmCredential">Confirm New {credentialLabel}</Label>
                  {isStaff ? (
                    <div className="flex justify-start pt-1">
                      <InputOTP
                        maxLength={6}
                        value={formData.confirmCredential}
                        onChange={(val) => handleOTPChange('confirmCredential', val)}
                      >
                        <div className="flex items-center gap-1 sm:gap-2">
                          <InputOTPGroup className="gap-1 sm:gap-1.5">
                            {[0, 1, 2].map((i) => (
                              <InputOTPSlot
                                key={i}
                                index={i}
                                className={`w-7 h-9 xs:w-9 xs:h-10 sm:w-11 sm:h-11 text-base font-bold rounded-lg border-2 transition-all duration-200 bg-input
                                  ${user?.role === 'kitchen' ? 'border-orange-500/30 focus-within:border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.2)]' :
                                  user?.role === 'cleaner' ? 'border-purple-500/30 focus-within:border-purple-500 shadow-[0_0_12px_rgba(147,51,234,0.2)]' :
                                  user?.role === 'server' ? 'border-amber-500/30 focus-within:border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.2)]' :
                                  'border-teal-500/30 focus-within:border-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.2)]'}`}
                              />
                            ))}
                          </InputOTPGroup>
                          <div className="text-muted-foreground/30 font-bold select-none">-</div>
                          <InputOTPGroup className="gap-1 sm:gap-1.5">
                            {[3, 4, 5].map((i) => (
                              <InputOTPSlot
                                key={i}
                                index={i}
                                className={`w-7 h-9 xs:w-9 xs:h-10 sm:w-11 sm:h-11 text-base font-bold rounded-lg border-2 transition-all duration-200 bg-input
                                  ${user?.role === 'kitchen' ? 'border-orange-500/30 focus-within:border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.2)]' :
                                  user?.role === 'cleaner' ? 'border-purple-500/30 focus-within:border-purple-500 shadow-[0_0_12px_rgba(147,51,234,0.2)]' :
                                  user?.role === 'server' ? 'border-amber-500/30 focus-within:border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.2)]' :
                                  'border-teal-500/30 focus-within:border-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.2)]'}`}
                              />
                            ))}
                          </InputOTPGroup>
                        </div>
                      </InputOTP>
                    </div>
                  ) : (
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmCredential"
                        name="confirmCredential"
                        type={credentialType}
                        placeholder="••••••••"
                        className="pl-9"
                        value={formData.confirmCredential}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className={`${getButtonColor()} min-w-[140px] transition-all`}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      Updating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Update {credentialLabel}
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SecuritySettings;