/**
 * S.A.F.E. Table — Single canonical API client.
 *
 * Talks to the FastAPI backend. Every page/component goes through this file.
 */

const RAW_API_URL = import.meta.env.VITE_API_URL ?? "";
export const API_BASE = RAW_API_URL.replace(/\/+$/, "");

// ─── Storage helpers ─────────────────────────────────────────────────────

export const tokenStore = {
  get: () => localStorage.getItem("safetable_token"),
  set: (t) => localStorage.setItem("safetable_token", t),
  clear: () => localStorage.removeItem("safetable_token"),
};

export const userCache = {
  get: () => {
    try { return JSON.parse(localStorage.getItem("safetable_user") || "null"); }
    catch { return null; }
  },
  set: (u) => localStorage.setItem("safetable_user", JSON.stringify(u)),
  clear: () => localStorage.removeItem("safetable_user"),
};

export const customerTicket = {
  get: () => localStorage.getItem("safetable_ticket"),
  set: (t) => localStorage.setItem("safetable_ticket", t),
  clear: () => localStorage.removeItem("safetable_ticket"),
};

export const customerSession = {
  get: () => {
    try { return JSON.parse(localStorage.getItem("safetable_session") || "null"); }
    catch { return null; }
  },
  set: (s) => localStorage.setItem("safetable_session", JSON.stringify(s)),
  clear: () => localStorage.removeItem("safetable_session"),
};

// ─── Core request helper ────────────────────────────────────────────────────

class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function request(path, options = {}) {
  const {
    method = "GET",
    body,
    params,
    withTicket = false,
    withAuth = true,
    headers = {},
  } = options;

  let url = `${API_BASE}${path}`;
  if (params && Object.keys(params).length) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
    );
    if ([...qs].length) url += `?${qs.toString()}`;
  }

  const finalHeaders = { Accept: "application/json", ...headers };
  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (withAuth) {
    const token = tokenStore.get();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }
  if (withTicket) {
    const ticket = customerTicket.get();
    if (ticket) finalHeaders["X-Customer-Ticket"] = ticket;
  }

  const init = { method, headers: finalHeaders };
  if (body !== undefined) {
    init.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    throw new ApiError(`Network error contacting ${url}: ${err.message}`, 0, null);
  }

  let data = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try { data = await response.json(); } catch { /* empty body */ }
  } else if (response.status !== 204) {
    try { data = await response.text(); } catch { /* ignore */ }
  }

  if (!response.ok) {
    const detail =
      (data && (data.detail || data.message)) ||
      (typeof data === "string" ? data : null) ||
      `HTTP ${response.status}`;
    if (response.status === 401 && onUnauthorized) onUnauthorized();
    throw new ApiError(detail, response.status, data);
  }

  return data;
}

const get   = (path, opts) => request(path, { ...opts, method: "GET" });
const post  = (path, body, opts) => request(path, { ...opts, method: "POST", body });
const put   = (path, body, opts) => request(path, { ...opts, method: "PUT", body });
const patch = (path, body, opts) => request(path, { ...opts, method: "PATCH", body });
const del   = (path, opts) => request(path, { ...opts, method: "DELETE" });

// ─── WebSocket helper ─────────────────────────────────────────────────────

const WS_OVERRIDE = import.meta.env.VITE_WS_URL ?? "";
function buildWsUrl(path, query) {
  const origin = WS_OVERRIDE
    || (API_BASE
        ? API_BASE.replace(/^http/, "ws")
        : `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`);
  const qs = query
    ? "?" + new URLSearchParams(
        Object.entries(query).filter(([, v]) => v !== undefined && v !== null)
      ).toString()
    : "";
  return `${origin}${path}${qs}`;
}

export function openKitchenSocket() {
  const token = tokenStore.get();
  return new WebSocket(buildWsUrl("/ws/kitchen", { token }));
}

