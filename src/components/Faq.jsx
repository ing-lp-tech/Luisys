import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { faqData } from "../constants";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (i) => {
    setOpenIndex(i === openIndex ? null : i);
  };

  return (
    <section id="preguntasfrecuentes" className="py-12 px-4 md:px-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">
          Preguntas Frecuentes
        </h2>
        {faqData.map((category, catIndex) => (
          <div key={catIndex} className="mb-10">
            <h3 className="text-xl font-semibold mb-4 text-indigo-600">
              {category.category}
            </h3>
            <div className="space-y-4">
              {category.items.map((item, i) => {
                const idx = `${catIndex}-${i}`;
                const isOpen = openIndex === idx;
                return (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
                  >
                    <button
                      className="flex justify-between w-full text-left font-medium text-gray-800"
                      onClick={() => toggle(idx)}
                    >
                      <span>{item.question}</span>
                      <ChevronDown
                        className={`h-5 w-5 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="mt-3 text-gray-600">{item.answer}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
