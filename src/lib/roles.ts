/** Role model shared by client and server. Authorization is always re-checked server-side. */

export type AppRole = 'owner' | 'admin' | 'editor' | 'user';

export const PERMANENT_OWNER_EMAIL = 'muhammadzain7000@gmail.com';

export const ROLE_RANK: Record<AppRole, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  user: 1,
};

export type Permission =
  | 'users.view'
  | 'users.create'
  | 'users.delete'
  | 'roles.manage'
  | 'admins.create'
  | 'subscriptions.manage'
  | 'access.review'
  | 'support.manage'
  | 'reviews.manage'
  | 'books.manage'
  | 'settings.manage'
  | 'audit.view'
  | 'owner.manage';

const MATRIX: Record<AppRole, Permission[]> = {
  owner: [
    'users.view', 'users.create', 'users.delete', 'roles.manage', 'admins.create',
    'subscriptions.manage', 'access.review', 'support.manage', 'reviews.manage',
    'books.manage', 'settings.manage', 'audit.view', 'owner.manage',
  ],
  admin: [
    'users.view', 'users.create', 'users.delete', 'roles.manage',
    'subscriptions.manage', 'access.review', 'support.manage', 'reviews.manage',
    'books.manage', 'settings.manage', 'audit.view',
  ],
  editor: ['users.view', 'access.review', 'support.manage', 'reviews.manage', 'books.manage'],
  user: [],
};

export function can(role: AppRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return MATRIX[role]?.includes(permission) ?? false;
}

export function isStaffRole(role: string | null | undefined): boolean {
  return role === 'owner' || role === 'admin' || role === 'editor';
}

export function roleLabel(role: string | null | undefined): string {
  if (role === 'owner') return 'Owner';
  if (role === 'admin') return 'Admin';
  if (role === 'editor') return 'Editor';
  return 'User';
}
