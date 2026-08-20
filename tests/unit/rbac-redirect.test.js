import { describe, it, expect } from 'bun:test';
import { getFirstAllowedTab } from '../../lib/rbac/permissions.js';
import { normalizeModuleAccess, buildPermissionsPayload } from '../../lib/rbac/moduleAccess.js';

describe('Granular RBAC Sub-User Landing & Module Access', () => {
    it('returns dashboard for business owner regardless of module overrides', () => {
        const tab = getFirstAllowedTab({ role: 'owner', moduleAccess: { dashboard: false } });
        expect(tab).toBe('dashboard');
    });

    it('returns dashboard when user has dashboard access', () => {
        const tab = getFirstAllowedTab({
            role: 'cashier',
            moduleAccess: { dashboard: true, pos: true, customers: true }
        });
        expect(tab).toBe('dashboard');
    });

    it('redirects cashier with POS + Customers access without dashboard directly to POS', () => {
        const tab = getFirstAllowedTab({
            role: 'cashier',
            planTier: 'starter',
            moduleAccess: { dashboard: false, pos: true, customers: true }
        });
        expect(tab).toBe('pos');
    });

    it('redirects user with Inventory access only directly to inventory', () => {
        const tab = getFirstAllowedTab({
            role: 'warehouse_manager',
            moduleAccess: { dashboard: false, inventory: true }
        });
        expect(tab).toBe('inventory');
    });

    it('redirects user with Customers access only directly to customers', () => {
        const tab = getFirstAllowedTab({
            role: 'salesperson',
            moduleAccess: { dashboard: false, customers: true }
        });
        expect(tab).toBe('customers');
    });

    it('allows normalizeModuleAccess to retain dashboard: false when requested', () => {
        const normalized = normalizeModuleAccess({ dashboard: false, pos: true, customers: true });
        expect(normalized).toBeDefined();
        expect(normalized.dashboard).toBe(false);
        expect(normalized.pos).toBe(true);
        expect(normalized.customers).toBe(true);
    });

    it('builds permissions payload respecting dashboard: false', () => {
        const payload = buildPermissionsPayload({ dashboard: false, pos: true });
        expect(payload.modules).toBeDefined();
        expect(payload.modules.dashboard).toBe(false);
        expect(payload.modules.pos).toBe(true);
    });
});
