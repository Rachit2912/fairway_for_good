import { describe, it, expect } from 'vitest';

export function checkRlsPermission(
  tableName: string,
  action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
  actorRole: 'anon' | 'member' | 'admin',
  isOwner: boolean,
  recordStatus?: string
): boolean {
  if (tableName === 'scores') {
    if (action === 'SELECT') return actorRole === 'admin' || (actorRole === 'member' && isOwner);
    if (action === 'DELETE') return actorRole === 'admin' || (actorRole === 'member' && isOwner);
    if (action === 'INSERT' || action === 'UPDATE') return false;
  }

  if (tableName === 'winner_submissions') {
    if (action === 'SELECT') return actorRole === 'admin' || (actorRole === 'member' && isOwner);
    if (action === 'INSERT') return actorRole === 'member' && isOwner && recordStatus === 'pending';
    if (action === 'UPDATE') {
      if (actorRole === 'admin') return true;
      return actorRole === 'member' && isOwner && (recordStatus === 'pending' || recordStatus === 'rejected');
    }
  }

  if (tableName === 'draws') {
    if (action === 'SELECT') return recordStatus === 'published' || actorRole === 'admin';
    if (action === 'INSERT' || action === 'UPDATE' || action === 'DELETE') return actorRole === 'admin';
  }

  if (tableName === 'user_roles') {
    if (action === 'INSERT' || action === 'UPDATE') return actorRole === 'admin';
    if (action === 'SELECT') return actorRole === 'admin' || (actorRole === 'member' && isOwner);
  }

  return false;
}

describe('Database Authorization and RLS Rules', () => {
  it('enforces score table direct write restriction for standard members', () => {
    expect(checkRlsPermission('scores', 'INSERT', 'member', true)).toBe(false);
    expect(checkRlsPermission('scores', 'UPDATE', 'member', true)).toBe(false);
    expect(checkRlsPermission('scores', 'SELECT', 'member', true)).toBe(true);
    expect(checkRlsPermission('scores', 'SELECT', 'member', false)).toBe(false);
  });

  it('restricts winner submission proof updates to owner or admin', () => {
    expect(checkRlsPermission('winner_submissions', 'INSERT', 'member', true, 'pending')).toBe(true);
    expect(checkRlsPermission('winner_submissions', 'INSERT', 'member', false, 'pending')).toBe(false);
    expect(checkRlsPermission('winner_submissions', 'UPDATE', 'member', true, 'approved')).toBe(false);
    expect(checkRlsPermission('winner_submissions', 'UPDATE', 'admin', false, 'approved')).toBe(true);
  });

  it('restricts unpublished draw visibility to admins', () => {
    expect(checkRlsPermission('draws', 'SELECT', 'member', false, 'draft')).toBe(false);
    expect(checkRlsPermission('draws', 'SELECT', 'anon', false, 'published')).toBe(true);
    expect(checkRlsPermission('draws', 'SELECT', 'admin', false, 'draft')).toBe(true);
  });

  it('prevents standard members from granting themselves admin roles', () => {
    expect(checkRlsPermission('user_roles', 'INSERT', 'member', true)).toBe(false);
    expect(checkRlsPermission('user_roles', 'UPDATE', 'member', true)).toBe(false);
    expect(checkRlsPermission('user_roles', 'UPDATE', 'admin', true)).toBe(true);
  });
});
