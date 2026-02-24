import { useEffect, useState } from "react";
import { products, plotters, pcs, kitCameras, imouCams } from "../constants";
import { ShoppingCart, Filter, X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import CartDrawer from "./CartDrawer";
import ProductCardSupabase from "./ProductCardSupabase"; // Imporar componente


// Componente Modal para visualización ampliada
const ProductModal = ({
  product,
  category,
  dolarOficial,
  onClose,
  addToCart,
}) => {
  if (!product) return null;

  // Función para manejar el añadido al carrito desde el modal
  const handleAddToCart = (item, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    addToCart(item);
  };

  // Helper para obtener la imagen correcta o array de galeria
  const getProductImage = (prod) => prod.image || prod.imagen_url || "https://via.placeholder.com/300x200?text=Sin+Imagen";

  // Estado para el carrusel
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Determinar si hay galería válida
  const hasGallery = product.galeria && Array.isArray(product.galeria) && product.galeria.length > 0;

  // Array final de imágenes a mostrar
  const displayImages = hasGallery
    ? product.galeria
    : [getProductImage(product)]; // Fallback a imagen única si no hay galería

  const handleNextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  // Reiniciar índice al cambiar producto
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [product]);

  // Función para renderizar el contenido específico según la categoría
  const renderProductDetails = () => {
    switch (category) {
      case "plotters":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-indigo-900/30 rounded-lg">
              <div>
                <p className="font-semibold">Pre-venta (USD):</p>
                <p>${product.precio_pre_venta.toLocaleString()}</p>
                <p className="text-sm text-gray-600">
                  Pesos: $
                  {dolarOficial
                    ? (product.precio_pre_venta * dolarOficial).toLocaleString()
                    : "Cargando..."}
                </p>
              </div>
              <button
                onClick={(e) => {
                  handleAddToCart({
                    ...product,
                    id: product.id,
                    quantity: 1,
                    price: product.precio_pre_venta * dolarOficial,
                    name: product.nombre || product.name,
                    image: getProductImage(product)
                  }, e);
                  onClose();
                }}
                className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition"
              >
                Añadir al carrito
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-emerald-900/30 rounded-lg">
              <div>
                <p className="font-semibold">Stock actual (USD):</p>
                <p>${product.precio_de_llegada.toLocaleString()}</p>
                <p className="text-sm text-gray-600">
                  Pesos: $
                  {dolarOficial
                    ? (
                      product.precio_de_llegada * dolarOficial
                    ).toLocaleString()
                    : "Cargando..."}
                </p>
              </div>
              <button
                onClick={(e) => {
                  handleAddToCart({
                    ...product,
                    id: product.id,
                    quantity: 1,
                    price: product.precio_de_llegada * dolarOficial,
                    name: product.nombre || product.name,
                    image: getProductImage(product)
                  }, e);
                  onClose();
                }}
                className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition"
              >
                Añadir al carrito
              </button>
            </div>
          </div>
        );

      case "papers":
        return (
          <div className="space-y-3">
            {Object.entries(product.combos).map(([combo, price]) => (
              <div
                key={combo}
                className="flex justify-between items-center p-3 bg-blue-50 rounded-lg"
              >
                <div>
                  <p className="font-semibold capitalize">
                    {combo.replace(/([A-Z])/g, " $1")}:
                  </p>
                  <p>${price.toLocaleString()}</p>
                </div>
                <button
                  onClick={(e) => {
                    const quantity = parseInt(
                      combo.replace("combo", "").replace("u", "")
                    );
                    handleAddToCart({
                      ...product,
                      id: product.id,
                      quantity,
                      price,
                      name: product.name || product.nombre,
                      image: getProductImage(product)
                    }, e);
                    onClose();
                  }}
                  className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition"
                >
                  Añadir al carrito
                </button>
              </div>
            ))}
          </div>
        );

      case "pcs":
        return (
          <div className="space-y-4">
            <div className="text-sm text-gray-700 space-y-2 text-left mb-4">
              <p>
                <strong>Procesador:</strong> {product.specs.procesador}
              </p>
              <p>
                <strong>Gráficos:</strong> {product.specs.graficos}
              </p>
              <p>
                <strong>RAM:</strong> {product.specs.ram}
              </p>
              <p>
                <strong>Almacenamiento:</strong> {product.specs.almacenamiento}
              </p>
              <p>
                <strong>Mother:</strong> {product.specs.mother}
              </p>
              <p>
                <strong>Sistema:</strong> {product.specs.sistema}
              </p>
            </div>

            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-semibold">Combo Básico:</p>
                <p>${product.combos.basico.toLocaleString()}</p>
              </div>
              <button
                onClick={(e) => {
                  handleAddToCart({
                    ...product,
                    id: product.id,
                    quantity: 1,
                    price: product.combos.basico,
                    name: product.name || product.nombre,
                    image: getProductImage(product)
                  }, e);
                  onClose();
                }}
                className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition"
              >
                Añadir al carrito
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-semibold">Con Monitor:</p>
                <p>${product.combos.conMonitor.toLocaleString()}</p>
              </div>
              <button
                onClick={(e) => {
                  handleAddToCart({
                    ...product,
                    id: product.id,
                    quantity: 1,
                    price: product.combos.conMonitor,
                    name: product.name || product.nombre,
                    image: getProductImage(product)
                  }, e);
                  onClose();
                }}
                className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition"
              >
                Añadir al carrito
              </button>
            </div>
          </div>
        );

      case "kitCameras":
        return (
          <div className="space-y-4">
            <div className="text-sm text-gray-700 space-y-2 text-left mb-4">
              <p>
                <strong>DVR:</strong> {product.specs.dvr}
              </p>
              <p>
                <strong>Cámaras:</strong> {product.specs.cameras}
              </p>
              <p>
                <strong>Balunes:</strong> {product.specs.baluns}
              </p>
              <p>
                <strong>Plugs:</strong> {product.specs.plugs}
              </p>
              <p>
                <strong>Splitter:</strong> {product.specs.splitter}
              </p>
              <p>
                <strong>Cable:</strong> {product.specs.cable}
              </p>
              <p>
                <strong>Fuente:</strong> {product.specs.power}
              </p>
            </div>

            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-semibold">Kit:</p>
                <p>
                  $
                  {dolarOficial
                    ? (product.price * dolarOficial).toLocaleString()
                    : "Cargando..."}
                </p>
              </div>
              <button
                onClick={(e) => {
                  handleAddToCart({
                    ...product,
                    id: product.id,
                    quantity: 1,
                    price: product.price * dolarOficial,
                    name: product.name || product.nombre,
                    image: getProductImage(product)
                  }, e);
                  onClose();
                }}
                className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition"
              >
                Añadir al carrito
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-semibold">+ instalación:</p>
                <p>
                  $
                  {dolarOficial
                    ? (product.price * dolarOficial * 1.6).toLocaleString()
                    : "Cargando..."}
                </p>
              </div>
              <button
                onClick={(e) => {
                  handleAddToCart({
                    ...product,
                    id: product.id,
                    quantity: 1,
                    price: product.price * dolarOficial * 1.6,
                    name: product.name || product.nombre,
                    image: getProductImage(product)
                  }, e);
                  onClose();
                }}
                className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition"
              >
                Añadir al carrito
              </button>
            </div>
          </div>
        );

      case "imouCams":
        return (
          <div className="space-y-4">
            <div className="text-sm text-gray-700 space-y-2 text-left mb-4">
              {Object.entries(product.specs).map(([key, value]) => (
                <p key={key}>
                  <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>{" "}
                  {value}
                </p>
              ))}
            </div>

            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-semibold">Unidad:</p>
                <p>
                  $
                  {dolarOficial
                    ? (product.price * dolarOficial).toLocaleString()
                    : "Cargando..."}
                </p>
              </div>
              <button
                onClick={(e) => {
                  handleAddToCart({
                    ...product,
                    id: product.id,
                    quantity: 1,
                    price: product.price * dolarOficial,
                    name: product.name || product.nombre,
                    image: getProductImage(product)
                  }, e);
                  onClose();
                }}
                className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition flex items-center gap-1"
              >
                <ShoppingCart size={16} />
                Añadir al carrito
              </button>
            </div>
          </div>
        );

      default:
        // Caso por defecto para productos genéricos (Supabase)
        return (
          <div className="space-y-4">
            {/* Mostrar specs si existen como objeto plano */}
            {product.specs && typeof product.specs === 'object' && (
              <div className="text-sm text-gray-700 space-y-2 text-left mb-4 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Especificaciones:</h4>
                {Object.entries(product.specs).map(([key, value]) => (
                  <p key={key} className="capitalize">
                    <strong>{key.replace(/_/g, ' ')}:</strong> {String(value)}
                  </p>
                ))}
              </div>
            )}

            {/* Precio USD */}
            {product.precio_usd && (
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-semibold text-blue-900">Precio Regular (USD):</p>
                  <p className="text-xl font-bold">${product.precio_usd.toLocaleString()}</p>
                  {dolarOficial && <p className="text-sm text-gray-600">ARS: ${(product.precio_usd * dolarOficial).toLocaleString()}</p>}
                </div>
                <button
                  onClick={(e) => handleAddToCart({
                    ...product,
                    id: product.id,
                    quantity: 1,
                    price: product.precio_usd * (dolarOficial || 1000),
                    name: product.nombre || product.name,
                    image: getProductImage(product)
                  }, e)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <ShoppingCart size={18} />
                  Añadir
                </button>
              </div>
            )}

            {/* Precio ARS */}
            {product.precio_ars && (
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-semibold text-blue-900">Precio Regular (ARS):</p>
                  <p className="text-xl font-bold">${parseFloat(product.precio_ars).toLocaleString()}</p>
                </div>
                <button
                  onClick={(e) => handleAddToCart({
                    ...product,
                    id: product.id,
                    quantity: 1,
                    price: product.precio_ars,
                    name: product.nombre || product.name,
                    image: getProductImage(product)
                  }, e)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <ShoppingCart size={18} />
                  Añadir
                </button>
              </div>
            )}

            {/* Precio Mayorista USD */}
            {product.precio_mayorista_usd && (
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="font-semibold text-green-900">Mayorista (USD):</p>
                  <p className="text-sm text-gray-600">Min: {product.cantidad_minima_mayorista}u</p>
                  <p className="text-xl font-bold">${product.precio_mayorista_usd.toLocaleString()}</p>
                  {dolarOficial && <p className="text-sm text-gray-600">ARS: ${(product.precio_mayorista_usd * dolarOficial).toLocaleString()}</p>}
                </div>
                <button
                  onClick={(e) => handleAddToCart({
                    ...product,
                    id: product.id,
                    name: `${product.nombre || product.name} (Mayorista)`,
                    quantity: product.cantidad_minima_mayorista,
                    price: product.precio_mayorista_usd * (dolarOficial || 1000),
                    image: getProductImage(product)
                  }, e)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <ShoppingCart size={18} />
                  Añadir Pack
                </button>
              </div>
            )}

            {/* Precio Mayorista ARS */}
            {product.precio_mayorista_ars && (
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="font-semibold text-green-900">Mayorista (ARS):</p>
                  <p className="text-sm text-gray-600">Min: {product.cantidad_minima_mayorista}u</p>
                  <p className="text-xl font-bold">${parseFloat(product.precio_mayorista_ars).toLocaleString()}</p>
                </div>
                <button
                  onClick={(e) => handleAddToCart({
                    ...product,
                    id: product.id,
                    name: `${product.nombre || product.name} (Mayorista)`,
                    quantity: product.cantidad_minima_mayorista,
                    price: product.precio_mayorista_ars,
                    image: getProductImage(product)
                  }, e)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <ShoppingCart size={18} />
                  Añadir Pack
                </button>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0f172a] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-[#0f172a] p-4 border-b dark:border-gray-700/50 flex justify-between items-center">
          <h2 className="text-xl font-bold dark:text-white">
            {product.nombre || product.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/2">
              <div className="h-64 md:h-96 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 relative group flex items-center justify-center">

                {/* Imagen Principal */}
                <img
                  src={displayImages[currentImageIndex]}
                  alt={`${product.nombre || product.name} - Vista ${currentImageIndex + 1}`}
                  className="max-h-full max-w-full object-contain transition-opacity duration-300"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/500x300?text=Imagen+no+disponible";
                  }}
                />

                {/* Controles del Carrusel (Solo si hay más de 1 imagen) */}
                {displayImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight size={24} />
                    </button>

                    {/* Indicadores (dots) */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {displayImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex(idx);
                          }}
                          className={`w-2 h-2 rounded-full transition-all ${currentImageIndex === idx ? "bg-white w-4" : "bg-white/50 hover:bg-white/80"
                            }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Tiras de miniaturas si hay carrusel */}
              {displayImages.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-thin">
                  {displayImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition ${currentImageIndex === idx ? "border-blue-600 ring-2 ring-blue-100" : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="md:w-1/2">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {product.descripcion || product.description}
              </p>

              {renderProductDetails()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductSection = ({ id, cart, addToCart }) => {
  const [dolarOficial, setDolarOficial] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [productosSupabase, setProductosSupabase] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [supabaseError, setSupabaseError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estado para la notificación (Toast)
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Estado para el CartDrawer
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  const showNotification = (productName) => {
    setToastMessage(`¡${productName} añadido al carrito!`);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleAddToCartWrapper = (product, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    addToCart(product);
    showNotification(product.nombre || product.name || "Producto");
    // Abrir el CartDrawer
    setShowCartDrawer(true);
  };

  // Productos hardcodeados como fallback
  const allPlotters = [...plotters.inyeccion, ...plotters.corte];

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

    const fetchProductosSupabase = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('productos')
          .select('*')
          .eq('activo', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setProductosSupabase(data || []);
        setSupabaseError(false);
      } catch (error) {
        console.error('Error cargando productos de Supabase:', error);
        setSupabaseError(true);
        setProductosSupabase([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategorias = async () => {
      try {
        const { data, error } = await supabase
          .from('categorias')
          .select('*')
          .eq('activo', true)
          .order('orden', { ascending: true });

        if (error) throw error;
        setCategorias(data || []);
      } catch (error) {
        console.error('Error cargando categorías:', error);
      }
    };

    fetchDolar();
    fetchProductosSupabase();
    fetchCategorias();
  }, []);

  // Determinar si usamos Supabase o fallback
  const useSupabase = !supabaseError && productosSupabase.length > 0;

  // Función para ordenar productos por el orden de las categorías
  const sortProductsByCategory = (products) => {
    return products.sort((a, b) => {
      const catA = categorias.find(c => c.nombre === a.categoria);
      const catB = categorias.find(c => c.nombre === b.categoria);

      const ordenA = catA ? catA.orden : 999;
      const ordenB = catB ? catB.orden : 999;

      return ordenA - ordenB;
    });
  };

  // Filtrar productos de Supabase por categoría/tipo
  const getFilteredSupabaseProducts = () => {
    if (!useSupabase) return [];

    let filtered;
    if (activeFilter === "all") {
      filtered = [...productosSupabase];
    } else {
      // Mapeo de filtros a categorías de Supabase
      const filterMap = {
        "plotters": ["Plotters inyección", "Plotters corte"],
        "papers": ["Papel marrón", "Papel blanco"],
        "pcs": ["Computadoras"],
        "kitCameras": ["Seguridad"],
        "imouCams": ["Seguridad"]
      };

      const categoriasValidas = filterMap[activeFilter] || [];
      filtered = productosSupabase.filter(p => categoriasValidas.includes(p.categoria));
    }

    // Aplicar ordenamiento por categoría
    return sortProductsByCategory(filtered);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    if (window.innerWidth < 768) {
      setShowFilters(false);
    }
  };

  const handleProductClick = (product, category) => {
    setSelectedProduct(product);
    setSelectedCategory(category);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setSelectedCategory(null);
  };

  return (
    <section id="productos" className="py-6 px-4 md:px-8 bg-gray-50 dark:bg-[#070b14] transition-colors duration-300">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 md:left-auto md:translate-x-0 md:right-5 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl z-[9999] flex items-center gap-3 animate-fade-in-up transition-all">
          <div className="bg-white rounded-full p-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      <div id={id} className="relative mt-4 min-h-[800px]">
        <div className="text-center">
          <span className="bg-blue-600 text-white rounded-full h-6 text-sm font-medium px-2 py-1 uppercase">
            Catálogo
          </span>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl mt-10 lg:mt-20 tracking-wide dark:text-white">
            Nuestros{" "}
            <span className="bg-gradient-to-r from-blue-500 to-blue-800 dark:from-indigo-400 dark:to-purple-500 text-transparent bg-clip-text">
              Productos
            </span>
          </h2>
        </div>

        <Link
          to="/cart"
          className="fixed top-24 right-4 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition flex items-center"
        >
          <ShoppingCart className="h-6 w-6" />
          <span className="ml-1 bg-white text-blue-600 rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">
            {cart.length}
          </span>
        </Link>

        {/* Filtros */}
        <div className="mt-10 w-full max-w-7xl mx-auto">
          <div className="flex overflow-x-auto pb-4 gap-3 px-4 md:justify-center scrollbar-hide -mx-4 md:mx-0 snap-x">
            <button
              onClick={() => handleFilterChange("all")}
              className={`flex-shrink-0 snap-start px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-sm whitespace-nowrap ${activeFilter === "all"
                ? "bg-blue-600 text-white shadow-blue-200"
                : "bg-white dark:bg-[#0f172a] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
            >
              Todos
            </button>
            <button
              onClick={() => handleFilterChange("plotters")}
              className={`flex-shrink-0 snap-start px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-sm whitespace-nowrap ${activeFilter === "plotters"
                ? "bg-blue-600 text-white shadow-blue-200"
                : "bg-white dark:bg-[#0f172a] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
            >
              Plotters
            </button>
            <button
              onClick={() => handleFilterChange("papers")}
              className={`flex-shrink-0 snap-start px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-sm whitespace-nowrap ${activeFilter === "papers"
                ? "bg-blue-600 text-white shadow-blue-200"
                : "bg-white dark:bg-[#0f172a] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
            >
              Papeles
            </button>
            <button
              onClick={() => handleFilterChange("pcs")}
              className={`flex-shrink-0 snap-start px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-sm whitespace-nowrap ${activeFilter === "pcs"
                ? "bg-blue-600 text-white shadow-blue-200"
                : "bg-white dark:bg-[#0f172a] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
            >
              PCs Armadas
            </button>
            <button
              onClick={() => handleFilterChange("kitCameras")}
              className={`flex-shrink-0 snap-start px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-sm whitespace-nowrap ${activeFilter === "kitCameras"
                ? "bg-blue-600 text-white shadow-blue-200"
                : "bg-white dark:bg-[#0f172a] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
            >
              Kits Seguridad
            </button>
            <button
              onClick={() => handleFilterChange("imouCams")}
              className={`flex-shrink-0 snap-start px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-sm whitespace-nowrap ${activeFilter === "imouCams"
                ? "bg-blue-600 text-white shadow-blue-200"
                : "bg-white dark:bg-[#0f172a] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
            >
              Cámaras WiFi
            </button>
          </div>
        </div>

        {/* Modal para vista ampliada */}
        <ProductModal
          product={selectedProduct}
          category={selectedCategory}
          dolarOficial={dolarOficial}
          onClose={handleCloseModal}
          addToCart={handleAddToCartWrapper}
        />

        {/* Mensaje de carga */}
        {loading && (
          <div className="mt-16 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Cargando productos...</p>
          </div>
        )}

        {/* Mensaje de fallback */}
        {!loading && !useSupabase && (
          <div className="mt-8 text-center bg-yellow-50 border border-yellow-200 rounded-lg p-4 mx-4">
            <p className="text-yellow-800">
              ⚠️ Mostrando catálogo de respaldo. Los productos de la base de datos no están disponibles.
            </p>
          </div>
        )}

        {/* SECCIÓN PRINCIPAL DE PRODUCTOS - DESDE SUPABASE */}
        {!loading && useSupabase && (
          <div className="mt-16">
            {activeFilter === "all" ? (
              // Mostrar productos agrupados por categoría
              categorias.map((categoria) => {
                const productosCategoria = productosSupabase.filter(
                  p => p.categoria === categoria.nombre
                );

                if (productosCategoria.length === 0) return null;

                return (
                  <div key={categoria.id} className="mb-16">
                    {/* Título y descripción de la categoría */}
                    <div className="text-center mb-8">
                      <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
                        <span className="border-b-4 border-blue-500 pb-2">
                          {categoria.nombre}
                        </span>
                      </h3>
                      {categoria.descripcion && (
                        <p className="text-gray-600 text-lg max-w-3xl mx-auto px-4 mt-4">
                          {categoria.descripcion}
                        </p>
                      )}
                    </div>

                    {/* Grid de productos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                      {productosCategoria.map((producto) => (
                        <div key={producto.id} className="h-full">
                          <ProductCardSupabase
                            product={producto}
                            dolarOficial={dolarOficial}
                            onAddToCart={handleAddToCartWrapper}
                            onClick={(prod) => handleProductClick(prod, categoria.nombre)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              // Vista filtrada (sin agrupar)
              <div className="text-center">
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8">
                  <span className="border-b-4 border-blue-500 pb-2">
                    {activeFilter === "plotters" ? "Nuestros Plotters" :
                      activeFilter === "papers" ? "Nuestros Papeles" :
                        activeFilter === "pcs" ? "Nuestras PCs" :
                          activeFilter === "kitCameras" ? "Kits de Cámaras" :
                            "Cámaras IMOU"}
                  </span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                  {getFilteredSupabaseProducts().map((producto) => (
                    <div key={producto.id} className="h-full">
                      <ProductCardSupabase
                        product={producto}
                        dolarOficial={dolarOficial}
                        onAddToCart={handleAddToCartWrapper}
                        onClick={(prod) => handleProductClick(prod, "filtered")}
                      />
                    </div>
                  ))}
                </div>

                {getFilteredSupabaseProducts().length === 0 && (
                  <p className="text-gray-500 mt-8">No hay productos disponibles en esta categoría.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== PRODUCTOS HARDCODEADOS - SOLO COMO FALLBACK ===== */}
        {!loading && !useSupabase && (
          <>
            {/* Sección de Plotters - FALLBACK */}
            {(activeFilter === "all" || activeFilter === "plotters") && (
              <div className="mt-16 text-center">
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8">
                  <span className="border-b-4 border-blue-500 pb-2">
                    Nuestros Plotters
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                  {allPlotters.map((plotter) => (
                    <div
                      key={plotter.id}
                      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition cursor-pointer"
                      onClick={() => handleProductClick(plotter, "plotters")}
                    >
                      <div className="h-48 overflow-hidden relative">
                        <img
                          src={plotter.image}
                          alt={plotter.nombre}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://via.placeholder.com/300x200?text=Plotter+Image";
                          }}
                        />
                        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded">
                          <ZoomIn size={16} />
                        </div>
                      </div>

                      <div className="p-6 flex flex-col justify-between h-full">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="text-xl font-bold text-gray-900">
                              {plotter.nombre}
                            </h3>
                            <span
                              className={`${plotter.id <= 4
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                                } text-sm font-semibold px-2.5 py-0.5 rounded`}
                            >
                              {plotter.id <= 4 ? "Inyección" : "Corte"}
                            </span>
                          </div>

                          <p className="mt-2 text-gray-600 line-clamp-2">
                            {plotter.descripcion}
                          </p>

                          <div className="mt-4 text-sm text-gray-700 space-y-2">
                            <div className="flex items-center justify-between">
                              <p>
                                <span className="font-semibold">
                                  Stock actual(usd):
                                </span>{" "}
                                ${plotter.precio_de_llegada.toLocaleString()}
                              </p>
                              <button
                                onClick={(e) => {
                                  handleAddToCartWrapper({
                                    ...plotter,
                                    quantity: 1,
                                    price: plotter.precio_de_llegada * dolarOficial,
                                    name: plotter.nombre,
                                  }, e);
                                }}
                                className="bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700 transition"
                              >
                                Añadir
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Sección de características (siempre visible) */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                ></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">
              Velocidad de impresión
            </h3>
            <p className="text-gray-600">
              Plotters de alta velocidad que reducen tus tiempos de producción
              hasta en un 60% comparado con métodos tradicionales.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                ></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">Papel especializado</h3>
            <p className="text-gray-600">
              Nuestros rollos de papel para tizado ofrecen la resistencia y
              flexibilidad perfecta para el trabajo con patrones.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                ></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">Soporte técnico</h3>
            <p className="text-gray-600">
              Asesoramiento permanente por expertos en patronaje digital.
              Instalación, capacitación y mantenimiento incluido.
            </p>
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={showCartDrawer}
        onClose={() => setShowCartDrawer(false)}
        cart={cart}
      />
    </section>
  );
};

export default ProductSection;
