import { Outlet, Link } from "react-router-dom";
import { Sparkles, LogOut, ShieldCheck, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";

const CleanerLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
            {/* Cleaner Header */}
            <header className="bg-card/50 backdrop-blur-md border-b border-border p-4 shadow-md sticky top-0 z-50">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                            <Sparkles className="w-8 h-8 text-purple-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">SERVICE PORTAL</h1>
                            <p className="text-xs text-muted-foreground font-mono">CLEANING MONITOR</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-muted rounded-full border border-border">
                            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                            <span className="text-sm font-medium text-muted-foreground">System Online</span>
                        </div>



                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                  variant="outline"
                  className="gap-2 border-purple-500/20 hover:bg-purple-500/10 hover:text-purple-500 transition-all duration-200">
                  
                                    <User className="w-4 h-4 shrink-0" />
                                    <span className="hidden md:inline truncate max-w-[120px]" title={user?.name || 'Staff'}>{user?.name || 'Staff'}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <Link to="/cleaner/profile">
                                    <DropdownMenuItem className="focus:bg-purple-500/10 focus:text-purple-600">
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </DropdownMenuItem>
                                </Link>
                                <Link to="/cleaner/security">
                                    <DropdownMenuItem className="focus:bg-purple-500/10 focus:text-purple-600">
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
            <main className="container mx-auto p-4 md:p-6">
                <Outlet />
            </main>
        </div>);

};

export default CleanerLayout;