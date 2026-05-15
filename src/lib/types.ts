// ─── Auth ────────────────────────────────────────────────────────────────────

export type UserRole = "TRAVELER" | "OPERATOR_SUPER_ADMIN" | "OPERATOR_ADMIN" | "DISPATCHER" | "CONDUCTOR" | "ACCOUNTANT" | "ADMIN";

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  mustResetPassword: boolean;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  mustResetPassword: boolean;
}

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "OPERATOR_ADMIN" | "DISPATCHER" | "CONDUCTOR" | "ACCOUNTANT";
  enabled: boolean;
  createdAt: string;
}

// ─── Search ──────────────────────────────────────────────────────────────────

export interface TripSearchResult {
  tripId: string;
  origin: string;
  destination: string;
  operatorName: string;
  operatorLogo?: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  price: number;
  availableSeats: number;
  totalSeats: number;
  busType: "STANDARD" | "LUXURY" | "MINIBUS";
}

// ─── Seat Map ────────────────────────────────────────────────────────────────

export interface SeatStatus {
  seatNumber: string;
  status: "AVAILABLE" | "BOOKED" | "LOCKED" | "SELECTED";
  type: "WINDOW" | "AISLE";
}

export interface TripDetail {
  tripId: string;
  origin: string;
  destination: string;
  operatorName: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  busType: string;
  totalSeats: number;
  availableSeats: number;
  seats: SeatStatus[];
}

// ─── Booking ─────────────────────────────────────────────────────────────────

export interface BookingInitiateRequest {
  tripId: string;
  seatNumbers: string[];
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string;
}

export interface BookingResponse {
  bookingId: string;
  bookingReference: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "USED" | "EXPIRED";
  tripId: string;
  origin: string;
  destination: string;
  departureTime: string;
  operatorName: string;
  passengerName: string;
  passengerPhone: string;
  seatNumbers: string[];
  ticketPrice?: number;
  serviceFee?: number;
  totalAmount: number;
  seatLockExpiresAt?: string;
  createdAt: string;
}

export interface TicketResponse {
  bookingId: string;
  bookingReference: string;
  status: string;
  qrCodeBase64: string;
  tripId: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  operatorName: string;
  operatorPhone: string;
  busType: string;
  plateNumber: string;
  passengerName: string;
  passengerPhone: string;
  seatNumbers: string[];
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
}

// ─── Operator ─────────────────────────────────────────────────────────────────

export interface OperatorDashboardStats {
  totalRoutes: number;
  totalBuses: number;
  totalTrips: number;
  totalConfirmedBookings: number;
  totalRevenue: number;
  totalGrossRevenue: number;
  upcomingTrips: number;
}

export interface TripOperatorResponse {
  id: string;
  origin: string;
  destination: string;
  plateNumber: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
  status: "SCHEDULED" | "BOARDING" | "DEPARTED" | "CANCELLED";
}

export interface ManifestEntry {
  bookingId: string;
  bookingReference: string;
  passengerName: string;
  passengerPhone: string;
  seatNumbers: string[];
  status: string;
}

// ─── Conductor ────────────────────────────────────────────────────────────────

export interface VerifyTicketResponse {
  valid: boolean;
  message: string;
  bookingId?: string;
  bookingReference?: string;
  passengerName?: string;
  passengerPhone?: string;
  seatNumbers?: string[];
  status?: string;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface PlatformStats {
  totalOperators: number;
  pendingOperators: number;
  activeOperators: number;
  totalUsers: number;
  totalTrips: number;
  totalBookings: number;
  confirmedBookings: number;
}

export interface OperatorAdminResponse {
  id: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  commissionRate: number;
  createdAt: string;
}

// ─── API Wrapper ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
