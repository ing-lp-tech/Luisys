import { BotMessageSquare } from "lucide-react";
import { BatteryCharging } from "lucide-react";
import { Fingerprint } from "lucide-react";
import { ShieldHalf } from "lucide-react";
import { PlugZap } from "lucide-react";
import { GlobeLock } from "lucide-react";

import papelMadera1 from ".././assets/papelMadera2.jpg";
import papelBlanco2 from ".././assets/papelBlanco2.jpg";
import injectplotter from ".././assets/injectplotter.jpg";
import plotterdecorte from ".././assets/plotterdecorte.jpg";
import injectplotterepson from ".././assets/injectplotterepson.jpg";
import injectplotterhp45 from ".././assets/injectplotterhp45.jpg";
import plotterdecorte1 from ".././assets/plotterdecorte1.jpg";
import pc_tizado from ".././assets/pc_500mil.jpg";
import kit4cam from ".././assets/kit4cam.jpg";
import kit8cam from ".././assets/kit8cam.jpg";
import imouRanger2 from ".././assets/imouRange.jpg";
import imouCruiserSe from ".././assets/imouCruise.jpg";

export const navItems = [
  { label: "Inicio", href: "#inicio" }, // Agregar #
  { label: "Productos", href: "#productos" }, // Agregar #
  { label: "Como trabajamos", href: "#como-trabajamos" }, // Agregar #
  { label: "Preguntas frecuentes", href: "#preguntasfrecuentes" }, // Ya está correcto
  { label: "Sobre mi", href: "#sobre-mi" }, // Agregar #
  { label: "Contacto", href: "#contacto" }, // Ya está correcto
  { label: "Comunidad", href: "/comunidad", external: false },
  { label: "Importacion", href: "/importacion", external: false },
];

export const checklistItems = [
  {
    title: "1. Asesoramiento Técnico",
    description:
      "Te ayudamos a seleccionar el plotter y papel ideal según tu volumen de producción y tipo de prendas que confeccionas.",
  },
  {
    title: "2. Cotización Personalizada",
    description:
      "Recibirás una propuesta detallada con los mejores insumos para tu taller y opciones de pago flexibles.",
  },
  {
    title: "3. Entrega Garantizada",
    description:
      "Coordinamos envíos rápidos y seguros de tus plotters y rollos de papel para que no detengas tu producción.",
  },
];

export const resourcesLinks = [
  { href: "#", text: "Getting Started" },
  { href: "#", text: "Documentation" },
  { href: "#", text: "Tutorials" },
  { href: "#", text: "API Reference" },
  { href: "#", text: "Community Forums" },
];

export const platformLinks = [
  { href: "#", text: "Features" },
  { href: "#", text: "Supported Devices" },
  { href: "#", text: "System Requirements" },
  { href: "#", text: "Downloads" },
  { href: "#", text: "Release Notes" },
];

export const pcs = [
  {
    id: 1,
    name: "PC Tizado Digital – AMD Athlon 3000G",
    category: "Computadoras",
    description: "PC optimizada para plotters y software de tizado textil.",
    price: 500000,
    image: pc_tizado,
    specs: {
      procesador: "AMD Athlon 3000G",
      graficos: "Radeon Vega 3",
      mother: "A520M A PRO",
      ram: "8GB (1x8) Patriot 3200 MHz",
      almacenamiento: "SSD 240 GB ADATA",
      fuente: "500W (gabinete kit)",
      gabinete: "Noxi Kit + Fuente",
      perifericos: "Teclado y mouse incluidos",
      wifi: "Adaptador USB 300 Mbps 2.4GHz",
      sistema: "Windows 10 + Office activado",
      garantia: "1 año directo",
    },
    combos: {
      basico: 500000,
      conMonitor: 680000,
    },
  },
];

