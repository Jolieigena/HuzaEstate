"use client";
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { availableRoles, roleHome, ROLE_LABELS } from '@/lib/navigation';

export default function WorkspaceLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { account, switchRole } = useAuth();
  return <>{availableRoles(account).map(role => <Link key={role} href={roleHome(role)}
    onClick={() => { switchRole(role); onNavigate?.(); }}
    className="block px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
    {ROLE_LABELS[role]}
  </Link>)}</>;
}
