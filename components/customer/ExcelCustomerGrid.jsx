  'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Trash2,
    Save,
    Clipboard,
    AlertCircle,
    Droplets,
    FileSpreadsheet,
    Loader2,
    Info,
    Hash,
    SlidersHorizontal,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Eye,
    EyeOff,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    Check,
    Columns,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { isWaterHisabRelevant } from '@/lib/storefront/waterShopHisab';
import { checkCustomerDuplicatesAction, batchCreateCustomersAction } from '@/lib/actions/basic/customer';
import { useResolvedBusinessId } from '@/lib/hooks/useResolvedBusinessId';

const DEFAULT_ROW_COUNT = 8;

let _seqCounter = 1;
function generateTempCustomerId(isWater = false) {
    const ts = Date.now().toString(36).slice(-3).toUpperCase();
    const seq = String(_seqCounter++).padStart(3, '0');
    const prefix = isWater ? 'W' : 'C';
    return `${prefix}-${ts}${seq}`;
}

const BTK_AREA_OPTIONS = [
    'Bahria Town Karachi (BTK)', 'BTK Precinct 1 (Villa Precinct)', 'BTK Precinct 2 (Midway Commercial North)',
    'BTK Precinct 3 (Midway Commercial South)', 'BTK Precinct 4', 'BTK Precinct 6', 'BTK Precinct 8 (Ali Block)',
    'BTK Precinct 10A (Bahria Homes)', 'BTK Precinct 10B', 'BTK Precinct 11A (Bahria Homes)',
    'BTK Precinct 11B (Bahria Homes)', 'BTK Precinct 12 (Bahria Farmhouses)', 'BTK Precinct 14',
    'BTK Precinct 15', 'BTK Precinct 15A', 'BTK Precinct 16', 'BTK Precinct 17', 'BTK Precinct 18',
    'BTK Precinct 19 (Bahria Apartments)', 'BTK Precinct 20', 'BTK Precinct 27', 'BTK Precinct 28',
    'BTK Precinct 29', 'BTK Precinct 30', 'BTK Precinct 31', 'BTK Precinct 34 (Sports City)',
    'BTK Precinct 35 (Sports City)', 'BTK Precinct 36 (Sports City)', 'BTK Precinct 37 (Sports City)',
    'BTK Precinct 47 (Paradise)', 'BTK Precinct 48 (Paradise)', 'BTK Bahria Apartments', 'BTK Bahria Heights',
    'BTK Bahria Icon Tower', 'BTK Jinnah Avenue Commercial', 'DHA City Karachi (DCK)',
    'DHA Phase 1', 'DHA Phase 2', 'DHA Phase 5', 'DHA Phase 6', 'DHA Phase 7', 'DHA Phase 8',
    'Clifton', 'Gulshan-e-Iqbal', 'North Nazimabad', 'PECHS', 'Scheme 33', 'Gulistan-e-Johar',
    'Korangi', 'Malir', 'Gadap Town',
];

const ROUTE_RIDER_SUGGESTIONS = [
    'BTK Precinct 1-10', 'BTK Precinct 11-20', 'BTK Precinct 27-31', 'BTK Sports City',
    'BTK Bahria Heights / Apartments', 'BTK Jinnah Avenue', 'BTK Paradise',
    'Bahria Town Karachi Main', 'DHA Phase 6 Route', 'DHA Phase 8 Route',
    'Clifton Route', 'Gulshan Route', 'North Nazimabad Route',
];

const DELIVERY_DAY_OPTIONS = [
    'Daily',
    'Weekdays',           // Mon-Fri
    'Mon-Wed-Fri',
    'Tue-Thu-Sat',
    'Sat-Sun',            // Weekend only
    'Monday only',        // Individual days
    'Tuesday only',
    'Wednesday only',
    'Thursday only',
    'Friday only',
    'Saturday only',
    'Sunday only',
    'Weekly',
    'On Demand',
    'Custom',             // For manual tracking
];

const ACCOUNT_TYPES = ['Home & Flat', 'Domestic', 'Corporate', 'Shop / Retailer', 'Mosque / School', 'Other'];

const DELIVERY_AREA_OPTIONS = [
    'BTK Phase 1', 'BTK Phase 2', 'BTK Commercial', 'DHA Phase 5', 'DHA Phase 6',
    'DHA Phase 8', 'Clifton', 'Gulshan Block 1-7', 'Gulshan Block 10-13', 'North Nazimabad',
    'PECHS', 'Gulistan-e-Johar', 'Scheme 33', 'Korangi', 'Malir',
];

const PREFERRED_PAYMENT_OPTIONS = ['Cash', 'JazzCash', 'Easypaisa', 'Bank Transfer', 'Monthly Credit', 'Weekly Credit'];

const WATER_CITIES = [
    'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan',
    'Hyderabad', 'Quetta', 'Peshawar', 'Sialkot',
];

