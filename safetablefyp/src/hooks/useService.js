/**
 * Service requests — Integrated with /api/tasks backend.
 * * Maps legacy "types" to backend roles:
 * - 'clean' -> role 'cleaner'
 * - 'help'  -> role 'server'
 * - 'bill'  -> role 'server'
 */
import { create } from "zustand";
import { tasksApi } from "@/lib/api";

const TYPE_TO_TITLE = {
  clean: "Cleaning request",
  help:  "Server assistance",
  bill:  "Bill request",
};

const TYPE_TO_ROLE = {
  clean: "cleaner",
  help:  "server",
  bill:  "server",
};

const TITLE_TO_TYPE = {
  "Cleaning request":   "clean",
  "Server assistance":  "help",
  "Bill request":       "bill",
};

const normalize = (t) => ({
  id:          t.task_id || t._id,
  tableNumber:  t.table_number != null ? String(t.table_number) : null,
  type:         TITLE_TO_TYPE[t.title] || (t.role === "cleaner" ? "clean" : "help"),
  status:       t.status,                // pending | in_progress | completed | cancelled
  requestedAt:  t.created_at,
  completedAt:  t.status === "completed" ? t.updated_at : null,
  raw:          t,
});

export const useService = create((set, get) => ({
  requests: [],
  loading: false,
  error: null,

  // Fetches all tasks from the backend (Used by Staff/Admin)
  refresh: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const r = await tasksApi.list(filters);
      set({ requests: (r.tasks || []).map(normalize), loading: false });
    } catch (err) {
      set({ loading: false, error: err.message });
    }
  },

  /** * Customer creates a service request.
   * Optimistic logic: Adds a local entry immediately, then replaces it with real data once API responds.
   */
  requestService: async (tableNumber, type, assignedTo = "unassigned") => {
    const optimisticId = `local-${Date.now()}`;
    const optimistic = {
      id:           optimisticId,
      tableNumber:  String(tableNumber),
      type,
      status:       "pending",
      requestedAt:  new Date().toISOString(),
      completedAt:  null,
      raw:          null,
    };

    set((s) => ({ requests: [optimistic, ...s.requests] }));

    try {
      const created = await tasksApi.create({
        title:        TYPE_TO_TITLE[type] || type,
        description:  `Customer request from table ${tableNumber}`,
        assigned_to:  assignedTo,
        role:         TYPE_TO_ROLE[type] || "server",
        priority:     type === "bill" ? "high" : "medium",
        table_number: Number(tableNumber),
      });
      
      const norm = normalize(created);
      set((s) => ({ 
        requests: s.requests.map((r) => (r.id === optimisticId ? norm : r)) 
      }));
      return norm;
    } catch (err) {
      console.warn("Backend task creation failed, keeping local entry.", err);
      return optimistic;
    }
  },

  resolveService: async (id) => {
    try {
      await tasksApi.updateStatus(id, "completed");
    } catch (err) {
      console.error("Failed to update status on server", err);
    }
    
    // Update locally regardless of success (optimistic)
    set((s) => ({
      requests: s.requests.map((r) =>
        r.id === id ? { ...r, status: "completed", completedAt: new Date().toISOString() } : r,
      ),
    }));
  },

  startService: async (id) => {
    try { 
      await tasksApi.updateStatus(id, "in_progress"); 
    } catch (err) {
      console.error(err);
    }
    
    set((s) => ({
      requests: s.requests.map((r) =>
        r.id === id ? { ...r, status: "in_progress" } : r,
      ),
    }));
  },

  // Legacy selector for components that only want pending items
  getPendingRequests: () => get().requests.filter((r) => r.status === "pending"),
}));

export default useService;