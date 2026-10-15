'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { CasePriority, CreateCaseData } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

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
      newErrors.title = 'Case title or subject is required.';
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
    <Card className="max-w-2xl mx-auto shadow-elevated">
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5 p-6">
          {submitError && (
            <div className="rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-status-error font-medium">
              {submitError}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Case Title"
              placeholder="e.g. Collision at 5th & Main - Rear-End Impact"
              value={formData.title}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, title: e.target.value }));
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
              }}
              error={errors.title}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Incident Date"
                type="date"
                value={formData.incident_date || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, incident_date: e.target.value }))
                }
              />

              <Select
                label="Case Priority"
                value={formData.priority}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    priority: e.target.value as CasePriority,
                  }))
                }
                options={[
                  { value: 'low', label: 'Low - Minor scrape or stationary impact' },
                  { value: 'medium', label: 'Medium - Multi-part damage, standard claim' },
                  { value: 'high', label: 'High - Significant damage, conflicting info' },
                  { value: 'urgent', label: 'Urgent - Major liability or high severity' },
                ]}
              />
            </div>

            <Textarea
              label="Initial Incident Description"
              placeholder="Summarize the reported accident narrative, weather, or preliminary notes..."
              rows={4}
              value={formData.description || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              helperText="Optional context from intake call or customer portal notes"
            />
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-end gap-3 p-6 pt-3 bg-surface-50/50 rounded-b-lg">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            Create Investigation Case
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
