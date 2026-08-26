import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProgressRing from '../lib/ProgressRing';
import { getPollingStatus } from '../lib/pollingWindow';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry',
  'Chandigarh', 'Other',
];

const STATUS_LABEL = {
  voted: 'Appeared',
  not_voted: 'Pending',
  not_interested: 'Not interested',
};

export default function Coordinator() {
  const router = useRouter();
  const [id, setId] = useState(null);
  const [name, setName] = useState('');
  const [people, setPeople] = useState([]);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newState, setNewState] = useState('');
  const [addError, setAddError] = useState('');
  const [pollStatus, setPollStatus] = useState(getPollingStatus());

  useEffect(() => {
    const cid = sessionStorage.getItem('coordinatorId');
    const cname = sessionStorage.getItem('coordinatorName');
    if (!cid) {
      router.push('/');
      return;
    }
    setId(cid);
    setName(cname);
    loadPeople(cid);
    const t = setInterval(() => setPollStatus(getPollingStatus()), 60000);
    return () => clearInterval(t);
  }, []);

  async function loadPeople(cid) {
    const res = await fetch(`/api/people?coordinatorId=${cid}`);
    const data = await res.json();
    setPeople(data.people || []);
  }

  async function addPerson(e) {
    e.preventDefault();
    setAddError('');
    if (!newName.trim()) return;
    const res = await fetch('/api/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinatorId: id,
        action: 'add',
        person: { name: newName, phone: newPhone, state: newState },
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      setAddError(data.error || 'Could not add person');
      return;
    }
    setNewName('');
    setNewPhone('');
    setNewState('');
    loadPeople(id);
  }

  async function setStatus(person, status) {
    await fetch('/api/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinatorId: id,
        action: 'update',
        person: { id: person.id, status },
      }),
    });
    loadPeople(id);
  }

  const voted = people.filter((p) => p.status === 'voted').length;
  const total = people.length;
  const percent = total ? (voted / total) * 100 : 0;
  const pending = people.filter((p) => p.status !== 'voted');

  function waLink(phone, message) {
    const clean = (phone || '').replace(/[^0-9]/g, '');
    const withCode = clean.length === 10 ? `91${clean}` : clean;
    return `https://wa.me/${withCode}?text=${encodeURIComponent(message)}`;
  }

  function callLink(phone) {
    const clean = (phone || '').replace(/[^0-9]/g, '');
    const withCode = clean.length === 10 ? `+91${clean}` : `+${clean}`;
    return `tel:${withCode}`;
  }

  function reminderMessage(personName) {
    return `Hi ${personName}, I don't think you've shown up for the vote yet. Kindly show up before polling closes — please let me know if you need any help getting there. 🙏`;
  }

  if (!id) return null;

  return (
    <div className="page">
      <div className="eyebrow">Coordinator</div>
      <h1 className="title">{name}'s List</h1>
      <p className="subtitle">{pollStatus.label}</p>

      <div className="ring-wrap">
        <ProgressRing percent={percent} label={`${voted} of ${total} appeared`} />
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Add a person</h3>
        <form onSubmit={addPerson} className="grid-2">
          <input
            type="text"
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            type="tel"
            placeholder="10-digit phone number"
            value={newPhone}
            maxLength={10}
            onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
          />
          <select
            value={newState}
            onChange={(e) => setNewState(e.target.value)}
            style={{ gridColumn: '1 / -1' }}
          >
            <option value="">Preferred state (optional)</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {addError && (
            <p style={{ color: 'var(--bad)', fontSize: 13, gridColumn: '1 / -1', margin: 0 }}>{addError}</p>
          )}
          <button className="btn" type="submit" style={{ gridColumn: '1 / -1' }}>
            Add to my list
          </button>
        </form>
      </div>

      <h3>My people ({total})</h3>
      {people.map((p) => (
        <div className="panel" key={p.id}>
          <div className="card-row" style={{ marginBottom: 10 }}>
            <div>
              <strong>{p.name}</strong>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.phone}{p.state ? ` · ${p.state}` : ''}</div>
            </div>
            {p.status !== 'not_voted' && (
              <span className={`status-pill status-${p.status}`}>{STATUS_LABEL[p.status]}</span>
            )}
          </div>
          <div className="grid-2" style={{ marginBottom: 8 }}>
            <button className="btn small" onClick={() => setStatus(p, 'voted')}>Mark appeared</button>
            <button className="btn small secondary" onClick={() => setStatus(p, 'not_interested')}>Not interested</button>
          </div>
          {p.status !== 'voted' && (
            <div className="grid-2">
              <a className="btn small call" href={callLink(p.phone)}>📞 Call</a>
              <a
                className="btn small whatsapp"
                href={waLink(p.phone, reminderMessage(p.name))}
                target="_blank"
                rel="noreferrer"
              >
                💬 WhatsApp
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
