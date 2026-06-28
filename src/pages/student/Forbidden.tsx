import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export const Forbidden: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto text-error">
          <span className="material-symbols-outlined text-[40px]">lock</span>
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-[48px] font-extrabold text-primary leading-tight">403</h1>
          <h2 className="font-headline-md text-primary font-bold">Access Denied</h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            You do not have permission to view this resource. This workspace area is protected by security access credentials.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button onClick={() => navigate('/auth')} variant="primary">
            Sign In with Allowed Role
          </Button>
          <Button onClick={() => navigate('/')} variant="secondary">
            Go to Landing Page
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Forbidden;
