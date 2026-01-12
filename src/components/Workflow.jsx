import { CheckCircle2 } from "lucide-react";
import comotrabajamos from "../assets/comotrabajamos.jpg";
import { checklistItems } from "../constants";

const Workflow = ({ id }) => {
  return (
    <section id="#como-trabajamos" className="py-8 px-4 md:px-8 bg-gray-50">
      <div id={id} className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              Nuestro <span className="text-[rgb(37,99,235)]">Proceso</span> de
              Trabajo
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Desde tu consulta hasta la entrega de tus insumos para confección,
              te garantizamos:
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-center">
            <div className="lg:w-1/2">
              <img
                src={comotrabajamos}
                alt="Proceso de venta de plotters y papel para confección"
                className="rounded-xl shadow-lg border-2 border-white"
              />
            </div>

            <div className="lg:w-1/2 space-y-6">
              {checklistItems.map((item, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 bg-[rgb(37,99,235)] p-1 rounded-md text-white mr-4">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-base text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}

              <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-[rgb(37,99,235)] mb-2">
                  ¿Por qué elegirnos?
                </h3>
                <p className="text-gray-700 text-sm">
                  Somos especialistas en insumos para patronaje digital.
                  Ofrecemos plotters de alta precisión y papel técnico
                  específico para tizado en confección de ropa, con
                  asesoramiento personalizado para cada taller.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Workflow;
