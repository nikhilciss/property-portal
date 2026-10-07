import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Building2,
  LayoutDashboard,
  House,
  CalendarDays,
  ClipboardList,
  Users,
  MapPin,
  ClipboardCheck,
  Files,
  Bell,
  History,
  Settings,
  Workflow,
  Mail,
  Search,
  Menu,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { usePortal } from './context';
import { can, roleNames } from '../services/portal';
import { Modal, Empty } from '../components/ui';
const links = [
  ['dashboard', 'Overview', LayoutDashboard],
  ['properties', 'Properties', House],
  ['listings', 'Listings', Building2],
  ['viewings', 'Viewings', CalendarDays],
  ['applications', 'Applications', ClipboardList],
  ['applicants', 'Applicants', Users],
  ['visits', 'Visits', MapPin],
  ['inspections', 'Inspections', ClipboardCheck],
  ['documents', 'Documents', Files],
  ['notifications', 'Notifications', Bell],
  ['emails', 'Email activity', Mail],
  ['audit', 'Audit trail', History],
  ['users', 'Users', Users],
  ['demo/integrations', 'Integration demo', Workflow],
  ['demo/settings', 'Demo settings', Settings],
] as const;
export function Layout() {
  const { user, data, logout } = usePortal();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState<string | null>(null);
  const navigate = useNavigate();
  if (!user) return null;
  const app = data.applications.find((a) => a.applicantId === user.applicantId);
  const unread = data.notifications.filter(
    (n) => !n.read && (user.role === 'ADMIN' || n.userId === user.id),
  ).length;
  return (
    <div className="app-shell">
      <aside className={open ? 'sidebar open' : 'sidebar'}>
        <Link className="brand" to="/dashboard">
          <span className="brand-icon">
            <Building2 size={24} />
          </span>
          <span>
            Property Portal<small>MANAGEMENT WORKSPACE</small>
          </span>
        </Link>
        <div className="workspace-tag">
          <span className="dot" /> Scotland portfolio <small>Phase 1</small>
        </div>
        <div className="nav-label">
          {user.role === 'APPLICANT' ? 'YOUR APPLICATION' : 'WORKSPACE'}
        </div>
        <nav onClick={() => setOpen(false)}>
          {user.role === 'APPLICANT' ? (
            [
              'My Application',
              'Personal Details',
              'Documents',
              'Verification',
              'Application Status',
            ].map((label, i) => (
              <NavLink
                key={label}
                to={`/apply/${app?.id || 'missing'}${i ? '?section=' + ['', 'details', 'documents', 'verification', 'status'][i] : ''}`}
              >
                <ClipboardList size={18} />
                {label}
              </NavLink>
            ))
          ) : (
            <>
              {user.role === 'FIELD_OFFICER' && (
                <NavLink to="/field/today">
                  <MapPin size={18} />
                  My day
                </NavLink>
              )}
              {links
                .filter(([path]) => can(user, path.split('/')[0]))
                .map(([path, label, Icon]) => (
                  <NavLink key={path} to={'/' + path}>
                    <Icon size={18} />
                    {label}
                    {path === 'applications' && <small>{data.applications.length}</small>}
                  </NavLink>
                ))}
            </>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-tag">● Demo environment</div>
          <p>Fictional data · simulated services</p>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>
      {open && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Open navigation"
            onClick={() => setOpen(!open)}
          >
            <Menu />
          </button>
          <span className="breadcrumb">
            Workspace <ChevronRight size={14} /> {roleNames[user.role]}
          </span>
          {user.role !== 'APPLICANT' && (
            <button className="global-search" onClick={() => setSearch('')}>
              <Search size={17} />
              <span>Search the workspace</span>
              <kbd>⌕</kbd>
            </button>
          )}
          <Link
            className="notification-button"
            to="/notifications"
            aria-label={`${unread} unread notifications`}
          >
            <Bell size={20} />
            {unread > 0 && <i />}
          </Link>
          <div className="profile">
            <span className="avatar">
              {user.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </span>
            <div>
              <strong>{user.name}</strong>
              <small>{roleNames[user.role]}</small>
            </div>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
        <footer>
          Property Management Portal <span>Prototype environment · No live integrations</span>
        </footer>
      </div>
      {search !== null && (
        <Modal title="Search workspace" onClose={() => setSearch(null)}>
          <input
            autoFocus
            className="full"
            placeholder="Search properties, applicants and applications"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search.trim() ? (
            <div className="search-results">
              {[
                ...data.properties.map((p) => ({
                  name: p.address + ' ' + p.postcode,
                  type: 'Property',
                  link: '/properties/' + p.id,
                })),
                ...data.applicants.map((a) => ({
                  name: a.name,
                  type: 'Applicant',
                  link: '/applicants/' + a.id,
                })),
                ...data.applications.map((a) => ({
                  name: a.id + ' ' + data.applicants.find((p) => p.id === a.applicantId)?.name,
                  type: 'Application',
                  link: '/applications/' + a.id,
                })),
              ]
                .filter(
                  (r) =>
                    r.name.toLowerCase().includes(search.toLowerCase()) &&
                    can(user, r.link.split('/')[1]),
                )
                .slice(0, 12)
                .map((r) => (
                  <Link key={r.link} to={r.link} onClick={() => setSearch(null)}>
                    <small>{r.type}</small>
                    {r.name}
                    <ChevronRight size={16} />
                  </Link>
                ))}
            </div>
          ) : (
            <Empty
              title="Find a record"
              description="Search by name, property address, postcode or reference."
            />
          )}
        </Modal>
      )}
    </div>
  );
}
