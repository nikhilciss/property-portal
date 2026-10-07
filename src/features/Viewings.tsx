import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { portal, usePortal } from '../app/context';
import {
  Badge,
  Card,
  DataTable,
  Empty,
  Filters,
  Heading,
  Modal,
  Tabs,
  date,
} from '../components/ui';
import { Notes, Timeline } from './shared';
export function Viewings() {
  const { data, user, act } = usePortal();
  const [params] = useSearchParams();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [day, setDay] = useState('');
  const [mode, setMode] = useState('List');
  const [create, setCreate] = useState(!!params.get('property'));
  const rows = data.viewings
    .filter(
      (v) =>
        (user?.role !== 'FIELD_OFFICER' || v.officerId === user.id) &&
        (!status || v.status === status) &&
        (!day || v.date === day) &&
        (
          data.properties.find((p) => p.id === v.propertyId)?.address +
          ' ' +
          data.applicants.find((a) => a.id === v.applicantId)?.name
        )
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return (
    <>
      <Heading title="Viewings" description="From a first impression to an application invitation.">
        <button className="primary" onClick={() => setCreate(true)}>
          + Schedule viewing
        </button>
      </Heading>
      <Tabs tabs={['List', 'Schedule']} value={mode} onChange={setMode} />
      <Card>
        <Filters
          query={query}
          onQuery={setQuery}
          status={status}
          onStatus={setStatus}
          statuses={['Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'No Show']}
          onClear={() => setDay('')}
        >
          <input
            type="date"
            aria-label="Viewing date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
        </Filters>
        {mode === 'List' ? (
          <DataTable
            rows={rows}
            keyOf={(v) => v.id}
            columns={[
              {
                label: 'Property / applicant',
                render: (v) => (
                  <Link to={'/viewings/' + v.id}>
                    <strong>{data.properties.find((p) => p.id === v.propertyId)?.address}</strong>
                    <small>{data.applicants.find((a) => a.id === v.applicantId)?.name}</small>
                  </Link>
                ),
              },
              {
                label: 'Date & time',
                render: (v) => (
                  <>
                    {date(v.date)}
                    <small>{v.time}</small>
                  </>
                ),
              },
              {
                label: 'Field officer',
                render: (v) => data.users.find((u) => u.id === v.officerId)?.name,
              },
              { label: 'Status', render: (v) => <Badge>{v.status}</Badge> },
              { label: '', render: (v) => <Link to={'/viewings/' + v.id}>Open viewing →</Link> },
            ]}
          />
        ) : (
          rows.map((v) => (
            <Link className="schedule-row" key={v.id} to={'/viewings/' + v.id}>
              <span className="time">
                {v.time}
                <small>{date(v.date)}</small>
              </span>
              <div>
                <strong>{data.properties.find((p) => p.id === v.propertyId)?.address}</strong>
                <small>{data.applicants.find((a) => a.id === v.applicantId)?.name}</small>
              </div>
              <Badge>{v.status}</Badge>
            </Link>
          ))
        )}
      </Card>
      {create && (
        <Modal title="Schedule a viewing" onClose={() => setCreate(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (
                act(
                  () =>
                    portal.scheduleViewing(
                      user!,
                      String(f.get('property')),
                      String(f.get('applicant')),
                      String(f.get('date')),
                      String(f.get('time')),
                    ),
                  'Viewing added to the field schedule',
                )
              )
                setCreate(false);
            }}
          >
            <label>
              Property
              <select
                name="property"
                defaultValue={params.get('property') || data.properties[0].id}
              >
                {data.properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.address}
                  </option>
                ))}
              </select>
            </label>
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
            <div className="form-grid">
              <label>
                Date
                <input type="date" name="date" required defaultValue="2026-10-07" />
              </label>
              <label>
                Time
                <input type="time" name="time" required defaultValue="14:00" />
              </label>
            </div>
            <p>Assigned to Emma Wilson · Field Officer</p>
            <button className="primary">Schedule viewing</button>
          </form>
        </Modal>
      )}
    </>
  );
}
export function ViewingDetail() {
  const { viewingId } = useParams();
  const { data, user, act } = usePortal();
  const v = data.viewings.find((v) => v.id === viewingId);
  const [invitation, setInvitation] = useState('');
  const [confirm, setConfirm] = useState('');
  if (!v) return <Empty title="Viewing not found" />;
  if (user?.role === 'FIELD_OFFICER' && v.officerId !== user.id)
    return <Empty title="Access denied" />;
  const p = data.properties.find((p) => p.id === v.propertyId)!;
  return (
    <>
      <Heading
        eyebrow={'VIEWINGS / ' + v.id}
        title={p.address}
        description={`${date(v.date)} at ${v.time} · ${p.postcode}`}
      >
        <Badge>{v.status}</Badge>
      </Heading>
      <div className="two-col">
        <Card title="Appointment details">
          <dl>
            <div>
              <dt>Applicant</dt>
              <dd>{data.applicants.find((a) => a.id === v.applicantId)?.name}</dd>
            </div>
            <div>
              <dt>Field officer</dt>
              <dd>{data.users.find((u) => u.id === v.officerId)?.name}</dd>
            </div>
            <div>
              <dt>Property</dt>
              <dd>
                {p.bedrooms} bedrooms · {p.pets}
              </dd>
            </div>
          </dl>
          <p>{v.notes}</p>
          <div className="actions wrap">
            {['Confirmed', 'Completed', 'No Show', 'Cancelled'].map((s) => (
              <button
                disabled={v.status === s || v.status === 'Completed'}
                className={s === 'Completed' ? 'primary' : ''}
                key={s}
                onClick={() => setConfirm(s)}
              >
                {s === 'Completed'
                  ? 'Complete & invite'
                  : s === 'Confirmed'
                    ? 'Confirm'
                    : s === 'Cancelled'
                      ? 'Cancel'
                      : 'Mark no show'}
              </button>
            ))}
          </div>
          {v.applicationId && (
            <button className="primary" onClick={() => setInvitation(v.applicationId!)}>
              View application invitation
            </button>
          )}
        </Card>
        <Card title="At the property">
          <p>{p.maintenance}</p>
          <p>{p.notes}</p>
          <div className="subtle-box">
            Completing this viewing generates one application invitation, a simulated email, a
            notification and an audit entry.
          </div>
        </Card>
      </div>
      <Notes entityId={v.id} propertyId={p.id} />
      <Timeline entityId={v.id} />
      {confirm && (
        <Modal title={'Mark viewing ' + confirm.toLowerCase() + '?'} onClose={() => setConfirm('')}>
          <p>
            {confirm === 'Completed'
              ? 'An application invitation will be generated automatically.'
              : 'The appointment and linked field schedule will be updated.'}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              act(() => {
                const app = portal.viewingAction(user!, v.id, confirm, String(f.get('notes')));
                if (app) setInvitation(app);
              }, 'Viewing updated');
              setConfirm('');
            }}
          >
            <label>
              Outcome / notes
              <textarea name="notes" defaultValue={v.notes} />
            </label>
            <button className="primary">Confirm</button>
          </form>
        </Modal>
      )}
      {invitation && (
        <Modal title="Application invitation generated" onClose={() => setInvitation('')}>
          <Badge>Simulated email sent</Badge>
          <p>The applicant can now complete their application.</p>
          <code>/apply/{invitation}</code>
          <p>
            <Link className="button primary" to={'/apply/' + invitation}>
              Open applicant experience →
            </Link>
          </p>
          <p className="muted">Staff preview. No external email has been sent.</p>
        </Modal>
      )}
    </>
  );
}
