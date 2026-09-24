import type { Account, AccountRole } from './auth-context';
import type { AdminRole } from './admin/types';
import { hasPermission, ROLE_PERMISSIONS } from './admin/permissions';
import { ADMIN_NAV_ITEMS } from '../components/admin/adminNavItems';

export const ROLE_LABELS: Record<AccountRole, string> = {
  customer: 'Customer Dashboard', seller_manager: 'Owner Portal', professional: 'Professional Workspace',
  administrator: 'Administration Portal',
};
export function roleHome(role: AccountRole): string {
  return role === 'administrator' ? '/admin' : role === 'seller_manager' ? '/manager' :
    role === 'professional' ? '/professional' : '/dashboard';
}
export function availableRoles(account: Account | null): AccountRole[] {
  return account?.roles.filter(role => role !== 'seller_manager' || account.isApprovedSeller) || [];
}
export function canAccessAdminPath(role: string | undefined, path: string): boolean {
  if (!role || !Object.prototype.hasOwnProperty.call(ROLE_PERMISSIONS, role)) return false;
  if (path === '/admin') return true;
  if (path === '/admin/users/create') return hasPermission(role as AdminRole, 'users.manage');
  if (path === '/admin/execution' || path.startsWith('/admin/execution/')) return hasPermission(role as AdminRole, 'projects.view_metadata');
  const item = ADMIN_NAV_ITEMS.filter(item => item.href !== '/admin').find(item => path === item.href || path.startsWith(item.href + '/'));
  return !!item && (!item.permission || hasPermission(role as AdminRole, item.permission));
}
export function canAccessPath(account: Account | null, path: string): boolean {
  if (!account) return false;
  const pathname = path.split('?')[0].replace(/\/$/, '') || '/';
  const roles = availableRoles(account);
  const under = (prefix: string) => pathname === prefix || pathname.startsWith(prefix + '/');
  if (under('/admin')) return roles.includes('administrator') && canAccessAdminPath(account.adminRole, pathname);
  if (under('/professional')) return roles.includes('professional');
  if (under('/manager') || under('/post-property')) return roles.includes('seller_manager');
  if (['/dashboard', '/studio', '/execution', '/payments', '/invoices', '/contracts'].some(under)) return roles.includes('customer');
  return true;
}
export function accountDestination(account: Account, requested?: string | null): string {
  const fallback = account.path || roleHome(account.roles[0] || 'customer');
  if (!requested || !requested.startsWith('/') || requested.startsWith('//') || /[\\\x00-\x1f]/.test(requested)) return fallback;
  return canAccessPath(account, requested) ? requested : fallback;
}
