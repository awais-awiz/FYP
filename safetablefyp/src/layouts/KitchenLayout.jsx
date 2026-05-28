import { Outlet, Link, useNavigate } from "react-router-dom";
import { ChefHat, LogOut, Activity, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useOrders } from "@/hooks/useOrders";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";

const KitchenLayout = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { getAllOrders } = useOrders();

  // Count pending orders for display
  const pendingOrdersCount = getAllOrders().filter((o) => o.status === 'pending').length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
            {/* Top Header */}
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="container px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 relative">
                            <ChefHat className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <span className="text-orange-500">KITCHEN</span>
                                <span className="text-foreground">PORTAL</span>
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Order Preparation & Management
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm font-medium text-muted-foreground">System Online</span>
                        </div>



                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2 bg-card/50">
                                    <User className="w-4 h-4 shrink-0" />
                                    <span className="hidden md:inline truncate max-w-[120px]" title={user?.name || 'Staff'}>{user?.name || 'Staff'}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <Link to="/kitchen/profile">
                                    <DropdownMenuItem className="focus:bg-orange-500/10 focus:text-orange-600">
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </DropdownMenuItem>
                                </Link>
                                <Link to="/kitchen/security">
                                    <DropdownMenuItem className="focus:bg-orange-500/10 focus:text-orange-600">
                                        <Shield className="mr-2 h-4 w-4" />
                                        <span>Security</span>
                                    </DropdownMenuItem>
                                </Link>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:bg-red-500/10 focus:text-red-700">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Logout</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>
        </div>);

};

export default KitchenLayout;