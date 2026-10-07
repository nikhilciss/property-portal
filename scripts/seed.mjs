import fs from 'node:fs';
const names = [
  'Isla Campbell',
  'Euan MacLeod',
  'Sophie Fraser',
  'Callum Stewart',
  'Freya Robertson',
  'Lewis Murray',
  'Amelia Scott',
  'Finlay Reid',
  'Emily Wilson',
  'Harris MacDonald',
  'Olivia Brown',
  'Archie Davidson',
  'Grace Ross',
  'Rory Anderson',
  'Ava Mitchell',
  'Jamie Sinclair',
  'Mia Watson',
  'Alistair Grant',
];
const addresses = [
  '18 Queen Street',
  '44 George Street',
  '12 Hanover Street',
  '7 Stockbridge Terrace',
  '26 Leith Walk',
  '8 Marchmont Road',
  '31 Morningside Road',
  '14 Easter Road',
  '6 Dundas Street',
  '22 Bruntsfield Place',
  '9 Byres Road',
  '48 Great Western Road',
  '17 Hyndland Street',
  '33 Duke Street',
  '5 Union Grove',
  '19 Rosemount Place',
  '11 South Street',
  '28 Victoria Road',
];
const statuses = [
  'Live',
  'Application Open',
  'Under Offer',
  'Let Agreed',
  'Ready to Market',
  'Draft',
];
const stages = [
  'Application Started',
  'Application Submitted',
  'Documents Required',
  'Documents Complete',
  'Staff Review',
  'Landlord Review',
  'Approved',
  'Invited to Apply',
  'Credit Check',
  'Rejected',
  'ID Verification',
  'Staff Review',
];
const users = [
  { id: 'U1', name: 'Alex Morgan', role: 'ADMIN', email: 'alex@example.test' },
  { id: 'U2', name: 'Sarah Henderson', role: 'APPLICATIONS', email: 'sarah@example.test' },
  { id: 'U3', name: 'David Wallace', role: 'PROPERTY_MANAGER', email: 'david@example.test' },
  { id: 'U4', name: 'Emma Wilson', role: 'FIELD_OFFICER', email: 'emma@example.test' },
  {
    id: 'U5',
    name: names[0],
    role: 'APPLICANT',
    email: 'isla@example.test',
    applicantId: 'APL-2041',
  },
];
const check = (provider, status, i) => ({
  provider,
  status,
  reference: `DEMO-${i}`,
  notes: 'Fictional result for demonstration only.',
});
const properties = addresses.map((address, i) => ({
  id: `PROP-${1001 + i}`,
  reference: `PM-${1001 + i}`,
  address,
  city: i < 10 ? 'Edinburgh' : i < 14 ? 'Glasgow' : i < 16 ? 'Aberdeen' : 'Dundee',
  postcode:
    i < 3
      ? ['EH2 1JE', 'EH2 2LE', 'EH2 2EN'][i]
      : i < 10
        ? `EH${i + 1} 2AB`
        : i < 14
          ? `G${i - 8} 8QH`
          : i < 16
            ? 'AB10 6BS'
            : 'DD1 4HN',
  bedrooms: (i % 4) + 1,
  bathrooms: (i % 2) + 1,
  type: i % 3 ? 'Flat' : 'Terraced house',
  rent: 850 + i * 75,
  deposit: 850 + i * 75,
  furnished: i % 2 ? 'Furnished' : 'Unfurnished',
  available: '2026-10-20',
  status: statuses[i % 6],
  managerId: 'U3',
  landlordId: `LL-${(i % 6) + 1}`,
  pets: i % 3 ? 'By agreement' : 'One cat approved',
  tenancy: i % 4 ? 'Available' : 'Occupied',
  maintenance: i % 3 ? 'No outstanding maintenance' : 'Kitchen tap repair awaiting contractor',
  notes: 'Fictional property. Please give occupants 24 hours notice.',
  headline: `Bright ${(i % 4) + 1}-bedroom home in ${i < 10 ? 'Edinburgh' : i < 14 ? 'Glasgow' : i < 16 ? 'Aberdeen' : 'Dundee'}`,
  description:
    'A well-proportioned home with generous natural light, a welcoming living space and convenient access to local shops and public transport.',
  features: ['Gas central heating', 'Double glazing', 'Excellent transport links'],
  portals: i % 6 < 2 ? 'Simulated published' : 'Not published',
}));
const applicants = names.map((name, i) => ({
  id: `APL-${2041 + i}`,
  name,
  email: `${name.toLowerCase().split(' ')[0]}${i}@example.test`,
  phone: `07700 900${String(i).padStart(3, '0')}`,
}));
const applications = stages.map((status, i) => ({
  id: `APP-${3041 + i}`,
  propertyId: properties[i].id,
  applicantId: applicants[i].id,
  assignedId: 'U2',
  status,
  createdAt: `2026-10-${String((i % 6) + 1).padStart(2, '0')}T09:00:00Z`,
  form:
    i === 0
      ? { fullName: names[0], email: applicants[0].email }
      : {
          fullName: names[i],
          email: applicants[i].email,
          phone: applicants[i].phone,
          dob: '1994-05-12',
          currentAddress: '24 Example Road, Edinburgh EH1 1AA',
          previousAddress: '6 Sample Street, Glasgow G1 2AB',
          employer: 'Caledonia Design (fictional)',
          jobTitle: 'Project coordinator',
          employment: 'Employed',
          income: '38000',
          household: '2 adults',
          rentalHistory: 'Current tenancy: 3 years',
          reference: 'Previous landlord — reference@example.test',
          additional: 'No additional requirements',
        },
  checks: {
    identity: check('Demo Identity', i > 3 ? 'Verified' : 'Not Started', i),
    credit: check('Simulated Experian', i > 3 ? 'Passed' : 'Not Requested', i),
    fcdo: check('Demo Compliance', i > 3 ? 'Clear' : 'Not Started', i),
  },
  declaration: i > 0,
  recommendation: 'Income and references support this application.',
}));
const viewings = Array.from({ length: 24 }, (_, i) => ({
  id: `VIEW-${5067 + i}`,
  propertyId: properties[i % 18].id,
  applicantId: applicants[i % 18].id,
  officerId: 'U4',
  date: i < 8 ? '2026-10-07' : `2026-10-${String(8 + (i % 5)).padStart(2, '0')}`,
  time: `${String(9 + Math.floor((i % 8) / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`,
  status: i % 5 === 0 ? 'Confirmed' : 'Scheduled',
  outcome: '',
  notes: 'Meet at the main entrance.',
}));
const visits = Array.from({ length: 18 }, (_, i) => ({
  id: `VIS-${6001 + i}`,
  propertyId: properties[i].id,
  officerId: 'U4',
  ...(i % 2 === 0 ? { viewingId: viewings[i].id } : {}),
  date: i < 6 ? '2026-10-07' : '2026-10-08',
  time: `${String(9 + Math.floor((i % 6) / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`,
  type: i % 2 ? 'Routine Inspection' : 'Viewing',
  status: 'Scheduled',
  occupant: applicants[i].name,
  instructions: 'Please confirm arrival with the occupant. Leave all doors secure.',
  access: 'Demo key reference K-' + (100 + i),
}));
const sections = [
  'General condition',
  'Entrance',
  'Living room',
  'Kitchen',
  'Bedrooms',
  'Bathrooms',
  'Heating',
  'Windows',
  'Safety observations',
  'Garden / exterior',
  'Cleanliness',
  'Pets observed',
  'Damp / mould',
  'Maintenance issues',
];
const inspections = visits
  .filter((v) => v.type === 'Routine Inspection')
  .map((v, i) => ({
    id: `INS-${7012 + i}`,
    propertyId: v.propertyId,
    visitId: v.id,
    officerId: v.officerId,
    status: 'Draft',
    items: sections.map((name) => ({ name, condition: '', comment: '' })),
    photos: [],
    notes: '',
  }));
