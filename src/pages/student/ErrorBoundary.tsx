import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../../components/ui/EmptyState';

export const ErrorBoundary: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="bg-white rounded-2xl p-12 max-w-lg w-full border border-primary/5 shadow-md">
        <EmptyState
          icon="error"
          title="Oops! Something went wrong"
          description="The page you are looking for does not exist, has been moved, or has experienced an unexpected loading error."
          actionLabel="Return to Dashboard"
          onAction={() => navigate('/student/dashboard')}
        />
      </div>
    </div>
  );
};
export default ErrorBoundary;
