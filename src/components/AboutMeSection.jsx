import React from "react";
import socios from "../assets/luis.jpg";

const AboutMeSection = () => {
  return (
    <div
      id="sobre-mi"
      className="relative bg-black text-white"
      style={{
        backgroundImage: `url(${socios})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      {/* Contenido superpuesto */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-shadow">
        <div className="space-y-12">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white text-center">
            SOBRE MÍ
          </h2>

          {/* Formación */}
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold">Ingeniero Electrónico</h3>
            <p className="text-lg">
              Soy ingeniero electrónico graduado en la UNLaM, con una base
              académica sólida que me permitió unir la teoría con la práctica.
              Desde el inicio de mi carrera descubrí que mi verdadera pasión es
              aplicar el conocimiento técnico a proyectos que generen impacto
              real.
            </p>
          </div>

          {/* Experiencia en máquinas */}
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold">
              Experiencia en máquinas y procesos
            </h3>
            <p className="text-lg">
              A lo largo de mi recorrido profesional adquirí experiencia
              trabajando con diferentes tipos de máquinas, lo que me permitió
              entender a fondo los procesos productivos y las necesidades del
              sector industrial y textil.
            </p>
          </div>

          {/* Fabricación de ropa */}
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold">Fabricando con pasión</h3>
            <p className="text-lg">
              También tengo experiencia en la fabricación de ropa, donde pude
              aplicar la disciplina técnica de la ingeniería para optimizar la
              producción, innovar en los procesos y garantizar la calidad en
              cada detalle.
            </p>
          </div>

          {/* Importaciones y visión */}
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold">
              Conectando tecnología y oportunidades
            </h3>
            <p className="text-lg">
              Hoy aplico mis conocimientos de ingeniería y mi experiencia en el
              rubro para importar productos como plotters y otros equipos desde
              China, acercando tecnología accesible y confiable a quienes lo
              necesitan. Mi visión es clara: unir conocimiento, experiencia y
              herramientas para ofrecer soluciones prácticas y reales.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutMeSection;