const ALL_CUSTOMER_COLUMNS = [
    { id: '_tempId', label: 'Cust ID', isWaterOnly: false, width: 'w-[86px]', minPx: 86, align: 'left', icon: Hash },
    { id: 'name', label: 'Customer Name *', isWaterOnly: false, required: true, width: 'w-44', minPx: 176, align: 'left' },
    { id: 'phone', label: 'Phone', isWaterOnly: false, width: 'w-32', minPx: 128, align: 'left' },
    { id: 'email', label: 'Email', isWaterOnly: false, width: 'w-40', minPx: 160, align: 'left' },
    { id: 'accounttype', label: 'Account Type', isWaterOnly: true, width: 'w-28', minPx: 112, align: 'left' },
    { id: 'towncode', label: 'Area / Town Code', isWaterOnly: false, width: 'w-40', minPx: 160, align: 'left' },
    { id: 'deliveryarea', label: 'Delivery Area', isWaterOnly: true, width: 'w-36', minPx: 144, align: 'left' },
    { id: 'deliveryroute', label: 'Route / Rider', isWaterOnly: false, width: 'w-32', minPx: 128, align: 'left' },
    { id: 'houseno', label: 'House / Villa / Office', isWaterOnly: false, width: 'w-36', minPx: 144, align: 'left' },
    { id: 'floorflat', label: 'Floor / Flat', isWaterOnly: true, width: 'w-24', minPx: 96, align: 'left' },
    { id: 'proprietorname', label: 'Proprietor / Contact', isWaterOnly: true, width: 'w-32', minPx: 128, align: 'left' },
    { id: 'city', label: 'City', isWaterOnly: false, width: 'w-20', minPx: 80, align: 'left' },
    { id: 'bottlebalance', label: 'Empties', isWaterOnly: true, width: 'w-18', minPx: 72, align: 'right', isNumber: true },
    { id: 'dailybottles', label: 'Daily Btls', isWaterOnly: true, width: 'w-18', minPx: 72, align: 'right', isNumber: true },
    { id: 'productrate', label: 'Rate (Rs)', isWaterOnly: true, width: 'w-22', minPx: 88, align: 'right', isNumber: true },
    { id: 'emptydeposit', label: 'Deposit', isWaterOnly: true, width: 'w-22', minPx: 88, align: 'right', isNumber: true },
    { id: 'deliverydays', label: 'Del Days', isWaterOnly: true, width: 'w-28', minPx: 112, align: 'left' },
    { id: 'dayoffollow', label: 'Follow Day', isWaterOnly: true, width: 'w-20', minPx: 80, align: 'right', isNumber: true },
    { id: 'deliveryactive', label: 'Active', isWaterOnly: true, width: 'w-20', minPx: 80, align: 'left' },
    { id: 'preferredpayment', label: 'Payment Pref', isWaterOnly: true, width: 'w-28', minPx: 112, align: 'left' },
    { id: 'opening_balance', label: 'Opening AR', isWaterOnly: false, width: 'w-24', minPx: 96, align: 'right', isNumber: true },
    { id: 'notes', label: 'Notes', isWaterOnly: false, width: 'w-36', minPx: 144, align: 'left' },
];

function createEmptyCustomerRow(isWater = false) {
    return {
        _tempId: generateTempCustomerId(isWater),
        name: '',
        phone: '',
        email: '',
        accounttype: isWater ? 'Home & Flat' : '',
        towncode: 'Bahria Town Karachi (BTK)',
        deliveryarea: '',
        deliveryroute: '',
        houseno: '',
        floorflat: '',
        proprietorname: '',
        city: 'Karachi',
        bottlebalance: isWater ? 0 : '',
        dailybottles: isWater ? 1 : '',
        productrate: isWater ? 150 : '',
        emptydeposit: isWater ? 0 : '',
        deliverydays: isWater ? 'Daily' : '',
        dayoffollow: '',
        deliveryactive: isWater ? 'Yes' : '',
        preferredpayment: '',
        opening_balance: 0,
        notes: '',
    };
}

/**
 * ExcelCustomerGrid — full-width inline panel (not a dialog/popup).
 * Rendered directly inside the hub tab; toggle visibility from the parent.
 * Includes column visibility toggle (hide/show), column reordering, and data sorting.
 * 
 * @param {object} [props]
 * @param {boolean} [props.isOpen]
 * @param {() => void} [props.onClose]
 * @param {string} [props.category]
 * @param {string} [props.businessId]
 * @param {object | null} [props.business]
 * @param {(customers: any[]) => void} [props.onSuccess]
 * @param {boolean} [props.asPanel]
 */
