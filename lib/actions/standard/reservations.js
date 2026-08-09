'use server';

import pool from '@/lib/db';
import { withGuard } from '@/lib/rbac/serverGuard';
import { auditWrite } from '@/lib/actions/_shared/audit';
import { ReservationService } from '@/lib/services/ReservationService';

async function checkAuth(businessId, client = null, permission = 'restaurant.manage_tables', feature = 'restaurant_kds') {
  const { session } = await withGuard(businessId, { permission, feature, client });
  return session;
}

/**
 * Get reservations for a business
 */
export async function getReservationsAction(businessId, filters = {}) {
  const client = await pool.connect();
  try {
    await checkAuth(businessId, client, 'restaurant.view_tables', 'restaurant_kds');
    const reservations = await ReservationService.getReservations(businessId, filters, client);
    return { success: true, reservations };
  } catch (error) {
    console.error('[getReservationsAction] error:', error);
    return { success: false, error: error.message, reservations: [] };
  } finally {
    client.release();
  }
}

/**
 * Create or update a reservation
 */
export async function saveReservationAction(data) {
  try {
    const session = await checkAuth(data.businessId, null, 'restaurant.manage_tables', 'restaurant_kds');
    let reservation;
    if (data.id && !data.id.startsWith('r-') && !data.id.startsWith('temp-')) {
      reservation = await ReservationService.updateReservation(data.id, {
        ...data,
        updatedBy: session.user.id
      });
    } else {
      reservation = await ReservationService.createReservation({
        ...data,
        createdBy: session.user.id
      });
    }

    auditWrite({
      businessId: data.businessId,
      action: data.id ? 'update' : 'create',
      entityType: 'restaurant_reservation',
      entityId: reservation.id,
      description: `Saved reservation for ${reservation.customer_name || data.customerName}`,
    });

    return { success: true, reservation };
  } catch (error) {
    console.error('[saveReservationAction] error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update reservation status
 */
export async function updateReservationStatusAction({ businessId, id, status }) {
  try {
    await checkAuth(businessId, null, 'restaurant.manage_tables', 'restaurant_kds');
    const reservation = await ReservationService.updateStatus({ businessId, id, status });

    auditWrite({
      businessId,
      action: 'update',
      entityType: 'restaurant_reservation',
      entityId: id,
      description: `Updated reservation status to ${status}`,
    });

    return { success: true, reservation };
  } catch (error) {
    console.error('[updateReservationStatusAction] error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete reservation
 */
export async function deleteReservationAction({ businessId, id }) {
  try {
    await checkAuth(businessId, null, 'restaurant.manage_tables', 'restaurant_kds');
    await ReservationService.deleteReservation({ businessId, id });

    auditWrite({
      businessId,
      action: 'delete',
      entityType: 'restaurant_reservation',
      entityId: id,
      description: `Deleted reservation ${id}`,
    });

    return { success: true };
  } catch (error) {
    console.error('[deleteReservationAction] error:', error);
    return { success: false, error: error.message };
  }
}
