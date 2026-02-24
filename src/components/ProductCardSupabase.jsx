import { useState } from "react";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Helper para obtener las imágenes de un producto.
 * Prioriza: product.imagenes array > product.galeria array > product.imagen_url string > product.image string > placeholder
 */
const getProductImages = (product) => {
    let images = [];

    if (product.imagenes && Array.isArray(product.imagenes) && product.imagenes.length > 0) {
        images = product.imagenes;
    } else if (product.galeria && Array.isArray(product.galeria) && product.galeria.length > 0) {
        images = product.galeria;
    } else if (product.imagen_url) {
        images = [product.imagen_url];
    } else if (product.image) {
        images = [product.image];
    } else {
        images = ["https://via.placeholder.com/300x200?text=Sin+Imagen"];
    }

    return images;
};

const ProductCardSupabase = ({ product, dolarOficial, onAddToCart, onClick }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const images = getProductImages(product);

    const handlePrevImage = (e) => {
        e.stopPropagation(); // Evitar abrir el modal
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const handleNextImage = (e) => {
        e.stopPropagation(); // Evitar abrir el modal
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    // Precios calculados
    const precioUsd = product.precio_usd || product.precio_pre_venta; // Fallback para compatibilidad
    const precioArs = product.precio_ars;

    const precioMayoristaUsd = product.precio_mayorista_usd || product.precio_de_llegada; // Fallback
    const precioMayoristaArs = product.precio_mayorista_ars;

    return (
        <div
            className="bg-white dark:bg-[#0f172a] rounded-xl shadow-md dark:shadow-[0_0_20px_rgba(99,102,241,0.08)] overflow-hidden border border-gray-200 dark:border-gray-700/50 hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] transition cursor-pointer flex flex-col h-full"
            onClick={() => onClick(product)}
        >
            {/* Sección de Imagen con Carrusel */}
            <div className="h-56 overflow-hidden relative group bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <img
                    src={images[currentImageIndex]}
                    alt={product.nombre || product.name || "Producto"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/300x200?text=Sin+Imagen";
                    }}
                />

                {/* Flechas de navegación (Solo si hay más de 1 imagen) */}
                {images.length > 1 && (
                    <>
                        {/* Flecha Izquierda - Visible en móvil, hover en desktop */}
                        <button
                            onClick={handlePrevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white rounded-full p-1.5 backdrop-blur-sm transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 z-10"
                            aria-label="Imagen anterior"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        {/* Flecha Derecha */}
                        <button
                            onClick={handleNextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white rounded-full p-1.5 backdrop-blur-sm transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 z-10"
                            aria-label="Siguiente imagen"
                        >
                            <ChevronRight size={20} />
                        </button>

                        {/* Indicador de posición (puntos) */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                            {images.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1.5 rounded-full shadow-sm transition-all ${currentImageIndex === idx
                                        ? "bg-white w-3"
                                        : "bg-white/50 w-1.5"
                                        }`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="p-5 flex flex-col flex-grow justify-between">
                <div>
                    <div className="flex justify-between items-start mb-2 gap-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                            {product.nombre || product.name}
                        </h3>
                        {product.categoria && (
                            <span className="bg-blue-100 dark:bg-indigo-900/40 text-blue-800 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap">
                                {product.categoria}
                            </span>
                        )}
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 min-h-[40px]">
                        {product.descripcion || product.description_short || "Sin descripción disponible."}
                    </p>
                </div>

                <div className="space-y-3 mt-auto">
                    {/* Precio Regular */}
                    {(precioUsd || precioArs) && (
                        <div className="p-3 bg-blue-50 dark:bg-indigo-900/30 rounded-lg border border-blue-100 dark:border-indigo-800/40">
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-xs font-bold text-blue-800 dark:text-indigo-300 uppercase tracking-wider">Unidad</p>
                                {precioUsd && <p className="text-lg font-bold text-blue-900 dark:text-indigo-200">USD {parseFloat(precioUsd).toLocaleString()}</p>}
                                {!precioUsd && precioArs && <p className="text-lg font-bold text-blue-900 dark:text-indigo-200">${parseFloat(precioArs).toLocaleString()}</p>}
                            </div>
                            {/* Conversión ARS solo si hay precio USD y dolar oficial */}
                            {precioUsd && dolarOficial && (
                                <p className="text-xs text-blue-600/80 dark:text-indigo-400/70 font-medium text-right">
                                    ≈ ARS ${(precioUsd * dolarOficial).toLocaleString()}
                                </p>
                            )}
                            <button
                                onClick={(e) => onAddToCart({
                                    ...product,
                                    id: product.id,
                                    name: product.nombre || product.name,
                                    quantity: 1,
                                    price: precioUsd ? precioUsd * (dolarOficial || 1000) : precioArs,
                                    image: images[0]
                                }, e)}
                                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-md transition flex items-center justify-center gap-2"
                            >
                                <ShoppingCart size={16} />
                                Agregar
                            </button>
                        </div>
                    )}

                    {/* Precio Mayorista */}
                    {(precioMayoristaUsd || precioMayoristaArs) && (
                        <div className="p-3 bg-green-50 dark:bg-emerald-900/30 rounded-lg border border-green-100 dark:border-emerald-800/40">
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex flex-col">
                                    <p className="text-xs font-bold text-green-800 dark:text-emerald-300 uppercase tracking-wider">Mayorista</p>
                                    <p className="text-[10px] text-green-700 dark:text-emerald-400 font-medium">Min: {product.cantidad_minima_mayorista || 3}u</p>
                                </div>
                                {precioMayoristaUsd && <p className="text-lg font-bold text-green-900 dark:text-emerald-200">USD {parseFloat(precioMayoristaUsd).toLocaleString()}</p>}
                                {!precioMayoristaUsd && precioMayoristaArs && <p className="text-lg font-bold text-green-900 dark:text-emerald-200">${parseFloat(precioMayoristaArs).toLocaleString()}</p>}
                            </div>
                            <button
                                onClick={(e) => onAddToCart({
                                    ...product,
                                    id: product.id,
                                    name: `${product.nombre || product.name} (Mayorista)`,
                                    quantity: product.cantidad_minima_mayorista || 3,
                                    price: precioMayoristaUsd ? precioMayoristaUsd * (dolarOficial || 1000) : precioMayoristaArs,
                                    image: images[0]
                                }, e)}
                                className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-md transition flex items-center justify-center gap-2"
                            >
                                <ShoppingCart size={16} />
                                Pack Mayorista
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCardSupabase;
