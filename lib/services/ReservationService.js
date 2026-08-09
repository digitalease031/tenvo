import pool from '@/lib/db';

/**
 * Reservation Service
 * Manages table reservations with conflict prevention and DB persistence.
 */
export const ReservationService = {
  async getClient(txClient) {
    return txClient || await pool.connect();
  },

  async ensureTable(client) {
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS restaurant_reservations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
          customer_name VARCHAR(200) NOT NULL,
          customer_phone VARCHAR(50),
          customer_email VARCHAR(200),
          party_size INT NOT NULL DEFAULT 2,
          date DATE NOT NULL,
          time VARCHAR(10) NOT NULL,
          duration INT NOT NULL DEFAULT 90,
          status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
          notes TEXT,
          source VARCHAR(20) DEFAULT 'manual',
          created_by VARCHAR(100),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_restaurant_reservations_business ON restaurant_reservations(business_id);
        CREATE INDEX IF NOT EXISTS idx_restaurant_reservations_date ON restaurant_reservations(business_id, date);
      `);
    } catch (e) {
      console.warn('[ReservationService] ensureTable warning:', e.message);
    }
  },

  /**
   * Check slot conflicts for table reservation
   */
  async checkConflict({ businessId, tableId, date, time, duration = 90, excludeId = null }, txClient = null) {
    if (!tableId) return false;
    const client = await this.getClient(txClient);
    try {
      const timeMinutes = (tStr) => {
        const [h, m] = String(tStr || '00:00').split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
      };
      const newStart = timeMinutes(time);
      const newEnd = newStart + Number(duration);

      let query = `
        SELECT id, time, duration
        FROM restaurant_reservations
        WHERE business_id = $1
          AND table_id = $2
          AND date = $3::date
          AND status NOT IN ('cancelled', 'noshow')
      `;
      const params = [businessId, tableId, date];

      if (excludeId) {
        query += ` AND id != $4`;
        params.push(excludeId);
      }

      let res;
      try {
        res = await client.query(query, params);
      } catch (err) {
        if (err.code === '42P01') {
          await this.ensureTable(client);
          return false;
        }
        throw err;
      }

      const res = await client.query(query, params);

      for (const row of res.rows) {
        const rStart = timeMinutes(row.time);
        const rEnd = rStart + (Number(row.duration) || 90);
        if (newStart < rEnd && newEnd > rStart) {
          return true; // Conflict found
        }
      }

      return false;
    } finally {
      if (!txClient) client.release();
    }
  },

  /**
   * Create a reservation
   */
  async createReservation(data, txClient = null) {
    const client = await this.getClient(txClient);
    try {
      const conflict = await this.checkConflict(data, client);
      if (conflict) {
        throw new Error('Table is already booked for the selected time slot.');
      }

      const res = await client.query(`
        INSERT INTO restaurant_reservations (
          business_id, table_id, customer_name, customer_phone, customer_email,
          party_size, date, time, duration, status, notes, source, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        data.businessId,
        data.tableId || null,
        data.customerName,
        data.phone || data.customerPhone || null,
        data.email || data.customerEmail || null,
        data.partySize || 2,
        data.date,
        data.time,
        data.duration || 90,
        data.status || 'confirmed',
        data.notes || null,
        data.source || 'manual',
        data.createdBy || null
      ]);

      return res.rows[0];
    } finally {
      if (!txClient) client.release();
    }
  },

  /**
   * Update a reservation
   */
  async updateReservation(id, data, txClient = null) {
    const client = await this.getClient(txClient);
    try {
      const conflict = await this.checkConflict({ ...data, excludeId: id }, client);
      if (conflict) {
        throw new Error('Table is already booked for the selected time slot.');
      }

      const res = await client.query(`
        UPDATE restaurant_reservations SET
          table_id = $1,
          customer_name = $2,
          customer_phone = $3,
          customer_email = $4,
          party_size = $5,
          date = $6::date,
          time = $7,
          duration = $8,
          status = COALESCE($9, status),
          notes = $10,
          updated_at = NOW()
        WHERE id = $11 AND business_id = $12
        RETURNING *
      `, [
        data.tableId || null,
        data.customerName,
        data.phone || data.customerPhone || null,
        data.email || data.customerEmail || null,
        data.partySize || 2,
        data.date,
        data.time,
        data.duration || 90,
        data.status || null,
        data.notes || null,
        id,
        data.businessId
      ]);

      if (res.rows.length === 0) throw new Error('Reservation not found');
      return res.rows[0];
    } finally {
      if (!txClient) client.release();
    }
  },

  /**
   * Update reservation status
   */
  async updateStatus({ businessId, id, status }, txClient = null) {
    const client = await this.getClient(txClient);
    try {
      const res = await client.query(`
        UPDATE restaurant_reservations
        SET status = $1, updated_at = NOW()
        WHERE id = $2 AND business_id = $3
        RETURNING *
      `, [status, id, businessId]);

      if (res.rows.length === 0) throw new Error('Reservation not found');
      return res.rows[0];
    } finally {
      if (!txClient) client.release();
    }
  },

  /**
   * Delete / cancel reservation
   */
  async deleteReservation({ businessId, id }, txClient = null) {
    const client = await this.getClient(txClient);
    try {
      await client.query(`
        DELETE FROM restaurant_reservations
        WHERE id = $1 AND business_id = $2
      `, [id, businessId]);
      return { success: true };
    } finally {
      if (!txClient) client.release();
    }
  },

  /**
   * Get reservations for date range or specific date
   */
  async getReservations(businessId, { date, startDate, endDate, status } = {}, txClient = null) {
    const client = await this.getClient(txClient);
    try {
      let query = `
        SELECT r.*,
               r.customer_name as "customerName",
               r.customer_phone as "phone",
               r.customer_email as "email",
               r.party_size as "partySize",
               r.table_id as "tableId",
               TO_CHAR(r.date, 'YYYY-MM-DD') as "date",
               rt.table_number as "tableName"
        FROM restaurant_reservations r
        LEFT JOIN restaurant_tables rt ON r.table_id = rt.id
        WHERE r.business_id = $1
      `;
      const params = [businessId];
      let idx = 2;

      if (date) {
        query += ` AND r.date = $${idx}::date`;
        params.push(date);
        idx++;
      } else if (startDate && endDate) {
        query += ` AND r.date >= $${idx}::date AND r.date <= $${idx + 1}::date`;
        params.push(startDate, endDate);
        idx += 2;
      }

      if (status && status !== 'all') {
        query += ` AND r.status = $${idx}`;
        params.push(status);
        idx++;
      }

      query += ` ORDER BY r.date ASC, r.time ASC`;

      try {
        const res = await client.query(query, params);
        return res.rows;
      } catch (err) {
        if (err.code === '42P01') {
          await this.ensureTable(client);
          return [];
        }
        throw err;
      }
    } finally {
      if (!txClient) client.release();
    }
  }
};
