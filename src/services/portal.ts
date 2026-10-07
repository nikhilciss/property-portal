import type {
  Application,
  ApplicationStatus,
  Database,
  Document,
  Inspection,
  Property,
  Role,
  User,
} from '../types';
import { UnitOfWork } from './repositories';
import type { StorageAdapter } from './storage';
import {
  MockEmailGateway,
  MockIdentityVerificationGateway,
  MockCreditCheckGateway,
  MockComplianceCheckGateway,
  MockPropertySystemGateway,
} from './integrations';
export const stages: ApplicationStatus[] = [
  'Invited to Apply',
  'Application Started',
  'Application Submitted',
  'Documents Required',
  'Documents Complete',
  'ID Verification',
  'Credit Check',
  'FCDO Check',
  'Staff Review',
  'Internal Approval',
  'Landlord Review',
  'Approved',
  'Rejected',
  'Withdrawn',
];
export const requiredDocuments = [
  'Photo ID',
  'Proof of Address',
  'Proof of Income',
  'Bank Statement',
];
export const roleNames: Record<Role, string> = {
  ADMIN: 'Administrator',
  APPLICATIONS: 'Applications Officer',
  PROPERTY_MANAGER: 'Property Manager',
  FIELD_OFFICER: 'Field Officer',
  APPLICANT: 'Applicant',
};
export const can = (user: User | null, area: string) =>
  !!user &&
  (user.role === 'ADMIN' ||
    (
      {
        APPLICATIONS: [
          'dashboard',
          'properties',
          'listings',
          'viewings',
          'applications',
          'applicants',
          'documents',
          'notifications',
          'emails',
          'audit',
        ],
        PROPERTY_MANAGER: [
          'dashboard',
          'properties',
          'listings',
          'viewings',
          'applications',
          'applicants',
          'visits',
          'inspections',
          'documents',
          'notifications',
          'emails',
          'audit',
        ],
        FIELD_OFFICER: ['dashboard', 'field', 'visits', 'viewings', 'inspections', 'notifications'],
        APPLICANT: ['apply', 'notifications'],
      }[user.role] || []
    ).includes(area));
