/* import { resourcesLinks, platformLinks, communityLinks } from "../constants";
const Footer = () => {
  return (
    <footer className="mt-20 border-t py-10 border-neutral-700">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <h3 className="text-md font-semibold mb-4">Resources</h3>
          <ul className="space-y-2">
            {resourcesLinks.map((link, index) => (
              <li key={index}>
                <a
                  href={link.href}
                  className="text-neutral-300 hover:text-white"
                >
                  {link.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-md font-semibold mb-4">Platform</h3>
          <ul className="space-y-2">
            {platformLinks.map((link, index) => (
              <li key={index}>
                <a
                  href={link.href}
                  className="text-neutral-300 hover:text-white"
                >
                  {link.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-md font-semibold mb-4">Community</h3>
          <ul className="space-y-2">
            {communityLinks.map((link, index) => (
              <li key={index}>
                <a
                  href={link.href}
                  className="text-neutral-300 hover:text-white"
                >
                  {link.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
 */

import tiktok from "../assets/tiktok.svg";
import { Instagram, Facebook, Linkedin, Youtube, Twitter } from "lucide-react";
import avatarLuisPatty from "../assets/avatarLuisPattyJpg.jpg";
import logoEngineer from "../assets/logoEngineer.jpg";
import logoluisys from "../assets/LogoLuisys.png";

const Footer = ({ id }) => {
  // URLs de las redes sociales

  const socialLinks = [
    {
      name: "TikTok",
      icon: (
        <img src={tiktok} alt="TikTok" className="w-6 h-6" loading="lazy" />
      ),
      url: "https://www.tiktok.com/@ingeniero_emprendedor",
    },
    {
      name: "TikTok",
      icon: <Facebook className="w-6 h-6" />, // TikTok no está en Lucide, usamos Youtube como placeholder
      url: "https://www.tiktok.com/@ingeniero_emprendedor",
    },
  ];

  return (
    <footer id={id} className="mt-20 border-t py-10 border-neutral-700">
      <div className="container mx-auto px-4">
        {/* Sección de redes sociales */}
        <div className="flex flex-col items-center justify-center space-y-6">
          <h3 className="text-lg font-semibold text-neutral-300">
            Síguenos en nuestras redes
          </h3>
          <div>
            <img
              className="h-24 w-40 object-contain"
              src={logoluisys}
              alt="Logo"
            />
          </div>
          <div className="flex space-x-6">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-300 hover:text-white transition-colors duration-300"
                aria-label={social.name}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-neutral-700 my-8"></div>

        {/* Información adicional */}
        <div className="text-center text-neutral-400">
          <p>© {new Date().getFullYear()} Todos los derechos reservados.</p>
          <p className="mt-2">
            Diseñado por{" "}
            <a
              href="https://www.linkedin.com/in/luis-patty-mamani/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors duration-300"
            >
              Ing. Luis Patty Mamani
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
