# 🧺 Menú y Cesta

**Planifica el menú semanal de tu familia y obtén la lista de la compra completa, con cantidades reales y ordenada por los pasillos de tu súper.**

Hermana pequeña del [Parrillómetro](https://github.com/miguelmunozicam-del/parrillometro): sencilla, sin registros y con tus datos en tu dispositivo.

## Qué hace

- 📅 **Menú semanal**: comida y cena, primer y segundo plato, de lunes a domingo. Marca las comidas que hacéis fuera.
- 👨‍👩‍👧‍👦 **Tu familia**: nombre y fecha de nacimiento. Las raciones se ajustan por edad y te avisa de los cumpleaños.
- 👥 **Quién come**: si un día falta alguien, se descuenta su ración.
- 🛒 **Lista de la compra automática**: suma los ingredientes de toda la semana y los redondea a lo que se vende de verdad (2 bandejas de 500 g, 1 docena de huevos…).
- 🏪 **Tu súper**: Mercadona, Carrefour, Lidl, Dia, Alcampo, Ahorramás, Eroski, el mercado… o el tuyo propio. Ordena las secciones como recorres la tienda.
- 🏠 **"Ya lo tengo"**: quita de la lista lo que hay en la despensa. Los básicos (aceite, sal, pimentón) no salen salvo que te falten.
- ➕➖ **Ajustes rápidos** de cantidad y artículos extra (papel de cocina, detergente…).
- 📲 **Enviar por WhatsApp**, copiar o imprimir la lista.
- 🎲 **Rellenar huecos** con recetas al azar y **copiar la semana anterior**.
- 🥗 **Equilibrio semanal** orientativo: pescado, legumbre, verdura y repeticiones.
- 📖 **Recetario editable**: crea, duplica y ajusta recetas e ingredientes (sección, unidad, envase).
- 📱 **App instalable** (PWA), funciona sin conexión en el súper y se adapta a móvil y ordenador.

## Privacidad

Los datos se guardan **solo en el navegador del dispositivo** (`localStorage`). No hay servidor, cuentas ni analítica.
Para pasar tus datos del móvil al ordenador: *Casa → Exportar copia* y luego *Importar copia* en el otro dispositivo.

## Usarla

**En línea:** abre https://miguelmunozicam-del.github.io/menu-y-cesta/ y, en el móvil, *Añadir a pantalla de inicio*.

**En local:** descarga el repositorio y abre `index.html` en el navegador. No necesita instalar nada.
(Para probar el modo sin conexión hace falta servirla por `https` o `localhost`, por ejemplo con `python3 -m http.server`.)

## Publicar en GitHub Pages

1. Sube estos archivos a la rama `main`.
2. *Settings → Pages → Build and deployment → Deploy from a branch* → `main` / `(root)`.
3. En un par de minutos estará en `https://<tu-usuario>.github.io/<repositorio>/`.

## Estructura

```
index.html              Página única
css/styles.css          Estilos (claro/oscuro, responsive)
js/seed.js              Recetas, ingredientes y supermercados iniciales
js/logic.js             Lógica pura: raciones, lista, equilibrio
js/storage.js           Capa de almacenamiento con adaptadores
js/app.js               Interfaz
sw.js                   Service worker (modo sin conexión)
manifest.webmanifest    Datos de la app instalable
docs/BACKEND.md         Cómo añadir sincronización entre dispositivos
```

Sin dependencias ni paso de compilación: HTML, CSS y JavaScript.

## Hoja de ruta

- [ ] Sincronización automática entre dispositivos con un servidor gratuito (ver `docs/BACKEND.md`)
- [ ] Importar recetas desde Excel
- [ ] Precio estimado de la compra
- [ ] Ideas para aprovechar sobras

## Licencia

[MIT](LICENSE). Úsala, compártela y mejórala.
