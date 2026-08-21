import { describe, it, expect } from 'vitest';
import {
  parseThaanBreakdown,
  calculateThaanStockSummary,
  groupProductsByArticle,
  groupProductsByDesign,
  calculatePartyOutstandingSummary,
  calculateBrokerCommission,
  validatePartyCredit,
  getTextilePaymentTerms,
  calculateDueDateFromTerms,
  formatThaanQuantity,
  exportPartyLedgerToCSV,
  exportStockSummaryToCSV,
  convertThaanToMeters,
  convertMetersToSuits,
  calculateCreditUtilization,
  isCreditLimitExceeded,
  getCreditStatus,
} from '../textileWholesaleHelpers';

describe('Textile Wholesale Helpers', () => {
  describe('parseThaanBreakdown', () => {
    it('parses comma-separated roll string into array and calculates total meters', () => {
      const result = parseThaanBreakdown('30, 12.5, 45.5, 28');
      expect(result.rolls).toEqual([30, 12.5, 45.5, 28]);
      expect(result.rollCount).toBe(4);
      expect(result.totalMeters).toBe(116);
      expect(result.averageLength).toBe(29);
    });

    it('handles numeric array input', () => {
      const result = parseThaanBreakdown([40, 40, 40]);
      expect(result.rolls).toEqual([40, 40, 40]);
      expect(result.totalMeters).toBe(120);
    });

    it('returns empty breakdown for invalid input', () => {
      const result = parseThaanBreakdown(null);
      expect(result.rolls).toEqual([]);
      expect(result.totalMeters).toBe(0);
      expect(result.averageLength).toBe(40);
    });
  });

  describe('calculateThaanStockSummary', () => {
    it('calculates total thaans, meters, and stock value correctly', () => {
      const products = [
        {
          id: 'p1',
          unit: 'thaan',
          stock: 5,
          cost_price: 10000,
          domain_data: { thaanlength: 40, articleno: 'GA-101' },
        },
        {
          id: 'p2',
          unit: 'meter',
          stock: 100,
          cost_price: 250,
          domain_data: { thaanlength: 40, articleno: 'GA-102' },
        },
        {
          id: 'p3',
          unit: 'suit',
          stock: 20,
          cost_price: 3000,
          domain_data: { suitcutting: 2.25, articleno: 'GA-103' },
        },
      ];

      const summary = calculateThaanStockSummary(products);
      expect(summary.totalThaans).toBe(8);
      expect(summary.totalMeters).toBe(345);
      expect(summary.stockValue).toBe(135000);
    });

    it('uses roll breakdown when present in domain_data', () => {
      const products = [
        {
          id: 'p1',
          unit: 'thaan',
          stock: 3,
          cost_price: 5000,
          domain_data: { thaan_breakdown: '30, 35, 45' },
        },
      ];

      const summary = calculateThaanStockSummary(products);
      expect(summary.totalThaans).toBe(3);
      expect(summary.totalMeters).toBe(110);
    });
  });

  describe('groupProductsByArticle & Design', () => {
    const sampleProducts = [
      { id: '1', sku: 'A1', stock: 10, cost_price: 100, sold_qty: 5, domain_data: { articleno: 'GA-100', designno: 'D-1' } },
      { id: '2', sku: 'A2', stock: 5, cost_price: 200, sold_qty: 15, domain_data: { articleno: 'GA-100', designno: 'D-2' } },
      { id: '3', sku: 'A3', stock: 8, cost_price: 150, sold_qty: 2, domain_data: { articleno: 'GA-200', designno: 'D-1' } },
    ];

    it('groups products by Article Number', () => {
      const grouped = groupProductsByArticle(sampleProducts);
      expect(grouped.length).toBe(2);
      expect(grouped[0].articleNo).toBe('GA-100');
      expect(grouped[0].designs.length).toBe(2);
      expect(grouped[0].totalStock).toBe(15);
    });

    it('groups products by Design Number sorted by sales', () => {
      const grouped = groupProductsByDesign(sampleProducts);
      expect(grouped.length).toBe(2);
      expect(grouped[0].designNo).toBe('D-2');
      expect(grouped[0].totalSold).toBe(15);
    });
  });

  describe('Credit Management & Validation', () => {
    it('calculates credit utilization correctly', () => {
      expect(calculateCreditUtilization(450000, 500000)).toBe(90);
      expect(calculateCreditUtilization(0, 500000)).toBe(0);
      expect(calculateCreditUtilization(100, 0)).toBe(0);
    });

    it('validates party credit allowance', () => {
      const customer = { credit_limit: 500000, outstanding_balance: 400000 };
      
      const resAllowed = validatePartyCredit(customer, 50000);
      expect(resAllowed.allowed).toBe(true);
      expect(resAllowed.warning).toBe(true);

      const resExceeded = validatePartyCredit(customer, 150000);
      expect(resExceeded.allowed).toBe(false);
      expect(resExceeded.exceeded).toBe(true);
    });

    it('gets detailed credit status', () => {
      const status = getCreditStatus({ credit_limit: 100000, outstanding_balance: 85000 });
      expect(status.utilization).toBe(85);
      expect(status.status).toBe('warning');
      expect(status.remainingCredit).toBe(15000);
    });
  });

  describe('Conversions & Payments', () => {
    it('calculates broker commission correctly', () => {
      expect(calculateBrokerCommission(100000, 1.5)).toBe(1500);
    });

    it('converts thaans to meters and meters to suits', () => {
      expect(convertThaanToMeters(5, 40)).toBe(200);
      expect(convertMetersToSuits(45, 2.25)).toBe(20);
    });

    it('formats thaan quantities cleanly', () => {
      expect(formatThaanQuantity(2, 'thaan', { thaanlength: 40 })).toBe('2 Thaan (40m ea) = 80m');
      expect(formatThaanQuantity(10, 'suit', { suitcutting: 2.25 })).toBe('10 Suit = 22.5m');
    });

    it('calculates due date from payment terms', () => {
      const baseDate = new Date('2026-08-01');
      const dueDate = calculateDueDateFromTerms('credit_30', baseDate);
      expect(dueDate.getDate()).toBe(31);
    });
  });

  describe('CSV Export Functions', () => {
    it('exports party ledger to CSV with UTF-8 BOM', () => {
      const customers = [
        {
          name: 'Zubair Fabrics',
          phone: '03001234567',
          outstanding_balance: 150000,
          credit_limit: 500000,
          payment_terms: 'credit_30',
          domain_data: { shop_name: 'Zubair Shop', market_location: 'Jama Cloth', buyer_type: 'Retailer' },
        },
      ];

      const csv = exportPartyLedgerToCSV(customers);
      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv).toContain('"Zubair Fabrics"');
      expect(csv).toContain('"Jama Cloth"');
      expect(csv).toContain('"150000.00"');
    });

    it('exports stock summary to CSV with UTF-8 BOM', () => {
      const products = [
        {
          sku: 'SKU-100',
          unit: 'thaan',
          stock: 10,
          cost_price: 4000,
          domain_data: { articleno: 'GA-100', designno: 'D-5', fabrictype: 'Lawn', thaanlength: 40 },
        },
      ];

      const csv = exportStockSummaryToCSV(products);
      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv).toContain('"GA-100"');
      expect(csv).toContain('"Lawn"');
      expect(csv).toContain('"400.00"');
    });
  });
});
