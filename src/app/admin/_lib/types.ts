export type DimensionScore = {
  dimension: string;
  average: number;
  min: number;
  max: number;
};

export type Recommendation = {
  title?: string;
  service?: string;
  priority?: string;
  description?: string;
};

export type AssessmentRecord = {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  whatsapp: string;
  employees: string;
  challenge?: string;
  target?: string;
  category: string;
  overallScore: number;
  scores: Record<string, number>;
  aiAnalysis: string;
  recommendations: Recommendation[];
  answers: Record<string, number>;
  assessmentStatus: string;
  resultEmailSentAt: string | null;
  resultEmailId: string | null;
  proposalStatus: string;
  proposalRequestedAt: string | null;
  proposalSentAt: string | null;
  proposalEmailId: string | null;
  proposalDraft?: ProposalDraftSnapshot | null;
  proposalGateStatus?: "not_evaluated" | "clear" | "pending_approval" | "approved" | "rejected" | "revision_required" | string;
  proposalGateReasons?: ProposalGateReason[];
  proposalCatalogVersion?: string | null;
  proposalGeneratedAt?: string | null;
  proposalApprovedAt?: string | null;
  proposalApprovedBy?: string | null;
  resultFollowUpLevel?: number;
  resultFollowUpSentAt?: string | null;
  proposalFollowUpLevel?: number;
  proposalFollowUpSentAt?: string | null;
  followUpPaused?: boolean;
  leadScore?: number | null;
  leadStatus?: string | null;
  leadTemperature?: string | null;
  leadScoreConfidence?: number | null;
  leadScoreReason?: string | null;
  leadScoreRuleVersion?: string | null;
  leadScoreEvidence?: {
    eligible?: boolean;
    buyingSignalCount?: number;
    missingData?: string[];
    exclusionReasons?: string[];
  } | null;
  lifecycleStage?: string;
  opportunityStage?: string;
  attribution?: Record<string, string>;
  createdAt: string;
};

export type ProposalGateReason = { code: string; message: string; severity: "warning" | "blocking" };

export type ProposalDraftSnapshot = {
  proposal?: { subject?: string; proposedProgram?: string; isSimulation?: boolean; rulesVersion?: string };
  commercials?: {
    items?: Array<{ id: string; moduleCode: string; name: string; pricingUnit: string; quantity: number; lineTotal: number; isMock: boolean; readinessStatus: string }>;
    subtotal?: number;
    discountPercent?: number;
    discountAmount?: number;
    totalBeforeTax?: number;
  };
  isSimulation?: boolean;
  rulesVersion?: string;
  requiredData?: Record<string, string>;
  requiredDataComplete?: boolean;
  requiredDataMissing?: string[];
  reviewSlaBusinessDays?: number;
  generatedAt?: string;
};

export type CatalogProduct = {
  id: string;
  product_key: string;
  name: string;
  status: string;
  objective?: string | null;
  notes?: string | null;
};

export type CatalogModule = {
  id: string;
  product_id: string;
  module_code: string;
  name: string;
  description?: string | null;
  standard_scope?: string | null;
  pricing_unit: string;
  base_price: number | string;
  currency: string;
  readiness_status: string;
  is_mock: boolean;
  active: boolean;
  catalog_version: string;
};

export type AssessmentDocumentType = "result-pdf" | "proposal-pdf" | "result-email" | "proposal-email";

export type EmailPreview = {
  recordName: string;
  emailId?: string;
  from?: string;
  to?: string[];
  createdAt?: string;
  lastEvent?: string;
  subject: string;
  html: string;
  attachments: { id?: string; label: string; filename: string; size?: number; contentType?: string; expiresAt?: string }[];
};

export type ContactRecord = {
  id: string;
  recordId: string;
  name: string;
  email: string;
  whatsapp: string;
  message: string;
  source: string;
  sourceType: string;
  category: string;
  status: string;
  notes: string;
  createdAt: string | null;
};

export type InquiryRecord = {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  message: string;
  source: string;
  status: string;
  notes: string;
  followUpLevel?: number;
  followUpLastSentAt?: string | null;
  followUpPaused?: boolean;
  moduleRequest?: {
    requestedAt?: string;
    modules?: Array<{ id?: string; code?: string; name?: string; basePrice?: number; currency?: string; catalogVersion?: string }>;
  };
  createdAt: string | null;
};

