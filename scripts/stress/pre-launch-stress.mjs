#!/usr/bin/env node
/**
 * Pre-launch stress simulations (run against local/staging API).
 *
 * Usage:
 *   API_URL=http://localhost:4000 node scripts/stress/pre-launch-stress.mjs ws-flood
 *   API_URL=http://localhost:4000 node scripts/stress/pre-launch-stress.mjs queue-spike
 *   API_URL=http://localhost:4000 ADMIN_TOKEN=... node scripts/stress/pre-launch-stress.mjs reconnect-storm
 */

const API = process.env.API_URL || 'http://localhost:4000';
const WS = process.env.WS_URL || API.replace(/^http/, 'ws');
const TOKEN = process.env.ADMIN_TOKEN || '';

const mode = process.argv[2] || 'help';

async function httpGet(path) {
  const res = await fetch(`${API}${path}`, {
    headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
  });
  return res.json().catch(() => ({}));
}

async function wsFlood(clients = 30) {
  const { io } = await import('socket.io-client');
  const sockets = [];
  console.log(`WS flood: ${clients} clients to ${WS}/tracking`);
  for (let i = 0; i < clients; i++) {
    const s = io(`${WS}/tracking`, { transports: ['websocket', 'polling'], reconnection: false });
    sockets.push(s);
    s.on('connect', () => {
      s.emit('courier:location', {
        courierId: `stress-${i}`,
        latitude: 41.3 + i * 0.001,
        longitude: 69.24,
      });
    });
  }
  await new Promise((r) => setTimeout(r, 8000));
  sockets.forEach((s) => s.disconnect());
  const obs = await httpGet('/api/v1/monitoring/observability');
  console.log('WS metrics:', obs.websocket);
}

async function queueSpike(jobs = 50) {
  if (!TOKEN) {
    console.error('Set ADMIN_TOKEN for queue-spike (needs auth to inspect queues)');
    process.exit(1);
  }
  console.log(`Queue spike: inspect current queue depth (${jobs} simulated via API health)`);
  const before = await httpGet('/api/v1/monitoring/queues');
  console.log('Before:', before);
  console.log('Tip: run worker with test jobs in staging, or POST bulk notifications in test env.');
  await new Promise((r) => setTimeout(r, 2000));
  const after = await httpGet('/api/v1/monitoring/queues');
  console.log('After:', after);
}

async function reconnectStorm(cycles = 20) {
  const { io } = await import('socket.io-client');
  console.log(`Reconnect storm: ${cycles} connect/disconnect cycles`);
  for (let i = 0; i < cycles; i++) {
    await new Promise((resolve) => {
      const s = io(`${WS}/tracking`, { transports: ['polling', 'websocket'], reconnection: false });
      s.on('connect', () => {
        setTimeout(() => {
          s.disconnect();
          resolve();
        }, 200);
      });
      s.on('connect_error', () => resolve());
    });
  }
  const obs = await httpGet('/api/v1/monitoring/observability');
  console.log('Reconnects last 5m:', obs.websocket?.reconnectsLast5Min);
  console.log('Spike flag:', obs.websocket?.reconnectSpike);
}

async function concurrentOrdersHint() {
  console.log('Concurrent orders: use staging seed + parallel checkout scripts.');
  console.log('Monitor: GET /api/v1/ops/live-board with ADMIN_TOKEN');
}

const runners = {
  'ws-flood': () => wsFlood(Number(process.env.CLIENTS || 30)),
  'queue-spike': () => queueSpike(),
  'reconnect-storm': () => reconnectStorm(Number(process.env.CYCLES || 25)),
  orders: () => concurrentOrdersHint(),
  help: () => {
    console.log('Modes: ws-flood | queue-spike | reconnect-storm | orders');
  },
};

(runners[mode] || runners.help)().catch((e) => {
  console.error(e);
  process.exit(1);
});
