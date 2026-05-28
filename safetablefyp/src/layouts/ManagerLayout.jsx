import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ChefHat, LogOut, Menu, Building2, ConciergeBell, Sparkles, User, Users, Shield, Armchair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";

const ManagerLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, pendingUsers } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/manager"
  },
  {
    title: "Kitchen Supervision",
    icon: ChefHat,
    href: "/manager/kitchen"
  },
  {
    title: "Server Supervision",
    icon: ConciergeBell,
    href: "/manager/server"
  },
  {
    title: "Cleaner Supervision",
    icon: Sparkles,
    href: "/manager/cleaner"
  },
  {
    title: "Table Management",
    icon: Armchair,
    href: "/manager/tables"
  },
  {
    title: "Approvals",
    icon: Users,
    href: "/manager/approvals",
    badge: true
  },
  {
    title: "Staff Management",
    icon: Users,
    href: "/manager/staff"
  }];


  const Sidebar = () =>
  <div className="h-full flex flex-col bg-card border-r border-border">
            <div className="p-6 border-b border-border">
                <h1 className="text-xl font-bold">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-600">S.A.F.E.</span> <span className="text-foreground">Manager</span>
                </h1>
                <p className="text-xs text-muted-foreground mt-1">Operations Supervision</p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => setIsMobileOpen(false)}>
            
                            <Button
              variant={isActive ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 transition-all duration-200 ${isActive ? "bg-teal-500/10 text-teal-500 shadow-sm border border-teal-500/20" : "text-muted-foreground hover:text-foreground hover:bg-teal-500/5 hover:scale-[1.02] hover:shadow-md"}`
              }>
              
                                <item.icon className="w-5 h-5" />
                                <span className="flex-1 text-left">{item.title}</span>
                                {item.badge && pendingUsers.length > 0 &&
              <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                        {pendingUsers.length}
                                    </span>
              }
                            </Button>
                        </Link>);

      })}
            </nav>

            <div className="p-4 border-t border-border">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start px-2 py-6 hover:bg-teal-500/10 hover:text-teal-500 group">
                            <div className="flex items-center gap-3 w-full">
                                <div className="p-2 bg-teal-500/10 rounded-lg group-hover:bg-teal-500/20 transition-colors">
                                    <Building2 className="w-4 h-4 text-teal-500" />
                                </div>
                                <div className="flex flex-col items-start gap-0.5 overflow-hidden w-full">
                                    <span className="text-sm font-semibold truncate w-full text-left" title={user?.name || 'Manager'}>{user?.name || 'Manager'}</span>
                                    <span className="text-xs text-muted-foreground truncate w-full text-left" title={user?.email || 'manager@safe.com'}>{user?.email || 'manager@safe.com'}</span>
                                </div>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <Link to="/manager/profile">
                            <DropdownMenuItem className="focus:bg-teal-500/10 focus:text-teal-600">
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                        </Link>
                        <Link to="/manager/security">
                            <DropdownMenuItem className="focus:bg-teal-500/10 focus:text-teal-600">
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
        </div>;


  return (
    <div className="flex h-screen bg-background overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 h-full">
                <Sidebar />
            </aside>

            {/* Mobile  Sidebar */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetTrigger asChild className="lg:hidden fixed top-4 left-4 z-50">
                    <Button variant="outline" size="icon" className="bg-card shadow-lg border-teal-500/30">
                        <Menu className="w-5 h-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                    <Sidebar />
                </SheetContent>
            </Sheet>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto p-4 md:p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>);

};

export default ManagerLayout;