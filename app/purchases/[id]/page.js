'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBusiness } from '@/lib/context/BusinessContext';
import GRNView from '@/components/GRNView';
import { purchaseAPI } from '@/lib/api/purchases';
import toast from 'react-hot-toast';

export default function PurchaseDetailPage({ params }) {
    const router = useRouter();
    const unwrappedParams = use(params);
    const poId = unwrappedParams.id;
    const { business } = useBusiness();
    const [refreshKey, setRefreshKey] = useState(0);

    const handleUpdateStatus = async (id, status) => {
        if (!business?.id) return;
        try {
            await purchaseAPI.updateStatus(business.id, id, status);
            toast.success(`Purchase status updated to ${status}`);
            setRefreshKey((prev) => prev + 1);
        } catch (error) {
            console.error('Update status error:', error);
            toast.error('Could not update status');
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Header / Actions Bar */}
            <div className="flex items-center justify-between gap-4">
                <Button
                    variant="outline"
                    onClick={() => router.push('/purchases')}
                    className="font-bold gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Purchases
                </Button>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => window.print()}
                        className="font-bold gap-2"
                    >
                        <Printer className="w-4 h-4" /> Print Document
                    </Button>
                </div>
            </div>

            {/* Document Card Container */}
            <Card className="border-border shadow-sm bg-card overflow-hidden">
                <CardContent className="p-6">
                    <GRNView
                        key={refreshKey}
                        poId={poId}
                        businessId={business?.id}
                        business={business}
                        onUpdateStatus={handleUpdateStatus}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
