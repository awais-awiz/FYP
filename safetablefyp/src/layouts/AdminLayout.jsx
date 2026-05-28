import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ChefHat, LogOut, Menu, Users, DollarSign, Activity, Sparkles, ConciergeBell, User, Shield } from "lucide-react";
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

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, pendingUsers, user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allNavItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
    roles: ['admin']
  },
  {
    title: "Kitchen Display",
    icon: ChefHat,
    href: "/admin/kitchen",
    roles: ['admin']
  },
  {
    title: "Kitchen Track",
    icon: Activity,
    href: "/admin/kitchen-track",
    roles: ['admin']
  },
  {
    title: "Cleaner Portal",
    icon: Sparkles,
    href: "/admin/cleaner",
    roles: ['admin', 'cleaner']
  },
  {
    title: "Server Portal",
    icon: ConciergeBell,
    href: "/admin/server",
    roles: ['admin', 'server']
  },
  {
    title: "Approvals",
    icon: Users,
    href: "/admin/approvals",
    badge: true, // Marker for badge logic
    roles: ['admin']
  },
  {
    title: "Staff",
    icon: Users,
    href: "/admin/staff",
    roles: ['admin']
  },
  {
    title: "Sales Report",
    icon: DollarSign,
    href: "/admin/sales",
    roles: ['admin']
  }];


  const navItems = allNavItems.filter((item) => item.roles.includes(user?.role || ''));

  const Sidebar = () =>
  <div className="h-full flex flex-col bg-card border-r border-border">
            <div className="p-6 border-b border-border">
                <h1 className="text-xl font-bold">
                    <span className="text-gradient-primary">S.A.F.E.</span> <span className="text-foreground">{user?.role === 'cleaner' ? 'Staff' : 'Admin'}</span>
                </h1>
                <p className="text-xs text-muted-foreground mt-1">Restaurant Management</p>
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
              className={`w-full justify-start gap-3 transition-all duration-200 ${isActive ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:scale-[1.02] hover:shadow-md"}`
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
                        <Button
            variant="outline"
            className="w-full gap-2 text-muted-foreground hover:text-foreground justify-between group">
            
                            <div className="flex items-center gap-2 overflow-hidden">
                                <User className="w-4 h-4 shrink-0" />
                                <span className="truncate max-w-[140px]" title={user?.name || 'Admin'}>{user?.name || 'Admin'}</span>
                            </div>
                            <Activity className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56" side="right">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <Link to="/admin/profile">
                            <DropdownMenuItem className="focus:bg-blue-500/10 focus:text-blue-600">
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                        </Link>
                        <Link to="/admin/security">
                            <DropdownMenuItem className="focus:bg-blue-500/10 focus:text-blue-600">
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
    <div className="min-h-screen bg-background flex">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50">
                <Sidebar />
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 relative">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
                    <span className="font-bold">Admin Portal</span>
                    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="w-5 h-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-64">
                            <Sidebar />
                        </SheetContent>
                    </Sheet>
                </div>

                <div className="p-6 md:p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>);

};

export default AdminLayout;