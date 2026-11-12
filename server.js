import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const mode = process.env.STORAGE ?? 'memory';
if (!['memory', 'postgres'].includes(mode)) throw new Error('STORAGE debe ser memory o postgres');
const port = Number(process.env.PORT ?? 3000);
const version = process.env.APP_VERSION ?? '1.0';
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
  ['/client.js', ['client.js', 'text/javascript; charset=utf-8']],
]);
let tasks = [];
let nextId = 1;
let pool;
if (mode === 'postgres') {
  pool = new pg.Pool({ connectionTimeoutMillis: 3000, query_timeout: 5000, max: 5 });
  pool.on('error', e => console.error('Conexión de base de datos:', e.code ?? e.message));
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        done BOOLEAN NOT NULL DEFAULT FALSE
      )`);
      ready = true;
      break;
    } catch (e) {
      console.error('Esperando la base de datos:', e.code ?? e.message);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  if (!ready) { await pool.end(); throw new Error('La base no respondió; revisar PGHOST y credenciales'); }
}

function reply(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}
async function jsonBody(req) {
  if (!(req.headers['content-type'] ?? '').startsWith('application/json')) {
    throw Object.assign(new Error('Enviá application/json'), { status: 415 });
  }
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw) > 8192) throw Object.assign(new Error('Solicitud demasiado grande'), { status: 413 });
  }
  try { return JSON.parse(raw); }
  catch { throw Object.assign(new Error('JSON inválido'), { status: 400 }); }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'");
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (req.method === 'GET' && path === '/health') {
      if (pool) await pool.query('SELECT 1');
      return reply(res, 200, { ok: true, storage: mode, version });
    }
    if (req.method === 'GET' && assets.has(path)) {
      const [name, type] = assets.get(path);
      const body = await readFile(fileURLToPath(new URL(`./public/${name}`, import.meta.url)));
      res.writeHead(200, { 'Content-Type': type });
      return res.end(body);
    }
    if (req.method === 'GET' && path === '/api/tasks') {
      return reply(res, 200, pool ? (await pool.query('SELECT id, title, done FROM tasks ORDER BY id')).rows : tasks);
    }
    if (req.method === 'POST' && path === '/api/tasks') {
      const data = await jsonBody(req);
      if (typeof data?.title !== 'string' || !data.title.trim() || data.title.trim().length > 200) {
        return reply(res, 400, { error: 'La tarea debe tener entre 1 y 200 caracteres' });
      }
      const title = data.title.trim();
      const task = pool
        ? (await pool.query('INSERT INTO tasks (title) VALUES ($1) RETURNING id, title, done', [title])).rows[0]
        : { id: nextId++, title, done: false };
      if (!pool) tasks.push(task);
      return reply(res, 201, task);
    }
    const match = /^\/api\/tasks\/(\d+)$/.exec(path);
    if (match && ['PATCH', 'DELETE'].includes(req.method)) {
      const id = Number(match[1]);
      if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) return reply(res, 400, { error: 'ID inválido' });
      if (req.method === 'DELETE') {
        const found = pool
          ? (await pool.query('DELETE FROM tasks WHERE id=$1 RETURNING id', [id])).rowCount > 0
          : tasks.some(t => t.id === id);
        if (!pool) tasks = tasks.filter(t => t.id !== id);
        return reply(res, found ? 200 : 404, found ? { ok: true } : { error: 'Tarea no encontrada' });
      }
      const data = await jsonBody(req);
      if (typeof data?.done !== 'boolean') return reply(res, 400, { error: 'done debe ser booleano' });
      const task = pool
        ? (await pool.query('UPDATE tasks SET done=$1 WHERE id=$2 RETURNING id, title, done', [data.done, id])).rows[0]
        : tasks.find(t => t.id === id);
      if (!task) return reply(res, 404, { error: 'Tarea no encontrada' });
      if (!pool) task.done = data.done;
      return reply(res, 200, task);
    }
    reply(res, 404, { error: 'Ruta no encontrada' });
  } catch (e) {
    console.error('Solicitud fallida:', e.code ?? e.message);
    reply(res, e.status ?? 503, { error: e.status ? e.message : 'Servicio no disponible' });
  }
});
server.listen(port, '0.0.0.0', () => console.log(`Cofla Tareas ${version} | puerto ${port} | ${mode}`));
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, () => {
    server.close(async () => { if (pool) await pool.end(); process.exit(0); });
    setTimeout(() => process.exit(1), 8000).unref();
  });
}
