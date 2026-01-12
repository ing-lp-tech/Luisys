import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Supabase (usando SECRET KEY para operaciones admin)
const SUPABASE_URL = 'https://uwtqrujdvpjrlllmffif.supabase.co';
const SUPABASE_SECRET_KEY = 'sb_secret_dEzZ2Qt7H_qIG-ZrsEm1mA_Gmfo3Q_Y';

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

// Datos de productos (copiados de index.jsx)
const productosData = {
    papel: [
        {
            nombre: "MARRÓN 91,5 X 75MTS 60GRS",
            categoria: "Papel marrón",
            tipo: "papel",
            descripcion: "Papel marrón para tizado, ideal para patrones de confección.",
            precio_usd: 12000 / 1490, // Convertir a USD aprox
            imagen_local: "papelMadera1.jpg",
            combos: { combo5u: 12000, combo15u: 11500, combo30u: 11000 }
        },
        {
            nombre: "MARRÓN 1,07 X 75MTS 60GRS",
            categoria: "Papel marrón",
            tipo: "papel",
            descripcion: "Papel marrón de mayor ancho para trazos amplios.",
            precio_usd: 13950 / 1490,
            imagen_local: "papelMadera1.jpg",
            combos: { combo5u: 13950, combo15u: 13400, combo30u: 12800 }
        },
        {
            nombre: "MARRÓN 1,6 X 200MTS 60GRS",
            categoria: "Papel marrón",
            tipo: "papel",
            descripcion: "Rollo largo y ancho para producción industrial.",
            precio_usd: 42900 / 1490,
            imagen_local: "papelMadera1.jpg",
            combos: { combo5u: 42900, combo15u: 41100, combo30u: 39400 }
        },
        {
            nombre: "MARRÓN 1,8 X 200MTS 60GRS",
            categoria: "Papel marrón",
            tipo: "papel",
            descripcion: "Ideal para producción a gran escala.",
            precio_usd: 48000 / 1490,
            imagen_local: "papelMadera1.jpg",
            combos: { combo5u: 48000, combo15u: 46000, combo30u: 44100 }
        },
        {
            nombre: "MARRÓN 1,85 X 200MTS 60GRS",
            categoria: "Papel marrón",
            tipo: "papel",
            descripcion: "Máximo ancho para cortes amplios y largos.",
            precio_usd: 49250 / 1490,
            imagen_local: "papelMadera1.jpg",
            combos: { combo5u: 49250, combo15u: 47200, combo30u: 45200 }
        },
        {
            nombre: "BLANCO 91,5 X 75MTS 60GRS",
            categoria: "Papel blanco",
            tipo: "papel",
            descripcion: "Papel blanco estándar para tizado técnico.",
            precio_usd: 18700 / 1490,
            imagen_local: "papelBlanco2.jpg",
            combos: { combo5u: 18700, combo15u: 17950, combo30u: 17200 }
        },
        {
            nombre: "BLANCO 1,07 X 75MTS 60GRS",
            categoria: "Papel blanco",
            tipo: "papel",
            descripcion: "Mayor ancho para trazos cómodos y precisos.",
            precio_usd: 21400 / 1490,
            imagen_local: "papelBlanco2.jpg",
            combos: { combo5u: 21400, combo15u: 20500, combo30u: 19600 }
        },
        {
            nombre: "BLANCO 1,6 X 200MTS 60GRS",
            categoria: "Papel blanco",
            tipo: "papel",
            descripcion: "Rollo blanco profesional para producción continua.",
            precio_usd: 72750 / 1490,
            imagen_local: "papelBlanco2.jpg",
            combos: { combo5u: 72750, combo15u: 69750, combo30u: 66750 }
        },
        {
            nombre: "BLANCO 1,8 X 200MTS 60GRS",
            categoria: "Papel blanco",
            tipo: "papel",
            descripcion: "Ancho extra para grandes diseños.",
            precio_usd: 81550 / 1490,
            imagen_local: "papelBlanco2.jpg",
            combos: { combo5u: 81550, combo15u: 78200, combo30u: 74850 }
        },
        {
            nombre: "BLANCO 1,85 X 200MTS 60GRS",
            categoria: "Papel blanco",
            tipo: "papel",
            descripcion: "La mayor cobertura para impresiones industriales.",
            precio_usd: 83700 / 1490,
            imagen_local: "papelBlanco2.jpg",
            combos: { combo5u: 83700, combo15u: 80200, combo30u: 76800 }
        }
    ],
    plotters: [
        // Inyección
        {
            nombre: "Inject Plotter 190cm HP45",
            categoria: "Plotters inyección",
            tipo: "plotter",
            descripcion: "Plotter de inyección de tinta de 190cm con tecnología HP45 para tizado de patrones de ropa. Imprime en ambos sentidos (1m/min). Ideal para talleres con alta demanda de producción.",
            precio_usd: 3800,
            precio_preventa_usd: 2865,
            imagen_local: "injectplotterhp45.jpg",
            stock_actual: 0,
            destacado: true
        },
        {
            nombre: "Inject Plotter 190cm EPSON",
            categoria: "Plotters inyección",
            tipo: "plotter",
            descripcion: "Plotter profesional de 190cm con cabezales Epson RECARGABLES para tizado textil. Ofrece impresión bidireccional (1m/min). Perfecto para patrones en confección de ropa.",
            precio_usd: 3900,
            precio_preventa_usd: 3008,
            imagen_local: "injectplotterepson.jpg",
            stock_actual: 0,
            destacado: true
        },
        {
            nombre: "Inject Plotter 200cm HP45",
            categoria: "Plotters inyección",
            tipo: "plotter",
            descripcion: "Plotter de inyección de tinta de 200cm con tecnología HP45 para tizado de patrones de ropa. Imprime en ambos sentidos (1m/min). Ideal para talleres con alta demanda de producción. Para talleres que trabajan con prendas de gran tamaño.",
            precio_usd: 4300,
            precio_preventa_usd: 3294,
            imagen_local: "injectplotterhp45.jpg",
            stock_actual: 0
        },
        {
            nombre: "Inject Plotter 200cm EPSON",
            categoria: "Plotters inyección",
            tipo: "plotter",
            descripcion: "Plotter profesional de 200cm con cabezales Epson RECARGABLES para tizado textil. Ofrece impresión bidireccional (1m/min). Perfecto para patrones en confección de ropa. Para talleres que trabajan con prendas de gran tamaño.",
            precio_usd: 4500,
            precio_preventa_usd: 3485,
            imagen_local: "injectplotterepson.jpg",
            stock_actual: 0
        },
        // Corte
        {
            nombre: "Cutting Plotter 100cm",
            categoria: "Plotters corte",
            tipo: "plotter",
            descripcion: "Plotter de corte de 100cm que funciona con lapiceras estándar (no requiere cartuchos). Gran ventaja económica: solo necesita lapiceras comunes para tizado de patrones. Ideal para emprendedores textiles.",
            precio_usd: 850,
            precio_preventa_usd: 700,
            imagen_local: "plotterdecorte1.jpg",
            stock_actual: 0
        },
        {
            nombre: "Cutting Plotter 125cm",
            categoria: "Plotters corte",
            tipo: "plotter",
            descripcion: "Sistema de corte de 125cm que utiliza lapiceras en lugar de cartuchos, reduciendo costos operativos. Perfecto para talleres que buscan economía sin sacrificar precisión en el tizado de moldes.",
            precio_usd: 1000,
            precio_preventa_usd: 800,
            imagen_local: "plotterdecorte1.jpg",
            stock_actual: 0
        },
        {
            nombre: "Cutting Plotter 180cm",
            categoria: "Plotters corte",
            tipo: "plotter",
            descripcion: "Único plotter de corte industrial de 180cm que trabaja con lapiceras comunes. No necesita cartuchos, ofreciendo el menor costo por patrón tizado. Solución profesional para grandes telas y papeles de gran tamaño.",
            precio_usd: 1650,
            precio_preventa_usd: 1250,
            imagen_local: "plotterdecorte1.jpg",
            stock_actual: 0,
            destacado: true
        }
    ],
    computadoras: [
        {
            nombre: "PC Tizado Digital – AMD Athlon 3000G",
            categoria: "Computadoras",
            tipo: "computadora",
            descripcion: "PC optimizada para plotters y software de tizado textil.",
            precio_usd: 500000 / 1490,
            imagen_local: "pc_500mil.jpg",
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
                garantia: "1 año directo"
            },
            combos: {
                basico: 500000,
                conMonitor: 680000
            }
        }
    ],
    camaras: [
        {
            nombre: "KIT 4 Cámaras Dahua + DVR 4CH",
            categoria: "Seguridad",
            tipo: "camara",
            descripcion: "Kit de videovigilancia + instalación completa con DVR Dahua de 4 canales y 4 cámaras bullet B1A21P. Incluye balunes, conectores, splitter, cable UTP de 60mts y fuente de alimentación.",
            precio_usd: 185000 / 1490,
            imagen_local: "kit4cam.jpg",
            specs: {
                dvr: "DVR 4CH XVR1B04-I",
                cameras: "4 Cámaras Dahua Bullet B1A21P",
                baluns: "4 balunes x 2u",
                plugs: "4 plug macho a bornera + 4 plug hembra a bornera",
                splitter: "Splitter pulpo de alimentación 1 a 4",
                cable: "60mts cable UTP 2 pares CAT5e exterior",
                power: "Fuente 3A enchufable"
            }
        },
        {
            nombre: "KIT 8 Cámaras Dahua + DVR 8CH",
            categoria: "Seguridad",
            tipo: "camara",
            descripcion: "Kit de videovigilancia + instalación completa con DVR Dahua de 8 canales y 8 cámaras bullet B1A21P. Incluye balunes, conectores, splitter, cable UTP de 120mts y fuente de alimentación.",
            precio_usd: 320000 / 1490,
            imagen_local: "kit8cam.jpg",
            specs: {
                dvr: "DVR 8CH XVR1B08-I",
                cameras: "8 Cámaras Dahua Bullet B1A21P",
                baluns: "8 balunes x 2u",
                plugs: "8 plug macho a bornera + 8 plug hembra a bornera",
                splitter: "Splitter pulpo de alimentación 1 a 8",
                cable: "120mts cable UTP 2 pares CAT5e exterior",
                power: "Fuente 10A metálica"
            }
        },
        {
            nombre: "IMOU RANGER 2 A22EP-G",
            categoria: "Seguridad",
            tipo: "camara",
            descripcion: "Cámara Wi-Fi interior con cobertura de 360°. Compresión H.265, altavoz, micrófono y sirena incorporados. Incluye ranura para tarjeta micro SD, detección de movimiento, detección humano y alarma de sonido.",
            precio_usd: 75000 / 1490,
            imagen_local: "imouRange.jpg",
            specs: {
                conexion: "Wi-Fi",
                cobertura: "360°",
                compresion: "H.265",
                audio: "Altavoz, micrófono, sirena incorporado",
                almacenamiento: "Ranura micro SD",
                funciones: "Detección de movimiento, detección humano, alarma de sonido"
            }
        },
        {
            nombre: "IMOU CRUISER SE+ K7CP-3H1WE",
            categoria: "Seguridad",
            tipo: "camara",
            descripcion: "Cámara Wi-Fi exterior plástica con compresión H.265, comunicación bidireccional y ranura micro SD. Incluye detección de movimiento, detección humano, disuasión activa y certificación IP66.",
            precio_usd: 120000 / 1490,
            imagen_local: "imouCruise.jpg",
            specs: {
                material: "Plástica",
                compresion: "H.265",
                conexion: "Wi-Fi",
                audio: "Comunicación bidireccional",
                almacenamiento: "Ranura micro SD",
                funciones: "Detección de movimiento, detección humano, disuasión activa",
                proteccion: "IP66"
            }
        }
    ]
};

