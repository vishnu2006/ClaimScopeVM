export type CaseStatus =
  | 'new'
  | 'open'
  | 'in_progress'
  | 'in_review'
  | 'flagged'
  | 'completed'
  | 'closed';

export type CasePriority = 'low' | 'medium' | 'high' | 'urgent';

export type DocumentType =
  | 'fnol'
  | 'police_report'
  | 'damage_photo'
  | 'repair_estimate'
  | 'witness_statement'
  | 'other';

export type ProcessingStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'skipped';

export interface FieldWithProvenance<T = string> {
  value: T;
  confidence: number;
  source_document_id?: string;
  source_document_name?: string;
  page_number?: number;
  bounding_box?: number[];
  extraction_method?: string;
  raw_text?: string;
}

export interface FNOLExtraction {
  policy_number?: FieldWithProvenance<string>;
  claimant_name?: FieldWithProvenance<string>;
  insured_name?: FieldWithProvenance<string>;
  incident_date?: FieldWithProvenance<string>;
  incident_time?: FieldWithProvenance<string>;
  incident_location?: FieldWithProvenance<string>;
  vehicle_make?: FieldWithProvenance<string>;
  vehicle_model?: FieldWithProvenance<string>;
  vehicle_year?: FieldWithProvenance<string | number>;
  vehicle_vin?: FieldWithProvenance<string>;
  damage_description?: FieldWithProvenance<string>;
  damage_severity?: FieldWithProvenance<'minor' | 'moderate' | 'severe'>;
  parties_involved?: FieldWithProvenance<string[] | string>;
  weather_conditions?: FieldWithProvenance<string>;
  additional_notes?: FieldWithProvenance<string>;
  [key: string]: unknown;
}

export interface Evidence {
  id: string;
  case_id: string;
  document_id?: string;
  document_name?: string;
  category:
    | 'incident_details'
    | 'vehicle_info'
    | 'damage_assessment'
    | 'party_statement'
    | 'police_finding'
    | 'inconsistency'
    | 'web_grounding'
    | 'general';
  fact: string;
  confidence: number;
  source: string;
  source_type: 'fnol' | 'photo' | 'police_report' | 'web_search' | 'manual';
  is_inconsistency?: boolean;
  inconsistency_details?: string;
  verified?: boolean;
  created_at?: string;
}

export interface Document {
  id: string;
  case_id: string;
  filename: string;
  original_filename: string;
  file_type: string;
  document_type: DocumentType;
  file_size: number;
  storage_path?: string;
  processing_status: ProcessingStatus;
  processing_error?: string | null;
  extracted_text?: string | null;
  extraction_metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at?: string;
}

export interface DocumentUploadResult {
  id: string;
  case_id: string;
  filename: string;
  document_type: DocumentType;
  file_size: number;
  processing_status: ProcessingStatus;
  message?: string;
}

export interface ProcessingResult {
  document_id: string;
  case_id: string;
  status: ProcessingStatus;
  document_type: DocumentType;
  extracted_data?: Record<string, unknown>;
  extracted_text?: string;
  confidence_score?: number;
  error?: string;
}

export interface ReportSection {
  id?: string;
  title: string;
  content: string;
  category?: string;
  sources?: string[];
  confidence?: number;
  flags?: string[];
}

export interface InconsistencyItem {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  sources: string[];
}

export interface WebVerificationItem {
  query: string;
  finding: string;
  source_url?: string;
  grounded_cost_range?: string;
  confidence?: number;
}

export interface Report {
  id: string;
  case_id: string;
  case_number?: string;
  generated_at: string;
  status: 'preliminary' | 'final' | 'review_required';
  recommendation: 'routine' | 'flag_for_review' | 'escalate';
  recommendation_rationale: string;
  summary: string;
  incident_summary: string;
  document_analysis: {
    analyzed_documents: string[];
    missing_documents: string[];
    document_types_present: DocumentType[];
  };
  extracted_facts: Record<string, unknown>;
  inconsistencies: InconsistencyItem[];
  web_verifications?: WebVerificationItem[];
  limitations: string[];
  sections?: ReportSection[];
  created_at?: string;
}

export interface CaseSummary {
  id: string;
  case_number: string;
  title: string;
  claimant_name?: string | null;
  policy_number?: string | null;
  status: CaseStatus;
  priority: CasePriority;
  document_count: number;
  incident_date?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CaseDetail {
  id: string;
  case_number: string;
  title: string;
  description?: string | null;
  claimant_name?: string | null;
  policy_number?: string | null;
  incident_date?: string | null;
  status: CaseStatus;
  priority: CasePriority;
  created_at: string;
  updated_at?: string;
  documents: Document[];
  evidence?: Evidence[];
  report?: Report | null;
  fnol_data?: FNOLExtraction | null;
  metadata?: Record<string, unknown>;
}

export interface CreateCaseData {
  title: string;
  description?: string;
  claimant_name?: string;
  policy_number?: string;
  incident_date?: string;
  priority?: CasePriority;
}
