import { getCoordinators } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { name, password, asAdmin } = req.body;

  if (asAdmin) {
    if (password === process.env.ADMIN_PASSWORD) {
      return res.status(200).json({ ok: true, role: 'admin' });
    }
    return res.status(401).json({ ok: false, error: 'Wrong admin password' });
  }

  const coordinators = await getCoordinators();
  const match = coordinators.find(
    (c) => c.name.toLowerCase() === (name || '').trim().toLowerCase()
  );
  if (!match) return res.status(401).json({ ok: false, error: 'No such coordinator' });
  if (match.password !== password) return res.status(401).json({ ok: false, error: 'Wrong password' });

  return res.status(200).json({ ok: true, role: 'coordinator', id: match.id, name: match.name });
}
