/* import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import ProductSection from "./components/FeatureSection";
import Workflow from "./components/Workflow";
import AboutMeSection from "./components/AboutMeSection";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import CartPage from "./components/CartPage";
import ComunidadPage from "./components/ComunidadPage";
import ImportacionPage from "./components/ImportacionPage";
import FAQ from "./components/Faq";
import { useEffect, useState } from "react";

const AppContent = ({ cart, addToCart, removeFromCart }) => {
  const [dolarOficial, setDolarOficial] = useState(null);
  const location = useLocation();
  const isComunidad = location.pathname === "/comunidad";

  useEffect(() => {
    const fetchDolar = async () => {
      try {
        const res = await fetch("https://dolarapi.com/v1/dolares/oficial");
        const data = await res.json();
        setDolarOficial(data.venta);
      } catch (error) {
        console.error("Error al obtener la cotización:", error);
      }
    };

    fetchDolar();
  }, []);

  return (
    <>
      {!isComunidad && <Navbar />}
      <div className="max-w-7xl mx-auto pt-0 px-0">
        {!isComunidad && <WhatsAppButton />}

        <Routes>
          <Route
            path="/"
            element={
              <>
                <HeroSection id="inicio" />
                <ProductSection
                  id="servicios"
                  cart={cart}
                  addToCart={addToCart}
                />
                <Workflow id="como-trabajamos" />
                <FAQ id="preguntasfreceuntes" />
                <AboutMeSection id="sobre-mi" />
              </>
            }
          />
          <Route
            path="/cart"
            element={<CartPage cart={cart} removeFromCart={removeFromCart} />}
          />
          <Route path="/comunidad" element={<ComunidadPage />} />
          <Route path="/importacion" element={<ImportacionPage />} />
        </Routes>
      </div>

      <Footer id="contacto" />
    </>
  );
};

export default AppContent;
 */

import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import ProductSection from "./components/FeatureSection";
import Workflow from "./components/Workflow";
import AboutMeSection from "./components/AboutMeSection";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import CartPage from "./components/CartPage";
import ComunidadPage from "./components/ComunidadPage";
import ImportacionPage from "./components/ImportacionPage";
import FAQ from "./components/Faq";
import SEO from "./components/SEO"; // Import SEO component
import { useEffect, useState } from "react";

const AppContent = ({ cart, addToCart, removeFromCart }) => {
  const [dolarOficial, setDolarOficial] = useState(null);
  const location = useLocation();
  const isComunidad = location.pathname === "/comunidad";

  useEffect(() => {
    const fetchDolar = async () => {
      try {
        const res = await fetch("https://dolarapi.com/v1/dolares/oficial");
        const data = await res.json();
        setDolarOficial(data.venta);
      } catch (error) {
        console.error("Error al obtener la cotización:", error);
      }
    };

    fetchDolar();
  }, []);

  return (
    <>
      {!isComunidad && <Navbar />}
      <div className="max-w-7xl mx-auto pt-0 px-0">
        {!isComunidad && <WhatsAppButton />}

        <Routes>
          <Route
            path="/"
            element={
              <>
                <SEO /> {/* Default SEO for Home */}
                {/* Le pasamos la prop dolarOficial */}
                <HeroSection id="inicio" dolarOficial={dolarOficial} />
                <ProductSection
                  id="servicios"
                  cart={cart}
                  addToCart={addToCart}
                />
                <Workflow id="como-trabajamos" />
                <FAQ id="preguntasfreceuntes" />
                <AboutMeSection id="sobre-mi" />
              </>
            }
          />
          <Route
            path="/cart"
            element={
              <>
                <SEO title="Carrito de Compras" description="Revisa tu pedido de plotters y accesorios." />
                <CartPage cart={cart} removeFromCart={removeFromCart} />
              </>
            }
          />
          <Route
            path="/comunidad"
            element={
              <>
                <SEO title="Comunidad" description="Únete a la comunidad de Ingeniero Emprendedor." />
                <ComunidadPage />
              </>
            }
          />
          <Route
            path="/importacion"
            element={
              <>
                <SEO title="Importación" description="Servicios de importación de maquinaria textil." />
                <ImportacionPage />
              </>
            }
          />
        </Routes>
      </div>

      <Footer id="contacto" />
    </>
  );
};

export default AppContent;
