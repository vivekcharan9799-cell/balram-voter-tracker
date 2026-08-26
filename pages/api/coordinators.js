import { addCoordinator, getAllData, setTarget } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const data = await getAllData();
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { adminPassword, name, password, target } = req.body;
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ ok: false, error: 'Not authorized' });
    }
    if (typeof target === 'number') {
      await setTarget(target);
    }
    if (name) {
      const coordinator = await addCoordinator(name, password || '1234');
      return res.status(200).json({ ok: true, coordinator });
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
