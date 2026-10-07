import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Building2 } from 'lucide-react';
import { usePortal } from '../app/context';
import { Badge, Card, Heading, Stat, money } from '../components/ui';
export function Dashboard() {
  const { data, user } = usePortal();
  const field = user?.role === 'FIELD_OFFICER';
  return (
    <>
      <Heading
        eyebrow="PORTFOLIO AT A GLANCE"
        title={`Good morning, ${user?.name.split(' ')[0]}`}
        description="Your lettings, applications and property visits, all in view."
      >
        <span className="date-chip">
          <CalendarDays size={16} />
          Wednesday, 7 October 2026
        </span>
      </Heading>
      <div className="notice">
        <span className="dot" />
        <strong>Your daily briefing</strong>
        <span>
          {data.applications.filter((a) => a.status === 'Documents Required').length} applications
          need documents.{' '}
          {data.visits.filter((v) => v.date === '2026-10-07' && v.status !== 'Completed').length}{' '}
          visits are on today's schedule.
        </span>
        <Link to={field ? '/field/today' : '/applications'}>
          View work <ArrowRight size={15} />
        </Link>
      </div>
      <div className="stats">
        {field ? (
          <>
            <Stat
              label="Today's visits"
              value={data.visits.filter((v) => v.date === '2026-10-07').length}
              to="/field/today"
              hint="Your daily route"
            />
            <Stat
              label="Inspections due"
              value={data.inspections.filter((i) => i.status === 'Draft').length}
              to="/inspections"
              hint="Ready to complete"
            />
          </>
        ) : (
          <>
            <Stat
              label="Properties marketed"
              value={
                data.properties.filter((p) => ['Live', 'Application Open'].includes(p.status))
                  .length
              }
              to="/properties?status=Live"
              hint="Across the Scotland portfolio"
            />
            <Stat
              label="Active applications"
              value={
                data.applications.filter((a) => !['Approved', 'Rejected'].includes(a.status)).length
              }
              to="/applications"
              hint="From invitation to decision"
            />
            <Stat
              label="Ready for review"
              value={data.applications.filter((a) => a.status === 'Staff Review').length}
              to="/applications?status=Staff%20Review"
              hint="Awaiting your team's attention"
            />
            <Stat
              label="Today's viewings"
              value={data.viewings.filter((v) => v.date === '2026-10-07').length}
              to="/viewings"
              hint="Wednesday's appointments"
            />
          </>
        )}
      </div>
      <div className="dashboard-grid">
        <Card
          title={field ? 'Inspection progress' : 'Application pipeline'}
          action={
            <Link to={field ? '/inspections' : '/applications/pipeline'}>
              View all <ArrowRight size={15} />
            </Link>
          }
        >
          {(field
            ? ['Draft', 'Submitted']
            : [
                'Application Started',
                'Documents Required',
                'Staff Review',
                'Landlord Review',
                'Approved',
              ]
          ).map((s, i) => {
            const n = field
              ? data.inspections.filter((a) => a.status === s).length
              : data.applications.filter((a) => a.status === s).length;
            return (
              <Link
                className="pipeline-row"
                key={s}
                to={field ? '/inspections' : '/applications?status=' + encodeURIComponent(s)}
              >
                <span>
                  <i
                    style={{
                      background: ['#467b70', '#c6a15c', '#719b93', '#839bba', '#274e44'][i],
                    }}
                  />
                  {s}
                </span>
                <div className="bar">
                  <i style={{ width: Math.max(8, n * 22) + '%' }} />
                </div>
                <strong>{n}</strong>
              </Link>
            );
          })}
          <div className="subtle-box">
            A connected journey from the first viewing to the final decision.
          </div>
        </Card>
        <Card
          title="Today's schedule"
          action={
            <Link to={field ? '/field/today' : '/viewings'}>
              View schedule <ArrowRight size={15} />
            </Link>
          }
        >
          {data.viewings
            .filter((v) => v.date === '2026-10-07')
            .slice(0, 4)
            .map((v) => (
              <Link className="schedule-row" key={v.id} to={'/viewings/' + v.id}>
                <span className="time">{v.time}</span>
                <div>
                  <strong>{data.properties.find((p) => p.id === v.propertyId)?.address}</strong>
                  <small>
                    Viewing · {data.applicants.find((a) => a.id === v.applicantId)?.name}
                  </small>
                </div>
                <Badge>{v.status}</Badge>
              </Link>
            ))}
        </Card>
        <Card
          title={field ? 'Your properties today' : 'Recent applications'}
          action={
            !field && (
              <Link to="/applications">
                All applications <ArrowRight size={15} />
              </Link>
            )
          }
        >
          {field
            ? data.visits.slice(0, 4).map((v) => (
                <Link className="schedule-row" key={v.id} to={'/field/visits/' + v.id}>
                  <Building2 />
                  <div>
                    <strong>{data.properties.find((p) => p.id === v.propertyId)?.address}</strong>
                    <small>{v.type}</small>
                  </div>
                  <Badge>{v.status}</Badge>
                </Link>
              ))
            : data.applications.slice(0, 5).map((a) => (
                <Link className="schedule-row" key={a.id} to={'/applications/' + a.id}>
                  <span className="avatar">
                    {data.applicants
                      .find((p) => p.id === a.applicantId)
                      ?.name.split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </span>
                  <div>
                    <strong>{data.applicants.find((p) => p.id === a.applicantId)?.name}</strong>
                    <small>
                      {data.properties.find((p) => p.id === a.propertyId)?.address} ·{' '}
                      {money(data.properties.find((p) => p.id === a.propertyId)!.rent)} pcm
                    </small>
                  </div>
                  <Badge>{a.status}</Badge>
                </Link>
              ))}
        </Card>
        <Card title="Recent activity">
          {data.auditLogs
            .filter((a) => !field || a.user === user?.name)
            .slice(0, 5)
            .map((a) => (
              <div className="activity" key={a.id}>
                <span className="activity-dot" />
                <div>
                  <strong>{a.action}</strong>
                  <small>
                    {a.user} · {a.entityId}
                  </small>
                </div>
              </div>
            ))}
          {field && <p className="muted">Your visit and inspection activity will appear here.</p>}
        </Card>
      </div>
    </>
  );
}
