import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, ArrowUpRight } from 'lucide-react';
export const money = (n: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(n);
export const date = (s: string) =>
  new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
export function Badge({ children }: { children: ReactNode }) {
  const s = String(children);
  return (
    <span
      className={
        'badge ' +
        (/Approved|Accepted|Verified|Passed|Clear|Completed|Live|Submitted|Simulated Sent/.test(s)
          ? 'green'
          : /Reject|Fail|Attention|Replacement/.test(s)
            ? 'red'
            : /Pending|Review|Required|Offer|Processing/.test(s)
              ? 'amber'
              : '')
      }
    >
      {children}
    </span>
  );
}
export function Heading({
  eyebrow = 'WORKSPACE',
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="actions">{children}</div>
    </div>
  );
}
export function Card({
  title,
  children,
  action,
}: {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="card">
      {title && (
        <div className="card-title">
          <h2>{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Empty({
  title = 'No matching records',
  description = 'Try adjusting your search or clearing the filters.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="empty">
      <Search size={28} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog ref={ref} onCancel={onClose}>
      <div className="card-title">
        <h2>{title}</h2>
        <button className="icon-button" aria-label="Close dialog" onClick={onClose}>
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Confirm({
  title,
  description,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <Modal title={title} onClose={onClose}>
      <p>{description}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onConfirm(reason);
        }}
      >
        <label>
          Reason / recommendation
          <textarea autoFocus required value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <div className="actions end">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary">Confirm action</button>
        </div>
      </form>
    </Modal>
  );
}
export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: string[];
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t}
          role="tab"
          aria-selected={t === value}
          className={t === value ? 'active' : ''}
          onClick={() => onChange(t)}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
export function Stat({
  label,
  value,
  to,
  hint,
}: {
  label: string;
  value: number;
  to: string;
  hint: string;
}) {
  return (
    <Link className="stat" to={to}>
      <div>
        {label}
        <ArrowUpRight size={17} />
      </div>
      <strong>{String(value).padStart(2, '0')}</strong>
      <small>{hint}</small>
    </Link>
  );
}
export function DataTable<T>({
  rows,
  columns,
  keyOf,
}: {
  rows: T[];
  columns: { label: string; render: (r: T) => ReactNode }[];
  keyOf: (r: T) => string;
}) {
  const [page, setPage] = useState(0);
  const pages = Math.ceil(rows.length / 8);
  const current = Math.min(page, Math.max(0, pages - 1));
  if (!rows.length) return <Empty />;
  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.label}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(current * 8, current * 8 + 8).map((r) => (
              <tr key={keyOf(r)}>
                {columns.map((c) => (
                  <td key={c.label}>{c.render(r)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <span>
          {current * 8 + 1}–{Math.min(current * 8 + 8, rows.length)} of {rows.length} records
        </span>
        <div className="actions">
          <button disabled={!current} onClick={() => setPage(current - 1)}>
            Previous
          </button>
          <span>
            {current + 1} / {pages}
          </span>
          <button disabled={current + 1 >= pages} onClick={() => setPage(current + 1)}>
            Next
          </button>
        </div>
      </div>
    </>
  );
}
export function Filters({
  query,
  onQuery,
  status,
  onStatus,
  statuses,
  children,
  onClear,
}: {
  query: string;
  onQuery: (s: string) => void;
  status: string;
  onStatus: (s: string) => void;
  statuses: string[];
  children?: ReactNode;
  onClear?: () => void;
}) {
  return (
    <div className="filters">
      <div className="search-input">
        <Search size={17} />
        <input
          aria-label="Search records"
          placeholder="Search records…"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
      </div>
      <select
        aria-label="Filter by status"
        value={status}
        onChange={(e) => onStatus(e.target.value)}
      >
        <option value="">All statuses</option>
        {statuses.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      {children}
      <button
        onClick={() => {
          onQuery('');
          onStatus('');
          onClear?.();
        }}
      >
        Clear filters
      </button>
    </div>
  );
}
