import React, { useState, useEffect } from "react";
import { siteConfigService } from "../../services/siteConfigService";
import { Save, Upload, Loader, Plus, Trash2 } from "lucide-react";

export const SiteConfigEditor = () => {
    const [configs, setConfigs] = useState({});
    const [aboutItems, setAboutItems] = useState([]); // Estado para los items estructurados de Sobre Mí
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState({});

    // Datos por defecto para inicializar si está vacío o es HTML legacy
    const DEFAULT_ABOUT_ITEMS = [
        { title: "Ingeniero Electrónico", description: "Soy ingeniero electrónico graduado en la UNLaM..." },
        { title: "Experiencia en máquinas y procesos", description: "A lo largo de mi recorrido profesional..." },
        { title: "Fabricando con pasión", description: "También tengo experiencia en la fabricación de ropa..." },
        { title: "Conectando tecnología y oportunidades", description: "Hoy aplico mis conocimientos de ingeniería..." }
    ];

    const CONFIG_KEYS = [
        { key: "navbar_logo_url", label: "Logo Barra de Navegación", type: "image", description: "Se recomienda PNG transparente." },
        { key: "hero_logo_url", label: "Logo Hero (Llegó el Inge)", type: "image", description: "Aparece sobre el título principal." },
        { key: "hero_main_image_url", label: "Imagen Principal Hero", type: "image", description: "La imagen grande del plotter/producto." },
        { key: "about_bg_url", label: "Fondo Sección 'Sobre Mí'", type: "image", description: "Imagen de fondo para la sección oscura." },
    ];

    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        setLoading(true);
        const data = await siteConfigService.getAllConfigs();
        setConfigs(data || {});

        // Parsear about_content
        const content = data?.about_content;
        let items = [];
        try {
            if (content && (content.startsWith('[') || content.startsWith('{'))) {
                items = JSON.parse(content);
            } else if (content) {
                // Es HTML legacy, no lo cargamos en el editor estructurado para evitar errores
                // Pero podríamos mostrar un aviso. Por simplicidad, cargamos default si el usuario quiere editar.
                console.log("Contenido HTML detectado. Usando defaults para editor estructurado.");
                items = DEFAULT_ABOUT_ITEMS;
            } else {
                items = DEFAULT_ABOUT_ITEMS;
            }
        } catch (e) {
            items = DEFAULT_ABOUT_ITEMS;
        }

        // Asegurarse que sea array
        if (!Array.isArray(items)) items = DEFAULT_ABOUT_ITEMS;
        setAboutItems(items);

        setLoading(false);
    };

    // Manejo de items de text (Sobre Mi)
    const handleAboutItemChange = (index, field, value) => {
        const newItems = [...aboutItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setAboutItems(newItems);
    };

    const addAboutItem = () => {
        setAboutItems([...aboutItems, { title: "", description: "" }]);
    };

    const removeAboutItem = (index) => {
        if (window.confirm("¿Eliminar este bloque?")) {
            const newItems = aboutItems.filter((_, i) => i !== index);
            setAboutItems(newItems);
        }
    };

    // Manejo de imágenes
    const handleImageUpload = async (key, file) => {
        if (!file) return;
        setUploading((prev) => ({ ...prev, [key]: true }));
        try {
            const url = await siteConfigService.uploadImage(file, key);
            if (url) {
                setConfigs((prev) => ({ ...prev, [key]: url }));
                // Guardado inmediato de imagen
                await siteConfigService.updateConfig(key, url);
                alert("Imagen subida correctamente.");
            }
        } catch (error) {
            console.error(error);
            alert("Error al subir imagen.");
        } finally {
            setUploading((prev) => ({ ...prev, [key]: false }));
        }
    };

    const handleSaveAll = async () => {
        setSaving(true);
        try {
            // 1. Guardar imágenes (si hubiera cambios pendientes en updateConfig, aunque se guardan al subir)
            // 2. Guardar about_content como JSON
            const aboutJson = JSON.stringify(aboutItems);

            const promises = [
                siteConfigService.updateConfig('about_content', aboutJson),
                ...Object.entries(configs).map(([key, value]) =>
                    siteConfigService.updateConfig(key, value)
                )
            ];

            await Promise.all(promises);
            alert("Cambios guardados exitosamente.");
        } catch (error) {
            console.error(error);
            alert("Error al guardar cambios.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando configuración...</div>;

    return (
        <div className="bg-white rounded-lg shadow p-6 max-w-4xl mx-auto mb-20">
            <div className="flex justify-between items-center mb-6 border-b pb-2">
                <h2 className="text-2xl font-bold text-gray-800">Editor de Contenido</h2>
                <button
                    onClick={handleSaveAll}
                    disabled={saving}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg shadow text-white font-bold transition ${saving ? "bg-green-800 cursor-wait" : "bg-green-600 hover:bg-green-700"
                        }`}
                >
                    <Save size={20} />
                    {saving ? "Guardando..." : "Guardar Cambios"}
                </button>
            </div>

            <div className="space-y-10">
                {/* Sección Imágenes */}
                <section>
                    <h3 className="text-xl font-semibold text-gray-700 mb-4 bg-blue-50 p-2 rounded px-4">Imágenes del Sitio</h3>
                    <div className="grid gap-6">
                        {CONFIG_KEYS.map((field) => (
                            <div key={field.key} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    {field.label}
                                </label>
                                <p className="text-xs text-gray-500 mb-3">{field.description}</p>

                                <div className="flex flex-col md:flex-row gap-4 items-center">
                                    <div className="w-24 h-24 border rounded bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                                        {configs[field.key] ? (
                                            <img src={configs[field.key]} alt="Preview" className="w-full h-full object-contain" />
                                        ) : (
                                            <span className="text-gray-300 text-xs text-center">Sin imagen</span>
                                        )}
                                    </div>
                                    <div className="flex-1 w-full">
                                        <div className="flex items-center gap-2">
                                            <label className={`flex items-center gap-2 px-4 py-2 rounded cursor-pointer text-white text-sm font-medium transition w-fit ${uploading[field.key] ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                                                }`}>
                                                {uploading[field.key] ? <Loader className="animate-spin" size={16} /> : <Upload size={16} />}
                                                {uploading[field.key] ? "Subiendo..." : "Cambiar Imagen"}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageUpload(field.key, e.target.files[0])}
                                                    className="hidden"
                                                    disabled={uploading[field.key]}
                                                />
                                            </label>
                                            <span className="text-xs text-gray-400 hidden sm:block truncate flex-1">{configs[field.key]}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Sección Textos "Sobre Mí" */}
                <section>
                    <div className="flex justify-between items-center mb-4 bg-purple-50 p-2 rounded px-4">
                        <h3 className="text-xl font-semibold text-gray-700">Sección "Sobre Mí" (Textos)</h3>
                        <button
                            onClick={addAboutItem}
                            className="flex items-center gap-1 text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition"
                        >
                            <Plus size={16} /> Agregar Bloque
                        </button>
                    </div>

                    <div className="space-y-4">
                        {aboutItems.map((item, index) => (
                            <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative group hover:border-purple-300 transition">
                                <button
                                    onClick={() => removeAboutItem(index)}
                                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                                    title="Eliminar bloque"
                                >
                                    <Trash2 size={18} />
                                </button>

                                <div className="mb-3">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label>
                                    <input
                                        type="text"
                                        value={item.title}
                                        onChange={(e) => handleAboutItemChange(index, 'title', e.target.value)}
                                        className="w-full p-2 border rounded font-semibold text-gray-800 focus:ring-2 focus:ring-purple-500 outline-none"
                                        placeholder="Ej: Ingeniero Electrónico"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
                                    <textarea
                                        value={item.description}
                                        onChange={(e) => handleAboutItemChange(index, 'description', e.target.value)}
                                        className="w-full p-2 border rounded text-gray-600 h-24 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-y"
                                        placeholder="Escribe el contenido aquí..."
                                    />
                                </div>
                            </div>
                        ))}

                        {aboutItems.length === 0 && (
                            <div className="text-center p-8 text-gray-500 bg-gray-50 border border-dashed rounded-lg">
                                No hay bloques de texto. Agrega uno para comenzar.
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Action Bar Floating (Mobile friendly) */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-end md:hidden z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <button
                    onClick={handleSaveAll}
                    disabled={saving}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full shadow-lg text-white font-bold transition w-full justify-center ${saving ? "bg-green-800" : "bg-green-600"}`}
                >
                    <Save size={20} />
                    {saving ? "Guardando..." : "Guardar Cambios"}
                </button>
            </div>
        </div>
    );
};
