import { useState } from 'react';
import { usePortal, portal } from '../app/context';
import { Card, Empty, date } from '../components/ui';
export function Notes({ entityId, propertyId }: { entityId: string; propertyId?: string }) {
  const { data, user, act } = usePortal();
  const [text, setText] = useState('');
  const [category, setCategory] = useState('General');
  return (
    <Card title="Internal notes">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (
            act(
              () => portal.note(user!, entityId, text, category, propertyId),
              'Internal note added',
            )
          )
            setText('');
        }}
      >
        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {['General', 'Application', 'Viewing', 'Inspection', 'Property', 'Landlord'].map(
              (x) => (
                <option key={x}>{x}</option>
              ),
            )}
          </select>
        </label>
        <label>
          Staff-only note
          <textarea
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add context for your colleagues…"
          />
        </label>
        <button className="primary">Add internal note</button>
      </form>
      {data.notes
        .filter((n) => n.entityId === entityId)
        .map((n) => (
          <div className="activity" key={n.id}>
            <div>
              <strong>
                {n.author} · {n.category}
              </strong>
              <p>{n.content}</p>
              <small>{date(n.date)} · Internal</small>
            </div>
          </div>
        ))}
    </Card>
  );
}
export function Timeline({ entityId, propertyId }: { entityId?: string; propertyId?: string }) {
  const { data } = usePortal();
  const rows = data.auditLogs.filter((a) =>
    propertyId ? a.propertyId === propertyId : a.entityId === entityId,
  );
  return (
    <Card title="Activity & audit history">
      {rows.length ? (
        rows.map((a) => (
          <div className="activity" key={a.id}>
            <span className="activity-dot" />
            <div>
              <strong>{a.action}</strong>
              <p>{a.description}</p>
              <small>
                {date(a.timestamp)} · {a.user} · {a.role}
              </small>
            </div>
          </div>
        ))
      ) : (
        <Empty title="No activity yet" description="Actions on this record will appear here." />
      )}
    </Card>
  );
}
