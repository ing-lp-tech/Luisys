import { Sun, Moon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

/**
 * Botón circular que alterna entre modo claro y oscuro.
 * Puede recibir una className extra para posicionarlo en distintos contextos.
 */
export default function DarkModeToggle({ className = "" }) {
    const { isDark, toggleDark } = useTheme();

    return (
        <button
            onClick={toggleDark}
            aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            title={isDark ? "Modo claro" : "Modo oscuro"}
            className={`
        relative flex items-center justify-center
        w-9 h-9 rounded-full
        transition-all duration-300 ease-in-out
        overflow-hidden
        ${isDark
                    ? "bg-yellow-400 text-gray-900 hover:bg-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.5)]"
                    : "bg-gray-800 text-yellow-300 hover:bg-gray-700 shadow-[0_0_12px_rgba(0,0,0,0.2)]"
                }
        ${className}
      `}
        >
            <span
                className={`absolute transition-all duration-300 ${isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"
                    }`}
            >
                <Sun size={18} />
            </span>
            <span
                className={`absolute transition-all duration-300 ${isDark ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
                    }`}
            >
                <Moon size={18} />
            </span>
        </button>
    );
}
