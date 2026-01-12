/* import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import ProductSection from "./components/FeatureSection";
import Workflow from "./components/Workflow";
import AboutMeSection from "./components/AboutMeSection";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import CartPage from "./components/CartPage";
import ComunidadPage from "./components/ComunidadPage";
import FAQ from "./components/Faq";

const App = () => {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    const uniqueItem = { ...product, cartItemId: crypto.randomUUID() };
    setCart([...cart, uniqueItem]);
  };

  const removeFromCart = (cartItemId) => {
    setCart(cart.filter((item) => item.cartItemId !== cartItemId));
  };

  return (
    <Router basename="/LucfraIng">
      <Navbar />
      <div className="max-w-7xl mx-auto pt-0 px-0">
        <WhatsAppButton />

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
        </Routes>

        <Footer id="contacto" />
      </div>
    </Router>
  );
};

export default App;
 */

import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react";
import { HelmetProvider } from "react-helmet-async";
import AppContent from "./AppContent";
// import RespondioChat from "./components/RespondioChat"; // Temporalmente desactivado - necesita cId válido
import ChatAudacesWidget from "./components/ChatAudacesWidget";
import ChatVendedor from "./components/ChatVendedor";
import { AuthProvider } from "./contexts/AuthContext";



// Componente interno para acceder a useLocation
const AppWithRouter = ({ cart, addToCart, removeFromCart }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isLoginRoute = location.pathname === '/login';

  return (
    <>
      <AppContent
        cart={cart}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
      />
      {/* Renderizar chatbot según la ruta */}
      {!isLoginRoute && (isAdminRoute ? <ChatAudacesWidget /> : <ChatVendedor />)}
      {/* <RespondioChat /> */} {/* Temporalmente desactivado - necesita cId válido */}
    </>
  );
};

const App = () => {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    const uniqueItem = { ...product, cartItemId: crypto.randomUUID() };
    setCart([...cart, uniqueItem]);
  };

  const removeFromCart = (cartItemId) => {
    setCart((cart) => cart.filter((item) => item.cartItemId !== cartItemId));
  };

  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <AppWithRouter
            cart={cart}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
          />
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
};

export default App;
