/**
 * Authentication state, backed by the real FastAPI backend.
 * Combined version: Resolves merge conflicts and maintains UI compatibility.
 */
import { create } from "zustand";
import {
  authApi,
  staffApi,
  tokenStore,
  userCache,
  setUnauthorizedHandler,
} from "@/lib/api";

const initialState = {
  user: null,                // { username, role, full_name, _id, email?, phone? }
  isAuthenticated: false,
  bootstrapping: true,       // true until we've verified the persisted token
  approvedUsers: [],         // mirrored staff list
  pendingUsers: [],          // mirrored approval queue
  staffLoading: false,
};

export const useAuth = create((set, get) => ({
  ...initialState,

  /* Called once on app start. Validates the persisted token via /me. */
  bootstrap: async () => {
    if (!tokenStore.get()) {
      set({ bootstrapping: false });
      return;
    }
    try {
      const me = await authApi.me();
      userCache.set(me);
      set({ user: me, isAuthenticated: true, bootstrapping: false });
      // Best-effort warm of staff data when we have the role for it.
      if (me.role === "admin" || me.role === "manager") {
        get().refreshStaff().catch(() => {});
      }
    } catch {
      tokenStore.clear();
      userCache.clear();
      set({ user: null, isAuthenticated: false, bootstrapping: false });
    }
  },

  /**
   * login(role, credential, identifier)
   */
  login: async (role, credential, identifier) => {
    try {
      const data = await authApi.login(identifier, credential);
      const me = await authApi.me();
      userCache.set(me);
      set({ user: me, isAuthenticated: true });
      
      if (role && me.role && role !== me.role) {
        tokenStore.clear();
        userCache.clear();
        set({ user: null, isAuthenticated: false });
        return {
          success: false,
          message: `Access denied. Please use the ${me.role} portal to log in.`,
        };
      }
      return { success: true, user: me };
    } catch (err) {
      return { success: false, message: err.message || "Login failed" };
    }
  },

  logout: async () => {
    try { await authApi.logout(); } catch { /* fall through */ }
    tokenStore.clear();
    userCache.clear();
    set({ ...initialState, bootstrapping: false });
  },

  /**
   * signup(name, email, username, phone, pin, role, status?)
   */
  signup: async (name, email, username, phone, pin, role = "kitchen", status = "pending") => {
    try {
      if (status === "approved") {
        const user = await staffApi.create({
          username,
          password: pin,
          full_name: name,
          role,
          email: email || null,
          phone: phone || null,
        });
        await get().refreshStaff().catch(() => {});
        return { success: true, user };
      }
      const r = await authApi.signup({
        full_name: name,
        email: email || null,
        username,
        phone: phone || null,
        password: pin,
        role,
      });
      return { success: true, message: r?.message || "Signup submitted" };
    } catch (err) {
      return { success: false, message: err.message || "Signup failed" };
    }
  },

  /* ─── Management mirror — Admin/Managers only ─── */

  refreshStaff: async () => {
    set({ staffLoading: true });
    try {
      const [{ staff }, { approvals }] = await Promise.all([
        staffApi.list().catch(() => ({ staff: [] })),
        staffApi.pendingApprovals().catch(() => ({ approvals: [] })),
      ]);
      set({
        approvedUsers: (staff || []).map((u) => ({
          ...u,
          id: u.username, 
          name: u.full_name || u.username,
          status: u.is_active ? "approved" : "suspended",
        })),
        pendingUsers: (approvals || []).map((a) => ({
          ...a,
          id: a._id,
          name: a.full_name || a.username,
          status: "pending",
        })),
        staffLoading: false,
      });
    } catch {
      set({ staffLoading: false });
    }
  },

  approveUser: async (approvalId) => {
    await staffApi.approve(approvalId);
    await get().refreshStaff();
  },

  rejectUser: async (approvalId, reason = "") => {
    await staffApi.reject(approvalId, reason);
    await get().refreshStaff();
  },

  deleteUser: async (username) => {
    await staffApi.remove(username);
    set((s) => ({
      approvedUsers: s.approvedUsers.filter((u) => u.username !== username),
    }));
  },

  toggleUserStatus: async (username, newStatus) => {
    await staffApi.update(username, { is_active: newStatus !== "suspended" });
    set((s) => ({
      approvedUsers: s.approvedUsers.map((u) =>
        u.username === username
          ? { ...u, status: newStatus, is_active: newStatus !== "suspended" }
          : u,
      ),
    }));
  },

  updateProfile: async (username, data) => {
    try {
      const updated = await staffApi.update(username, {
        full_name: data.name ?? data.full_name,
        email: data.email,
        phone: data.phone,
        role: data.role,
      });
      set((s) => ({
        approvedUsers: s.approvedUsers.map((u) =>
          u.username === username ? { ...updated, id: updated.username, name: updated.full_name } : u,
        ),
        user: s.user && s.user.username === username ? { ...s.user, ...updated } : s.user,
      }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  updateCredentials: async (currentPassword, newPassword) => {
    try {
      await authApi.changePassword(currentPassword, newPassword);
      return { success: true, message: "Password updated" };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  getPendingUsers: () => get().pendingUsers,
}));

// Global 401 handler
setUnauthorizedHandler(() => {
  tokenStore.clear();
  userCache.clear();
  useAuth.setState({ user: null, isAuthenticated: false });
});

export default useAuth;