export type CalendarBookingRecord = {
  id: string;
  providerUid: string;
  leadId: string | null;
  assessmentId: string | null;
  eventTypeSlug: string | null;
  title: string;
  status: string;
  attendeeName: string;
  attendeeEmail: string;
  organizerEmail: string | null;
  startTime: string | null;
  endTime: string | null;
  timeZone: string;
  meetingUrl: string | null;
  cancellationReason: string | null;
  updatedAt: string | null;
  isUpcoming: boolean;
};

export type CoachRecord = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  expertise?: string;
  field?: string;
  status?: string;
  bio?: string;
  category?: string;
  rate?: string;
  availability?: string;
  cvUrl?: string;
  linkedinUrl?: string;
  linkedinSummary?: string;
  notes?: string;
  created_at?: string;
};

export type CoachAssignmentRecord = {
  id?: string;
  coach_id?: string;
  client_name?: string;
  program_name?: string;
  service?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
  created_at?: string;
};

export type CoachSessionRecord = {
  id?: string;
  coach_id?: string;
  assignment_id?: string;
  session_date?: string;
  duration_minutes?: number;
  topic?: string;
  rating?: number;
  evaluation?: string;
  notes?: string;
  created_at?: string;
};

export type CoachAvailabilityRecord = {
  id?: string;
  coach_id?: string;
  day_of_week?: string;
  time_window?: string;
  mode?: string;
  status?: string;
  notes?: string;
  created_at?: string;
};

export type CoachDocumentRecord = {
  id?: string;
  coach_id?: string;
  title?: string;
  document_type?: string;
  document_url?: string;
  status?: string;
  expiry_date?: string;
  notes?: string;
  created_at?: string;
};

export type ProjectRecord = {
  id?: string;
  client_name?: string;
  contact_name?: string;
  contact_email?: string;
  service?: string;
  program_name?: string;
  project_type?: string;
  scope?: string;
  budget_note?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  ai_summary?: string;
  automation_mode?: string;
  created_at?: string;
};

export type ProjectAssignmentSmartRecord = {
  id?: string;
  project_id?: string;
  associate_id?: string;
  associate_name?: string;
  associate_email?: string;
  role_title?: string;
  status?: string;
  match_score?: number;
  match_reason?: string;
  invitation_email_id?: string | null;
  invitation_sent_at?: string;
  agreement_status?: string | null;
  created_at?: string;
};

export type SmartActionRecord = {
  id?: string;
  action_type?: string;
  title?: string;
  description?: string;
  target_type?: string;
  target_id?: string;
  priority?: string;
  status?: string;
  mode?: string;
  due_at?: string;
  created_at?: string;
};

export type DashboardData = {
  generatedAt: string;
  summary: {
    totalAssessments: number;
    avgOverall: number;
    strongestDimension: DimensionScore;
    weakestDimension: DimensionScore;
    mostCommonCategory: string;
    totalContacts: number;
    totalInquiries: number;
    totalCoaches: number;
    totalEmployees?: number;
    upcomingMeetings?: number;
  };
  dimensionStats: DimensionScore[];
  categoryBreakdown: { category: string; count: number }[];
  employeeStats: { range: string; count: number; avgOverall: number }[];
  answerDistribution: Array<Record<string, number | string>>;
  topRecommendations: { service: string; count: number }[];
  assessments: AssessmentRecord[];
  contacts: ContactRecord[];
  inquiries: InquiryRecord[];
  coaches: CoachRecord[];
  coachAssignments: CoachAssignmentRecord[];
  coachSessions: CoachSessionRecord[];
  coachAvailability: CoachAvailabilityRecord[];
  coachDocuments: CoachDocumentRecord[];
  projects?: ProjectRecord[];
  projectAssignments?: ProjectAssignmentSmartRecord[];
  smartActions?: SmartActionRecord[];
  calendarBookings?: CalendarBookingRecord[];
};

export type AdminTab = typeof import("./constants").tabs[number];

export type ConfirmAction = {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "navy" | "gold" | "danger";
  details?: string[];
  onConfirm: () => Promise<void> | void;
};
