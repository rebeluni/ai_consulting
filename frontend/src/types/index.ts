// ─── Core Project Brief Types ─────────────────────────────────────────────────

export interface ProjectOverview {
  project_name: string;
  project_type: string;
  location: string;
  project_objective: string;
  key_stakeholders: string[];
  timeline: string;
}

export interface Requirement {
  requirement: string;
  category:
    | 'Interior Design'
    | 'Workplace Strategy & Consulting'
    | 'Engineering & Sustainability'
    | 'Project Delivery'
    | 'Business & Operations'
    // fallback — old categories kept for backwards compat with any cached run
    | 'Design'
    | 'Workplace Strategy'
    | 'Engineering'
    | 'Delivery'
    | 'Business / Operations';
  evidence: string;
  confidence: 'High' | 'Medium' | 'Low';
  is_inference?: boolean;
  // Evidence span offsets injected by backend (may be null when no match)
  span_start?: number | null;
  span_end?: number | null;
}

export interface OpenQuestion {
  question: string;
  why_it_matters: string;
}

export interface RiskOrDependency {
  type: 'Risk' | 'Dependency';
  description: string;
  severity: 'High' | 'Medium' | 'Low';
  supporting_evidence: string;
  is_inference?: boolean;
  span_start?: number | null;
  span_end?: number | null;
}

export interface ActionItem {
  action: string;
  suggested_owner: string;
  priority: 'High' | 'Medium' | 'Low';
  evidence: string;
  is_inference?: boolean;
  span_start?: number | null;
  span_end?: number | null;
}

export interface AIOpportunity {
  opportunity: string;
  potential_benefit: string;
  feasibility: 'High' | 'Medium' | 'Low';
  caution: string;
}

export interface ProjectBrief {
  project_overview: ProjectOverview;
  key_requirements: Requirement[];
  open_questions: OpenQuestion[];
  risks_and_dependencies: RiskOrDependency[];
  action_items: ActionItem[];
  ai_opportunities: AIOpportunity[];
}

// ─── Review State Types ───────────────────────────────────────────────────────

export type ReviewStatus = 'unreviewed' | 'confirmed' | 'edited' | 'dismissed';

export interface ReviewState {
  status: ReviewStatus;
  editedContent?: string;
}

export type ReviewMap = Record<string, ReviewState>;

// ─── QA Types ────────────────────────────────────────────────────────────────

export interface QAMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ─── Evidence Highlighting ────────────────────────────────────────────────────

export interface EvidenceSpan {
  start: number;
  end: number;
}

// ─── Reliability Stats ────────────────────────────────────────────────────────

export interface ReliabilityStats {
  total: number;
  evidenceVerified: number;
  inference: number;
  lowConfidence: number;
}
