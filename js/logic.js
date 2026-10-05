/* Menú y Cesta — lógica pura (sin DOM): fechas, raciones, lista de la compra. */
(function () {
  'use strict';
  const S = window.MYC_SEED;
  const VERSION = 1;

  // ---------- utilidades ----------
  const clonar = (o) => JSON.parse(JSON.stringify(o));
  const uid = (p) => (p || 'id') + '_' + Math.random().toString(36).slice(2, 9);
  const slug = (t) => (t || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40) || uid('x');

  // ---------- fechas ----------
  const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const DIAS_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  const aISO = (d) => {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };
  const deISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const sumarDias = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
  const lunesDe = (d) => { const r = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const w = (r.getDay() + 6) % 7; return sumarDias(r, -w); };
  const claveSemana = (d) => aISO(lunesDe(d));
  const rangoSemana = (clave) => {
    const a = deISO(clave), b = sumarDias(a, 6);
    return a.getMonth() === b.getMonth()
      ? `${a.getDate()}–${b.getDate()} ${MESES[b.getMonth()]}`
      : `${a.getDate()} ${MESES[a.getMonth()]} – ${b.getDate()} ${MESES[b.getMonth()]}`;
  };

  // ---------- familia y raciones ----------
  function edad(nacimiento, hoy) {
    if (!nacimiento) return null;
    const n = deISO(nacimiento), h = hoy || new Date();
    let e = h.getFullYear() - n.getFullYear();
    if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) e--;
    return e;
  }
  // Ración orientativa según edad (1 = adulto). Editable por persona.
  function racionPorEdad(e) {
    if (e == null) return 1;
    if (e < 3) return 0.3;
    if (e < 7) return 0.5;
    if (e < 12) return 0.75;
    if (e < 15) return 0.9;
    return 1;
  }
  const racionDe = (m) => (m.racion != null && m.racion !== '' ? Number(m.racion) : racionPorEdad(edad(m.nacimiento)));

  function proximosCumples(familia, desde, dias) {
    const hoy = desde || new Date();
    const base = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const res = [];
    for (const m of familia) {
      if (!m.nacimiento) continue;
      const n = deISO(m.nacimiento);
      let f = new Date(base.getFullYear(), n.getMonth(), n.getDate());
      if (f < base) f = new Date(base.getFullYear() + 1, n.getMonth(), n.getDate());
      const enDias = Math.round((f - base) / 86400000);
      if (enDias <= (dias || 45)) res.push({ miembro: m, fecha: f, enDias, cumple: f.getFullYear() - n.getFullYear() });
    }
    return res.sort((a, b) => a.enDias - b.enDias);
  }

  // ---------- estado ----------
  function semanaVacia() {
    return {
      dias: Array.from({ length: 7 }, () => ({
        comida: { platos: [null, null], fuera: false, comensales: null },
        cena: { platos: [null, null], fuera: false, comensales: null }
      })),
      lista: { tengo: {}, carrito: {}, ajustes: {}, falta: {}, extras: [] }
    };
  }

  function estadoInicial() {
    const est = {
      version: VERSION,
      creado: new Date().toISOString(),
      familia: [],
      ajustes: { personasSinFamilia: 4, apetito: 1, supermercado: 'mercadona', bienvenida: true },
      secciones: clonar(S.SECCIONES),
      supermercados: clonar(S.SUPERMERCADOS),
      ingredientes: clonar(S.INGREDIENTES),
      recetas: clonar(S.RECETAS),
      semanas: {}
    };
    // Semana actual con el menú de ejemplo.
    const sem = semanaVacia();
    S.MENU_EJEMPLO.forEach((fila, i) => {
      const [c1, c2, n1, n2] = fila;
      const d = sem.dias[i];
      if (c1 === 'fuera') d.comida.fuera = true; else d.comida.platos = [c1, c2];
      if (n1 === 'fuera') d.cena.fuera = true; else d.cena.platos = [n1, n2];
    });
    est.semanas[claveSemana(new Date())] = sem;
    return est;
  }

  // Completa estados antiguos con campos nuevos (migraciones suaves).
  function normalizar(est) {
    const base = estadoInicial();
    if (!est || typeof est !== 'object') return base;
    est.version = VERSION;
    est.familia = Array.isArray(est.familia) ? est.familia : [];
    est.ajustes = Object.assign({}, base.ajustes, est.ajustes || {});
    est.secciones = est.secciones && est.secciones.length ? est.secciones : base.secciones;
    est.supermercados = est.supermercados && est.supermercados.length ? est.supermercados : base.supermercados;
    est.ingredientes = est.ingredientes || base.ingredientes;
    est.recetas = est.recetas || base.recetas;
    est.semanas = est.semanas || {};
    for (const k of Object.keys(est.semanas)) {
      const s = est.semanas[k];
      s.lista = Object.assign({ tengo: {}, carrito: {}, ajustes: {}, falta: {}, extras: [] }, s.lista || {});
    }
    // Secciones nuevas que falten en el orden de cada súper.
    for (const sup of est.supermercados) {
      for (const sec of est.secciones) if (!sup.orden.includes(sec.id)) sup.orden.push(sec.id);
      sup.orden = sup.orden.filter((id) => est.secciones.some((s) => s.id === id));
    }
    return est;
  }

  function semana(est, clave) {
    if (!est.semanas[clave]) est.semanas[clave] = semanaVacia();
    return est.semanas[clave];
  }

  // ---------- comensales de una comida ----------
  function comensalesDe(est, comida) {
    if (comida.fuera) return { personas: [], factor: 0, anonimo: false };
    const fam = est.familia;
    const apetito = Number(est.ajustes.apetito) || 1;
    if (!fam.length) {
      const n = Number(est.ajustes.personasSinFamilia) || 1;
      return { personas: [], factor: n * apetito, anonimo: true, n };
    }
    const ids = Array.isArray(comida.comensales) ? comida.comensales : fam.map((m) => m.id);
    const personas = fam.filter((m) => ids.includes(m.id));
    const factor = personas.reduce((a, m) => a + racionDe(m), 0) * apetito;
    return { personas, factor, anonimo: false };
  }

  // ---------- unidades y envases ----------
  const UNIDADES_CONTABLES = ['ud', 'diente', 'sobre', 'manojo', 'lata', 'bote'];
  const esContable = (u) => UNIDADES_CONTABLES.includes(u);
  const fmtNum = (n, dec) => Number(n).toLocaleString('es-ES', { maximumFractionDigits: dec == null ? 1 : dec });

  function fmtCantidad(cant, unidad) {
    if (unidad === 'g') return cant >= 1000 ? fmtNum(cant / 1000, 2) + ' kg' : fmtNum(Math.round(cant)) + ' g';
    if (unidad === 'ml') return cant >= 1000 ? fmtNum(cant / 1000, 2) + ' l' : fmtNum(Math.round(cant)) + ' ml';
    const plur = { ud: 'ud', diente: cant === 1 ? 'diente' : 'dientes', sobre: cant === 1 ? 'sobre' : 'sobres', manojo: cant === 1 ? 'manojo' : 'manojos' };
    return fmtNum(cant) + ' ' + (plur[unidad] || unidad);
  }
  function plural(nombre, n) {
    if (n === 1) return nombre;
    if (/ de /.test(nombre)) return nombre.replace(/^(\S+)/, (w) => plural(w, n));
    if (/[aeiouáéó]$/i.test(nombre)) return nombre + 's';
    if (/z$/i.test(nombre)) return nombre.slice(0, -1) + 'ces';
    return nombre + 'es';
  }

  // Redondea la necesidad a algo que se pueda comprar.
  function aComprar(ing, necesidad, ajuste) {
    const adj = Number(ajuste) || 0;
    if (ing.envase && ing.envase.cantidad > 0) {
      // 8 % de tolerancia: si faltan unos gramos, no compramos otro paquete entero.
      const base = necesidad > 0 ? Math.max(1, Math.ceil(necesidad / ing.envase.cantidad - 0.08)) : 0;
      const n = Math.max(0, base + adj);
      const tam = ing.envase.cantidad === 1 && esContable(ing.unidad) ? '' : ' de ' + fmtCantidad(ing.envase.cantidad, ing.unidad);
      return { n, paso: 1, texto: n ? `${fmtNum(n, 0)} ${plural(ing.envase.nombre, n)}${tam}` : '—', base };
    }
    if (esContable(ing.unidad)) {
      const base = necesidad > 0 ? Math.max(1, Math.ceil(necesidad - 0.1)) : 0;
      const n = Math.max(0, base + adj);
      return { n, paso: 1, texto: n ? fmtCantidad(n, ing.unidad) : '—', base };
    }
    // A granel / al corte: redondeo a 50 g (o 50 ml).
    const paso = 50;
    const base = necesidad > 0 ? Math.ceil(necesidad / paso) * paso : 0;
    const n = Math.max(0, base + adj * paso);
    return { n, paso, texto: n ? fmtCantidad(n, ing.unidad) + (ing.unidad === 'g' ? ' (al corte)' : '') : '—', base };
  }

  // ---------- lista de la compra ----------
  function calcularLista(est, clave) {
    const sem = semana(est, clave);
    const nec = {};   // ingId -> cantidad
    const usos = {};  // ingId -> ['Lun · Paella', ...]
    sem.dias.forEach((dia, i) => {
      ['comida', 'cena'].forEach((momento) => {
        const c = dia[momento];
        if (c.fuera) return;
        const { factor } = comensalesDe(est, c);
        if (!factor) return;
        c.platos.forEach((rid) => {
          const r = rid && est.recetas[rid];
          if (!r) return;
          for (const [ingId, cant] of r.ingredientes) {
            if (!est.ingredientes[ingId]) continue;
            nec[ingId] = (nec[ingId] || 0) + Number(cant) * factor;
            (usos[ingId] = usos[ingId] || []).push(`${DIAS_CORTO[i]} ${momento === 'comida' ? 'comida' : 'cena'} · ${r.nombre}`);
          }
        });
      });
    });

    const L = sem.lista;
    const items = [];
    for (const ingId of Object.keys(nec)) {
      const ing = est.ingredientes[ingId];
      const compra = aComprar(ing, nec[ingId], L.ajustes[ingId]);
      items.push({
        id: ingId, nombre: ing.nombre, seccion: ing.seccion || 'otros', basico: !!ing.basico,
        necesidad: nec[ingId], necesidadTxt: fmtCantidad(esContable(ing.unidad) ? Math.round(nec[ingId] * 10) / 10 : nec[ingId], ing.unidad),
        compra, usos: usos[ingId], extra: false,
        tengo: !!L.tengo[ingId], carrito: !!L.carrito[ingId], falta: !!L.falta[ingId], ajustado: !!L.ajustes[ingId]
      });
    }
    for (const ex of L.extras) {
      items.push({
        id: ex.id, nombre: ex.nombre, seccion: ex.seccion || 'otros', basico: false, extra: true,
        compra: { texto: ex.cantidad || '' }, usos: [], tengo: false, carrito: !!L.carrito[ex.id]
      });
    }
    items.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    const sup = est.supermercados.find((s) => s.id === est.ajustes.supermercado) || est.supermercados[0];
    const orden = sup ? sup.orden : est.secciones.map((s) => s.id);
    const secNombre = Object.fromEntries(est.secciones.map((s) => [s.id, s]));

    const comprar = items.filter((it) => !it.tengo && (!it.basico || it.falta) && (it.extra || it.compra.n > 0));
    const grupos = orden
      .map((sid) => ({ seccion: secNombre[sid] || { id: sid, nombre: sid, icono: '🛒' }, items: comprar.filter((it) => it.seccion === sid) }))
      .filter((g) => g.items.length);
    const huerfanos = comprar.filter((it) => !orden.includes(it.seccion));
    if (huerfanos.length) grupos.push({ seccion: secNombre.otros || { id: 'otros', nombre: 'Otros', icono: '🛒' }, items: huerfanos });

    return {
      grupos,
      tengo: items.filter((it) => it.tengo),
      basicos: items.filter((it) => it.basico && !it.falta && !it.tengo),
      total: comprar.length,
      enCarrito: comprar.filter((it) => it.carrito).length,
      supermercado: sup
    };
  }

  function textoLista(est, clave) {
    const l = calcularLista(est, clave);
    let t = `🛒 *Lista de la compra* — semana ${rangoSemana(clave)}\n`;
    for (const g of l.grupos) {
      t += `\n${g.seccion.icono} *${g.seccion.nombre}*\n`;
      for (const it of g.items) t += `${it.carrito ? '✅' : '▫️'} ${it.nombre}${it.compra.texto ? ' — ' + it.compra.texto : ''}\n`;
    }
    t += '\n_Hecha con Menú y Cesta_';
    return t;
  }

  // ---------- equilibrio semanal (orientativo) ----------
  function equilibrio(est, clave) {
    const sem = semana(est, clave);
    const cuenta = {}, repes = {};
    let huecos = 0, comidas = 0;
    sem.dias.forEach((d) => ['comida', 'cena'].forEach((m) => {
      const c = d[m];
      if (c.fuera) return;
      comidas++;
      if (!c.platos[0] && !c.platos[1]) huecos++;
      c.platos.forEach((rid) => {
        const r = rid && est.recetas[rid];
        if (!r) return;
        cuenta[r.etiqueta] = (cuenta[r.etiqueta] || 0) + 1;
        repes[rid] = (repes[rid] || 0) + 1;
      });
    }));
    const avisos = [];
    if (huecos) avisos.push({ tipo: 'info', txt: `${huecos} ${huecos === 1 ? 'comida sin plato' : 'comidas sin plato'} todavía.` });
    const pescado = cuenta.pescado || 0, legumbre = cuenta.legumbre || 0, verdura = cuenta.verdura || 0, carne = cuenta.carne || 0;
    if (pescado < 3) avisos.push({ tipo: 'aviso', txt: `Pescado ${pescado} ${pescado === 1 ? 'vez' : 'veces'}: la recomendación habitual es al menos 3 a la semana.` });
    if (legumbre < 3) avisos.push({ tipo: 'aviso', txt: `Legumbre ${legumbre} ${legumbre === 1 ? 'vez' : 'veces'}: se suelen recomendar 3–4 a la semana.` });
    if (verdura < 5) avisos.push({ tipo: 'aviso', txt: `Verdura como plato ${verdura} ${verdura === 1 ? 'vez' : 'veces'}: conviene que esté presente casi a diario.` });
    if (carne > 5) avisos.push({ tipo: 'aviso', txt: `Carne ${carne} veces: quizá sobra alguna.` });
    for (const [rid, n] of Object.entries(repes)) if (n > 2) avisos.push({ tipo: 'aviso', txt: `${est.recetas[rid].nombre} se repite ${n} veces.` });
    if (!avisos.length) avisos.push({ tipo: 'ok', txt: 'Semana equilibrada. ¡Bien jugado!' });
    return { cuenta, avisos, comidas };
  }

  // ---------- sorpréndeme: rellena huecos vacíos ----------
  function sorprendeme(est, clave) {
    const sem = semana(est, clave);
    const usados = new Set();
    sem.dias.forEach((d) => ['comida', 'cena'].forEach((m) => d[m].platos.forEach((r) => r && usados.add(r))));
    const ids = Object.keys(est.recetas);
    const pick = (tipos) => {
      const cand = ids.filter((id) => tipos.includes(est.recetas[id].tipo));
      const libres = cand.filter((id) => !usados.has(id));
      const pool = libres.length ? libres : cand;
      if (!pool.length) return null;
      const r = pool[Math.floor(Math.random() * pool.length)];
      usados.add(r);
      return r;
    };
    let n = 0;
    sem.dias.forEach((d) => ['comida', 'cena'].forEach((m) => {
      const c = d[m];
      if (c.fuera) return;
      if (!c.platos[0]) { c.platos[0] = pick(m === 'cena' ? ['primero', 'unico'] : ['primero', 'unico']); n++; }
      const t0 = c.platos[0] && est.recetas[c.platos[0]] ? est.recetas[c.platos[0]].tipo : null;
      if (!c.platos[1] && t0 === 'primero' && m === 'comida') { c.platos[1] = pick(['segundo']); n++; }
    }));
    return n;
  }

  window.MYC = {
    VERSION, DIAS, DIAS_CORTO, MESES,
    clonar, uid, slug, aISO, deISO, sumarDias, lunesDe, claveSemana, rangoSemana,
    edad, racionPorEdad, racionDe, proximosCumples,
    semanaVacia, estadoInicial, normalizar, semana, comensalesDe,
    fmtCantidad, fmtNum, esContable, aComprar, calcularLista, textoLista, equilibrio, sorprendeme
  };
})();
