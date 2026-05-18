import axios, { AxiosError } from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + "/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("vayo_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("vayo_token");
      localStorage.removeItem("vayo_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (identifier: string, password: string) =>
    api.post("/auth/login", { identifier, password }),
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  }) => api.post("/auth/register", data),
  verifyOtp: (phone: string, otp: string) =>
    api.post("/auth/verify-otp", { phone, otp }),
  verifyLoginOtp: (phone: string, otp: string) =>
    api.post("/auth/verify-login-otp", { phone, otp }),
  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post("/auth/reset-password", { token, newPassword }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post("/auth/change-password", { currentPassword, newPassword }),
};

// ─── Search ──────────────────────────────────────────────────────────────────

export const searchApi = {
  origins: () => api.get<{ data: string[] }>("/search/origins"),
  destinations: (origin: string) =>
    api.get<{ data: string[] }>(`/search/destinations?origin=${encodeURIComponent(origin)}`),
  trips: (origin: string, destination: string, date: string) =>
    api.get(`/search/trips?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&date=${date}`),
};

// ─── Trips ───────────────────────────────────────────────────────────────────

export const tripApi = {
  detail: (tripId: string) => api.get(`/trips/${tripId}`),
  seats: (tripId: string, originStopId?: string, destinationStopId?: string) => {
    const params = new URLSearchParams();
    if (originStopId) params.set("originStopId", originStopId);
    if (destinationStopId) params.set("destinationStopId", destinationStopId);
    const qs = params.toString();
    return api.get(`/trips/${tripId}/seats${qs ? `?${qs}` : ""}`);
  },
};

// ─── Bookings ────────────────────────────────────────────────────────────────

export const bookingApi = {
  initiate: (data: object) => api.post("/bookings/initiate", data),
  myBookings: () => api.get("/bookings/my-bookings"),
  ticket: (reference: string) => api.get(`/bookings/${reference}/ticket`),
  cancel: (reference: string) => api.post(`/bookings/${reference}/cancel`),
};

// ─── Payments ────────────────────────────────────────────────────────────────

export const paymentApi = {
  verify: (bookingId: string, flwTransactionId: string) =>
    api.post("/payments/verify", { bookingId, flwTransactionId }),
  status: (bookingReference: string) =>
    api.get<{ data: { status: string } }>(`/payments/status/${bookingReference}`),
};

// ─── Conductor ───────────────────────────────────────────────────────────────

export const conductorApi = {
  todayTrips: () => api.get("/conductor/trips/today"),
  manifest: (tripId: string) => api.get(`/conductor/trips/${tripId}/manifest`),
  verify: (reference: string) => api.post(`/conductor/verify/${reference}`),
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminApi = {
  dashboard: () => api.get("/admin/dashboard"),
  operators: (status?: string, page = 0) =>
    api.get(`/admin/operators?page=${page}&size=20${status ? `&status=${status}` : ""}`),
  approve: (operatorId: string) => api.patch(`/admin/operators/${operatorId}/approve`),
  suspend: (operatorId: string) => api.patch(`/admin/operators/${operatorId}/suspend`),
  operatorDocuments: (operatorId: string) =>
    api.get(`/admin/operators/${operatorId}/documents`),
};

// ─── Refund Policy ────────────────────────────────────────────────────────────

export const refundApi = {
  getTripRefundPolicy: (tripId: string) =>
    api.get(`/trips/${tripId}/refund-policy`),
  acknowledgeRefundPolicy: (bookingReference: string) =>
    api.post(`/bookings/${bookingReference}/acknowledge-refund-policy`),
};

// ─── Terms ────────────────────────────────────────────────────────────────────

export const termsApi = {
  getCurrentPassengerTerms: () => api.get("/terms/passenger/current"),
  getCurrentOperatorTerms: () => api.get("/terms/operator/current"),
  acceptTerms: (termsVersionId: string) =>
    api.post("/terms/accept", { termsVersionId }),
};

// ─── Payouts ─────────────────────────────────────────────────────────────────

export const payoutApi = {
  getBalance: () => api.get("/operator/payouts/balance"),
  requestPayout: () => api.post("/operator/payouts/request"),
  getPayouts: (page = 0) => api.get(`/operator/payouts?page=${page}&size=20`),
  getPayout: (reference: string) => api.get(`/operator/payouts/${reference}`),
  getPayoutAccount: () => api.get("/operator/payout-account"),
  updatePayoutAccount: (data: object) => api.put("/operator/payout-account", data),
};

// ─── Operator ─────────────────────────────────────────────────────────────────

export const operatorApi = {
  register: (formData: FormData) =>
    api.post("/operator/register", formData, {
      headers: { "Content-Type": undefined },
    }),
  dashboard: () => api.get("/operator/dashboard"),
  me: () => api.get("/operator/me"),
  routes: (page = 0) => api.get(`/operator/routes?page=${page}&size=20`),
  createRoute: (data: object) => api.post("/operator/routes", data),
  updateRoute: (id: string, data: object) => api.put(`/operator/routes/${id}`, data),
  deleteRoute: (id: string) => api.delete(`/operator/routes/${id}`),
  buses: (page = 0) => api.get(`/operator/buses?page=${page}&size=20`),
  createBus: (data: object) => api.post("/operator/buses", data),
  updateBus: (id: string, data: object) => api.put(`/operator/buses/${id}`, data),
  deleteBus: (id: string) => api.delete(`/operator/buses/${id}`),
  trips: (page = 0) => api.get(`/operator/trips?page=${page}&size=20`),
  createTrip: (data: object) => api.post("/operator/trips", data),
  cancelTrip: (id: string) => api.patch(`/operator/trips/${id}/cancel`),
  startBoarding: (id: string) => api.patch(`/operator/trips/${id}/start-boarding`),
  departTrip: (id: string) => api.patch(`/operator/trips/${id}/depart`),
  arriveTrip: (id: string) => api.patch(`/operator/trips/${id}/arrive`),
  manifest: (tripId: string) => api.get(`/operator/trips/${tripId}/manifest`),
  // Staff management
  staff: () => api.get("/operator/staff"),
  createStaff: (data: object) => api.post("/operator/staff", data),
  toggleStaff: (id: string, enabled: boolean) =>
    api.patch(`/operator/staff/${id}/toggle?enabled=${enabled}`),
  removeStaff: (id: string) => api.delete(`/operator/staff/${id}`),
  // Refund management
  getRefunds: (status?: string, page = 0) => {
    const params = new URLSearchParams({ page: String(page), size: "20" });
    if (status) params.set("status", status);
    return api.get(`/operator/refunds?${params.toString()}`);
  },
  getRefund: (refundId: string) => api.get(`/operator/refunds/${refundId}`),
  approveRefund: (refundId: string) => api.post(`/operator/refunds/${refundId}/approve`),
  rejectRefund: (refundId: string, rejectionReason: string) =>
    api.post(`/operator/refunds/${refundId}/reject`, { rejectionReason }),
  // Backward-compat for conductors page
  conductors: () => api.get("/operator/conductors"),
  createConductor: (data: object) => api.post("/operator/staff", { ...data, role: "CONDUCTOR" }),
  removeConductor: (id: string) => api.delete(`/operator/staff/${id}`),
};
