/**
 * Minimal Vitest Setup for Reservation UUID Tests
 * Does not import React Testing Library
 */

import { vi } from 'vitest';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock database pool
const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    release: vi.fn(),
};

const mockPool = {
    connect: vi.fn().mockResolvedValue(mockClient),
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    end: vi.fn(),
};

vi.mock('@/lib/db', () => ({
    default: mockPool,
}));
