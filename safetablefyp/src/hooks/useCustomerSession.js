/**
 * Customer session — table_number, session_id, customer_ticket.
 *
 * The ticket is issued by the backend (POST /api/tables/session, staff-only)
 * or by the dev shortcut (POST /api/tables/dev-session). Once issued, all
 * customer flows (order/voice/feedback/etc) attach it via X-Customer-Ticket.
 *
 * Persisted to localStorage so refresh keeps the seat.
 */
import { create } from "zustand";
import { tablesApi, customerTicket, customerSession } from "@/lib/api";

const persisted = customerSession.get();

export const useCustomerSession = create((set, get) => ({
  tableNumber: persisted?.table_number ?? null,
  sessionId:   persisted?.session_id   ?? null,
  hasTicket:   !!customerTicket.get(),
  loading:     false,
  error:       null,

  /** Bootstrap a customer session for a given table. Uses the dev endpoint;
   *  in production this should be replaced by a QR-code flow that hands the
   *  customer a ticket already minted by staff. */
  start: async (language = "en") => {
    set({ loading: true, error: null });
    try {
      const data = await tablesApi.devSession(language);
      customerTicket.set(data.customer_ticket);
      customerSession.set({
        table_number: data.table_number,
        session_id:   data.session_id,
      });
      set({
        tableNumber: data.table_number,
        sessionId:   data.session_id,
        hasTicket:   true,
        loading:     false,
      });
      return { success: true };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { success: false, message: err.message };
    }
  },

  /** Verify the persisted ticket still maps to a live session. */
  verify: async () => {
    if (!customerTicket.get()) return false;
    try {
      const r = await tablesApi.mySession();
      set({ tableNumber: r.table_number, sessionId: r.session_id, hasTicket: true });
      return true;
    } catch {
      get().clear();
      return false;
    }
  },

  clear: () => {
    customerTicket.clear();
    customerSession.clear();
    set({ tableNumber: null, sessionId: null, hasTicket: false });
  },
}));

export default useCustomerSession;
