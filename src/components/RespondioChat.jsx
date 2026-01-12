/* import { useEffect } from "react";

const RespondioChat = () => {
  useEffect(() => {
    // Verifica si el script ya existe para evitar duplicados
    if (!document.getElementById("respondio__widget")) {
      const script = document.createElement("script");
      script.id = "respondio__widget";
      script.src =
        "https://cdn.respond.io/webchat/widget/widget.js?cId=111b2907018f0ef23626a31b21f5492";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return null; // No renderiza nada en el DOM
};

export default RespondioChat;
 */

import { useEffect } from "react";

const RespondioChat = () => {
  useEffect(() => {
    if (!document.getElementById("respondio__widget")) {
      const script = document.createElement("script");
      script.id = "respondio__widget";
      script.src =
        "https://cdn.respond.io/webchat/widget/widget.js?cId=111b2907018f0ef23626a31b21f5492";
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        // Escuchar clicks en el botón del chat
        document.addEventListener("click", (e) => {
          // El botón de Respond.io suele tener una clase 'widgetLauncher' o similar
          const target = e.target.closest(".WidgetLauncher");
          if (target) {
            // Limpiar el historial local del chat
            localStorage.removeItem("respond.io:webchat");
            sessionStorage.clear();
            console.log("Historial de chat borrado del lado del cliente");
          }
        });
      };
    }
  }, []);

  return null;
};

export default RespondioChat;