export const kitCameras = {
  kits: [
    {
      id: 101,
      name: "KIT 4 Cámaras Dahua + DVR 4CH",
      category: "Seguridad",
      description:
        "Kit de videovigilancia + instalación completa con DVR Dahua de 4 canales y 4 cámaras bullet B1A21P. Incluye balunes, conectores, splitter, cable UTP de 60mts y fuente de alimentación.",
      price: 190, // precio base (ejemplo, ajustalo)
      image: kit4cam, // import de la imagen optimizada
      combos: {
        kit: 185000,
        instaladores: "consultar",
      },
      specs: {
        dvr: "DVR 4CH XVR1B04-I",
        cameras: "4 Cámaras Dahua Bullet B1A21P",
        baluns: "4 balunes x 2u",
        plugs: "4 plug macho a bornera + 4 plug hembra a bornera",
        splitter: "Splitter pulpo de alimentación 1 a 4",
        cable: "60mts cable UTP 2 pares CAT5e exterior",
        power: "Fuente 3A enchufable",
      },
    },
    {
      id: 102,
      name: "KIT 8 Cámaras Dahua + DVR 8CH",
      category: "Seguridad",
      description:
        "Kit de videovigilancia + instalación completa con DVR Dahua de 8 canales y 8 cámaras bullet B1A21P. Incluye balunes, conectores, splitter, cable UTP de 120mts y fuente de alimentación.",
      price: 350, // precio base (ejemplo, ajustalo)
      image: kit8cam, // import de la imagen optimizada
      combos: {
        kit: 320000,
        instaladores: "consultar",
      },
      specs: {
        dvr: "DVR 8CH XVR1B08-I",
        cameras: "8 Cámaras Dahua Bullet B1A21P",
        baluns: "8 balunes x 2u",
        plugs: "8 plug macho a bornera + 8 plug hembra a bornera",
        splitter: "Splitter pulpo de alimentación 1 a 8",
        cable: "120mts cable UTP 2 pares CAT5e exterior",
        power: "Fuente 10A metálica",
      },
    },
  ],
};

export const imouCams = {
  imous: [
    {
      id: 103,
      name: "IMOU RANGER 2 A22EP-G",
      category: "Cámara Wi-Fi",
      description:
        "Cámara Wi-Fi interior con cobertura de 360°. Compresión H.265, altavoz, micrófono y sirena incorporados. Incluye ranura para tarjeta micro SD, detección de movimiento, detección humano y alarma de sonido.",
      price: 30, // ejemplo, ajustar según tu tabla
      image: imouRanger2, // import correspondiente
      combos: {
        unidad: 75000,
        instaladores: "consultar",
      },
      specs: {
        conexion: "Wi-Fi",
        cobertura: "360°",
        compresion: "H.265",
        audio: "Altavoz, micrófono, sirena incorporado",
        almacenamiento: "Ranura micro SD",
        funciones:
          "Detección de movimiento, detección humano, alarma de sonido",
      },
    },
    {
      id: 104,
      name: "IMOU CRUISER SE+ K7CP-3H1WE",
      category: "Cámara Wi-Fi Exterior",
      description:
        "Cámara Wi-Fi exterior plástica con compresión H.265, comunicación bidireccional y ranura micro SD. Incluye detección de movimiento, detección humano, disuasión activa y certificación IP66.",
      price: 60, // ejemplo, ajustar según tu tabla
      image: imouCruiserSe, // import correspondiente
      combos: {
        unidad: 120000,
        instaladores: "consultar",
      },
      specs: {
        material: "Plástica",
        compresion: "H.265",
        conexion: "Wi-Fi",
        audio: "Comunicación bidireccional",
        almacenamiento: "Ranura micro SD",
        funciones:
          "Detección de movimiento, detección humano, disuasión activa",
        proteccion: "IP66",
      },
    },
  ],
};

export const products = [
  {
    id: 1,
    name: "MARRÓN 91,5 X 75MTS 60GRS",
    category: "Papel marrón",
    description: "Papel marrón para tizado, ideal para patrones de confección.",
    price: 12000,
    image: papelMadera1,
    combos: {
      combo5u: 12000,
      combo15u: 11500,
      combo30u: 11000,
    },
  },
  {
    id: 2,
    name: "MARRÓN 1,07 X 75MTS 60GRS",
    category: "Papel marrón",
    description: "Papel marrón de mayor ancho para trazos amplios.",
    price: 13950,
    image: papelMadera1,
    combos: {
      combo5u: 13950,
      combo15u: 13400,
      combo30u: 12800,
    },
  },
  {
    id: 3,
    name: "MARRÓN 1,6 X 200MTS 60GRS",
    category: "Papel marrón",
    description: "Rollo largo y ancho para producción industrial.",
    price: 42900,
    image: papelMadera1,
    combos: {
      combo5u: 42900,
      combo15u: 41100,
      combo30u: 39400,
    },
  },
  {
    id: 4,
    name: "MARRÓN 1,8 X 200MTS 60GRS",
    category: "Papel marrón",
    description: "Ideal para producción a gran escala.",
    price: 48000,
    image: papelMadera1,
    combos: {
      combo5u: 48000,
      combo15u: 46000,
      combo30u: 44100,
    },
  },
  {
    id: 5,
    name: "MARRÓN 1,85 X 200MTS 60GRS",
    category: "Papel marrón",
    description: "Máximo ancho para cortes amplios y largos.",
    price: 49250,
    image: papelMadera1,
    combos: {
      combo5u: 49250,
      combo15u: 47200,
      combo30u: 45200,
    },
  },
  {
    id: 6,
    name: "BLANCO 91,5 X 75MTS 60GRS",
    category: "Papel blanco",
    description: "Papel blanco estándar para tizado técnico.",
    price: 18700,
    image: papelBlanco2,
    combos: {
      combo5u: 18700,
      combo15u: 17950,
      combo30u: 17200,
    },
  },
  {
    id: 7,
    name: "BLANCO 1,07 X 75MTS 60GRS",
    category: "Papel blanco",
    description: "Mayor ancho para trazos cómodos y precisos.",
    price: 21400,
    image: papelBlanco2,
    combos: {
      combo5u: 21400,
      combo15u: 20500,
      combo30u: 19600,
    },
  },
  {
    id: 8,
    name: "BLANCO 1,6 X 200MTS 60GRS",
    category: "Papel blanco",
    description: "Rollo blanco profesional para producción continua.",
    price: 72750,
    image: papelBlanco2,
    combos: {
      combo5u: 72750,
      combo15u: 69750,
      combo30u: 66750,
    },
  },
  {
    id: 9,
    name: "BLANCO 1,8 X 200MTS 60GRS",
    category: "Papel blanco",
    description: "Ancho extra para grandes diseños.",
    price: 81550,
    image: papelBlanco2,
    combos: {
      combo5u: 81550,
      combo15u: 78200,
      combo30u: 74850,
    },
  },
  {
    id: 10,
    name: "BLANCO 1,85 X 200MTS 60GRS",
    category: "Papel blanco",
    description: "La mayor cobertura para impresiones industriales.",
    price: 83700,
    image: papelBlanco2,
    combos: {
      combo5u: 83700,
      combo15u: 80200,
      combo30u: 76800,
    },
  },
];

