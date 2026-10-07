import type { Database, User } from '../../types';
import users from '../../data/users.json';
import properties from '../../data/properties.json';
import landlords from '../../data/landlords.json';
import tenants from '../../data/tenants.json';
import applicants from '../../data/applicants.json';
import applications from '../../data/applications.json';
import viewings from '../../data/viewings.json';
import visits from '../../data/visits.json';
import inspections from '../../data/inspections.json';
import documents from '../../data/documents.json';
import notifications from '../../data/notifications.json';
import auditLogs from '../../data/auditLogs.json';
import notes from '../../data/notes.json';
import emails from '../../data/emails.json';
import submissions from '../../data/submissions.json';
const seed = {
  users,
  properties,
  landlords,
  tenants,
  applicants,
  applications,
  viewings,
  visits,
  inspections,
  documents,
  notifications,
  auditLogs,
  notes,
  emails,
  submissions,
} as Database;
export interface StorageAdapter {
  read(): Database;
  write(data: Database): void;
  reset(): Database;
}
export class StaticJsonStorageAdapter implements StorageAdapter {
  private data = structuredClone(seed);
  read() {
    return structuredClone(this.data);
  }
  write(data: Database) {
    this.data = structuredClone(data);
  }
  reset() {
    this.data = structuredClone(seed);
    return this.read();
  }
}
export class BrowserStorageAdapter implements StorageAdapter {
  private key = 'property-portal-v1';
  read(): Database {
    const raw = localStorage.getItem(this.key);
    if (!raw) {
      const data = structuredClone(seed);
      this.write(data);
      return data;
    }
    try {
      const data = JSON.parse(raw);
      if (!Object.keys(seed).every((k) => Array.isArray(data[k]))) throw Error();
      return data as Database;
    } catch {
      throw new Error(
        'Saved demo data cannot be read. Use Reset demo data to restore the seed dataset.',
      );
    }
  }
  write(data: Database) {
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
    } catch {
      throw new Error('Browser storage is unavailable or full. Changes could not be saved.');
    }
  }
  reset() {
    const data = structuredClone(seed);
    this.write(data);
    return data;
  }
}
export const sessionStorageAdapter = {
  read(): User | null {
    try {
      return JSON.parse(localStorage.getItem('property-session') || 'null');
    } catch {
      return null;
    }
  },
  write(user: User | null) {
    if (user) localStorage.setItem('property-session', JSON.stringify(user));
    else localStorage.removeItem('property-session');
  },
};
