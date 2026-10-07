import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, Clock, Camera, Navigation, CheckCircle2 } from 'lucide-react';
import { portal, usePortal } from '../app/context';
import type { Inspection, Photo } from '../types';
import { Badge, Card, Empty, Filters, Heading, Modal, date } from '../components/ui';
import { Notes, Timeline } from './shared';
export function Visits({ today = false }: { today?: boolean }) {
  const { data, user, act } = usePortal();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [day, setDay] = useState(today ? '2026-10-07' : '');
  const [type, setType] = useState('');
  const [officer, setOfficer] = useState('');
  const rows = data.visits
    .filter(
      (v) =>
        (user?.role !== 'FIELD_OFFICER' || v.officerId === user.id) &&
        (!day || v.date === day) &&
        (!status || v.status === status) &&
        (!type || v.type === type) &&
        (!officer || v.officerId === officer) &&
        (
          data.properties.find((p) => p.id === v.propertyId)?.address +
          ' ' +
          data.properties.find((p) => p.id === v.propertyId)?.postcode
        )
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const groups = [
    ...new Set(
      rows.map((v) => {
        const p = data.properties.find((p) => p.id === v.propertyId)!;
        return (
          p.city + ' · ' + (/EH[12] /.test(p.postcode) ? 'City centre' : p.postcode.split(' ')[0])
        );
      }),
    ),
  ];
  return (
    <>
      <Heading
        eyebrow="FIELD WORKSPACE"
        title={today ? 'My day' : 'Property visits'}
        description="Your appointments, property context and inspection tools."
      >
        <button
          onClick={() => act(() => portal.changeSchedule(user!), 'Schedule change simulated')}
        >
          Simulate schedule change
        </button>
      </Heading>
      <div className="notice">
        <Navigation size={18} />
        <strong>Postcode route groups</strong>
        <span>
          Deterministic area grouping · Times remain in appointment order. No live routing.
        </span>
      </div>
      <Card>
        <Filters
          query={query}
          onQuery={setQuery}
          status={status}
          onStatus={setStatus}
          statuses={['Scheduled', 'In Progress', 'Completed', 'Cancelled']}
          onClear={() => {
            setDay('');
            setType('');
            setOfficer('');
          }}
        >
          <input
            type="date"
            aria-label="Visit date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
          <select aria-label="Visit type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option>
            <option>Viewing</option>
            <option>Routine Inspection</option>
          </select>
          <select
            aria-label="Field officer"
            value={officer}
            onChange={(e) => setOfficer(e.target.value)}
          >
            <option value="">All officers</option>
            <option value="U4">Emma Wilson</option>
          </select>
        </Filters>
      </Card>
      {!rows.length && (
        <Empty
          title="No visits on this schedule"
          description="Choose another date or clear your filters."
        />
      )}
      {groups.map((group) => (
        <section key={group} className="route-group">
          <h2>
            <MapPin size={20} />
            {group}
          </h2>
          <div className="visit-grid">
            {rows
              .filter((v) => {
                const p = data.properties.find((p) => p.id === v.propertyId)!;
                return (
                  p.city +
                    ' · ' +
                    (/EH[12] /.test(p.postcode) ? 'City centre' : p.postcode.split(' ')[0]) ===
                  group
                );
              })
              .map((v) => {
                const p = data.properties.find((p) => p.id === v.propertyId)!;
                return (
                  <Link className="visit-card" key={v.id} to={'/field/visits/' + v.id}>
                    <div className="card-title">
                      <span className="visit-time">
                        <Clock size={18} />
                        {v.time}
                      </span>
                      <Badge>{v.updated ? 'Updated' : v.status}</Badge>
                    </div>
                    <small>
                      {date(v.date)} · {v.type}
                    </small>
                    <h3>{p.address}</h3>
                    <p>
                      {p.postcode} · {v.occupant}
                    </p>
                    <div className="visit-footer">
                      {p.bedrooms} bedrooms<span>Open visit →</span>
                    </div>
                  </Link>
                );
              })}
          </div>
        </section>
      ))}
    </>
  );
}
export function VisitDetail() {
  const { visitId } = useParams();
  const { data, user, act } = usePortal();
  const [office, setOffice] = useState(false);
  const v = data.visits.find((v) => v.id === visitId);
  if (!v) return <Empty title="Visit not found" />;
  if (user?.role === 'FIELD_OFFICER' && v.officerId !== user.id)
    return <Empty title="Access denied" />;
  const p = data.properties.find((p) => p.id === v.propertyId)!;
  const ins = data.inspections.find((i) => i.visitId === v.id);
  return (
    <>
      <Heading
        eyebrow={v.type.toUpperCase()}
        title={p.address}
        description={`${p.postcode} · ${date(v.date)} at ${v.time}`}
      >
        <Badge>{v.status}</Badge>
      </Heading>
      <div className="two-col">
        <Card title="Before you arrive">
          <dl>
            {Object.entries({
              'Occupant / applicant': v.occupant,
              Bedrooms: p.bedrooms,
              'Approved pets': p.pets,
              'Property manager': 'David Wallace',
              'Access information': v.access,
            }).map(([k, value]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="subtle-box">
            <strong>Special instructions</strong>
            <p>{v.instructions}</p>
          </div>
          <button onClick={() => setOffice(true)}>Call office</button>
        </Card>
        <Card title="Recent maintenance">
          <p>{p.maintenance}</p>
          <p>{p.notes}</p>
          {v.viewingId && (
            <Link className="button primary" to={'/viewings/' + v.viewingId}>
              Open viewing & invite applicant
            </Link>
          )}
          {ins && (
            <Link className="button primary" to={'/field/inspection/' + ins.id}>
              Open inspection →
            </Link>
          )}
        </Card>
      </div>
      <Notes entityId={v.id} propertyId={p.id} />
      <Timeline entityId={v.id} />
      <div className="sticky-actions">
        <button
          disabled={v.status !== 'Scheduled'}
          onClick={() => act(() => portal.visitAction(user!, v.id, 'In Progress'), 'Visit started')}
        >
          Start visit
        </button>
        {v.viewingId ? (
          <Link className="button primary" to={'/viewings/' + v.viewingId}>
            Complete viewing →
          </Link>
        ) : (
          <button
            className="primary"
            disabled={v.status === 'Completed'}
            onClick={() =>
              act(() => portal.visitAction(user!, v.id, 'Completed'), 'Visit completed')
            }
          >
            Complete visit
          </button>
        )}
      </div>
      {office && (
        <Modal title="Contact the office" onClose={() => setOffice(false)}>
          <p>Demo contact: 0131 000 0000</p>
          <p>Call control is visual only. No phone call is initiated.</p>
        </Modal>
      )}
    </>
  );
}
function PhotoCard({
  photo,
  url,
  onCaption,
  onRemove,
  disabled,
}: {
  photo: Photo;
  url?: string;
  onCaption: (s: string) => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  return (
    <div className="photo-card">
      {url ? (
        <img src={url} alt={photo.caption || photo.name} />
      ) : (
        <div className="photo-placeholder">
          <Camera />
          <small>{photo.name}</small>
          <small>Metadata saved · preview available only this session</small>
        </div>
      )}
      <label>
        Caption
        <input
          disabled={disabled}
          value={photo.caption}
          onChange={(e) => onCaption(e.target.value)}
        />
      </label>
      {!disabled && <button onClick={onRemove}>Remove photo</button>}
    </div>
  );
}
export function InspectionDetail() {
  const { inspectionId } = useParams();
  const { data, user, act } = usePortal();
  const source = data.inspections.find((i) => i.id === inspectionId);
  const [draft, setDraft] = useState<Inspection | undefined>(() =>
    source ? structuredClone(source) : undefined,
  );
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState(false);
  const previewUrls = useRef<string[]>([]);
  useEffect(
    () => () => {
      previewUrls.current.forEach(URL.revokeObjectURL);
    },
    [],
  );
  if (!source || !draft) return <Empty title="Inspection not found" />;
  if (user?.role === 'FIELD_OFFICER' && source.officerId !== user.id)
    return <Empty title="Access denied" />;
  const locked = source.status === 'Submitted';
  const p = data.properties.find((p) => p.id === source.propertyId)!;
  function update(next: Inspection) {
    setDraft(next);
    act(() => portal.saveInspection(user!, next), '');
  }
  function upload(files: FileList | null) {
    if (!files) return;
    const added: Photo[] = [];
    const nextUrls = { ...urls };
    for (const file of Array.from(files)) {
      if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024) {
        act(() => {
          throw Error('Photos must be JPG or PNG, maximum 5 MB.');
        });
        continue;
      }
      const photo = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        caption: '',
      };
      added.push(photo);
      nextUrls[photo.id] = URL.createObjectURL(file);
      previewUrls.current.push(nextUrls[photo.id]);
    }
    setUrls(nextUrls);
    update({ ...draft!, photos: [...draft!.photos, ...added] });
  }
  return (
    <>
      <Heading
        eyebrow={'INSPECTION / ' + source.id}
        title={p.address}
        description={`${p.postcode} · ${p.bedrooms} bedrooms · ${p.pets}`}
      >
        <Badge>{source.status}</Badge>
      </Heading>
      {locked ? (
        <Card title="Inspection report">
          <div className="notice">
            <CheckCircle2 />
            Inspection submitted. Property history updated; manager notification and email
            simulated.
          </div>
          <pre className="report">{source.report}</pre>
          <button
            onClick={() => {
              const url = URL.createObjectURL(
                new Blob([source.report || ''], { type: 'text/plain' }),
              );
              const a = document.createElement('a');
              a.href = url;
              a.download = source.id + '.txt';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download inspection report
          </button>
        </Card>
      ) : (
        <>
          <div className="notice">
            {draft.items.filter((i) => i.condition).length} / {draft.items.length} sections assessed
            · Draft saved automatically
          </div>
          <div className="inspection-grid">
            {draft.items.map((item, i) => (
              <Card key={item.name} title={item.name}>
                <div className="condition-options">
                  {['Good', 'Fair', 'Attention Required'].map((value) => (
                    <label key={value} className={item.condition === value ? 'selected' : ''}>
                      <input
                        type="radio"
                        name={item.name}
                        checked={item.condition === value}
                        onChange={() =>
                          update({
                            ...draft,
                            items: draft.items.map((x, j) =>
                              j === i ? { ...x, condition: value } : x,
                            ),
                          })
                        }
                      />
                      {value}
                    </label>
                  ))}
                </div>
                <label>
                  {item.condition === 'Attention Required'
                    ? 'Describe the issue (required)'
                    : 'Comments'}
                  <textarea
                    value={item.comment}
                    onChange={(e) =>
                      update({
                        ...draft,
                        items: draft.items.map((x, j) =>
                          j === i ? { ...x, comment: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </label>
              </Card>
            ))}
          </div>
          <Card title="Inspection photos">
            <p>Capture evidence and add useful captions. Only metadata persists after refresh.</p>
            <label className="upload-zone">
              <Camera />
              Take or select photos
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png"
                capture="environment"
                onChange={(e) => upload(e.target.files)}
              />
            </label>
            <div className="photo-grid">
              {draft.photos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  url={urls[photo.id]}
                  disabled={false}
                  onCaption={(caption) =>
                    update({
                      ...draft,
                      photos: draft.photos.map((p) => (p.id === photo.id ? { ...p, caption } : p)),
                    })
                  }
                  onRemove={() =>
                    update({ ...draft, photos: draft.photos.filter((p) => p.id !== photo.id) })
                  }
                />
              ))}
            </div>
          </Card>
          <Card title="Additional notes">
            <label>
              Summary
              <textarea
                value={draft.notes}
                onChange={(e) => update({ ...draft, notes: e.target.value })}
              />
            </label>
          </Card>
          <div className="sticky-actions">
            <span>
              {draft.items.filter((i) => i.condition === 'Attention Required').length} issues ·{' '}
              {draft.photos.length} photos
            </span>
            <button className="primary" onClick={() => setConfirm(true)}>
              Review & submit inspection
            </button>
          </div>
        </>
      )}
      <Timeline entityId={source.id} />
      {confirm && (
        <Modal title="Submit inspection report?" onClose={() => setConfirm(false)}>
          <p>
            {draft.items.filter((i) => i.condition).length}/{draft.items.length} sections assessed
          </p>
          <p>
            {draft.items.filter((i) => i.condition === 'Attention Required').length} issues
            identified · {draft.photos.length} photos recorded
          </p>
          <p>{draft.notes || 'No additional notes.'}</p>
          <p>
            The submitted report will become read-only. A manager notification and email will be
            simulated.
          </p>
          <button
            className="primary"
            onClick={() => {
              if (
                act(
                  () => portal.saveInspection(user!, draft, true),
                  'Inspection submitted; manager notified (simulated)',
                )
              )
                setConfirm(false);
            }}
          >
            Submit inspection
          </button>
        </Modal>
      )}
    </>
  );
}
export function Inspections() {
  const { data, user } = usePortal();
  return (
    <>
      <Heading
        title="Inspections"
        description="Property condition, evidence and follow-up in one record."
      />
      <Card>
        {data.inspections
          .filter((i) => user?.role !== 'FIELD_OFFICER' || i.officerId === user.id)
          .map((i) => (
            <Link className="schedule-row" key={i.id} to={'/inspections/' + i.id}>
              <div>
                <strong>{data.properties.find((p) => p.id === i.propertyId)?.address}</strong>
                <small>
                  {i.id} · {i.items.filter((x) => x.condition === 'Attention Required').length}{' '}
                  issues
                </small>
              </div>
              <Badge>{i.status}</Badge>
            </Link>
          ))}
      </Card>
    </>
  );
}
