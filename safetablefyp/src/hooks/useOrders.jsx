/**
 * Orders Store — Backend Integrated.
 * * Logic:
 * - Kitchen/Staff call refreshKitchen() to see all active orders.
 * - Customers call refreshForTable(n) to see their own orders.
 * - Normalized to ensure compatibility with existing UI components.
 */
import { create } from "zustand";
import { ordersApi } from "@/lib/api";
import { useCustomerSession } from "@/hooks/useCustomerSession";

// Maps Backend keys (order_id, total_price) to UI keys (orderId, totalPrice)
const normalize = (o) => ({
  orderId: o.order_id,
  _id: o._id,
  items: (o.items || []).map((i, idx) => ({
    id: i.menu_item_id || `${o.order_id}-${idx}`,
    name: i.name,
    price: i.price,
    quantity: i.quantity,
    customizations: i.customizations,
    notes: i.special_instructions || null,
  })),
  totalPrice: o.total_price,
  status: o.status,
  paymentStatus: o.payment_status,
  createdAt: o.created_at,
  updatedAt: o.updated_at,
  tableNumber: o.table_number,
  source: o.order_source,
});

export const useOrders = create((set, get) => ({
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
  tableNumber: useCustomerSession.getState().tableNumber,

  // Called by Kitchen Dashboard to get all active orders across the restaurant
  refreshKitchen: async () => {
    set({ loading: true, error: null });
    try {
      const r = await ordersApi.kitchenActive();
      set({ orders: (r.orders || []).map(normalize), loading: false });
    } catch (err) {
      set({ loading: false, error: err.message });
    }
  },

  // Called by Customer pages to get orders for their specific table
  refreshForTable: async (tableNumber) => {
    if (!tableNumber) return;
    set({ loading: true, error: null });
    try {
      const r = await ordersApi.byTable(tableNumber);
      set({ orders: (r.orders || []).map(normalize), loading: false });
    } catch (err) {
      set({ loading: false, error: err.message });
    }
  },

  /** * Place a customer order via API.
   * items: [{ name, quantity, notes? }] 
   */
  addOrder: async (cartItems) => {
    try {
      const items = cartItems.map((i) => ({
        menu_item_id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        special_instructions: i.notes || null,
      }));
      const tableNumber = useCustomerSession.getState().tableNumber;
      const created = await ordersApi.create(items, tableNumber);
      const norm = normalize(created);
      
      set((s) => ({ orders: [norm, ...s.orders], currentOrder: norm }));
      return norm;
    } catch (err) {
      console.error("Failed to place order:", err);
      if (err.message && err.message.toLowerCase().includes("invalid or expired")) {
        useCustomerSession.getState().clear();
      }
      throw err;
    }
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      const allowed = new Set([
        "pending", "confirmed", "preparing", "ready", "completed", "cancelled",
      ]);
      const apiStatus = allowed.has(status) ? status : "ready";
      const updated = await ordersApi.updateStatus(orderId, apiStatus);
      const norm = normalize(updated);
      
      set((s) => ({
        orders: s.orders.map((o) => (o.orderId === orderId ? norm : o)),
        currentOrder: s.currentOrder?.orderId === orderId ? norm : s.currentOrder,
      }));
      return norm;
    } catch (err) {
      console.error("Status update failed:", err);
      throw err;
    }
  },

  clearCurrentOrder: () => set({ currentOrder: null }),

  /* Legacy Selectors: Kept so existing pages don't crash */
  getAllOrders: () => get().orders,
  
  getMyOrders: () => {
    const tn = useCustomerSession.getState().tableNumber;
    if (!tn) return [];
    return get().orders.filter((o) => o.tableNumber === tn);
  },

  getActiveOrders: () => {
    const tn = useCustomerSession.getState().tableNumber;
    return get().orders.filter(
      (o) =>
        (!tn || o.tableNumber === tn) &&
        o.status !== "completed" &&
        o.status !== "cancelled",
    );
  },
}));

/**
 * Sync logic:
 * Updates the tableNumber in this store whenever the Customer Session changes.
 */
useCustomerSession.subscribe((s, prev) => {
  if (s.tableNumber !== prev.tableNumber) {
    useOrders.setState({ tableNumber: s.tableNumber });
  }
});

export default useOrders;