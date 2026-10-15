export type CaseStatus =
  | 'new'
  | 'open'
  | 'processing'
  | 'in_progress'
  | 'in_review'
  | 'investigation_complete'
  | 'report_generated'
  | 'flagged'
  | 'completed'
  | 'closed';

export type CasePriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';

export type DocumentType =
  | 'fnol'
  | 'police_report'
  | 'damage_photo'
  | 'repair_estimate'
  | 'witness_statement'
  | 'photo'
  | 'medical_record'
  | 'correspondence'
  | 'other'
  | 'unknown';

export type ProcessingStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'unavailable';

export interface FieldWithProvenance<T = string> {
  value: T;
  confidence?: number | null;
  source_document?: string | null;
  source_page?: number | null;
  source_text?: string | null;
  extraction_notes?: string | null;
}

export interface FNOLExtraction {
  policy_number?: FieldWithProvenance<string>;
  claim_number?: FieldWithProvenance<string>;
  incident_date?: FieldWithProvenance<string>;
  incident_time?: FieldWithProvenance<string>;
  incident_location?: FieldWithProvenance<Record<string, unknown>>;
  incident_description?: FieldWithProvenance<string>;
  weather_conditions?: FieldWithProvenance<string>;
  road_conditions?: FieldWithProvenance<string>;
  vehicles?: Record<string, unknown>[] | null;
  parties?: Record<string, unknown>[] | null;
  injuries?: Record<string, unknown>[] | null;
  police_involved?: FieldWithProvenance<boolean>;
  police_report_number?: FieldWithProvenance<string>;
  property_damage?: FieldWithProvenance<string>;
  estimated_damage_amount?: FieldWithProvenance<string>;
  [key: string]: unknown;
}

export interface PoliceReportExtraction {
  report_number?: FieldWithProvenance<string>;
  jurisdiction_agency?: FieldWithProvenance<string>;
  officer_name?: FieldWithProvenance<string>;
  badge_number?: FieldWithProvenance<string>;
  incident_date?: FieldWithProvenance<string>;
  incident_time?: FieldWithProvenance<string>;
  narrative?: FieldWithProvenance<string>;
  fault_assessment?: FieldWithProvenance<string>;
  citations_issued?: string[] | null;
  officer_observations?: string[] | null;
  [key: string]: unknown;
}

export interface RepairEstimateExtraction {
  estimate_number?: FieldWithProvenance<string>;
  facility_name?: FieldWithProvenance<string>;
  estimator_name?: FieldWithProvenance<string>;
  gross_total?: FieldWithProvenance<number>;
  parts_total?: FieldWithProvenance<number>;
  labor_total?: FieldWithProvenance<number>;
  line_items?: Record<string, unknown>[] | null;
  identified_damage_regions?: string[] | null;
  [key: string]: unknown;
}

export interface PhotoDamageAnalysis {
  visible_vehicle_region: string;
  observable_damage: string[];
  affected_components: string[];
  severity_category: 'minor' | 'moderate' | 'severe' | 'catastrophic_total_loss' | string;
  severity_explanation: string;
  supporting_visual_observations: string[];
  image_quality_limitations: string[];
  confidence_score: number;
  uncertainty_notes?: string | null;
}

export interface InconsistencyFinding {
  discrepancy_id: string;
  category: string;
  field_name: string;
  source_a: string;
  value_a: string;
  source_b: string;
  value_b: string;
  explanation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_contradiction: boolean;
  confidence: number;
  investigation_notes?: string | null;
}

export interface AgentExecutionRecord {
  agent_id: string;
  display_name: string;
  status: 'pending' | 'completed' | 'skipped' | 'failed' | 'unavailable';
  started_at?: string | null;
  completed_at?: string | null;
  skip_reason?: string | null;
  error_message?: string | null;
  details?: Record<string, unknown> | null;
}

export interface TriggeredRule {
  rule_id: string;
  rule_name: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  rationale?: string;
  supporting_evidence?: string[];
  recommended_action: string;
}

export interface AssessmentResult {
  outcome: 'ROUTINE_REVIEW' | 'ADDITIONAL_INFORMATION_REQUIRED' | 'ESCALATE_FOR_HUMAN_REVIEW' | string;
  classification: string;
  risk_score: number;
  rationale: string;
  triggered_rules: TriggeredRule[];
  key_findings: string[];
  flagged_reasons: string[];
  recommendations: string[];
  recommended_adjuster_actions: string[];
  uncertainty_and_limitations: string[];
  estimated_loss_range?: string | null;
}

