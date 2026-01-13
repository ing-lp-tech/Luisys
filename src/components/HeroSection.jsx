import { motion } from "framer-motion";
import plotter2 from "../assets/plotter2.jpg";
import React, { useState, useEffect } from "react"; // Importar useEffect
import avatarLuisPatty from "../assets/avatarLuisPattyJpg.jpg";
import llegoIngeJPG from "../assets/llegoIngepng.png";
import { siteConfigService } from "../services/siteConfigService"; // Importar servicio

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

  // Estados para imágenes dinámicas del Hero
  const [heroLogoUrl, setHeroLogoUrl] = useState(llegoIngeJPG);
  const [heroMainImageUrl, setHeroMainImageUrl] = useState(plotter2);

  useEffect(() => {
    const fetchHeroImages = async () => {
      const config = await siteConfigService.getAllConfigs();
      if (config.hero_logo_url) setHeroLogoUrl(config.hero_logo_url);
      if (config.hero_main_image_url) setHeroMainImageUrl(config.hero_main_image_url);
    };
    fetchHeroImages();
  }, []);

  return (
    <>
      <div id={id} className="flex flex-col items-center mt-4 mb-0 lg:mt-10 overflow-hidden w-full">
        {/* Mostrar dólar oficial con animación circular */}
        {dolarOficial && (
          <motion.div
            className="mt-6 text-center px-4"
            animate={{
              x: [0, 10, 0, -10, 0],
              y: [0, -5, 0, 5, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ zIndex: 10 }}
          >
            <p className="text-base sm:text-xl font-semibold text-gray-800 bg-white/50 backdrop-blur-sm p-2 rounded-lg border border-gray-100 shadow-sm inline-block">
              💵 Cotización dólar oficial{" "}
              <span className="text-gray-600 block sm:inline">(Banco Nación)</span>:
              <span className="ml-2 text-blue-600 text-xl sm:text-2xl font-bold">
                ${dolarOficial}
              </span>
            </p>
          </motion.div>
        )}
        <div className="bg-gradient-to-b from-blue-50 to-white py-8 px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-8 md:gap-12">
              <div className="w-full md:w-1/2 text-center md:text-left">
                <div className="items-center justify-between hidden md:block">
                  <img
                    className="w-full max-w-[200px] mb-4"
                    src={heroLogoUrl} // Dinámico
                    alt="Logo Hero"
                  />
                </div>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4 sm:mb-6 leading-tight">
                  Soluciones profesionales para{" "}
                  <span className="text-blue-600">patronaje digital</span>
                </h1>

                <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto md:mx-0">
                  Equipos y materiales de alta precisión para diseñadores y
                  fabricantes de moda. Maximiza la eficiencia en tu producción
                  con nuestros plotters industriales y papel técnico
                  especializado para tizado.
                </p>

                {/* Botones ocultos a pedido del usuario (12/1/2026)
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  ... (código comentado sin cambios)
                </div>
                */}

                <div className="mt-8 flex items-center justify-center md:justify-start space-x-4">
                  <div className="flex -space-x-2">
                    {/* Iconos de clientes o marcas */}
                  </div>
                </div>
              </div>

              {/* Imagen destacada */}
              <div className="w-full md:w-1/2 relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                  <img
                    className="w-full object-cover transform hover:scale-105 transition duration-500"
                    src={heroMainImageUrl} // Dinámico
                    alt="Plotter industrial en funcionamiento"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                {/* Mobile only additional logo if needed */}
                <div className="md:hidden mt-4 flex justify-center">
                  <img
                    className="w-32 object-contain"
                    src={heroLogoUrl} // Dinámico
                    alt="Logo"
                  />
                </div>
              </div>
            </div>

            {/* Logos de marcas o certificaciones */}
            <div className="mt-16 sm:mt-20">
              <h3 className="text-center text-gray-400 text-sm font-bold tracking-widest mb-8 uppercase">
                TRABAJAMOS CON LAS MEJORES MARCAS
              </h3>
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                <img
                  className="h-10 sm:h-12"
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
