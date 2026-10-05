/* Menú y Cesta — datos iniciales.
 * Recetas e ingredientes basados en un menú familiar real.
 * Cantidades = ración de un adulto. Todo es editable desde la app.
 */
(function () {
  'use strict';

  // Secciones del supermercado (el orden de recorrido lo marca cada súper).
  const SECCIONES = [
    { id: 'fruteria', nombre: 'Fruta y verdura', icono: '🥦' },
    { id: 'carniceria', nombre: 'Carnicería', icono: '🥩' },
    { id: 'charcuteria', nombre: 'Charcutería y quesos', icono: '🧀' },
    { id: 'pescaderia', nombre: 'Pescadería', icono: '🐟' },
    { id: 'huevos_lacteos', nombre: 'Huevos y lácteos', icono: '🥚' },
    { id: 'panaderia', nombre: 'Panadería', icono: '🥖' },
    { id: 'seco', nombre: 'Pasta, arroz y legumbres', icono: '🍝' },
    { id: 'conservas', nombre: 'Conservas y salsas', icono: '🥫' },
    { id: 'especias', nombre: 'Especias, caldos y sopas', icono: '🧂' },
    { id: 'refrigerados', nombre: 'Refrigerados y preparados', icono: '🍕' },
    { id: 'congelados', nombre: 'Congelados', icono: '❄️' },
    { id: 'drogueria', nombre: 'Droguería y hogar', icono: '🧽' },
    { id: 'otros', nombre: 'Otros', icono: '🛒' }
  ];

  // Orden aproximado de recorrido. Cada tienda cambia: es editable.
  const ORDEN_FRESCO_PRIMERO = ['fruteria', 'panaderia', 'carniceria', 'charcuteria', 'pescaderia', 'huevos_lacteos', 'refrigerados', 'seco', 'conservas', 'especias', 'congelados', 'drogueria', 'otros'];
  const SUPERMERCADOS = [
    { id: 'mercadona', nombre: 'Mercadona', orden: ['fruteria', 'panaderia', 'charcuteria', 'carniceria', 'pescaderia', 'refrigerados', 'huevos_lacteos', 'seco', 'conservas', 'especias', 'drogueria', 'congelados', 'otros'] },
    { id: 'carrefour', nombre: 'Carrefour', orden: ['fruteria', 'carniceria', 'pescaderia', 'charcuteria', 'panaderia', 'huevos_lacteos', 'refrigerados', 'seco', 'conservas', 'especias', 'drogueria', 'congelados', 'otros'] },
    { id: 'lidl', nombre: 'Lidl', orden: ['fruteria', 'panaderia', 'seco', 'conservas', 'especias', 'refrigerados', 'charcuteria', 'carniceria', 'pescaderia', 'huevos_lacteos', 'congelados', 'drogueria', 'otros'] },
    { id: 'dia', nombre: 'Dia', orden: ['fruteria', 'seco', 'conservas', 'especias', 'drogueria', 'huevos_lacteos', 'charcuteria', 'carniceria', 'pescaderia', 'refrigerados', 'panaderia', 'congelados', 'otros'] },
    { id: 'alcampo', nombre: 'Alcampo', orden: ORDEN_FRESCO_PRIMERO },
    { id: 'ahorramas', nombre: 'Ahorramás', orden: ['fruteria', 'carniceria', 'charcuteria', 'pescaderia', 'panaderia', 'huevos_lacteos', 'refrigerados', 'seco', 'conservas', 'especias', 'drogueria', 'congelados', 'otros'] },
    { id: 'eroski', nombre: 'Eroski', orden: ORDEN_FRESCO_PRIMERO },
    { id: 'mercado', nombre: 'Mercado de barrio', orden: ['fruteria', 'carniceria', 'pescaderia', 'charcuteria', 'panaderia', 'huevos_lacteos', 'seco', 'conservas', 'especias', 'refrigerados', 'congelados', 'drogueria', 'otros'] }
  ];

  // envase: cómo se vende. null = a granel / al corte / por piezas.
  const I = (nombre, seccion, unidad, envase, extra) =>
    Object.assign({ nombre, seccion, unidad, envase: envase || null, basico: false }, extra || {});
  const E = (cantidad, nombre) => ({ cantidad, nombre });

  const INGREDIENTES = {
    espaguetis: I('Espaguetis', 'seco', 'g', E(500, 'paquete')),
    tomate_frito: I('Tomate frito', 'conservas', 'g', E(400, 'brick')),
    carne_picada: I('Carne picada', 'carniceria', 'g', E(500, 'bandeja')),
    cebolla: I('Cebolla', 'fruteria', 'ud'),
    ajo: I('Ajo', 'fruteria', 'diente', E(10, 'cabeza')),
    queso_rallado: I('Queso rallado', 'huevos_lacteos', 'g', E(150, 'bolsa')),
    brocoli: I('Brócoli', 'fruteria', 'g', E(500, 'pieza')),
    patata: I('Patata', 'fruteria', 'g', E(2000, 'malla')),
    cinta_lomo: I('Cinta de lomo', 'carniceria', 'g', E(500, 'bandeja')),
    lentejas_bote: I('Lentejas de bote', 'conservas', 'g', E(400, 'bote')),
    puerro: I('Puerro', 'fruteria', 'ud'),
    calabacin: I('Calabacín', 'fruteria', 'g', E(300, 'pieza')),
    zanahoria: I('Zanahoria', 'fruteria', 'g', E(1000, 'bolsa')),
    espinacas: I('Espinacas', 'fruteria', 'g', E(300, 'bolsa')),
    pan: I('Pan', 'panaderia', 'g', E(250, 'barra')),
    perejil: I('Perejil', 'fruteria', 'manojo', E(1, 'manojo')),
    huevos: I('Huevos', 'huevos_lacteos', 'ud', E(12, 'docena')),
    tomate_triturado: I('Tomate triturado', 'conservas', 'g', E(400, 'bote')),
    pasta: I('Pasta corta', 'seco', 'g', E(500, 'paquete')),
    maiz: I('Maíz', 'conservas', 'g', E(140, 'lata')),
    taco_jamon: I('Tacos de jamón', 'charcuteria', 'g', E(150, 'paquete')),
    taco_queso: I('Tacos de queso', 'charcuteria', 'g', E(150, 'paquete')),
    atun: I('Atún', 'conservas', 'g', E(240, 'pack de 3 latas')),
    lomo_pavo: I('Lomo de pavo', 'carniceria', 'g', E(400, 'bandeja')),
    esparragos: I('Espárragos trigueros', 'fruteria', 'g', E(250, 'manojo')),
    emperador: I('Emperador', 'pescaderia', 'g'),
    salmon: I('Salmón', 'pescaderia', 'g'),
    sobre_sopa: I('Sopa de sobre', 'especias', 'sobre', E(1, 'sobre')),
    garbanzos: I('Garbanzos cocidos', 'conservas', 'g', E(400, 'bote')),
    filete_ternera: I('Filetes de ternera', 'carniceria', 'g'),
    pizza: I('Pizza', 'refrigerados', 'ud'),
    pimiento_rojo: I('Pimiento rojo', 'fruteria', 'ud'),
    pimiento_verde: I('Pimiento verde', 'fruteria', 'ud'),
    salchichas: I('Salchichas variadas', 'carniceria', 'g', E(400, 'paquete')),
    fideos: I('Fideos', 'seco', 'g', E(500, 'paquete')),
    huesos: I('Huesos para caldo', 'carniceria', 'ud'),
    morcillo: I('Morcillo', 'carniceria', 'g'),
    repollo: I('Repollo', 'fruteria', 'ud'),
    pollo: I('Pollo', 'carniceria', 'g'),
    arroz: I('Arroz', 'seco', 'g', E(1000, 'paquete')),
    tomate: I('Tomate', 'fruteria', 'ud'),
    pimenton: I('Pimentón', 'especias', 'g', E(75, 'bote'), { basico: true }),
    aceite: I('Aceite de oliva', 'conservas', 'ml', E(1000, 'botella'), { basico: true }),
    sal: I('Sal', 'especias', 'g', E(1000, 'paquete'), { basico: true })
  };

  // tipo: primero | segundo | unico   ·   etiqueta: para el equilibrio semanal
  const R = (nombre, tipo, etiqueta, ingredientes) => ({ nombre, tipo, etiqueta, ingredientes });
  const RECETAS = {
    espaguetis_bolonesa: R('Espaguetis boloñesa', 'primero', 'pasta', [['espaguetis', 100], ['tomate_frito', 80], ['carne_picada', 100], ['cebolla', 0.25], ['ajo', 0.5], ['queso_rallado', 15], ['aceite', 10]]),
    brocoli: R('Brócoli con patata', 'primero', 'verdura', [['brocoli', 200], ['patata', 100], ['aceite', 10]]),
    cinta_lomo: R('Cinta de lomo', 'segundo', 'carne', [['cinta_lomo', 150], ['aceite', 5]]),
    lentejas: R('Lentejas de bote', 'primero', 'legumbre', [['lentejas_bote', 200]]),
    pure: R('Puré de verduras', 'primero', 'verdura', [['patata', 120], ['puerro', 0.5], ['calabacin', 100], ['zanahoria', 60], ['espinacas', 40], ['aceite', 10]]),
    albondigas: R('Albóndigas', 'segundo', 'carne', [['carne_picada', 125], ['pan', 15], ['ajo', 0.5], ['perejil', 0.1], ['huevos', 0.25], ['tomate_triturado', 100], ['aceite', 15]]),
    ensalada_pasta: R('Ensalada de pasta', 'primero', 'pasta', [['pasta', 80], ['maiz', 30], ['taco_jamon', 30], ['taco_queso', 30], ['atun', 40], ['aceite', 10]]),
    lomo_pavo: R('Lomo de pavo', 'segundo', 'carne', [['lomo_pavo', 150], ['aceite', 5]]),
    esparragos: R('Espárragos trigueros', 'primero', 'verdura', [['esparragos', 125], ['aceite', 5]]),
    pescado: R('Pescado (emperador y salmón)', 'segundo', 'pescado', [['emperador', 80], ['salmon', 80], ['aceite', 5]]),
    sopa: R('Sopa', 'primero', 'legumbre', [['sobre_sopa', 0.25], ['garbanzos', 50]]),
    filete_ternera: R('Filete de ternera', 'segundo', 'carne', [['filete_ternera', 150], ['aceite', 5]]),
    pizzas: R('Pizzas', 'unico', 'otros', [['pizza', 0.5]]),
    pisto: R('Pisto', 'primero', 'verdura', [['calabacin', 150], ['pimiento_rojo', 0.25], ['pimiento_verde', 0.5], ['cebolla', 0.25], ['tomate_triturado', 100], ['aceite', 15]]),
    huevos_fritos: R('Huevos fritos', 'segundo', 'huevo', [['huevos', 2], ['aceite', 20]]),
    salchichas: R('Salchichas', 'segundo', 'carne', [['salchichas', 150]]),
    cocido: R('Cocido', 'unico', 'legumbre', [['fideos', 20], ['huesos', 0.5], ['morcillo', 125], ['repollo', 0.125], ['pollo', 100], ['garbanzos', 100]]),
    paella: R('Paella', 'unico', 'arroz', [['arroz', 100], ['pollo', 125], ['pimiento_verde', 0.25], ['tomate', 0.25], ['ajo', 0.5], ['pimenton', 1], ['cebolla', 0.15], ['aceite', 15], ['sal', 2]]),
    tortilla: R('Tortilla', 'segundo', 'huevo', [['huevos', 2], ['aceite', 10]])
  };

  // Menú de ejemplo (del Excel). [comida1, comida2, cena1, cena2]; 'fuera' = se come fuera.
  const MENU_EJEMPLO = [
    ['espaguetis_bolonesa', null, 'brocoli', 'cinta_lomo'],
    ['lentejas', null, 'pure', 'albondigas'],
    ['ensalada_pasta', 'lomo_pavo', 'esparragos', 'pescado'],
    ['sopa', 'filete_ternera', 'pizzas', null],
    ['pisto', 'huevos_fritos', 'salchichas', null],
    ['cocido', null, 'fuera', null],
    ['paella', null, 'tortilla', null]
  ];

  window.MYC_SEED = { SECCIONES, SUPERMERCADOS, INGREDIENTES, RECETAS, MENU_EJEMPLO };
})();