export interface WebVerificationResult {
  verification_id: string;
  verification_question: string;
  source_name: string;
  source_url?: string | null;
  retrieved_information: string;
  retrieval_timestamp: string;
  source_date?: string | null;
  applicability_and_limitations: string;
  status: 'verified' | 'inconclusive' | 'source_unavailable' | 'unverified' | string;
  confidence?: number;
  raw_response?: Record<string, unknown> | null;
}

export interface CaseState {
  case_id: string;
  case_number: string;
  documents: Array<{
    document_id: string;
    filename: string;
    document_type: string;
    file_path: string;
    file_size_bytes: number;
    page_count?: number | null;
    status: string;
    classification_confidence?: number;
  }>;
  extractions: Record<string, Record<string, unknown>>;
  vision_observations: Record<string, PhotoDamageAnalysis>;
  inconsistencies: InconsistencyFinding[];
  normalized_facts: Record<string, unknown>;
  agent_executions: AgentExecutionRecord[];
  missing_documents: string[];
  investigation_limitations: string[];
  web_verifications: WebVerificationResult[];
  assessment?: AssessmentResult | null;
  generated_report?: Record<string, unknown> | null;
  processing_log: Array<{
    timestamp: string;
    stage: string;
    message: string;
    level: string;
  }>;
  current_stage: string;
  stages_completed: string[];
  stages_skipped: string[];
  errors: Array<{
    stage: string;
    error_message: string;
    document_id?: string | null;
    timestamp: string;
  }>;
}

export interface Evidence {
  id: string;
  case_id: string;
  document_id?: string | null;
  evidence_type: string;
  category: string;
  field_name: string;
  field_value?: string | null;
  confidence?: number | null;
  source_document?: string | null;
  source_page?: number | null;
  source_location?: string | null;
  is_conflicting?: boolean;
  conflicting_values?: Record<string, unknown> | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Document {
  id: string;
  case_id: string;
  original_filename: string;
  filename?: string;
  stored_filename?: string;
  file_type?: string;
  file_path?: string;
  file_size?: number;
  file_size_bytes: number;
  mime_type: string;
  file_extension: string;
  document_type: DocumentType;
  processing_status: ProcessingStatus;
  processing_error?: string | null;
  extracted_text?: string | null;
  extraction_metadata?: Record<string, unknown> | null;
  page_count?: number | null;
  uploaded_at: string;
  created_at?: string;
  processed_at?: string | null;
  updated_at?: string;
}

export interface DocumentUploadResult {
  id: string;
  original_filename: string;
  processing_status: ProcessingStatus;
  document_type: DocumentType;
  file_size_bytes: number;
  message?: string;
}

export interface ProcessingResult {
  document_id: string;
  processing_status: ProcessingStatus;
  page_count?: number | null;
  text_length?: number;
  extraction?: Record<string, unknown> | null;
  message?: string;
}

export interface ReportSection {
  id?: string;
  title: string;
  content: string;
  category?: string;
  source_references?: string[];
  findings?: string[];
  confidence?: number;
}

export interface InconsistencyItem {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
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
  report_type?: string;
  status: string;
  outcome?: 'ROUTINE_REVIEW' | 'ADDITIONAL_INFORMATION_REQUIRED' | 'ESCALATE_FOR_HUMAN_REVIEW' | string;
  recommendation?: 'routine' | 'flag_for_review' | 'escalate' | string;
  recommendation_rationale?: string;
  summary?: string | null;
  incident_summary?: string;
  document_analysis?: {
    analyzed_documents?: string[];
    missing_documents?: string[];
    document_types_present?: DocumentType[];
  };
  extracted_facts?: Record<string, unknown>;
  inconsistencies?: InconsistencyItem[];
  web_verifications?: WebVerificationItem[];
  triggered_rules?: TriggeredRule[];
  recommended_actions?: string[];
  limitations?: string[];
  disclaimer?: string;
  sections?: ReportSection[];
  findings?: unknown;
  recommendations?: unknown;
  risk_indicators?: unknown;
  generated_at?: string | null;
  report_data?: unknown;
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
  evidence_count: number;
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
  document_count: number;
  evidence_count: number;
  documents: Document[];
  evidences: Evidence[];
  report?: Report | null;
  created_at: string;
  updated_at?: string;
}

export interface CreateCaseData {
  title: string;
  description?: string;
  claimant_name?: string;
  policy_number?: string;
  incident_date?: string;
  priority?: CasePriority;
}
