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
              src={logoluisys}
              alt="Logo"
            />
          </Link>

          {/* Menú desktop */}
          <ul className="hidden lg:flex gap-10 font-medium text-neutral-800">
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
          </ul>

          {/* Botón menú móvil */}
          <div className="lg:hidden">
            <button onClick={toggleNavbar} aria-label="Toggle Menu">
              {mobileDrawerOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Menú mobile */}
        <AnimatePresence>
          {mobileDrawerOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 w-full bg-[rgb(37,99,235)] text-white flex flex-col items-center shadow-md z-40"
            >
              {navItems.map((item, index) =>
                item.href.startsWith("#") ? (
                  <a
                    key={index}
                    href={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className="w-full text-center py-4 text-lg tracking-wide border-b border-white/30 hover:text-yellow-300 transition-all"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={index}
                    to={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className="w-full text-center py-4 text-lg tracking-wide border-b border-white/30 hover:text-yellow-300 transition-all"
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
