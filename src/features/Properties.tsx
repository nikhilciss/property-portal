import { PropertyPhotos } from './PropertyPhotos';
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Building2, MapPin, BedDouble, ArrowUpRight } from 'lucide-react';
import { portal, usePortal } from '../app/context';
import {
  Badge,
  Card,
  DataTable,
  Empty,
  Filters,
  Heading,
  Tabs,
  money,
  date,
} from '../components/ui';
import { Notes, Timeline } from './shared';
const statuses = [
  'Draft',
  'Ready to Market',
  'Ready for Review',
  'Live',
  'Application Open',
  'Under Offer',
  'Let Agreed',
  'Withdrawn',
];
export function Properties({ listing = false }: { listing?: boolean }) {
  const { data } = usePortal();
  const [params] = useSearchParams();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(params.get('status') || '');
  const [beds, setBeds] = useState('');
  const [sort, setSort] = useState('address');
  const [manager, setManager] = useState('');
  const [available, setAvailable] = useState('');
  const rows = data.properties
    .filter(
      (p) =>
        (p.address + ' ' + p.postcode + ' ' + p.city).toLowerCase().includes(query.toLowerCase()) &&
        (!status || p.status === status) &&
        (!beds || p.bedrooms === +beds) &&
        (!manager || p.managerId === manager) &&
        (!available || p.available <= available),
    )
    .sort((a, b) => (sort === 'rent' ? a.rent - b.rent : a.address.localeCompare(b.address)));
  return (
    <>
      <Heading
        eyebrow="PROPERTY PORTFOLIO"
        title={listing ? 'Listings' : 'Properties'}
        description={`${data.properties.length} homes across Edinburgh, Glasgow, Aberdeen and Dundee.`}
      />
      <Card>
        <Filters
          query={query}
          onQuery={setQuery}
          status={status}
          onStatus={setStatus}
          statuses={statuses}
          onClear={() => {
            setBeds('');
            setManager('');
            setAvailable('');
          }}
        >
          <select aria-label="Bedrooms" value={beds} onChange={(e) => setBeds(e.target.value)}>
            <option value="">All bedrooms</option>
            {[1, 2, 3, 4].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
          <select
            aria-label="Property manager"
            value={manager}
            onChange={(e) => setManager(e.target.value)}
          >
            <option value="">All managers</option>
            {data.users
              .filter((u) => u.role === 'PROPERTY_MANAGER')
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
          <input
            type="date"
            aria-label="Available by"
            title="Available by"
            value={available}
            onChange={(e) => setAvailable(e.target.value)}
          />
          <select
            aria-label="Sort properties"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="address">Address A–Z</option>
            <option value="rent">Rent: low to high</option>
          </select>
        </Filters>
        <DataTable
          rows={rows}
          keyOf={(p) => p.id}
          columns={[
            {
              label: 'Property',
              render: (p) => (
                <Link
                  className="property-cell"
                  to={'/properties/' + p.id + (listing ? '?tab=Listing' : '')}
                >
                  <span className="property-thumb">
                    <Building2 />
                  </span>
                  <span>
                    <strong>{p.address}</strong>
                    <small>
                      {p.city} · {p.postcode}
                    </small>
                  </span>
                </Link>
              ),
            },
            {
              label: 'Details',
              render: (p) => (
                <>
                  <strong>
                    {p.bedrooms} beds · {p.type}
                  </strong>
                  <small>{p.furnished}</small>
                </>
              ),
            },
            {
              label: 'Monthly rent',
              render: (p) => (
                <strong>
                  {money(p.rent)} <small className="inline">pcm</small>
                </strong>
              ),
            },
            { label: 'Status', render: (p) => <Badge>{p.status}</Badge> },
            { label: 'Available', render: (p) => date(p.available) },
            { label: 'Manager', render: (p) => data.users.find((u) => u.id === p.managerId)?.name },
            {
              label: '',
              render: (p) => (
                <Link aria-label={'Open ' + p.address} to={'/properties/' + p.id}>
                  <ArrowUpRight size={18} />
                </Link>
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}
export function PropertyDetail() {
  const { propertyId } = useParams();
  const { data, user, act } = usePortal();
  const p = data.properties.find((p) => p.id === propertyId);
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') || 'Overview');
  if (!p) return <Empty title="Property not found" />;
  return (
    <>
      <Heading
        eyebrow={'PROPERTIES / ' + p.reference}
        title={p.address}
        description={`${p.city}, ${p.postcode}`}
      >
        <Badge>{p.status}</Badge>
        <Link className="button primary" to={'/viewings?property=' + p.id}>
          Schedule a viewing
        </Link>
      </Heading>
      <div className="property-banner">
        <div className="property-illustration">
          <Building2 size={68} />
          <span>SCOTLAND PORTFOLIO</span>
        </div>
        <div>
          <div className="eyebrow">
            {p.type} · {p.furnished}
          </div>
          <h2>
            {money(p.rent)} <small>pcm</small>
          </h2>
          <div className="actions">
            <span>
              <BedDouble size={17} /> {p.bedrooms} bedrooms
            </span>
            <span>{p.bathrooms} bathrooms</span>
            <span>
              <MapPin size={16} />
              {p.postcode}
            </span>
          </div>
        </div>
        <div className="banner-info">
          <small>PROPERTY MANAGER</small>
          <strong>{data.users.find((u) => u.id === p.managerId)?.name}</strong>
          <small>Available {date(p.available)}</small>
        </div>
      </div>
      <Tabs
        tabs={[
          'Overview',
          'Listing',
          'Viewings',
          'Applications',
          'Visits',
          'Maintenance',
          'Documents',
          'Notes',
          'Audit History',
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'Overview' && (
        <div className="two-col">
          <Card title="Property information">
            <dl>
              {Object.entries({
                Landlord: data.landlords.find((l) => l.id === p.landlordId)?.name,
                Deposit: money(p.deposit),
                'Approved pets': p.pets,
                Tenancy: p.tenancy,
                'Available from': date(p.available),
                'Property reference': p.reference,
              }).map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card title="At this property">
            <h3>{p.headline}</h3>
            <p>{p.description}</p>
            <div className="subtle-box">
              <strong>Maintenance</strong>
              <p>{p.maintenance}</p>
            </div>
            <p className="muted">{p.notes}</p>
          </Card>
        </div>
      )}
      {tab === 'Listing' && (
        <Card title="Listing & publication">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              act(
                () =>
                  portal.updateProperty(user!, p.id, {
                    headline: String(f.get('headline')),
                    description: String(f.get('description')),
                    rent: Number(f.get('rent')),
                    deposit: Number(f.get('deposit')),
                    available: String(f.get('available')),
                    features: String(f.get('features'))
                      .split(',')
                      .map((s) => s.trim()),
                    status: String(f.get('status')),
                  }),
                'Listing saved; portal publication simulated',
              );
            }}
          >
            <div className="form-grid">
              <label className="span-2">
                Headline
                <input name="headline" required defaultValue={p.headline} />
              </label>
              <label className="span-2">
                Description
                <textarea name="description" required defaultValue={p.description} />
              </label>
              <label>
                Monthly rent (£)
                <input type="number" min="1" name="rent" required defaultValue={p.rent} />
              </label>
              <label>
                Deposit (£)
                <input type="number" min="0" name="deposit" required defaultValue={p.deposit} />
              </label>
              <label>
                Available from
                <input type="date" name="available" required defaultValue={p.available} />
              </label>
              <label>
                Listing status
                <select name="status" defaultValue={p.status}>
                  {statuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="span-2">
                Features (comma separated)
                <input name="features" defaultValue={p.features.join(', ')} />
              </label>
            </div>
            <div className="notice">
              Portal publication: <Badge>{p.portals}</Badge> No external portals are connected.
            </div>
            <button className="primary">Save listing</button>
          </form>
          <PropertyPhotos property={p} />
        </Card>
      )}
      {tab === 'Maintenance' && (
        <Card title="Maintenance summary">
          <p>{p.maintenance}</p>
          <Notes entityId={p.id} propertyId={p.id} />
        </Card>
      )}
      {tab === 'Notes' && <Notes entityId={p.id} propertyId={p.id} />}
      {tab === 'Audit History' && <Timeline propertyId={p.id} />}
      {['Viewings', 'Applications', 'Visits', 'Documents'].includes(tab) && (
        <Card title={tab}>
          {tab === 'Viewings' &&
            data.viewings
              .filter((v) => v.propertyId === p.id)
              .map((v) => (
                <Link className="schedule-row" key={v.id} to={'/viewings/' + v.id}>
                  <div>
                    <strong>{data.applicants.find((a) => a.id === v.applicantId)?.name}</strong>
                    <small>
                      {date(v.date)} · {v.time}
                    </small>
                  </div>
                  <Badge>{v.status}</Badge>
                </Link>
              ))}
          {tab === 'Applications' &&
            data.applications
              .filter((a) => a.propertyId === p.id)
              .map((a) => (
                <Link className="schedule-row" key={a.id} to={'/applications/' + a.id}>
                  <strong>{data.applicants.find((x) => x.id === a.applicantId)?.name}</strong>
                  <Badge>{a.status}</Badge>
                </Link>
              ))}
          {tab === 'Visits' &&
            data.visits
              .filter((v) => v.propertyId === p.id)
              .map((v) => (
                <Link className="schedule-row" key={v.id} to={'/visits/' + v.id}>
                  {v.type} · {date(v.date)} · {v.time}
                  <Badge>{v.status}</Badge>
                </Link>
              ))}
          {tab === 'Documents' &&
            data.documents
              .filter((doc) =>
                data.applications.some((a) => a.id === doc.applicationId && a.propertyId === p.id),
              )
              .map((doc) => (
                <div className="schedule-row" key={doc.id}>
                  <div>
                    <strong>{doc.name}</strong>
                    <small>{doc.type} · Metadata only</small>
                  </div>
                  <Badge>{doc.status}</Badge>
                </div>
              ))}
          <p className="muted">Showing linked {tab.toLowerCase()} for this property.</p>
        </Card>
      )}
    </>
  );
}
