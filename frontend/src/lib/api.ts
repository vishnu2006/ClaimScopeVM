import {
  CaseDetail,
  CaseSummary,
  CreateCaseData,
  Document,
  DocumentUploadResult,
  Evidence,
  ProcessingResult,
  Report,
} from './types';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const isFormData = options?.body instanceof FormData;
    const headers: Record<string, string> = {};

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (options?.headers) {
      Object.assign(headers, options.headers);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let detail = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        detail = errorData.detail || errorData.message || detail;
      } catch {
        // Fallback to response status text
        if (response.statusText) {
          detail = response.statusText;
        }
      }
      throw new ApiError(response.status, detail);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Cases
  async getCases(): Promise<CaseSummary[]> {
    return this.request<CaseSummary[]>('/cases');
  }

  async getCase(id: string): Promise<CaseDetail> {
    return this.request<CaseDetail>(`/cases/${id}`);
  }

  async createCase(data: CreateCaseData): Promise<CaseDetail> {
    return this.request<CaseDetail>('/cases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCase(id: string, data: Partial<CreateCaseData>): Promise<CaseDetail> {
    return this.request<CaseDetail>(`/cases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCase(id: string): Promise<void> {
    await this.request<void>(`/cases/${id}`, {
      method: 'DELETE',
    });
  }

  // Documents
  async uploadDocuments(caseId: string, files: File[]): Promise<DocumentUploadResult[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    return this.request<DocumentUploadResult[]>(`/cases/${caseId}/documents`, {
      method: 'POST',
      body: formData,
    });
  }

  async getDocuments(caseId: string): Promise<Document[]> {
    return this.request<Document[]>(`/cases/${caseId}/documents`);
  }

  async processDocument(caseId: string, docId: string): Promise<ProcessingResult> {
    return this.request<ProcessingResult>(`/cases/${caseId}/documents/${docId}/process`, {
      method: 'POST',
    });
  }

  async deleteDocument(caseId: string, docId: string): Promise<void> {
    await this.request<void>(`/cases/${caseId}/documents/${docId}`, {
      method: 'DELETE',
    });
  }

  // Evidence
  async getCaseEvidence(caseId: string): Promise<Evidence[]> {
    return this.request<Evidence[]>(`/cases/${caseId}/evidence`);
  }

  // Reports
  async generateReport(caseId: string): Promise<Report> {
    return this.request<Report>(`/cases/${caseId}/report`, {
      method: 'POST',
    });
  }

  async getReport(caseId: string): Promise<Report> {
    return this.request<Report>(`/cases/${caseId}/report`);
  }
}

export const api = new ApiClient(API_BASE);
