import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CartDrawer = ({ isOpen, onClose, cart }) => {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay de fondo */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black/50 z-[60]"
                        onClick={onClose}
                    />

                    {/* Drawer lateral */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-[70] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="h-6 w-6" />
                                <h2 className="text-xl font-bold">Tu Carrito</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 rounded-full hover:bg-blue-700 transition"
                                aria-label="Cerrar carrito"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Contenido del carrito */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <ShoppingBag className="h-16 w-16 mb-4" />
                                    <p className="text-lg">Tu carrito está vacío</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cart.map((item) => (
                                        <div
                                            key={item.cartItemId}
                                            className="flex gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 hover:shadow-md transition"
                                        >
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://via.placeholder.com/80?text=Sin+Imagen";
                                                }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-sm text-gray-800 line-clamp-2">
                                                    {item.name}
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Cantidad: {item.quantity}
                                                </p>
                                                <p className="text-blue-600 font-bold mt-2">
                                                    ${(item.price * item.quantity).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer con total y botones */}
                        {cart.length > 0 && (
                            <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-3">
                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>Total:</span>
                                    <span className="text-blue-600">${total.toLocaleString()}</span>
                                </div>

                                <Link
                                    to="/cart"
                                    onClick={onClose}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                                >
                                    Ver carrito completo
                                    <ArrowRight className="h-5 w-5" />
                                </Link>

                                <button
                                    onClick={onClose}
                                    className="w-full bg-white text-gray-700 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition font-medium"
                                >
                                    Seguir comprando
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