export const plotters = {
  inyeccion: [
    {
      id: 1,
      nombre: "Inject Plotter 190cm HP45",
      image: injectplotterhp45,
      precio_pre_venta: 2865,
      precio_de_llegada: 3800,
      descripcion:
        "Plotter de inyección de tinta de 190cm con tecnología HP45 para tizado de patrones de ropa. Imprime en ambos sentidos (1m/min) . Ideal para talleres con alta demanda de producción.",
    },
    {
      id: 2,
      nombre: "Inject Plotter 190cm EPSON",
      image: injectplotterepson,
      precio_pre_venta: 3008,
      precio_de_llegada: 3900,
      descripcion:
        "Plotter profesional de 190cm con cabezales Epson RECARGABLES para tizado textil. Ofrece impresión bidireccional (1m/min). Perfecto para patrones en confección de ropa.",
    },
    {
      id: 3,
      nombre: "Inject Plotter 200cm HP45",
      image: injectplotterhp45,
      precio_pre_venta: 3294,
      /* precio_de_llegada: 4500, */
      precio_de_llegada: 4300,
      descripcion:
        "Plotter de inyección de tinta de 200cm con tecnología HP45 para tizado de patrones de ropa. Imprime en ambos sentidos (1m/min) . Ideal para talleres con alta demanda de producción. Para talleres que trabajan con prendas de gran tamaño.",
    },
    {
      id: 4,
      nombre: "Inject Plotter 200cm EPSON",
      image: injectplotterepson,
      precio_pre_venta: 3485,
      /* precio_de_llegada: 4800, */
      precio_de_llegada: 4500,
      descripcion:
        "Plotter profesional de 190cm con cabezales Epson RECARGABLES para tizado textil. Ofrece impresión bidireccional (1m/min). Perfecto para patrones en confección de ropa. Para talleres que trabajan con prendas de gran tamaño.",
    },
  ],
  corte: [
    {
      id: 5,
      nombre: "Cutting Plotter 100cm",
      image: plotterdecorte1,
      precio_pre_venta: 700,
      precio_de_llegada: 850,
      descripcion:
        "Plotter de corte de 100cm que funciona con lapiceras estándar (no requiere cartuchos). Gran ventaja económica: solo necesita lapiceras comunes para tizado de patrones. Ideal para emprendedores textiles.",
    },
    {
      id: 6,
      nombre: "Cutting Plotter 125cm",
      image: plotterdecorte1,
      precio_pre_venta: 800,
      precio_de_llegada: 1000,
      descripcion:
        "Sistema de corte de 125cm que utiliza lapiceras en lugar de cartuchos, reduciendo costos operativos. Perfecto para talleres que buscan economía sin sacrificar precisión en el tizado de moldes.",
    },
    {
      id: 7,
      nombre: "Cutting Plotter 180cm",
      image: plotterdecorte1,
      precio_pre_venta: 1250,
      precio_de_llegada: 1650,
      descripcion:
        "Único plotter de corte industrial de 180cm que trabaja con lapiceras comunes. No necesita cartuchos, ofreciendo el menor costo por patrón tizado. Solución profesional para grandes telas y papeles de gran tamano.",
    },
  ],
};

