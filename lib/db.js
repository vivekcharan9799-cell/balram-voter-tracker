import { kv } from '@vercel/kv';

// ---- Keys ----
// coordinators -> JSON array of { id, name, password }
// people:<coordinatorId> -> JSON array of { id, name, phone, status, note }
// target -> number

const COORD_KEY = 'coordinators';
const TARGET_KEY = 'target';

export async function getCoordinators() {
  const data = await kv.get(COORD_KEY);
  return data || [];
}

export async function saveCoordinators(list) {
  await kv.set(COORD_KEY, list);
}

export async function addCoordinator(name, password) {
  const list = await getCoordinators();
  const id = name.trim().toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36);
  const coordinator = { id, name: name.trim(), password };
  list.push(coordinator);
  await saveCoordinators(list);
  await kv.set(peopleKey(id), []);
  return coordinator;
}

export function peopleKey(coordinatorId) {
  return `people:${coordinatorId}`;
}

export async function getPeople(coordinatorId) {
  const data = await kv.get(peopleKey(coordinatorId));
  return data || [];
}

export async function savePeople(coordinatorId, people) {
  await kv.set(peopleKey(coordinatorId), people);
}

export async function getTarget() {
  const t = await kv.get(TARGET_KEY);
  return t || 223;
}

export async function setTarget(t) {
  await kv.set(TARGET_KEY, t);
}

export async function getAllData() {
  const coordinators = await getCoordinators();
  const withPeople = await Promise.all(
    coordinators.map(async (c) => ({
      ...c,
      people: await getPeople(c.id),
    }))
  );
  const target = await getTarget();
  return { coordinators: withPeople, target };
}
