import { MessageCircle } from "lucide-react";
import whatsapp from "../assets/whatsapp.svg";

const WhatsAppButton = () => {
  const phoneNumber = "5491162020911";
  const defaultMessage = "Hola, me gustaría obtener más información.";

  // URL de WhatsApp
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    defaultMessage
  )}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 left-4 md:bottom-6 md:left-6 z-40 bg-green-500 text-white p-3 md:p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors duration-300 flex items-center justify-center hover:scale-110 active:scale-95"
      aria-label="Chat de WhatsApp"
    >
      <img src={whatsapp} alt="WhatsApp" className="w-8 h-8" />
    </a>
  );
};

export default WhatsAppButton;
