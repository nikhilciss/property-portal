import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { portal, usePortal } from '../app/context';
import { stages, requiredDocuments } from '../services/portal';
import type { Application, ApplicationStatus } from '../types';
import {
  Badge,
  Card,
  Confirm,
  DataTable,
  Empty,
  Filters,
  Heading,
  Modal,
  Tabs,
  money,
  date,
} from '../components/ui';
import { UploadDocuments } from './Documents';
import { Notes, Timeline } from './shared';
export function Applications({ pipeline = false }: { pipeline?: boolean }) {
  const { data, user, act } = usePortal();
  const [params] = useSearchParams();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(params.get('status') || '');
  const [property, setProperty] = useState('');
  const [officer, setOfficer] = useState('');
  const [day, setDay] = useState('');
  const [sort, setSort] = useState('newest');
  const [create, setCreate] = useState(false);
  const rows = data.applications
    .filter(
      (a) =>
        (
          a.id +
          ' ' +
          data.applicants.find((x) => x.id === a.applicantId)?.name +
          ' ' +
          data.properties.find((p) => p.id === a.propertyId)?.address
        )
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (!status || a.status === status) &&
        (!property || a.propertyId === property) &&
        (!officer || a.assignedId === officer) &&
        (!day || a.createdAt.startsWith(day)),
    )
    .sort((a, b) =>
      sort === 'newest'
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt),
    );
  return (
    <>
      <Heading
        eyebrow="LETTINGS WORKSPACE"
        title="Applications"
        description="Keep every applicant moving, from invitation to decision."
      >
        <button className="primary" onClick={() => setCreate(true)}>
          + New application
        </button>
      </Heading>
      <div className="tabs">
        <Link className={!pipeline ? 'active' : ''} to="/applications">
          All applications
        </Link>
        <Link className={pipeline ? 'active' : ''} to="/applications/pipeline">
          Pipeline board
        </Link>
      </div>
      <Card>
        <Filters
          query={query}
          onQuery={setQuery}
          status={status}
          onStatus={setStatus}
          statuses={stages}
          onClear={() => {
            setProperty('');
            setOfficer('');
            setDay('');
          }}
        >
          <select
            aria-label="Property"
            value={property}
            onChange={(e) => setProperty(e.target.value)}
          >
            <option value="">All properties</option>
            {data.properties.map((p) => (
              <option value={p.id} key={p.id}>
                {p.address}
              </option>
            ))}
          </select>
          <select
            aria-label="Assigned officer"
            value={officer}
            onChange={(e) => setOfficer(e.target.value)}
          >
            <option value="">All officers</option>
            <option value="U2">Sarah Henderson</option>
          </select>
          <input
            type="date"
            aria-label="Application date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
          <select
            aria-label="Sort applications"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </Filters>
        {pipeline ? (
          <div className="kanban">
            {stages.map((s) => (
              <section key={s}>
                <h3>
                  {s}
                  <span>{rows.filter((a) => a.status === s).length}</span>
                </h3>
                {rows
                  .filter((a) => a.status === s)
                  .map((a) => (
                    <Link className="kanban-card" to={'/applications/' + a.id} key={a.id}>
                      <small>{a.id}</small>
                      <strong>{data.applicants.find((x) => x.id === a.applicantId)?.name}</strong>
                      <p>{data.properties.find((p) => p.id === a.propertyId)?.address}</p>
                      <Badge>
                        {data.documents.filter((d) => d.applicationId === a.id).length}/4 documents
                      </Badge>
                    </Link>
                  ))}
                {!rows.some((a) => a.status === s) && <p className="muted">No applications</p>}
              </section>
            ))}
          </div>
        ) : (
          <DataTable
            rows={rows}
            keyOf={(a) => a.id}
            columns={[
              {
                label: 'Applicant',
                render: (a) => (
                  <Link to={'/applications/' + a.id}>
                    <strong>{data.applicants.find((x) => x.id === a.applicantId)?.name}</strong>
                    <small>{a.id}</small>
                  </Link>
                ),
              },
              {
                label: 'Property',
                render: (a) => data.properties.find((p) => p.id === a.propertyId)?.address,
              },
              { label: 'Status', render: (a) => <Badge>{a.status}</Badge> },
              {
                label: 'Documents',
                render: (a) =>
                  `${data.documents.filter((d) => d.applicationId === a.id && d.status === 'Accepted').length} / 4 accepted`,
              },
              {
                label: 'Assigned to',
                render: (a) => data.users.find((u) => u.id === a.assignedId)?.name,
              },
              { label: 'Received', render: (a) => date(a.createdAt) },
            ]}
          />
        )}
      </Card>
      {create && (
        <Modal title="Create application" onClose={() => setCreate(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (
                act(
                  () =>
                    portal.createApplication(
                      user!,
                      String(f.get('applicant')),
                      String(f.get('property')),
                    ),
                  'Application created',
                )
              )
                setCreate(false);
            }}
          >
            <label>
              Applicant
              <select name="applicant">
                {data.applicants.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Property
              <select name="property">
                {data.properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.address}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary">Create application</button>
          </form>
        </Modal>
      )}
    </>
  );
}
const checkOptions = {
  identity: ['Not Started', 'Pending', 'Verified', 'Failed', 'Manual Review Required'],
  credit: ['Not Requested', 'Requested', 'Processing', 'Passed', 'Refer', 'Failed'],
  fcdo: ['Not Started', 'Pending', 'Clear', 'Potential Match', 'Manual Review'],
};
export function Checks({
  app,
  readOnly = false,
  kind,
}: {
  app: Application;
  readOnly?: boolean;
  kind?: keyof Application['checks'];
}) {
  const { user, act } = usePortal();
  return (
    <div className="check-grid">
      {(Object.keys(app.checks) as (keyof Application['checks'])[])
        .filter((k) => !kind || kind === k)
        .map((k) => (
          <Card
            key={k}
            title={
              k === 'identity'
                ? 'Identity verification'
                : k === 'credit'
                  ? 'Credit check'
                  : 'FCDO check'
            }
          >
            <div className="eyebrow">DEMO / SIMULATED</div>
            <p>{app.checks[k].provider}</p>
            <Badge>{app.checks[k].status}</Badge>
            <dl>
              <div>
                <dt>Reference</dt>
                <dd>{app.checks[k].reference || 'Not requested'}</dd>
              </div>
              <div>
                <dt>Requested</dt>
                <dd>{app.checks[k].requestedAt ? date(app.checks[k].requestedAt!) : '—'}</dd>
              </div>
              <div>
                <dt>Completed</dt>
                <dd>
                  {app.checks[k].completedAt &&
                  !['Pending', 'Processing'].includes(app.checks[k].status)
                    ? date(app.checks[k].completedAt!)
                    : 'Pending'}
                </dd>
              </div>
            </dl>
            <p className="muted">{app.checks[k].notes || 'No real verification has occurred.'}</p>
            {!readOnly && (
              <label>
                Simulate result
                <select
                  aria-label={'Simulate ' + k + ' result'}
                  value={app.checks[k].status}
                  onChange={(e) =>
                    act(
                      () => portal.runCheck(user!, app.id, k, e.target.value),
                      'Simulated check recorded',
                    )
                  }
                >
                  {checkOptions[k].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            )}
          </Card>
        ))}
    </div>
  );
}
export function ApplicationDetail() {
  const { applicationId } = useParams();
  const { data, user, act } = usePortal();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') || 'Overview');
  const [action, setAction] = useState<ApplicationStatus | null>(null);
  const [pack, setPack] = useState(false);
  const a = data.applications.find((x) => x.id === applicationId);
  if (!a) return <Empty title="Application not found" />;
  const applicant = data.applicants.find((x) => x.id === a.applicantId)!;
  const p = data.properties.find((x) => x.id === a.propertyId)!;
  const docs = data.documents.filter(
    (d) => d.applicationId === a.id && d.status === 'Accepted',
  ).length;
  return (
    <>
      <Heading
        eyebrow={'APPLICATIONS / ' + a.id}
        title={applicant.name}
        description={p.address + ' · ' + money(p.rent) + ' pcm'}
      >
        <Badge>{a.status}</Badge>
        <Link className="button" to={'/apply/' + a.id}>
          Applicant preview
        </Link>
        <button className="primary" onClick={() => setPack(true)}>
          Landlord approval pack
        </button>
      </Heading>
      <div className="summary-strip">
        <div>
          <small>ANNUAL INCOME</small>
          <strong>{money(Number(a.form.income || 0))}</strong>
        </div>
        <div>
          <small>DOCUMENTS ACCEPTED</small>
          <strong>
            {docs} / {requiredDocuments.length}
          </strong>
        </div>
        <div>
          <small>IDENTITY</small>
          <Badge>{a.checks.identity.status}</Badge>
        </div>
        <div>
          <small>CREDIT</small>
          <Badge>{a.checks.credit.status}</Badge>
        </div>
        <div>
          <small>FCDO</small>
          <Badge>{a.checks.fcdo.status}</Badge>
        </div>
      </div>
      <Tabs
        tabs={[
          'Overview',
          'Applicant',
          'Property',
          'Application',
          'Documents',
          'Verification',
          'Credit Check',
          'FCDO Check',
          'Notes',
          'Timeline',
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'Overview' && (
        <div className="two-col">
          <Card title="Application review">
            <dl>
              <div>
                <dt>Received</dt>
                <dd>{date(a.createdAt)}</dd>
              </div>
              <div>
                <dt>Assigned officer</dt>
                <dd>Sarah Henderson</dd>
              </div>
              <div>
                <dt>Household</dt>
                <dd>{a.form.household || 'Awaiting details'}</dd>
              </div>
              <div>
                <dt>Employment</dt>
                <dd>{a.form.employer || 'Awaiting details'}</dd>
              </div>
            </dl>
            <div className="subtle-box">
              Approval requires four accepted documents and clear simulated checks. Review the
              application before making a recommendation.
            </div>
            <div className="actions wrap">
              {(
                [
                  'Documents Required',
                  'Staff Review',
                  'Internal Approval',
                  'Rejected',
                  'Landlord Review',
                ] as ApplicationStatus[]
              ).map((s) => (
                <button
                  key={s}
                  className={s === 'Internal Approval' ? 'primary' : ''}
                  onClick={() => setAction(s)}
                >
                  {s === 'Documents Required'
                    ? 'Request more information'
                    : s === 'Internal Approval'
                      ? 'Approve internally'
                      : s === 'Landlord Review'
                        ? 'Send to landlord'
                        : s === 'Rejected'
                          ? 'Reject'
                          : 'Move to review'}
                </button>
              ))}
            </div>
          </Card>
          <Timeline entityId={a.id} />
        </div>
      )}
      {['Applicant', 'Application'].includes(tab) && (
        <Card title="Submitted details">
          <dl>
            {Object.entries(a.form).map(([k, v]) => (
              <div key={k}>
                <dt>{k.replace(/([A-Z])/g, ' $1')}</dt>
                <dd>{v || 'Not provided'}</dd>
              </div>
            ))}
          </dl>
          <Badge>{a.declaration ? 'Declaration accepted' : 'Declaration pending'}</Badge>
        </Card>
      )}
      {tab === 'Property' && (
        <Card title={p.address}>
          <p>{p.description}</p>
          <p>
            {money(p.rent)} pcm · {p.bedrooms} bedrooms · {p.pets}
          </p>
          <Link to={'/properties/' + p.id}>Open property →</Link>
        </Card>
      )}
      {tab === 'Documents' && <UploadDocuments appId={a.id} staff />}
      {tab === 'Verification' && <Checks app={a} kind="identity" />}
      {tab === 'Credit Check' && <Checks app={a} kind="credit" />}
      {tab === 'FCDO Check' && <Checks app={a} kind="fcdo" />}
      {tab === 'Notes' && <Notes entityId={a.id} propertyId={p.id} />}
      {tab === 'Timeline' && <Timeline entityId={a.id} />}
      {action && (
        <Confirm
          title={
            {
              'Documents Required': 'Request more information',
              'Staff Review': 'Move to staff review',
              'Internal Approval': 'Approve internally',
              'Landlord Review': 'Send approval pack to landlord',
              Approved: 'Record landlord approval',
              Rejected: 'Record rejection',
            }[action as string] || action
          }
          description="This action updates the application and creates an audit record. Emails, where applicable, are simulated."
          onClose={() => setAction(null)}
          onConfirm={(reason) => {
            if (act(() => portal.transition(user!, a.id, action, reason), 'Application updated'))
              setAction(null);
          }}
        />
      )}
      {pack && (
        <Modal title="Landlord approval pack" onClose={() => setPack(false)}>
          <div className="eyebrow">CONFIDENTIAL · DEMO PREVIEW</div>
          <h3>{p.address}</h3>
          <dl>
            {Object.entries({
              Applicant: applicant.name,
              Contact: '••••••@example.test',
              Employment: a.form.employer || 'Not provided',
              'Job title': a.form.jobTitle || 'Not provided',
              'Annual income': money(Number(a.form.income || 0)),
              Household: a.form.household || 'Not provided',
              References: a.form.reference ? 'Reference details held by agency' : 'Not supplied',
              Documents: `${docs}/4 accepted`,
              Identity: a.checks.identity.status,
              Credit: a.checks.credit.status,
              FCDO: a.checks.fcdo.status,
              'Staff recommendation': a.recommendation || 'Awaiting review',
            }).map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="actions wrap">
            <button
              className="primary"
              onClick={() => {
                setPack(false);
                setAction('Landlord Review');
              }}
            >
              Mark sent to landlord
            </button>
            <button
              onClick={() => {
                setPack(false);
                setAction('Approved');
              }}
            >
              Record approval
            </button>
            <button
              onClick={() => {
                setPack(false);
                setAction('Rejected');
              }}
            >
              Record rejection
            </button>
            <button
              onClick={() => {
                setPack(false);
                setAction('Documents Required');
              }}
            >
              More information requested
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
