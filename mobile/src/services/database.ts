import * as SQLite from 'expo-sqlite';

export interface DbTrip {
  id: number;
  bilty_no: string;
  customer_id: number;
  date: string;
  status: 'booked' | 'in_transit' | 'delivered' | 'closed';
  freight_paisa: number;
  consignee: string;
  carrier_id?: number;
  driver_id?: number;
  route?: string;
  created_at: string;
  updated_at: string;
}

export interface DbExpense {
  id: number;
  trip_id: number;
  type: 'fuel' | 'toll' | 'driver_advance' | 'maintenance' | 'other';
  amount_paisa: number;
  description: string;
  date: string;
  location?: string;
  receipt_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface DbLocation {
  id: number;
  trip_id: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
  created_at: string;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('loadyar.db');
      await this.createTables();
      console.log('Database initialized');
    } catch (error) {
      console.error('Database init error:', error);
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Trips table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS trips (
          id INTEGER PRIMARY KEY,
          bilty_no TEXT UNIQUE NOT NULL,
          customer_id INTEGER NOT NULL,
          date TEXT NOT NULL,
          status TEXT NOT NULL,
          freight_paisa INTEGER NOT NULL,
          consignee TEXT NOT NULL,
          carrier_id INTEGER,
          driver_id INTEGER,
          route TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      // Expenses table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY,
          trip_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          amount_paisa INTEGER NOT NULL,
          description TEXT NOT NULL,
          date TEXT NOT NULL,
          location TEXT,
          receipt_reference TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (trip_id) REFERENCES trips(id)
        );
      `);

      // Locations table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS locations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          trip_id INTEGER NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          accuracy REAL NOT NULL,
          altitude REAL,
          heading REAL,
          speed REAL,
          timestamp INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (trip_id) REFERENCES trips(id)
        );
      `);

      // Notifications table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          data TEXT,
          timestamp TEXT NOT NULL,
          read INTEGER DEFAULT 0
        );
      `);

      console.log('Tables created');
    } catch (error) {
      console.error('Create tables error:', error);
    }
  }

  // Trips operations
  async insertTrips(trips: DbTrip[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      for (const trip of trips) {
        await this.db.runAsync(
          `INSERT OR REPLACE INTO trips
           (id, bilty_no, customer_id, date, status, freight_paisa, consignee, carrier_id, driver_id, route, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            trip.id,
            trip.bilty_no,
            trip.customer_id,
            trip.date,
            trip.status,
            trip.freight_paisa,
            trip.consignee,
            trip.carrier_id,
            trip.driver_id,
            trip.route,
            trip.created_at,
            trip.updated_at,
          ]
        );
      }
    } catch (error) {
      console.error('Insert trips error:', error);
    }
  }

  async getTripsByStatus(status: string): Promise<DbTrip[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync<DbTrip>(
        'SELECT * FROM trips WHERE status = ? ORDER BY date DESC',
        [status]
      );
      return result;
    } catch (error) {
      console.error('Get trips by status error:', error);
      return [];
    }
  }

  async getTripById(id: number): Promise<DbTrip | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getFirstAsync<DbTrip>(
        'SELECT * FROM trips WHERE id = ?',
        [id]
      );
      return result || null;
    } catch (error) {
      console.error('Get trip by id error:', error);
      return null;
    }
  }

  // Expenses operations
  async insertExpenses(expenses: DbExpense[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      for (const expense of expenses) {
        await this.db.runAsync(
          `INSERT OR REPLACE INTO expenses
           (id, trip_id, type, amount_paisa, description, date, location, receipt_reference, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            expense.id,
            expense.trip_id,
            expense.type,
            expense.amount_paisa,
            expense.description,
            expense.date,
            expense.location,
            expense.receipt_reference,
            expense.created_at,
            expense.updated_at,
          ]
        );
      }
    } catch (error) {
      console.error('Insert expenses error:', error);
    }
  }

  async getExpensesByTrip(tripId: number): Promise<DbExpense[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync<DbExpense>(
        'SELECT * FROM expenses WHERE trip_id = ? ORDER BY date DESC',
        [tripId]
      );
      return result;
    } catch (error) {
      console.error('Get expenses by trip error:', error);
      return [];
    }
  }

  async deleteExpense(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
    } catch (error) {
      console.error('Delete expense error:', error);
    }
  }

  // Location operations
  async insertLocations(locations: DbLocation[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      for (const location of locations) {
        await this.db.runAsync(
          `INSERT INTO locations
           (trip_id, latitude, longitude, accuracy, altitude, heading, speed, timestamp, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            location.trip_id,
            location.latitude,
            location.longitude,
            location.accuracy,
            location.altitude,
            location.heading,
            location.speed,
            location.timestamp,
            location.created_at,
          ]
        );
      }
    } catch (error) {
      console.error('Insert locations error:', error);
    }
  }

  async getLocationsByTrip(tripId: number): Promise<DbLocation[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync<DbLocation>(
        'SELECT * FROM locations WHERE trip_id = ? ORDER BY timestamp ASC',
        [tripId]
      );
      return result;
    } catch (error) {
      console.error('Get locations by trip error:', error);
      return [];
    }
  }

  async deleteLocationsForTrip(tripId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync('DELETE FROM locations WHERE trip_id = ?', [tripId]);
    } catch (error) {
      console.error('Delete locations error:', error);
    }
  }

  // Database utilities
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.execAsync(`
        DELETE FROM locations;
        DELETE FROM expenses;
        DELETE FROM trips;
        DELETE FROM notifications;
      `);
      console.log('All data cleared');
    } catch (error) {
      console.error('Clear all data error:', error);
    }
  }

  async getDbSize(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getFirstAsync<{ size: number }>(
        "SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()"
      );
      return result?.size || 0;
    } catch (error) {
      console.error('Get db size error:', error);
      return 0;
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

export const databaseService = new DatabaseService();
