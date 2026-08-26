import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const [role, setRole] = useState('coordinator');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          password,
          asAdmin: role === 'admin',
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }
      if (data.role === 'admin') {
        sessionStorage.setItem('adminPassword', password);
        router.push('/admin');
      } else {
        sessionStorage.setItem('coordinatorId', data.id);
        sessionStorage.setItem('coordinatorName', data.name);
        router.push('/coordinator');
      }
    } catch (err) {
      setError('Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 420 }}>
      <div className="eyebrow">Polling Day Command</div>
      <h1 className="title">Balram — Voter Tracker</h1>
      <p className="subtitle">Log in to update or watch turnout live, booth-side.</p>

      <div className="panel">
        <div className="grid-2" style={{ marginBottom: 16 }}>
          <button
            className={role === 'coordinator' ? 'btn' : 'btn secondary'}
            onClick={() => setRole('coordinator')}
            type="button"
          >
            Coordinator
          </button>
          <button
            className={role === 'admin' ? 'btn' : 'btn secondary'}
            onClick={() => setRole('admin')}
            type="button"
          >
            Balram / Admin
          </button>
        </div>

        <form onSubmit={handleLogin}>
          {role === 'coordinator' && (
            <div style={{ marginBottom: 10 }}>
              <input
                type="text"
                placeholder="Your name (e.g. Sawai)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p style={{ color: 'var(--bad)', fontSize: 13, marginTop: -6 }}>{error}</p>}
          <button className="btn" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Checking...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}
