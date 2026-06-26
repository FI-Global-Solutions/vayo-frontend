// ─── Auth ────────────────────────────────────────────────────────────────────

export type UserRole = "TRAVELER" | "OPERATOR_SUPER_ADMIN" | "OPERATOR_ADMIN" | "DISPATCHER" | "CONDUCTOR" | "ACCOUNTANT" | "ADMIN";

export type OperatorStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "INFORMATION_REQUIRED" | "REJECTED";

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  mustResetPassword: boolean;
  operatorStatus?: OperatorStatus;
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
  operatorStatus?: OperatorStatus;
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

// ─── Route Stops ─────────────────────────────────────────────────────────────

export interface RouteStop {
  id: string;
  stopName: string;
  stopOrder: number;
  distanceFromOriginKm: number;
  boardingAllowed: boolean;
  droppingAllowed: boolean;
  countryCode: string;
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
  segmentPrice?: number | null;
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
  stops: RouteStop[];
  // Segment-aware fields — populated after stop selection
  segmentPrice?: number | null;
  originStopId?: string;
  destinationStopId?: string;
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
  // Populated on cancellation response
  refundAmountRwf?: number;
  expectedTimelineMessage?: string;
  refund?: RefundSummary;
}

export interface PassengerInfo {
  seatNumber: string;
  passengerName: string;
  passengerPhone?: string;
  isPrimaryPassenger: boolean;
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
  boardingStop?: string;
  droppingStop?: string;
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
  passengers?: PassengerInfo[];
  refund?: RefundSummary;
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
  bookingReference: string;
  seatNumber: string;
  passengerName: string;
  passengerPhone?: string;
  isPrimaryPassenger: boolean;
  boardingStop?: string;
  droppingStop?: string;
  bookingStatus: string;
  boardedAt?: string;
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
  status: OperatorStatus;
  commissionRate: number;
  createdAt: string;
}

// ─── Refund Policy ───────────────────────────────────────────────────────────

export interface RefundPolicyTier {
  label: string;
  refundPct: number;
  hoursThreshold: number | null;
}

export interface RefundPolicyResponse {
  operatorName: string;
  tiers: RefundPolicyTier[];
  platformRules: {
    operatorCancelledFullRefund: boolean;
    earlyDepartureFullRefund: boolean;
    serviceFeeNonRefundable: boolean;
  };
  policyVersion: number;
  effectiveFrom: string;
}

// ─── Refund ───────────────────────────────────────────────────────────────────

export type RefundStatus =
  | "AWAITING_APPROVAL"
  | "APPROVED"
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "REJECTED";

export interface RefundSummary {
  refundId: string;
  status: RefundStatus;
  refundAmountRwf: number;
  rejectionReason?: string;
  requestedAt: string;
  reviewedAt?: string;
  escalatedToAdmin?: boolean;
}

export interface OperatorRefundItem {
  refundId: string;
  bookingReference: string;
  passengerName: string;
  passengerPhone: string;
  tripRoute: string;
  tripDepartureTime: string;
  cancelledAt?: string;
  hoursBeforeDeparture?: number;
  refundAmountRwf: number;
  totalAmountPaid?: number;
  serviceFeeAmount?: number;
  appliedPolicyTier?: string;
  appliedPctUsed?: number;
  status: RefundStatus;
  requestedAt: string;
  rejectionReason?: string;
  escalatedToAdmin?: boolean;
}

// ─── Payouts ─────────────────────────────────────────────────────────────────

export interface PayoutBalance {
  availableAmountRwf: number;
  pendingAmountRwf: number;
  inPayoutAmountRwf: number;
  totalEarnedRwf: number;
  bookingCount: number;
  earliestEligibleBookingDate?: string;
}

export interface PayoutAccount {
  accountType: "MOMO_BUSINESS" | "BANK_TRANSFER";
  accountNumber: string;
  accountName: string;
  bankName?: string;
  bankCode?: string;
  isVerified: boolean;
  verifiedAt?: string;
}

export type PayoutStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "REJECTED";

