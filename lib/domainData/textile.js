export const textileDomains = {
    'textile-wholesale': {
        icon: 'Scroll',
        imageUrl: '/textile_hero.png',
        productFields: ['Article No', 'Design No', 'Fabric Type', 'Color/Shade', 'Kora/Finished', 'Width (Arz)', 'Thaan Length', 'Suit Cutting', 'Sourcing', 'Origin'],
        taxCategories: ['Sales Tax 17%', 'Sales Tax 18%', 'Zero Rated (Export)', 'Unregistered Buyer (3% Further Tax)'],
        units: ['meter', 'gaz', 'suit', 'thaan', 'guth', 'kg'],
        alternateUnits: { 'thaan': 'meter', 'guth': 'suit' },
        defaultTax: 18,
        defaultHSN: '5208', // Woven fabrics of cotton (Textile Wholesale)
        fieldConfig: {
            articleno: { label: 'Article No', type: 'text', placeholder: 'e.g. GA-101', required: true },
            designno: { label: 'Design No', type: 'text', placeholder: 'e.g. D-505', required: true },
            fabrictype: {
                label: 'Fabric Type',
                type: 'select',
                options: ['Lawn', 'Cotton', 'Wash & Wear', 'Chiffon', 'Silk', 'Khaddar', 'Linen', 'Jacquard', 'Karandi', 'Organza', 'Velvet', 'Georgette', 'Cambric', 'Viscose', 'Net', 'Shamoz', 'Denim'],
                required: true
            },
            korafinished: {
                label: 'Kora/Finished',
                type: 'select',
                options: [
                    { value: 'Kora', label: 'Kora (Raw)' },
                    { value: 'Finished', label: 'Finished (Processed)' },
                    { value: 'Dyed', label: 'Dyed' },
                    { value: 'Printed', label: 'Printed' },
                    { value: 'Embroidered', label: 'Embroidered' }
                ],
                required: true
            },
            colorshade: {
                label: 'Color / Shade',
                type: 'select',
                options: [
                    'Off White', 'White', 'Cream', 'Ivory', 'Beige',
                    'Navy Blue', 'Royal Blue', 'Sky Blue', 'Cobalt Blue',
                    'Black', 'Charcoal', 'Dark Grey', 'Grey', 'Light Grey',
                    'Red', 'Maroon', 'Burgundy', 'Brick Red',
                    'Forest Green', 'Olive Green', 'Lime Green', 'Mint',
                    'Brown', 'Khaki', 'Camel', 'Mustard', 'Golden',
                    'Pink', 'Baby Pink', 'Hot Pink', 'Peach', 'Salmon',
                    'Purple', 'Lavender', 'Lilac', 'Violet',
                    'Orange', 'Rust', 'Burnt Orange',
                    'Teal', 'Turquoise', 'Cyan',
                    'Printed', 'Multi-Color', 'Assorted',
                ],
                required: false,
                allowCustom: true,
            },
            widtharz: { label: 'Width (Arz)', type: 'number', placeholder: 'e.g. 40, 44, 60', required: false, default: 44 },
            thaanlength: { label: 'Thaan Length (m)', type: 'number', placeholder: 'Meters per Thaan e.g. 40', required: false, default: 40 },
            suitcutting: { label: 'Suit Cutting (m)', type: 'number', placeholder: 'Meters per Suit e.g. 2.25', required: false },
            sourcing: {
                label: 'Sourcing',
                type: 'select',
                options: [
                    { value: 'local', label: 'Local' },
                    { value: 'imported', label: 'Imported' },
                ],
                required: false,
            },
            origin: { label: 'Origin', type: 'text', placeholder: 'e.g. Turkey, China, Faisalabad', required: false },
        },
        customerFields: ['Shop Name', 'Market Location', 'Credit Limit (PKR)', 'Broker Name', 'NTN Status (Filer/Non-Filer)', 'Payment Terms', 'Buyer Type (Retailer/Wholesaler/Tailor)'],
        vendorFields: ['Mill Name', 'Agent Name', 'City (Faisalabad/Karachi/Lahore)', 'Payment Terms', 'Quality Grade', 'MOQ (Thaan)'],
        quickActions: [
            { id: 'new-invoice', label: 'Quick Invoice', icon: 'FileText', description: 'Create thaan/meter invoice', tab: 'invoices' },
            { id: 'record-payment', label: 'Record Payment', icon: 'Wallet', description: 'Log customer payment', tab: 'payments' },
            { id: 'check-stock', label: 'Article Stock', icon: 'Package', description: 'View by Article/Design', tab: 'inventory' },
            { id: 'customer-ledger', label: 'Party Ledger', icon: 'Users', description: 'View outstanding balance', tab: 'customers' },
            { id: 'add-thaan', label: 'Add Thaans', icon: 'Plus', description: 'Record new stock', tab: 'inventory' },
            { id: 'broker-expense', label: 'Log Commission', icon: 'UserCheck', description: 'Record broker payment', tab: 'expenses' },
        ],
        dashboardWidgets: [
            { id: 'party-outstanding', title: 'Top Outstanding Parties', type: 'customer-ar', limit: 10 },
            { id: 'design-movers', title: 'Fast Moving Designs', type: 'top-products', groupBy: 'design' },
            { id: 'article-stock', title: 'Stock by Article', type: 'inventory-summary', groupBy: 'article' },
            { id: 'seasonal-alert', title: 'Seasonal Intelligence', type: 'intelligence', seasonal: true },
            { id: 'payment-collections', title: 'This Month Collections', type: 'payment-summary' },
            { id: 'broker-commissions', title: 'Pending Commissions', type: 'expense-summary', category: 'agent_commission' },
        ],
        pakistaniFeatures: {
            paymentGateways: ['jazzcash', 'easypaisa', 'bank_transfer', 'cheque', 'cash'],
            taxCompliance: ['fbr', 'ntn', 'srn', 'further_tax', 'withholding'],
            languages: ['en', 'ur'],
            seasonalPricing: true,
            localBrands: true,
            urduCategories: true,
            wholesalerMode: true,
            marketLocations: ['Jama Cloth', 'Lunda Bazaar', 'Tariq Road', 'Faisalabad Market'],
            popularBrands: [
                'Gul Ahmed Textile', 'Nishat Mills', 'Sapphire Textile', 'Al-Karam Textile',
                'Crescent Textile', 'Masood Textile', 'Kohinoor Mills', 'Interloop Limited',
            ],
        },
        inventoryFeatures: [
            'Thaan Management', 'Roll Tracking', 'Cutting Management', 'Design-wise Stock',
            'Article-wise Stock', 'Fabric Quality Tracking', 'Multi-Location Inventory',
            'Barcode Scanning (Article No)', 'Stock Valuation (Average)', 'Reorder Points',
            'Quotation Management', 'Sales Order Processing', 'Purchase Order Management',
            'Challan Management (Gate Pass)', 'Sales Tax Invoicing', 'FBR Compliance',
            'Stock Transfer', 'Stock Adjustment', 'Season-wise Analysis',
            'Customer Ledger (Udhaar)', 'Supplier Ledger', 'Broker/Agent Commission'
        ],
        reports: [
            'Design-wise Sales', 'Article-wise Stock', 'Customer Ledger', 'Supplier Ledger',
            'Stock Summary (Thaan/Meter)', 'Daily Sales Report', 'Broker Commission Report',
            'Season Performance', 'Dead Stock Analysis', 'FBR Tax Report'
        ],
        paymentTerms: ['Cash', 'Credit 15 Days', 'Credit 30 Days', 'Cheque (PDC)', 'Cash on Delivery (COD)'],
        stockValuationMethod: 'Average',
        reorderEnabled: true,
        multiLocationEnabled: true,
        serialTrackingEnabled: false,
        batchTrackingEnabled: true,
        expiryTrackingEnabled: false,
        // Traders + optional cutting/job work — not mill BOM manufacturing.
        manufacturingEnabled: false,
        intelligence: {
            seasonality: 'high',
            // Calendar months only; Ramadan/Eid peaks are handled by fashionSeasonalityHelper.
            peakMonths: ['April', 'May', 'June', 'July', 'November', 'December'],
            perishability: 'low',
            shelfLife: 1000,
            demandVolatility: 0.8,
            minOrderQuantity: 100,
            leadTime: 14,
        },
        setupTemplate: {
            categories: ['Lawn', 'Cotton', 'Wash & Wear', 'Chiffon', 'Silk', 'Khaddar', 'Linen', 'Imported Fabric', 'Lunda Bazaar', 'Mens Unstitched', 'Bridal Collection'],
            suggestedProducts: [
                { name: 'Gul Ahmed Digital Print Lawn', unit: 'suit', category: 'Lawn', startingStock: 50, defaultPrice: 4500, description: 'Premium digital print lawn 3pc' },
                { name: 'Grace Wash & Wear Executive', unit: 'suit', category: 'Wash & Wear', startingStock: 100, defaultPrice: 2800, description: 'Premium mens wash & wear' },
                { name: 'Al-Karam Egyptian Cotton', unit: 'suit', category: 'Cotton', startingStock: 30, defaultPrice: 3500, description: 'Fine Egyptian cotton mens collection' },
                { name: 'Sana Safinaz Luxury Chiffon', unit: 'suit', category: 'Chiffon', startingStock: 15, defaultPrice: 12500, description: 'Luxury embroidered wedding wear' },
                { name: 'Standard Thaan Rolling - Cotton', unit: 'thaan', category: 'Cotton', startingStock: 10, defaultPrice: 15000, description: 'Cotton thaan (35-40 meters)' }
            ]
        }
    }
};