export function openCustomerSocket(tableNumber, sessionId) {
  return new WebSocket(buildWsUrl(`/ws/customer/${tableNumber}`, { session_id: sessionId }));
}

// ─── API Modules ──────────────────────────────────────────────────────────

export const authApi = {
  login: async (username, password) => {
    const data = await post("/api/auth/login", { username, password }, { withAuth: false });
    if (data?.access_token) tokenStore.set(data.access_token);
    return data;
  },
  signup: (payload) => post("/api/auth/signup", payload, { withAuth: false }),
  me: () => get("/api/auth/me"),
  logout: async () => {
    try { await post("/api/auth/logout"); } catch { /* no-op */ }
    tokenStore.clear();
    userCache.clear();
  },
  changePassword: (current_password, new_password) =>
    post("/api/auth/change-password", { current_password, new_password }),
};

export const menuApi = {
  list: (params = {}) => get("/api/menu", { params }),
  categories: () => get("/api/menu/categories"),
  get: (id) => get(`/api/menu/${id}`),
  create: (data) => post("/api/menu", data),
  update: (id, data) => put(`/api/menu/${id}`, data),
  remove: (id) => del(`/api/menu/${id}`),
};

export const ordersApi = {
  create: (items, table_number) => post("/api/orders", { items, table_number }, { withTicket: true, withAuth: false }),
  get: (orderId) => get(`/api/orders/${orderId}`, { withTicket: true }),
  byTable: (tableNumber) => get(`/api/orders/table/${tableNumber}`, { withTicket: true }),
  activeByTable: (tableNumber) => get(`/api/orders/table/${tableNumber}/active`, { withTicket: true }),
  updateStatus: (orderId, status) => patch(`/api/orders/${orderId}/status`, { status }),
  kitchenActive: () => get("/api/orders/kitchen/active"),
  kitchenStats: () => get("/api/orders/kitchen/stats"),
};

export const voiceApi = {
  order: ({ audio = null, transcript = null, language = "en" } = {}) => {
    const fd = new FormData();
    const ticket = customerTicket.get();
    if (ticket) fd.append("customer_ticket", ticket);
    if (audio) fd.append("audio", audio, "voice.webm");
    if (transcript) fd.append("transcript", transcript);
    fd.append("language", language);
    return post("/api/voice/order", fd, { withAuth: false });
  },
};

export const chatbotApi = {
  chat: ({ session_id, message, language = "en", table_number = null, context = null }) =>
    post("/api/chatbot/chat", { session_id, message, language, table_number, context }, { withTicket: true }),
  history: (sessionId, limit = 50) =>
    get(`/api/chatbot/history/${encodeURIComponent(sessionId)}`, { params: { limit }, withTicket: true }),
  clear: (sessionId) => del(`/api/chatbot/history/${encodeURIComponent(sessionId)}`),
  recommendations: (table_number, preferences = null) =>
    post("/api/chatbot/recommendations", null, { params: { table_number, preferences } }),
};

export const languagesApi = {
  list: () => get("/api/languages"),
  detect: (text) => post("/api/languages/detect", { text }),
  translate: (text, target_language, source_language = null) =>
    post("/api/languages/translate", { text, target_language, source_language }),
};

export const paymentsApi = {
  generateQR: (order_id, method = "qr_code") => post("/api/payments-manual/generate-qr", { order_id, method }, { withTicket: true }),
  confirm: (payment_id) => post("/api/payments-manual/confirm", { payment_id }),
  get: (paymentId) => get(`/api/payments-manual/${paymentId}`),
  byOrder: (orderId) => get(`/api/payments-manual/order/${orderId}`),
};

export const stripeApi = {
  createPaymentIntent: ({ order_id, currency = "usd", description = null, table_number = null }) =>
    post("/api/stripe/create-payment-intent", { order_id, currency, description, table_number }, { withTicket: true }),
  paymentStatus: (intentId) => get(`/api/stripe/payment-status/${intentId}`),
  generateQR: (data) => post("/api/stripe/generate-qr", { data }),
};

