import { createClient } from 'redis';

let client;
async function getClient() {
  if (!client) {
    client = createClient({ url: process.env.REDIS_URL });
    client.on('error', (err) => console.error('Redis error', err));
    await client.connect();
  }
  return client;
}

// Wrapper matching the small subset of kv methods we use, backed by node-redis
const kv = {
  async get(key) {
    const c = await getClient();
    const val = await c.get(key);
    return val ? JSON.parse(val) : null;
  },
  async set(key, value) {
    const c = await getClient();
    return c.set(key, JSON.stringify(value));
  },
};

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

export async function addCoordinator(name, password, phone) {
  const list = await getCoordinators();
  const id = name.trim().toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36);
  const coordinator = { id, name: name.trim(), password, phone: phone || '' };
  list.push(coordinator);
  await saveCoordinators(list);
  await kv.set(peopleKey(id), []);
  return coordinator;
}

// Checks if a phone number is already assigned to ANY coordinator's list.
// Returns the coordinator name if found, otherwise null.
export async function findDuplicatePhone(phone, excludeCoordinatorId) {
  if (!phone) return null;
  const clean = phone.replace(/[^0-9]/g, '');
  if (!clean) return null;
  const coordinators = await getCoordinators();
  for (const c of coordinators) {
    if (c.id === excludeCoordinatorId) continue;
    const people = await getPeople(c.id);
    const match = people.find((p) => (p.phone || '').replace(/[^0-9]/g, '') === clean);
    if (match) return c.name;
  }
  return null;
}

export async function deleteCoordinator(id) {
  const list = await getCoordinators();
  const filtered = list.filter((c) => c.id !== id);
  await saveCoordinators(filtered);
  await kv.set(peopleKey(id), []);
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