/* export const plotters = {
  inyeccion: [
  
    {
      id: 1,
      nombre: "Inject Plotter 190cm HP45",
      image: injectplotterhp45,
      precio_pre_venta: 3000,
      precio_de_llegada: 4000,
      descripcion:
        "Plotter de inyección de tinta de 190cm con tecnología HP45 para tizado de patrones de ropa. Imprime en ambos sentidos (1m/min) . Ideal para talleres con alta demanda de producción.",
    },
    {
      id: 2,
      nombre: "Inject Plotter 190cm EPSON",
      image: injectplotterepson,
      precio_pre_venta: 3150,
      precio_de_llegada: 4100,
      descripcion:
        "Plotter profesional de 190cm con cabezales Epson RECARGABLES para tizado textil. Ofrece impresión bidireccional (1m/min). Perfecto para patrones en confección de ropa.",
    },
    {
      id: 3,
      nombre: "Inject Plotter 200cm HP45",
      image: injectplotterhp45,
      precio_pre_venta: 3450,
      precio_de_llegada: 4500,
      descripcion:
        "Plotter de inyección de tinta de 190cm con tecnología HP45 para tizado de patrones de ropa. Imprime en ambos sentidos (1m/min) . Ideal para talleres con alta demanda de producción. Para talleres que trabajan con prendas de gran tamaño.",
    },
    {
      id: 4,
      nombre: "Inject Plotter 200cm EPSON",
      image: injectplotterepson,
      precio_pre_venta: 3650,
      precio_de_llegada: 4800,
      descripcion:
        "Plotter profesional de 190cm con cabezales Epson RECARGABLES para tizado textil. Ofrece impresión bidireccional (1m/min). Perfecto para patrones en confección de ropa. Para talleres que trabajan con prendas de gran tamaño.",
    },
    ,
  ],
  corte: [
    {
      id: 5,
      nombre: "Cutting Plotter 100cm",
      image: plotterdecorte1,
      precio_pre_venta: 650,
      precio_de_llegada: 850,
      descripcion:
        "Plotter de corte de 100cm que funciona con lapiceras estándar (no requiere cartuchos). Gran ventaja económica: solo necesita lapiceras comunes para tizado de patrones. Ideal para emprendedores textiles.",
    },
    {
      id: 6,
      nombre: "Cutting Plotter 125cm",
      image: plotterdecorte1,
      precio_pre_venta: 800,
      precio_de_llegada: 1000,
      descripcion:
        "Sistema de corte de 125cm que utiliza lapiceras en lugar de cartuchos, reduciendo costos operativos. Perfecto para talleres que buscan economía sin sacrificar precisión en el tizado de moldes.",
    },
    {
      id: 7,
      nombre: "Cutting Plotter 180cm",
      image: plotterdecorte1,
      precio_pre_venta: 1250,
      precio_de_llegada: 1650,
      descripcion:
        "Único plotter de corte industrial de 180cm que trabaja con lapiceras comunes. No necesita cartuchos, ofreciendo el menor costo por patrón tizado. Solución profesional para grandes telas y papeles de gran tamano.",
    },
  ],
}; */

export const faqData = [
  /* {
    category: "Sublimación",
    items: [
      {
        question: "¿Qué impresoras se pueden convertir a sublimación?",
        answer:
          "Principalmente impresoras Epson con cabezal MicroPiezo. Los modelos más comunes son Epson EcoTank (como L3250, L3210, L4260, etc.).",
      },
      {
        question: "¿Qué tipo de papel debo usar para sublimar?",
        answer:
          "Debes usar papel especial para sublimación, diseñado para retener la tinta y transferirla al calor sobre superficies de poliéster o recubiertas.",
      },
      {
        question: "¿Puedo sublimar sobre algodón?",
        answer:
          "No directamente. El algodón no retiene la tinta de sublimación. Puedes usar vinilo sublimable o aplicar una base de poliéster sobre la prenda.",
      },
    ],
  }, */
  {
    category: "Plotter de Corte",
    items: [
      {
        question: "¿Qué materiales puedo tizar y cortar con el plotter?",
        answer:
          "Puedes tizar materiales papeles de hastas 130grs y cortar vinilo textil, vinilo adhesivo, papel adhesivo, stencil y materiales delgados como foil o transfer imprimible.",
      },
      {
        question: "¿Necesito una PC para usar el plotter?",
        answer:
          "Sí, necesitas un software como Audaces, Optitex, Silhouette Studio o Cricut Design Space instalado en tu PC o laptop para enviar los cortes al plotter.",
      },
      /* {
        question: "¿Se puede usar con celular o tablet?",
        answer:
          "Algunos modelos permiten conexión Bluetooth con apps móviles, pero se recomienda usar PC para un control más preciso.",
      }, */
    ],
  },
];
