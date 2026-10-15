import {
  CaseDetail,
  CaseState,
  CaseSummary,
  CreateCaseData,
  Document,
  DocumentUploadResult,
  Evidence,
  ProcessingResult,
  Report,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const headers: Record<string, string> = {
      ...(options?.headers as Record<string, string>),
    };

    // Don't set Content-Type for FormData
    if (!(options?.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        let details: unknown = null;

        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
          details = errorData;
        } catch {
          // Response is not JSON
        }

        throw new ApiError(response.status, errorMessage, details);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        0,
        error instanceof Error ? error.message : 'Network error or backend unreachable'
      );
    }
  }

  // Cases
  async getCases(status?: string): Promise<CaseSummary[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.request<CaseSummary[]>(`/cases${query}`);
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

  // Adaptive LangGraph Investigation
  async runInvestigation(caseId: string): Promise<CaseState> {
    return this.request<CaseState>(`/cases/${caseId}/investigate`, {
      method: 'POST',
    });
  }

  async getInvestigation(caseId: string): Promise<CaseState | null> {
    try {
      return await this.request<CaseState>(`/cases/${caseId}/investigation`);
    } catch {
      return null;
    }
  }

  // Reports
  async generateReport(caseId: string): Promise<Report> {
    return this.request<Report>(`/cases/${caseId}/reports`, {
      method: 'POST',
    });
  }

  async getReport(caseId: string): Promise<Report> {
    return this.request<Report>(`/cases/${caseId}/reports`);
  }

  async downloadReportPdf(caseId: string): Promise<Blob> {
    const url = `${this.baseUrl}/cases/${caseId}/report/pdf`;
    const response = await fetch(url);
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Failed to download PDF' }));
      throw new ApiError(response.status, err.detail || 'Failed to download PDF');
    }
    return response.blob();
  }

  // Synthetic Test Case Sandbox
  async loadSyntheticCase(scenarioId: string): Promise<CaseDetail> {
    return this.request<CaseDetail>(`/cases/synthetic/${scenarioId}`, {
      method: 'POST',
    });
  }
}

export const api = new ApiClient(API_BASE);
