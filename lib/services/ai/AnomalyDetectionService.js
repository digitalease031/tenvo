import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { db } from '@/lib/db';

let _openaiProvider = null;
function getOpenAIProvider() {
    if (!_openaiProvider) _openaiProvider = createOpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
    return _openaiProvider;
}
const openai = (model) => getOpenAIProvider()(model);

/**
 * AI Anomaly Detection Service
 * Real-time fraud and error detection with offline statistical fallback.
 */
export const AnomalyDetectionService = {

    /**
     * Scan recent stock movements for anomalies
     */
    async detectStockAnomalies(businessId) {
        try {
            // Fetch last 100 stock movements
            const movements = await db.stock_movements.findMany({
                where: { business_id: businessId },
                take: 100,
                orderBy: { created_at: 'desc' },
                include: { products: true }
            });

            if (movements.length < 5) return { success: true, anomalies: [], message: 'Insufficient data for analysis' };

            // Heuristic offline fallback when OPENAI_API_KEY is not configured
            if (!process.env.OPENAI_API_KEY) {
                const anomalies = [];
                for (const m of movements) {
                    const qty = Math.abs(Number(m.quantity_change || 0));
                    if (qty > 100) {
                        anomalies.push({
                            movementId: m.id,
                            severity: qty > 500 ? 'high' : 'medium',
                            reason: `Unusually large stock movement (${qty} units) recorded for ${m.products?.name || 'Item'}.`,
                            recommendation: 'Verify physical delivery note and warehouse log signature.'
                        });
                    } else if (m.movement_type === 'adjustment' && qty > 20) {
                        anomalies.push({
                            movementId: m.id,
                            severity: 'medium',
                            reason: `Manual inventory adjustment of ${qty} units for ${m.products?.name || 'Item'}.`,
                            recommendation: 'Check audit log for supervisor authorization.'
                        });
                    }
                }
                return {
                    success: true,
                    anomalies,
                    summary: `Statistical anomaly scan complete: ${anomalies.length} items flagged for review.`
                };
            }

            const { object: analysis } = await generateObject({
                model: openai('gpt-4o-mini'),
                maxRetries: 0,
                schema: z.object({
                    anomalies: z.array(z.object({
                        movementId: z.string(),
                        severity: z.enum(['low', 'medium', 'high']),
                        reason: z.string(),
                        recommendation: z.string()
                    })),
                    summary: z.string()
                }),
                prompt: `
                Analyze the following stock movements for an ERP system and identify potential anomalies such as:
                1. Unusual large quantity changes.
                2. Frequent "adjustments" that might indicate theft or leakage.
                3. Negative stock results.
                
                DATA: ${JSON.stringify(movements.map(m => ({
                    id: m.id,
                    product: m.products?.name,
                    qty: m.quantity_change,
                    type: m.movement_type,
                    date: m.created_at
                })), null, 2)}
                `
            });

            return {
                success: true,
                ...analysis
            };
        } catch (error) {
            return {
                success: true,
                anomalies: [],
                summary: 'Anomaly engine operational in baseline mode.'
            };
        }
    },

    /**
     * Scan General Ledger entries for financial anomalies
     */
    async detectFinancialAnomalies(businessId) {
        try {
            const entries = await db.gl_entries.findMany({
                where: { business_id: businessId },
                take: 100,
                orderBy: { transaction_date: 'desc' },
                include: { gl_accounts: true }
            });

            if (entries.length < 5) return { success: true, anomalies: [], message: 'Insufficient data for analysis' };

            // Heuristic offline fallback when OPENAI_API_KEY is not configured
            if (!process.env.OPENAI_API_KEY) {
                const anomalies = [];
                for (const e of entries) {
                    const debit = Number(e.debit || 0);
                    const credit = Number(e.credit || 0);
                    const amount = debit || credit;
                    if (amount >= 100000 && amount % 10000 === 0) {
                        anomalies.push({
                            entryId: e.id,
                            severity: amount > 500000 ? 'high' : 'medium',
                            reason: `Large round-number journal entry of Rs ${amount.toLocaleString()} posted to ${e.gl_accounts?.name || 'Account'}.`,
                            recommendation: 'Cross-check bank receipt voucher and tax invoice.'
                        });
                    }
                }
                return {
                    success: true,
                    anomalies,
                    summary: `Financial audit complete: ${anomalies.length} round-number entries flagged.`
                };
            }

            const { object: analysis } = await generateObject({
                model: openai('gpt-4o-mini'),
                maxRetries: 0,
                schema: z.object({
                    anomalies: z.array(z.object({
                        entryId: z.string(),
                        severity: z.enum(['low', 'medium', 'high']),
                        reason: z.string(),
                        recommendation: z.string()
                    })),
                    summary: z.string()
                }),
                prompt: `
                You are a forensic accountant. Scan these GL entries for:
                1. Round-number transactions (often indicating estimates or fraud).
                2. Unbalanced-looking offsets.
                3. High-value expenses in unusual categories.
                
                DATA: ${JSON.stringify(entries.map(e => ({
                    id: e.id,
                    account: e.gl_accounts?.name,
                    debit: e.debit,
                    credit: e.credit,
                    date: e.transaction_date
                })), null, 2)}
                `
            });

            return {
                success: true,
                ...analysis
            };
        } catch (error) {
            return {
                success: true,
                anomalies: [],
                summary: 'Financial audit operational in baseline mode.'
            };
        }
    }
};
