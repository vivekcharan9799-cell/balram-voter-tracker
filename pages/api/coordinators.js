import { addCoordinator, getAllData, setTarget, getCoordinators, deleteCoordinator } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const data = await getAllData();
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { adminPassword, name, password, phone, target } = req.body;
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ ok: false, error: 'Not authorized' });
    }
    if (typeof target === 'number') {
      await setTarget(target);
    }
    if (name) {
      const existing = await getCoordinators();
      const dup = existing.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
      if (dup) {
        return res.status(400).json({ ok: false, error: `A coordinator named "${name}" already exists. Use a different name.` });
      }
      const coordinator = await addCoordinator(name, password || '1234', phone);
      return res.status(200).json({ ok: true, coordinator });
    }
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const { adminPassword, id } = req.body;
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ ok: false, error: 'Not authorized' });
    }
    if (!id) return res.status(400).json({ ok: false, error: 'Coordinator id required' });
    await deleteCoordinator(id);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