const id = (prefix: string) => prefix + '-' + crypto.randomUUID().slice(0, 8);
const now = () => new Date().toISOString();
export class PortalService {
  private repo: UnitOfWork;
  private email = new MockEmailGateway();
  constructor(adapter: StorageAdapter) {
    this.repo = new UnitOfWork(adapter);
  }
  snapshot() {
    return this.repo.read();
  }
  reset(user: User) {
    this.require(user, 'demo');
    return this.repo.reset();
  }
  private require(user: User, area: string) {
    if (!can(user, area)) throw Error('You do not have permission to perform this action.');
  }
  private appAccess(user: User, a: Application) {
    if (user.role === 'APPLICANT') {
      if (a.applicantId !== user.applicantId)
        throw Error('This application belongs to another applicant.');
    } else if (user.role === 'FIELD_OFFICER') {
      const d = this.repo.read();
      if (!d.viewings.some((v) => v.applicationId === a.id && v.officerId === user.id))
        throw Error('This applicant preview is not linked to your viewing.');
    } else this.require(user, 'applications');
  }
  private activity(
    d: Database,
    u: User,
    action: string,
    entityId: string,
    propertyId?: string,
    description = action,
  ) {
    d.auditLogs.unshift({
      id: id('AUD'),
      timestamp: now(),
      user: u.name,
      role: u.role,
      action,
      entityType: entityId.split('-')[0],
      entityId,
      propertyId,
      description,
    });
  }
  private notify(d: Database, title: string, link: string, userId = 'U2') {
    d.notifications.unshift({
      id: id('NOT'),
      title,
      description: 'Demo workflow activity',
      link,
      userId,
      date: now(),
      read: false,
      type: 'Activity',
    });
  }
  private create(d: Database, applicantId: string, propertyId: string) {
    const a: Application = {
      id: id('APP'),
      applicantId,
      propertyId,
      assignedId: 'U2',
      status: 'Invited to Apply',
      createdAt: now(),
      form: {
        fullName: d.applicants.find((x) => x.id === applicantId)?.name || '',
        email: d.applicants.find((x) => x.id === applicantId)?.email || '',
      },
      checks: {
        identity: { provider: 'Demo Identity', reference: '', status: 'Not Started', notes: '' },
        credit: {
          provider: 'Simulated Experian',
          reference: '',
          status: 'Not Requested',
          notes: '',
        },
        fcdo: { provider: 'Demo Compliance', reference: '', status: 'Not Started', notes: '' },
      },
      declaration: false,
      recommendation: '',
    };
    d.applications.unshift(a);
    return a;
  }
  createApplication(u: User, applicantId: string, propertyId: string) {
    this.require(u, 'applications');
    let appId = '';
    this.repo.commit((d) => {
      const a = this.create(d, applicantId, propertyId);
      appId = a.id;
      this.activity(d, u, 'Application created', a.id, propertyId);
    });
    return appId;
  }
  updateProperty(u: User, propertyId: string, patch: Partial<Property>) {
    this.require(u, 'listings');
    this.repo.commit((d) => {
      const p = d.properties.find((x) => x.id === propertyId)!;
      Object.assign(p, patch);
      if (p.status === 'Live' || p.status === 'Application Open') p.portals = 'Simulated published';
      this.activity(d, u, 'Listing updated', p.id, p.id);
    });
  }
  scheduleViewing(u: User, propertyId: string, applicantId: string, date: string, time: string) {
    this.require(u, 'viewings');
    if (!date || !time) throw Error('Choose a date and time.');
    this.repo.commit((d) => {
      const viewingId = id('VIEW');
      d.viewings.unshift({
        id: viewingId,
        propertyId,
        applicantId,
        date,
        time,
        officerId: 'U4',
        status: 'Scheduled',
        notes: '',
        outcome: '',
      });
      d.visits.unshift({
        id: id('VIS'),
        propertyId,
        viewingId,
        officerId: 'U4',
        date,
        time,
        type: 'Viewing',
        status: 'Scheduled',
        occupant: d.applicants.find((a) => a.id === applicantId)!.name,
        instructions: 'Meet at main entrance',
        access: 'Contact office for keys',
      });
      this.activity(d, u, 'Viewing scheduled', viewingId, propertyId);
      this.notify(d, 'New viewing scheduled', '/field/today', 'U4');
    });
  }
  viewingAction(u: User, viewingId: string, status: string, notes?: string) {
    this.require(u, 'viewings');
    let appId = '';
    this.repo.commit((d) => {
      const v = d.viewings.find((x) => x.id === viewingId)!;
      if (u.role === 'FIELD_OFFICER' && v.officerId !== u.id)
        throw Error('This viewing is assigned to another officer.');
      v.status = status;
      if (notes !== undefined) v.notes = notes;
      if (status === 'Completed') {
        let a = d.applications.find((x) => x.id === v.applicationId);
        if (!a) {
          a = this.create(d, v.applicantId, v.propertyId);
          v.applicationId = a.id;
          d.emails.unshift(
            this.email.send(
              d.applicants.find((x) => x.id === v.applicantId)!.email,
              'Application Invitation',
              a.id,
            ),
          );
          this.activity(d, u, 'Application invitation generated', a.id, v.propertyId);
          this.notify(d, 'Application invitation generated', '/applications/' + a.id);
        }
        appId = a.id;
      }
      d.visits.filter((x) => x.viewingId === v.id).forEach((x) => (x.status = status));
      this.activity(d, u, 'Viewing ' + status.toLowerCase(), v.id, v.propertyId);
    });
    return appId;
  }
  saveApplication(u: User, appId: string, form: Record<string, string>, declaration: boolean) {
    this.repo.commit((d) => {
      const a = d.applications.find((x) => x.id === appId)!;
      this.appAccess(u, a);
      if (!['Invited to Apply', 'Application Started', 'Documents Required'].includes(a.status))
        throw Error('Submitted details are locked until more information is requested.');
      a.form = form;
      a.declaration = declaration;
      if (a.status === 'Invited to Apply') a.status = 'Application Started';
    });
  }
  submit(u: User, appId: string) {
    this.repo.commit((d) => {
      const a = d.applications.find((x) => x.id === appId)!;
      this.appAccess(u, a);
      if (!['Invited to Apply', 'Application Started', 'Documents Required'].includes(a.status))
        throw Error('Application already submitted.');
      const fields = [
        'fullName',
        'email',
        'phone',
        'dob',
        'currentAddress',
        'previousAddress',
        'employer',
        'jobTitle',
        'employment',
        'income',
        'household',
        'rentalHistory',
        'reference',
      ];
      if (fields.some((k) => !a.form[k]?.trim()) || !a.declaration)
        throw Error('Complete all required details and accept the declaration.');
      if (
        !/^\S+@\S+\.\S+$/.test(a.form.email) ||
        Number(a.form.income) <= 0 ||
        a.form.dob >= new Date().toISOString().slice(0, 10)
      )
        throw Error('Check your email, date of birth and annual income.');
      if (
        requiredDocuments.some(
          (t) =>
            !d.documents.some(
              (x) =>
                x.applicationId === appId &&
                x.type === t &&
                !['Rejected', 'Replacement Required'].includes(x.status),
            ),
        )
      )
        throw Error('Upload all four required document types.');
      a.status = 'Application Submitted';
      a.checks.identity = new MockIdentityVerificationGateway().run('Pending');
      a.checks.credit = new MockCreditCheckGateway().run('Processing');
      a.checks.fcdo = new MockComplianceCheckGateway().run('Pending');
      this.activity(d, u, 'Application submitted', a.id, a.propertyId);
      this.activity(d, u, 'Simulated checks requested', a.id, a.propertyId);
      this.notify(d, 'New application submitted', '/applications/' + a.id);
      d.emails.unshift(this.email.send(a.form.email, 'Application received', a.id));
    });
  }
  upload(u: User, appId: string, type: string, file: Pick<File, 'name' | 'type' | 'size'>) {
    if (
      !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) ||
      file.size > 5 * 1024 * 1024 ||
      file.size === 0
    )
      throw Error('Choose a PDF, JPG or PNG file between 1 byte and 5 MB.');
    this.repo.commit((d) => {
      const a = d.applications.find((x) => x.id === appId)!;
      this.appAccess(u, a);
      if (['Approved', 'Rejected', 'Withdrawn'].includes(a.status))
        throw Error('Documents are read-only after a final decision.');
      d.documents = d.documents.filter((x) => !(x.applicationId === appId && x.type === type));
      d.documents.unshift({
        id: id('DOC'),
        applicationId: appId,
        type,
        name: file.name,
        mime: file.type,
        size: file.size,
        uploadedAt: now(),
        status: 'Needs Review',
        reason: '',
      });
      this.activity(d, u, 'Document uploaded', appId, a.propertyId, type);
      this.notify(d, 'Document ready for review', '/applications/' + appId);
    });
  }
  reviewDocument(u: User, docId: string, status: Document['status'], reason: string) {
    this.require(u, 'applications');
    if (status === 'Replacement Required' && !reason.trim())
      throw Error('Explain which replacement document is required.');
    this.repo.commit((d) => {
      const doc = d.documents.find((x) => x.id === docId)!;
      doc.status = status;
      doc.reason = reason;
      const a = d.applications.find((x) => x.id === doc.applicationId)!;
      if (['Approved', 'Rejected', 'Withdrawn'].includes(a.status))
        throw Error('Document reviews are locked after a final decision.');
      if (status === 'Replacement Required') {
        a.status = 'Documents Required';
        d.emails.unshift(this.email.send(a.form.email, 'Replacement document requested', a.id));
      } else if (
        requiredDocuments.every((t) =>
          d.documents.some(
            (x) => x.applicationId === a.id && x.type === t && x.status === 'Accepted',
          ),
        ) &&
        ['Application Submitted', 'Documents Required'].includes(a.status)
      ) {
        a.status = 'Documents Complete';
        this.activity(d, u, 'Documents complete', a.id, a.propertyId);
      }
      this.activity(
        d,
        u,
        'Document ' + status.toLowerCase(),
        a.id,
        a.propertyId,
        reason || doc.type,
      );
      this.notify(
        d,
        'Document review updated',
        '/apply/' + a.id,
        d.users.find((x) => x.applicantId === a.applicantId)?.id || 'APPLICANT:' + a.applicantId,
      );
    });
  }
  runCheck(u: User, appId: string, kind: keyof Application['checks'], result: string) {
    this.require(u, 'applications');
    this.repo.commit((d) => {
      const a = d.applications.find((x) => x.id === appId)!;
      if (['Approved', 'Rejected', 'Withdrawn'].includes(a.status))
        throw Error('Verification checks are locked after a final decision.');
      a.checks[kind] = {
        identity: new MockIdentityVerificationGateway(),
        credit: new MockCreditCheckGateway(),
        fcdo: new MockComplianceCheckGateway(),
      }[kind].run(result);
      this.activity(d, u, kind + ' check simulated: ' + result, a.id, a.propertyId);
      this.notify(d, kind + ' check updated', '/applications/' + a.id);
    });
  }
  transition(u: User, appId: string, status: ApplicationStatus, reason: string) {
    this.require(u, 'applications');
    this.repo.commit((d) => {
      const a = d.applications.find((x) => x.id === appId)!;
      if (['Approved', 'Rejected', 'Withdrawn'].includes(a.status))
        throw Error('This application has a final decision.');
      if (['Internal Approval', 'Landlord Review', 'Approved'].includes(status)) {
        if (
          requiredDocuments.some(
            (t) =>
              !d.documents.some(
                (x) => x.applicationId === a.id && x.type === t && x.status === 'Accepted',
              ),
          )
        )
          throw Error('Accept all required documents before approval.');
        if (
          a.checks.identity.status !== 'Verified' ||
          a.checks.credit.status !== 'Passed' ||
          a.checks.fcdo.status !== 'Clear'
        )
          throw Error('Resolve all verification checks before approval.');
      }
      if (status === 'Landlord Review' && a.status !== 'Internal Approval')
        throw Error('Approve internally before sending to the landlord.');
      if (status === 'Approved' && a.status !== 'Landlord Review')
        throw Error('Send to the landlord before recording approval.');
      if (!reason.trim()) throw Error('Add a reason or recommendation.');
      if (status === 'Internal Approval' && a.status !== 'Staff Review')
        throw Error('Move the application to staff review before internal approval.');
      a.status = status;
      a.recommendation = reason;
      this.activity(d, u, 'Application: ' + status, a.id, a.propertyId, reason);
      this.notify(d, 'Application ' + status.toLowerCase(), '/applications/' + a.id);
      if (status === 'Landlord Review')
        d.properties.find((p) => p.id === a.propertyId)!.status = 'Under Offer';
      const applicantUser = d.users.find((x) => x.applicantId === a.applicantId);
      if (applicantUser)
        this.notify(d, 'Application status: ' + status, '/apply/' + a.id, applicantUser.id);
      if (status === 'Landlord Review')
        d.emails.unshift(
          this.email.send(
            d.landlords.find(
              (l) => l.id === d.properties.find((p) => p.id === a.propertyId)!.landlordId,
            )!.email,
            'Landlord Approval Pack',
            a.id,
          ),
        );
      if (status === 'Documents Required')
        d.emails.unshift(this.email.send(a.form.email, 'More information requested', a.id));
      if (status === 'Approved')
        d.properties.find((p) => p.id === a.propertyId)!.status = 'Let Agreed';
    });
  }
  note(u: User, entityId: string, content: string, category: string, propertyId?: string) {
    if (u.role === 'APPLICANT') throw Error('Internal notes are staff only.');
    if (!content.trim()) throw Error('Enter a note.');
    this.repo.commit((d) => {
      d.notes.unshift({ id: id('NOTE'), entityId, content, category, author: u.name, date: now() });
      this.activity(d, u, 'Internal note added', entityId, propertyId, content);
    });
  }
  changeSchedule(u: User) {
    this.require(u, u.role === 'ADMIN' ? 'demo' : 'visits');
    this.repo.commit((d) => {
      const v = d.visits.find((x) => x.status === 'Scheduled');
      if (!v) throw Error('No scheduled visits to change.');
      const [h, m] = v.time.split(':').map(Number);
      const total = h * 60 + m + 45;
      v.time = `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
      v.updated = true;
      if (v.viewingId) {
        const viewing = d.viewings.find((x) => x.id === v.viewingId)!;
        viewing.time = v.time;
      }
      this.activity(d, u, 'Visit rescheduled', v.id, v.propertyId);
      this.notify(d, 'Visit rescheduled to ' + v.time, '/field/visits/' + v.id, v.officerId);
    });
  }
  visitAction(u: User, visitId: string, status: string) {
    this.require(u, 'visits');
    this.repo.commit((d) => {
      const v = d.visits.find((x) => x.id === visitId)!;
      if (u.role === 'FIELD_OFFICER' && v.officerId !== u.id)
        throw Error('Visit assigned to another officer.');
      if (
        status === 'Completed' &&
        v.type === 'Routine Inspection' &&
        !d.inspections.some((i) => i.visitId === v.id && i.status === 'Submitted')
      )
        throw Error('Submit the inspection before completing this visit.');
      v.status = status;
      this.activity(d, u, 'Visit ' + status, v.id, v.propertyId);
    });
  }
  saveInspection(u: User, inspection: Inspection, submit = false) {
    this.require(u, 'inspections');
    this.repo.commit((d) => {
      const current = d.inspections.find((i) => i.id === inspection.id)!;
      if (u.role === 'FIELD_OFFICER' && current.officerId !== u.id)
        throw Error('Inspection assigned to another officer.');
      if (current.status === 'Submitted') throw Error('Submitted inspection is read-only.');
      if (
        submit &&
        inspection.items.some(
          (i) => !i.condition || (i.condition === 'Attention Required' && !i.comment.trim()),
        )
      )
        throw Error('Rate every section and describe each item needing attention.');
      Object.assign(current, inspection);
      if (submit) {
        current.status = 'Submitted';
        current.submittedAt = now();
        current.report = `Inspection ${current.id}\n${d.properties.find((p) => p.id === current.propertyId)!.address}\n${current.items.map((i) => `${i.name}: ${i.condition}${i.comment ? ' — ' + i.comment : ''}`).join('\n')}\nPhotos: ${current.photos.length}\n${current.notes}`;
        d.visits.find((v) => v.id === current.visitId)!.status = 'Completed';
        this.activity(d, u, 'Inspection submitted', current.id, current.propertyId);
        this.notify(d, 'Inspection submitted', '/inspections/' + current.id, 'U3');
        d.emails.unshift(
          this.email.send('david@example.test', 'Inspection report ready', current.id),
        );
      }
    });
  }
  markRead(u: User, notificationId?: string) {
    this.repo.commit((d) => {
      d.notifications
        .filter(
          (n) =>
            (u.role === 'ADMIN' || n.userId === u.id) &&
            (!notificationId || n.id === notificationId),
        )
        .forEach((n) => (n.read = true));
    });
  }
  processSubmission(u: User, submissionId: string) {
    this.require(u, 'demo');
    this.repo.commit((d) => {
      const s = d.submissions.find((x) => x.id === submissionId)!;
      if (s.status === 'Processed') throw Error('Submission already processed.');
      const a = this.create(d, s.applicantId, s.propertyId);
      a.status = 'Documents Required';
      s.applicationId = a.id;
      a.checks.identity = new MockIdentityVerificationGateway().run('Pending');
      a.checks.credit = new MockCreditCheckGateway().run('Processing');
      a.checks.fcdo = new MockComplianceCheckGateway().run('Pending');
      s.stages = [
        'Submission received',
        'Applicant parsed and matched',
        'Property matched',
        'Document metadata identified: missing required files',
        'Identity verification requested (simulated)',
        'Credit check processing (simulated)',
        'FCDO check pending (simulated)',
        new MockPropertySystemGateway().update(a.id),
        'Staff review queued; documents required',
        'Audit entry created',
      ];
      s.status = 'Processed';
      this.activity(d, u, 'JotForm submission processed', a.id, a.propertyId);
      this.notify(d, 'JotForm application requires documents', '/applications/' + a.id);
    });
  }
}
