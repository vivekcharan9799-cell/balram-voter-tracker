import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProgressRing from '../lib/ProgressRing';
import { getPollingStatus } from '../lib/pollingWindow';

export default function Admin() {
  const router = useRouter();
  const [adminPassword, setAdminPassword] = useState(null);
  const [data, setData] = useState({ coordinators: [], target: 223 });
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('1234');
  const [newPhone, setNewPhone] = useState('');
  const [addError, setAddError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showPasswordId, setShowPasswordId] = useState(null);
  const [pollStatus, setPollStatus] = useState(getPollingStatus());

  useEffect(() => {
    const pw = sessionStorage.getItem('adminPassword');
    if (!pw) {
      router.push('/');
      return;
    }
    setAdminPassword(pw);
    load();
    const t1 = setInterval(load, 30000);
    const t2 = setInterval(() => setPollStatus(getPollingStatus()), 60000);
    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, []);

  async function load() {
    const res = await fetch('/api/coordinators');
    const d = await res.json();
    setData(d);
  }

  async function addCoordinator(e) {
    e.preventDefault();
    setAddError('');
    if (!newName.trim()) return;
    const res = await fetch('/api/coordinators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword, name: newName, password: newPassword, phone: newPhone }),
    });
    const data = await res.json();
    if (!data.ok) {
      setAddError(data.error || 'Could not create coordinator');
      return;
    }
    setNewName('');
    setNewPassword('1234');
    setNewPhone('');
    load();
  }

  async function removeCoordinator(c) {
    if (!confirm(`Delete ${c.name} and all their data? This cannot be undone.`)) return;
    await fetch('/api/coordinators', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword, id: c.id }),
    });
    load();
  }

  const totals = data.coordinators.reduce(
    (acc, c) => {
      acc.total += c.people.length;
      acc.voted += c.people.filter((p) => p.status === 'voted').length;
      return acc;
    },
    { total: 0, voted: 0 }
  );
  const targetPercent = data.target ? (totals.voted / data.target) * 100 : 0;

  function nudgeLink(coordinator) {
    const voted = coordinator.people.filter((p) => p.status === 'voted').length;
    const total = coordinator.people.length;
    const pending = total - voted;
    const msg = `Bhai ${coordinator.name}, only ${voted} out of ${total} people have shown up so far. ${pending} still pending — only a few hours left, please work hard and get them to the booth! 🙏`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  }

  if (!adminPassword) return null;

  return (
    <div className="page">
      <div className="eyebrow">Organizer — Admin</div>
      <h1 className="title">Polling Day Overview</h1>
      <p className="subtitle">{pollStatus.label}</p>

      <div className="ring-wrap">
        <ProgressRing
          percent={targetPercent}
          size={200}
          label={`${totals.voted} of ${data.target} target`}
          sub={`${totals.total} registered`}
        />
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Add a coordinator</h3>
        <form onSubmit={addCoordinator} className="grid-2">
          <input
            type="text"
            placeholder="Coordinator name (e.g. Vivek)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Password for them"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <input
            type="tel"
            placeholder="10-digit phone number"
            value={newPhone}
            maxLength={10}
            onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            style={{ gridColumn: '1 / -1' }}
          />
          {addError && (
            <p style={{ color: 'var(--bad)', fontSize: 13, gridColumn: '1 / -1', margin: 0 }}>{addError}</p>
          )}
          <button className="btn" type="submit" style={{ gridColumn: '1 / -1' }}>
            Create coordinator login
          </button>
        </form>
      </div>

      <h3>Coordinators ({data.coordinators.length})</h3>
      {data.coordinators
        .slice()
        .sort((a, b) => {
          const pa = a.people.length ? a.people.filter(p=>p.status==='voted').length / a.people.length : 0;
          const pb = b.people.length ? b.people.filter(p=>p.status==='voted').length / b.people.length : 0;
          return pb - pa;
        })
        .map((c) => {
          const voted = c.people.filter((p) => p.status === 'voted').length;
          const notInterested = c.people.filter((p) => p.status === 'not_interested').length;
          const total = c.people.length;
          const pct = total ? Math.round((voted / total) * 100) : 0;
          return (
            <div className="panel" key={c.id}>
              <div
                className="card-row"
                style={{ marginBottom: 10, cursor: 'pointer' }}
                onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
              >
                <div>
                  <strong>{c.name}</strong>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {voted}/{total} appeared · {notInterested} not interested
                    {c.phone ? ` · ${c.phone}` : ''}
                  </div>
                </div>
                <span
                  className="status-pill"
                  style={{
                    background: pct >= 70 ? 'rgba(76,175,125,0.15)' : pct >= 40 ? 'rgba(242,169,59,0.15)' : 'rgba(217,83,79,0.15)',
                    color: pct >= 70 ? 'var(--good)' : pct >= 40 ? 'var(--accent)' : 'var(--bad)',
                  }}
                >
                  {pct}%
                </span>
              </div>

              <div className="grid-2" style={{ marginBottom: 10 }}>
                <a className="btn small whatsapp" href={nudgeLink(c)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                  💬 Nudge {c.name} on WhatsApp
                </a>
                <button
                  className="btn small secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPasswordId(showPasswordId === c.id ? null : c.id);
                  }}
                >
                  {showPasswordId === c.id ? `Password: ${c.password}` : 'Show password'}
                </button>
              </div>
              <button
                className="btn small danger"
                style={{ width: '100%', marginBottom: 10 }}
                onClick={(e) => {
                  e.stopPropagation();
                  removeCoordinator(c);
                }}
              >
                🗑 Delete {c.name} & their data
              </button>

              {expandedId === c.id && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
                  {c.people.length === 0 && (
                    <p style={{ fontSize: 13, color: 'var(--muted)' }}>No people added yet.</p>
                  )}
                  {c.people.some((p) => p.state) && (
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                      States: {Object.entries(
                        c.people.reduce((acc, p) => {
                          if (p.state) acc[p.state] = (acc[p.state] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([state, count]) => `${state} (${count})`).join(', ')}
                    </p>
                  )}
                  {c.people.map((p) => (
                    <div key={p.id} className="card-row" style={{ padding: '6px 0' }}>
                      <div>
                        <strong style={{ fontSize: 14 }}>{p.name}</strong>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {p.phone}{p.state ? ` · ${p.state}` : ''}
                        </div>
                      </div>
                      <span className={`status-pill status-${p.status}`}>{p.status.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
