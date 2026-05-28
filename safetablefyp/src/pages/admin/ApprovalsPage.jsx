import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, XCircle, ShieldAlert, Mail, User, Phone } from "lucide-react";

const ApprovalsPage = () => {
  const { pendingUsers, approveUser, rejectUser, refreshStaff } = useAuth();

  // Ensure we have the latest pending requests on mount
  useEffect(() => {
    refreshStaff().catch((err) => {
      console.error("Failed to refresh staff:", err);
    });
  }, [refreshStaff]);

  const handleApprove = async (id) => {
    try {
      await approveUser(id);
      toast.success("User approved and added to active staff");
    } catch (err) {
      toast.error(err.message || "Approval failed");
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectUser(id);
      toast.info("User request rejected");
    } catch (err) {
      toast.error(err.message || "Rejection failed");
    }
  };

  if (pendingUsers.length === 0) {
    return (
      <div className="space-y-8 text-foreground">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient-primary">Approvals</h1>
          <p className="text-muted-foreground">Manage pending kitchen staff requests.</p>
        </div>

        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-lg border border-dashed border-border">
          <div className="p-4 rounded-full bg-muted/50 mb-4">
            <ShieldAlert className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">No Pending Requests</h3>
          <p className="text-muted-foreground max-w-sm text-center mt-2">
            There are no new staff access requests at this time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-foreground">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            Pending Approvals
            <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-lg px-3 py-0.5">
              {pendingUsers.length}
            </Badge>
          </h1>
          <p className="text-muted-foreground">Review and manage access requests from staff.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pendingUsers.map((user) => (
          <Card key={user.id} className="p-6 bg-card border-border shadow-xl hover:shadow-2xl hover:border-primary/30 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-foreground">{user.name || user.full_name}</h3>
                <p className="text-sm text-muted-foreground capitalize">{user.role} request</p>
              </div>
              <Badge variant="outline" className="text-orange-500 border-orange-500/30 bg-orange-500/5">Pending</Badge>
            </div>

            <div className="space-y-3 mb-6 bg-muted/30 p-4 rounded-lg border border-border">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-2"><Mail className="w-3 h-3"/> Email</span>
                <span className="text-foreground font-medium">{user.email || "—"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-2"><User className="w-3 h-3"/> Username</span>
                <span className="text-foreground font-medium">{user.username}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-2"><Phone className="w-3 h-3"/> Phone</span>
                <span className="text-foreground font-medium">{user.phone || "—"}</span>
              </div>
              <p className="text-[10px] text-muted-foreground italic pt-2 border-t border-border text-center">
                Access code is verified server-side for security.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                className="bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20" 
                onClick={() => handleApprove(user.id)}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
              </Button>
              <Button 
                variant="outline" 
                className="border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30" 
                onClick={() => handleReject(user.id)}
              >
                <XCircle className="w-4 h-4 mr-2" /> Reject
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ApprovalsPage;