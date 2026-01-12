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
      className="fixed bottom-6 left-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors duration-300"
      aria-label="Chat de WhatsApp"
    >
      <img src={whatsapp} alt="WhatsApp" className="w-8 h-8" />
    </a>
  );
};

export default WhatsAppButton;
