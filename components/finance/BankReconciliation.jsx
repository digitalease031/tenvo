import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    GitMerge, Plus, Loader2, CheckCircle2, XCircle, AlertTriangle,
    ArrowRight, RefreshCw, Download, Trash2, Link as LinkIcon, Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ACCOUNT_CODES } from '@/lib/config/accounting';

const BANK_ACCOUNT_CODES = new Set([
    ACCOUNT_CODES.CASH_ON_HAND,
    ACCOUNT_CODES.PETTY_CASH,
    ACCOUNT_CODES.BANK_ACCOUNTS,
]);

function parseCSVStatementLines(csvText, fallbackDate) {
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];
    
    let startIndex = 0;
    const firstLine = lines[0].toLowerCase();
    if (firstLine.includes('date') || firstLine.includes('desc') || firstLine.includes('amount') || firstLine.includes('debit') || firstLine.includes('credit')) {
        startIndex = 1;
    }

    const parsed = [];
    for (let i = startIndex; i < lines.length; i++) {
        const rawCols = lines[i].split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
        if (rawCols.length < 2) continue;

        let dateStr = fallbackDate;
        let descStr = '';
        let debitVal = '';
        let creditVal = '';

        for (const col of rawCols) {
            if (!dateStr || dateStr === fallbackDate) {
                if (/^\d{4}-\d{2}-\d{2}$/.test(col)) {
                    dateStr = col;
                    continue;
                }
                if (/^\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}$/.test(col)) {
                    const parts = col.split(/[\/\.-]/);
                    if (parts.length === 3) {
                        const y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
                        const m = parts[0].padStart(2, '0');
                        const d = parts[1].padStart(2, '0');
                        dateStr = `${y}-${m}-${d}`;
                        continue;
                    }
                }
            }
            const cleanNum = col.replace(/[^0-9.-]/g, '');
            if (cleanNum && !isNaN(cleanNum) && /[0-9]/.test(col)) {
                const num = parseFloat(cleanNum);
                if (num < 0) {
                    debitVal = Math.abs(num).toString();
                } else if (num > 0) {
                    if (!debitVal && !creditVal) {
                        creditVal = num.toString();
                    } else if (debitVal && !creditVal) {
                        creditVal = num.toString();
                    }
                }
                continue;
            }
            if (col.length > 1 && !descStr) {
                descStr = col;
            }
        }

        if (descStr || debitVal || creditVal) {
            parsed.push({
                id: Date.now() + i + Math.random(),
                statement_date: dateStr || fallbackDate,
                description: descStr || 'Statement item',
                debit: debitVal,
                credit: creditVal
            });
        }
    }
    return parsed;
}

/**
 * BankReconciliation
 * Two-panel matching UI: GL transactions ↔ bank statement lines.
 *
 * @param {Object}   props
 * @param {string}   props.businessId
 * @param {string}   props.currency
 * @param {Array}    props.accounts        - GL accounts (bank/cash accounts for filtering)
 */