export const safepayApi = {
  generateQR: ({ order_id, table_number = null }) =>
    post("/api/safepay/generate-qr", { order_id, table_number }, { withTicket: true }),
};

export const feedbackApi = {
  submit: ({ order_id, table_number, text, rating }) =>
    post("/api/feedback", { order_id, table_number, text, rating }, { withTicket: true, withAuth: false }),
  list: (limit = 50, skip = 0) => get("/api/feedback", { params: { limit, skip } }),
  stats: () => get("/api/feedback/stats"),
};

export const staffApi = {
  list: ({ role, active_only } = {}) => get("/api/staff", { params: { role, active_only } }),
  create: (data) => post("/api/staff", data),
  get: (username) => get(`/api/staff/${encodeURIComponent(username)}`),
  update: (username, data) => put(`/api/staff/${encodeURIComponent(username)}`, data),
  remove: (username) => del(`/api/staff/${encodeURIComponent(username)}`),
  pendingApprovals: () => get("/api/staff/approvals/pending"),
  approve: (id) => post(`/api/staff/approvals/${encodeURIComponent(id)}/approve`),
  reject: (id, reason = "") => post(`/api/staff/approvals/${encodeURIComponent(id)}/reject`, null, { params: { reason } }),
};

export const tasksApi = {
  list: (filters = {}) => get("/api/tasks", { params: filters }),
  create: (data) => post("/api/tasks", data),
  get: (taskId) => get(`/api/tasks/${encodeURIComponent(taskId)}`),
  updateStatus: (taskId, status, notes = null) => patch(`/api/tasks/${encodeURIComponent(taskId)}/status`, { status, notes }),
  remove: (taskId) => del(`/api/tasks/${encodeURIComponent(taskId)}`),
};

export const salesApi = {
  summary: (period = "today") => get("/api/sales/summary", { params: { period } }),
  topItems: (period = "month", limit = 10) => get("/api/sales/top-items", { params: { period, limit } }),
  revenueChart: (days = 30) => get("/api/sales/revenue-chart", { params: { days } }),
};

export const adminApi = {
  dashboardStats: () => get("/api/admin/dashboard/stats"),
  orderHistory: ({ skip = 0, limit = 50, status } = {}) => get("/api/admin/orders/history", { params: { skip, limit, status } }),
};

export const tablesApi = {
  createSession: (table_number, language = "en") => post("/api/tables/session", { table_number, language }),
  devSession: (language = "en") => request("/api/tables/dev-session", {
    method: "POST",
    params: { language },
    withAuth: false,
  }),
  getSession: (table_number) => get(`/api/tables/${table_number}/session`),
  endSession: (table_number) => post(`/api/tables/${table_number}/end-session`),
  active: () => get("/api/tables/active"),
  mySession: () => get("/api/tables/me/session", { withTicket: true, withAuth: false }),
};

export const models3dApi = {
  list: () => get("/api/models3d"),
  get: (modelId) => get(`/api/models3d/${encodeURIComponent(modelId)}`),
  byMenuItem: (itemName) => get(`/api/models3d/menu-item/${encodeURIComponent(itemName)}`),
};

export const healthApi = {
  check: () => get("/health"),
};

export const api = {
  auth: authApi,
  menu: menuApi,
  orders: ordersApi,
  voice: voiceApi,
  chatbot: chatbotApi,
  languages: languagesApi,
  payments: paymentsApi,
  stripe: stripeApi,
  safepay: safepayApi,
  feedback: feedbackApi,
  staff: staffApi,
  tasks: tasksApi,
  sales: salesApi,
  admin: adminApi,
  tables: tablesApi,
  models3d: models3dApi,
  health: healthApi,
  get, post, put, patch, delete: del,
  openKitchenSocket,
  openCustomerSocket,
};

export default api;
export { ApiError };