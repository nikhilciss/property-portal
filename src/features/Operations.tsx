import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, RotateCcw } from 'lucide-react';
import { portal, usePortal } from '../app/context';
import { roleNames } from '../services/portal';
import { Badge, Card, Confirm, DataTable, Empty, Filters, Heading, date } from '../components/ui';
export function Applicants() {
  const { data } = usePortal();
  const { applicantId } = useParams();
  const [query, setQuery] = useState('');
  if (applicantId) {
    const a = data.applicants.find((a) => a.id === applicantId);
    if (!a) return <Empty title="Applicant not found" />;
    return (
      <>
        <Heading title={a.name} description={`${a.email} · ${a.phone}`} />
        <Card title="Applications">
          {data.applications
            .filter((x) => x.applicantId === a.id)
            .map((x) => (
              <Link className="schedule-row" key={x.id} to={'/applications/' + x.id}>
                <strong>{data.properties.find((p) => p.id === x.propertyId)?.address}</strong>
                <Badge>{x.status}</Badge>
              </Link>
            ))}
        </Card>
      </>
    );
  }
  return (
    <>
      <Heading title="Applicants" description="Fictional applicant directory." />
      <Card>
        <label>
          Search applicants
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or email"
          />
        </label>
        <DataTable
          rows={data.applicants.filter((a) =>
            (a.name + ' ' + a.email).toLowerCase().includes(query.toLowerCase()),
          )}
          keyOf={(a) => a.id}
          columns={[
            {
              label: 'Name',
              render: (a) => (
                <Link to={'/applicants/' + a.id}>
                  <strong>{a.name}</strong>
                  <small>{a.id}</small>
                </Link>
              ),
            },
            { label: 'Email', render: (a) => a.email },
            { label: 'Phone', render: (a) => a.phone },
            {
              label: 'Applications',
              render: (a) => data.applications.filter((x) => x.applicantId === a.id).length,
            },
          ]}
        />
      </Card>
    </>
  );
}
export function Notifications() {
  const { data, user, act } = usePortal();
  const [unread, setUnread] = useState(false);
  const rows = data.notifications.filter(
    (n) => (user?.role === 'ADMIN' || n.userId === user?.id) && (!unread || !n.read),
  );
  return (
    <>
      <Heading title="Notifications" description="Updates that keep your work moving.">
        <button onClick={() => act(() => portal.markRead(user!), 'All notifications marked read')}>
          Mark all read
        </button>
      </Heading>
      <label className="checkbox">
        <input type="checkbox" checked={unread} onChange={(e) => setUnread(e.target.checked)} />
        Unread only
      </label>
      <Card>
        {rows.length ? (
          rows.map((n) => (
            <div className={'schedule-row ' + (!n.read ? 'unread' : '')} key={n.id}>
              <span className="activity-dot" />
              <div>
                <Link to={n.link} onClick={() => act(() => portal.markRead(user!, n.id), '')}>
                  <strong>{n.title}</strong>
                </Link>
                <small>
                  {n.description} · {date(n.date)}
                </small>
              </div>
              {!n.read && (
                <button onClick={() => act(() => portal.markRead(user!, n.id), 'Marked read')}>
                  Mark read
                </button>
              )}
            </div>
          ))
        ) : (
          <Empty
            title="You're all caught up"
            description="New workflow notifications will appear here."
          />
        )}
      </Card>
    </>
  );
}
export function Audit() {
  const { data } = usePortal();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [day, setDay] = useState('');
  return (
    <>
      <Heading
        title="Audit trail"
        description="A traceable record of every significant workflow action."
      />
      <Card>
        <Filters
          query={query}
          onQuery={setQuery}
          status={status}
          onStatus={setStatus}
          statuses={[...new Set(data.auditLogs.map((a) => a.entityType))]}
          onClear={() => setDay('')}
        >
          <input
            type="date"
            aria-label="Audit date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
        </Filters>
        <DataTable
          rows={data.auditLogs
            .filter(
              (a) =>
                (a.action + ' ' + a.entityId + ' ' + a.user + ' ' + a.description)
                  .toLowerCase()
                  .includes(query.toLowerCase()) &&
                (!status || a.entityType === status) &&
                (!day || a.timestamp.startsWith(day)),
            )
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp))}
          keyOf={(a) => a.id}
          columns={[
            {
              label: 'Timestamp',
              render: (a) => (
                <>
                  {date(a.timestamp)}
                  <small>{new Date(a.timestamp).toLocaleTimeString('en-GB')}</small>
                </>
              ),
            },
            {
              label: 'Action',
              render: (a) => (
                <>
                  <strong>{a.action}</strong>
                  <small>{a.description}</small>
                </>
              ),
            },
            { label: 'Record', render: (a) => a.entityId },
            {
              label: 'User',
              render: (a) => (
                <>
                  {a.user}
                  <small>{a.role}</small>
                </>
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}
export function Emails() {
  const { data } = usePortal();
  return (
    <>
      <Heading
        title="Email activity"
        description="Simulated Microsoft Graph / Office 365 email activity. No messages leave this demo."
      />
      <Card>
        <DataTable
          rows={data.emails}
          keyOf={(e) => e.id}
          columns={[
            { label: 'Recipient', render: (e) => e.to },
            {
              label: 'Template',
              render: (e) => (
                <>
                  <strong>{e.template}</strong>
                  <small>{e.entityId}</small>
                </>
              ),
            },
            { label: 'Date', render: (e) => date(e.date) },
            { label: 'Delivery', render: (e) => <Badge>{e.status}</Badge> },
          ]}
        />
      </Card>
    </>
  );
}
export function Users() {
  const { data } = usePortal();
  return (
    <>
      <Heading
        title="Demo users"
        description="Role-based demonstration accounts. No passwords or production authentication."
      />
      <Card>
        <DataTable
          rows={data.users}
          keyOf={(u) => u.id}
          columns={[
            { label: 'Name', render: (u) => <strong>{u.name}</strong> },
            { label: 'Role', render: (u) => <Badge>{roleNames[u.role]}</Badge> },
            { label: 'Email', render: (u) => u.email },
          ]}
        />
      </Card>
    </>
  );
}
export function Settings() {
  const { data, user, act, login } = usePortal();
  const navigate = useNavigate();
  const [reset, setReset] = useState(false);
  return (
    <>
      <Heading title="Demo settings" description="Prepare a repeatable client demonstration." />
      <div className="two-col">
        <Card title="Demo controls">
          <button className="full" onClick={() => setReset(true)}>
            <RotateCcw size={17} /> Reset demo data
          </button>
          <p>
            Restore the original dataset. This removes all local changes, uploaded metadata and
            simulated activity.
          </p>
          <button
            onClick={() =>
              act(() => portal.changeSchedule(user!), 'A schedule change was simulated')
            }
          >
            Simulate schedule change
          </button>
          <p>
            <Link to="/applications">Create a sample application →</Link>
          </p>
          <p>
            <Link to={'/applications/' + data.applications[0].id + '?tab=Verification'}>
              Simulate identity result →
            </Link>
          </p>
          <p>
            <Link to={'/applications/' + data.applications[0].id + '?tab=Credit%20Check'}>
              Simulate credit result →
            </Link>
          </p>
        </Card>
        <Card title="Switch demo role">
          {data.users.map((u) => (
            <button
              key={u.id}
              className="role-switch"
              onClick={() => {
                login(u);
                navigate(
                  u.role === 'APPLICANT'
                    ? '/apply/' + data.applications.find((a) => a.applicantId === u.applicantId)?.id
                    : u.role === 'FIELD_OFFICER'
                      ? '/field/today'
                      : '/dashboard',
                );
              }}
            >
              {roleNames[u.role]}
              <span>{u.name}</span>
              <ArrowRight size={16} />
            </button>
          ))}
        </Card>
      </div>
      <Card title="Environment">
        <dl>
          <div>
            <dt>Storage</dt>
            <dd>Browser localStorage · seed JSON</dd>
          </div>
          <div>
            <dt>Demo date</dt>
            <dd>7 October 2026 · fixed schedule for repeatable demonstrations</dd>
          </div>
          <div>
            <dt>Integrations</dt>
            <dd>SAM, identity, Experian, FCDO and email are simulated</dd>
          </div>
          <div>
            <dt>Uploaded files</dt>
            <dd>Metadata only; photo previews last for the current page session</dd>
          </div>
        </dl>
      </Card>
      {reset && (
        <Confirm
          title="Reset all demo data?"
          description="All local changes will be replaced with the original fictional seed dataset. Enter a confirmation note to continue."
          onClose={() => setReset(false)}
          onConfirm={() => {
            if (act(() => portal.reset(user!), 'Demo data restored')) setReset(false);
          }}
        />
      )}
    </>
  );
}
export function Integrations() {
  const { data, user, act } = usePortal();
  const [processing, setProcessing] = useState('');
  const [stage, setStage] = useState(0);
  const steps = [
    'JotForm submission',
    'Automation received',
    'Applicant matched',
    'Documents identified',
    'ID verification',
    'Credit check',
    'FCDO check',
    'SAM update',
    'Staff review',
  ];
  async function process(id: string) {
    setProcessing(id);
    for (let i = 0; i < steps.length; i++) {
      setStage(i);
      await new Promise((r) => setTimeout(r, 180));
    }
    act(
      () => portal.processSubmission(user!, id),
      'Submission processed with simulated integrations',
    );
    setProcessing('');
  }
  return (
    <>
      <Heading
        eyebrow="OPTION B · ALTERNATIVE APPLICATION INTAKE"
        title="JotForm automation demo"
        description="See how an external form could feed the same review workflow."
      />
      <div className="notice">
        All stages are simulated. No JotForm, SAM or external verification connection exists.
      </div>
      <div className="integration-flow">
        {steps.map((s, i) => (
          <div key={s} className={processing && i <= stage ? 'complete' : ''}>
            <span>{i + 1}</span>
            <strong>{s}</strong>
          </div>
        ))}
      </div>
      <div className="three-col">
        {data.submissions.map((s) => (
          <Card key={s.id} title={s.id}>
            <Badge>{processing === s.id ? 'Processing' : s.status}</Badge>
            <h3>{data.applicants.find((a) => a.id === s.applicantId)?.name}</h3>
            <p>{data.properties.find((p) => p.id === s.propertyId)?.address}</p>
            {s.status === 'Processed' ? (
              <>
                <div className="processing-log">
                  {s.stages.map((t) => (
                    <p key={t}>
                      <CheckCircle2 size={15} />
                      {t}
                    </p>
                  ))}
                </div>
                <Link className="button primary" to={'/applications/' + s.applicationId}>
                  Open application
                </Link>
              </>
            ) : (
              <button className="primary" disabled={!!processing} onClick={() => process(s.id)}>
                {processing === s.id ? 'Processing…' : 'Process submission'}
              </button>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}
