import { getPeople, savePeople, getCoordinators, findDuplicatePhone } from '../../lib/db';

export default async function handler(req, res) {
  const { coordinatorId } = req.query;
  if (!coordinatorId) return res.status(400).json({ error: 'coordinatorId required' });

  if (req.method === 'GET') {
    const people = await getPeople(coordinatorId);
    return res.status(200).json({ people });
  }

  if (req.method === 'POST') {
    // body: { action: 'add' | 'update' | 'delete', person }
    const { action, person } = req.body;
    let people = await getPeople(coordinatorId);

    if (action === 'add') {
      const digits = (person.phone || '').replace(/\D/g, '');
      if (digits && digits.length !== 10) {
        return res.status(400).json({ ok: false, error: 'Phone number must be exactly 10 digits.' });
      }
      if (digits) {
        const dupName = await findDuplicatePhone(digits, coordinatorId);
        if (dupName) {
          return res.status(400).json({
            ok: false,
            error: `This number is already assigned to ${dupName}'s list.`,
          });
        }
      }
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      people.push({
        id,
        name: person.name,
        phone: digits,
        state: person.state || '',
        status: 'not_voted', // not_voted | voted | not_interested
        note: person.note || '',
      });
    } else if (action === 'update') {
      people = people.map((p) => (p.id === person.id ? { ...p, ...person } : p));
    } else if (action === 'delete') {
      people = people.filter((p) => p.id !== person.id);
    }

    await savePeople(coordinatorId, people);
    return res.status(200).json({ ok: true, people });
  }

  return res.status(405).end();
}
