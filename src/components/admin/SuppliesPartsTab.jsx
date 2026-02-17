import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Package, Search, PlusCircle, Edit, Trash2, X, Save, AlertCircle, Plus, Minus, Upload as UploadIcon } from 'lucide-react';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import { compressImage } from '../../utils/imageCompression';
import './SuppliesPartsTab.css';

/**
 * Componente para gestionar repuestos, insumos y mercaderías
 * Diseño mobile-first con cards en móvil y tabla en desktop
 */
export default function SuppliesPartsTab() {
    const { exchangeRate, loading: rateLoading } = useExchangeRate();

    // Estado Principal
    const [supplies, setSupplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [filter, setFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    // Estados de formulario
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [form, setForm] = useState({
        item_code: '',
        name: '',
        description: '',
        category: 'repuesto',
        photo_url: '',
        color: '',
        ctn_size: '',
        ctn_quantity: '',
        cost_per_unit_usd: '',
        cost_per_unit_ars: '',
        total_cost_usd: '',
        total_cost_ars: '',
        supplier: '',
        supplier_contact: '',
        purchase_date: new Date().toISOString().split('T')[0],
        exchange_rate: '',
        exchange_rate_source: 'blue',
        quantity_purchased: '',
        quantity_in_stock: '',
        min_stock_alert: '',
        observations: ''
    });

    // Estado para imagen
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Modal de ajuste de stock
    const [showStockModal, setShowStockModal] = useState(false);
    const [stockModalItem, setStockModalItem] = useState(null);
    const [stockAdjustment, setStockAdjustment] = useState('');
    const [stockOperation, setStockOperation] = useState('add'); // 'add' | 'subtract'

    // Cargar datos
    useEffect(() => {
        fetchSupplies();
    }, []);

    // Auto-fill exchange rate
    useEffect(() => {
        if (exchangeRate && !form.exchange_rate) {
            setForm(prev => ({ ...prev, exchange_rate: exchangeRate }));
        }
    }, [exchangeRate]);

    const fetchSupplies = async () => {
        try {
            const { data, error } = await supabase
                .from('supplies_parts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSupplies(data || []);
        } catch (error) {
            console.error('Error fetching supplies:', error);
            alert('Error al cargar repuestos');
        } finally {
            setLoading(false);
        }
    };

    // Calcular totales automáticamente
    useEffect(() => {
        const quantity = parseFloat(form.quantity_purchased) || 0;
        const costUSD = parseFloat(form.cost_per_unit_usd) || 0;
        const costARS = parseFloat(form.cost_per_unit_ars) || 0;

        setForm(prev => ({
            ...prev,
            total_cost_usd: quantity && costUSD ? (quantity * costUSD).toFixed(2) : '',
            total_cost_ars: quantity && costARS ? (quantity * costARS).toFixed(2) : ''
        }));
    }, [form.quantity_purchased, form.cost_per_unit_usd, form.cost_per_unit_ars]);

    // Manejar selección de imagen
    const handleImageSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tipo
        if (!file.type.startsWith('image/')) {
            alert('Por favor selecciona una imagen válida');
            return;
        }

        // Validar tamaño (máx 10MB antes de comprimir)
        if (file.size > 10 * 1024 * 1024) {
            alert('La imagen es demasiado grande. Máximo 10MB');
            return;
        }

        // Crear preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Guardar file para upload posterior
        setImageFile(file);
    };

    // Subir imagen a Supabase Storage
    const uploadImage = async () => {
        if (!imageFile) return null;

        try {
            setUploadingImage(true);

            // Comprimir imagen
            const compressedBlob = await compressImage(imageFile, {
                maxWidth: 800,
                maxHeight: 800,
                quality: 0.7
            });

            // Generar nombre único
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `supplies/${fileName}`;

            // Subir a Supabase
            const { data, error } = await supabase.storage
                .from('productos-imagenes')
                .upload(filePath, compressedBlob, {
                    contentType: 'image/jpeg',
                    cacheControl: '3600'
                });

            if (error) throw error;

            // Obtener URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('productos-imagenes')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error al subir imagen: ' + error.message);
            return null;
        } finally {
            setUploadingImage(false);
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.category) {
            alert('Nombre y categoría son obligatorios');
            return;
        }

        setSubmitting(true);
        try {
            // Si hay una nueva imagen, subirla primero
            let imageUrl = form.photo_url;
            if (imageFile) {
                const uploadedUrl = await uploadImage();
                if (uploadedUrl) {
                    imageUrl = uploadedUrl;
                }
            }

            const payload = {
                ...form,
                photo_url: imageUrl,
                cost_per_unit_usd: form.cost_per_unit_usd ? parseFloat(form.cost_per_unit_usd) : null,
                cost_per_unit_ars: form.cost_per_unit_ars ? parseFloat(form.cost_per_unit_ars) : null,
                total_cost_usd: form.total_cost_usd ? parseFloat(form.total_cost_usd) : null,
                total_cost_ars: form.total_cost_ars ? parseFloat(form.total_cost_ars) : null,
                exchange_rate: form.exchange_rate ? parseFloat(form.exchange_rate) : null,
                ctn_quantity: form.ctn_quantity ? parseInt(form.ctn_quantity) : null,
                quantity_purchased: form.quantity_purchased ? parseInt(form.quantity_purchased) : 0,
                quantity_in_stock: form.quantity_in_stock ? parseInt(form.quantity_in_stock) : 0,
                min_stock_alert: form.min_stock_alert ? parseInt(form.min_stock_alert) : null
            };

            let result;
            if (editingItem) {
                result = await supabase
                    .from('supplies_parts')
                    .update(payload)
                    .eq('id', editingItem.id);
            } else {
                result = await supabase
                    .from('supplies_parts')
                    .insert([payload]);
            }

            if (result.error) throw result.error;

            alert(editingItem ? '✅ Repuesto actualizado' : '✅ Repuesto agregado');
            resetForm();
            fetchSupplies();
        } catch (error) {
            console.error('Error saving supply:', error);
            alert('Error al guardar: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar este repuesto?')) return;

        try {
            const { error } = await supabase
                .from('supplies_parts')
                .delete()
                .eq('id', id);

            if (error) throw error;
            alert('✅ Repuesto eliminado');
            fetchSupplies();
        } catch (error) {
            console.error('Error deleting supply:', error);
            alert('Error al eliminar');
        }
    };

    const handleEdit = (item) => {
        setForm({
            item_code: item.item_code || '',
            name: item.name || '',
            description: item.description || '',
            category: item.category || 'repuesto',
            photo_url: item.photo_url || '',
            color: item.color || '',
            ctn_size: item.ctn_size || '',
            ctn_quantity: item.ctn_quantity || '',
            cost_per_unit_usd: item.cost_per_unit_usd || '',
            cost_per_unit_ars: item.cost_per_unit_ars || '',
            total_cost_usd: item.total_cost_usd || '',
            total_cost_ars: item.total_cost_ars || '',
            supplier: item.supplier || '',
            supplier_contact: item.supplier_contact || '',
            purchase_date: item.purchase_date || new Date().toISOString().split('T')[0],
            exchange_rate: item.exchange_rate || '',
            exchange_rate_source: item.exchange_rate_source || 'blue',
            quantity_purchased: item.quantity_purchased || '',
            quantity_in_stock: item.quantity_in_stock || '',
            min_stock_alert: item.min_stock_alert || '',
            observations: item.observations || ''
        });
        setEditingItem(item);
        setShowForm(true);
        // Limpiar nueva selección de imagen para edición
        setImageFile(null);
        setImagePreview(null);
    };

    const handleStockAdjust = async () => {
        if (!stockAdjustment || isNaN(stockAdjustment) || parseInt(stockAdjustment) <= 0) {
            alert('Ingresa una cantidad válida');
            return;
        }

        const adjustment = parseInt(stockAdjustment);
        const currentStock = stockModalItem.quantity_in_stock || 0;
        const newStock = stockOperation === 'add'
            ? currentStock + adjustment
            : Math.max(0, currentStock - adjustment);

        try {
            const { error } = await supabase
                .from('supplies_parts')
                .update({ quantity_in_stock: newStock })
                .eq('id', stockModalItem.id);

            if (error) throw error;

            alert('✅ Stock actualizado');
            setShowStockModal(false);
            setStockModalItem(null);
            setStockAdjustment('');
            fetchSupplies();
        } catch (error) {
            console.error('Error adjusting stock:', error);
            alert('Error al ajustar stock');
        }
    };

    const resetForm = () => {
        setForm({
            item_code: '',
            name: '',
            description: '',
            category: 'repuesto',
            photo_url: '',
            color: '',
            ctn_size: '',
            ctn_quantity: '',
            cost_per_unit_usd: '',
            cost_per_unit_ars: '',
            total_cost_usd: '',
            total_cost_ars: '',
            supplier: '',
            supplier_contact: '',
            purchase_date: new Date().toISOString().split('T')[0],
            exchange_rate: exchangeRate || '',
            exchange_rate_source: 'blue',
            quantity_purchased: '',
            quantity_in_stock: '',
            min_stock_alert: '',
            observations: ''
        });
        setEditingItem(null);
        setShowForm(false);
        // Limpiar estados de imagen
        setImageFile(null);
        setImagePreview(null);
    };

    const openStockModal = (item) => {
        setStockModalItem(item);
        setStockOperation('add');
        setStockAdjustment('');
        setShowStockModal(true);
    };

    // Filtrado
    const filteredSupplies = supplies.filter(item => {
        const matchesSearch = item.name?.toLowerCase().includes(filter.toLowerCase()) ||
            item.item_code?.toLowerCase().includes(filter.toLowerCase()) ||
            item.description?.toLowerCase().includes(filter.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const getCategoryLabel = (cat) => {
        const labels = {
            'repuesto': 'Repuesto',
            'insumo': 'Insumo',
            'mercaderia': 'Mercadería',
            'materia_prima': 'Materia Prima',
            'otro': 'Otro'
        };
        return labels[cat] || cat;
    };

    const isLowStock = (item) => {
        return item.min_stock_alert && item.quantity_in_stock <= item.min_stock_alert;
    };

    if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Cargando...</div>;

    return (
        <div className="supplies-tab">
            {/* Header con botón agregar */}
            <div className="supplies-header">
                <button
                    className="btn-add-supply"
                    onClick={() => setShowForm(!showForm)}
                >
                    <PlusCircle size={18} />
                    {showForm ? 'Cerrar Formulario' : 'Nuevo Repuesto'}
                </button>
            </div>

            {/* Formulario Colapsable */}
            {showForm && (
                <form className="supply-form" onSubmit={handleSubmit}>
                    <div className="form-header">
                        <h3>{editingItem ? 'Editar Repuesto' : 'Nuevo Repuesto'}</h3>
                        <button type="button" onClick={resetForm} className="btn-close-form">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="form-grid">
                        {/* Identificación */}
                        <div className="form-section">
                            <h4>📦 Identificación</h4>
                            <input
                                type="text"
                                placeholder="Código HS/NCM o interno *"
                                value={form.item_code}
                                onChange={e => setForm({ ...form, item_code: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Nombre del repuesto *"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                            />
                            <textarea
                                placeholder="Descripción detallada"
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                rows="3"
                            />
                            <select
                                value={form.category}
                                onChange={e => setForm({ ...form, category: e.target.value })}
                                required
                            >
                                <option value="repuesto">Repuesto</option>
                                <option value="insumo">Insumo</option>
                                <option value="mercaderia">Mercadería</option>
                                <option value="materia_prima">Materia Prima</option>
                                <option value="otro">Otro</option>
                            </select>
                        </div>

                        {/* Características */}
                        <div className="form-section">
                            <h4>🎨 Características</h4>
                            <input
                                type="text"
                                placeholder="Color"
                                value={form.color}
                                onChange={e => setForm({ ...form, color: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Tamaño de caja/empaque"
                                value={form.ctn_size}
                                onChange={e => setForm({ ...form, ctn_size: e.target.value })}
                            />
                            <input
                                type="number"
                                placeholder="Unidades por caja"
                                value={form.ctn_quantity}
                                onChange={e => setForm({ ...form, ctn_quantity: e.target.value })}
                                min="0"
                            />

                            {/* Upload de Imagen */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label htmlFor="imageUpload" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 12px',
                                    border: '1px dashed #cbd5e1',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    background: '#f8fafc',
                                    transition: 'all 0.2s'
                                }}>
                                    <UploadIcon size={16} />
                                    <span style={{ fontSize: '14px', color: '#475569' }}>
                                        {imageFile ? imageFile.name : 'Subir foto del producto'}
                                    </span>
                                </label>
                                <input
                                    id="imageUpload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    style={{ display: 'none' }}
                                />

                                {/* Preview de la imagen */}
                                {(imagePreview || form.photo_url) && (
                                    <div style={{ position: 'relative', width: '100%', maxWidth: '200px' }}>
                                        <img
                                            src={imagePreview || form.photo_url}
                                            alt="Preview"
                                            style={{
                                                width: '100%',
                                                height: 'auto',
                                                borderRadius: '6px',
                                                border: '1px solid #e2e8f0'
                                            }}
                                        />
                                        {imagePreview && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImageFile(null);
                                                    setImagePreview(null);
                                                }}
                                                style={{
                                                    position: 'absolute',
                                                    top: '4px',
                                                    right: '4px',
                                                    background: '#ef4444',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    padding: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Costos */}
                        <div className="form-section">
                            <h4>💰 Costos</h4>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Costo unitario USD"
                                value={form.cost_per_unit_usd}
                                onChange={e => setForm({ ...form, cost_per_unit_usd: e.target.value })}
                            />
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Costo unitario ARS *"
                                value={form.cost_per_unit_ars}
                                onChange={e => setForm({ ...form, cost_per_unit_ars: e.target.value })}
                                required
                            />
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Tipo de cambio"
                                value={form.exchange_rate}
                                onChange={e => setForm({ ...form, exchange_rate: e.target.value })}
                            />
                            <select
                                value={form.exchange_rate_source}
                                onChange={e => setForm({ ...form, exchange_rate_source: e.target.value })}
                            >
                                <option value="blue">Dólar Blue</option>
                                <option value="oficial">Dólar Oficial</option>
                                <option value="manual">Manual</option>
                            </select>

                            {/* Display de Totales Calculados */}
                            {(form.total_cost_usd || form.total_cost_ars) && (
                                <div style={{
                                    padding: '12px',
                                    background: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                    borderRadius: '6px',
                                    marginTop: '8px'
                                }}>
                                    <div style={{ fontSize: '12px', color: '#15803d', fontWeight: '600', marginBottom: '6px' }}>
                                        💵 Costo Total de la Compra
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {form.total_cost_ars && (
                                            <div style={{ fontSize: '14px', color: '#15803d' }}>
                                                <strong>ARS:</strong> ${parseFloat(form.total_cost_ars).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                        )}
                                        {form.total_cost_usd && (
                                            <div style={{ fontSize: '14px', color: '#15803d' }}>
                                                <strong>USD:</strong> ${parseFloat(form.total_cost_usd).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Proveedor */}
                        <div className="form-section">
                            <h4>🏪 Proveedor</h4>
                            <input
                                type="text"
                                placeholder="Nombre del proveedor"
                                value={form.supplier}
                                onChange={e => setForm({ ...form, supplier: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Contacto del proveedor"
                                value={form.supplier_contact}
                                onChange={e => setForm({ ...form, supplier_contact: e.target.value })}
                            />
                            <input
                                type="date"
                                value={form.purchase_date}
                                onChange={e => setForm({ ...form, purchase_date: e.target.value })}
                            />
                        </div>

                        {/* Stock */}
                        <div className="form-section">
                            <h4>📊 Inventario</h4>
                            <input
                                type="number"
                                placeholder="Cantidad comprada *"
                                value={form.quantity_purchased}
                                onChange={e => setForm({ ...form, quantity_purchased: e.target.value })}
                                min="0"
                                required
                            />
                            <input
                                type="number"
                                placeholder="Stock actual *"
                                value={form.quantity_in_stock}
                                onChange={e => setForm({ ...form, quantity_in_stock: e.target.value })}
                                min="0"
                                required
                            />
                            <input
                                type="number"
                                placeholder="Nivel mínimo de alerta"
                                value={form.min_stock_alert}
                                onChange={e => setForm({ ...form, min_stock_alert: e.target.value })}
                                min="0"
                            />
                            <textarea
                                placeholder="Observaciones"
                                value={form.observations}
                                onChange={e => setForm({ ...form, observations: e.target.value })}
                                rows="2"
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={resetForm} className="btn-cancel">
                            Cancelar
                        </button>
                        <button type="submit" className="btn-submit" disabled={submitting}>
                            <Save size={16} />
                            {submitting ? 'Guardando...' : (editingItem ? 'Actualizar' : 'Guardar')}
                        </button>
                    </div>
                </form>
            )}

            {/* Filtros */}
            <div className="supplies-filters">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, código..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    />
                </div>
                <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="category-filter"
                >
                    <option value="all">Todas las categorías</option>
                    <option value="repuesto">Repuestos</option>
                    <option value="insumo">Insumos</option>
                    <option value="mercaderia">Mercaderías</option>
                    <option value="materia_prima">Materia Prima</option>
                    <option value="otro">Otros</option>
                </select>
            </div>

            {/* Lista Mobile + Desktop */}
            {filteredSupplies.length === 0 ? (
                <div className="empty-state">
                    <Package size={48} />
                    <p>No hay repuestos registrados</p>
                </div>
            ) : (
                <>
                    {/* Vista Mobile: Cards */}
                    <div className="supplies-cards mobile-only">
                        {filteredSupplies.map(item => (
                            <div key={item.id} className={`supply-card ${isLowStock(item) ? 'low-stock' : ''}`}>
                                {item.photo_url && (
                                    <img src={item.photo_url} alt={item.name} className="card-image" />
                                )}
                                <div className="card-content">
                                    <div className="card-header">
                                        <h3>{item.name}</h3>
                                        <span className="category-badge">{getCategoryLabel(item.category)}</span>
                                    </div>
                                    <p className="item-code">{item.item_code}</p>

                                    <div className="stock-info">
                                        <span className="stock-label">Stock:</span>
                                        <span className="stock-value">
                                            {item.quantity_in_stock} unidades
                                            {isLowStock(item) && <AlertCircle size={16} color="#ef4444" />}
                                        </span>
                                    </div>

                                    <div className="price-info">
                                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                                            <strong>{item.quantity_purchased || 0} uds</strong> compradas
                                        </div>
                                        {item.cost_per_unit_usd && (
                                            <span className="price-usd">
                                                ${parseFloat(item.cost_per_unit_usd).toFixed(2)} USD/ud
                                            </span>
                                        )}
                                        {item.total_cost_usd && (
                                            <span className="price-total" style={{
                                                background: '#d1fae5',
                                                color: '#065f46',
                                                padding: '6px 10px',
                                                borderRadius: '6px',
                                                fontSize: '13px',
                                                fontWeight: '600'
                                            }}>
                                                Total: ${parseFloat(item.total_cost_usd).toFixed(2)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="card-actions">
                                        <button onClick={() => handleEdit(item)} title="Editar">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => openStockModal(item)} title="Ajustar Stock">
                                            ±
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} title="Eliminar" className="btn-delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Vista Desktop: Tabla */}
                    <div className="supplies-table desktop-only">
                        <table>
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Nombre</th>
                                    <th>Categoría</th>
                                    <th>Stock</th>
                                    <th>Cantidad Comprada</th>
                                    <th>Precio Unitario (USD)</th>
                                    <th>Total Compra (USD)</th>
                                    <th>Proveedor</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSupplies.map(item => (
                                    <tr key={item.id} className={isLowStock(item) ? 'low-stock-row' : ''}>
                                        <td>{item.item_code}</td>
                                        <td>
                                            <strong>{item.name}</strong>
                                            {item.description && <br />}
                                            <small>{item.description}</small>
                                        </td>
                                        <td>
                                            <span className="category-badge">{getCategoryLabel(item.category)}</span>
                                        </td>
                                        <td>
                                            {item.quantity_in_stock}
                                            {isLowStock(item) && <AlertCircle size={14} color="#ef4444" style={{ marginLeft: 5 }} />}
                                        </td>
                                        <td style={{ fontWeight: '600' }}>
                                            {item.quantity_purchased || 0} uds
                                        </td>
                                        <td style={{ color: '#0369a1' }}>
                                            {item.cost_per_unit_usd ? `$${parseFloat(item.cost_per_unit_usd).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                                        </td>
                                        <td style={{ fontWeight: '600', color: '#15803d' }}>
                                            {item.total_cost_usd ? `$${parseFloat(item.total_cost_usd).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                                        </td>
                                        <td>{item.supplier || '-'}</td>
                                        <td className="actions-cell">
                                            <button onClick={() => handleEdit(item)} className="btn-icon" title="Editar">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => openStockModal(item)} className="btn-icon" title="Ajustar Stock">
                                                ±
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="btn-icon btn-delete" title="Eliminar">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Modal de Ajuste de Stock */}
            {showStockModal && stockModalItem && (
                <div className="modal-overlay">
                    <div className="modal-content stock-modal">
                        <div className="modal-header">
                            <h3>Ajustar Stock</h3>
                            <button onClick={() => setShowStockModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p><strong>{stockModalItem.name}</strong></p>
                            <p>Stock actual: <strong>{stockModalItem.quantity_in_stock}</strong> unidades</p>

                            <div className="stock-operation-selector">
                                <button
                                    className={stockOperation === 'add' ? 'active' : ''}
                                    onClick={() => setStockOperation('add')}
                                >
                                    <Plus size={16} /> Agregar
                                </button>
                                <button
                                    className={stockOperation === 'subtract' ? 'active' : ''}
                                    onClick={() => setStockOperation('subtract')}
                                >
                                    <Minus size={16} /> Restar
                                </button>
                            </div>

                            <input
                                type="number"
                                placeholder="Cantidad"
                                value={stockAdjustment}
                                onChange={e => setStockAdjustment(e.target.value)}
                                min="1"
                                autoFocus
                            />
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowStockModal(false)}>
                                Cancelar
                            </button>
                            <button className="btn-submit" onClick={handleStockAdjust}>
                                <Save size={16} /> Aplicar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
