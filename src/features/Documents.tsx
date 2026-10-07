import { useState } from 'react';
import { Upload, FileText, CheckCircle2 } from 'lucide-react';
import { usePortal, portal } from '../app/context';
import { requiredDocuments } from '../services/portal';
import { Badge, Card, Confirm, DataTable, Filters, Heading, date } from '../components/ui';
const guidance: Record<string, string> = {
  'Photo ID':
    'Passport or driving licence. No selfies, social media screenshots or unrelated photos.',
  'Proof of Address':
    'Recent council tax bill or utility bill showing your name and current address.',
  'Proof of Income':
    'Your latest payslips or accountant statement. Include your name and pay period.',
  'Bank Statement':
    'Recent statement showing your name and regular income. Mask unrelated account details.',
};
export function UploadDocuments({ appId, staff = false }: { appId: string; staff?: boolean }) {
  const { data, user, act } = usePortal();
  const [replacement, setReplacement] = useState('');
  const locked = ['Approved', 'Rejected', 'Withdrawn'].includes(
    data.applications.find((a) => a.id === appId)?.status || '',
  );
  function upload(type: string, file?: File) {
    if (file)
      act(() => portal.upload(user!, appId, type, file), 'Document metadata saved for review');
  }
  return (
    <>
      <div className="notice">
        PDF, JPG or PNG · Maximum 5 MB per file · Only file metadata is saved.
      </div>
      <div className="document-grid">
        {requiredDocuments.map((type) => {
          const doc = data.documents.find((d) => d.applicationId === appId && d.type === type);
          return (
            <Card key={type}>
              <div className="card-title">
                <h3>
                  <FileText size={18} />
                  {type}
                </h3>
                <Badge>{doc?.status || 'Missing'}</Badge>
              </div>
              <p>{guidance[type]}</p>
              <small>
                Why we need it:{' '}
                {type === 'Photo ID'
                  ? 'confirm who is applying'
                  : type === 'Proof of Address'
                    ? 'confirm your current residence'
                    : 'assess the application consistently'}
                .
              </small>
              {doc && (
                <div className="file-row">
                  <CheckCircle2 size={18} />
                  <span>
                    {doc.name}
                    <small>
                      {Math.round(doc.size / 1024)} KB · {date(doc.uploadedAt)}
                    </small>
                  </span>
                </div>
              )}
              {doc?.reason && <div className="alert">Replacement guidance: {doc.reason}</div>}
              <label
                className="upload-zone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  upload(type, e.dataTransfer.files[0]);
                }}
              >
                <Upload size={20} />
                <span>{doc ? 'Replace file' : 'Choose or drop a file'}</span>
                <input
                  disabled={locked}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={(e) => upload(type, e.target.files?.[0])}
                />
              </label>
              {staff && doc && !locked && (
                <div className="actions">
                  <button
                    disabled={doc.status === 'Accepted'}
                    onClick={() =>
                      act(
                        () => portal.reviewDocument(user!, doc.id, 'Accepted', ''),
                        'Document accepted',
                      )
                    }
                  >
                    Accept document
                  </button>
                  <button onClick={() => setReplacement(doc.id)}>Request replacement</button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      {replacement && (
        <Confirm
          title="Request replacement document"
          description="Explain what is wrong and which document the applicant should upload."
          onClose={() => setReplacement('')}
          onConfirm={(reason) => {
            if (
              act(
                () => portal.reviewDocument(user!, replacement, 'Replacement Required', reason),
                'Replacement requested',
              )
            )
              setReplacement('');
          }}
        />
      )}
    </>
  );
}
export function Documents() {
  const { data } = usePortal();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  return (
    <>
      <Heading
        title="Documents"
        description="Guided uploads and a clear review queue. File metadata only."
      />
      <Card>
        <Filters
          query={query}
          onQuery={setQuery}
          status={status}
          onStatus={setStatus}
          statuses={['Needs Review', 'Accepted', 'Replacement Required', 'Rejected']}
        />
        <DataTable
          rows={data.documents.filter(
            (d) =>
              (d.name + ' ' + d.type + ' ' + d.applicationId)
                .toLowerCase()
                .includes(query.toLowerCase()) &&
              (!status || d.status === status),
          )}
          keyOf={(d) => d.id}
          columns={[
            {
              label: 'Document',
              render: (d) => (
                <>
                  <strong>{d.name}</strong>
                  <small>{d.type}</small>
                </>
              ),
            },
            {
              label: 'Application',
              render: (d) => (
                <a href={'/applications/' + d.applicationId + '?tab=Documents'}>
                  {d.applicationId}
                </a>
              ),
            },
            { label: 'Uploaded', render: (d) => date(d.uploadedAt) },
            { label: 'Size', render: (d) => Math.round(d.size / 1024) + ' KB' },
            { label: 'Status', render: (d) => <Badge>{d.status}</Badge> },
          ]}
        />
      </Card>
    </>
  );
}
