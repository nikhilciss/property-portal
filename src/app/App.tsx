import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { usePortal } from './context';
import { can } from '../services/portal';
import { Layout } from './Layout';
const Login = lazy(() => import('../features/Login').then((module) => ({ default: module.Login })));
const Dashboard = lazy(() =>
  import('../features/Dashboard').then((module) => ({ default: module.Dashboard })),
);
const Properties = lazy(() =>
  import('../features/Properties').then((module) => ({ default: module.Properties })),
);
const PropertyDetail = lazy(() =>
  import('../features/Properties').then((module) => ({ default: module.PropertyDetail })),
);
const Viewings = lazy(() =>
  import('../features/Viewings').then((module) => ({ default: module.Viewings })),
);
const ViewingDetail = lazy(() =>
  import('../features/Viewings').then((module) => ({ default: module.ViewingDetail })),
);
const Applications = lazy(() =>
  import('../features/Applications').then((module) => ({ default: module.Applications })),
);
const ApplicationDetail = lazy(() =>
  import('../features/Applications').then((module) => ({ default: module.ApplicationDetail })),
);
const ApplicantPortal = lazy(() =>
  import('../features/ApplicantPortal').then((module) => ({ default: module.ApplicantPortal })),
);
const Visits = lazy(() =>
  import('../features/Field').then((module) => ({ default: module.Visits })),
);
const VisitDetail = lazy(() =>
  import('../features/Field').then((module) => ({ default: module.VisitDetail })),
);
const Inspections = lazy(() =>
  import('../features/Field').then((module) => ({ default: module.Inspections })),
);
const InspectionDetail = lazy(() =>
  import('../features/Field').then((module) => ({ default: module.InspectionDetail })),
);
const Documents = lazy(() =>
  import('../features/Documents').then((module) => ({ default: module.Documents })),
);
const Applicants = lazy(() =>
  import('../features/Operations').then((module) => ({ default: module.Applicants })),
);
const Notifications = lazy(() =>
  import('../features/Operations').then((module) => ({ default: module.Notifications })),
);
const Audit = lazy(() =>
  import('../features/Operations').then((module) => ({ default: module.Audit })),
);
const Emails = lazy(() =>
  import('../features/Operations').then((module) => ({ default: module.Emails })),
);
const Users = lazy(() =>
  import('../features/Operations').then((module) => ({ default: module.Users })),
);
const Settings = lazy(() =>
  import('../features/Operations').then((module) => ({ default: module.Settings })),
);
const Integrations = lazy(() =>
  import('../features/Operations').then((module) => ({ default: module.Integrations })),
);
import { Empty } from '../components/ui';
function Guard() {
  const { user, data } = usePortal();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace />;
  const area = location.pathname.split('/')[1];
  if (area === 'dashboard' && user.role === 'APPLICANT')
    return (
      <Navigate
        to={'/apply/' + data.applications.find((a) => a.applicantId === user.applicantId)?.id}
        replace
      />
    );
  if (
    !(
      area === 'apply' &&
      ['ADMIN', 'APPLICATIONS', 'PROPERTY_MANAGER', 'FIELD_OFFICER'].includes(user.role)
    ) &&
    !can(user, area)
  )
    return (
      <div className="access-denied">
        <Empty
          title="Access denied"
          description="This screen is not available for your demo role."
        />
        <a href="/dashboard">Return to your workspace</a>
      </div>
    );
  return <Layout />;
}
export function App() {
  return (
    <Suspense
      fallback={
        <div className="loading-state" role="status" aria-label="Loading workspace">
          <div className="skeleton skeleton-title" />
          {[1, 2, 3].map((n) => (
            <div className="skeleton" key={n} />
          ))}
          <span>Loading workspace…</span>
        </div>
      }
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<Guard />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/properties/:propertyId" element={<PropertyDetail />} />
          <Route path="/listings" element={<Properties listing />} />
          <Route path="/viewings" element={<Viewings />} />
          <Route path="/viewings/:viewingId" element={<ViewingDetail />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/applications/pipeline" element={<Applications pipeline />} />
          <Route path="/applications/:applicationId" element={<ApplicationDetail />} />
          <Route path="/applicants" element={<Applicants />} />
          <Route path="/applicants/:applicantId" element={<Applicants />} />
          <Route path="/apply/:applicationId" element={<ApplicantPortal />} />
          <Route path="/visits" element={<Visits />} />
          <Route path="/field/today" element={<Visits today />} />
          <Route path="/field/visits" element={<Visits />} />
          <Route path="/visits/:visitId" element={<VisitDetail />} />
          <Route path="/field/visits/:visitId" element={<VisitDetail />} />
          <Route path="/inspections" element={<Inspections />} />
          <Route path="/inspections/:inspectionId" element={<InspectionDetail />} />
          <Route path="/field/inspection/:inspectionId" element={<InspectionDetail />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="/emails" element={<Emails />} />
          <Route path="/users" element={<Users />} />
          <Route path="/demo/settings" element={<Settings />} />
          <Route path="/demo/integrations" element={<Integrations />} />
          <Route
            path="*"
            element={
              <Empty
                title="Page not found"
                description="Use the navigation to return to your workspace."
              />
            }
          />
        </Route>
      </Routes>
    </Suspense>
  );
}
