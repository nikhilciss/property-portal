import type { Database } from '../../types';
import type { StorageAdapter } from '../storage';
export class Repository<K extends keyof Database> {
  constructor(
    protected storage: StorageAdapter,
    private key: K,
  ) {}
  list(): Database[K] {
    return this.storage.read()[this.key];
  }
  get(id: string): Database[K][number] | undefined {
    return this.list().find((row) => row.id === id);
  }
}
export class UserRepository extends Repository<'users'> {
  constructor(s: StorageAdapter) {
    super(s, 'users');
  }
}
export class PropertyRepository extends Repository<'properties'> {
  constructor(s: StorageAdapter) {
    super(s, 'properties');
  }
}
export class ApplicationRepository extends Repository<'applications'> {
  constructor(s: StorageAdapter) {
    super(s, 'applications');
  }
}
export class VisitRepository extends Repository<'visits'> {
  constructor(s: StorageAdapter) {
    super(s, 'visits');
  }
}
export class InspectionRepository extends Repository<'inspections'> {
  constructor(s: StorageAdapter) {
    super(s, 'inspections');
  }
}
export class DocumentRepository extends Repository<'documents'> {
  constructor(s: StorageAdapter) {
    super(s, 'documents');
  }
}
export class NotificationRepository extends Repository<'notifications'> {
  constructor(s: StorageAdapter) {
    super(s, 'notifications');
  }
}
export class AuditRepository extends Repository<'auditLogs'> {
  constructor(s: StorageAdapter) {
    super(s, 'auditLogs');
  }
}
export class UnitOfWork {
  constructor(private storage: StorageAdapter) {}
  read() {
    return this.storage.read();
  }
  commit(work: (data: Database) => void) {
    const data = this.storage.read();
    work(data);
    this.storage.write(data);
    return data;
  }
  reset() {
    return this.storage.reset();
  }
}
