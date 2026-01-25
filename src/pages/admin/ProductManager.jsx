import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { Package, Upload, DollarSign, Tag, Image as ImageIcon, Edit, X, Save, Loader } from 'lucide-react';
import './ProductManager.css';

// Componente de Loading Divertido
const LoadingSpinner = () => (
    <div className="loading-container">
        <div className="plotterloader">
            <svg viewBox="0 0 100 100" width="80" height="80">
                {/* Plotter animado */}
                <rect x="10" y="30" width="80" height="40" fill="none" stroke="#6366f1" strokeWidth="2" rx="4" />
                {/* Papel */}
                <rect className="paper" x="15" y="35" width="70" height="30" fill="#fff" stroke="#9ca3af" strokeWidth="1" />
                {/* Cabezal móvil */}
                <circle className="print-head" cx="50" cy="50" r="5" fill="#6366f1" />
            </svg>
            <p>Cargando productos...</p>
        </div>
    </div>
);

export default function ProductManager() {
    const { user } = useAuth();
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [dolarOficial, setDolarOficial] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Modal de edición
    const [editModal, setEditModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Form state (para crear o editar)
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        categoria: '',
        precio_usd: '',
        precio_ars: '',
        precio_preventa_usd: '',
        precio_mayorista_usd: '',
        precio_mayorista_ars: '',
        cantidad_minima_mayorista: 1,
        stock_actual: 0,
        destacado: false,
        specs: '{}',
        combos: '{}',
        imagen: null,
        nuevasImagenes: [] // Array para múltiples imágenes
    });

    useEffect(() => {
        fetchDolar();
        fetchProductos();
        fetchCategorias();
    }, []);

    const fetchDolar = async () => {
        try {
            const res = await fetch('https://dolarapi.com/v1/dolares/oficial');
            const data = await res.json();
            setDolarOficial(data.venta);
        } catch (error) {
            console.error('Error fetching dolar:', error);
        }
    };

    const fetchProductos = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('productos')
            .select('*')
            .order('created_at', { ascending: false });
        setProductos(data || []);
        setLoading(false);
    };

    const fetchCategorias = async () => {
        const { data } = await supabase
            .from('categorias')
            .select('*')
            .eq('activo', true)
            .order('orden', { ascending: true });
        setCategorias(data || []);
    };

    const handleImageChange = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            if (files.length > 3) {
                alert('Máximo 3 imágenes permitidas');
                return;
            }
            setFormData({
                ...formData,
                nuevasImagenes: files,
                imagen: files[0] // Mantener compatibilidad con lógica anterior para preview principal
            });
        }
    };

    const handleEdit = (producto) => {
        setEditingProduct(producto);
        setFormData({
            nombre: producto.nombre || '',
            descripcion: producto.descripcion || '',
            categoria: producto.categoria || '',
            precio_usd: producto.precio_usd || '',
            precio_ars: producto.precio_ars || '',
            precio_preventa_usd: producto.precio_preventa_usd || '',
            precio_mayorista_usd: producto.precio_mayorista_usd || '',
            precio_mayorista_ars: producto.precio_mayorista_ars || '',
            cantidad_minima_mayorista: producto.cantidad_minima_mayorista || 1,
            stock_actual: producto.stock_actual || 0,
            destacado: producto.destacado || false,
            specs: JSON.stringify(producto.specs || {}, null, 2),
            combos: JSON.stringify(producto.combos || {}, null, 2),
            imagen: null,
            nuevasImagenes: []
        });
        setEditModal(true);
    };

    const closeEditModal = () => {
        setEditModal(false);
        setEditingProduct(null);
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            nombre: '',
            descripcion: '',
            categoria: '',
            precio_usd: '',
            precio_ars: '',
            precio_preventa_usd: '',
            precio_mayorista_usd: '',
            precio_mayorista_ars: '',
            cantidad_minima_mayorista: 1,
            stock_actual: 0,
            destacado: false,
            specs: '{}',
            combos: '{}',
            imagen: null,
            nuevasImagenes: []
        });
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);

        try {
            let imagenUrl = editingProduct?.imagen_url || null;
            let galeriaUrls = editingProduct?.galeria || [];

            // Si se suben nuevas imágenes
            if (formData.nuevasImagenes && formData.nuevasImagenes.length > 0) {
                const uploadedUrls = [];

                // Subir cada imagen
                for (const file of formData.nuevasImagenes) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                        .from('productos-imagenes')
                        .upload(fileName, file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('productos-imagenes')
                        .getPublicUrl(fileName);

                    uploadedUrls.push(publicUrl);
                }

                // Actualizar URLs
                galeriaUrls = uploadedUrls;
                imagenUrl = uploadedUrls[0]; // La primera es la principal
            }

            // Parsear JSON
            let specs = {};
            let combos = {};
            try {
                specs = JSON.parse(formData.specs);
                combos = JSON.parse(formData.combos);
            } catch (e) {
                alert('Error en formato JSON de Specs o Combos');
                setSubmitting(false);
                return;
            }

            const productoData = {
                nombre: formData.nombre,
                descripcion: formData.descripcion,
                categoria: formData.categoria,
                precio_usd: formData.precio_usd ? parseFloat(formData.precio_usd) : null,
                precio_ars: formData.precio_ars ? parseFloat(formData.precio_ars) : null,
                precio_preventa_usd: formData.precio_preventa_usd ? parseFloat(formData.precio_preventa_usd) : null,
                precio_mayorista_usd: formData.precio_mayorista_usd ? parseFloat(formData.precio_mayorista_usd) : null,
                precio_mayorista_ars: formData.precio_mayorista_ars ? parseFloat(formData.precio_mayorista_ars) : null,
                cantidad_minima_mayorista: formData.cantidad_minima_mayorista || 1,
                stock_actual: formData.stock_actual || 0,
                destacado: formData.destacado,
                specs,
                combos,
                imagen_url: imagenUrl,
                galeria: galeriaUrls
            };

            if (editingProduct) {
                // UPDATE
                const { error } = await supabase
                    .from('productos')
                    .update(productoData)
                    .eq('id', editingProduct.id);

                if (error) throw error;
                alert('Producto actualizado exitosamente');
                closeEditModal();
            } else {
                // INSERT
                const { error } = await supabase.from('productos').insert(productoData);

                if (error) throw error;
                alert('Producto creado exitosamente');
                resetForm();
            }

            fetchProductos();
        } catch (error) {
            console.error('Error:', error);
            alert('Error: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este producto? Se eliminará el producto y su imagen.')) return;

        try {
            // Obtener el producto para conseguir la URL de la imagen
            const producto = productos.find(p => p.id === id);

            // Eliminar imagen del Storage si existe
            if (producto?.imagen_url) {
                // Extraer nombre del archivo de la URL
                // URL formato: https://...supabase.co/storage/v1/object/public/productos-imagenes/1234567890.jpg
                const urlParts = producto.imagen_url.split('/');
                const fileName = urlParts[urlParts.length - 1];

                const { error: storageError } = await supabase.storage
                    .from('productos-imagenes')
                    .remove([fileName]);

                if (storageError) {
                    console.error('Error eliminando imagen:', storageError);
                    // Continuar eliminando el producto aunque falle la imagen
                }
            }

            // Eliminar producto de la tabla
            const { error } = await supabase
                .from('productos')
                .delete()
                .eq('id', id);

            if (error) throw error;

            alert('✅ Producto e imagen eliminados exitosamente');
            fetchProductos();
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error al eliminar: ' + error.message);
        }
    };

    const precioARS = formData.precio_usd && dolarOficial
        ? (parseFloat(formData.precio_usd) * dolarOficial).toFixed(2)
        : '0.00';

    const precioMayoristaARS = formData.precio_mayorista_usd && dolarOficial
        ? (parseFloat(formData.precio_mayorista_usd) * dolarOficial).toFixed(2)
        : '0.00';

    return (
        <div className="product-manager">
            <div className="product-header">
                <div>
                    <h1>Gestión de Productos</h1>
                    <p className="user-indicator">
                        Logueado como: <strong>{user?.email}</strong>
                    </p>
                    {dolarOficial && (
                        <p className="dolar-indicator">
                            Dólar Oficial: <strong>${dolarOficial}</strong>
                        </p>
                    )}
                </div>
            </div>

            <div className="product-grid">
                {/* Formulario CREAR */}
                <div className="product-form-card">
                    <h2>
                        <Package size={24} />
                        Agregar Producto
                    </h2>

                    <form onSubmit={handleSubmit} className="product-form">
                        <div className="form-field">
                            <label>Nombre del Producto *</label>
                            <input
                                type="text"
                                required
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                placeholder="Plotter HP45 tizado digital"
                            />
                        </div>

                        <div className="form-field">
                            <label>Descripción</label>
                            <textarea
                                rows="3"
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                placeholder="Descripción del producto..."
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-field">
                                <label>Categoría *</label>
                                <select
                                    value={formData.categoria}
                                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccionar...</option>
                                    {categorias.map((cat) => (
                                        <option key={cat.id} value={cat.nombre}>
                                            {cat.nombre}
                                        </option>
                                    ))}
                                </select>
                                {categorias.length === 0 && (
                                    <small style={{ color: '#ef4444' }}>
                                        ⚠️ No hay categorías. Créalas primero en la pestaña "Categorías"
                                    </small>
                                )}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-field">
                                <label>
                                    <DollarSign size={18} />
                                    Precio en USD
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.precio_usd}
                                    onChange={(e) => setFormData({ ...formData, precio_usd: e.target.value })}
                                    placeholder="299.99"
                                />
                                {formData.precio_usd && dolarOficial && (
                                    <p className="price-preview">
                                        Conversión ARS: <strong>${precioARS}</strong>
                                    </p>
                                )}
                            </div>

                            <div className="form-field">
                                <label>
                                    💵 Precio en ARS
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.precio_ars}
                                    onChange={(e) => setFormData({ ...formData, precio_ars: e.target.value })}
                                    placeholder="50000.00"
                                />
                                {!formData.precio_usd && !formData.precio_ars && (
                                    <small style={{ color: '#ef4444' }}>
                                        ⚠️ Debes ingresar al menos USD o ARS
                                    </small>
                                )}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-field">
                                <label>Precio Mayorista USD</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.precio_mayorista_usd}
                                    onChange={(e) => setFormData({ ...formData, precio_mayorista_usd: e.target.value })}
                                    placeholder="249.99"
                                />
                                {formData.precio_mayorista_usd && dolarOficial && (
                                    <p className="price-preview">
                                        Conversión ARS: <strong>${precioMayoristaARS}</strong>
                                    </p>
                                )}
                            </div>

                            <div className="form-field">
                                <label>💵 Precio Mayorista ARS</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.precio_mayorista_ars}
                                    onChange={(e) => setFormData({ ...formData, precio_mayorista_ars: e.target.value })}
                                    placeholder="45000.00"
                                />
                            </div>
                        </div>

                        <div className="form-field">
                            <label>
                                <ImageIcon size={18} />
                                Imágenes del Producto (Máx 3)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                className="file-input"
                            />
                            {formData.nuevasImagenes.length > 0 && (
                                <div className="file-preview-list" style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {formData.nuevasImagenes.map((file, idx) => (
                                        <div key={idx} className="preview-item">
                                            <span style={{ fontSize: '12px' }}>{file.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '30px', textAlign: 'center' }}>
                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    width: '100%',
                                    padding: '12px 20px',
                                    background: '#2563eb', // Vivid Blue
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)'
                                }}
                            >
                                <Upload size={20} />
                                {submitting ? 'GUARDANDO...' : 'GUARDAR PRODUCTO'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Lista de productos */}
                <div className="products-list-card">
                    <h2>Productos Registrados ({productos.length})</h2>

                    {loading ? (
                        <LoadingSpinner />
                    ) : (
                        <div className="products-list">
                            {productos.map((producto) => (
                                <div key={producto.id} className="product-item">
                                    {producto.imagen_url && (
                                        <img src={producto.imagen_url} alt={producto.nombre} />
                                    )}
                                    <div className="product-info">
                                        <h3>{producto.nombre}</h3>
                                        <p className="product-category">{producto.categoria}</p>
                                        <p className="product-price">
                                            USD ${producto.precio_usd}
                                            {dolarOficial && (
                                                <span> (ARS ${(producto.precio_usd * dolarOficial).toFixed(2)})</span>
                                            )}
                                        </p>
                                        {producto.precio_mayorista_usd && (
                                            <p className="product-wholesale">
                                                Mayorista: USD ${producto.precio_mayorista_usd}
                                                ({producto.cantidad_minima_mayorista}+ unidades)
                                            </p>
                                        )}
                                    </div>
                                    <div className="product-actions">
                                        <button onClick={() => handleEdit(producto)} className="btn-edit">
                                            <Edit size={16} /> Editar
                                        </button>
                                        <button onClick={() => handleDelete(producto.id)} className="btn-delete">
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DE EDICIÓN */}
            {editModal && (
                <div className="modal-overlay" onClick={closeEditModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit Product: {editingProduct?.nombre}</h2>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <button
                                    onClick={() => handleSubmit()}
                                    disabled={submitting}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        padding: '8px 16px',
                                        background: '#16a34a',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    <Save size={16} /> Guardar
                                </button>
                                <button onClick={closeEditModal} className="btn-close">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="modal-body">
                                <div className="form-field">
                                    <label>Nombre *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Descripción</label>
                                    <textarea
                                        rows="3"
                                        value={formData.descripcion}
                                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-field">
                                        <label>Categoría *</label>
                                        <select
                                            value={formData.categoria}
                                            onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                            required
                                        >
                                            <option value="">Seleccionar...</option>
                                            {categorias.map((cat) => (
                                                <option key={cat.id} value={cat.nombre}>
                                                    {cat.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-field">
                                        <label>Precio USD</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.precio_usd}
                                            onChange={(e) => setFormData({ ...formData, precio_usd: e.target.value })}
                                            placeholder="299.99"
                                        />
                                        {formData.precio_usd && dolarOficial && (
                                            <p className="price-preview">
                                                ARS: <strong>${precioARS}</strong>
                                            </p>
                                        )}
                                    </div>

                                    <div className="form-field">
                                        <label>Precio ARS</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.precio_ars}
                                            onChange={(e) => setFormData({ ...formData, precio_ars: e.target.value })}
                                            placeholder="50000.00"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-field">
                                        <label>Precio Preventa USD</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.precio_preventa_usd}
                                            onChange={(e) => setFormData({ ...formData, precio_preventa_usd: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-field">
                                        <label>Precio Mayorista USD</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.precio_mayorista_usd}
                                            onChange={(e) => setFormData({ ...formData, precio_mayorista_usd: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label>Precio Mayorista ARS</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.precio_mayorista_ars}
                                            onChange={(e) => setFormData({ ...formData, precio_mayorista_ars: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-field">
                                        <label>Stock Actual</label>
                                        <input
                                            type="number"
                                            value={formData.stock_actual}
                                            onChange={(e) => setFormData({ ...formData, stock_actual: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>

                                    <div className="form-field checkbox-field">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={formData.destacado}
                                                onChange={(e) => setFormData({ ...formData, destacado: e.target.checked })}
                                            />
                                            Producto destacado
                                        </label>
                                    </div>
                                </div>

                                <div className="form-field">
                                    <label>Specs (JSON)</label>
                                    <textarea
                                        rows="4"
                                        value={formData.specs}
                                        onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
                                        placeholder='{"procesador": "AMD Athlon", "ram": "8GB"}'
                                        style={{ fontFamily: 'monospace', fontSize: '13px' }}
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Combos (JSON)</label>
                                    <textarea
                                        rows="4"
                                        value={formData.combos}
                                        onChange={(e) => setFormData({ ...formData, combos: e.target.value })}
                                        placeholder='{"combo5u": 12000, "combo15u": 11500}'
                                        style={{ fontFamily: 'monospace', fontSize: '13px' }}
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Cambiar Imágenes (Máx 3)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageChange}
                                        className="file-input"
                                    />
                                    {/* Preview de imágenes existentes */}
                                    {editingProduct?.galeria && editingProduct.galeria.length > 0 ? (
                                        <div style={{ display: 'flex', gap: '5px', marginTop: '10px', overflowX: 'auto' }}>
                                            {editingProduct.galeria.map((url, idx) => (
                                                <img key={idx} src={url} alt={`Img ${idx}`} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                                            ))}
                                        </div>
                                    ) : (
                                        editingProduct?.imagen_url && !formData.nuevasImagenes.length && (
                                            <img src={editingProduct.imagen_url} alt="Current" style={{ width: '100px', marginTop: '10px' }} />
                                        )
                                    )}

                                    {/* Preview de nuevas imágenes seleccionadas */}
                                    {formData.nuevasImagenes.length > 0 && (
                                        <div style={{ marginTop: '10px' }}>
                                            <p style={{ fontSize: '12px', fontWeight: 'bold' }}>Nuevas seleccionadas:</p>
                                            <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                                                {formData.nuevasImagenes.map((file, idx) => (
                                                    <div key={idx} style={{ width: '60px', height: '60px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', border: '1px solid #ccc' }}>
                                                        {file.name.slice(0, 10)}...
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>
                            <div className="modal-footer">
                                <button type="submit" disabled={submitting} className="submit-button">
                                    <Save size={18} />
                                    {submitting ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
