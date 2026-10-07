import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, LockKeyhole, Building2 } from 'lucide-react';
import { usePortal, portal } from '../app/context';
import { Badge, Card, Empty, Heading, money } from '../components/ui';
import { UploadDocuments } from './Documents';
import { Checks } from './Applications';
const sections = [
  {
    title: 'Personal details',
    fields: [
      ['fullName', 'Full name', 'text'],
      ['email', 'Email address', 'email'],
      ['phone', 'Phone number', 'tel'],
      ['dob', 'Date of birth', 'date'],
    ],
  },
  {
    title: 'Address history',
    fields: [
      ['currentAddress', 'Current address & postcode', 'text'],
      ['previousAddress', 'Previous address (or “Not applicable”)', 'text'],
    ],
  },
  {
    title: 'Employment & income',
    fields: [
      ['employment', 'Employment status', 'text'],
      ['employer', 'Employer / income source', 'text'],
      ['jobTitle', 'Job title / circumstances', 'text'],
      ['income', 'Annual gross income (£)', 'number'],
    ],
  },
  {
    title: 'Household & references',
    fields: [
      ['household', 'Household members & pets', 'text'],
      ['rentalHistory', 'Rental history', 'text'],
      ['reference', 'Reference contact details', 'text'],
      ['additional', 'Additional information (optional)', 'text'],
    ],
  },
  { title: 'Documents', fields: [] },
  { title: 'Review & submit', fields: [] },
];
export function ApplicantPortal() {
  const { applicationId } = useParams();
  const [params] = useSearchParams();
  const { data, user, act } = usePortal();
  const a = data.applications.find((x) => x.id === applicationId);
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState('Saved');
  useEffect(() => {
    if (params.get('section') === 'documents') setStep(4);
    else if (params.get('section') === 'details') setStep(0);
  }, [params]);
  if (!a)
    return (
      <Empty
        title="Application not found"
        description="Check the invitation link or contact the office."
      />
    );
  if (user?.role === 'APPLICANT' && a.applicantId !== user.applicantId)
    return (
      <Empty
        title="Access denied"
        description="This application is not linked to your demo account."
      />
    );
  if (
    user?.role === 'FIELD_OFFICER' &&
    !data.viewings.some((v) => v.applicationId === a.id && v.officerId === user.id)
  )
    return (
      <Empty title="Access denied" description="This application is not linked to your viewing." />
    );
  const p = data.properties.find((p) => p.id === a.propertyId)!;
  const readOnly = !['Invited to Apply', 'Application Started', 'Documents Required'].includes(
    a.status,
  );
  const fields = sections.flatMap((s) => s.fields).filter((f) => f[0] !== 'additional');
  const complete = fields.filter((f) => !!a.form[f[0]]?.trim()).length;
  const percent = Math.round(
    ((complete +
      (a.declaration ? 1 : 0) +
      Math.min(
        4,
        data.documents.filter(
          (d) =>
            d.applicationId === a.id && !['Replacement Required', 'Rejected'].includes(d.status),
        ).length,
      )) /
      (fields.length + 5)) *
      100,
  );
  const update = (key: string, value: string) => {
    setSaved('Saving…');
    const ok = act(
      () => portal.saveApplication(user!, a.id, { ...a.form, [key]: value }, a.declaration),
      '',
    );
    setSaved(ok ? 'Saved' : 'Could not save');
  };
  const statusView = params.get('section') === 'status';
  const verificationView = params.get('section') === 'verification';
  return (
    <>
      <Heading
        eyebrow={
          user?.role === 'APPLICANT' ? 'YOUR NEXT HOME' : 'APPLICANT EXPERIENCE · STAFF PREVIEW'
        }
        title={
          statusView ? 'Application status' : verificationView ? 'Verification' : 'Your application'
        }
        description="A few clear steps towards your next home."
      >
        <Badge>{a.status}</Badge>
      </Heading>
      <div className="applicant-property">
        <span className="property-thumb">
          <Building2 />
        </span>
        <div>
          <strong>{p.address}</strong>
          <small>
            {p.city} · {p.postcode}
          </small>
        </div>
        <strong>
          {money(p.rent)} <small className="inline">pcm</small>
        </strong>
      </div>
      {verificationView ? (
        <Checks app={a} readOnly />
      ) : statusView || readOnly ? (
        <>
          <Card title="Your application journey">
            <p>
              {a.status === 'Rejected'
                ? 'Your application was not successful. Contact the agency for further information.'
                : a.status === 'Approved'
                  ? 'Your application has been approved. The agency will contact you about the next steps.'
                  : 'Your details have been received. You can follow each stage below.'}
            </p>
            {[
              'Application Started',
              'Application Submitted',
              'Documents Complete',
              'Identity Verification',
              'Credit Check',
              'FCDO Check',
              'Staff Review',
              'Landlord Review',
              'Final Decision',
            ].map((s, i) => {
              const done =
                (i === 0 && a.status !== 'Invited to Apply') ||
                (i === 1 && !['Invited to Apply', 'Application Started'].includes(a.status)) ||
                (i === 2 &&
                  data.documents.filter((d) => d.applicationId === a.id && d.status === 'Accepted')
                    .length === 4) ||
                (i === 3 && a.checks.identity.status === 'Verified') ||
                (i === 4 && a.checks.credit.status === 'Passed') ||
                (i === 5 && a.checks.fcdo.status === 'Clear') ||
                (i === 6 &&
                  ['Internal Approval', 'Landlord Review', 'Approved'].includes(a.status)) ||
                (i === 7 && a.status === 'Approved') ||
                (i === 8 && ['Approved', 'Rejected', 'Withdrawn'].includes(a.status));
              return (
                <div className="schedule-row" key={s}>
                  <CheckCircle2 className={done ? 'success' : 'muted'} />
                  <strong>{s}</strong>
                  <Badge>{done ? 'Completed' : 'Pending'}</Badge>
                </div>
              );
            })}
          </Card>
          <UploadDocuments appId={a.id} />
        </>
      ) : (
        <div className="wizard">
          <aside className="wizard-nav">
            <div className="card-title">
              <strong>Your progress</strong>
              <span>{percent}%</span>
            </div>
            <progress max="100" value={percent} />
            {sections.map((s, i) => (
              <button
                className={step === i ? 'active' : ''}
                onClick={() => setStep(i)}
                key={s.title}
              >
                <span>{i + 1}</span>
                {s.title}
                {s.fields.length > 0 &&
                  s.fields.filter((f) => f[0] !== 'additional').every((f) => a.form[f[0]]) && (
                    <CheckCircle2 size={16} />
                  )}
              </button>
            ))}
            <small>
              <LockKeyhole size={14} />
              Details saved on this device
            </small>
          </aside>
          <div>
            <Card
              title={`${step + 1}. ${sections[step].title}`}
              action={<small className="success">✓ {saved}</small>}
            >
              {step < 4 ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setStep(step + 1);
                  }}
                >
                  <p className="muted">
                    {step === 0
                      ? 'Tell us a little about yourself. All fields are required.'
                      : step === 1
                        ? 'Include postcodes so we can identify your address history.'
                        : step === 2
                          ? 'Enter your yearly income before tax. If not employed, describe your income source.'
                          : 'Tell us who will live with you and provide a reference.'}
                  </p>
                  <div className="form-grid">
                    {sections[step].fields.map(([key, label, type]) => (
                      <label key={key}>
                        {label}
                        <input
                          type={type}
                          required={key !== 'additional'}
                          min={type === 'number' ? 1 : undefined}
                          max={key === 'dob' ? '2026-10-06' : undefined}
                          value={a.form[key] || ''}
                          onChange={(e) => update(key, e.target.value)}
                        />
                      </label>
                    ))}
                  </div>
                  <div className="actions end">
                    <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)}>
                      Back
                    </button>
                    <button className="primary">Save & continue →</button>
                  </div>
                </form>
              ) : step === 4 ? (
                <>
                  <p>Have the right documents ready. Each upload explains what we need.</p>
                  <UploadDocuments appId={a.id} />
                  <div className="actions end">
                    <button onClick={() => setStep(3)}>Back</button>
                    <button className="primary" onClick={() => setStep(5)}>
                      Review application →
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p>Review your information before sending it to the applications team.</p>
                  <dl>
                    {fields.map(([k, label]) => (
                      <div key={k}>
                        <dt>{label}</dt>
                        <dd>
                          {a.form[k] || (
                            <span className="danger">Missing — return to complete</span>
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={a.declaration}
                      onChange={(e) =>
                        act(
                          () => portal.saveApplication(user!, a.id, a.form, e.target.checked),
                          'Declaration saved',
                        )
                      }
                    />
                    I confirm the information is accurate and consent to simulated checks for this
                    demonstration.
                  </label>
                  <div className="notice">
                    Demo only. No real identity, credit or compliance check will take place.
                  </div>
                  <button
                    className="primary full"
                    onClick={() =>
                      act(
                        () => portal.submit(user!, a.id),
                        'Application submitted successfully. Simulated checks requested.',
                      )
                    }
                  >
                    Submit application
                  </button>
                </>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
