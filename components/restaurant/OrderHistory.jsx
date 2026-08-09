'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Receipt, Calendar, Clock, Search, Printer, CheckCircle, RefreshCw, Filter, UtensilsCrossed, ShoppingBag, Bike
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getOrderHistoryAction } from '@/lib/actions/standard/restaurant';
import { usePosReceipt } from '@/lib/hooks/usePosReceipt';
import { useBusiness } from '@/lib/context/BusinessContext';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export function OrderHistory({ businessId }) {
    const { business } = useBusiness();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const { printBillFromCart } = usePosReceipt({
        business,
        documentLabel: 'Receipt',
        category: 'restaurant-cafe',
        currencyCode: business?.currency || 'PKR',
    });

    const loadOrders = useCallback(async () => {
        if (!businessId) return;
        setLoading(true);
        try {
            const res = await getOrderHistoryAction(businessId, {
                status: statusFilter,
                orderType: typeFilter,
                date: selectedDate,
            });
            if (res.success) {
                setOrders(res.orders || []);
            }
        } catch (err) {
            console.error('[OrderHistory] fetch failed:', err);
        } finally {
            setLoading(false);
        }
    }, [businessId, statusFilter, typeFilter, selectedDate]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const handleReprint = (order) => {
        let items = [];
        try {
            items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
        } catch { items = []; }

        const cart = items.map(i => ({
            name: i.item_name || i.name || 'Item',
            quantity: i.quantity || 1,
            unitPrice: Number(i.unit_price || i.price || 0),
        }));

        printBillFromCart({
            cart,
            customer: order.customer_name ? { name: order.customer_name } : null,
            paymentMethod: order.payment_method || 'cash',
            totalsFromCart: {
                subtotal: Number(order.subtotal || 0),
                taxAmount: Number(order.tax_amount || 0),
                discountAmount: Number(order.discount_amount || 0),
                total: Number(order.total_amount || 0),
            },
            transactionRef: order.order_number,
        });
        toast.success(`Reprinting receipt for ${order.order_number}`);
    };

    const filteredOrders = orders.filter(o => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            (o.order_number || '').toLowerCase().includes(q) ||
            (o.token_number && String(o.token_number).includes(q)) ||
            (o.customer_name || '').toLowerCase().includes(q) ||
            (o.table_number || '').toLowerCase().includes(q)
        );
    });

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const completedCount = filteredOrders.filter(o => o.status === 'completed').length;

    return (
        <div className="space-y-4">
            {/* Header Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="border border-gray-200">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Receipt className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-gray-900">{filteredOrders.length}</p>
                            <p className="text-xs text-gray-500 font-medium">Total Orders</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border border-gray-200">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-gray-900">{completedCount}</p>
                            <p className="text-xs text-gray-500 font-medium">Completed</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border border-gray-200">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                            <span className="text-sm font-black">Rs</span>
                        </div>
                        <div>
                            <p className="text-xl font-bold text-gray-900">Rs. {totalRevenue.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 font-medium">Revenue Today</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search token, order #, table..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 h-9 w-56 text-xs rounded-xl"
                        />
                    </div>
                    <Input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="h-9 text-xs w-36 rounded-xl"
                    />
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="h-9 text-xs px-3 border border-gray-200 rounded-xl bg-white text-gray-700"
                    >
                        <option value="all">All Statuses</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        className="h-9 text-xs px-3 border border-gray-200 rounded-xl bg-white text-gray-700"
                    >
                        <option value="all">All Types</option>
                        <option value="dine_in">Dine In</option>
                        <option value="takeaway">Takeaway</option>
                        <option value="delivery">Delivery</option>
                    </select>
                </div>
                <Button variant="outline" size="sm" onClick={loadOrders} className="h-9 text-xs font-bold rounded-xl">
                    <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
                </Button>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase font-semibold">
                            <tr>
                                <th className="px-4 py-3">Token / Order #</th>
                                <th className="px-4 py-3">Type / Table</th>
                                <th className="px-4 py-3">Items</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Payment</th>
                                <th className="px-4 py-3 text-right">Total</th>
                                <th className="px-4 py-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredOrders.map(order => {
                                let items = [];
                                try {
                                    items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
                                } catch { items = []; }
                                items = items.filter(Boolean);

                                return (
                                    <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {order.token_number && (
                                                    <span className="px-2 py-0.5 bg-indigo-600 text-white font-black rounded text-[10px]">
                                                        #{order.token_number}
                                                    </span>
                                                )}
                                                <div>
                                                    <p className="font-bold text-gray-900">{order.order_number}</p>
                                                    <p className="text-[10px] text-gray-400">
                                                        {new Date(order.created_at).toLocaleTimeString('en-PK', { timeStyle: 'short' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5 font-medium text-gray-700 capitalize">
                                                {order.order_type === 'dine_in' ? <UtensilsCrossed className="w-3.5 h-3.5 text-indigo-500" /> :
                                                    order.order_type === 'takeaway' ? <ShoppingBag className="w-3.5 h-3.5 text-amber-500" /> :
                                                        <Bike className="w-3.5 h-3.5 text-emerald-500" />}
                                                <span>{order.order_type?.replace('_', ' ')}</span>
                                                {order.table_number && <span className="text-gray-400">({order.table_number})</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                                            {items.map(i => `${i.quantity || 1}x ${i.item_name || i.name}`).join(', ')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    'text-[10px] capitalize font-bold',
                                                    order.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        order.status === 'preparing' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                            order.status === 'ready' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                'bg-gray-50 text-gray-600 border-gray-200'
                                                )}
                                            >
                                                {order.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 capitalize">
                                            {order.payment_method || 'cash'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                                            Rs. {Number(order.total_amount || 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleReprint(order)}
                                                className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                            >
                                                <Printer className="w-3.5 h-3.5 mr-1" /> Receipt
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredOrders.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-gray-400">
                                        <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm font-semibold">No orders found for this filter</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
