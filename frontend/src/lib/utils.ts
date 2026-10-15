import { clsx, type ClassValue } from 'clsx';
import { format, parseISO, isValid } from 'date-fns';
import { CasePriority, CaseStatus, DocumentType, ProcessingStatus } from './types';

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    if (!isValid(date)) return dateString;
    return format(date, 'MMM d, yyyy');
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    if (!isValid(date)) return dateString;
    return format(date, 'MMM d, yyyy · h:mm a');
  } catch {
    return dateString;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatStatus(status: CaseStatus | string): string {
  const map: Record<string, string> = {
    new: 'New',
    open: 'Open',
    in_progress: 'In Progress',
    in_review: 'In Review',
    flagged: 'Flagged for Review',
    completed: 'Completed',
    closed: 'Closed',
  };
  return map[status] || status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatPriority(priority: CasePriority | string): string {
  const map: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  };
  return map[priority] || priority;
}

export function formatDocumentType(docType: DocumentType | string): string {
  const map: Record<string, string> = {
    fnol: 'FNOL Form',
    police_report: 'Police Report',
    damage_photo: 'Damage Photo',
    repair_estimate: 'Repair Estimate',
    witness_statement: 'Witness Statement',
    other: 'Other Document',
  };
  return map[docType] || docType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getStatusBadgeVariant(
  status: CaseStatus | ProcessingStatus | string
): 'success' | 'warning' | 'error' | 'info' | 'pending' | 'default' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'flagged':
    case 'warning':
    case 'high':
    case 'urgent':
      return 'warning';
    case 'failed':
    case 'error':
      return 'error';
    case 'in_review':
    case 'in_progress':
    case 'processing':
    case 'open':
      return 'info';
    case 'pending':
    case 'new':
      return 'pending';
    default:
      return 'default';
  }
}

export function getPriorityBadgeVariant(
  priority: CasePriority | string
): 'success' | 'warning' | 'error' | 'info' | 'default' {
  switch (priority) {
    case 'urgent':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'default';
    default:
      return 'default';
  }
}
