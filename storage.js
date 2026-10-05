/* Menú y Cesta — capa de almacenamiento.
 *
 * La app solo habla con `MYC_STORAGE`, que delega en un ADAPTADOR.
 * Hoy: LocalAdapter (datos en el navegador del dispositivo).
 * Mañana: un adaptador remoto (Supabase, Firebase, PocketBase...) que
 * implemente la misma interfaz. Ver docs/BACKEND.md.
 *
 * Interfaz de un adaptador:
 *   nombre: string
 *   async cargar()            -> estado | null
 *   async guardar(estado)     -> void
 *   async borrar()            -> void
 *   (opcional) suscribir(fn)  -> función para cancelar; avisa de cambios
 *                                hechos desde otro dispositivo
 */
(function () {
  'use strict';

  const CLAVE = 'menu-y-cesta:v1';

  const LocalAdapter = {
    nombre: 'local',
    async cargar() {
      try {
        const txt = localStorage.getItem(CLAVE);
        return txt ? JSON.parse(txt) : null;
      } catch (e) {
        console.warn('No se pudo leer el almacenamiento local', e);
        return null;
      }
    },
    async guardar(estado) {
      try {
        localStorage.setItem(CLAVE, JSON.stringify(estado));
      } catch (e) {
        console.warn('No se pudo guardar en local', e);
        throw e;
      }
    },
    async borrar() {
      try { localStorage.removeItem(CLAVE); } catch (e) { /* nada */ }
    },
    // Cambios hechos en otra pestaña del mismo navegador.
    suscribir(fn) {
      const h = (ev) => {
        if (ev.key !== CLAVE || !ev.newValue) return;
        try { fn(JSON.parse(ev.newValue)); } catch (e) { /* nada */ }
      };
      window.addEventListener('storage', h);
      return () => window.removeEventListener('storage', h);
    }
  };

  let adaptador = LocalAdapter;
  let temporizador = null;
  let pendiente = null;

  window.MYC_STORAGE = {
    get adaptador() { return adaptador.nombre; },
    usar(nuevo) { adaptador = nuevo; },
    cargar: () => adaptador.cargar(),
    borrar: () => adaptador.borrar(),
    suscribir: (fn) => (adaptador.suscribir ? adaptador.suscribir(fn) : () => {}),
    // Guardado agrupado: varias ediciones seguidas = una sola escritura.
    guardar(estado) {
      pendiente = estado;
      clearTimeout(temporizador);
      temporizador = setTimeout(() => {
        const e = pendiente; pendiente = null;
        adaptador.guardar(e).catch(() => window.dispatchEvent(new CustomEvent('myc:error-guardado')));
      }, 300);
    },
    guardarYa() {
      clearTimeout(temporizador);
      if (pendiente) { const e = pendiente; pendiente = null; return adaptador.guardar(e); }
      return Promise.resolve();
    }
  };

  window.MYC_ADAPTADORES = { LocalAdapter };
})();
