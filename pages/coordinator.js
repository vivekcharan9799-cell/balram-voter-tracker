import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProgressRing from '../lib/ProgressRing';
import { getPollingStatus } from '../lib/pollingWindow';

const STATUS_LABEL = {
  voted: 'Voted',
  not_voted: 'Not voted',
  not_interested: 'Not interested',
};

export default function Coordinator() {
  const router = useRouter();
  const [id, setId] = useState(null);
  const [name, setName] = useState('');
  const [people, setPeople] = useState([]);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
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
    if (!newName.trim()) return;
    await fetch('/api/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinatorId: id,
        action: 'add',
        person: { name: newName, phone: newPhone },
      }),
    });
    setNewName('');
    setNewPhone('');
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
    const clean = (phone || '').replace(/[^0-9+]/g, '');
    return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
  }

  function callLink(phone) {
    return `tel:${(phone || '').replace(/[^0-9+]/g, '')}`;
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
        <ProgressRing percent={percent} label={`${voted} of ${total} voted`} />
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
            placeholder="Phone (with country code)"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
          />
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
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.phone}</div>
            </div>
            <span className={`status-pill status-${p.status}`}>{STATUS_LABEL[p.status]}</span>
          </div>
          <div className="grid-2" style={{ marginBottom: 8 }}>
            <button className="btn small" onClick={() => setStatus(p, 'voted')}>Mark voted</button>
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
