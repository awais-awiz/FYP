import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, AtSign, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const ProfileSettings = () => {
  const { user, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.full_name || user?.name || "",
    email: user?.email || "",
    username: user?.username || "",
    phone: user?.phone || ""
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.username) return;
    
    setIsLoading(true);
    try {
      const result = await updateProfile(user.username, formData);
      if (result.success) {
        toast.success("Profile updated successfully");
      } else {
        toast.error(result.message || "Failed to update profile");
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
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your personal information</p>
          </div>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
            <CardDescription>
              Update your public profile information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      className="pl-9"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      name="username"
                      placeholder="johndoe"
                      className="pl-9"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      className="pl-9"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+1 234 567 890"
                      className="pl-9"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
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
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Save Changes
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="w-4 h-4" />
          <span>Your data is securely stored and encrypted.</span>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileSettings;