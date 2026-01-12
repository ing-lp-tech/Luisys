/* import { Menu, X } from "lucide-react";
import { useState } from "react";
import logoLucfra from "../assets/lucfra_t.png";
import { navItems } from "../constants";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const toggleNavbar = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  return (
    <nav className="sticky top-0 z-50 py-3 bg-white/70 backdrop-blur-md shadow-md border-b border-neutral-300">
      <div className="container px-4 mx-auto">
        <div className="flex justify-between items-center">
          <Link to="/">
            <img
              className="h-14 w-40 object-contain"
              src={logoLucfra}
              alt="Logo"
            />
          </Link>
          <ul className="hidden lg:flex gap-10 font-medium text-neutral-800">
            {navItems.map((item, index) => (
              <li key={index}>
                {item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 transition-all"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    to={item.href}
                    className="hover:text-blue-600 transition-all"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <div className="lg:hidden">
            <button onClick={toggleNavbar} aria-label="Toggle Menu">
              {mobileDrawerOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileDrawerOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 w-full bg-[rgb(37,99,235)] text-white flex flex-col items-center shadow-md z-40"
            >
              {navItems.map((item, index) =>
                item.external ? (
                  <a
                    key={index}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center py-4 text-lg tracking-wide border-b border-white/30 hover:text-yellow-300 transition-all"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={index}
                    to={item.href}
                    className="w-full text-center py-4 text-lg tracking-wide border-b border-white/30 hover:text-yellow-300 transition-all"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
 */

import { Menu, X } from "lucide-react";
import { useState } from "react";
import logoLucfra from "../assets/lucfra_t.png";
import avatarLuisPatty from "../assets/avatarLuisPatty.jpg";
import avatarLuisPattypng from "../assets/avatarLuisPatty-256x256.png";
import logoluisys from "../assets/LogoLuisys.png";

import { navItems } from "../constants";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { LogIn, User, LogOut } from "lucide-react";

const Navbar = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const toggleNavbar = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  return (
    <nav className="sticky top-0 z-50 py-3 bg-white/70 backdrop-blur-md shadow-md border-b border-neutral-300">
      <div className="container px-4 mx-auto">
        <div className="flex justify-between items-center">
          <Link to="/">
            <img
              className="h-14 w-40 object-contain"
              src={logoluisys}
              alt="Logo"
            />
          </Link>

          {/* Menú desktop */}
          <ul className="hidden lg:flex gap-10 font-medium text-neutral-800 items-center">
            {navItems.map((item, index) => (
              <li key={index}>
                {item.href.startsWith("#") ? (
                  <a
                    href={item.href}
                    className="hover:text-blue-600 transition-all"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    to={item.href}
                    className="hover:text-blue-600 transition-all"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}

            {/* Login/Admin Button */}
            <li>
              {user ? (
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-md hover:shadow-lg"
                >
                  <User size={18} />
                  Admin
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                  <LogIn size={18} />
                  Login
                </Link>
              )}

            </li>
          </ul>

          {/* Botón menú móvil */}
          <div className="lg:hidden">
            <button onClick={toggleNavbar} aria-label="Toggle Menu" className="p-2 text-neutral-800 hover:text-blue-600 transition-colors">
              {mobileDrawerOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Menú mobile */}
        <AnimatePresence>
          {mobileDrawerOpen && (
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed inset-0 bg-white z-40 flex flex-col items-center justify-center lg:hidden"
            >
              <div className="absolute top-4 right-4">
                <button onClick={toggleNavbar} aria-label="Close Menu">
                  <X size={32} className="text-neutral-800" />
                </button>
              </div>

              <div className="flex flex-col gap-8 items-center w-full px-8">
                {navItems.map((item, index) =>
                  item.href.startsWith("#") ? (
                    <a
                      key={index}
                      href={item.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className="text-2xl font-medium text-neutral-800 hover:text-blue-600 transition-colors"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      key={index}
                      to={item.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className="text-2xl font-medium text-neutral-800 hover:text-blue-600 transition-colors"
                    >
                      {item.label}
                    </Link>
                  )
                )}

                <div className="w-full h-px bg-neutral-200 my-2"></div>

                {/* Login/Admin Mobile */}
                {user ? (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-full text-xl shadow-lg hover:bg-purple-700 transition-all w-full justify-center"
                  >
                    <User size={24} />
                    Panel Admin
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full text-xl shadow-lg hover:bg-blue-700 transition-all w-full justify-center"
                  >
                    <LogIn size={24} />
                    Iniciar Sesión
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
