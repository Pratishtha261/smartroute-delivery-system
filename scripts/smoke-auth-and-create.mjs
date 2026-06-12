async function postJson(url, body, headers = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { ok: res.ok, status: res.status, json };
}

const API = 'http://127.0.0.1:5000/api';

// Register (idempotent-ish): if already registered, just login.
const email = 'manager@demo.com';
const password = 'manager123';

let token = null;

const reg = await postJson(`${API}/auth/register`, {
  name: 'Demo Manager',
  email,
  password,
  role: 'manager',
});

if (reg.ok && reg.json?.data?.token) {
  token = reg.json.data.token;
} else {
  const login = await postJson(`${API}/auth/login`, { email, password });
  if (!login.ok || !login.json?.data?.token) {
    console.error('AUTH_FAILED', { reg, login });
    process.exit(1);
  }
  token = login.json.data.token;
}

const created = await postJson(
  `${API}/deliveries/create`,
  {
    pickupLocation: { latitude: 28.7041, longitude: 77.1025 },
    dropLocations: [{ latitude: 28.6139, longitude: 77.209 },
    ],
    priority: 'medium',
  },
  { Authorization: `Bearer ${token}` }
);

if (!created.ok) {
  console.error('CREATE_FAILED', created);
  process.exit(1);
}

console.log('OK', { deliveryId: created.json?.data?._id });

