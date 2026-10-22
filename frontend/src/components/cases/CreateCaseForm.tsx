'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Camera,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Info,
} from 'lucide-react';
import { api } from '@/lib/api';
import { CasePriority, CreateCaseData } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { StarBorder } from '@/components/ui/StarBorder';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';

export interface CreateCaseFormProps {
  onSuccess?: (caseId: string) => void;
  onCancel?: () => void;
}

export const CreateCaseForm: React.FC<CreateCaseFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const router = useRouter();

  const [formData, setFormData] = useState<CreateCaseData>({
    title: '',
    description: '',
    claimant_name: '',
    policy_number: '',
    incident_date: '',
    priority: 'medium',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Case title or loss description is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const createdCase = await api.createCase({
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        claimant_name: formData.claimant_name?.trim() || undefined,
        policy_number: formData.policy_number?.trim() || undefined,
        incident_date: formData.incident_date || undefined,
        priority: formData.priority,
      });

      if (onSuccess) {
        onSuccess(createdCase.id);
      } else {
        router.push(`/cases/${createdCase.id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create case. Please try again.';
      setSubmitError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left 7 Columns: Case Intake Form */}
      <div className="lg:col-span-7">
        <Card className="shadow-subtle border-surface-200">
          <CardHeader className="border-b border-surface-100 p-6 pb-4">
            <CardTitle className="text-base font-bold text-surface-900 flex items-center justify-between">
              <span>Investigation File Details</span>
              <span className="text-[11px] font-normal text-surface-500">Step 1 of 2: Registration</span>
            </CardTitle>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 p-6">
              {submitError && (
                <div className="rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-status-error font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="space-y-4">
                <Input
                  label="Claim Summary / Title *"
                  placeholder="e.g. Collision at 5th & Main - Intersection Broadside Impact"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, title: e.target.value }));
                    if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                  }}
                  error={errors.title}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Claimant Name"
                    placeholder="e.g. Robert Vance"
                    value={formData.claimant_name || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, claimant_name: e.target.value }))
                    }
                    helperText="Primary policyholder or reporting party"
                  />

                  <Input
                    label="Policy Number"
                    placeholder="e.g. POL-849201-US"
                    value={formData.policy_number || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, policy_number: e.target.value }))
                    }
                    helperText="Insurance coverage identifier"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Incident Date"
                    type="date"
                    value={formData.incident_date || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, incident_date: e.target.value }))
                    }
                    helperText="Date of vehicle accident"
                  />

                  <Select
                    label="Triage Priority"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        priority: e.target.value as CasePriority,
                      }))
                    }
                    options={[
                      { value: 'low', label: 'Low — Stationary impact, minor scrape' },
                      { value: 'medium', label: 'Medium — Standard two-vehicle collision' },
                      { value: 'high', label: 'High — Significant damage, bodily injury' },
                      { value: 'urgent', label: 'Critical — Suspected fraud / high exposure' },
                    ]}
                  />
                </div>

                <Textarea
                  label="Initial Loss Statement / Adjuster Notes"
                  placeholder="Summarize the reported accident narrative, driver statements, or dispatch notes..."
                  rows={4}
                  value={formData.description || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  helperText="Preliminary notes from intake call or customer portal submission"
                />
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t border-surface-100 p-6 pt-4 bg-surface-50/50 rounded-b-lg">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <StarBorder
                as="button"
                type="submit"
                disabled={loading}
                color="#086afc"
                trailColor="#5eba46"
                duration={3.5}
                thickness={2}
                radius={8}
                glow={0.7}
                hover="lap"
                backgroundColor="#086afc"
                textColor="#ffffff"
                borderColor="rgba(8, 106, 252, 0.4)"
                className="!py-2 !px-4 !text-xs !font-bold text-white shadow-sm transition-transform active:scale-95 cursor-pointer inline-flex items-center disabled:opacity-50 disabled:pointer-events-none"
              >
                <span>{loading ? 'Registering File...' : 'Proceed to Document Intake'}</span>
                {!loading && <ArrowRight className="h-4 w-4 ml-1.5" />}
              </StarBorder>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Right 5 Columns: Intake Standards & Pipeline Preparation */}
      <div className="lg:col-span-5 space-y-4">
        {/* Package Guidelines Card */}
        <div className="rounded-lg border border-surface-200 bg-surface-0 p-5 shadow-subtle space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-surface-900 border-b border-surface-100 pb-2 flex items-center justify-between">
            <span>Incident Package Guidelines</span>
            <span className="font-mono text-[10px] text-brand-600 font-bold">Multi-Document Intake</span>
          </h3>

          <p className="text-xs text-surface-600 leading-relaxed">
            After registering the case file, you will be directed to the <strong>Investigation Workbench</strong> where you can drag and drop your mixed package files:
          </p>

          <div className="space-y-2.5">
            <div className="flex items-start gap-3 p-2.5 rounded-md bg-surface-50 border border-surface-200">
              <FileText className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="block text-surface-900 font-semibold">FNOL &amp; Statements (PDF)</strong>
                <span className="text-surface-500">First Notice of Loss, insured/driver narrative statements, and claim forms.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-md bg-surface-50 border border-surface-200">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="block text-surface-900 font-semibold">Official Police Accident Reports (PDF)</strong>
                <span className="text-surface-500">State DMV accident reports, officer diagrams, roadway conditions, citations.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-md bg-surface-50 border border-surface-200">
              <Layers className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="block text-surface-900 font-semibold">Certified Body Shop Estimates (PDF)</strong>
                <span className="text-surface-500">Itemized Mitchell/CCC/Audatex line items, labor rates, and part classifications.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-md bg-surface-50 border border-surface-200">
              <Camera className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="block text-surface-900 font-semibold">Scene &amp; Damage Photos (JPEG/PNG)</strong>
                <span className="text-surface-500">Physical damage photos analyzed by Gemini Vision against standard severity rubrics.</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-surface-100 text-[11px] text-surface-400 space-y-1">
            <p>• Max single file size: 50MB</p>
            <p>• Missing documents are gracefully skipped without pipeline hallucination.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
