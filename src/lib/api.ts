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
  seats: (tripId: string) => api.get(`/trips/${tripId}/seats`),
};

// ─── Bookings ────────────────────────────────────────────────────────────────

export const bookingApi = {
  initiate: (data: object) => api.post("/bookings/initiate", data),
  myBookings: () => api.get("/bookings/my-bookings"),
  ticket: (reference: string) => api.get(`/bookings/${reference}/ticket`),
};

// ─── Payments ────────────────────────────────────────────────────────────────

export const paymentApi = {
  initiate: (bookingId: string, phone: string) =>
    api.post("/payments/initiate", { bookingId, phone }),
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
};

// ─── Operator ─────────────────────────────────────────────────────────────────

export const operatorApi = {
  register: (data: {
    companyName: string;
    contactEmail: string;
    contactPhone: string;
    description?: string;
    adminFirstName: string;
    adminLastName: string;
    adminEmail: string;
    adminPhone: string;
    adminPassword: string;
  }) => api.post("/operator/register", data),
  conductors: () => api.get("/operator/conductors"),
  createConductor: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  }) => api.post("/operator/conductors", data),
  removeConductor: (conductorId: string) => api.delete(`/operator/conductors/${conductorId}`),
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
  manifest: (tripId: string) => api.get(`/operator/trips/${tripId}/manifest`),
};
