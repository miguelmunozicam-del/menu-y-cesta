/* Menú y Cesta — interfaz. Vanilla JS, sin dependencias. */
(function () {
  'use strict';
  const M = window.MYC;
  const ST = window.MYC_STORAGE;

  let est = null;
  const ui = {
    tab: 'semana',
    semana: M.claveSemana(new Date()),
    filtroRecetas: '', tipoRecetas: 'todas', subRecetas: 'recetas',
    hoja: null
  };

  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const TIPOS = { primero: 'Primero', segundo: 'Segundo', unico: 'Plato único' };
  const ETIQUETAS = { verdura: '🥦 Verdura', legumbre: '🫘 Legumbre', pescado: '🐟 Pescado', carne: '🥩 Carne', huevo: '🥚 Huevo', pasta: '🍝 Pasta', arroz: '🍚 Arroz', otros: '🍽️ Otros' };
  const UNIDADES = { g: 'gramos', ml: 'mililitros', ud: 'unidades', diente: 'dientes', sobre: 'sobres', manojo: 'manojos' };
  const APETITO = [[0.85, 'Ligero'], [1, 'Normal'], [1.2, 'De buen comer']];
  const COLORES = ['#c8452c', '#5f7334', '#d99a1e', '#3d6f8e', '#8a4f7d', '#b5651d', '#2f7d6d'];

  // ---------- guardar y pintar ----------
  function cambiar(fn, opts) {
    fn();
    est.actualizado = new Date().toISOString();
    ST.guardar(est);
    render();
    if (ui.hoja && !(opts && opts.sinHoja)) pintarHoja();
  }

  let toastT = null;
  function toast(txt, deshacer) {
    const t = $('#toast');
    t.innerHTML = `<span>${esc(txt)}</span>${deshacer ? '<button data-a="deshacer">Deshacer</button>' : ''}`;
    t.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(() => { t.hidden = true; ultimoDeshacer = null; }, deshacer ? 5000 : 2200);
  }
  let ultimoDeshacer = null;
  function conDeshacer(txt, fn) {
    const copia = M.clonar(est);
    cambiar(fn);
    ultimoDeshacer = copia;
    toast(txt, true);
  }

  function render() {
    document.querySelectorAll('#tabs button').forEach((b) => b.setAttribute('aria-current', b.dataset.tab === ui.tab ? 'page' : 'false'));
    const l = M.calcularLista(est, ui.semana);
    const pend = l.total - l.enCarrito;
    $('#badge-lista').textContent = pend > 0 ? pend : '';
    const vistas = { semana: vSemana, lista: vLista, recetas: vRecetas, casa: vCasa };
    const scroll = window.scrollY;
    vistas[ui.tab]();
    window.scrollTo(0, scroll);
  }

  function cabecera(titulo, sub, conSemana) {
    const esActual = ui.semana === M.claveSemana(new Date());
    $('#cabecera').innerHTML = `
      <h1>${esc(titulo)}${sub ? `<small>${esc(sub)}</small>` : ''}</h1>
      ${conSemana ? `<div class="semana-nav" role="group" aria-label="Cambiar de semana">
        <button data-a="semana" data-d="-1" aria-label="Semana anterior">‹</button>
        <span>${esc(M.rangoSemana(ui.semana))}</span>
        <button data-a="semana" data-d="1" aria-label="Semana siguiente">›</button>
        ${esActual ? '' : '<button class="hoy" data-a="semana" data-d="0">Hoy</button>'}
      </div>` : ''}`;
  }

  // ---------- vista: SEMANA ----------
  function vSemana() {
    cabecera('Menú de la semana', saludo(), true);
    const sem = M.semana(est, ui.semana);
    const lunes = M.deISO(ui.semana);
    const hoyISO = M.aISO(new Date());
    const cumples = M.proximosCumples(est.familia, new Date(), 30);
    const eq = M.equilibrio(est, ui.semana);
    const fam = est.familia;

    let h = '';
    if (!fam.length && est.ajustes.bienvenida) {
      h += `<div class="banner"><span style="font-size:28px">👨‍👩‍👧‍👦</span><div class="txt"><b>¿Quién se sienta a la mesa?</b>Añade tu familia y las raciones se ajustan por edades. Mientras, calculo para ${est.ajustes.personasSinFamilia} personas.</div><button class="btn prim peq" data-a="tab" data-tab="casa">Configurar</button></div>`;
    }
    if (cumples.length) {
      h += `<div class="cumples">${cumples.map((c) => `<span class="pill mostaza">🎂 ${esc(c.miembro.nombre)} cumple ${c.cumple} ${c.enDias === 0 ? 'hoy' : c.enDias === 1 ? 'mañana' : `en ${c.enDias} días`}</span>`).join('')}</div>`;
    }
    h += `<div class="acciones desliza">
      <button class="btn prim" data-a="tab" data-tab="lista">🛒 Ver lista de la compra</button>
      <button class="btn" data-a="sorprendeme">🎲 Rellenar huecos</button>
      <button class="btn" data-a="copiar-anterior">⧉ Copiar semana anterior</button>
      <button class="btn peligro" data-a="vaciar-semana">Vaciar</button>
    </div>`;

    h += '<div class="dias">';
    sem.dias.forEach((d, i) => {
      const fecha = M.sumarDias(lunes, i);
      const iso = M.aISO(fecha);
      const cumpleHoy = fam.filter((m) => m.nacimiento && m.nacimiento.slice(5) === iso.slice(5));
      h += `<article class="tarjeta dia ${iso === hoyISO ? 'hoy' : ''}">
        <div class="dia-cab"><h3>${M.DIAS[i]}</h3><span class="fecha">${fecha.getDate()} ${M.MESES[fecha.getMonth()]}</span>
        ${cumpleHoy.map((m) => `<span class="pill mostaza">🎂 ${esc(m.nombre)}</span>`).join('')}</div>
        ${momentoHTML(d.comida, i, 'comida')}${momentoHTML(d.cena, i, 'cena')}
      </article>`;
    });
    h += '</div>';

    const c = eq.cuenta;
    h += `<div class="tarjeta pad equilibrio"><h2 style="font-size:18px">Equilibrio de la semana</h2>
      <div class="contadores">${Object.keys(ETIQUETAS).filter((k) => c[k]).map((k) => `<span class="pill">${ETIQUETAS[k]} · ${c[k]}</span>`).join('') || '<span class="nota-peq">Aún no hay platos.</span>'}</div>
      <ul>${eq.avisos.map((a) => `<li><span>${a.tipo === 'ok' ? '✅' : a.tipo === 'info' ? '📝' : '💡'}</span><span>${esc(a.txt)}</span></li>`).join('')}</ul>
      <p class="nota-peq" style="margin:10px 0 0">Orientativo. No sustituye el consejo de un profesional de la nutrición.</p></div>`;
    $('#vista').innerHTML = h;
  }

  function saludo() {
    const h = new Date().getHours();
    return h < 13 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches';
  }

  function momentoHTML(c, dia, momento) {
    const etq = momento === 'comida' ? '☀️ Comida' : '🌙 Cena';
    let quien = '';
    if (c.fuera) quien = '';
    else if (est.familia.length && Array.isArray(c.comensales)) {
      const n = est.familia.filter((m) => c.comensales.includes(m.id)).length;
      quien = `<span class="quien pill ${n < est.familia.length ? 'mostaza' : ''}">👥 ${n} de ${est.familia.length}</span>`;
    }
    let platos;
    if (c.fuera) platos = '<span class="plato fuera">🍴 Comemos fuera</span>';
    else {
      const p = c.platos.filter((r) => r && est.recetas[r]).map((r) => `<span class="plato">${esc(est.recetas[r].nombre)}</span>`);
      platos = p.length ? p.join('') : '<span class="plato vacio-pl">+ Elegir plato</span>';
    }
    return `<button class="momento" data-a="editar-comida" data-dia="${dia}" data-m="${momento}" aria-label="Editar ${momento} del ${M.DIAS[dia]}">
      <span class="etq">${etq}${quien}</span>${platos}</button>`;
  }

  // ---------- vista: LISTA ----------
  function vLista() {
    cabecera('Lista de la compra', null, true);
    const l = M.calcularLista(est, ui.semana);
    const sup = l.supermercado;
    const pct = l.total ? Math.round((l.enCarrito / l.total) * 100) : 0;
    let h = `<div class="tarjeta pad">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <label class="campo" style="flex:1;min-width:180px"><span>Supermercado</span>
          <select data-c="supermercado">${est.supermercados.map((s) => `<option value="${esc(s.id)}" ${sup && s.id === sup.id ? 'selected' : ''}>${esc(s.nombre)}</option>`).join('')}</select>
        </label>
        <div style="text-align:right"><b style="font-size:22px;font-family:var(--serif)">${l.enCarrito}/${l.total}</b><div class="nota-peq">en el carro</div></div>
      </div>
      <div class="progreso"><i style="width:${pct}%"></i></div>
    </div>
    <div class="acciones desliza">
      <button class="btn prim" data-a="compartir">📲 Enviar por WhatsApp</button>
      <button class="btn" data-a="copiar-lista">Copiar</button>
      <button class="btn" data-a="nuevo-extra">＋ Añadir otra cosa</button>
      <button class="btn" data-a="imprimir">Imprimir</button>
      ${l.enCarrito ? '<button class="btn" data-a="vaciar-carro">Desmarcar todo</button>' : ''}
    </div>`;

    if (!l.total && !l.tengo.length) {
      h += `<div class="tarjeta vacio"><span class="grande">🧺</span>No hay nada que comprar esta semana.<br>Elige platos en el menú y aparecerán aquí.<br><br><button class="btn prim" data-a="tab" data-tab="semana">Ir al menú</button></div>`;
      $('#vista').innerHTML = h;
      return;
    }
    if (!l.total) h += '<div class="tarjeta vacio"><span class="grande">🎉</span>¡Lo tienes todo! Nada pendiente.</div>';

    h += '<div class="lista-cols">';
    for (const g of l.grupos) {
      const hechos = g.items.filter((i) => i.carrito).length;
      h += `<section class="tarjeta grupo"><h3><span>${g.seccion.icono}</span>${esc(g.seccion.nombre)}<span class="n">${hechos}/${g.items.length}</span></h3>
        ${g.items.map(itemHTML).join('')}</section>`;
    }
    h += '</div>';

    if (l.basicos.length) {
      h += `<details class="tarjeta sec-plegable"><summary>🧂 Básicos de despensa <span class="pill">${l.basicos.length}</span></summary>
        <p class="nota" style="margin:0 16px 8px">Doy por hecho que los tienes. Si te falta alguno, márcalo y entra en la lista.</p>
        ${l.basicos.map((it) => `<div class="mini-item"><span>${esc(it.nombre)} <span class="nota-peq">· ${esc(it.necesidadTxt)}</span></span><button class="btn peq" data-a="falta" data-id="${esc(it.id)}">Me falta</button></div>`).join('')}
      </details>`;
    }
    if (l.tengo.length) {
      h += `<details class="tarjeta sec-plegable" open><summary>🏠 Ya lo tengo en casa <span class="pill oliva">${l.tengo.length}</span></summary>
        ${l.tengo.map((it) => `<div class="mini-item"><span>${esc(it.nombre)} <span class="nota-peq">· ${esc(it.necesidadTxt)}</span></span><button class="btn peq" data-a="no-tengo" data-id="${esc(it.id)}">Volver a la lista</button></div>`).join('')}
      </details>`;
    }
    $('#vista').innerHTML = h;
  }

  function itemHTML(it) {
    const usos = it.usos && it.usos.length ? `<details class="det"><summary>Necesitas ${esc(it.necesidadTxt)} · ${it.usos.length} ${it.usos.length === 1 ? 'plato' : 'platos'} ▾</summary><ul>${it.usos.map((u) => `<li>${esc(u)}</li>`).join('')}</ul></details>` : '';
    const ops = it.extra
      ? `<button class="ya-tengo" data-a="quitar-extra" data-id="${esc(it.id)}" aria-label="Quitar ${esc(it.nombre)}">Quitar</button>`
      : `<div class="paso" aria-label="Ajustar cantidad">
          <button data-a="ajuste" data-id="${esc(it.id)}" data-d="-1" aria-label="Menos ${esc(it.nombre)}">−</button>
          <button data-a="ajuste" data-id="${esc(it.id)}" data-d="1" aria-label="Más ${esc(it.nombre)}">+</button>
        </div>
        <button class="ya-tengo" data-a="tengo" data-id="${esc(it.id)}" title="Ya lo tengo en casa" aria-label="Ya tengo ${esc(it.nombre)}">🏠<span class="txt"> Tengo</span></button>`;
    return `<div class="item ${it.carrito ? 'en-carro' : ''}">
      <button class="check" data-a="carrito" data-id="${esc(it.id)}" aria-pressed="${it.carrito}" aria-label="${it.carrito ? 'Quitar del carro' : 'Al carro'}: ${esc(it.nombre)}"><i>${it.carrito ? '✓' : ''}</i></button>
      <div class="info"><span class="nombre">${esc(it.nombre)}</span>
        ${it.compra.texto ? `<span class="cant"><b>${esc(it.compra.texto)}</b>${it.ajustado ? ' <span class="pill mostaza">ajustado</span>' : ''}</span>` : ''}
        ${usos}</div>
      <div class="ops">${ops}</div>
    </div>`;
  }

  // ---------- vista: RECETAS ----------
  function vRecetas() {
    cabecera(ui.subRecetas === 'recetas' ? 'Recetas' : 'Ingredientes', null, false);
    let h = `<div class="segmentado" role="group">
      <button data-a="sub-recetas" data-v="recetas" aria-pressed="${ui.subRecetas === 'recetas'}">📖 Recetas</button>
      <button data-a="sub-recetas" data-v="ingredientes" aria-pressed="${ui.subRecetas === 'ingredientes'}">🥕 Ingredientes</button>
    </div>
    <div style="display:flex;gap:8px"><div class="buscador" style="flex:1"><input type="search" placeholder="Buscar…" value="${esc(ui.filtroRecetas)}" data-c="filtro" aria-label="Buscar"></div>
    <button class="btn prim" data-a="${ui.subRecetas === 'recetas' ? 'nueva-receta' : 'nuevo-ingrediente'}">＋ Nueva</button></div>`;
    const q = norm(ui.filtroRecetas);

    if (ui.subRecetas === 'recetas') {
      h += `<div class="acciones desliza">${[['todas', 'Todas'], ...Object.entries(TIPOS)].map(([k, v]) => `<button class="chip" data-a="tipo-recetas" data-v="${k}" aria-pressed="${ui.tipoRecetas === k}">${v}</button>`).join('')}</div>`;
      const ids = Object.keys(est.recetas)
        .filter((id) => ui.tipoRecetas === 'todas' || est.recetas[id].tipo === ui.tipoRecetas)
        .filter((id) => !q || norm(est.recetas[id].nombre).includes(q) || est.recetas[id].ingredientes.some(([i]) => est.ingredientes[i] && norm(est.ingredientes[i].nombre).includes(q)))
        .sort((a, b) => est.recetas[a].nombre.localeCompare(est.recetas[b].nombre, 'es'));
      if (!ids.length) h += '<div class="tarjeta vacio">Ninguna receta coincide.</div>';
      h += `<div class="rejilla">${ids.map((id) => {
        const r = est.recetas[id];
        return `<button class="tarjeta receta" data-a="editar-receta" data-id="${esc(id)}">
          <h3>${esc(r.nombre)}</h3>
          <span class="etqs"><span class="pill">${TIPOS[r.tipo] || ''}</span><span class="pill">${ETIQUETAS[r.etiqueta] || ''}</span></span>
          <span class="ings">${r.ingredientes.map(([i]) => est.ingredientes[i] ? esc(est.ingredientes[i].nombre) : '').filter(Boolean).join(' · ')}</span>
        </button>`;
      }).join('')}</div>`;
    } else {
      const secs = Object.fromEntries(est.secciones.map((s) => [s.id, s]));
      const ids = Object.keys(est.ingredientes).filter((id) => !q || norm(est.ingredientes[id].nombre).includes(q))
        .sort((a, b) => est.ingredientes[a].nombre.localeCompare(est.ingredientes[b].nombre, 'es'));
      h += `<div class="tarjeta">${ids.map((id) => {
        const g = est.ingredientes[id];
        const env = g.envase ? `${g.envase.nombre} de ${M.fmtCantidad(g.envase.cantidad, g.unidad)}` : (M.esContable(g.unidad) ? 'por unidades' : 'a granel / al corte');
        return `<button class="mini-item" style="width:100%;border-left:0;border-right:0;border-bottom:0;background:none;text-align:left" data-a="editar-ingrediente" data-id="${esc(id)}">
          <span><b>${esc(g.nombre)}</b> ${g.basico ? '<span class="pill oliva">básico</span>' : ''}<br><span class="nota-peq">${secs[g.seccion] ? secs[g.seccion].icono + ' ' + esc(secs[g.seccion].nombre) : ''} · ${esc(env)}</span></span><span aria-hidden="true">›</span></button>`;
      }).join('')}</div>`;
    }
    $('#vista').innerHTML = h;
    const f = $('[data-c="filtro"]');
    if (ui._focoFiltro) { f.focus(); f.setSelectionRange(f.value.length, f.value.length); ui._focoFiltro = false; }
  }
  const norm = (t) => (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  // ---------- vista: CASA ----------
  function vCasa() {
    cabecera('Casa', 'Familia, súper y datos', false);
    const fam = est.familia;
    const sup = est.supermercados.find((s) => s.id === est.ajustes.supermercado) || est.supermercados[0];
    const secs = Object.fromEntries(est.secciones.map((s) => [s.id, s]));
    const cumples = M.proximosCumples(fam, new Date(), 366).slice(0, 4);
    const total = fam.reduce((a, m) => a + M.racionDe(m), 0);

    let h = '<div class="cols-casa"><div>';
    h += `<div class="titulo-sec"><h2>Familia</h2><button class="btn prim peq" data-a="nuevo-miembro">＋ Añadir</button></div>
    <div class="tarjeta">${fam.length ? fam.map((m, i) => {
      const e = M.edad(m.nacimiento);
      const auto = m.racion == null || m.racion === '';
      return `<div class="persona"><span class="avatar" style="background:${COLORES[i % COLORES.length]}">${esc((m.nombre || '?').charAt(0).toUpperCase())}</span>
        <div class="d"><b>${esc(m.nombre)}</b><span class="nota-peq">${e != null ? e + ' años' : 'Sin fecha'} · ración ${M.fmtNum(M.racionDe(m), 2)}${auto ? ' (por edad)' : ' (manual)'}</span></div>
        <button class="btn peq" data-a="editar-miembro" data-id="${esc(m.id)}">Editar</button></div>`;
    }).join('') : `<div class="pad"><p class="nota" style="margin-top:0">Aún no has añadido a nadie. Con nombre y fecha de nacimiento ajusto las raciones por edad y te recuerdo los cumpleaños.</p>
      <label class="campo">Mientras tanto, calcular para
        <input type="number" min="1" max="30" value="${esc(est.ajustes.personasSinFamilia)}" data-c="personas" inputmode="numeric"></label></div>`}
    </div>`;
    if (fam.length) h += `<p class="nota-peq" style="margin:-6px 4px 0">Total: ${M.fmtNum(total, 2)} raciones de adulto por comida.</p>`;

    h += `<div class="tarjeta pad"><h2 style="font-size:18px;margin-bottom:10px">¿Cómo de comilones sois?</h2>
      <div class="segmentado" role="group">${APETITO.map(([v, t]) => `<button data-a="apetito" data-v="${v}" aria-pressed="${Number(est.ajustes.apetito) === v}">${t}</button>`).join('')}</div>
      <p class="nota-peq" style="margin:8px 0 0">Multiplica todas las cantidades. Las de cada receta se cambian en Recetas.</p></div>`;

    if (cumples.length) {
      h += `<div class="tarjeta pad"><h2 style="font-size:18px">Próximos cumpleaños</h2>
        ${cumples.map((c) => `<div class="mini-item" style="padding:8px 0"><span>🎂 <b>${esc(c.miembro.nombre)}</b> cumple ${c.cumple}</span><span class="nota-peq">${c.fecha.getDate()} ${M.MESES[c.fecha.getMonth()]} · ${c.enDias === 0 ? 'hoy' : c.enDias === 1 ? 'mañana' : 'en ' + c.enDias + ' días'}</span></div>`).join('')}</div>`;
    }
    h += '</div><div>';

    h += `<div class="titulo-sec"><h2>Supermercado</h2><button class="btn peq" data-a="nuevo-super">＋ Mi súper</button></div>
    <div class="tarjeta pad" style="display:flex;flex-direction:column;gap:10px">
      <select data-c="supermercado" aria-label="Supermercado">${est.supermercados.map((s) => `<option value="${esc(s.id)}" ${s.id === sup.id ? 'selected' : ''}>${esc(s.nombre)}</option>`).join('')}</select>
      <p class="nota" style="margin:0">Orden en que recorres la tienda. La lista sigue este orden. Ajústalo a tu súper con las flechas.</p>
      <ol class="secciones-orden">${sup.orden.map((sid, i) => secs[sid] ? `<li><span>${secs[sid].icono}</span><span class="nom">${esc(secs[sid].nombre)}</span>
        <button class="btn icono peq" data-a="mover-sec" data-i="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="Subir ${esc(secs[sid].nombre)}">↑</button>
        <button class="btn icono peq" data-a="mover-sec" data-i="${i}" data-d="1" ${i === sup.orden.length - 1 ? 'disabled' : ''} aria-label="Bajar ${esc(secs[sid].nombre)}">↓</button></li>` : '').join('')}</ol>
      <div class="acciones">${sup.propio ? `<button class="btn peq peligro" data-a="borrar-super">Eliminar “${esc(sup.nombre)}”</button>` : '<button class="btn peq" data-a="restaurar-orden">Restaurar orden original</button>'}</div>
    </div>`;

    h += `<div class="titulo-sec"><h2>Tus datos</h2></div>
    <div class="tarjeta pad" style="display:flex;flex-direction:column;gap:10px">
      <p class="nota" style="margin:0">📱 Se guardan <b>solo en este dispositivo</b>, en este navegador. No se envían a ningún servidor.
      Para pasarlos al ordenador o al móvil, exporta una copia y ábrela en el otro.</p>
      <div class="acciones">
        <button class="btn oliva" data-a="exportar">⬇︎ Exportar copia</button>
        <label class="btn" style="cursor:pointer">⬆︎ Importar copia<input type="file" accept="application/json,.json" data-c="importar" class="sr"></label>
      </div>
      <p class="nota-peq" style="margin:0">La sincronización automática entre dispositivos llegará en una próxima versión.</p>
      <details><summary class="nota" style="cursor:pointer">Zona peligrosa</summary>
        <div class="acciones" style="margin-top:8px"><button class="btn peq peligro" data-a="reiniciar">Borrar todo y empezar de cero</button></div>
      </details>
    </div>
    <p class="nota-peq" style="text-align:center">Menú y Cesta · código abierto · <a href="https://github.com" data-repo target="_blank" rel="noopener">GitHub</a></p>`;
    h += '</div></div>';
    $('#vista').innerHTML = h;
  }

  // ---------- hojas (modales) ----------
  function abrirHoja(hoja) {
    ui.hoja = hoja;
    $('#hoja-fondo').hidden = false;
    $('#hoja').hidden = false;
    document.body.style.overflow = 'hidden';
    pintarHoja();
    setTimeout(() => { const f = $('#hoja [autofocus]'); if (f) f.focus(); }, 60);
  }
  function cerrarHoja() {
    ui.hoja = null;
    $('#hoja-fondo').hidden = true;
    $('#hoja').hidden = true;
    $('#hoja').innerHTML = '';
    document.body.style.overflow = '';
  }
  function pintarHoja() {
    const H = ui.hoja;
    if (!H) return;
    const f = { comida: hojaComida, receta: hojaReceta, ingrediente: hojaIngrediente, miembro: hojaMiembro, extra: hojaExtra }[H.tipo];
    const cont = $('#hoja');
    const sc = cont.scrollTop;
    cont.innerHTML = f(H);
    cont.scrollTop = sc;
  }
  const cabHoja = (t) => `<div class="hoja-cab"><h2>${t}</h2><button class="btn icono" data-a="cerrar-hoja" aria-label="Cerrar">✕</button></div>`;

  // Comida/cena de un día
  function hojaComida(H) {
    const c = M.semana(est, ui.semana).dias[H.dia][H.m];
    const titulo = `${M.DIAS[H.dia]} · ${H.m === 'comida' ? 'Comida' : 'Cena'}`;
    let h = cabHoja(esc(titulo)) + '<div class="cuerpo">';
    h += `<label class="interruptor">🍴 Comemos fuera <input type="checkbox" data-c="fuera" ${c.fuera ? 'checked' : ''}></label>`;
    if (!c.fuera) {
      if (H.picker == null) {
        const unico = c.platos[0] && est.recetas[c.platos[0]] && est.recetas[c.platos[0]].tipo === 'unico';
        [0, 1].forEach((i) => {
          if (i === 1 && unico && !c.platos[1]) return;
          const r = c.platos[i] && est.recetas[c.platos[i]];
          h += `<button class="slot" data-a="abrir-picker" data-i="${i}"><span><span class="q">${i === 0 ? 'Primer plato' : 'Segundo plato'}</span>
            <span class="v ${r ? '' : 'nada'}">${r ? esc(r.nombre) : i === 0 ? 'Elegir…' : 'Sin segundo (opcional)'}</span></span><span class="f">›</span></button>`;
        });
        if (unico && !c.platos[1]) h += '<p class="nota-peq" style="margin:-6px 2px 0">Plato único: no hace falta segundo. <a href="#" data-a="abrir-picker" data-i="1">Añadir igualmente</a></p>';
        if (est.familia.length) {
          const ids = Array.isArray(c.comensales) ? c.comensales : est.familia.map((m) => m.id);
          h += `<div><div class="nota" style="font-weight:600;margin-bottom:8px">¿Quién come?</div><div class="chips">${est.familia.map((m) => `<button class="chip" data-a="comensal" data-id="${esc(m.id)}" aria-pressed="${ids.includes(m.id)}">${esc(m.nombre)}</button>`).join('')}</div></div>`;
        }
        const { factor } = M.comensalesDe(est, c);
        h += `<p class="nota-peq" style="margin:0">Se calcula para ${M.fmtNum(factor, 2)} raciones de adulto.</p>`;
        h += '<button class="btn prim" data-a="cerrar-hoja">Hecho</button>';
      } else {
        h += pickerHTML(H, c.platos[H.picker]);
      }
    } else {
      h += '<p class="nota" style="margin:0">No se compra nada para esta comida.</p><button class="btn prim" data-a="cerrar-hoja">Hecho</button>';
    }
    return h + '</div>';
  }

  function pickerHTML(H, actual) {
    const q = norm(H.q || '');
    const pref = H.picker === 0 ? ['primero', 'unico'] : ['segundo'];
    const ids = Object.keys(est.recetas).filter((id) => !q || norm(est.recetas[id].nombre).includes(q));
    ids.sort((a, b) => {
      const pa = pref.includes(est.recetas[a].tipo) ? 0 : 1, pb = pref.includes(est.recetas[b].tipo) ? 0 : 1;
      return pa - pb || est.recetas[a].nombre.localeCompare(est.recetas[b].nombre, 'es');
    });
    return `<div style="display:flex;gap:8px;align-items:center"><button class="btn icono" data-a="cerrar-picker" aria-label="Volver">‹</button>
      <div class="buscador" style="flex:1"><input type="search" placeholder="Buscar receta…" value="${esc(H.q || '')}" data-c="buscar-picker" autofocus aria-label="Buscar receta"></div></div>
      <div class="selector">
        ${actual ? '<button data-a="elegir" data-id="">✕ <i>Sin plato</i></button>' : ''}
        ${ids.map((id) => `<button data-a="elegir" data-id="${esc(id)}" class="${id === actual ? 'sel' : ''}">${id === actual ? '✓ ' : ''}${esc(est.recetas[id].nombre)}<span class="pill">${TIPOS[est.recetas[id].tipo] || ''}</span></button>`).join('')}
        ${!ids.length ? '<div class="pad nota">Ninguna receta coincide.</div>' : ''}
      </div>
      <button class="btn" data-a="nueva-receta" data-desde="picker">＋ Crear receta nueva${H.q ? ': “' + esc(H.q) + '”' : ''}</button>`;
  }

  // Receta (crear / editar)
  function hojaReceta(H) {
    const r = H.borrador;
    const ingOpts = Object.keys(est.ingredientes).sort((a, b) => est.ingredientes[a].nombre.localeCompare(est.ingredientes[b].nombre, 'es'));
    let h = cabHoja(H.id ? 'Editar receta' : 'Nueva receta') + '<div class="cuerpo">';
    h += `<label class="campo">Nombre<input type="text" value="${esc(r.nombre)}" data-c="r-nombre" ${H.id ? '' : 'autofocus'} placeholder="Ej.: Lentejas con chorizo"></label>
      <div class="fila-campos">
        <label class="campo">Tipo<select data-c="r-tipo">${Object.entries(TIPOS).map(([k, v]) => `<option value="${k}" ${r.tipo === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label class="campo">Grupo<select data-c="r-etiqueta">${Object.entries(ETIQUETAS).map(([k, v]) => `<option value="${k}" ${r.etiqueta === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      </div>
      <div><div class="nota" style="font-weight:600;margin-bottom:8px">Ingredientes <span class="nota-peq">· cantidad por adulto</span></div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${r.ingredientes.map(([iid, cant], idx) => {
          const g = est.ingredientes[iid];
          return `<div class="ing-fila"><span>${g ? esc(g.nombre) : '<i>¿?</i>'}</span>
            <input type="number" min="0" step="any" value="${esc(cant)}" data-c="r-cant" data-i="${idx}" inputmode="decimal" aria-label="Cantidad de ${g ? esc(g.nombre) : ''}">
            <span class="u">${g ? esc(g.unidad) : ''}</span>
            <button class="x" data-a="r-quitar-ing" data-i="${idx}" aria-label="Quitar">✕</button></div>`;
        }).join('') || '<p class="nota-peq" style="margin:0">Todavía sin ingredientes.</p>'}
      </div></div>
      <div class="tarjeta pad" style="background:var(--papel);box-shadow:none">
        <div class="nota" style="font-weight:600;margin-bottom:8px">Añadir ingrediente</div>
        <div style="display:grid;grid-template-columns:1fr 92px;gap:6px">
          <input type="text" list="dl-ings" placeholder="Escribe o elige…" data-c="r-nuevo-nombre" aria-label="Ingrediente">
          <input type="number" min="0" step="any" placeholder="Cant." data-c="r-nuevo-cant" inputmode="decimal" aria-label="Cantidad">
        </div>
        <datalist id="dl-ings">${ingOpts.map((id) => `<option value="${esc(est.ingredientes[id].nombre)}">`).join('')}</datalist>
        <div class="nuevo-ing oculto" id="nuevo-ing-extra">
          <label class="campo">Sección<select data-c="r-nuevo-sec">${est.secciones.map((s) => `<option value="${s.id}">${s.icono} ${esc(s.nombre)}</option>`).join('')}</select></label>
          <label class="campo">Se mide en<select data-c="r-nuevo-uni">${Object.entries(UNIDADES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
          <p class="nota-peq" style="grid-column:1/-1;margin:0">Ingrediente nuevo. Luego puedes indicar cómo se vende (bandeja, bote…) en Ingredientes.</p>
        </div>
        <button class="btn peq" style="margin-top:8px" data-a="r-anadir-ing">＋ Añadir</button>
      </div>
      <div class="acciones">
        <button class="btn prim" data-a="r-guardar">Guardar receta</button>
        ${H.id ? '<button class="btn" data-a="r-duplicar">Duplicar</button><button class="btn peligro" data-a="r-borrar">Eliminar</button>' : ''}
      </div>`;
    if (H.id) {
      const usos = usosReceta(H.id);
      if (usos) h += `<p class="nota-peq" style="margin:0">Aparece ${usos} ${usos === 1 ? 'vez' : 'veces'} en tus menús.</p>`;
    }
    return h + '</div>';
  }
  function usosReceta(id) {
    let n = 0;
    for (const s of Object.values(est.semanas)) s.dias.forEach((d) => ['comida', 'cena'].forEach((m) => d[m].platos.forEach((p) => { if (p === id) n++; })));
    return n;
  }

  // Ingrediente
  function hojaIngrediente(H) {
    const g = H.borrador;
    const usado = H.id ? Object.values(est.recetas).filter((r) => r.ingredientes.some(([i]) => i === H.id)).map((r) => r.nombre) : [];
    let h = cabHoja(H.id ? 'Editar ingrediente' : 'Nuevo ingrediente') + '<div class="cuerpo">';
    h += `<label class="campo">Nombre<input type="text" value="${esc(g.nombre)}" data-c="g-nombre" ${H.id ? '' : 'autofocus'}></label>
      <div class="fila-campos">
        <label class="campo">Sección<select data-c="g-seccion">${est.secciones.map((s) => `<option value="${s.id}" ${g.seccion === s.id ? 'selected' : ''}>${s.icono} ${esc(s.nombre)}</option>`).join('')}</select></label>
        <label class="campo">Se mide en<select data-c="g-unidad">${Object.entries(UNIDADES).map(([k, v]) => `<option value="${k}" ${g.unidad === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      </div>
      <label class="interruptor">Se vende en envase (bandeja, bote, paquete…) <input type="checkbox" data-c="g-con-envase" ${g.envase ? 'checked' : ''}></label>
      ${g.envase ? `<div class="fila-campos">
        <label class="campo">Envase<input type="text" value="${esc(g.envase.nombre)}" data-c="g-env-nombre" placeholder="bandeja"></label>
        <label class="campo">Contiene (${esc(g.unidad)})<input type="number" min="0" step="any" value="${esc(g.envase.cantidad)}" data-c="g-env-cant" inputmode="decimal"></label>
      </div>` : `<p class="nota-peq" style="margin:-6px 0 0">${M.esContable(g.unidad) ? 'Se compra por unidades.' : 'Se compra a granel o al corte (redondeo a 50).'}</p>`}
      <label class="interruptor"><span>Básico de despensa<br><span class="nota-peq" style="font-weight:400">Siempre hay en casa: no sale en la lista salvo que digas que falta.</span></span><input type="checkbox" data-c="g-basico" ${g.basico ? 'checked' : ''}></label>
      ${usado.length ? `<p class="nota-peq" style="margin:0">Se usa en: ${usado.map(esc).join(', ')}.</p>` : ''}
      <div class="acciones"><button class="btn prim" data-a="g-guardar">Guardar</button>
        ${H.id && !usado.length ? '<button class="btn peligro" data-a="g-borrar">Eliminar</button>' : ''}</div>`;
    return h + '</div>';
  }

  // Miembro de la familia
  function hojaMiembro(H) {
    const m = H.borrador;
    const e = M.edad(m.nacimiento);
    const auto = M.racionPorEdad(e);
    let h = cabHoja(H.id ? 'Editar' : 'Añadir a la familia') + '<div class="cuerpo">';
    h += `<label class="campo">Nombre<input type="text" value="${esc(m.nombre)}" data-c="m-nombre" ${H.id ? '' : 'autofocus'} placeholder="Ej.: Lucía"></label>
      <label class="campo">Fecha de nacimiento<input type="date" value="${esc(m.nacimiento || '')}" data-c="m-nacimiento" max="${M.aISO(new Date())}"></label>
      <p class="nota-peq" style="margin:-6px 0 0">${e != null ? `${e} años · ración por edad: ${M.fmtNum(auto, 2)} de adulto` : 'Con la fecha ajusto la ración y te aviso de su cumpleaños.'}</p>
      <label class="campo">Ración (opcional, 1 = adulto)<input type="number" min="0" max="3" step="0.05" value="${m.racion == null ? '' : esc(m.racion)}" placeholder="Automática: ${M.fmtNum(auto, 2)}" data-c="m-racion" inputmode="decimal"></label>
      <div class="acciones"><button class="btn prim" data-a="m-guardar">Guardar</button>
        ${H.id ? '<button class="btn peligro" data-a="m-borrar">Quitar de la familia</button>' : ''}</div>
      <p class="nota-peq" style="margin:0">🔒 Estos datos se quedan en tu dispositivo.</p>`;
    return h + '</div>';
  }

  // Extra manual en la lista
  function hojaExtra() {
    return cabHoja('Añadir a la lista') + `<div class="cuerpo">
      <label class="campo">¿Qué necesitas?<input type="text" data-c="x-nombre" autofocus placeholder="Ej.: Papel de cocina"></label>
      <label class="campo">Cantidad (opcional)<input type="text" data-c="x-cant" placeholder="Ej.: 2 rollos"></label>
      <label class="campo">Sección<select data-c="x-sec">${est.secciones.map((s) => `<option value="${s.id}" ${s.id === 'otros' ? 'selected' : ''}>${s.icono} ${esc(s.nombre)}</option>`).join('')}</select></label>
      <button class="btn prim" data-a="x-guardar">Añadir</button></div>`;
  }

  // ---------- acciones ----------
  const lista = () => M.semana(est, ui.semana).lista;
  const supActual = () => est.supermercados.find((s) => s.id === est.ajustes.supermercado) || est.supermercados[0];

  const A = {
    tab(el) { ui.tab = el.dataset.tab; ui.filtroRecetas = ''; render(); window.scrollTo(0, 0); },
    semana(el) {
      const d = Number(el.dataset.d);
      ui.semana = d === 0 ? M.claveSemana(new Date()) : M.aISO(M.sumarDias(M.deISO(ui.semana), 7 * d));
      render();
    },
    deshacer() {
      if (!ultimoDeshacer) return;
      est = ultimoDeshacer; ultimoDeshacer = null;
      ST.guardar(est); render(); $('#toast').hidden = true;
    },

    // semana
    'editar-comida'(el) { abrirHoja({ tipo: 'comida', dia: Number(el.dataset.dia), m: el.dataset.m, picker: null, q: '' }); },
    'abrir-picker'(el, ev) { if (ev) ev.preventDefault(); ui.hoja.picker = Number(el.dataset.i); ui.hoja.q = ''; pintarHoja(); setTimeout(() => { const f = $('#hoja [autofocus]'); if (f && window.matchMedia('(min-width:700px)').matches) f.focus(); }, 30); },
    'cerrar-picker'() { ui.hoja.picker = null; pintarHoja(); },
    elegir(el) {
      const H = ui.hoja;
      cambiar(() => {
        const c = M.semana(est, ui.semana).dias[H.dia][H.m];
        c.platos[H.picker] = el.dataset.id || null;
        if (H.picker === 0 && !c.platos[0] && c.platos[1]) { c.platos = [c.platos[1], null]; }
        H.picker = null;
      });
    },
    comensal(el) {
      const H = ui.hoja;
      cambiar(() => {
        const c = M.semana(est, ui.semana).dias[H.dia][H.m];
        const todos = est.familia.map((m) => m.id);
        let ids = Array.isArray(c.comensales) ? c.comensales.slice() : todos.slice();
        ids = ids.includes(el.dataset.id) ? ids.filter((x) => x !== el.dataset.id) : ids.concat(el.dataset.id);
        c.comensales = ids.length === todos.length && todos.every((t) => ids.includes(t)) ? null : ids;
      });
    },
    sorprendeme() {
      let n = 0;
      conDeshacer('Huecos rellenados', () => { n = M.sorprendeme(est, ui.semana); });
      if (!n) toast('No había huecos libres');
    },
    'copiar-anterior'() {
      const ant = M.aISO(M.sumarDias(M.deISO(ui.semana), -7));
      if (!est.semanas[ant]) return toast('La semana anterior está vacía');
      conDeshacer('Menú copiado de la semana anterior', () => {
        const s = M.semana(est, ui.semana);
        s.dias = M.clonar(est.semanas[ant].dias);
      });
    },
    'vaciar-semana'() {
      conDeshacer('Semana vaciada', () => { est.semanas[ui.semana] = M.semanaVacia(); });
    },

    // lista
    carrito(el) { cambiar(() => { const L = lista(); L.carrito[el.dataset.id] = !L.carrito[el.dataset.id]; if (!L.carrito[el.dataset.id]) delete L.carrito[el.dataset.id]; }); },
    tengo(el) {
      const g = est.ingredientes[el.dataset.id];
      conDeshacer(`${g ? g.nombre : 'Artículo'}: ya lo tienes`, () => { lista().tengo[el.dataset.id] = true; });
    },
    'no-tengo'(el) { cambiar(() => { delete lista().tengo[el.dataset.id]; }); },
    falta(el) { cambiar(() => { lista().falta[el.dataset.id] = true; }); toast('Añadido a la lista'); },
    ajuste(el) {
      cambiar(() => {
        const L = lista(), id = el.dataset.id;
        const g = est.ingredientes[id];
        const nuevo = (Number(L.ajustes[id]) || 0) + Number(el.dataset.d);
        // Si baja de 0 unidades, lo damos por "ya lo tengo".
        const l = M.calcularLista(est, ui.semana);
        const it = [].concat(...l.grupos.map((x) => x.items)).find((x) => x.id === id);
        if (it && g && M.aComprar(g, it.necesidad, nuevo).n <= 0) { L.tengo[id] = true; delete L.ajustes[id]; toast(`${g.nombre}: ya lo tienes`); return; }
        if (nuevo) L.ajustes[id] = nuevo; else delete L.ajustes[id];
      });
    },
    'vaciar-carro'() { conDeshacer('Carro vaciado', () => { lista().carrito = {}; }); },
    'nuevo-extra'() { abrirHoja({ tipo: 'extra' }); },
    'x-guardar'() {
      const nombre = $('[data-c="x-nombre"]').value.trim();
      if (!nombre) return $('[data-c="x-nombre"]').focus();
      cambiar(() => { lista().extras.push({ id: M.uid('extra'), nombre, cantidad: $('[data-c="x-cant"]').value.trim(), seccion: $('[data-c="x-sec"]').value }); }, { sinHoja: true });
      cerrarHoja(); toast('Añadido a la lista');
    },
    'quitar-extra'(el) { conDeshacer('Quitado de la lista', () => { const L = lista(); L.extras = L.extras.filter((x) => x.id !== el.dataset.id); }); },
    async compartir() {
      const txt = M.textoLista(est, ui.semana);
      if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
        try { await navigator.share({ title: 'Lista de la compra', text: txt }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
      }
      window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank', 'noopener');
    },
    async 'copiar-lista'() {
      try { await navigator.clipboard.writeText(M.textoLista(est, ui.semana)); toast('Lista copiada'); } catch (e) { toast('No se pudo copiar'); }
    },
    imprimir() { window.print(); },

    // recetas
    'sub-recetas'(el) { ui.subRecetas = el.dataset.v; ui.filtroRecetas = ''; render(); },
    'tipo-recetas'(el) { ui.tipoRecetas = el.dataset.v; render(); },
    'nueva-receta'(el) {
      const desde = el.dataset.desde === 'picker' && ui.hoja ? { dia: ui.hoja.dia, m: ui.hoja.m, slot: ui.hoja.picker } : null;
      const nombre = desde ? (ui.hoja.q || '') : '';
      abrirHoja({ tipo: 'receta', id: null, desde, borrador: { nombre, tipo: desde && desde.slot === 1 ? 'segundo' : 'primero', etiqueta: 'otros', ingredientes: [] } });
    },
    'editar-receta'(el) { abrirHoja({ tipo: 'receta', id: el.dataset.id, borrador: M.clonar(est.recetas[el.dataset.id]) }); },
    'r-quitar-ing'(el) { leerReceta(); ui.hoja.borrador.ingredientes.splice(Number(el.dataset.i), 1); pintarHoja(); },
    'r-anadir-ing'() {
      leerReceta();
      const nombre = $('[data-c="r-nuevo-nombre"]').value.trim();
      const cant = Number($('[data-c="r-nuevo-cant"]').value);
      if (!nombre) return $('[data-c="r-nuevo-nombre"]').focus();
      let id = Object.keys(est.ingredientes).find((k) => norm(est.ingredientes[k].nombre) === norm(nombre));
      if (!id) {
        id = M.slug(nombre);
        while (est.ingredientes[id]) id += '_';
        const unidad = $('[data-c="r-nuevo-uni"]').value;
        est.ingredientes[id] = { nombre, seccion: $('[data-c="r-nuevo-sec"]').value, unidad, envase: null, basico: false };
        ST.guardar(est);
      }
      const B = ui.hoja.borrador;
      const ex = B.ingredientes.find(([i]) => i === id);
      const def = M.esContable(est.ingredientes[id].unidad) ? 1 : 100;
      if (ex) ex[1] = cant || ex[1]; else B.ingredientes.push([id, cant || def]);
      pintarHoja();
      setTimeout(() => { const f = $('[data-c="r-nuevo-nombre"]'); if (f) f.focus(); }, 20);
    },
    'r-guardar'() {
      leerReceta();
      const H = ui.hoja, B = H.borrador;
      if (!B.nombre.trim()) { toast('Ponle un nombre'); return $('[data-c="r-nombre"]').focus(); }
      B.nombre = B.nombre.trim();
      B.ingredientes = B.ingredientes.filter(([i, c]) => est.ingredientes[i] && Number(c) > 0).map(([i, c]) => [i, Number(c)]);
      let id = H.id;
      cambiar(() => {
        if (!id) { id = M.slug(B.nombre); while (est.recetas[id]) id += '_'; }
        est.recetas[id] = B;
        if (H.desde) {
          const c = M.semana(est, ui.semana).dias[H.desde.dia][H.desde.m];
          c.platos[H.desde.slot] = id;
        }
      }, { sinHoja: true });
      if (H.desde) { ui.hoja = { tipo: 'comida', dia: H.desde.dia, m: H.desde.m, picker: null, q: '' }; pintarHoja(); }
      else cerrarHoja();
      toast('Receta guardada');
    },
    'r-duplicar'() {
      leerReceta();
      const B = M.clonar(ui.hoja.borrador);
      B.nombre += ' (copia)';
      abrirHoja({ tipo: 'receta', id: null, borrador: B });
    },
    'r-borrar'() {
      const id = ui.hoja.id;
      const nombre = est.recetas[id].nombre;
      cerrarHoja();
      conDeshacer(`“${nombre}” eliminada`, () => {
        delete est.recetas[id];
        for (const s of Object.values(est.semanas)) s.dias.forEach((d) => ['comida', 'cena'].forEach((m) => { d[m].platos = d[m].platos.map((p) => (p === id ? null : p)); }));
      });
    },

    // ingredientes
    'nuevo-ingrediente'() { abrirHoja({ tipo: 'ingrediente', id: null, borrador: { nombre: '', seccion: 'otros', unidad: 'g', envase: null, basico: false } }); },
    'editar-ingrediente'(el) { abrirHoja({ tipo: 'ingrediente', id: el.dataset.id, borrador: M.clonar(est.ingredientes[el.dataset.id]) }); },
    'g-guardar'() {
      leerIngrediente();
      const H = ui.hoja, B = H.borrador;
      if (!B.nombre.trim()) { toast('Ponle un nombre'); return; }
      B.nombre = B.nombre.trim();
      if (B.envase && !(Number(B.envase.cantidad) > 0)) B.envase = null;
      let id = H.id;
      cambiar(() => { if (!id) { id = M.slug(B.nombre); while (est.ingredientes[id]) id += '_'; } est.ingredientes[id] = B; }, { sinHoja: true });
      cerrarHoja(); toast('Ingrediente guardado');
    },
    'g-borrar'() { const id = ui.hoja.id; cerrarHoja(); conDeshacer('Ingrediente eliminado', () => { delete est.ingredientes[id]; }); },

    // familia
    'nuevo-miembro'() { abrirHoja({ tipo: 'miembro', id: null, borrador: { id: M.uid('p'), nombre: '', nacimiento: '', racion: null } }); },
    'editar-miembro'(el) { abrirHoja({ tipo: 'miembro', id: el.dataset.id, borrador: M.clonar(est.familia.find((m) => m.id === el.dataset.id)) }); },
    'm-guardar'() {
      leerMiembro();
      const H = ui.hoja, B = H.borrador;
      if (!B.nombre.trim()) { toast('Escribe un nombre'); return $('[data-c="m-nombre"]').focus(); }
      B.nombre = B.nombre.trim();
      cambiar(() => {
        const i = est.familia.findIndex((m) => m.id === B.id);
        if (i >= 0) est.familia[i] = B; else est.familia.push(B);
        est.ajustes.bienvenida = false;
      }, { sinHoja: true });
      cerrarHoja(); toast(H.id ? 'Guardado' : `${B.nombre} se sienta a la mesa`);
    },
    'm-borrar'() {
      const id = ui.hoja.id;
      cerrarHoja();
      conDeshacer('Quitado de la familia', () => {
        est.familia = est.familia.filter((m) => m.id !== id);
        for (const s of Object.values(est.semanas)) s.dias.forEach((d) => ['comida', 'cena'].forEach((k) => {
          const c = d[k];
          if (Array.isArray(c.comensales)) { c.comensales = c.comensales.filter((x) => x !== id); }
        }));
      });
    },
    apetito(el) { cambiar(() => { est.ajustes.apetito = Number(el.dataset.v); }); },

    // súper
    'mover-sec'(el) {
      cambiar(() => {
        const o = supActual().orden, i = Number(el.dataset.i), j = i + Number(el.dataset.d);
        [o[i], o[j]] = [o[j], o[i]];
      });
    },
    'restaurar-orden'() {
      const orig = window.MYC_SEED.SUPERMERCADOS.find((s) => s.id === supActual().id);
      if (orig) conDeshacer('Orden restaurado', () => { supActual().orden = M.clonar(orig.orden); M.normalizar(est); });
    },
    'nuevo-super'() {
      const nombre = (window.prompt('Nombre de tu súper (copiaré el orden del actual para que lo ajustes):', 'Mi súper') || '').trim();
      if (!nombre) return;
      cambiar(() => {
        const id = M.slug(nombre) + '_' + Math.random().toString(36).slice(2, 5);
        est.supermercados.push({ id, nombre, orden: M.clonar(supActual().orden), propio: true });
        est.ajustes.supermercado = id;
      });
      toast('Súper creado. Ordena las secciones como lo recorres.');
    },
    'borrar-super'() {
      const s = supActual();
      conDeshacer(`“${s.nombre}” eliminado`, () => {
        est.supermercados = est.supermercados.filter((x) => x.id !== s.id);
        est.ajustes.supermercado = est.supermercados[0].id;
      });
    },

    // datos
    exportar() {
      const blob = new Blob([JSON.stringify(est, null, 1)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `menu-y-cesta-${M.aISO(new Date())}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast('Copia exportada');
    },
    reiniciar() {
      if (!window.confirm('¿Seguro? Se borran menús, recetas, familia y ajustes de este dispositivo.')) return;
      est = M.estadoInicial(); ST.guardar(est); ui.semana = M.claveSemana(new Date()); render(); toast('Empezamos de cero');
    },

    'cerrar-hoja'() { cerrarHoja(); }
  };

  // Lectura de formularios de las hojas (no se re-pinta en cada tecla).
  function leerReceta() {
    const B = ui.hoja.borrador;
    const v = (c) => { const e = $(`#hoja [data-c="${c}"]`); return e ? e.value : null; };
    if (v('r-nombre') != null) B.nombre = v('r-nombre');
    if (v('r-tipo')) B.tipo = v('r-tipo');
    if (v('r-etiqueta')) B.etiqueta = v('r-etiqueta');
    document.querySelectorAll('#hoja [data-c="r-cant"]').forEach((e) => { const i = Number(e.dataset.i); if (B.ingredientes[i]) B.ingredientes[i][1] = e.value === '' ? 0 : Number(e.value); });
  }
  function leerIngrediente() {
    const B = ui.hoja.borrador;
    const v = (c) => { const e = $(`#hoja [data-c="${c}"]`); return e ? e.value : null; };
    B.nombre = v('g-nombre');
    B.seccion = v('g-seccion');
    B.unidad = v('g-unidad');
    B.basico = $('#hoja [data-c="g-basico"]').checked;
    if (B.envase) { B.envase.nombre = (v('g-env-nombre') || 'envase').trim(); B.envase.cantidad = Number(v('g-env-cant')) || 0; }
  }
  function leerMiembro() {
    const B = ui.hoja.borrador;
    B.nombre = $('#hoja [data-c="m-nombre"]').value;
    B.nacimiento = $('#hoja [data-c="m-nacimiento"]').value || '';
    const r = $('#hoja [data-c="m-racion"]').value;
    B.racion = r === '' ? null : Number(r);
  }

  // ---------- eventos ----------
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-a]');
    if (!el) return;
    const f = A[el.dataset.a];
    if (f) { if (el.tagName === 'A') ev.preventDefault(); f(el, ev); }
  });
  $('#hoja-fondo').addEventListener('click', cerrarHoja);
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && ui.hoja) { if (ui.hoja.picker != null) A['cerrar-picker'](); else cerrarHoja(); }
    if (ev.key === 'Enter' && ui.hoja) {
      const c = ev.target.dataset && ev.target.dataset.c;
      if (c === 'r-nuevo-nombre' || c === 'r-nuevo-cant') { ev.preventDefault(); A['r-anadir-ing'](); }
      if (c === 'x-nombre' || c === 'x-cant') { ev.preventDefault(); A['x-guardar'](); }
      if (c === 'buscar-picker') { const b = $('#hoja .selector [data-a="elegir"][data-id]:not([data-id=""])'); if (b) A.elegir(b); }
    }
  });

  document.addEventListener('input', (ev) => {
    const c = ev.target.dataset.c;
    if (c === 'filtro') { ui.filtroRecetas = ev.target.value; ui._focoFiltro = true; render(); }
    if (c === 'buscar-picker') {
      ui.hoja.q = ev.target.value;
      pintarHoja();
      const f = $('#hoja [data-c="buscar-picker"]'); f.focus(); f.setSelectionRange(f.value.length, f.value.length);
    }
    if (c === 'r-nuevo-nombre') {
      const v = norm(ev.target.value.trim());
      const existe = !v || Object.values(est.ingredientes).some((g) => norm(g.nombre) === v);
      $('#nuevo-ing-extra').classList.toggle('oculto', existe);
    }
    if (c === 'm-nacimiento') { leerMiembro(); pintarHoja(); }
  });

  document.addEventListener('change', (ev) => {
    const el = ev.target, c = el.dataset.c;
    if (c === 'supermercado') cambiar(() => { est.ajustes.supermercado = el.value; });
    if (c === 'personas') cambiar(() => { est.ajustes.personasSinFamilia = Math.max(1, Math.min(30, Number(el.value) || 1)); });
    if (c === 'fuera') cambiar(() => { M.semana(est, ui.semana).dias[ui.hoja.dia][ui.hoja.m].fuera = el.checked; });
    if (c === 'g-con-envase') { leerIngrediente(); ui.hoja.borrador.envase = el.checked ? { nombre: 'paquete', cantidad: M.esContable(ui.hoja.borrador.unidad) ? 6 : 500 } : null; pintarHoja(); }
    if (c === 'g-unidad') { leerIngrediente(); pintarHoja(); }
    if (c === 'importar' && el.files && el.files[0]) {
      const fr = new FileReader();
      fr.onload = () => {
        try {
          const datos = JSON.parse(fr.result);
          if (!datos || !datos.recetas || !datos.ingredientes) throw new Error('formato');
          if (!window.confirm('Esto sustituye los datos de este dispositivo por los de la copia. ¿Continuar?')) return;
          est = M.normalizar(datos); ST.guardar(est); render(); toast('Copia importada');
        } catch (e) { toast('Ese archivo no es una copia de Menú y Cesta'); }
      };
      fr.readAsText(el.files[0]);
      el.value = '';
    }
  });

  window.addEventListener('myc:error-guardado', () => toast('No se pudo guardar. ¿Almacenamiento lleno o modo privado?'));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') ST.guardarYa(); });

  // ---------- arranque ----------
  async function iniciar() {
    const guardado = await ST.cargar();
    est = M.normalizar(guardado);
    if (!guardado) ST.guardar(est);
    ST.suscribir((nuevo) => { est = M.normalizar(nuevo); render(); });
    const hash = location.hash.replace('#', '');
    if (['semana', 'lista', 'recetas', 'casa'].includes(hash)) ui.tab = hash;
    render();
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }
  iniciar();
})();
