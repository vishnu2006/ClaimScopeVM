import React from 'react';
import { ProcessingStatus as StatusType } from '@/lib/types';
import { StatusIndicator } from '@/components/ui/StatusIndicator';

export interface ProcessingStatusProps {
  status: StatusType;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  errorMessage?: string | null;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  status,
  showLabel = true,
  size = 'sm',
  className,
  errorMessage,
}) => {
  return (
    <StatusIndicator
      status={status}
      showLabel={showLabel}
      size={size}
      className={className}
      errorMessage={errorMessage}
    />
  );
};
