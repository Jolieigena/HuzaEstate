import type { Account, AccountRole } from './auth-context';

export const ROLE_LABELS: Record<AccountRole, string> = {
  customer: 'Customer Dashboard', seller_manager: 'Owner Portal', professional: 'Professional Workspace',
  supplier: 'Supplier Portal',
  organization_admin: 'Organisation Portal',
  administrator: 'Administration Portal',
};
export function roleHome(role: AccountRole): string {
  return role === 'administrator' ? '/admin' : role === 'seller_manager' ? '/manager' :
    role === 'professional' ? '/professional' : role === 'supplier' ? '/supplier' : role === 'organization_admin' ? '/org-admin' : '/dashboard';
}
export function availableRoles(account: Account | null): AccountRole[] {
  return account?.roles.filter(role => role !== 'seller_manager' || account.isApprovedSeller) || [];
}
export function canAccessPath(account: Account | null, path: string): boolean {
  if (!account) return false;
  const pathname = path.split('?')[0].replace(/\/$/, '') || '/';
  const roles = availableRoles(account);
  const under = (prefix: string) => pathname === prefix || pathname.startsWith(prefix + '/');
  if (under('/admin')) return roles.includes('administrator');
  if (under('/professional')) return roles.includes('professional');
  if (under('/supplier')) return roles.includes('supplier');
  if (under('/manager')) return roles.includes('seller_manager');
  if (under('/post-property')) return roles.includes('seller_manager') || roles.includes('administrator');
  if (under('/org-admin')) return roles.includes('organization_admin');
  if (['/dashboard', '/studio', '/execution', '/payments', '/invoices', '/contracts'].some(under)) return roles.includes('customer');
  return true;
}
export function accountDestination(account: Account, requested?: string | null): string {
  const fallback = account.path || roleHome(account.roles[0] || 'customer');
  if (!requested || !requested.startsWith('/') || requested.startsWith('//') || /[\\\x00-\x1f]/.test(requested)) return fallback;
  return canAccessPath(account, requested) ? requested : fallback;
}
