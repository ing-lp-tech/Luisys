import { siteConfigService } from './src/services/siteConfigService.js';

const ORIGINAL_HTML = `
<div class="space-y-4">
  <h3 class="text-2xl font-semibold">Ingeniero Electrónico</h3>
  <p class="text-lg">
    Soy ingeniero electrónico graduado en la UNLaM, con una base académica sólida que me permitió unir la teoría con la práctica. Desde el inicio de mi carrera descubrí que mi verdadera pasión es aplicar el conocimiento técnico a proyectos que generen impacto real.
  </p>
</div>
<div class="space-y-4">
  <h3 class="text-2xl font-semibold">Experiencia en máquinas y procesos</h3>
  <p class="text-lg">
    A lo largo de mi recorrido profesional adquirí experiencia trabajando con diferentes tipos de máquinas, lo que me permitió entender a fondo los procesos productivos y las necesidades del sector industrial y textil.
  </p>
</div>
<div class="space-y-4">
  <h3 class="text-2xl font-semibold">Fabricando con pasión</h3>
  <p class="text-lg">
    También tengo experiencia en la fabricación de ropa, donde pude aplicar la disciplina técnica de la ingeniería para optimizar la producción, innovar en los procesos y garantizar la calidad en cada detalle.
  </p>
</div>
<div class="space-y-4">
  <h3 class="text-2xl font-semibold">Conectando tecnología y oportunidades</h3>
  <p class="text-lg">
    Hoy aplico mis conocimientos de ingeniería y mi experiencia en el rubro para importar productos como plotters y otros equipos desde China, acercando tecnología accesible y confiable a quienes lo necesitan. Mi visión es clara: unir conocimiento, experiencia y herramientas para ofrecer soluciones prácticas y reales.
  </p>
</div>`;

async function restore() {
    console.log("Restaurando contenido original...");
    await siteConfigService.updateConfig('about_content', ORIGINAL_HTML);
    console.log("¡Contenido restaurado!");
}

restore();
