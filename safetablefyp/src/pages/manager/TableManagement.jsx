import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTables } from "@/hooks/useTables";
import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Armchair,
  Users,
  Ban,
  Clock,
  CheckCircle2,
  Search,
  LayoutGrid,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

const TableManagement = () => {
  const { tables, updateStatus, addTable, removeTable, initializeTables, refresh } = useTables();
  const { user } = useAuth();
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeStatusTab, setActiveStatusTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // New Table State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTableSeats, setNewTableSeats] = useState("4");

  const isManagerOrAdmin = user?.role === "manager" || user?.role === "admin" || user?.role === "server";

  // Pull live sessions from the backend, polled every 8 seconds
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, [refresh]);

  // Initialize with 20 tables if empty (Local Fallback)
  useEffect(() => {
    if (!tables || tables.length === 0) {
      initializeTables(20);
    }
  }, [initializeTables, tables]);

  // Stats Calculation
  const stats = useMemo(() => {
    const total = tables.length;
    const occupied = tables.filter((t) => t.status === "occupied").length;
    const available = tables.filter((t) => t.status === "available").length;
    const reserved = tables.filter((t) => t.status === "reserved").length;
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

    return { total, occupied, available, reserved, occupancyRate };
  }, [tables]);

  // Filtering
  const filteredTables = tables.filter((table) => {
    const matchesStatusTab = activeStatusTab === "All" || table.status === activeStatusTab;
    const matchesSearch = table.id.toString().includes(searchQuery);
    return matchesStatusTab && matchesSearch;
  });

  const handleStatusUpdate = async (status) => {
    if (selectedTable) {
      await updateStatus(selectedTable.id, status);
      setSelectedTable(null);
    }
  };

  const handleAddTable = () => {
    addTable(parseInt(newTableSeats) || 4);
    setIsAddDialogOpen(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "available": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "occupied": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "reserved": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "unavailable": return "bg-slate-500/10 text-slate-500 border-slate-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "available": return CheckCircle2;
      case "occupied": return Users;
      case "reserved": return Clock;
      case "unavailable": return Ban;
      default: return Armchair;
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col p-6">
      {/* Header & Stats */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Table Management</h1>
            <p className="text-sm text-muted-foreground">Real-time floor plan and status tracking</p>
          </div>
          {isManagerOrAdmin && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4" /> Add Table
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Table</DialogTitle>
                  <DialogDescription>Configure seats for the new table.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-foreground">Seats</label>
                    <Input
                      type="number"
                      value={newTableSeats}
                      onChange={(e) => setNewTableSeats(e.target.value)}
                      min="1"
                      max="20"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddTable}>Create Table</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-4 border-l-4 border-l-blue-500 bg-card/50 backdrop-blur-sm">
            <div className="p-2 rounded-full bg-blue-500/10 text-blue-500"><LayoutGrid className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase">Total Tables</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4 border-l-4 border-l-green-500 bg-card/50 backdrop-blur-sm">
            <div className="p-2 rounded-full bg-green-500/10 text-green-500"><CheckCircle2 className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase">Available</p>
              <p className="text-2xl font-bold">{stats.available}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4 border-l-4 border-l-red-500 bg-card/50 backdrop-blur-sm">
            <div className="p-2 rounded-full bg-red-500/10 text-red-500"><Users className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase">Occupied</p>
              <p className="text-2xl font-bold">{stats.occupied}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4 border-l-4 border-l-amber-500 bg-card/50 backdrop-blur-sm">
            <div className="p-2 rounded-full bg-amber-500/10 text-amber-500"><Clock className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase">Reserved</p>
              <p className="text-2xl font-bold">{stats.reserved}</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-muted/30 rounded-lg border">
        <Tabs defaultValue="All" className="w-full md:w-auto" onValueChange={(val) => setActiveStatusTab(val)}>
          <TabsList className="grid w-full grid-cols-5 md:w-[500px]">
            <TabsTrigger value="All">All</TabsTrigger>
            <TabsTrigger value="available">Available</TabsTrigger>
            <TabsTrigger value="occupied">Occupied</TabsTrigger>
            <TabsTrigger value="reserved">Reserved</TabsTrigger>
            <TabsTrigger value="unavailable">Fixed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search table #"
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto min-h-[400px]">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-20">
          <AnimatePresence mode="popLayout">
            {filteredTables.map((table) => {
              const Icon = getStatusIcon(table.status);
              return (
                <motion.div
                  key={table.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card
                    className={`group p-4 cursor-pointer hover:shadow-xl transition-all duration-300 border-2 flex flex-col items-center justify-between aspect-square relative overflow-hidden ${getStatusColor(table.status)}`}
                    onClick={() => setSelectedTable(table)}
                  >
                    <div className="w-full h-8 z-10" />
                    <div className="flex flex-col items-center gap-1 z-10">
                      <div className="p-3 rounded-full bg-background/20 backdrop-blur-md shadow-inner">
                        <Icon className="w-8 h-8" />
                      </div>
                      <div className="text-2xl font-black tracking-tight mb-0">T-{table.id}</div>
                      {table.seats && (
                        <div className="flex items-center gap-1 text-xs font-medium opacity-80 bg-background/30 px-2 py-0.5 rounded-full">
                          <Users className="w-3 h-3" /> {table.seats}
                        </div>
                      )}
                    </div>
                    <div className="w-full text-center z-10">
                      <Badge variant="secondary" className="bg-background/40 backdrop-blur-md border-0 w-full justify-center">
                        <span className="capitalize">{table.status}</span>
                      </Badge>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Status Dialog */}
      <Dialog open={!!selectedTable} onOpenChange={(open) => !open && setSelectedTable(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Armchair className="w-5 h-5 text-primary" />
              Manage Table #{selectedTable?.id}
            </DialogTitle>
            <DialogDescription>Update status or remove this table.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-4">
            <Button
              variant="outline"
              className="bg-green-500/10 hover:bg-green-500/20 text-green-600 border-green-500/20 h-20 flex-col gap-1"
              onClick={() => handleStatusUpdate("available")}
            >
              <CheckCircle2 className="w-6 h-6" /> Mark Available
            </Button>
            <Button
              variant="outline"
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border-amber-500/20 h-20 flex-col gap-1"
              onClick={() => handleStatusUpdate("reserved")}
            >
              <Clock className="w-6 h-6" /> Mark Reserved
            </Button>
            <Button
              variant="outline"
              className="bg-red-500/10 hover:bg-red-500/20 text-red-600 border-red-500/20 h-20 flex-col gap-1"
              onClick={() => handleStatusUpdate("occupied")}
            >
              <Users className="w-6 h-6" /> Mark Occupied
            </Button>
            <Button
              variant="outline"
              className="bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 border-slate-500/20 h-20 flex-col gap-1"
              onClick={() => handleStatusUpdate("unavailable")}
            >
              <Ban className="w-6 h-6" /> Mark Unavailable
            </Button>
          </div>

          {isManagerOrAdmin && (
            <DialogFooter>
              <Button
                variant="destructive"
                className="w-full gap-2"
                onClick={() => {
                  if (selectedTable) {
                    removeTable(selectedTable.id);
                    setSelectedTable(null);
                  }
                }}
              >
                <Trash2 className="w-4 h-4" /> Remove Table
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TableManagement;