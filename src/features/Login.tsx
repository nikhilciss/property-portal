import { Building2, ArrowRight, ShieldCheck, MapPin, Files } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { usePortal } from '../app/context';
import { roleNames } from '../services/portal';
export function Login() {
  const { data, user, login } = usePortal();
  const navigate = useNavigate();
  if (user)
    return (
      <Navigate
        to={
          user.role === 'APPLICANT'
            ? '/apply/' + data.applications.find((a) => a.applicantId === user.applicantId)?.id
            : user.role === 'FIELD_OFFICER'
              ? '/field/today'
              : '/dashboard'
        }
        replace
      />
    );
  return (
    <div className="login">
      <section className="login-story">
        <div className="brand">
          <Building2 />
          <span>Property Management Portal</span>
        </div>
        <div>
          <div className="eyebrow">ONE CONNECTED WORKSPACE</div>
          <h1>
            Every property.
            <br />
            Every application.
            <br />
            <em>Every step forward.</em>
          </h1>
          <p>Lettings, Applications & Property Visits</p>
          <div className="login-features">
            <span>
              <ShieldCheck />
              Confident application reviews
            </span>
            <span>
              <MapPin />
              Connected field teams
            </span>
            <span>
              <Files />A clear record of every action
            </span>
          </div>
        </div>
        <small>Scottish property management · Phase 1 demonstration</small>
      </section>
      <section className="login-panel">
        <div className="demo-tag">Prototype environment</div>
        <h2>Welcome to your workspace</h2>
        <p>Select a demo account to explore the portal.</p>
        <div className="demo-accounts">
          {data.users.map((u) => (
            <button
              key={u.id}
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
              <span className="avatar">
                {u.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </span>
              <span>
                <strong>{roleNames[u.role]}</strong>
                <small>{u.name}</small>
              </span>
              <ArrowRight size={18} />
            </button>
          ))}
        </div>
        <p className="fine-print">
          Demo access only. No passwords or real authentication. All people, properties and checks
          are fictional.
        </p>
      </section>
    </div>
  );
}
