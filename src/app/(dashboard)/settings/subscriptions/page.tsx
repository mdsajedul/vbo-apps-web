'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SubscriptionsSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect to the centralized unified billing page
    router.replace('/settings/billing');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center mb-4">
        <CreditCard className="w-6 h-6" />
      </div>
      <h1 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
        Redirecting to Unified Billing...
      </h1>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
        VBO subscription and quota management has been centralized. You are being redirected to the new billing dashboard.
      </p>
      <Button
        onClick={() => router.push('/settings/billing')}
        className="text-xs bg-blue-600 hover:bg-blue-500 text-white gap-1.5"
      >
        <span>Go to Billing Dashboard</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