export function ExcelCustomerGrid({
    isOpen = true,
    onClose,
    category = 'water-delivery',
    businessId,
    business = null,
    onSuccess,
    asPanel = false,
}) {
    const activeBusinessId = useResolvedBusinessId(businessId || business?.id);
    const isWater = isWaterHisabRelevant(category);

    // Build a stable storage key from the props that ARE synchronously available at mount.
    // businessId prop or business.id prop is the most reliable source — context may hydrate late.
    // We use a ref so the key is frozen after first render and never changes mid-session.
    const _rawBid = businessId || business?.id || '';
    const _domain = isWaterHisabRelevant(category) ? 'water' : 'std';
    const storageKeyPrefixRef = useRef(`tenvo_cust_grid_v2_${_rawBid || 'anon'}_${_domain}`);
    const storageKeyPrefix = storageKeyPrefixRef.current;

    // Available columns for current domain
    const availableColumns = useMemo(() => {
        return ALL_CUSTOMER_COLUMNS.filter(c => !c.isWaterOnly || isWater);
    }, [isWater]);

    // Initial column order — read once from localStorage, validated against availableColumns
    const [columnOrder, setColumnOrder] = useState(() => {
        try {
            const saved = localStorage.getItem(`${storageKeyPrefix}_order`);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length) {
                    // Keep only IDs that still exist in availableColumns; append any new ones at end
                    const validIds = new Set(ALL_CUSTOMER_COLUMNS.map(c => c.id));
                    const reordered = parsed.filter(id => validIds.has(id));
                    const missing = ALL_CUSTOMER_COLUMNS
                        .filter(c => !reordered.includes(c.id))
                        .map(c => c.id);
                    return [...reordered, ...missing];
                }
            }
        } catch {}
        return ALL_CUSTOMER_COLUMNS.map(c => c.id);
    });

    const [hiddenColumns, setHiddenColumns] = useState(() => {
        try {
            const saved = localStorage.getItem(`${storageKeyPrefix}_hidden`);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return new Set(parsed);
            }
        } catch {}
        return new Set();
    });

    // Persist column order whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem(`${storageKeyPrefix}_order`, JSON.stringify(columnOrder));
        } catch {}
    }, [columnOrder, storageKeyPrefix]);

    // Persist hidden columns whenever they change — always write, even empty set
    useEffect(() => {
        try {
            localStorage.setItem(`${storageKeyPrefix}_hidden`, JSON.stringify(Array.from(hiddenColumns)));
        } catch {}
    }, [hiddenColumns, storageKeyPrefix]);

    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [showColumnPicker, setShowColumnPicker] = useState(false);
    const [colFilter, setColFilter] = useState('');

    const [rows, setRows] = useState(() =>
        Array.from({ length: DEFAULT_ROW_COUNT }, () => createEmptyCustomerRow(isWater))
    );
    const [isSaving, setIsSaving] = useState(false);
    const [duplicateMap, setDuplicateMap] = useState(new Map());
    const [dbDuplicates, setDbDuplicates] = useState([]);
    const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
    const debounceTimerRef = useRef(null);

    // Reset on open (legacy dialog) or on category change
    useEffect(() => {
        _seqCounter = 1;
        setRows(Array.from({ length: DEFAULT_ROW_COUNT }, () => createEmptyCustomerRow(isWater)));
        setDuplicateMap(new Map());
        setDbDuplicates([]);
    }, [isWater, isOpen]);

    const performDuplicateChecks = useCallback((currentRows) => {
        const intraDupes = new Map();
        const phoneIndex = new Map();
        currentRows.forEach((r, idx) => {
            const raw = String(r.phone || '').replace(/\D/g, '');
            if (raw.length >= 7) {
                const key = raw.slice(-10);
                if (phoneIndex.has(key)) {
                    const prev = phoneIndex.get(key);
                    intraDupes.set(idx, `Dup phone with row ${prev + 1}`);
                    intraDupes.set(prev, `Dup phone with row ${idx + 1}`);
                } else {
                    phoneIndex.set(key, idx);
                }
            }
        });
        setDuplicateMap(intraDupes);

        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(async () => {
            const candidates = currentRows
                .map((r, i) => ({ ...r, _origIndex: i }))
                .filter(r => (r.name && r.name.trim()) || (r.phone && r.phone.trim()));
            if (!candidates.length || !activeBusinessId) { setDbDuplicates([]); return; }
            setIsCheckingDuplicates(true);
            try {
                const res = await checkCustomerDuplicatesAction(activeBusinessId, candidates);
                setDbDuplicates(res.success && Array.isArray(res.duplicates) ? res.duplicates : []);
            } catch { setDbDuplicates([]); }
            finally { setIsCheckingDuplicates(false); }
        }, 500);
    }, [activeBusinessId]);

    const handleCellChange = (index, field, value) => {
        setRows(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            // Smart auto-fill: area -> route
            if (field === 'towncode' && !next[index].deliveryroute) {
                const lo = String(value).toLowerCase();
                if (lo.includes('btk') || lo.includes('bahria')) next[index].deliveryroute = 'Bahria Town Route';
                else if (lo.includes('dha')) next[index].deliveryroute = 'DHA Route';
                else if (lo.includes('clifton')) next[index].deliveryroute = 'Clifton Route';
                else if (lo.includes('gulshan')) next[index].deliveryroute = 'Gulshan Route';
            }
            performDuplicateChecks(next);
            return next;
        });
    };

    const handleAddRows = (count = 5) => {
        setRows(prev => [...prev, ...Array.from({ length: count }, () => createEmptyCustomerRow(isWater))]);
    };

    const handleRemoveRow = (index) => {
        setRows(prev => {
            if (prev.length <= 1) return [createEmptyCustomerRow(isWater)];
            const next = prev.filter((_, i) => i !== index);
            performDuplicateChecks(next);
            return next;
        });
    };

    const handleClearEmpty = () => {
        setRows(prev => {
            const kept = prev.filter(r => (r.name && r.name.trim()) || (r.phone && r.phone.trim()));
            return kept.length > 0 ? kept : [createEmptyCustomerRow(isWater)];
        });
    };

    const handlePasteFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (!text?.trim()) { toast.error('Clipboard is empty'); return; }
            const lines = text.trim().split(/\r?\n/);
            const parsed = lines.map(line => {
                const p = line.split('\t');
                return {
                    _tempId: generateTempCustomerId(isWater),
                    name: p[0]?.trim() || '',
                    phone: p[1]?.trim() || '',
                    accounttype: p[2]?.trim() || (isWater ? 'Home & Flat' : ''),
                    towncode: p[3]?.trim() || 'Bahria Town Karachi (BTK)',
                    deliveryroute: p[4]?.trim() || '',
                    houseno: p[5]?.trim() || '',
                    floorflat: p[6]?.trim() || '',
                    city: p[7]?.trim() || 'Karachi',
                    bottlebalance: isWater ? (Number(p[8]) || 0) : '',
                    dailybottles: isWater ? (Number(p[9]) || 1) : '',
                    productrate: isWater ? (Number(p[10]) || 150) : '',
                    emptydeposit: isWater ? (Number(p[11]) || 0) : '',
                    deliverydays: p[12]?.trim() || (isWater ? 'Daily' : ''),
                    opening_balance: Number(p[13]) || 0,
                    email: p[14]?.trim() || '',
                    notes: p[15]?.trim() || '',
                    proprietorname: '',
                    deliveryarea: '',
                    dayoffollow: '',
                    deliveryactive: isWater ? 'Yes' : '',
                    preferredpayment: '',
                };
            });
            setRows(parsed);
            performDuplicateChecks(parsed);
            toast.success(`Pasted ${parsed.length} rows from clipboard`);
        } catch {
            toast.error('Could not read clipboard. Paste directly into the table.');
        }
    };

    const handleSaveAll = async () => {
        const validRows = rows.filter(r => r.name && r.name.trim());
        if (!validRows.length) { toast.error('Enter at least one customer name'); return; }

        if (duplicateMap.size > 0) {
            toast('⚠️ Some rows have duplicate phone numbers — they will be skipped on save.',
                { icon: '⚠️', duration: 4000 });
        }

        setIsSaving(true);
        try {
            const res = await batchCreateCustomersAction(activeBusinessId, validRows, { skipDuplicates: true });
            if (res.success) {
                const skipped = res.errorCount || 0;
                if (res.createdCount > 0) {
                    toast.success(`Added ${res.createdCount} customer${res.createdCount !== 1 ? 's' : ''}${skipped > 0 ? ` (${skipped} skipped)` : ''}!`);
                } else if (skipped > 0) {
                    toast.error(`All ${skipped} row${skipped !== 1 ? 's' : ''} failed to save. Check for duplicates or missing names.`);
                }
                if (Array.isArray(res.errors) && res.errors.length > 0) {
                    const preview = res.errors.slice(0, 3).map(e => `Row ${(e.index ?? 0) + 1}: ${e.error}`).join('\n');
                    if (res.errors.length > 3) {
                        toast.error(`${preview}\n…and ${res.errors.length - 3} more error${res.errors.length - 3 !== 1 ? 's' : ''}`, { duration: 6000 });
                    } else if (res.errors.length > 0 && res.createdCount > 0) {
                        toast.error(preview, { duration: 5000 });
                    }
                }
                if (res.createdCount > 0) {
                    onSuccess?.(res.customers);
                    onClose?.();
                }
            } else {
                toast.error(res.error || 'Failed to save customers');
            }
        } catch (err) {
            toast.error(err.message || 'Error saving customers');
        } finally {
            setIsSaving(false);
        }
    };

    // Column visibility toggle
    const toggleColumnVisibility = (colId) => {
        const colDef = availableColumns.find(c => c.id === colId);
        if (colDef?.required) {
            toast.error('Customer Name is a required column');
            return;
        }
        setHiddenColumns(prev => {
            const next = new Set(prev);
            if (next.has(colId)) next.delete(colId);
            else next.add(colId);
            return next;
        });
    };

    // Column reordering (move left / right)
    const moveColumn = (colId, direction) => {
        setColumnOrder(prev => {
            const index = prev.indexOf(colId);
            if (index < 0) return prev;
            const targetIndex = direction === 'left' ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= prev.length) return prev;
            const next = [...prev];
            const temp = next[index];
            next[index] = next[targetIndex];
            next[targetIndex] = temp;
            return next;
        });
    };

    // Reset columns to default
    const resetColumnsToDefault = () => {
        const defaultOrder = ALL_CUSTOMER_COLUMNS.map(c => c.id);
        const defaultHidden = new Set();
        setColumnOrder(defaultOrder);
        setHiddenColumns(defaultHidden);
        try {
            localStorage.setItem(`${storageKeyPrefix}_order`, JSON.stringify(defaultOrder));
            localStorage.setItem(`${storageKeyPrefix}_hidden`, JSON.stringify([]));
        } catch {}
        toast.success('Columns reset to default layout');
    };

    // Active ordered visible columns — uses columnOrder against ALL_CUSTOMER_COLUMNS
    // so non-water columns are naturally excluded via availableColumns filter
    const visibleOrderedColumns = useMemo(() => {
        const map = new Map(availableColumns.map(c => [c.id, c]));
        const ordered = columnOrder
            .filter(id => map.has(id))
            .map(id => map.get(id));
        // Append any availableColumns not yet in columnOrder (newly added columns)
        const inOrder = new Set(columnOrder);
        for (const col of availableColumns) {
            if (!inOrder.has(col.id)) ordered.push(col);
        }
        return ordered.filter(col => !hiddenColumns.has(col.id));
    }, [availableColumns, columnOrder, hiddenColumns]);

    // Header Sort toggle
    const handleSortHeader = (colId) => {
        setSortConfig(prev => {
            if (prev.key === colId) {
                if (prev.direction === 'asc') return { key: colId, direction: 'desc' };
                return { key: null, direction: 'asc' };
            }
            return { key: colId, direction: 'asc' };
        });
    };

    // Sorted rows computation
    const sortedRows = useMemo(() => {
        if (!sortConfig.key) return rows;
        const colDef = availableColumns.find(c => c.id === sortConfig.key);
        const key = sortConfig.key;
        const dir = sortConfig.direction === 'asc' ? 1 : -1;

        return [...rows].sort((a, b) => {
            let valA = a[key];
            let valB = b[key];

            if (colDef?.isNumber) {
                const numA = Number(valA) || 0;
                const numB = Number(valB) || 0;
                return (numA - numB) * dir;
            }

            const strA = String(valA || '').toLowerCase();
            const strB = String(valB || '').toLowerCase();
            return strA.localeCompare(strB, undefined, { numeric: true }) * dir;
        });
    }, [rows, sortConfig, availableColumns]);

    const filledCount = useMemo(() => rows.filter(r => r.name && r.name.trim()).length, [rows]);

    const isVisible = asPanel || isOpen !== false;
    if (!isVisible) return null;

    const cellCls = 'h-8 border-transparent bg-transparent hover:border-gray-200 focus:bg-white focus:border-emerald-500 rounded-lg text-xs px-1.5';
    const selectCls = `${cellCls} w-full focus:outline-none`;

    // Dynamic grid min-width calculation
    const gridMinWidth = visibleOrderedColumns.reduce((sum, col) => sum + (col.minPx || 120), 50);

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm relative">
            {/* Datalists */}
            <datalist id="ecg-area-list">{BTK_AREA_OPTIONS.map(a => <option key={a} value={a} />)}</datalist>
            <datalist id="ecg-route-list">{ROUTE_RIDER_SUGGESTIONS.map(r => <option key={r} value={r} />)}</datalist>
            <datalist id="ecg-area2-list">{DELIVERY_AREA_OPTIONS.map(a => <option key={a} value={a} />)}</datalist>

            {/* Panel Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-900/20 bg-emerald-950 px-5 py-3 text-white">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                        {isWater ? <Droplets className="h-5 w-5" /> : <FileSpreadsheet className="h-5 w-5" />}
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2 leading-tight">
                            Excel Quick Customer Entry
                            {isWater && (
                                <Badge className="bg-emerald-800 border-none text-emerald-200 text-[10px]">
                                    Water Delivery Mode
                                </Badge>
                            )}
                        </h3>
                        <p className="text-xs text-emerald-200/70 mt-0.5">
                            Fast grid entry with auto Customer ID, area detection, and duplicate prevention.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handlePasteFromClipboard}
                        className="h-8 gap-1.5 text-xs text-emerald-200 hover:bg-emerald-900 hover:text-white"
                    >
                        <Clipboard className="h-3.5 w-3.5" />
                        Paste Excel
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/80 px-5 py-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="bg-white text-gray-700 border-gray-200 font-semibold">
                        Rows: {rows.length}
                    </Badge>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
                        Filled: {filledCount}
                    </Badge>
                    <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 font-semibold">
                        Columns: {visibleOrderedColumns.length} / {availableColumns.length}
                    </Badge>

                    {duplicateMap.size > 0 && (
                        <Badge className="gap-1 bg-amber-100 text-amber-800 border-amber-300">
                            <AlertCircle className="h-3 w-3" />{duplicateMap.size} Duplicate Phones (will skip)
                        </Badge>
                    )}
                    {dbDuplicates.length > 0 && (
                        <Badge className="gap-1 bg-rose-100 text-rose-800 border-rose-300">
                            <AlertCircle className="h-3 w-3" />{dbDuplicates.length} DB Duplicates
                        </Badge>
                    )}
                    {isCheckingDuplicates && (
                        <span className="flex items-center gap-1 text-gray-500">
                            <Loader2 className="h-3 w-3 animate-spin text-emerald-600" />Checking...
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Column Customizer Button */}
                    <Button
                        type="button"
                        variant={showColumnPicker ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => setShowColumnPicker(!showColumnPicker)}
                        className="h-7 gap-1.5 rounded-lg text-xs font-semibold border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                    >
                        <Columns className="h-3.5 w-3.5 text-emerald-700" />
                        Customize Columns ({visibleOrderedColumns.length})
                    </Button>

                    <Button type="button" variant="outline" size="sm"
                        onClick={() => handleAddRows(5)}
                        className="h-7 gap-1 rounded-lg text-xs">
                        <Plus className="h-3 w-3" />+5 Rows
                    </Button>
                    <Button type="button" variant="outline" size="sm"
                        onClick={() => handleAddRows(10)}
                        className="h-7 gap-1 rounded-lg text-xs">
                        +10 Rows
                    </Button>
                    <Button type="button" variant="outline" size="sm"
                        onClick={handleClearEmpty}
                        className="h-7 gap-1 rounded-lg text-xs text-gray-600">
                        Clear Empty
                    </Button>
                </div>
            </div>

            {/* Column Customization Panel (Drawer Overlay) */}
            {showColumnPicker && (
                <div className="absolute right-4 top-24 z-30 w-96 rounded-xl border border-gray-200 bg-white p-4 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal className="h-4 w-4 text-emerald-700" />
                            <h4 className="font-bold text-gray-900 text-sm">Customize & Reorder Columns</h4>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowColumnPicker(false)}
                            className="h-6 w-6 p-0 rounded-full text-gray-400 hover:text-gray-700"
                        >
                            ✕
                        </Button>
                    </div>

                    <p className="text-[11px] text-gray-500 mb-3">
                        Toggle checkboxes to hide/show columns. Use left/right arrows to change column sequence in the table.
                    </p>

                    <div className="mb-2">
                        <Input
                            value={colFilter}
                            onChange={e => setColFilter(e.target.value)}
                            placeholder="Filter column name..."
                            className="h-7 text-xs"
                        />
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-50 pr-1 text-xs">
                        {columnOrder
                            .map(colId => availableColumns.find(c => c.id === colId))
                            .filter(Boolean)
                            .filter(col => !colFilter || col.label.toLowerCase().includes(colFilter.toLowerCase()))
                            .map((col, idx) => {
                                const isVisibleCol = !hiddenColumns.has(col.id);
                                return (
                                    <div key={col.id} className="flex items-center justify-between py-1.5 px-1 hover:bg-gray-50 rounded">
                                        <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-800">
                                            <input
                                                type="checkbox"
                                                checked={isVisibleCol}
                                                disabled={col.required}
                                                onChange={() => toggleColumnVisibility(col.id)}
                                                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                                            />
                                            <span className={col.required ? 'font-bold text-emerald-900' : ''}>
                                                {col.label}
                                            </span>
                                        </label>

                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                disabled={idx === 0}
                                                onClick={() => moveColumn(col.id, 'left')}
                                                className="p-1 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent"
                                                title="Move left"
                                            >
                                                <ChevronLeft className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={idx === availableColumns.length - 1}
                                                onClick={() => moveColumn(col.id, 'right')}
                                                className="p-1 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent"
                                                title="Move right"
                                            >
                                                <ChevronRight className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-3">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={resetColumnsToDefault}
                            className="h-7 text-xs text-gray-600 gap-1"
                        >
                            <RotateCcw className="h-3 w-3" /> Reset Default
                        </Button>

                        <Button
                            type="button"
                            size="sm"
                            onClick={() => setShowColumnPicker(false)}
                            className="h-7 text-xs bg-emerald-600 text-white font-bold hover:bg-emerald-700 rounded-lg px-3"
                        >
                            Apply Layout
                        </Button>
                    </div>
                </div>
            )}

            {/* Scrollable Grid */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-xs border-collapse" style={{ minWidth: Math.max(gridMinWidth, 900) }}>
                    <thead className="sticky top-0 z-10 select-none bg-emerald-950 text-white font-semibold">
                        <tr>
                            <th className="w-9 px-2 py-2.5 text-center border-r border-emerald-900">#</th>

                            {visibleOrderedColumns.map(col => {
                                const isSorted = sortConfig.key === col.id;
                                const alignCls = col.align === 'right' ? 'text-right' : 'text-left';

                                return (
                                    <th
                                        key={col.id}
                                        onClick={() => handleSortHeader(col.id)}
                                        className={`${col.width} px-2 py-2.5 border-r border-emerald-900 cursor-pointer hover:bg-emerald-900/60 transition-colors ${alignCls} ${isSorted ? 'bg-emerald-900 text-emerald-200' : ''}`}
                                        title={`Click to sort by ${col.label}`}
                                    >
                                        <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                                            {col.icon && <col.icon className="h-3 w-3 text-emerald-400" />}
                                            <span>{col.label}</span>
                                            {isSorted ? (
                                                sortConfig.direction === 'asc' ? (
                                                    <ArrowUp className="h-3 w-3 text-emerald-300" />
                                                ) : (
                                                    <ArrowDown className="h-3 w-3 text-emerald-300" />
                                                )
                                            ) : (
                                                <ArrowUpDown className="h-3 w-3 text-emerald-700 opacity-0 group-hover:opacity-100 hover:opacity-100" />
                                            )}
                                        </div>
                                    </th>
                                );
                            })}

                            <th className="w-10 px-2 py-2.5 text-center">Del</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                        {sortedRows.map((row, idx) => {
                            const origIdx = rows.indexOf(row);
                            const gridDupe = duplicateMap.get(origIdx >= 0 ? origIdx : idx);
                            const dbDupe = dbDuplicates.find(d => d.index === (origIdx >= 0 ? origIdx : idx));
                            const hasError = !!gridDupe || !!dbDupe;
                            const rowBg = hasError ? 'bg-amber-50/60' : idx % 2 === 1 ? 'bg-gray-50/30' : 'bg-white';
                            const targetIdx = origIdx >= 0 ? origIdx : idx;

                            return (
                                <tr key={row._tempId || idx} className={`group transition-colors hover:bg-emerald-50/30 ${rowBg}`}>
                                    {/* Row # */}
                                    <td className="px-2 py-1.5 text-center font-bold text-gray-400 border-r border-gray-100 text-[11px]">
                                        {idx + 1}
                                    </td>

                                    {/* Visible Dynamic Columns */}
                                    {visibleOrderedColumns.map(col => (
                                        <td key={col.id} className="p-1 border-r border-gray-100 relative">
                                            {renderCellContent({
                                                colId: col.id,
                                                row,
                                                idx: targetIdx,
                                                handleCellChange,
                                                cellCls,
                                                selectCls,
                                                hasError,
                                                gridDupe,
                                                dbDupe,
                                            })}
                                        </td>
                                    ))}

                                    {/* Remove Row */}
                                    <td className="p-1 text-center">
                                        <button
                                            onClick={() => handleRemoveRow(targetIdx)}
                                            className="rounded p-1 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                            title="Remove row"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-white px-5 py-3">
                <p className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Info className="h-4 w-4 shrink-0 text-emerald-600" />
                    {isWater
                        ? 'Customer IDs auto-generated (W-XXXXXX). City defaults to Karachi, Area to BTK. Customize columns via top toolbar.'
                        : 'Customer IDs auto-generated. Customize columns via top toolbar. Blank rows skipped on save.'}
                </p>
                <div className="flex items-center gap-2">
                    {onClose && (
                        <Button type="button" variant="outline" onClick={onClose}
                            className="rounded-xl px-5 text-sm" disabled={isSaving}>
                            Cancel
                        </Button>
                    )}
                    <Button type="button" onClick={handleSaveAll}
                        disabled={isSaving || filledCount === 0}
                        className="rounded-xl bg-emerald-600 px-6 font-bold text-white shadow-md hover:bg-emerald-700 gap-2 text-sm">
                        {isSaving ? (
                            <><Loader2 className="h-4 w-4 animate-spin" />Saving...</>
                        ) : (
                            <><Save className="h-4 w-4" />Save {filledCount} Customer{filledCount !== 1 ? 's' : ''}</>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Cell content renderer helper
function renderCellContent({ colId, row, idx, handleCellChange, cellCls, selectCls, hasError, gridDupe, dbDupe }) {
    switch (colId) {
        case '_tempId':
            return (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 text-[10px] font-bold tracking-wide select-all">
                    {row._tempId || '-'}
                </span>
            );
        case 'name':
            return (
                <Input
                    value={row.name}
                    onChange={e => handleCellChange(idx, 'name', e.target.value)}
                    placeholder="Full Customer Name"
                    className={cellCls}
                />
            );
        case 'phone':
            return (
                <>
                    <Input
                        value={row.phone}
                        onChange={e => handleCellChange(idx, 'phone', e.target.value)}
                        placeholder="0300-1234567"
                        className={`${cellCls} ${hasError ? 'text-amber-900 font-semibold' : ''}`}
                    />
                    {gridDupe && <span className="block px-1.5 py-0.5 text-[10px] text-amber-700 font-bold">⚠️ {gridDupe}</span>}
                    {dbDupe && <span className="block px-1.5 py-0.5 text-[10px] text-rose-700 font-bold">🚨 {dbDupe.matchedCustomer?.name}</span>}
                </>
            );
        case 'email':
            return (
                <Input
                    value={row.email}
                    onChange={e => handleCellChange(idx, 'email', e.target.value)}
                    placeholder="email@example.com"
                    type="email"
                    className={cellCls}
                />
            );
        case 'accounttype':
            return (
                <select
                    value={row.accounttype}
                    onChange={e => handleCellChange(idx, 'accounttype', e.target.value)}
                    className={selectCls}
                >
                    {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            );
        case 'towncode':
            return (
                <Input
                    value={row.towncode}
                    onChange={e => handleCellChange(idx, 'towncode', e.target.value)}
                    list="ecg-area-list"
                    placeholder="Type area..."
                    className={cellCls}
                    autoComplete="off"
                />
            );
        case 'deliveryarea':
            return (
                <Input
                    value={row.deliveryarea}
                    onChange={e => handleCellChange(idx, 'deliveryarea', e.target.value)}
                    list="ecg-area2-list"
                    placeholder="DHA Phase 6..."
                    className={cellCls}
                    autoComplete="off"
                />
            );
        case 'deliveryroute':
            return (
                <Input
                    value={row.deliveryroute}
                    onChange={e => handleCellChange(idx, 'deliveryroute', e.target.value)}
                    list="ecg-route-list"
                    placeholder="Route..."
                    className={cellCls}
                    autoComplete="off"
                />
            );
        case 'houseno':
            return (
                <Input
                    value={row.houseno}
                    onChange={e => handleCellChange(idx, 'houseno', e.target.value)}
                    placeholder="Villa 303, Precinct 10A"
                    className={cellCls}
                />
            );
        case 'floorflat':
            return (
                <Input
                    value={row.floorflat}
                    onChange={e => handleCellChange(idx, 'floorflat', e.target.value)}
                    placeholder="5F 11A"
                    className={cellCls}
                />
            );
        case 'proprietorname':
            return (
                <Input
                    value={row.proprietorname}
                    onChange={e => handleCellChange(idx, 'proprietorname', e.target.value)}
                    placeholder="Contact at door"
                    className={cellCls}
                />
            );
        case 'city':
            return (
                <select
                    value={row.city}
                    onChange={e => handleCellChange(idx, 'city', e.target.value)}
                    className={selectCls}
                >
                    {WATER_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            );
        case 'bottlebalance':
            return (
                <Input
                    type="number"
                    value={row.bottlebalance}
                    onChange={e => handleCellChange(idx, 'bottlebalance', e.target.value)}
                    placeholder="0"
                    className={`${cellCls} text-right`}
                />
            );
        case 'dailybottles':
            return (
                <Input
                    type="number"
                    value={row.dailybottles}
                    onChange={e => handleCellChange(idx, 'dailybottles', e.target.value)}
                    placeholder="1"
                    className={`${cellCls} text-right`}
                />
            );
        case 'productrate':
            return (
                <Input
                    type="number"
                    value={row.productrate}
                    onChange={e => handleCellChange(idx, 'productrate', e.target.value)}
                    placeholder="150"
                    className={`${cellCls} text-right font-semibold text-emerald-700`}
                />
            );
        case 'emptydeposit':
            return (
                <Input
                    type="number"
                    value={row.emptydeposit}
                    onChange={e => handleCellChange(idx, 'emptydeposit', e.target.value)}
                    placeholder="1000"
                    className={`${cellCls} text-right`}
                />
            );
        case 'deliverydays':
            return (
                <select
                    value={row.deliverydays}
                    onChange={e => handleCellChange(idx, 'deliverydays', e.target.value)}
                    className={selectCls}
                >
                    {DELIVERY_DAY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            );
        case 'dayoffollow':
            return (
                <Input
                    type="number"
                    value={row.dayoffollow}
                    onChange={e => handleCellChange(idx, 'dayoffollow', e.target.value)}
                    placeholder="1"
                    min="1"
                    max="31"
                    className={`${cellCls} text-right`}
                />
            );
        case 'deliveryactive':
            return (
                <select
                    value={row.deliveryactive}
                    onChange={e => handleCellChange(idx, 'deliveryactive', e.target.value)}
                    className={selectCls}
                >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                </select>
            );
        case 'preferredpayment':
            return (
                <select
                    value={row.preferredpayment}
                    onChange={e => handleCellChange(idx, 'preferredpayment', e.target.value)}
                    className={selectCls}
                >
                    <option value="">-- Select --</option>
                    {PREFERRED_PAYMENT_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            );
        case 'opening_balance':
            return (
                <Input
                    type="number"
                    value={row.opening_balance}
                    onChange={e => handleCellChange(idx, 'opening_balance', e.target.value)}
                    placeholder="0"
                    className={`${cellCls} text-right`}
                />
            );
        case 'notes':
            return (
                <Input
                    value={row.notes}
                    onChange={e => handleCellChange(idx, 'notes', e.target.value)}
                    placeholder="Optional notes"
                    className={cellCls}
                />
            );
        default:
            return null;
    }
}
