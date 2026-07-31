export type FaqItem = {
  id: string;
  category: string;
  question: string;
  answer: string;
  steps?: string[];
  tip?: string;
  learnMoreUrl?: string;
};

export type FaqCategory = {
  id: string;
  label: string;
  icon: string;
  items: FaqItem[];
};

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "getting-started",
    label: "Getting Started",
    icon: "Rocket",
    items: [
      {
        id: "gs-1",
        category: "getting-started",
        question: "How do I set up my account after approval?",
        answer:
          "Once approved, you will receive an email and SMS confirmation. Log in with the email and password you registered with. You will be prompted to change your password on first login.",
        steps: [
          "Log in at vayo.rw/login",
          "Change your password when prompted",
          "Go to Settings to configure your refund policy and pricing inputs",
          "Add your buses under Fleet Management",
          "Add your routes under Routes",
          "Schedule your first trip under Trips",
          "Set up your payout account in Payouts",
        ],
      },
      {
        id: "gs-2",
        category: "getting-started",
        question: "What do I need before I can schedule a trip?",
        answer:
          "You need three things set up first — a bus, a route with at least 2 stops, and a trip schedule. Without all three you will see warning messages on the Trips page.",
        steps: [
          "Add at least one bus (Fleet Management)",
          "Add at least one route with stops (Routes)",
          "Go to Trips and click \"Schedule Trip\"",
        ],
        tip: "Make sure your route has more than 2 stops if you want passengers to book partial segments (e.g. Kigali → Mbarara on a Kigali → Kampala route).",
      },
      {
        id: "gs-3",
        category: "getting-started",
        question: "How do I add staff members to my account?",
        answer:
          "Go to Team Management from your dashboard. You can add staff with four different roles: Dispatcher (manages trips and scheduling), Conductor (verifies tickets and manages boarding), Accountant (views revenue reports), and Operator Admin (full access except creating other admins).",
        steps: [
          "Go to Team Management",
          "Click \"Add Staff Member\"",
          "Enter their name, email, and phone",
          "Select their role",
          "They will receive login credentials by SMS",
        ],
        tip: "New staff members are required to change their password on first login.",
      },
    ],
  },
  {
    id: "routes-stops",
    label: "Routes & Stops",
    icon: "MapPin",
    items: [
      {
        id: "rs-1",
        category: "routes-stops",
        question: "How do I add a route?",
        answer:
          "Go to Routes, click \"Add Route\", and fill in the origin city, destination city, total distance in kilometres, and base price. After creating the route, expand it to add stops.",
        steps: [
          "Go to Routes",
          "Click \"Add Route\"",
          "Enter origin, destination, distance (km), and base price",
          "Click Save",
          "Click \"Stops\" on the new route card to add intermediate stops",
        ],
        tip: "If you only have an origin and destination stop (2 stops total), passengers can only book the full route. Add intermediate stops to enable partial segment booking.",
        learnMoreUrl: "/operator/routes",
      },
      {
        id: "rs-2",
        category: "routes-stops",
        question: "How do I add stops to a route?",
        answer:
          "Each stop needs a name, the distance from the origin in kilometres, the country it is in, and whether boarding and/or dropping off is allowed at that stop.",
        steps: [
          "Find your route and click \"Stops\"",
          "The first stop (origin) is at 0 km and cannot be changed",
          "Click \"Add Stop\" to add intermediate stops or update the destination",
          "For each stop: enter the stop name, distance from origin (must be higher than the previous stop), select country, and check Boarding and/or Dropping as needed",
          "Click \"Save Stops\"",
        ],
        tip: "At least one stop must have Boarding checked and at least one must have Dropping checked, or passengers cannot complete a booking.",
        learnMoreUrl: "/operator/routes",
      },
      {
        id: "rs-3",
        category: "routes-stops",
        question: "What is the distance field and how do I calculate it?",
        answer:
          "The distance is the road distance in kilometres from the first stop (origin) to each subsequent stop. Use Google Maps to measure road distance, not straight-line distance. For example, if Kigali to Kabuga is 23km by road, and Kabuga to Gatuna is another 165km, then Gatuna's distance from origin would be 188km.",
        learnMoreUrl: "/operator/routes",
      },
    ],
  },
  {
    id: "trips-scheduling",
    label: "Trips",
    icon: "Calendar",
    items: [
      {
        id: "ts-1",
        category: "trips-scheduling",
        question: "How does the trip lifecycle work?",
        answer:
          "Every trip goes through five statuses. You control when each transition happens from the Trips page.",
        steps: [
          "SCHEDULED — Trip is created and visible to passengers for booking",
          "BOARDING — Click \"Open Boarding\" when your bus is ready at the stop. Passengers can now board.",
          "DEPARTED — Click \"Mark Departed\" when the bus leaves. No new bookings allowed.",
          "ARRIVED — Click \"Mark Arrived\" when the bus reaches the destination. This closes the trip for accounting — your revenue becomes available for payout.",
          "CANCELLED — Trip did not operate. All passengers are automatically refunded in full.",
        ],
        tip: "You must mark trips as ARRIVED for your revenue to appear in your available payout balance. Trips that are not marked as arrived will show as \"Pending\" in your balance.",
        learnMoreUrl: "/operator/trips",
      },
      {
        id: "ts-2",
        category: "trips-scheduling",
        question: "How do I set the price for a trip?",
        answer:
          "When scheduling a trip, enter your price in the price field. You can also click \"Get Price Suggestion\" to have VAYO calculate a suggested price based on your fuel costs, crew allowance, and target margin. The suggestion is a starting point — you set the final price.",
        tip: "Update your pricing inputs in Settings first to get an accurate price suggestion based on your actual costs.",
        learnMoreUrl: "/operator/settings",
      },
      {
        id: "ts-3",
        category: "trips-scheduling",
        question: "What are segment prices and do I need to set them?",
        answer:
          "If your route has more than 2 stops, passengers can book partial journeys (e.g. Kigali → Mbarara on a Kigali → Kampala trip). VAYO automatically calculates the price for each segment based on the distance ratio. You can override any segment price by clicking \"Segment Prices\" on a scheduled trip.",
        tip: "You do not need to set segment prices manually — VAYO calculates them for you. Override only if you want to charge a specific amount for a particular segment.",
      },
      {
        id: "ts-4",
        category: "trips-scheduling",
        question: "What happens if I cancel a trip?",
        answer:
          "All confirmed passengers are automatically notified by SMS and email, and they receive a full refund including the VAYO service fee. The refund is processed automatically — you do not need to do anything.",
        tip: "If you cancel a trip within 6 hours of scheduled departure, a penalty of 1,000 RWF per affected seat will be deducted from your next payout. This goes to affected passengers as a goodwill credit.",
      },
    ],
  },
  {
    id: "payouts-revenue",
    label: "Payouts",
    icon: "Wallet",
    items: [
      {
        id: "pr-1",
        category: "payouts-revenue",
        question: "How do I get paid?",
        answer:
          "VAYO pays you for trips that have been completed (marked as ARRIVED). You need to set up your payout account first and have it verified by VAYO.",
        steps: [
          "Go to Payouts → Payout Account section",
          "Enter your MoMo Business or bank account details",
          "Wait for VAYO to verify your account (usually within 1 business day)",
          "Mark your trips as ARRIVED after they complete",
          "Once your available balance reaches 5,000 RWF, click \"Request Payout\"",
          "VAYO reviews and processes the payout within 2-3 business days",
        ],
        tip: "Trips must be marked as ARRIVED before their revenue counts as \"available\". Trips that are DEPARTED but not yet ARRIVED show as \"Pending\" balance.",
        learnMoreUrl: "/operator/payouts",
      },
      {
        id: "pr-2",
        category: "payouts-revenue",
        question: "What is the difference between Available, Pending, and In Payout balance?",
        answer:
          "Available balance is money from completed trips (ARRIVED) that you can request right now. Pending balance is money from trips that have not yet departed or arrived — it will become available once those trips complete. In Payout balance is money from a payout request that is currently being reviewed or processed.",
      },
      {
        id: "pr-3",
        category: "payouts-revenue",
        question: "Why is my available balance zero even though I have had bookings?",
        answer:
          "There are four reasons this can happen. First, your trips may not be marked as ARRIVED yet — you must close each trip by clicking \"Mark Arrived\" after it completes. Second, you may have a payout request already in progress. Third, some bookings may have been refunded. Fourth, your available balance may be below the 5,000 RWF minimum for payout.",
        tip: "Check your Trips page and make sure completed trips are marked as ARRIVED, not left as DEPARTED.",
        learnMoreUrl: "/operator/trips",
      },
      {
        id: "pr-4",
        category: "payouts-revenue",
        question: "My payout was rejected. What do I do?",
        answer:
          "Check the rejection reason shown on the payout card — it will explain why it was not processed. Common reasons are incorrect account details or an unverified payout account. Update your account details in the Payout Account section and request a new payout. If you believe the rejection was in error, contact support@vayo.rw with your payout reference number.",
        learnMoreUrl: "/operator/payouts",
      },
    ],
  },
  {
    id: "refunds",
    label: "Refunds",
    icon: "RefreshCw",
    items: [
      {
        id: "rf-1",
        category: "refunds",
        question: "How does the refund policy work?",
        answer:
          "You set your own refund policy in Settings. The policy has five time tiers based on how far in advance a passenger cancels. VAYO requires you to offer at least 60% refund for cancellations more than 48 hours before departure. You can be more generous but not less.",
        steps: [
          "Go to Settings → Refund Policy",
          "Set a percentage for each time tier",
          "The over-48-hours tier must be at least 60%",
          "Click Save — your policy will be shown to passengers at checkout",
        ],
        tip: "Your policy is locked in for each passenger at the time they book. Changing your policy later does not affect existing bookings.",
        learnMoreUrl: "/operator/settings",
      },
      {
        id: "rf-2",
        category: "refunds",
        question: "A passenger cancelled. Do I need to approve the refund?",
        answer:
          "It depends on when they cancelled. If they cancelled more than 48 hours before departure, the refund is processed automatically at your stated percentage — you do not need to do anything. If they cancelled less than 48 hours before departure, you will see a refund request in your Refund Requests page and you need to approve or reject it.",
        learnMoreUrl: "/operator/refunds",
      },
      {
        id: "rf-3",
        category: "refunds",
        question: "How do I approve or reject a refund request?",
        answer:
          "Go to Refund Requests from the dashboard. You will see all pending requests with the passenger details, how far in advance they cancelled, and the refund amount calculated by your policy. Click Approve to process the refund automatically or Reject to decline it with a reason.",
        steps: [
          "Go to Refund Requests",
          "Find the pending request",
          "Review the cancellation time and amount",
          "Click Approve (refund processes automatically) or Reject (requires a reason — at least 10 characters)",
        ],
        tip: "If you do not respond to a refund request within 48 hours, it will be escalated to VAYO admin for review.",
        learnMoreUrl: "/operator/refunds",
      },
      {
        id: "rf-4",
        category: "refunds",
        question: "A passenger says they did not receive their refund. What do I do?",
        answer:
          "Once you approve a refund, it is processed automatically to the passenger's original payment method. MoMo refunds take 24-72 hours. Card refunds take 7-14 business days. If the passenger has waited longer than this, ask them to contact support@vayo.rw with their booking reference and you can also escalate from your refunds page.",
      },
    ],
  },
  {
    id: "conductors-boarding",
    label: "Conductors",
    icon: "Users",
    items: [
      {
        id: "cb-1",
        category: "conductors-boarding",
        question: "How does the conductor verify tickets?",
        answer:
          "Conductors use the VAYO conductor panel (same website, conductor role). They log in and see today's trips. For each trip they can view the full passenger manifest and verify each passenger by entering their booking reference code. The code is on the passenger's ticket and starts with VAYO-.",
      },
      {
        id: "cb-2",
        category: "conductors-boarding",
        question: "What should a conductor do if a passenger's ticket shows as invalid?",
        answer:
          "First check that the conductor is looking at the correct trip — make sure the date, time, and route match. If the trip is correct and the ticket still shows invalid, the booking may have been cancelled or expired. The conductor should note the passenger's name and contact support@vayo.rw after the trip.",
      },
      {
        id: "cb-3",
        category: "conductors-boarding",
        question: "What if a passenger wants to board but did not book online?",
        answer:
          "Walk-on sales (selling tickets at the bus) are not currently supported in VAYO. Passengers must book in advance through the VAYO app or website. If seats are available close to departure, the passenger can book online until the trip is marked as DEPARTED.",
      },
    ],
  },
  {
    id: "account-settings",
    label: "Settings",
    icon: "Settings",
    items: [
      {
        id: "as-1",
        category: "account-settings",
        question: "How do I update my refund policy?",
        answer:
          "Go to Settings → Refund Policy section. Update the percentages for each tier and click Save. The new policy applies to all future bookings. Existing bookings keep the policy that was active when they were booked.",
        learnMoreUrl: "/operator/settings",
      },
      {
        id: "as-2",
        category: "account-settings",
        question: "What are pricing inputs and do I need to fill them in?",
        answer:
          "Pricing inputs are your actual operating costs — fuel consumption, driver allowance, maintenance, and overhead. VAYO uses them to calculate a suggested price when you schedule a trip. You do not have to fill them in, but if you do, the price suggestion will be much more accurate for your specific operation.",
        tip: "If you see \"Low Confidence\" on a price suggestion, it means VAYO is using platform averages, not your actual costs. Go to Settings → Pricing Inputs to enter your numbers.",
        learnMoreUrl: "/operator/settings",
      },
      {
        id: "as-3",
        category: "account-settings",
        question: "I forgot my password. How do I reset it?",
        answer:
          "On the login page, click \"Forgot password\" and enter your email address. You will receive a password reset link by email. If you do not receive it within a few minutes, check your spam folder. If you still cannot log in, contact support@vayo.rw.",
      },
      {
        id: "as-4",
        category: "account-settings",
        question: "How do I contact VAYO support?",
        answer:
          "Email support@vayo.rw with your company name and a description of the issue. For urgent issues related to a trip currently in operation, include the trip reference and contact us as soon as possible. We aim to respond within 4 hours during business hours (8 AM – 6 PM Kigali time).",
      },
    ],
  },
];

export const ALL_FAQ_ITEMS: FaqItem[] = FAQ_CATEGORIES.flatMap((cat) => cat.items);
