import { useEffect, useState } from "react";
import {
  FiTrash2,
  FiPlus,
  FiDollarSign,
  FiPackage,
  FiScissors,
  FiPercent,
  FiTrendingUp,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import logoLucfra from "../assets/lucfra_t.png";
import { Link } from "react-router-dom";
import luis from "../assets/luis.jpg";
import avatarLuisPatty from "../assets/avatarLuisPattyJpg.jpg";

const ComunidadPage = () => {
  // Estados para insumos
  const [insumos, setInsumos] = useState([]);
  const [nuevoInsumo, setNuevoInsumo] = useState({
    tipo: "unidad",
    nombre: "",
    precio: "",
    cantidad: 1,
    metrosPorPrenda: "",
    metrosTotales: "",
  });

  // Estados para cálculos de costos
  const [kgTela, setKgTela] = useState("");
  const [precioKgTela, setPrecioKgTela] = useState("");
  const [prendasTotales, setPrendasTotales] = useState("");
  const [costoCostura, setCostoCostura] = useState("");
  const [margenGanancia, setMargenGanancia] = useState("");
  const [resultados, setResultados] = useState({
    costoUnitario: 0,
    precioVenta: 0,
    costoTotal: 0,
  });

  // Efecto para cargar datos del localStorage
  useEffect(() => {
    const dataGuardada = localStorage.getItem("insumos");
    if (dataGuardada) {
      setInsumos(JSON.parse(dataGuardada));
    }
  }, []);

  const guardarEnLocalStorage = (data) => {
    localStorage.setItem("insumos", JSON.stringify(data));
  };

  const handleAgregar = () => {
    if (nuevoInsumo.nombre.trim() === "" || nuevoInsumo.precio === "") return;

    const nuevo = {
      id: crypto.randomUUID(),
      ...nuevoInsumo,
    };

    const actualizados = [...insumos, nuevo];
    setInsumos(actualizados);
    guardarEnLocalStorage(actualizados);
    setNuevoInsumo({
      tipo: "unidad",
      nombre: "",
      precio: "",
      cantidad: 1,
      metrosPorPrenda: "",
      metrosTotales: "",
    });
  };

  const handleEliminar = (id) => {
    const actualizados = insumos.filter((i) => i.id !== id);
    setInsumos(actualizados);
    guardarEnLocalStorage(actualizados);
  };

  const calcularCostos = () => {
    // Convertir valores a números (0 si está vacío)
    const kgTelaNum = kgTela === "" ? 0 : parseFloat(kgTela);
    const precioKgTelaNum = precioKgTela === "" ? 0 : parseFloat(precioKgTela);
    const prendasTotalesNum =
      prendasTotales === "" ? 0 : parseInt(prendasTotales);
    const costoCosturaNum = costoCostura === "" ? 0 : parseFloat(costoCostura);
    const margenGananciaNum =
      margenGanancia === "" ? 0 : parseFloat(margenGanancia);

    if (prendasTotalesNum <= 0) return;

    // Costo total de tela
    const costoTelaTotal = kgTelaNum * precioKgTelaNum;

    // Costo total de costura
    const costoCosturaTotal = costoCosturaNum * prendasTotalesNum;

    // Costo de insumos
    const costoInsumos = insumos.reduce((total, insumo) => {
      if (insumo.tipo === "unidad") {
        const precio = insumo.precio === "" ? 0 : parseFloat(insumo.precio);
        return total + precio * insumo.cantidad * prendasTotalesNum;
      } else {
        const precio = insumo.precio === "" ? 0 : parseFloat(insumo.precio);
        const metrosPorPrenda =
          insumo.metrosPorPrenda === ""
            ? 0
            : parseFloat(insumo.metrosPorPrenda || "0");
        const metrosTotales =
          insumo.metrosTotales === ""
            ? 0
            : parseFloat(insumo.metrosTotales || "0");

        const metrosRequeridos = metrosPorPrenda * prendasTotalesNum;
        const factorUso =
          metrosRequeridos > 0 ? metrosTotales / metrosRequeridos : 1;
        return total + precio / factorUso;
      }
    }, 0);

    // Costo total de producción
    const costoTotal = costoTelaTotal + costoCosturaTotal + costoInsumos;

    // Costo unitario
    const costoUnitario = costoTotal / prendasTotalesNum;

    // Precio de venta con margen de ganancia
    const precioVenta = costoUnitario / (1 - margenGananciaNum / 100);

    setResultados({
      costoUnitario,
      precioVenta,
      costoTotal,
    });
  };

  // Animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex flex-col items-center justify-center mt-12 mb-8">
        <div className="flex justify-between items-center">
          <Link to="/">
            <img
              className="h-14 w-40 object-contain"
              src={avatarLuisPatty}
              alt="Logo"
            />
          </Link>
        </div>
      </div>
      {/* Título principal */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Calculadora de Costos
        </h1>
        <p className="text-gray-500 mt-2">Optimiza tu producción textil</p>
      </motion.div>

      {/* Sección de parámetros básicos */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mb-8 p-6 bg-white rounded-xl shadow-md border border-gray-100"
      >
        <motion.h2
          variants={itemVariants}
          className="text-xl font-semibold mb-4 flex items-center"
        >
          <FiPackage className="mr-2 text-blue-600" /> Parámetros de Producción
        </motion.h2>

        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kg de tela
            </label>
            <div className="relative">
              <input
                type="number"
                value={kgTela}
                onChange={(e) => setKgTela(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="0.00"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio por kg
            </label>
            <div className="relative">
              <input
                type="number"
                value={precioKgTela}
                onChange={(e) => setPrecioKgTela(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="0.00"
              />
              <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total prendas
            </label>
            <input
              type="number"
              value={prendasTotales}
              onChange={(e) => setPrendasTotales(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="0"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Costo costura por prenda
            </label>
            <div className="relative">
              <input
                type="number"
                value={costoCostura}
                onChange={(e) => setCostoCostura(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="0.00"
              />
              <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Margen de ganancia
            </label>
            <div className="relative">
              <input
                type="number"
                value={margenGanancia}
                onChange={(e) => setMargenGanancia(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="30"
              />
              <FiPercent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Sección de insumos */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8 p-6 bg-white rounded-xl shadow-md border border-gray-100"
      >
        <motion.h2 className="text-xl font-semibold mb-4 flex items-center">
          <FiPackage className="mr-2 text-blue-600" /> Gestión de Insumos
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de insumo
            </label>
            <select
              value={nuevoInsumo.tipo}
              onChange={(e) =>
                setNuevoInsumo({ ...nuevoInsumo, tipo: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="unidad">Por unidad</option>
              <option value="metro">Por metro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={nuevoInsumo.nombre}
              onChange={(e) =>
                setNuevoInsumo({ ...nuevoInsumo, nombre: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Ej: Botones, Hilo"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio
            </label>
            <div className="relative">
              <input
                type="number"
                value={nuevoInsumo.precio}
                onChange={(e) =>
                  setNuevoInsumo({ ...nuevoInsumo, precio: e.target.value })
                }
                className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="0.00"
              />
              <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {nuevoInsumo.tipo === "unidad" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad por prenda
              </label>
              <input
                type="number"
                value={nuevoInsumo.cantidad}
                onChange={(e) =>
                  setNuevoInsumo({ ...nuevoInsumo, cantidad: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                min="1"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metros por prenda
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={nuevoInsumo.metrosPorPrenda}
                    onChange={(e) =>
                      setNuevoInsumo({
                        ...nuevoInsumo,
                        metrosPorPrenda: e.target.value,
                      })
                    }
                    className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    step="0.01"
                    placeholder="0.00"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    m
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metros totales
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={nuevoInsumo.metrosTotales}
                    onChange={(e) =>
                      setNuevoInsumo({
                        ...nuevoInsumo,
                        metrosTotales: e.target.value,
                      })
                    }
                    className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    step="0.01"
                    placeholder="0.00"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    m
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAgregar}
          className="flex items-center justify-center w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all shadow-md"
          disabled={!nuevoInsumo.nombre.trim() || !nuevoInsumo.precio}
        >
          <FiPlus className="mr-2" /> Agregar Insumo
        </motion.button>

        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3 text-gray-700">
            Insumos agregados
          </h3>
          <AnimatePresence>
            {insumos.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-gray-500 text-center py-4"
              >
                No hay insumos registrados
              </motion.p>
            ) : (
              <ul className="space-y-2">
                <AnimatePresence>
                  {insumos.map((i) => (
                    <motion.li
                      key={i.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-gray-50 rounded-lg p-3 flex justify-between items-center"
                    >
                      <div>
                        <span className="font-medium">{i.nombre}</span>
                        <div className="text-sm text-gray-600 mt-1">
                          {i.tipo === "unidad" ? (
                            <span>
                              {i.cantidad} und/prend × $
                              {parseFloat(i.precio).toFixed(2)}
                            </span>
                          ) : (
                            <span>
                              {i.metrosPorPrenda}m/prend × $
                              {parseFloat(i.precio).toFixed(2)} (rollo:{" "}
                              {i.metrosTotales}m)
                            </span>
                          )}
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEliminar(i.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        aria-label="Eliminar insumo"
                      >
                        <FiTrash2 />
                      </motion.button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Sección de resultados */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-md border border-gray-200"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <FiTrendingUp className="mr-2 text-blue-600" /> Resultados
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={calcularCostos}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-all shadow-lg flex items-center"
          >
            Calcular Costos
          </motion.button>
        </div>

        {resultados.costoTotal > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6"
          >
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Costo Total</p>
              <p className="text-2xl font-bold text-blue-600">
                ${resultados.costoTotal.toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Costo Unitario</p>
              <p className="text-2xl font-bold text-purple-600">
                ${resultados.costoUnitario.toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Precio de Venta</p>
              <p className="text-2xl font-bold text-green-600">
                ${resultados.precioVenta.toFixed(2)}
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>

      <div className="flex flex-col items-center justify-center mt-12 mb-8">
        {/* Imagen circular con efecto hover */}
        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <img
            src={luis}
            alt="Perfil"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/200";
            }}
          />

          {/* Efecto de superposición al hacer hover */}
          <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="text-white font-medium text-sm">Luis Patty</span>
          </div>
        </div>

        {/* Texto debajo de la imagen (opcional) */}
        <div className="mt-4 text-center">
          <h3 className="text-lg font-semibold text-gray-800">
            Ing. Electronico
          </h3>
        </div>
      </div>
    </div>
  );
};

export default ComunidadPage;