export interface PayoutSummary {
  id: string;
  payoutReference: string;
  status: PayoutStatus;
  amountRwf: number;
  bookingCount: number;
  periodFrom?: string;
  periodTo?: string;
  requestedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  processedAt?: string;
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

export interface PriceSuggestionResult {
  fuelCost: number;
  driverAllowance: number;
  borderToll: number;
  maintenanceCost: number;
  overhead: number;
  totalTripCost: number;
  breakevenPerSeat: number;
  suggestedPricePerSeat: number;
  suggestedPriceRounded: number;
  dieselPrice: number;
  fuelConsumption: number;
  occupancyPct: number;
  marginPct: number;
  distanceKm: number;
  busCapacity: number;
  confidence: "HIGH" | "LOW";
}

export interface SegmentPriceEntry {
  originStopId: string;
  originStopName: string;
  destinationStopId: string;
  destinationStopName: string;
  price: number;
  overridden: boolean;
}

// ─── Operator Settings ───────────────────────────────────────────────────────

export interface OperatorRefundPolicyData {
  over48hRefundPct: number;
  h24To48hRefundPct: number;
  h12To24hRefundPct: number;
  h4To12hRefundPct: number;
  under4hRefundPct: number;
  policyVersion: number;
  effectiveFrom?: string;
  operatorCustomPolicy: boolean;
}

export interface OperatorPricingInputsData {
  fuelConsumptionLPer100Km: number;
  targetOccupancyPct: number;
  operatorMarginPct: number;
  maintenanceCostPerKm: number;
  driverConductorAllowancePerTrip: number;
  overheadPerTrip: number;
  updatedAt?: string;
  isCustom: boolean;
}

// ─── Admin Refunds ───────────────────────────────────────────────────────────

export type RefundReason =
  | "PASSENGER_CANCELLED"
  | "OPERATOR_CANCELLED"
  | "EARLY_DEPARTURE"
  | "FORCE_MAJEURE"
  | "ADMIN_OVERRIDE";

export interface AdminRefundItem {
  refundId: string;
  bookingReference: string;
  refundAmountRwf: number;
  serviceFeeRefunded: boolean;
  refundReason: RefundReason;
  status: RefundStatus;
  appliedPolicyTier?: string;
  appliedPctUsed?: number;
  policyVersionAtBooking: number;
  totalAmountPaid?: number;
  serviceFeeAmount?: number;
  calculatedAt?: string;
  processedAt?: string;
  gatewayRefundReference?: string;
  failureReason?: string;
  rejectionReason?: string;
  reviewedAt?: string;
  requestedAt?: string;
  escalatedToAdmin: boolean;
  passengerName?: string;
  passengerPhone?: string;
  tripRoute?: string;
  tripDepartureTime?: string;
  hoursBeforeDeparture?: number;
}

export interface AdminRefundPolicy {
  over48hRefundPct: number;
  h24To48hRefundPct: number;
  h12To24hRefundPct: number;
  h4To12hRefundPct: number;
  under4hRefundPct: number;
  policyVersion: number;
  effectiveFrom?: string;
}

// ─── Admin Payouts ───────────────────────────────────────────────────────────

export interface AdminPayoutSummary {
  id: string;
  payoutReference: string;
  status: PayoutStatus;
  amountRwf: number;
  bookingCount: number;
  periodFrom?: string;
  periodTo?: string;
  requestedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  gatewayTransferId?: string;
  processedAt?: string;
  failureReason?: string;
  createdAt: string;
}

export interface ReconciliationReport {
  totalCompleted: number;
  totalPendingApproval: number;
  totalApproved: number;
  totalProcessing: number;
  totalFailed: number;
  totalRejected: number;
}

// ─── Admin Notifications ──────────────────────────────────────────────────────

export type AdminNotificationType =
  | "OPERATOR_APPLIED"
  | "OPERATOR_RESUBMITTED"
  | "PAYOUT_REQUESTED"
  | "REFUND_ESCALATED";

export interface AdminNotification {
  id: string;
  type: AdminNotificationType;
  referenceId: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Operator RFA ─────────────────────────────────────────────────────────────

export type OperatorHistoryAction =
  | "SUBMITTED" | "RESUBMITTED" | "APPROVED" | "SUSPENDED"
  | "RFA_SENT" | "REJECTED" | "REACTIVATED";

export interface RfaResponse {
  id: string;
  message: string;
  requiredItems: string[];
  sentAt: string;
  respondedAt: string | null;
}

export interface ApplicationHistoryItem {
  id: string;
  action: OperatorHistoryAction;
  actorName: string;
  notes: string | null;
  createdAt: string;
}

export interface ApplicationStatusResponse {
  status: OperatorStatus;
  rfaCount: number;
  latestRfa: RfaResponse | null;
  canReapplyAfter: string | null;
  history: ApplicationHistoryItem[];
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