export function BankReconciliation({ businessId, currency, accounts = [] }) {
    // Sessions list
    const [sessions, setSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [tablesMissing, setTablesMissing] = useState(false);
    const [tablesWarning, setTablesWarning] = useState('');
    const [activeSession, setActiveSession] = useState(null);
    const [sessionDetail, setSessionDetail] = useState(null); // { session, lines, gl_entries }
    const [loadingDetail, setLoadingDetail] = useState(false);

    // New session form
    const [showNewSession, setShowNewSession] = useState(false);
    const [newSession, setNewSession] = useState({
        account_id: '',
        statement_date: new Date().toISOString().split('T')[0],
        statement_closing_balance: '',
    });
    const [creating, setCreating] = useState(false);

    // Statement line import (manual entry)
    const [newLines, setNewLines] = useState([
        { id: Date.now(), statement_date: new Date().toISOString().split('T')[0], description: '', debit: '', credit: '' },
    ]);
    const fileInputRef = useRef(null);

    // Matching state
    const [matchingLineId, setMatchingLineId] = useState(null);
    const [saving, setSaving] = useState(false);

    const handleCsvFileSelected = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result;
                if (typeof text !== 'string') return;

                const parsed = parseCSVStatementLines(text, newSession.statement_date || new Date().toISOString().split('T')[0]);
                if (parsed.length === 0) {
                    toast.error('No valid statement lines found in CSV');
                    return;
                }

                setNewLines(parsed);
                toast.success(`Imported ${parsed.length} statement line(s) from CSV`);
            } catch (err) {
                toast.error(`Error reading CSV file: ${err.message}`);
            }
        };
        reader.readAsText(file);
        // Reset file input so user can re-upload if needed
        e.target.value = '';
    };

    const handleAutoMatch = async () => {
        if (!activeSession || !sessionDetail) return;
        const { lines = [], gl_entries = [] } = sessionDetail;
        const unmatchedLines = lines.filter(l => l && !l.matched);
        const unmatchedGLEntries = gl_entries.filter(
            ge => ge && ge.id && !lines.some(l => l && l.matched && l.gl_entry_id === ge.id)
        );

        if (unmatchedLines.length === 0 || unmatchedGLEntries.length === 0) {
            toast('No unmatched pairs available for auto-match');
            return;
        }

        const autoMatches = [];
        const usedGLIds = new Set();

        for (const line of unmatchedLines) {
            const stmtDebit = Number(line.debit || 0);
            const stmtCredit = Number(line.credit || 0);

            const match = unmatchedGLEntries.find(ge => {
                if (usedGLIds.has(ge.id)) return false;
                const glDebit = Number(ge.debit || 0);
                const glCredit = Number(ge.credit || 0);

                const isExact = (Math.abs(glDebit - stmtDebit) < 0.01 && Math.abs(glCredit - stmtCredit) < 0.01) ||
                                (Math.abs(glDebit - stmtCredit) < 0.01 && Math.abs(glCredit - stmtDebit) < 0.01);
                return isExact;
            });

            if (match) {
                autoMatches.push({ line_id: line.id, gl_entry_id: match.id, matched: true });
                usedGLIds.add(match.id);
            }
        }

        if (autoMatches.length === 0) {
            toast('No exact date & amount matches found');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/v1/finance/bank-reconciliation/${activeSession}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matched_lines: autoMatches }),
            });
            if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
            await openSession(activeSession);
            toast.success(`Auto-matched ${autoMatches.length} statement line(s)`);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Only show bank/cash type accounts (with safe fallback to all asset accounts)
    const bankAccounts = useMemo(() => {
        const matched = accounts.filter((a) => {
            if (a.is_active === false) return false;
            const code = String(a.code || '');
            if (BANK_ACCOUNT_CODES.has(code)) return true;
            const name = String(a.name || '').toLowerCase();
            const subType = String(a.sub_type || '').toLowerCase();
            const type = String(a.type || '').toLowerCase();
            return (
                (subType === 'current_asset' || type === 'asset' || subType.includes('cash') || subType.includes('bank')) &&
                (name.includes('bank') || name.includes('cash') || name.includes('account') || code.startsWith('10') || code.startsWith('11'))
            );
        });
        if (matched.length > 0) return matched;
        return accounts.filter(a => a.is_active !== false && String(a.type || '').toLowerCase() === 'asset');
    }, [accounts]);

    // -- Load sessions ----------------------------------------------------------

    const loadSessions = useCallback(async () => {
        if (!businessId) return;
        setLoadingSessions(true);
        try {
            const res = await fetch(`/api/v1/finance/bank-reconciliation?business_id=${businessId}`);
            const data = await res.json();
            const payload = data.data || data;
            if (data.warning || data.code === 'TABLES_MISSING' || payload.code === 'TABLES_MISSING') {
                setSessions([]);
                setTablesMissing(true);
                setTablesWarning(
                    data.warning || payload.warning ||
                        'Bank reconciliation is not available on this database yet.'
                );
                return;
            }
            setTablesMissing(false);
            setTablesWarning('');
            if (!res.ok) {
                const errMsg = typeof data.error === 'object' ? data.error?.message : data.error;
                throw new Error(errMsg || 'Failed to load sessions');
            }
            const fetchedSessions = payload.sessions || data.sessions || [];
            setSessions(fetchedSessions);
        } catch (err) {
            toast.error(err.message || 'Failed to load sessions');
        } finally {
            setLoadingSessions(false);
        }
    }, [businessId]);

    useEffect(() => { loadSessions(); }, [loadSessions]);

    // -- Load session detail ----------------------------------------------------

    const openSession = useCallback(async (sessionId) => {
        if (!businessId || !sessionId) return;
        setActiveSession(sessionId);
        setLoadingDetail(true);
        try {
            const res = await fetch(`/api/v1/finance/bank-reconciliation/${sessionId}?business_id=${businessId}`);
            const data = await res.json();
            const payload = data.data || data;
            if (!res.ok) {
                const errMsg = typeof data.error === 'object' ? data.error?.message : data.error;
                throw new Error(errMsg || 'Failed to load session');
            }
            setSessionDetail(payload);
        } catch (err) {
            toast.error(err.message || 'Failed to load session details');
        } finally {
            setLoadingDetail(false);
        }
    }, [businessId]);

    // -- Create new session -----------------------------------------------------

    const handleCreateSession = async () => {
        if (!newSession.account_id) { toast.error('Select a bank account'); return; }
        if (!newSession.statement_date) { toast.error('Statement date is required'); return; }

        setCreating(true);
        try {
            const linesPayload = newLines
                .filter(l => l.description.trim() || l.debit || l.credit)
                .map(l => ({
                    statement_date: l.statement_date,
                    description: l.description,
                    debit: parseFloat(l.debit) || 0,
                    credit: parseFloat(l.credit) || 0,
                }));

            const res = await fetch('/api/v1/finance/bank-reconciliation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    business_id: businessId,
                    account_id: newSession.account_id,
                    statement_date: newSession.statement_date,
                    statement_closing_balance: parseFloat(newSession.statement_closing_balance) || 0,
                    lines: linesPayload,
                }),
            });
            const data = await res.json();
            const payload = data.data || data;

            if (data.code === 'TABLES_MISSING' || payload.code === 'TABLES_MISSING') {
                toast.error('Database tables not yet migrated. Apply the migration first.');
                return;
            }
            if (!res.ok) {
                const errMsg = typeof data.error === 'object' ? data.error?.message : data.error;
                throw new Error(errMsg || 'Failed to create session');
            }

            if (payload.isExisting) {
                toast('Opened existing reconciliation session for this date', { icon: 'ℹ️' });
            } else {
                toast.success('Reconciliation session started');
            }
            setShowNewSession(false);
            setNewLines([{ id: Date.now(), statement_date: newSession.statement_date, description: '', debit: '', credit: '' }]);
            await loadSessions();
            const createdSession = payload.session || data.session;
            if (createdSession?.id) {
                openSession(createdSession.id);
            }
        } catch (err) {
            toast.error(err.message || 'Failed to create reconciliation session');
        } finally {
            setCreating(false);
        }
    };

    // -- Match a statement line to a GL entry -----------------------------------

    const handleMatch = async (lineId, glEntryId) => {
        if (!activeSession) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/v1/finance/bank-reconciliation/${activeSession}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matched_lines: [{ line_id: lineId, gl_entry_id: glEntryId, matched: true }],
                }),
            });
            if (!res.ok) {
                const d = await res.json();
                const errMsg = typeof d.error === 'object' ? d.error?.message : d.error;
                throw new Error(errMsg || 'Match failed');
            }
            setMatchingLineId(null);
            await openSession(activeSession);
            toast.success('Line matched');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleUnmatch = async (lineId) => {
        if (!activeSession) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/v1/finance/bank-reconciliation/${activeSession}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matched_lines: [{ line_id: lineId, gl_entry_id: null, matched: false }],
                }),
            });
            if (!res.ok) {
                const d = await res.json();
                const errMsg = typeof d.error === 'object' ? d.error?.message : d.error;
                throw new Error(errMsg || 'Unmatch failed');
            }
            await openSession(activeSession);
            toast.success('Match removed');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    // -- Complete session -------------------------------------------------------

    const handleComplete = async () => {
        if (!activeSession) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/v1/finance/bank-reconciliation/${activeSession}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed' }),
            });
            if (!res.ok) {
                const d = await res.json();
                const errMsg = typeof d.error === 'object' ? d.error?.message : d.error;
                throw new Error(errMsg || 'Completion failed');
            }
            toast.success('Reconciliation completed');
            await loadSessions();
            setActiveSession(null);
            setSessionDetail(null);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    // -- Computed values --------------------------------------------------------

    const stats = sessionDetail ? (() => {
        const lines = sessionDetail.lines || [];
        const matched = lines.filter(l => l && l.matched).length;
        const unmatched = lines.length - matched;
        const stmtTotal = lines.reduce((s, l) => s + (Number(l?.credit || 0) - Number(l?.debit || 0)), 0);
        const closing = Number(sessionDetail.session?.statement_closing_balance || 0);
        const difference = closing - stmtTotal;
        return { matched, unmatched, total: lines.length, stmtTotal, closing, difference };
    })() : null;

    // -- Render session detail --------------------------------------------------

    const renderSessionDetail = () => {
        if (loadingDetail) {
            return (
                <div className="flex items-center justify-center py-16 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading session...
                </div>
            );
        }
        if (!sessionDetail || !sessionDetail.session) return null;

        const { session, lines = [], gl_entries = [] } = sessionDetail;
        const unmatchedGLEntries = gl_entries.filter(
            ge => ge && ge.id && !lines.some(l => l && l.matched && l.gl_entry_id === ge.id)
        );

        const formattedDate = session.statement_date
            ? format(new Date(session.statement_date), 'dd MMM yyyy')
            : '';

        return (
            <div className="space-y-4">
                {/* Session Header */}
                <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900">
                            {session.account_name || 'Bank Account'} {formattedDate ? `· ${formattedDate}` : ''}
                        </h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Account {session.account_code} ·
                            Closing balance: {formatCurrency(Number(session.statement_closing_balance), currency)}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline" size="sm"
                            onClick={() => { setActiveSession(null); setSessionDetail(null); }}
                            className="rounded-xl text-xs h-8"
                        >
                            ← Back
                        </Button>
                        {session.status !== 'completed' && stats?.unmatched > 0 && (
                            <Button
                                variant="outline" size="sm"
                                disabled={saving}
                                onClick={handleAutoMatch}
                                className="rounded-xl text-xs h-8 px-3 border-brand-200 text-brand-primary hover:bg-brand-50"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${saving ? 'animate-spin' : ''}`} />
                                Auto-Match
                            </Button>
                        )}
                        {session.status !== 'completed' && stats?.unmatched === 0 && (
                            <Button
                                size="sm"
                                disabled={saving}
                                onClick={handleComplete}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-8 px-4"
                            >
                                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
                                Mark Complete
                            </Button>
                        )}
                    </div>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {[
                            { label: 'Total Lines', value: stats.total, color: 'text-gray-800' },
                            { label: 'Matched', value: stats.matched, color: 'text-emerald-600' },
                            { label: 'Unmatched', value: stats.unmatched, color: stats.unmatched > 0 ? 'text-amber-600' : 'text-gray-400' },
                            {
                                label: 'Difference',
                                value: formatCurrency(Math.abs(stats.difference), currency),
                                color: Math.abs(stats.difference) < 0.01 ? 'text-emerald-600' : 'text-red-600'
                            },
                        ].map(s => (
                            <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3 text-center">
                                <p className={`text-lg font-semibold ${s.color}`}>{s.value}</p>
                                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Two-Column Matching Panel */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {/* Statement Lines (Left) */}
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                            <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Bank Statement Lines</h5>
                        </div>
                        <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                            {lines.length === 0 && (
                                <p className="text-xs text-gray-400 text-center py-8">No statement lines</p>
                            )}
                            {lines.filter(line => line && line.id).map(line => (
                                <div key={line.id} className={`px-4 py-3 ${line.matched ? 'bg-emerald-50/40' : ''}`}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-gray-800 truncate">{line.description || 'No description'}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                                {format(new Date(line.statement_date), 'dd MMM')}
                                                {Number(line.debit) > 0 && (
                                                    <span className="ml-2 text-red-600 font-bold">DR {formatCurrency(Number(line.debit), currency)}</span>
                                                )}
                                                {Number(line.credit) > 0 && (
                                                    <span className="ml-2 text-emerald-600 font-bold">CR {formatCurrency(Number(line.credit), currency)}</span>
                                                )}
                                            </p>
                                            {line.matched && (
                                                <p className="text-[10px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Matched · {line.journal_number || line.gl_entry_id?.slice(0, 8)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            {line.matched ? (
                                                <Button
                                                    variant="ghost" size="sm"
                                                    onClick={() => handleUnmatch(line.id)}
                                                    disabled={saving}
                                                    className="h-7 px-2 text-[10px] text-gray-400 hover:text-red-600"
                                                >
                                                    <XCircle className="w-3 h-3 mr-1" /> Unmatch
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline" size="sm"
                                                    onClick={() => setMatchingLineId(prev => prev === line.id ? null : line.id)}
                                                    className="h-7 px-2 text-[10px] rounded-lg border-brand-200 text-brand-primary"
                                                >
                                                    <LinkIcon className="w-3 h-3 mr-1" /> Match
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* GL Entry selector (shown when matching) */}
                                    {matchingLineId === line.id && (
                                        <div className="mt-2 bg-brand-50/50 rounded-lg p-2 space-y-1 border border-brand-100">
                                            <p className="text-[10px] font-bold text-brand-primary uppercase">Select matching GL entry:</p>
                                            <div className="max-h-36 overflow-y-auto space-y-1">
                                                {unmatchedGLEntries.length === 0 && (
                                                    <div className="py-2 text-[10px] text-gray-400 flex flex-col gap-1">
                                                        <p>No unmatched GL book entries found for account {session.account_code || session.account_name}.</p>
                                                        <p className="text-gray-500 font-medium">Ensure transactions for this account are posted in Journal Entries on or before {session.statement_date ? format(new Date(session.statement_date), 'dd MMM yyyy') : 'the statement date'}.</p>
                                                    </div>
                                                )}
                                                {unmatchedGLEntries.map(ge => (
                                                    <button
                                                        key={ge.id}
                                                        onClick={() => handleMatch(line.id, ge.id)}
                                                        className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white text-xs"
                                                    >
                                                        <span className="font-mono text-gray-400 text-[10px] w-20 shrink-0">{ge.journal_number || (ge.id ? ge.id.slice(0, 8) : 'N/A')}</span>
                                                        <span className="flex-1 truncate text-gray-700">{ge.description || 'No description'}</span>
                                                        <span className="shrink-0 font-bold text-gray-600">
                                                            {Number(ge.debit) > 0
                                                                ? <span className="text-red-600">DR {formatCurrency(Number(ge.debit), currency)}</span>
                                                                : <span className="text-emerald-600">CR {formatCurrency(Number(ge.credit), currency)}</span>}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* GL Entries (Right) */}
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">GL Book Entries</h5>
                            <span className="text-[10px] text-gray-400">{gl_entries.length} entries</span>
                        </div>
                        <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                            {gl_entries.length === 0 && (
                                <p className="text-xs text-gray-400 text-center py-8">No GL entries for this account</p>
                            )}
                            {gl_entries.filter(ge => ge && ge.id).map(ge => {
                                const isMatched = lines.some(l => l && l.matched && l.gl_entry_id === ge.id);
                                return (
                                    <div key={ge.id} className={`px-4 py-3 ${isMatched ? 'bg-emerald-50/40' : ''}`}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-gray-800 truncate">{ge.description || 'No description'}</p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">
                                                    <span className="font-mono">{ge.journal_number || (ge.id ? ge.id.slice(0, 8) : 'N/A')}</span>
                                                    <span className="ml-2">{format(new Date(ge.transaction_date), 'dd MMM')}</span>
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                {Number(ge.debit) > 0
                                                    ? <p className="text-xs font-bold text-red-600">DR {formatCurrency(Number(ge.debit), currency)}</p>
                                                    : <p className="text-xs font-bold text-emerald-600">CR {formatCurrency(Number(ge.credit), currency)}</p>}
                                                {isMatched && (
                                                    <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-0 px-1.5 mt-0.5">MATCHED</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // -- Render sessions list ---------------------------------------------------

    return (
        <div className="space-y-4">
            {/* Header */}
            {!activeSession && (
                <>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Bank Reconciliation</h3>
                            <p className="text-xs text-gray-400">
                                Match bank statement lines against GL book entries
                            </p>
                        </div>
                        <Button
                            onClick={() => setShowNewSession(prev => !prev)}
                            disabled={tablesMissing}
                            className="bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl font-bold text-xs px-5 shadow-lg shadow-brand-primary/20 disabled:opacity-50"
                        >
                            <Plus className="w-4 h-4 mr-1.5" /> New Reconciliation
                        </Button>
                    </div>

                    {/* New Session Form */}
                    {showNewSession && (
                        <div className="bg-white rounded-2xl border border-brand-100 p-5 space-y-4 shadow-sm">
                            <h4 className="text-sm font-semibold text-gray-900">Start Bank Reconciliation</h4>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-600 mb-1 block">Bank / Cash Account</label>
                                    <select
                                        value={newSession.account_id}
                                        onChange={e => setNewSession(s => ({ ...s, account_id: e.target.value }))}
                                        className="w-full h-9 px-2 text-xs border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-500/20"
                                    >
                                        <option value="">Select account...</option>
                                        {bankAccounts.map(a => (
                                            <option key={a.id} value={a.id}>{a.code} · {a.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-600 mb-1 block">Statement Date</label>
                                    <input
                                        type="date"
                                        value={newSession.statement_date}
                                        onChange={e => setNewSession(s => ({ ...s, statement_date: e.target.value }))}
                                        className="w-full h-9 px-3 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-600 mb-1 block">Bank Closing Balance</label>
                                    <Input
                                        type="number"
                                        value={newSession.statement_closing_balance}
                                        onChange={e => setNewSession(s => ({ ...s, statement_closing_balance: e.target.value }))}
                                        placeholder="0.00"
                                        className="h-9 text-xs rounded-xl"
                                    />
                                </div>
                            </div>

                            {/* Statement Lines */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-gray-600">Statement Lines</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept=".csv,.txt"
                                            onChange={handleCsvFileSelected}
                                            className="hidden"
                                        />
                                        <Button
                                            variant="outline" size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-xs h-7 px-3 border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-lg"
                                        >
                                            <Upload className="w-3 h-3 mr-1" /> Import CSV
                                        </Button>
                                        <Button
                                            variant="ghost" size="sm"
                                            onClick={() => setNewLines(prev => [
                                                ...prev,
                                                { id: Date.now(), statement_date: newSession.statement_date, description: '', debit: '', credit: '' }
                                            ])}
                                            className="text-xs h-7 px-3 text-emerald-600"
                                        >
                                            <Plus className="w-3 h-3 mr-1" /> Add Line
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                    {newLines.map((line, idx) => (
                                        <div key={line.id} className="grid grid-cols-[120px_1fr_100px_100px_32px] gap-1.5 items-center">
                                            <input
                                                type="date"
                                                value={line.statement_date}
                                                onChange={e => setNewLines(ls => ls.map(l => l.id === line.id ? { ...l, statement_date: e.target.value } : l))}
                                                className="h-8 px-2 text-xs border border-gray-200 rounded-lg"
                                            />
                                            <Input
                                                value={line.description}
                                                onChange={e => setNewLines(ls => ls.map(l => l.id === line.id ? { ...l, description: e.target.value } : l))}
                                                placeholder="Description"
                                                className="h-8 text-xs rounded-lg"
                                            />
                                            <Input
                                                type="number"
                                                value={line.debit}
                                                onChange={e => setNewLines(ls => ls.map(l => l.id === line.id ? { ...l, debit: e.target.value, credit: '' } : l))}
                                                placeholder="Debit"
                                                className="h-8 text-xs rounded-lg"
                                            />
                                            <Input
                                                type="number"
                                                value={line.credit}
                                                onChange={e => setNewLines(ls => ls.map(l => l.id === line.id ? { ...l, credit: e.target.value, debit: '' } : l))}
                                                placeholder="Credit"
                                                className="h-8 text-xs rounded-lg"
                                            />
                                            <button
                                                onClick={() => setNewLines(ls => ls.filter(l => l.id !== line.id))}
                                                disabled={newLines.length === 1}
                                                className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-400 disabled:opacity-30"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                <Button variant="outline" size="sm" onClick={() => setShowNewSession(false)} className="rounded-xl text-xs h-9">
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleCreateSession}
                                    disabled={creating}
                                    className="emerald-600 hover:emerald-700 rounded-xl h-9 px-6 bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <GitMerge className="w-4 h-4 mr-1.5" />}
                                    Start Reconciliation
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Sessions List */}
                    {loadingSessions ? (
                        <div className="flex items-center justify-center py-12 text-gray-400">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
                        </div>
                    ) : tablesMissing ? (
                        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 py-16 text-center text-amber-800">
                            <AlertTriangle className="mx-auto mb-3 h-12 w-12 opacity-40" />
                            <p className="text-sm font-bold">Bank reconciliation unavailable</p>
                            <p className="mx-auto mt-1 max-w-md text-xs text-amber-700/90">
                                {tablesWarning ||
                                    'Bank reconciliation is not available on this database yet.'}
                            </p>
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
                            <GitMerge className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-bold">No reconciliations yet</p>
                            <p className="text-xs mt-1">Start a new reconciliation session to match bank statements to GL entries.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
                            {sessions.filter(s => s && s.id).map(s => (
                                <div key={s.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50/60">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-gray-900">{s.account_name}</span>
                                            <Badge className={`text-[10px] px-1.5 py-0.5 border-0 font-semibold ${s.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {s.status?.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {format(new Date(s.statement_date), 'dd MMM yyyy')} ·
                                            {s.matched_count}/{s.line_count} lines matched ·
                                            Closing {formatCurrency(Number(s.statement_closing_balance), currency)}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline" size="sm"
                                        onClick={() => openSession(s.id)}
                                        className="rounded-xl text-xs h-8 shrink-0"
                                    >
                                        {s.status === 'completed' ? 'View' : 'Continue'} <ArrowRight className="w-3 h-3 ml-1.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Session Detail View */}
            {activeSession && renderSessionDetail()}
        </div>
    );
}
