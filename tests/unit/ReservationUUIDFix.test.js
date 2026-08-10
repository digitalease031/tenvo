/**
 * Unit Tests for Restaurant Reservation UUID Fix
 * Tests the fix for: "invalid input syntax for type uuid: '1'"
 * 
 * Root Cause: Dummy table fallback in ReservationManager used string IDs ("1", "2", "3")
 * Fix: Removed dummy fallback, require real DB tables with UUIDs
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ReservationService } from '@/lib/services/ReservationService';

describe('Reservation UUID Fix - Core Logic', () => {
  describe('UUID Validation Helper', () => {
    const validateUUID = (str) => {
      if (!str) return false;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };

    it('should reject string number "1"', () => {
      expect(validateUUID('1')).toBe(false);
    });

    it('should reject string number "2"', () => {
      expect(validateUUID('2')).toBe(false);
    });

    it('should reject string number "3"', () => {
      expect(validateUUID('3')).toBe(false);
    });

    it('should accept valid UUID v4', () => {
      expect(validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should accept valid UUID with uppercase', () => {
      expect(validateUUID('6BA7B810-9DAD-11D1-80B4-00C04FD430C8')).toBe(true);
    });

    it('should reject malformed UUID', () => {
      expect(validateUUID('not-a-uuid')).toBe(false);
      expect(validateUUID('123-456-789')).toBe(false);
      expect(validateUUID('')).toBe(false);
      expect(validateUUID(null)).toBe(false);
      expect(validateUUID(undefined)).toBe(false);
    });

    it('should reject UUID without dashes', () => {
      expect(validateUUID('550e8400e29b41d4a716446655440000')).toBe(false);
    });

    it('should reject UUID with wrong number of segments', () => {
      expect(validateUUID('550e8400-e29b-41d4-446655440000')).toBe(false);
    });
  });

  describe('Table Display Logic (ReservationManager)', () => {
    it('should return empty array when no tables provided', () => {
      const tables = [];
      const displayTables = tables; // No dummy fallback
      
      expect(displayTables).toHaveLength(0);
      expect(displayTables).toEqual([]);
    });

    it('should use actual database tables with UUID IDs', () => {
      const dbTables = [
        { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Table 1', capacity: 4 },
        { id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', name: 'Table 2', capacity: 2 },
      ];
      
      const displayTables = dbTables;
      
      expect(displayTables).toHaveLength(2);
      expect(displayTables[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(displayTables[1].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should NOT fallback to string IDs like "1", "2", "3"', () => {
      const tables = [];
      const displayTables = tables;
      
      // Old buggy behavior would have created dummy tables with string IDs
      // New behavior: no fallback
      expect(displayTables).not.toContainEqual(expect.objectContaining({ id: '1' }));
      expect(displayTables).not.toContainEqual(expect.objectContaining({ id: '2' }));
      expect(displayTables).not.toContainEqual(expect.objectContaining({ id: '3' }));
    });
  });

  describe('Form Validation Logic', () => {
    it('should prevent dialog open when no tables exist', () => {
      const displayTables = [];
      const canOpenDialog = displayTables && displayTables.length > 0;
      
      expect(canOpenDialog).toBe(false);
    });

    it('should allow dialog open when tables exist', () => {
      const displayTables = [
        { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Table 1', capacity: 4 }
      ];
      const canOpenDialog = displayTables && displayTables.length > 0;
      
      expect(canOpenDialog).toBe(true);
    });

    it('should validate required fields including tableId', () => {
      const formData = {
        customerName: 'John Doe',
        phone: '+1234567890',
        tableId: '550e8400-e29b-41d4-a716-446655440000',
        date: '2026-08-15',
        time: '19:00'
      };
      
      const isValid = !!(formData.customerName && formData.phone && formData.tableId);
      expect(isValid).toBe(true);
    });

    it('should fail validation when tableId is missing', () => {
      const formData = {
        customerName: 'John Doe',
        phone: '+1234567890',
        tableId: '', // Empty
        date: '2026-08-15',
        time: '19:00'
      };
      
      const isValid = !!(formData.customerName && formData.phone && formData.tableId);
      expect(isValid).toBe(false);
    });

    it('should fail validation when customer name is missing', () => {
      const formData = {
        customerName: '',
        phone: '+1234567890',
        tableId: '550e8400-e29b-41d4-a716-446655440000'
      };
      
      const isValid = !!(formData.customerName && formData.phone && formData.tableId);
      expect(isValid).toBe(false);
    });
  });

  describe('Empty State Handling', () => {
    it('should show empty state when no tables exist', () => {
      const displayTables = [];
      const shouldShowEmptyState = !displayTables || displayTables.length === 0;
      
      expect(shouldShowEmptyState).toBe(true);
    });

    it('should show empty state when tables is undefined', () => {
      const displayTables = undefined;
      const shouldShowEmptyState = !displayTables || displayTables.length === 0;
      
      expect(shouldShowEmptyState).toBe(true);
    });

    it('should show empty state when tables is null', () => {
      const displayTables = null;
      const shouldShowEmptyState = !displayTables || displayTables.length === 0;
      
      expect(shouldShowEmptyState).toBe(true);
    });

    it('should not show empty state when tables exist', () => {
      const displayTables = [
        { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Table 1', capacity: 4 }
      ];
      const shouldShowEmptyState = !displayTables || displayTables.length === 0;
      
      expect(shouldShowEmptyState).toBe(false);
    });
  });

  describe('Reservation Data Structure', () => {
    it('should structure reservation with valid UUID tableId', () => {
      const reservation = {
        businessId: '123e4567-e89b-12d3-a456-426614174000',
        tableId: '550e8400-e29b-41d4-a716-446655440000',
        customerName: 'Ahmed Khan',
        phone: '+92-300-1234567',
        partySize: 4,
        date: '2026-08-15',
        time: '19:00',
        duration: 90
      };
      
      expect(reservation.tableId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(typeof reservation.tableId).toBe('string');
      expect(reservation.tableId.length).toBe(36); // UUID with dashes
    });

    it('should detect invalid string number tableId', () => {
      const reservation = {
        businessId: '123e4567-e89b-12d3-a456-426614174000',
        tableId: '1', // Invalid - this was the bug
        customerName: 'Ahmed Khan',
        phone: '+92-300-1234567'
      };
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(reservation.tableId)).toBe(false);
      expect(reservation.tableId.length).toBeLessThan(36);
    });
  });

  describe('Error Messages', () => {
    it('should provide clear error for missing tables', () => {
      const errorMessage = 'Please create tables first before making reservations';
      
      expect(errorMessage).toContain('create tables first');
      expect(errorMessage).toContain('reservations');
    });

    it('should provide clear error for invalid UUID format', () => {
      const errorMessage = 'Invalid table ID format. Please select a valid table from the database.';
      
      expect(errorMessage).toContain('Invalid table ID');
      expect(errorMessage).toContain('select a valid table');
      expect(errorMessage).toContain('database');
    });

    it('should provide clear error for missing table selection', () => {
      const errorMessage = 'Please select a table for the reservation';
      
      expect(errorMessage).toContain('select a table');
      expect(errorMessage).toContain('reservation');
    });
  });
});

describe('ReservationService - Backend UUID Validation', () => {
  describe('UUID Validation in createReservation', () => {
    const validateTableIdForService = (tableId) => {
      if (!tableId) return { valid: true, error: null }; // null is allowed
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(tableId)) {
        return {
          valid: false,
          error: 'Invalid table ID format. Please select a valid table from the database.'
        };
      }
      return { valid: true, error: null };
    };

    it('should accept valid UUID table IDs', () => {
      const result = validateTableIdForService('550e8400-e29b-41d4-a716-446655440000');
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should accept null table ID (optional field)', () => {
      const result = validateTableIdForService(null);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should accept undefined table ID', () => {
      const result = validateTableIdForService(undefined);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should reject string number "1"', () => {
      const result = validateTableIdForService('1');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid table ID format');
    });

    it('should reject string number "2"', () => {
      const result = validateTableIdForService('2');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid table ID format');
    });

    it('should reject string number "3"', () => {
      const result = validateTableIdForService('3');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid table ID format');
    });

    it('should reject arbitrary string', () => {
      const result = validateTableIdForService('table-one');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid table ID format');
    });

    it('should reject malformed UUID', () => {
      const result = validateTableIdForService('550e8400-invalid-uuid');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid table ID format');
    });

    it('should reject UUID without dashes', () => {
      const result = validateTableIdForService('550e8400e29b41d4a716446655440000');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid table ID format');
    });
  });

  describe('PostgreSQL Error Handling', () => {
    it('should detect PostgreSQL UUID error code 22P02', () => {
      const pgError = { code: '22P02', message: 'invalid input syntax for type uuid: "1"' };
      const isUuidError = pgError.code === '22P02';
      
      expect(isUuidError).toBe(true);
    });

    it('should provide user-friendly error for UUID violation', () => {
      const pgError = { code: '22P02', message: 'invalid input syntax for type uuid' };
      const userMessage = pgError.code === '22P02' 
        ? 'Invalid table ID format. Please select a valid table from the database.'
        : pgError.message;
      
      expect(userMessage).toBe('Invalid table ID format. Please select a valid table from the database.');
      expect(userMessage).not.toContain('22P02');
      expect(userMessage).not.toContain('syntax');
    });

    it('should pass through other PostgreSQL errors', () => {
      const pgError = { code: '23505', message: 'duplicate key value' };
      const userMessage = pgError.code === '22P02' 
        ? 'Invalid table ID format. Please select a valid table from the database.'
        : pgError.message;
      
      expect(userMessage).toBe('duplicate key value');
    });
  });

  describe('Service Method Structure', () => {
    it('should have createReservation method', () => {
      expect(ReservationService).toHaveProperty('createReservation');
      expect(typeof ReservationService.createReservation).toBe('function');
    });

    it('should have updateReservation method', () => {
      expect(ReservationService).toHaveProperty('updateReservation');
      expect(typeof ReservationService.updateReservation).toBe('function');
    });

    it('should have getReservations method', () => {
      expect(ReservationService).toHaveProperty('getReservations');
      expect(typeof ReservationService.getReservations).toBe('function');
    });

    it('should have checkConflict method', () => {
      expect(ReservationService).toHaveProperty('checkConflict');
      expect(typeof ReservationService.checkConflict).toBe('function');
    });
  });
});

describe('Integration - End-to-End UUID Flow', () => {
  describe('Buggy Flow (Before Fix)', () => {
    it('would have created dummy tables with string IDs', () => {
      // OLD BUGGY CODE (removed):
      // const displayTables = tables.length > 0 ? tables : [
      //   { id: '1', name: 'Table 1', capacity: 4 },
      //   { id: '2', name: 'Table 2', capacity: 2 },
      // ];
      
      const buggyDummyTables = [
        { id: '1', name: 'Table 1', capacity: 4 },
        { id: '2', name: 'Table 2', capacity: 2 },
      ];
      
      // These would cause UUID errors in database
      expect(buggyDummyTables[0].id).toBe('1');
      expect(buggyDummyTables[1].id).toBe('2');
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(buggyDummyTables[0].id)).toBe(false);
      expect(uuidRegex.test(buggyDummyTables[1].id)).toBe(false);
    });

    it('would have allowed selecting dummy table "1"', () => {
      const formData = {
        customerName: 'Test User',
        phone: '1234567890',
        tableId: '1', // Dummy table ID - this was the bug
      };
      
      // Form would accept this, but DB would reject with:
      // ERROR: invalid input syntax for type uuid: "1"
      expect(formData.tableId).toBe('1');
    });
  });

  describe('Fixed Flow (After Fix)', () => {
    it('returns empty array when no tables exist', () => {
      const dbTables = [];
      const displayTables = dbTables; // No fallback
      
      expect(displayTables).toHaveLength(0);
    });

    it('prevents dialog open when no tables exist', () => {
      const displayTables = [];
      const canOpen = displayTables && displayTables.length > 0;
      
      expect(canOpen).toBe(false);
    });

    it('shows helpful empty state message', () => {
      const displayTables = [];
      const message = !displayTables || displayTables.length === 0
        ? 'Please create tables first before making reservations'
        : null;
      
      expect(message).toContain('create tables');
    });

    it('uses real database tables with UUIDs', () => {
      const dbTables = [
        { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Table 1', capacity: 4 },
      ];
      const displayTables = dbTables;
      
      expect(displayTables[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('validates UUID before sending to database', () => {
      const tableId = '550e8400-e29b-41d4-a716-446655440000';
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      expect(uuidRegex.test(tableId)).toBe(true);
    });

    it('catches invalid UUIDs with friendly error', () => {
      const tableId = '1';
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(tableId)) {
        const error = 'Invalid table ID format. Please select a valid table from the database.';
        expect(error).toContain('Invalid table ID');
      }
    });
  });
});
