# Sincronización entre dispositivos (fase 2)

Hoy la app guarda todo en el navegador con `LocalAdapter` (`js/storage.js`).
La interfaz no sabe dónde viven los datos: solo llama a `MYC_STORAGE`. Para sincronizar
móvil y ordenador basta con escribir un adaptador remoto y activarlo.

## Contrato del adaptador

```js
const MiAdapter = {
  nombre: 'supabase',
  async cargar()        { /* devuelve el estado completo o null */ },
  async guardar(estado) { /* persiste el estado completo */ },
  async borrar()        { /* elimina los datos del usuario */ },
  suscribir(fn)         { /* opcional: llama a fn(estado) si cambia en otro dispositivo; devuelve cancelar() */ }
};
MYC_STORAGE.usar(MiAdapter);
```

El estado es un único documento JSON (versión en `estado.version`). Si en el futuro
cambia su forma, `MYC.normalizar()` en `js/logic.js` hace la migración.

## Opción recomendada: Supabase (plan gratuito)

1. Crear un proyecto en Supabase y activar *Auth → Email (magic link)*.
2. Tabla:

```sql
create table estados (
  user_id uuid primary key references auth.users on delete cascade,
  datos jsonb not null,
  actualizado timestamptz not null default now()
);
alter table estados enable row level security;
create policy "cada uno lo suyo" on estados
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

3. Adaptador (esqueleto, usando `@supabase/supabase-js` desde CDN):

```js
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const SupabaseAdapter = {
  nombre: 'supabase',
  async cargar() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return null;
    const { data } = await sb.from('estados').select('datos').eq('user_id', user.id).maybeSingle();
    return data ? data.datos : null;
  },
  async guardar(estado) {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new Error('sin sesión');
    const { error } = await sb.from('estados').upsert({ user_id: user.id, datos: estado, actualizado: new Date().toISOString() });
    if (error) throw error;
  },
  async borrar() { /* delete where user_id */ },
  suscribir(fn) {
    const ch = sb.channel('estado').on('postgres_changes', { event: '*', schema: 'public', table: 'estados' }, (p) => fn(p.new.datos)).subscribe();
    return () => sb.removeChannel(ch);
  }
};
```

Recomendable: mantener `LocalAdapter` como caché sin conexión y subir los cambios cuando haya red
(estrategia "local primero"), resolviendo conflictos por `estado.actualizado`.

## Antes de abrirlo a otras personas: protección de datos

Con sincronización, quien despliegue el servidor pasa a tratar datos personales de terceros
(nombres, fechas de nacimiento, email de acceso). Antes de abrirlo a amigos o al público:

- Información al usuario y base jurídica (arts. 6 y 13 RGPD); política de privacidad en la app.
- Encargo de tratamiento con el proveedor (art. 28 RGPD) y región de alojamiento en la UE.
- Minimización: la fecha de nacimiento puede sustituirse por el año, o guardarse solo en local.
- Derecho de supresión: botón "Borrar mi cuenta y mis datos".

Alternativa sin servidor propio: guardar el JSON en el Google Drive de cada usuario
(carpeta oculta `appDataFolder`), de modo que el desarrollador no custodia datos ajenos.
