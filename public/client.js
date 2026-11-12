const list = document.querySelector('#tasks');
const error = document.querySelector('#error');
async function api(path, options = {}) {
  const res = await fetch(path, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'No se pudo completar la operación');
  return data;
}
function json(method, data) { return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }; }
async function refresh() {
  const tasks = await api('/api/tasks');
  list.replaceChildren();
  for (const task of tasks) {
    const item = document.createElement('li');
    const label = document.createElement('label');
    const check = document.createElement('input');
    check.type = 'checkbox'; check.checked = task.done;
    const title = document.createElement('span'); title.textContent = task.title;
    if (task.done) title.className = 'done';
    check.addEventListener('change', () => action(async () => { await api(`/api/tasks/${task.id}`, json('PATCH', { done: check.checked })); await refresh(); }));
    const button = document.createElement('button'); button.textContent = 'Borrar'; button.className = 'delete';
    button.addEventListener('click', () => action(async () => { await api(`/api/tasks/${task.id}`, { method: 'DELETE' }); await refresh(); }));
    label.append(check, title); item.append(label, button); list.append(item);
  }
  if (!tasks.length) { const empty = document.createElement('li'); empty.textContent = 'Todavía no hay tareas. Creá la primera.'; list.append(empty); }
}
async function action(fn) { error.textContent = ''; try { await fn(); } catch (e) { error.textContent = e.message; } }
document.querySelector('#form').addEventListener('submit', e => { e.preventDefault(); action(async () => {
  const input = document.querySelector('#title');
  await api('/api/tasks', json('POST', { title: input.value })); input.value = ''; await refresh();
}); });
action(async () => { const health = await api('/health'); document.querySelector('#status').textContent = `Versión ${health.version} · ${health.storage === 'postgres' ? 'PostgreSQL conectado' : 'Datos en memoria'}`; await refresh(); });
