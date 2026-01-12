import { useEffect, useState } from "react";
import { products, plotters, pcs, kitCameras, imouCams } from "../constants";
import { ShoppingCart, Filter, X, ZoomIn } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

// Componente Modal para visualización ampliada
const ProductModal = ({
  product,
  category,
  dolarOficial,
  onClose,
  addToCart,
}) => {
  if (!product) return null;

  // Función para renderizar el contenido específico según la categoría
  const renderProductDetails = () => {
    switch (category) {
      case "plotters":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
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
                onClick={() => {
                  addToCart({
                    ...product,
                    quantity: 1,
                    price: product.precio_pre_venta * dolarOficial,
                    name: product.nombre,
                  });
                  onClose();
                }}
                className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition"
              >
                Añadir al carrito
              </button>
            </div>

            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
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
                onClick={() => {
                  addToCart({
                    ...product,
                    quantity: 1,
                    price: product.precio_de_llegada * dolarOficial,
                    name: product.nombre,
                  });
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
                  onClick={() => {
                    const quantity = parseInt(
                      combo.replace("combo", "").replace("u", "")
                    );
                    addToCart({
                      ...product,
                      quantity,
                      price,
                    });
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
                onClick={() => {
                  addToCart({
                    ...product,
                    quantity: 1,
                    price: product.combos.basico,
                  });
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
                onClick={() => {
                  addToCart({
                    ...product,
                    quantity: 1,
                    price: product.combos.conMonitor,
                  });
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
                onClick={() => {
                  addToCart({
                    ...product,
                    quantity: 1,
                    price: product.price * dolarOficial,
                    name: product.name,
                  });
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
                onClick={() => {
                  addToCart({
                    ...product,
                    quantity: 1,
                    price: product.price * dolarOficial * 1.6,
                    name: product.name,
                  });
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
                onClick={() => {
                  addToCart({
                    ...product,
                    quantity: 1,
                    price: product.price * dolarOficial,
                    name: product.name,
                  });
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
                  onClick={() => addToCart({ ...product, quantity: 1, price: product.precio_usd * (dolarOficial || 1000) })}
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
                  onClick={() => addToCart({ ...product, quantity: 1, price: product.precio_ars })}
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
                  onClick={() => addToCart({
                    ...product,
                    name: `${product.nombre} (Mayorista)`,
                    quantity: product.cantidad_minima_mayorista,
                    price: product.precio_mayorista_usd * (dolarOficial || 1000)
                  })}
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
                  onClick={() => addToCart({
                    ...product,
                    name: `${product.nombre} (Mayorista)`,
                    quantity: product.cantidad_minima_mayorista,
                    price: product.precio_mayorista_ars
                  })}
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
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {product.nombre || product.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/2">
              <div className="h-64 md:h-96 overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
                <img
                  src={product.image || product.imagen_url}
                  alt={product.nombre || product.name}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://via.placeholder.com/500x300?text=Imagen+no+disponible";
                  }}
                />
              </div>
            </div>

            <div className="md:w-1/2">
              <p className="text-gray-600 mb-4">
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
    <section id="productos" className="py-6 px-4 md:px-8 bg-gray-50">
      <div id={id} className="relative mt-4 min-h-[800px]">
        <div className="text-center">
          <span className="bg-blue-600 text-white rounded-full h-6 text-sm font-medium px-2 py-1 uppercase">
            Catálogo
          </span>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl mt-10 lg:mt-20 tracking-wide">
            Nuestros{" "}
            <span className="bg-gradient-to-r from-blue-500 to-blue-800 text-transparent bg-clip-text">
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
        {/* Filtros - Diseño Mobile con Scroll Horizontal */}
        <div className="mt-10 w-full max-w-7xl mx-auto">
          <div className="flex overflow-x-auto pb-4 gap-3 px-4 md:justify-center scrollbar-hide -mx-4 md:mx-0 snap-x">
            <button
              onClick={() => handleFilterChange("all")}
              className={`flex-shrink-0 snap-start px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-sm whitespace-nowrap ${activeFilter === "all"
                ? "bg-blue-600 text-white shadow-blue-200"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
            >
              Todos
            </button>
            <button
              onClick={() => handleFilterChange("plotters")}
              className={`flex-shrink-0 snap-start px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-sm whitespace-nowrap ${activeFilter === "plotters"
                ? "bg-blue-600 text-white shadow-blue-200"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
            >
              Plotters
            </button>
            <button
              onClick={() => handleFilterChange("papers")}
              className={`flex-shrink-0 snap-start px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-sm whitespace-nowrap ${activeFilter === "papers"
                ? "bg-blue-600 text-white shadow-blue-200"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
            >
              Papeles
            </button>
            <button
              onClick={() => handleFilterChange("pcs")}
              className={`flex-shrink-0 snap-start px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-sm whitespace-nowrap ${activeFilter === "pcs"
                ? "bg-blue-600 text-white shadow-blue-200"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
            >
              PCs Armadas
            </button>
            <button
              onClick={() => handleFilterChange("kitCameras")}
              className={`flex-shrink-0 snap-start px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-sm whitespace-nowrap ${activeFilter === "kitCameras"
                ? "bg-blue-600 text-white shadow-blue-200"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
            >
              Kits Seguridad
            </button>
            <button
              onClick={() => handleFilterChange("imouCams")}
              className={`flex-shrink-0 snap-start px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-sm whitespace-nowrap ${activeFilter === "imouCams"
                ? "bg-blue-600 text-white shadow-blue-200"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
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
          addToCart={addToCart}
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
                        <div
                          key={producto.id}
                          className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition cursor-pointer"
                          onClick={() => handleProductClick(producto, 'generic')}
                        >
                          <div className="h-48 overflow-hidden">
                            <img
                              src={producto.imagen_url || "https://via.placeholder.com/300x200?text=Sin+Imagen"}
                              alt={producto.nombre}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/300x200?text=Sin+Imagen";
                              }}
                            />
                          </div>

                          <div className="p-6">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="text-xl font-bold text-gray-900">
                                {producto.nombre}
                              </h3>
                              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                {producto.categoria}
                              </span>
                            </div>

                            {producto.descripcion && (
                              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                {producto.descripcion}
                              </p>
                            )}

                            <div className="space-y-2">
                              {/* Lógica de Precio Regular: USD vs ARS */}
                              {producto.precio_usd ? (
                                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                  <div className="text-left">
                                    <p className="font-semibold text-blue-900">Precio USD</p>
                                    <p className="text-sm text-gray-600">
                                      USD ${producto.precio_usd.toLocaleString()}
                                    </p>
                                    {dolarOficial && (
                                      <p className="text-xs text-gray-500">
                                        ARS ${(producto.precio_usd * dolarOficial).toLocaleString()}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => {
                                      addToCart({
                                        id: producto.id,
                                        name: producto.nombre,
                                        quantity: 1,
                                        price: producto.precio_usd * (dolarOficial || 1000),
                                        image: producto.imagen_url
                                      });
                                    }}
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2"
                                  >
                                    <ShoppingCart size={16} />
                                    Añadir
                                  </button>
                                </div>
                              ) : producto.precio_ars ? (
                                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                  <div className="text-left">
                                    <p className="font-semibold text-blue-900">Precio</p>
                                    <p className="text-lg font-bold text-gray-800">
                                      ${parseFloat(producto.precio_ars).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500">Pesos Argentinos</p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      addToCart({
                                        id: producto.id,
                                        name: producto.nombre,
                                        quantity: 1,
                                        price: producto.precio_ars,
                                        image: producto.imagen_url
                                      });
                                    }}
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2"
                                  >
                                    <ShoppingCart size={16} />
                                    Añadir
                                  </button>
                                </div>
                              ) : null}

                              {/* Lógica de Precio Mayorista: USD vs ARS */}
                              {producto.precio_mayorista_usd ? (
                                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                  <div className="text-left">
                                    <p className="font-semibold text-green-900">
                                      Mayorista ({producto.cantidad_minima_mayorista}+ u)
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      USD ${producto.precio_mayorista_usd.toLocaleString()}
                                    </p>
                                    {dolarOficial && (
                                      <p className="text-xs text-gray-500">
                                        ARS ${(producto.precio_mayorista_usd * dolarOficial).toLocaleString()}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => {
                                      addToCart({
                                        id: producto.id,
                                        name: `${producto.nombre} (Mayorista)`,
                                        quantity: producto.cantidad_minima_mayorista,
                                        price: producto.precio_mayorista_usd * (dolarOficial || 1000),
                                        image: producto.imagen_url
                                      });
                                    }}
                                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition flex items-center gap-2"
                                  >
                                    <ShoppingCart size={16} />
                                    Añadir
                                  </button>
                                </div>
                              ) : producto.precio_mayorista_ars ? (
                                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                  <div className="text-left">
                                    <p className="font-semibold text-green-900">
                                      Mayorista ({producto.cantidad_minima_mayorista}+ u)
                                    </p>
                                    <p className="text-lg font-bold text-gray-800">
                                      ${parseFloat(producto.precio_mayorista_ars).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500">Pesos Argentinos</p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      addToCart({
                                        id: producto.id,
                                        name: `${producto.nombre} (Mayorista)`,
                                        quantity: producto.cantidad_minima_mayorista,
                                        price: producto.precio_mayorista_ars,
                                        image: producto.imagen_url
                                      });
                                    }}
                                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition flex items-center gap-2"
                                  >
                                    <ShoppingCart size={16} />
                                    Añadir
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </div>
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
                    <div
                      key={producto.id}
                      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition"
                    >
                      <div className="h-48 overflow-hidden">
                        <img
                          src={producto.imagen_url || "https://via.placeholder.com/300x200?text=Sin+Imagen"}
                          alt={producto.nombre}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/300x200?text=Sin+Imagen";
                          }}
                        />
                      </div>

                      <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            {producto.nombre}
                          </h3>
                          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                            {producto.categoria}
                          </span>
                        </div>

                        {producto.descripcion && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {producto.descripcion}
                          </p>
                        )}

                        <div className="space-y-2">
                          {/* Lógica de Precio Regular Filtrado */}
                          {producto.precio_usd ? (
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                              <div className="text-left">
                                <p className="font-semibold text-blue-900">Precio USD</p>
                                <p className="text-sm text-gray-600">
                                  USD ${producto.precio_usd.toLocaleString()}
                                </p>
                                {dolarOficial && (
                                  <p className="text-xs text-gray-500">
                                    ARS ${(producto.precio_usd * dolarOficial).toLocaleString()}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  addToCart({
                                    id: producto.id,
                                    name: producto.nombre,
                                    quantity: 1,
                                    price: producto.precio_usd * (dolarOficial || 1000),
                                    image: producto.imagen_url
                                  });
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2"
                              >
                                <ShoppingCart size={16} />
                                Añadir
                              </button>
                            </div>
                          ) : producto.precio_ars ? (
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                              <div className="text-left">
                                <p className="font-semibold text-blue-900">Precio</p>
                                <p className="text-lg font-bold text-gray-800">
                                  ${parseFloat(producto.precio_ars).toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500">Pesos Argentinos</p>
                              </div>
                              <button
                                onClick={() => {
                                  addToCart({
                                    id: producto.id,
                                    name: producto.nombre,
                                    quantity: 1,
                                    price: producto.precio_ars,
                                    image: producto.imagen_url
                                  });
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2"
                              >
                                <ShoppingCart size={16} />
                                Añadir
                              </button>
                            </div>
                          ) : null}

                          {/* Lógica de Precio Mayorista Filtrado */}
                          {producto.precio_mayorista_usd ? (
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                              <div className="text-left">
                                <p className="font-semibold text-green-900">
                                  Mayorista ({producto.cantidad_minima_mayorista}+ u)
                                </p>
                                <p className="text-sm text-gray-600">
                                  USD ${producto.precio_mayorista_usd.toLocaleString()}
                                </p>
                                {dolarOficial && (
                                  <p className="text-xs text-gray-500">
                                    ARS ${(producto.precio_mayorista_usd * dolarOficial).toLocaleString()}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  addToCart({
                                    id: producto.id,
                                    name: `${producto.nombre} (Mayorista)`,
                                    quantity: producto.cantidad_minima_mayorista,
                                    price: producto.precio_mayorista_usd * (dolarOficial || 1000),
                                    image: producto.imagen_url
                                  });
                                }}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition flex items-center gap-2"
                              >
                                <ShoppingCart size={16} />
                                Añadir
                              </button>
                            </div>
                          ) : producto.precio_mayorista_ars ? (
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                              <div className="text-left">
                                <p className="font-semibold text-green-900">
                                  Mayorista ({producto.cantidad_minima_mayorista}+ u)
                                </p>
                                <p className="text-lg font-bold text-gray-800">
                                  ${parseFloat(producto.precio_mayorista_ars).toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500">Pesos Argentinos</p>
                              </div>
                              <button
                                onClick={() => {
                                  addToCart({
                                    id: producto.id,
                                    name: `${producto.nombre} (Mayorista)`,
                                    quantity: producto.cantidad_minima_mayorista,
                                    price: producto.precio_mayorista_ars,
                                    image: producto.imagen_url
                                  });
                                }}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition flex items-center gap-2"
                              >
                                <ShoppingCart size={16} />
                                Añadir
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
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
                                  e.stopPropagation();
                                  addToCart({
                                    ...plotter,
                                    quantity: 1,
                                    price: plotter.precio_de_llegada * dolarOficial,
                                    name: plotter.nombre,
                                  });
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

        {/* Sección de Papeles - FALLBACK
        {(activeFilter === "all" || activeFilter === "papers") && (
          <div className="mt-16 text-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8">
              <span className="border-b-4 border-blue-500 pb-2">
                Nuestros Papeles
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition cursor-pointer"
                  onClick={() => handleProductClick(product, "papers")}
                >
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded">
                      <ZoomIn size={16} />
                    </div>
                  </div>

                  <div className="p-6 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold text-gray-900">
                          {product.name}
                        </h3>
                        <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-2.5 py-0.5 rounded">
                          {product.category}
                        </span>
                      </div>

                      <p className="mt-2 text-gray-600 line-clamp-2">
                        {product.description}
                      </p>

                      <div className="mt-4 text-sm text-gray-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <p>
                            Combo 5u: ${product.combos.combo5u.toLocaleString()}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart({
                                ...product,
                                quantity: 5,
                                price: product.combos.combo5u,
                              });
                            }}
                            className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700"
                          >
                            Añadir
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <p>
                            Combo 15u: $
                            {product.combos.combo15u.toLocaleString()}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart({
                                ...product,
                                quantity: 15,
                                price: product.combos.combo15u,
                              });
                            }}
                            className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700"
                          >
                            Añadir
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <p>
                            Combo 30u: $
                            {product.combos.combo30u.toLocaleString()}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart({
                                ...product,
                                quantity: 30,
                                price: product.combos.combo30u,
                              });
                            }}
                            className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700"
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
        )} */}

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
    </section>
  );
};

export default ProductSection;
