import { motion } from "framer-motion";
import plotter2 from "../assets/plotter2.jpg";
import React, { useState } from "react";
import avatarLuisPatty from "../assets/avatarLuisPattyJpg.jpg";
import llegoIngeJPG from "../assets/llegoIngepng.png";

const HeroSection = ({ id, dolarOficial }) => {
  const phoneNumber = "5491162020911";
  const defaultMessage = "Hola, me gustaría obtener más información.";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    defaultMessage
  )}`;
  const API_URL = "http://localhost:5000/api/products";

  const [form, setForm] = useState({ name: "", description: "", price: "" });
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState(""); // estado para mostrar mensaje de éxito/error

  return (
    <>
      <div id={id} className="flex flex-col items-center mt-6 mb-0 lg:mt-10">
        {/* Mostrar dólar oficial con animación circular */}
        {dolarOficial && (
          <motion.div
            className="mt-6 text-center"
            animate={{
              x: [0, 20, 0, -20, 0],
              y: [0, -10, 0, 10, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <p className="text-lg sm:text-xl font-semibold text-gray-800">
              💵 Cotización dólar oficial{" "}
              <span className="text-gray-600">(Banco Nación)</span>:
              <span className="ml-2 text-blue-600 text-2xl">
                ${dolarOficial}
              </span>
            </p>
          </motion.div>
        )}
        <div className="bg-gradient-to-b from-blue-50 to-white py-2 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="md:w-1/2">
                <div className="items-center justify-between">
                  <img
                    className="w-full"
                    src={llegoIngeJPG}
                    alt="Plotter industrial en funcionamiento"
                  />
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                  Soluciones profesionales para{" "}
                  <span className="text-blue-600">patronaje digital</span>
                </h1>

                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Equipos y materiales de alta precisión para diseñadores y
                  fabricantes de moda. Maximiza la eficiencia en tu producción
                  con nuestros plotters industriales y papel técnico
                  especializado para tizado.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-start">
                  <button className="border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-3 px-6 rounded-lg transition duration-300">
                    <a href={whatsappUrl}>Solicitar Asesoría Técnica</a>
                  </button>
                </div>

                <div className="mt-8 flex items-center space-x-4">
                  <div className="flex -space-x-2">
                    {/* Iconos de clientes o marcas */}
                  </div>
                </div>
              </div>

              {/* Imagen destacada */}
              <div className="md:w-1/2 relative">
                <img
                  className="w-full rounded-xl shadow-2xl border border-gray-200"
                  src={plotter2}
                  alt="Plotter industrial en funcionamiento"
                />
              </div>
            </div>

            {/* Logos de marcas o certificaciones */}
            <div className="mt-20">
              <h3 className="text-center text-gray-500 text-sm font-medium mb-6">
                TRABAJAMOS CON LAS MEJORES MARCAS
              </h3>
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
                <img
                  className="h-8 opacity-70 hover:opacity-100 transition"
                  src={avatarLuisPatty}
                  alt="Marca 1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HeroSection;
