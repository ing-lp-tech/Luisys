import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uwtqrujdvpjrlllmffif.supabase.co';
const SUPABASE_SECRET_KEY = 'sb_secret_dEzZ2Qt7H_qIG-ZrsEm1mA_Gmfo3Q_Y';

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

async function checkMigration() {
    console.log('\n🔍 Verificando migración...\n');

    // Contar productos por categoría
    const { data: productos, error } = await supabase
        .from('productos')
        .select('id, nombre, categoria, tipo, imagen_url');

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    console.log(`✅ Total productos en BD: ${productos.length}\n`);

    // Agrupar por categoría
    const porCategoria = productos.reduce((acc, p) => {
        acc[p.categoria] = (acc[p.categoria] || 0) + 1;
        return acc;
    }, {});

    console.log('📊 Por categoría:');
    Object.entries(porCategoria).forEach(([cat, count]) => {
        console.log(`  - ${cat}: ${count}`);
    });

    console.log('\n📷 Imágenes:');
    const conImagen = productos.filter(p => p.imagen_url).length;
    console.log(`  - Con imagen: ${conImagen}`);
    console.log(`  - Sin imagen: ${productos.length - conImagen}\n`);
}

checkMigration().catch(console.error);
