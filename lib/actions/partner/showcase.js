'use server';

import { prismaBase as prisma } from '@/lib/db';
import { getServerSession } from '@/lib/auth/rbac';
import { isPlatformOwner, isPartnerUser } from '@/lib/config/platform';
import { actionSuccess, actionFailure, getErrorMessage } from '@/lib/actions/_shared/result';
import { DOMAIN_PACKAGES } from '@/lib/config/domainPackages';

/**
 * Fetch partner showcase portal overview:
 *  - Affiliate referral code & earnings ledger
 *  - Categorized registered demo stores across industry verticals
 */
export async function getPartnerShowcaseData() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return await actionFailure('UNAUTHORIZED', 'Please log in to access Partner Showcase.');
    }

    const user = session.user;
    const userEmail = String(user.email || '').trim().toLowerCase();

    // 1. Fetch affiliate referral details (or auto-provision for logged in user)
    let affiliate = null;
    try {
      const rows = await prisma.$queryRaw`
        SELECT id, name, email, referral_code, status, commission_rate,
               total_earnings, is_active, created_at
        FROM affiliates
        WHERE LOWER(email) = ${userEmail}
        LIMIT 1
      `;
      if (rows && rows.length > 0) {
        const row = rows[0];
        affiliate = {
          id: row.id,
          name: row.name,
          email: row.email,
          referralCode: row.referral_code,
          status: row.status,
          commissionRate: Number(row.commission_rate || 20),
          totalEarnings: Number(row.total_earnings || 0),
          isActive: Boolean(row.is_active),
        };
      }
    } catch (affErr) {
      console.warn('[PartnerShowcase] Affiliate lookup notice:', affErr.message);
    }

    // Auto-provision an affiliate record if missing so user has immediate referral link & showcase access
    if (!affiliate) {
      const code = 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      try {
        const created = await prisma.affiliates.create({
          data: {
            name: user.name || userEmail.split('@')[0],
            email: userEmail,
            referral_code: code,
            commission_rate: 20.00,
            status: 'approved',
            is_active: true,
          }
        });
        affiliate = {
          id: created.id,
          name: created.name,
          email: created.email,
          referralCode: created.referral_code,
          status: created.status,
          commissionRate: 20,
          totalEarnings: 0,
          isActive: true,
        };
      } catch (createErr) {
        console.warn('[PartnerShowcase] Affiliate auto-create notice:', createErr.message);
      }
    }

    // 2. Fetch referrals summary if affiliate exists
    let referralCount = 0;
    if (affiliate?.id) {
      try {
        const refCountRes = await prisma.$queryRaw`
          SELECT COUNT(DISTINCT b.id)::int as count 
          FROM businesses b 
          LEFT JOIN referrals r ON r.business_id = b.id 
          WHERE b.affiliate_id = ${affiliate.id}::uuid OR r.affiliate_id = ${affiliate.id}::uuid
        `;
        referralCount = refCountRes[0]?.count || 0;
      } catch {
        referralCount = 0;
      }
    }

    // 3. Fetch registered demo businesses
    const demoBusinesses = await prisma.businesses.findMany({
      where: {
        OR: [
          { is_demo_requested: true },
          { domain: { startsWith: 'demo-' } },
          { domain: { endsWith: '-demo' } },
          { category: { contains: 'demo' } },
        ],
      },
      select: {
        id: true,
        business_name: true,
        domain: true,
        category: true,
        country: true,
        logo_url: true,
        created_at: true,
        settings: true,
      },
      orderBy: { created_at: 'desc' },
    });

    // 4. Map vertical packages and demo templates
    const verticalDemos = Object.entries(DOMAIN_PACKAGES).map(([key, pkg]) => {
      const defaultCategory = pkg.defaultVertical || (pkg.verticals && pkg.verticals[0]) || key;
      const matchingStores = demoBusinesses.filter(b => {
        const pkgKey = b.settings?.domain_package?.key;
        return pkgKey === key || b.category === defaultCategory || b.category === key || (pkg.verticals && pkg.verticals.includes(b.category));
      });

      return {
        packageKey: key,
        title: pkg.name,
        category: defaultCategory,
        description: pkg.summary || pkg.description || pkg.tagline || 'Enterprise vertical workspace and POS demo.',
        demoStoreDomain: pkg.demoStoreDomain || `demo-${key}`,
        icon: pkg.iconName || 'Store',
        matchingStores: matchingStores.map(s => ({
          id: s.id,
          name: s.business_name,
          domain: s.domain,
          category: s.category,
          logoUrl: s.logo_url,
        })),
      };
    });

    return await actionSuccess({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      affiliate,
      referralCount,
      totalDemoStores: demoBusinesses.length,
      demoStores: demoBusinesses.map(b => ({
        id: b.id,
        name: b.business_name,
        domain: b.domain,
        category: b.category,
        logoUrl: b.logo_url,
      })),
      verticalDemos,
    });
  } catch (error) {
    console.error('[getPartnerShowcaseData]', error);
    return await actionFailure('SHOWCASE_ERROR', await getErrorMessage(error));
  }
}
