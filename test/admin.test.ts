import { describe, expect, it } from 'vitest';
import { canAccessSection, navItemsForRole } from '../src/admin/rbac';
import { isOtpRole, isSuperadminEmail } from '../src/lib/auth';
import { timingSafeEqualString } from '../src/lib/crypto';

describe('RBAC', () => {
	it('allows manager access to operational screens only', () => {
		expect(canAccessSection('manager', 'events')).toBe(true);
		expect(canAccessSection('manager', 'submissions')).toBe(true);
		expect(canAccessSection('manager', 'page-text')).toBe(false);
		expect(canAccessSection('manager', 'stall')).toBe(false);
		expect(canAccessSection('manager', 'users')).toBe(false);
		expect(canAccessSection('manager', 'settings')).toBe(false);
		expect(canAccessSection('manager', 'analytics')).toBe(false);
	});

	it('allows admin access to page text and stall but not superadmin screens', () => {
		expect(canAccessSection('admin', 'page-text')).toBe(true);
		expect(canAccessSection('admin', 'stall')).toBe(true);
		expect(canAccessSection('admin', 'analytics')).toBe(true);
		expect(canAccessSection('admin', 'users')).toBe(false);
		expect(canAccessSection('admin', 'settings')).toBe(false);
	});

	it('allows superadmin access to all sections', () => {
		expect(canAccessSection('superadmin', 'users')).toBe(true);
		expect(canAccessSection('superadmin', 'settings')).toBe(true);
		expect(navItemsForRole('superadmin')).toHaveLength(9);
		expect(navItemsForRole('manager')).toHaveLength(4);
	});
});

describe('auth roles', () => {
	it('identifies superadmin email', () => {
		expect(isSuperadminEmail('hello@axiso.com.au')).toBe(true);
		expect(isSuperadminEmail('other@example.com')).toBe(false);
	});

	it('limits OTP login to admin and manager', () => {
		expect(isOtpRole('admin')).toBe(true);
		expect(isOtpRole('manager')).toBe(true);
		expect(isOtpRole('superadmin')).toBe(false);
	});

	it('compares secrets in constant time', () => {
		expect(timingSafeEqualString('secret', 'secret')).toBe(true);
		expect(timingSafeEqualString('secret', 'other')).toBe(false);
	});
});
