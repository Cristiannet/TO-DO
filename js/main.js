(() => {
  const $ = (s) => document.querySelector(s);
  const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const leer = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch (e) { return def; } };
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Tema ---------- */
  if (leer('tema', 'oscuro') === 'claro') document.body.classList.add('claro');
  $('#tema').addEventListener('click', () => {
    document.body.classList.toggle('claro');
    guardar('tema', document.body.classList.contains('claro') ? 'claro' : 'oscuro');
  });

  /* ---------- Estado ---------- */
  const hoy = new Date();
  let tareas = leer('tareas', null);
  if (!tareas) {
    tareas = [
      { id: 1, titulo: 'Terminar el taller', desc: 'Entregar antes de la noche', fecha: iso(hoy), hecha: false },
      { id: 2, titulo: 'Estudiar JavaScript', desc: 'Repasar eventos y storage', fecha: iso(hoy), hecha: true },
    ];
    guardar('tareas', tareas);
  }
  let diaSel = null;          // filtro de día
  let verTodas = false;       // "ver más"
  let mes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const LIMITE = 4;

  $('#fechaHoy').textContent = hoy.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  $('#tFecha').value = iso(hoy);

  /* ---------- Tareas ---------- */
  function pintarTareas() {
    const lista = diaSel ? tareas.filter((t) => t.fecha === diaSel) : tareas;
    const ordenadas = [...lista].sort((a, b) => a.hecha - b.hecha || a.fecha.localeCompare(b.fecha));
    const visibles = verTodas ? ordenadas : ordenadas.slice(0, LIMITE);

    $('#listaTitulo').textContent = diaSel
      ? `Tareas del ${new Date(diaSel + 'T00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}`
      : 'Tareas';

    $('#listaTareas').innerHTML = visibles.length
      ? visibles.map((t) => `
        <div class="col-md-6 anim">
          <article class="tarjeta ${t.hecha ? 'hecha' : ''}" data-id="${t.id}" tabindex="0" role="button" aria-pressed="${t.hecha}">
            <span class="badge-b">${t.hecha ? 'Completada' : 'Pendiente'}</span>
            <h3>${esc(t.titulo)}</h3>
            ${t.desc ? `<p>${esc(t.desc)}</p>` : ''}
            <div class="acciones">
              <span class="fecha">${new Date(t.fecha + 'T00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</span>
              <button class="borrar" data-borrar="${t.id}" aria-label="Eliminar tarea">✕</button>
            </div>
          </article>
        </div>`).join('')
      : `<div class="col-12"><div class="vacio">No hay tareas aquí. ¡Crea una nueva!</div></div>`;

    const vm = $('#verMas');
    vm.hidden = ordenadas.length <= LIMITE;
    vm.textContent = verTodas ? 'Ver menos' : `Ver más (${ordenadas.length - LIMITE})`;

    $('#nComp').textContent = tareas.filter((t) => t.hecha).length;
    $('#nPend').textContent = tareas.filter((t) => !t.hecha).length;
    $('#quitarFiltro').hidden = !diaSel;
    pintarCalendario();
  }

  function alternar(id) {
    const t = tareas.find((x) => x.id === id);
    if (t) { t.hecha = !t.hecha; guardar('tareas', tareas); pintarTareas(); }
  }

  $('#listaTareas').addEventListener('click', (e) => {
    const b = e.target.closest('[data-borrar]');
    if (b) {
      e.stopPropagation();
      tareas = tareas.filter((t) => t.id !== +b.dataset.borrar);
      guardar('tareas', tareas); pintarTareas(); return;
    }
    const c = e.target.closest('.tarjeta');
    if (c) alternar(+c.dataset.id);
  });
  $('#listaTareas').addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('tarjeta')) {
      e.preventDefault(); alternar(+e.target.dataset.id);
    }
  });
  $('#verMas').addEventListener('click', () => { verTodas = !verTodas; pintarTareas(); });

  const modalEl = $('#modalTarea');
  $('#formTarea').addEventListener('submit', (e) => {
    e.preventDefault();
    const titulo = $('#tTitulo').value.trim();
    if (!titulo) return;
    tareas.push({ id: Date.now(), titulo, desc: $('#tDesc').value.trim(), fecha: $('#tFecha').value, hecha: false });
    guardar('tareas', tareas);
    e.target.reset(); $('#tFecha').value = iso(hoy);
    bootstrap.Modal.getInstance(modalEl).hide();
    pintarTareas();
  });
  modalEl.addEventListener('shown.bs.modal', () => $('#tTitulo').focus());

  /* ---------- Calendario ---------- */
  function pintarCalendario() {
    $('#mesTitulo').textContent = mes.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    const dias = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    let html = dias.map((d) => `<div class="dow">${d}</div>`).join('');
    const offset = (new Date(mes.getFullYear(), mes.getMonth(), 1).getDay() + 6) % 7;
    html += '<div></div>'.repeat(offset);
    const total = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
    const conTarea = new Set(tareas.map((t) => t.fecha));
    for (let d = 1; d <= total; d++) {
      const f = iso(new Date(mes.getFullYear(), mes.getMonth(), d));
      const cls = [f === iso(hoy) ? 'hoy' : '', f === diaSel ? 'sel' : '', conTarea.has(f) ? 'tiene' : ''].join(' ');
      html += `<button class="${cls}" data-f="${f}" aria-label="${f}">${d}</button>`;
    }
    $('#calendario').innerHTML = html;
  }
  $('#calendario').addEventListener('click', (e) => {
    const b = e.target.closest('[data-f]');
    if (!b) return;
    diaSel = diaSel === b.dataset.f ? null : b.dataset.f;
    verTodas = false; pintarTareas();
  });
  $('#quitarFiltro').addEventListener('click', () => { diaSel = null; pintarTareas(); });
  $('#mesAnt').addEventListener('click', () => { mes = new Date(mes.getFullYear(), mes.getMonth() - 1, 1); pintarCalendario(); });
  $('#mesSig').addEventListener('click', () => { mes = new Date(mes.getFullYear(), mes.getMonth() + 1, 1); pintarCalendario(); });

  /* ---------- Pomodoro ---------- */
  let seg = 25 * 60, modo = 25, timer = null;
  const hoyKey = 'pomos_' + iso(hoy);
  let pomos = leer(hoyKey, 0);
  $('#pomoCont').textContent = pomos;

  const pintarReloj = () => {
    const t = `${String(Math.floor(seg / 60)).padStart(2, '0')}:${String(seg % 60).padStart(2, '0')}`;
    $('#reloj').textContent = t;
    document.title = timer ? `${t} · TO DO` : "¿Qué hay pa' hacer hoy? | TO DO";
  };
  function parar() { clearInterval(timer); timer = null; $('#pomoInicio').textContent = 'Iniciar'; }
  function fin() {
    parar(); seg = modo * 60; pintarReloj();
    if (modo === 25) { pomos++; guardar(hoyKey, pomos); $('#pomoCont').textContent = pomos; }
    try { new (window.AudioContext || window.webkitAudioContext)().createOscillator(); } catch (e) {}
    alert(modo === 25 ? '¡Pomodoro terminado! Toma un descanso.' : 'Descanso terminado. ¡A trabajar!');
  }
  $('#pomoInicio').addEventListener('click', () => {
    if (timer) { parar(); pintarReloj(); return; }
    $('#pomoInicio').textContent = 'Pausar';
    timer = setInterval(() => { seg--; pintarReloj(); if (seg <= 0) fin(); }, 1000);
  });
  $('#pomoReset').addEventListener('click', () => { parar(); seg = modo * 60; pintarReloj(); });
  document.querySelectorAll('.pill').forEach((p) => p.addEventListener('click', () => {
    document.querySelectorAll('.pill').forEach((x) => x.classList.remove('activo'));
    p.classList.add('activo'); modo = +p.dataset.min; parar(); seg = modo * 60; pintarReloj();
  }));

  /* ---------- Spotify ---------- */
  $('#spotifyBtn').addEventListener('click', () => {
    const wrap = $('#spotifyWrap'), fr = wrap.querySelector('iframe');
    if (wrap.hidden) { fr.src = fr.dataset.src; wrap.hidden = false; $('#spotifyBtn').textContent = 'Ocultar Spotify ■'; }
    else { fr.src = ''; wrap.hidden = true; $('#spotifyBtn').textContent = 'Reproducir Spotify ▶'; }
  });

  pintarTareas();
})();