async function uploadImage(localPath) {
    const filePath = path.join(__dirname, '..', 'src', 'assets', localPath);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Imagen no encontrada: ${localPath}`);
        return null;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileName = `${Date.now()}_${localPath}`;

    const { data, error } = await supabase.storage
        .from('productos-imagenes')
        .upload(fileName, fileBuffer, {
            contentType: 'image/jpeg',
            upsert: false
        });

    if (error) {
        console.error(`❌ Error subiendo ${localPath}:`, error.message);
        return null;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('productos-imagenes')
        .getPublicUrl(fileName);

    console.log(`✅ Subida: ${localPath} → ${publicUrl}`);
    return publicUrl;
}

async function migrateProducts() {
    console.log('\n🚀 Iniciando migración de productos a Supabase...\n');

    const imageCache = {};

    // Subir imágenes primero
    console.log('📸 Paso 1: Subiendo imágenes...\n');
    const uniqueImages = new Set();

    Object.values(productosData).flat().forEach(p => {
        if (p.imagen_local) uniqueImages.add(p.imagen_local);
    });

    for (const imageName of uniqueImages) {
        const url = await uploadImage(imageName);
        if (url) imageCache[imageName] = url;
    }

    console.log(`\n✅ ${Object.keys(imageCache).length} imágenes subidas\n`);

    // Insertar productos
    console.log('📦 Paso 2: Insertando productos...\n');
    let insertados = 0;

    for (const [tipo, productos] of Object.entries(productosData)) {
        for (const producto of productos) {
            const { imagen_local, ...productoData } = producto;

            const prodFinal = {
                ...productoData,
                imagen_url: imageCache[imagen_local] || null,
                activo: true,
                specs: producto.specs || {},
                combos: producto.combos || {}
            };

            const { error } = await supabase
                .from('productos')
                .insert([prodFinal]);

            if (error) {
                console.error(`❌ Error insertando ${producto.nombre}:`, error.message);
            } else {
                console.log(`✅ Insertado: ${producto.nombre}`);
                insertados++;
            }
        }
    }

    console.log(`\n🎉 Migración completada: ${insertados} productos insertados\n`);
}

// Ejecutar migración
migrateProducts().catch(console.error);
