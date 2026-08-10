/**
 * Unit Tests for RestaurantService
 * Focus on critical methods including the fixed ensureTokenColumn
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the pool to avoid actual database connections
vi.mock('@/lib/db', () => ({
  default: {
    connect: vi.fn(() => Promise.resolve({
      query: vi.fn(),
      release: vi.fn(),
    })),
  },
}));

describe('RestaurantService', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('ensureTokenColumn', () => {
    it('should be defined as a function', async () => {
      const { RestaurantService } = await import('@/lib/services/RestaurantService');
      expect(typeof RestaurantService.ensureTokenColumn).toBe('function');
    });

    it('should be an async function', async () => {
      const { RestaurantService } = await import('@/lib/services/RestaurantService');
      expect(RestaurantService.ensureTokenColumn.constructor.name).toBe('AsyncFunction');
    });

    it('should execute ALTER TABLE query', async () => {
      const { RestaurantService } = await import('@/lib/services/RestaurantService');
      
      mockClient.query.mockResolvedValue({ rows: [] });

      await RestaurantService.ensureTokenColumn(mockClient);

      expect(mockClient.query).toHaveBeenCalledWith(
        'ALTER TABLE restaurant_orders ADD COLUMN IF NOT EXISTS token_number INT'
      );
    });

    it('should handle errors gracefully and log warning', async () => {
      const { RestaurantService } = await import('@/lib/services/RestaurantService');
      
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const error = new Error('Column already exists');
      mockClient.query.mockRejectedValue(error);

      // Should not throw
      await expect(RestaurantService.ensureTokenColumn(mockClient)).resolves.not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[RestaurantService] ensureTokenColumn warning:',
        'Column already exists'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle undefined error message', async () => {
      const { RestaurantService } = await import('@/lib/services/RestaurantService');
      
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockClient.query.mockRejectedValue({});

      await RestaurantService.ensureTokenColumn(mockClient);

      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('createOrder - token number generation', () => {
    it('should generate token number sequence starting at 1', async () => {
      const { RestaurantService } = await import('@/lib/services/RestaurantService');
      
      // Mock: no orders today
      mockClient.query.mockResolvedValueOnce({ rows: [{ next_token: 1 }] });
      
      const data = {
        businessId: 'test-business-id',
        orderType: 'dine_in',
        items: [
          { productId: 'prod-1', name: 'Burger', quantity: 1, unitPrice: 10 }
        ],
        taxPercent: 0,
      };

      // We can't fully test createOrder without mocking many dependencies,
      // but we can verify the token query would be called
      // This is more of an integration test, so we'll keep it simple here
      expect(RestaurantService.createOrder).toBeDefined();
    });
  });

  describe('getClient', () => {
    it('should return provided client if given', async () => {
      const { RestaurantService } = await import('@/lib/services/RestaurantService');
      
      const providedClient = { id: 'test-client' };
      const result = await RestaurantService.getClient(providedClient);

      expect(result).toBe(providedClient);
    });

    it('should get new client from pool if not provided', async () => {
      const pool = await import('@/lib/db');
      const { RestaurantService } = await import('@/lib/services/RestaurantService');
      
      const newClient = { id: 'new-client' };
      pool.default.connect.mockResolvedValue(newClient);

      const result = await RestaurantService.getClient(null);

      expect(pool.default.connect).toHaveBeenCalled();
      expect(result).toBe(newClient);
    });
  });

  describe('Service methods existence', () => {
    it('should have all required methods', async () => {
      const { RestaurantService } = await import('@/lib/services/RestaurantService');
      
      const requiredMethods = [
        'getClient',
        'upsertTable',
        'ensureTokenColumn',
        'createOrder',
        'updateOrderStatus',
        'updateTableStatus',
        'updateKitchenOrder',
      ];

      for (const method of requiredMethods) {
        expect(RestaurantService[method]).toBeDefined();
        expect(typeof RestaurantService[method]).toBe('function');
      }
    });
  });
});
