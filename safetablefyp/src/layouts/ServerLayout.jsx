import { Outlet, Link, useNavigate } from "react-router-dom";
import { ConciergeBell, LogOut, Activity, Bell, User, Shield, Armchair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const ServerLayout = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { getAllOrders } = useOrders();

  // Count awaiting_pickup orders for notification badge
  const readyOrdersCount = getAllOrders().filter((o) => o.status === 'awaiting_pickup').length;

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
                        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 relative">
                            <ConciergeBell className="w-6 h-6 text-white" />
                            {readyOrdersCount > 0 &&
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white border-0 px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center animate-pulse">
                                    {readyOrdersCount}
                                </Badge>
              }
                        </div>
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <span className="text-amber-500">SERVER</span>
                                <span className="text-foreground">PORTAL</span>
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Service & Delivery Management
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {readyOrdersCount > 0 &&
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 animate-pulse">
                                <Bell className="w-4 h-4 text-amber-500" />
                                <span className="text-sm font-bold text-amber-500">{readyOrdersCount} Order{readyOrdersCount > 1 ? 's' : ''} Ready to Serve</span>
                            </div>
            }

                        <Link to="/server/tables">
                            <Button variant="outline" size="sm" className="gap-2 bg-card/50">
                                <Armchair className="w-4 h-4" />
                                Tables
                            </Button>
                        </Link>

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
                                <Link to="/server/profile">
                                    <DropdownMenuItem className="focus:bg-orange-500/10 focus:text-orange-600">
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </DropdownMenuItem>
                                </Link>
                                <Link to="/server/security">
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

export default ServerLayout;