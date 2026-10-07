export type Role = 'ADMIN' | 'APPLICATIONS' | 'PROPERTY_MANAGER' | 'FIELD_OFFICER' | 'APPLICANT';
export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  applicantId?: string;
}
export interface Landlord {
  id: string;
  name: string;
  email: string;
}
export interface Tenant {
  id: string;
  name: string;
  propertyId: string;
}
export interface Property {
  id: string;
  reference: string;
  address: string;
  city: string;
  postcode: string;
  bedrooms: number;
  bathrooms: number;
  type: string;
  rent: number;
  deposit: number;
  furnished: string;
  available: string;
  status: string;
  managerId: string;
  landlordId: string;
  pets: string;
  tenancy: string;
  maintenance: string;
  notes: string;
  headline: string;
  description: string;
  features: string[];
  photos?: Photo[];
  portals: string;
}
export type Listing = Pick<
  Property,
  | 'id'
  | 'headline'
  | 'description'
  | 'rent'
  | 'deposit'
  | 'available'
  | 'features'
  | 'status'
  | 'portals'
>;
export interface Applicant {
  id: string;
  name: string;
  email: string;
  phone: string;
}
export type ApplicationStatus =
  | 'Invited to Apply'
  | 'Application Started'
  | 'Application Submitted'
  | 'Documents Required'
  | 'Documents Complete'
  | 'ID Verification'
  | 'Credit Check'
  | 'FCDO Check'
  | 'Staff Review'
  | 'Internal Approval'
  | 'Landlord Review'
  | 'Approved'
  | 'Rejected'
  | 'Withdrawn';
export interface VerificationCheck {
  provider: string;
  reference: string;
  status: string;
  requestedAt?: string;
  completedAt?: string;
  notes: string;
}
export type CreditCheck = VerificationCheck;
export type FCDOCheck = VerificationCheck;
export interface Application {
  id: string;
  propertyId: string;
  applicantId: string;
  assignedId: string;
  status: ApplicationStatus;
  createdAt: string;
  form: Record<string, string>;
  checks: { identity: VerificationCheck; credit: CreditCheck; fcdo: FCDOCheck };
  declaration: boolean;
  recommendation: string;
}
export interface Viewing {
  id: string;
  propertyId: string;
  applicantId: string;
  officerId: string;
  date: string;
  time: string;
  status: string;
  outcome: string;
  notes: string;
  applicationId?: string;
}
export interface Visit {
  id: string;
  propertyId: string;
  officerId: string;
  viewingId?: string;
  date: string;
  time: string;
  type: string;
  status: string;
  occupant: string;
  instructions: string;
  access: string;
  updated?: boolean;
}
export interface InspectionItem {
  name: string;
  condition: string;
  comment: string;
}
export interface Photo {
  id: string;
  name: string;
  size: number;
  type: string;
  caption: string;
}
export interface Inspection {
  id: string;
  propertyId: string;
  visitId: string;
  officerId: string;
  status: string;
  items: InspectionItem[];
  photos: Photo[];
  notes: string;
  submittedAt?: string;
  report?: string;
}
export type DocumentStatus =
  'Missing' | 'Uploaded' | 'Needs Review' | 'Accepted' | 'Rejected' | 'Replacement Required';
export interface Document {
  id: string;
  applicationId: string;
  type: string;
  name: string;
  mime: string;
  size: number;
  uploadedAt: string;
  status: DocumentStatus;
  reason: string;
}
export interface Notification {
  id: string;
  userId: string;
  title: string;
  description: string;
  date: string;
  read: boolean;
  link: string;
  type: string;
}
export interface Note {
  id: string;
  entityId: string;
  author: string;
  date: string;
  category: string;
  content: string;
}
export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  propertyId?: string;
}
export interface Email {
  id: string;
  to: string;
  template: string;
  date: string;
  status: string;
  entityId: string;
}
export interface Submission {
  id: string;
  applicantId: string;
  propertyId: string;
  status: string;
  stages: string[];
  applicationId?: string;
}
export interface Database {
  users: User[];
  properties: Property[];
  landlords: Landlord[];
  tenants: Tenant[];
  applicants: Applicant[];
  applications: Application[];
  viewings: Viewing[];
  visits: Visit[];
  inspections: Inspection[];
  documents: Document[];
  notifications: Notification[];
  auditLogs: AuditEntry[];
  notes: Note[];
  emails: Email[];
  submissions: Submission[];
}
