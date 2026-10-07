import { test } from 'node:test';
import assert from 'node:assert/strict';
import { StaticJsonStorageAdapter } from '../src/services/storage/index.ts';
import { PortalService, requiredDocuments } from '../src/services/portal.ts';
const setup = () => {
  const adapter = new StaticJsonStorageAdapter();
  const service = new PortalService(adapter);
  const data = service.snapshot();
  return {
    service,
    adapter,
    admin: data.users[0],
    officer: data.users[1],
    field: data.users[3],
    applicant: data.users[4],
  };
};
const form = {
  fullName: 'Isla Campbell',
  email: 'isla@example.test',
  phone: '07700900000',
  dob: '1994-05-12',
  currentAddress: '18 Example Street EH1 1AA',
  previousAddress: 'None',
  employment: 'Employed',
  employer: 'Example Studio',
  jobTitle: 'Designer',
  income: '40000',
  household: 'One adult',
  rentalHistory: 'Three years',
  reference: 'reference@example.test',
};
test('viewing completion creates one invitation and keeps the visit synchronized', () => {
  const { service, field } = setup();
  const before = service.snapshot();
  const a = service.viewingAction(field, 'VIEW-5067', 'Completed');
  service.viewingAction(field, 'VIEW-5067', 'Completed');
  const after = service.snapshot();
  assert.equal(after.applications.length, before.applications.length + 1);
  assert.equal(after.emails.length, 1);
  assert.equal(after.viewings[0].applicationId, a);
  assert.equal(after.visits.find((v) => v.viewingId === 'VIEW-5067')?.status, 'Completed');
  assert.ok(after.auditLogs.some((a) => a.action === 'Application invitation generated'));
});
test('applicant submits, staff verifies and landlord approves a complete application', () => {
  const { service, applicant, officer } = setup();
  const appId = 'APP-3041';
  service.saveApplication(applicant, appId, form, true);
  assert.throws(() => service.submit(applicant, appId), /Upload all four/);
  for (const type of requiredDocuments)
    service.upload(applicant, appId, type, {
      name: type + '.pdf',
      type: 'application/pdf',
      size: 500,
    });
  service.submit(applicant, appId);
  assert.equal(
    service.snapshot().applications.find((a) => a.id === appId)?.status,
    'Application Submitted',
  );
  assert.throws(
    () => service.transition(officer, appId, 'Internal Approval', 'All good'),
    /Accept all required/,
  );
  for (const d of service.snapshot().documents.filter((d) => d.applicationId === appId))
    service.reviewDocument(officer, d.id, 'Accepted', '');
  assert.throws(
    () => service.transition(officer, appId, 'Internal Approval', 'All good'),
    /Resolve all verification/,
  );
  service.runCheck(officer, appId, 'identity', 'Verified');
  service.runCheck(officer, appId, 'credit', 'Passed');
  service.runCheck(officer, appId, 'fcdo', 'Clear');
  service.transition(officer, appId, 'Staff Review', 'Review started');
  service.transition(officer, appId, 'Internal Approval', 'Documents and checks clear');
  service.transition(officer, appId, 'Landlord Review', 'Recommended');
  service.transition(officer, appId, 'Approved', 'Landlord approved');
  const after = service.snapshot();
  assert.equal(after.applications.find((a) => a.id === appId)?.status, 'Approved');
  assert.equal(after.properties.find((p) => p.id === 'PROP-1001')?.status, 'Let Agreed');
  assert.ok(after.emails.some((e) => e.template === 'Landlord Approval Pack'));
  assert.throws(
    () => service.transition(officer, appId, 'Staff Review', 'Reopen'),
    /final decision/,
  );
});
test('inspection submission creates a report, audit, notification and simulated email atomically', () => {
  const { service, field } = setup();
  const i = service.snapshot().inspections[0];
  assert.throws(() => service.saveInspection(field, i, true), /Rate every section/);
  i.items.forEach((item) => (item.condition = 'Good'));
  i.items[2].condition = 'Attention Required';
  assert.throws(() => service.saveInspection(field, i, true), /describe each item/);
  i.items[2].comment = 'Small damp patch below window';
  service.saveInspection(field, i, true);
  const after = service.snapshot();
  assert.equal(after.inspections[0].status, 'Submitted');
  assert.ok(after.inspections[0].report?.includes('Small damp patch'));
  assert.equal(after.visits.find((v) => v.id === i.visitId)?.status, 'Completed');
  assert.ok(
    after.notifications.some((n) => n.title === 'Inspection submitted' && n.userId === 'U3'),
  );
  assert.ok(after.emails.some((e) => e.entityId === i.id));
  assert.throws(() => service.saveInspection(field, i), /read-only/);
});
test('permissions and document metadata validation reject invalid mutations', () => {
  const { service, applicant } = setup();
  assert.throws(
    () => service.saveApplication(applicant, 'APP-3042', form, true),
    /another applicant/,
  );
  assert.throws(() => service.runCheck(applicant, 'APP-3041', 'credit', 'Passed'), /permission/);
  assert.throws(() => service.reset(applicant), /permission/);
  assert.throws(
    () =>
      service.upload(applicant, 'APP-3041', 'Photo ID', {
        name: 'bad.exe',
        type: 'application/octet-stream',
        size: 50,
      }),
    /PDF/,
  );
  assert.throws(
    () =>
      service.upload(applicant, 'APP-3041', 'Photo ID', {
        name: 'big.pdf',
        type: 'application/pdf',
        size: 6 * 1024 * 1024,
      }),
    /5 MB/,
  );
});
test('schedule changes update linked viewing and record activity', () => {
  const { service, admin } = setup();
  service.changeSchedule(admin);
  const d = service.snapshot();
  assert.equal(d.visits[0].time, '09:45');
  assert.equal(d.viewings[0].time, '09:45');
  assert.equal(d.visits[0].updated, true);
  assert.ok(d.notifications.some((n) => n.title.includes('09:45')));
});
test('JotForm simulation produces one linked application and reset restores seed data', () => {
  const { service, admin } = setup();
  service.processSubmission(admin, 'JF-1021');
  const d = service.snapshot();
  assert.equal(d.submissions[0].status, 'Processed');
  assert.ok(d.applications.some((a) => a.id === d.submissions[0].applicationId));
  assert.throws(() => service.processSubmission(admin, 'JF-1021'), /already processed/);
  service.reset(admin);
  assert.equal(service.snapshot().applications.length, 12);
  assert.equal(service.snapshot().submissions[0].status, 'Received');
});
test('seed relations resolve correctly', () => {
  const { service } = setup();
  const d = service.snapshot();
  for (const a of d.applications) {
    assert.ok(d.properties.some((p) => p.id === a.propertyId));
    assert.ok(d.applicants.some((p) => p.id === a.applicantId));
  }
  for (const i of d.inspections) assert.ok(d.visits.some((v) => v.id === i.visitId));
  for (const doc of d.documents) assert.ok(d.applications.some((a) => a.id === doc.applicationId));
  assert.equal(d.properties.length, 18);
  assert.ok(d.auditLogs.length >= 50);
});