const documentTypes = ['Photo ID', 'Proof of Address', 'Proof of Income', 'Bank Statement'];
const documentNames = ['passport.pdf', 'council-tax.pdf', 'payslip.pdf', 'bank-statement.pdf'];
const documents = applications.flatMap((a, i) =>
  Array.from({ length: [0, 2, 1, 4, 4, 4, 4, 0, 4, 2, 4, 4][i] }, (_, j) => ({
    id: `DOC-${8001 + i * 4 + j}`,
    applicationId: a.id,
    type: documentTypes[j],
    name: documentNames[j],
    mime: 'application/pdf',
    size: 185000,
    uploadedAt: '2026-10-05T10:00:00Z',
    status: i >= 3 ? 'Accepted' : 'Needs Review',
    reason: '',
  })),
);
applications.forEach((a) => {
  if (a.status === 'Approved') properties.find((p) => p.id === a.propertyId).status = 'Let Agreed';
  if (a.status === 'Landlord Review')
    properties.find((p) => p.id === a.propertyId).status = 'Under Offer';
  if (a.status === 'ID Verification') a.checks.identity.status = 'Pending';
  if (a.status === 'Credit Check') a.checks.credit.status = 'Processing';
});
const notifications = Array.from({ length: 32 }, (_, i) => ({
  id: `NOT-${9001 + i}`,
  userId: i % 3 ? 'U2' : 'U3',
  title: [
    'Application received',
    'Document ready for review',
    'Inspection due',
    'Verification completed',
  ][i % 4],
  description: `${names[i % 12]} · ${addresses[i % 12]}`,
  date: `2026-10-0${(i % 6) + 1}T10:00:00Z`,
  read: i > 7,
  link: `/applications/${applications[i % 12].id}`,
  type: 'Activity',
}));
const auditLogs = Array.from({ length: 54 }, (_, i) => ({
  id: `AUD-${i + 1}`,
  timestamp: `2026-10-0${(i % 6) + 1}T09:30:00Z`,
  user: 'Sarah Henderson',
  role: 'APPLICATIONS',
  action: ['Application created', 'Documents reviewed', 'Application updated'][i % 3],
  entityType: 'Application',
  entityId: applications[i % 12].id,
  propertyId: applications[i % 12].propertyId,
  description: 'Fictional seeded activity for the client demonstration.',
}));
const data = {
  users,
  properties,
  applicants,
  applications,
  viewings,
  visits,
  inspections,
  documents,
  notifications,
  auditLogs,
  landlords: Array.from({ length: 6 }, (_, i) => ({
    id: `LL-${i + 1}`,
    name: [
      'Douglas Kerr',
      'Fiona MacKenzie',
      'Andrew Graham',
      'Kirsty Bell',
      'Ian Morrison',
      'Morag Young',
    ][i],
    email: `landlord${i}@example.test`,
  })),
  tenants: properties
    .filter((_, i) => i % 4 === 0)
    .map((p, i) => ({ id: `TEN-${i}`, name: names[i + 4], propertyId: p.id })),
  notes: [],
  emails: [],
  submissions: Array.from({ length: 3 }, (_, i) => ({
    id: `JF-${1021 + i}`,
    applicantId: applicants[15 + i].id,
    propertyId: properties[15 + i].id,
    status: 'Received',
    stages: [],
  })),
};
for (const [key, value] of Object.entries(data))
  fs.writeFileSync(`src/data/${key}.json`, JSON.stringify(value, null, 2) + '\n');
