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

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'https://claimscopevm-api.onrender.com/api/v1'
    : 'http://localhost:8000/api/v1');

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

// Simple in-memory response cache with TTL for ultra-fast, snappy navigation
const clientCache = new Map<string, { data: unknown; expiry: number }>();

export function invalidateApiCache(prefix?: string) {
  if (!prefix) {
    clientCache.clear();
    return;
  }
  for (const key of clientCache.keys()) {
    if (key.includes(prefix)) {
      clientCache.delete(key);
    }
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async request<T>(path: string, options?: RequestInit, cacheTtlMs: number = 0): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const method = (options?.method || 'GET').toUpperCase();

    // Check cache for GET requests if TTL is requested
    const cacheKey = `${method}:${url}`;
    if (method === 'GET' && cacheTtlMs > 0) {
      const cached = clientCache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        return cached.data as T;
      }
    }

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

      const result = await response.json();
      if (method === 'GET' && cacheTtlMs > 0) {
        clientCache.set(cacheKey, { data: result, expiry: Date.now() + cacheTtlMs });
      }
      return result;
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
    // Cache case summaries for 8 seconds for fast tab switching
    return this.request<CaseSummary[]>(`/cases${query}`, undefined, 8000);
  }

  async getCase(id: string): Promise<CaseDetail> {
    // Cache case detail for 10 seconds for instant tab loads
    return this.request<CaseDetail>(`/cases/${id}`, undefined, 10000);
  }

  async createCase(data: CreateCaseData): Promise<CaseDetail> {
    invalidateApiCache();
    return this.request<CaseDetail>('/cases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCase(id: string, data: Partial<CreateCaseData>): Promise<CaseDetail> {
    invalidateApiCache(id);
    return this.request<CaseDetail>(`/cases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCase(id: string): Promise<void> {
    invalidateApiCache();
    await this.request<void>(`/cases/${id}`, {
      method: 'DELETE',
    });
  }

  // Documents
  async uploadDocuments(caseId: string, files: File[]): Promise<DocumentUploadResult[]> {
    invalidateApiCache(caseId);
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
    return this.request<Document[]>(`/cases/${caseId}/documents`, undefined, 8000);
  }

  async processDocument(caseId: string, docId: string): Promise<ProcessingResult> {
    invalidateApiCache(caseId);
    return this.request<ProcessingResult>(`/cases/${caseId}/documents/${docId}/process`, {
      method: 'POST',
    });
  }

  async deleteDocument(caseId: string, docId: string): Promise<void> {
    invalidateApiCache(caseId);
    await this.request<void>(`/cases/${caseId}/documents/${docId}`, {
      method: 'DELETE',
    });
  }

  getDocumentRawUrl(caseId: string, docId: string): string {
    return `${this.baseUrl}/cases/${caseId}/documents/${docId}/raw`;
  }

  // Evidence
  async getCaseEvidence(caseId: string): Promise<Evidence[]> {
    return this.request<Evidence[]>(`/cases/${caseId}/evidence`, undefined, 8000);
  }

  // Adaptive LangGraph Investigation
  async runInvestigation(caseId: string): Promise<CaseState> {
    invalidateApiCache(caseId);
    return this.request<CaseState>(`/cases/${caseId}/investigate`, {
      method: 'POST',
    });
  }

  async getInvestigation(caseId: string): Promise<CaseState | null> {
    try {
      return await this.request<CaseState>(`/cases/${caseId}/investigation`, undefined, 10000);
    } catch {
      return null;
    }
  }

  // Reports
  async generateReport(caseId: string): Promise<Report> {
    invalidateApiCache(caseId);
    return this.request<Report>(`/cases/${caseId}/reports`, {
      method: 'POST',
    });
  }

  async getReport(caseId: string): Promise<Report> {
    return this.request<Report>(`/cases/${caseId}/reports`, undefined, 10000);
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

  // Health / Connectivity Check
  async checkHealth(): Promise<{ status: string; version?: string; app?: string } | null> {
    try {
      const rootUrl = this.baseUrl.replace(/\/api\/v1$/, '');
      const response = await fetch(`${rootUrl}/health`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch {
      return null;
    }
  }

  async healthCheck(): Promise<{ status: string; version?: string; app?: string } | null> {
    return this.checkHealth();
  }

  // Gemini & System Diagnostics Check
  async checkDiagnostics(): Promise<{
    provider: string;
    configured_model: string;
    api_key_configured: boolean;
    masked_key: string | null;
    connectivity_status: 'connected' | 'unconfigured' | 'error';
    message: string;
  } | null> {
    try {
      return await this.request<{
        provider: string;
        configured_model: string;
        api_key_configured: boolean;
        masked_key: string | null;
        connectivity_status: 'connected' | 'unconfigured' | 'error';
        message: string;
      }>('/diagnostics/gemini');
    } catch {
      return null;
    }
  }
}

export const api = new ApiClient(API_BASE);
