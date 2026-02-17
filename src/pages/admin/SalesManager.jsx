import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Package, ShoppingCart, Upload, Search, FileText, LayoutDashboard, PlusCircle, CheckCircle, Smartphone, Edit, Trash2, X, Save } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import ExchangeRateConfig from '../../components/admin/ExchangeRateConfig';
import FinanceTabs from '../../components/admin/FinanceTabs';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import './SalesManager.css';

export default function SalesManager({ showHeaderAndExchange = true }) {
    const [mode, setMode] = useState('entry'); // 'entry' | 'sale'
    const [viewMode, setViewMode] = useState('stock'); // 'stock' | 'sold'
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [filter, setFilter] = useState('');

    // Editing State
    const [editingItem, setEditingItem] = useState(null);
    const [editForm, setEditForm] = useState({});

    // Mobile UX State
    const [formExpanded, setFormExpanded] = useState(false); // Controla si el formulario está visible en mobile
    const [showDetailModal, setShowDetailModal] = useState(false); // Modal de detalle
    const [selectedItem, setSelectedItem] = useState(null); // Item seleccionado para el modal

    // Data
    const [products, setProducts] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [availableItems, setAvailableItems] = useState([]);

    // Forms
    const [entryForm, setEntryForm] = useState({
        product_id: '',
        serial_number: '',
        model_variant: '',
        cost_usd: '',
        cost_ars: '', // NEW
        purchase_date: new Date().toISOString().split('T')[0]
    });

    const [saleForm, setSaleForm] = useState({
        filter_product_id: '',
        serial_input: '',
        client_name: '',
        client_dni: '', // NEW
        sale_price_usd: '',
        sale_price_ars: '',
        sale_date: new Date().toISOString().split('T')[0],
        files: [], // Contratos/documentos
        observations: '', // NUEVO: Observaciones
        amount_paid_ars: '', // NUEVO: Monto pagado
        payment_status: 'pending', // NUEVO: Estado de pago
        product_images: [] // NUEVO: Imágenes del producto (separado de files)
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        await Promise.all([
            fetchProducts(),
            fetchInventory()
        ]);
        setLoading(false);
    };

    const fetchProducts = async () => {
        const { data } = await supabase.from('productos').select('id, nombre').order('nombre');
        setProducts(data || []);
    };

    const fetchInventory = async () => {
        // Use RPC to bypass potential table cache issues
        const { data, error } = await supabase.rpc('get_inventory');

        if (error) {
            console.error('Error fetching inventory:', error);
            // Fallback to table just in case, but RPC should work
            const { data: tableData } = await supabase.from('inventory_items')
                .select('*, productos(nombre)')
                .order('created_at', { ascending: false });
            setInventory(tableData || []);
            setAvailableItems(tableData?.filter(i => i.status === 'available') || []);
            return;
        }

        const mappedData = data.map(item => ({
            ...item,
            productos: { nombre: item.product_name } // Map back to structure expected by UI
        }));

        setInventory(mappedData || []);
        setAvailableItems(mappedData?.filter(i => i.status === 'available') || []);
    };

    // --- Helpers for Price Formatting ---
    const formatNumber = (value) => {
        if (!value) return '';
        // Remove existing dots to get raw number
        const raw = value.toString().replace(/\./g, '');
        // Check if it's a valid number
        if (isNaN(raw)) return value;
        // Format with dots
        return new Intl.NumberFormat('es-AR').format(raw);
    };

    const cleanNumber = (value) => {
        if (!value) return 0;
        // Remove dots and convert to float (replace comma with dot if user typed comma for decimals)
        return parseFloat(value.toString().replace(/\./g, '').replace(',', '.')) || 0;
    };

    const handlePriceChange = (e, form, setForm, field) => {
        let val = e.target.value;
        // Allow only numbers and separators
        const raw = val.replace(/[^0-9,.]/g, '');

        // Simple logic: remove dots, then re-format
        // Strategy: We store the STRING with dots in the form state.
        // When user types, we strip dots, get raw string, then add dots back.

        const digits = raw.replace(/\./g, '');

        // If user is trying to type decimals with comma, handle separately or just integer for now as per request?
        // User asked "each 3 digits add dot", implies integer thousands separator. 
        // Let's support integers mainly, but keep decimal char just in case if needed later. 
        // For 'es-AR' NumberFormat default is thousands=dot, decimal=comma.

        if (digits === '') {
            setForm({ ...form, [field]: '' });
            return;
        }

        // Use Intl to format
        // catch weird edge cases like trailing commas
        const formatted = new Intl.NumberFormat('es-AR').format(digits);
        setForm({ ...form, [field]: formatted });
    };

    // --- SUBMIT HANDLERS ---
    const handleEntrySubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Use RPC for entries too
            const { error } = await supabase.rpc('register_entry', {
                p_product_id: entryForm.product_id,
                p_serial_number: entryForm.serial_number,
                p_model_variant: entryForm.model_variant,
                p_cost_usd: cleanNumber(entryForm.cost_usd),
                p_cost_ars: cleanNumber(entryForm.cost_ars), // NEW
                p_purchase_date: entryForm.purchase_date
            });

            if (error) throw error;
            alert('Entrada guardada.');
            setEntryForm({ ...entryForm, serial_number: '', model_variant: '', cost_usd: '', cost_ars: '' });
            fetchInventory();
        } catch (err) { alert(err.message); }
        finally { setSubmitting(false); }
    };

    const handleSaleSubmit = async (e) => {
        e.preventDefault();
        // Validation: Must have product and serial
        if (!saleForm.filter_product_id) return alert('Selecciona un producto');
        if (!saleForm.serial_input) return alert('Ingresa o selecciona un número de serie');

        // Validación: El monto pagado no puede ser mayor al precio de venta
        const salePriceArs = cleanNumber(saleForm.sale_price_ars);
        const amountPaidArs = cleanNumber(saleForm.amount_paid_ars);
        if (amountPaidArs > salePriceArs) {
            return alert('El monto pagado no puede ser mayor al precio de venta');
        }

        // Validación: Máximo 5 imágenes del producto
        if (saleForm.product_images.length > 5) {
            return alert('Máximo 5 imágenes del producto permitidas');
        }

        setSubmitting(true);
        try {
            // 1. Upload CONTRACT files first (best effort - don't fail if bucket has issues)
            const uploadedContractUrls = [];
            let uploadWarning = '';

            if (saleForm.files.length > 0) {
                try {
                    for (const file of saleForm.files) {
                        const ext = file.name.split('.').pop();
                        const name = `contract_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
                        const { error } = await supabase.storage.from('sales-contracts').upload(name, file);
                        if (error) throw error;
                        const { data } = supabase.storage.from('sales-contracts').getPublicUrl(name);
                        uploadedContractUrls.push(data.publicUrl);
                    }
                } catch (uploadError) {
                    console.error('Contract file upload failed:', uploadError);
                    uploadWarning = '\n\n⚠️ Archivos de contrato NO se subieron (problema de permisos). La venta se guardó sin archivos.';
                }
            }

            // 2. Upload PRODUCT IMAGES (nuevo)
            const uploadedImageUrls = [];
            if (saleForm.product_images.length > 0) {
                try {
                    for (const file of saleForm.product_images) {
                        const ext = file.name.split('.').pop();
                        const name = `product_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
                        const { error } = await supabase.storage.from('sales-contracts').upload(name, file);
                        if (error) throw error;
                        const { data } = supabase.storage.from('sales-contracts').getPublicUrl(name);
                        uploadedImageUrls.push(data.publicUrl);
                    }
                } catch (uploadError) {
                    console.error('Product image upload failed:', uploadError);
                    uploadWarning += '\n\n⚠️ Imágenes del producto NO se subieron.';
                }
            }

            // 3. Check if item exists in stock
            const existingItem = availableItems.find(i =>
                i.product_id === saleForm.filter_product_id &&
                i.serial_number === saleForm.serial_input
            );

            let error;

            if (existingItem) {
                // UPDATE existing item
                const { error: updateError } = await supabase.from('inventory_items').update({
                    status: 'sold',
                    client_name: saleForm.client_name,
                    client_dni: saleForm.client_dni,
                    sale_price_usd: cleanNumber(saleForm.sale_price_usd),
                    sale_price_ars: salePriceArs,
                    sale_date: saleForm.sale_date,
                    contract_files: uploadedContractUrls.length > 0 ? uploadedContractUrls : null,
                    observations: saleForm.observations || null, // NUEVO
                    amount_paid_ars: amountPaidArs, // NUEVO
                    payment_status: saleForm.payment_status, // NUEVO
                    product_images: uploadedImageUrls.length > 0 ? uploadedImageUrls : null // NUEVO
                }).eq('id', existingItem.id);
                error = updateError;
            } else {
                // INSERT new item (Sold immediately)
                const { error: insertError } = await supabase.from('inventory_items').insert({
                    product_id: saleForm.filter_product_id,
                    serial_number: saleForm.serial_input,
                    status: 'sold',
                    client_name: saleForm.client_name,
                    client_dni: saleForm.client_dni,
                    sale_price_usd: cleanNumber(saleForm.sale_price_usd),
                    sale_price_ars: salePriceArs,
                    sale_date: saleForm.sale_date,
                    contract_files: uploadedContractUrls.length > 0 ? uploadedContractUrls : null,
                    purchase_date: saleForm.sale_date, // Default purchase date to sale date if unknown
                    observations: saleForm.observations || null, // NUEVO
                    amount_paid_ars: amountPaidArs, // NUEVO
                    payment_status: saleForm.payment_status, // NUEVO
                    product_images: uploadedImageUrls.length > 0 ? uploadedImageUrls : null // NUEVO
                });
                error = insertError;
            }

            if (error) throw error;

            alert('Venta registrada exitosamente.' + uploadWarning);
            setSaleForm({
                filter_product_id: '',
                serial_input: '',
                client_name: '',
                client_dni: '',
                sale_price_usd: '',
                sale_price_ars: '',
                sale_date: new Date().toISOString().split('T')[0],
                files: [],
                observations: '', // RESET
                amount_paid_ars: '', // RESET
                payment_status: 'pending', // RESET
                product_images: [] // RESET
            });
            fetchInventory();
        } catch (err) { alert(err.message); }
        finally { setSubmitting(false); }
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            setSaleForm(p => ({ ...p, files: [...p.files, ...Array.from(e.target.files)] }));
        }
    };

    // --- Filtering ---
    const filteredInventory = inventory.filter(i => {
        // 1. Filter by View Mode (Tab)
        // MODIFICADO: En 'stock' mostramos TODAS las entradas (disponibles y vendidas)
        // para mantener el registro completo
        if (viewMode === 'sold' && i.status !== 'sold') return false;

        // 2. Filter by Search Text
        return (
            i.productos?.nombre?.toLowerCase().includes(filter.toLowerCase()) ||
            i.serial_number?.toLowerCase().includes(filter.toLowerCase()) ||
            i.client_name?.toLowerCase().includes(filter.toLowerCase()) ||
            i.client_dni?.toLowerCase().includes(filter.toLowerCase()) // Search by DNI
        );
    });

    const stockCount = inventory.filter(i => i.status === 'available').length;
    const soldCount = inventory.length - stockCount;

    // --- Actions ---
    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de ELIMINAR este item? Esta acción no se puede deshacer.')) return;
        try {
            const { error } = await supabase.from('inventory_items').delete().eq('id', id);
            if (error) throw error;
            fetchInventory();
        } catch (err) { alert('Error al eliminar: ' + err.message); }
    };

    const handleEditClick = (item) => {
        setEditingItem(item);
        setEditForm({
            ...item,
            product_id: item.product_id,
            cost_usd: formatNumber(item.cost_usd),
            cost_ars: formatNumber(item.cost_ars),
            sale_price_usd: formatNumber(item.sale_price_usd),
            sale_price_ars: formatNumber(item.sale_price_ars),
            amount_paid_ars: formatNumber(item.amount_paid_ars), // NUEVO
            observations: item.observations || '', // NUEVO
            payment_status: item.payment_status || 'pending', // NUEVO
            newFiles: [], // Initialize for new uploads (contracts)
            newProductImages: [] // NUEVO: para nuevas imágenes del producto
        });
    };

    const handleSaveEdit = async () => {
        try {
            // Validación: El monto pagado no puede ser mayor al precio de venta
            const salePriceArs = cleanNumber(editForm.sale_price_ars);
            const amountPaidArs = cleanNumber(editForm.amount_paid_ars);
            if (amountPaidArs > salePriceArs) {
                alert('El monto pagado no puede ser mayor al precio de venta');
                return;
            }

            // 1. Handle Contract File Uploads
            let finalContractFiles = editForm.contract_files || []; // Start with existing kept files

            if (editForm.newFiles && editForm.newFiles.length > 0) {
                for (const file of editForm.newFiles) {
                    const ext = file.name.split('.').pop();
                    const name = `contract_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
                    const { error } = await supabase.storage.from('sales-contracts').upload(name, file);
                    if (error) throw error;
                    const { data } = supabase.storage.from('sales-contracts').getPublicUrl(name);
                    finalContractFiles.push(data.publicUrl);
                }
            }

            // 2. Handle Product Image Uploads (NUEVO)
            let finalProductImages = editForm.product_images || []; // Start with existing kept images

            if (editForm.newProductImages && editForm.newProductImages.length > 0) {
                // Validar límite de 5 imágenes total
                const totalImages = finalProductImages.length + editForm.newProductImages.length;
                if (totalImages > 5) {
                    alert('Máximo 5 imágenes del producto permitidas');
                    return;
                }

                for (const file of editForm.newProductImages) {
                    const ext = file.name.split('.').pop();
                    const name = `product_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
                    const { error } = await supabase.storage.from('sales-contracts').upload(name, file);
                    if (error) throw error;
                    const { data } = supabase.storage.from('sales-contracts').getPublicUrl(name);
                    finalProductImages.push(data.publicUrl);
                }
            }

            // 3. Prepare Updates
            const updates = {
                serial_number: editForm.serial_number,
                model_variant: editForm.model_variant,
                cost_usd: cleanNumber(editForm.cost_usd),
                cost_ars: cleanNumber(editForm.cost_ars),
                client_name: editForm.client_name,
                client_dni: editForm.client_dni,
                sale_price_usd: cleanNumber(editForm.sale_price_usd),
                sale_price_ars: salePriceArs,
                status: editForm.status,
                contract_files: finalContractFiles, // Update files list
                observations: editForm.observations || null, // NUEVO
                amount_paid_ars: amountPaidArs, // NUEVO
                payment_status: editForm.payment_status, // NUEVO
                product_images: finalProductImages.length > 0 ? finalProductImages : null // NUEVO
            };

            const { error } = await supabase.from('inventory_items').update(updates).eq('id', editingItem.id);
            if (error) throw error;

            setEditingItem(null);
            fetchInventory();
        } catch (err) { alert('Error al guardar: ' + err.message); }
    };

    // Handler para abrir el modal de detalle en mobile
    const handleCardClick = (item) => {
        setSelectedItem(item);
        setShowDetailModal(true);
    };

    // Handler para los botones Entrada/Venta (expandir formulario en mobile)
    const handleModeChange = (newMode) => {
        setMode(newMode);
        setFormExpanded(true); // Expandir formulario en mobile
    };

    return (
        <div className="sales-dashboard">
            {showHeaderAndExchange && <AdminHeader title="Finanzas" />}

            {/* Configuración de Tipo de Cambio */}
            {showHeaderAndExchange && <ExchangeRateConfig />}

            {/* Content wrapper for side-by-side layout on desktop */}
            <div className="sales-content-wrapper">
                {/* LEFT COLUMN: CONTROL PANEL */}
                <div className="control-panel">
                    <div className="panel-header">
                        <div className="panel-title">
                            <LayoutDashboard size={20} />
                            Centro de Control
                        </div>
                        <div className="panel-subtitle">Administra stock y ventas desde aquí.</div>
                    </div>

                    <div className="mode-switch">
                        <button
                            className={`mode-btn ${mode === 'entry' ? 'active entry-mode' : ''}`}
                            onClick={() => handleModeChange('entry')}
                        >
                            <PlusCircle size={16} style={{ display: 'inline', marginBottom: -2 }} /> Entrada
                        </button>
                        <button
                            className={`mode-btn ${mode === 'sale' ? 'active sale-mode' : ''}`}
                            onClick={() => handleModeChange('sale')}
                        >
                            <ShoppingCart size={16} style={{ display: 'inline', marginBottom: -2 }} /> Venta
                        </button>
                    </div>

                    {/* Wrapper para formularios colapsables en mobile */}
                    <div style={{
                        // En mobile, solo mostrar si formExpanded es true
                        // En desktop, siempre mostrar
                        maxHeight: window.innerWidth < 1024 && !formExpanded ? '0' : 'none',
                        overflow: window.innerWidth < 1024 && !formExpanded ? 'hidden' : 'visible',
                        opacity: window.innerWidth < 1024 && !formExpanded ? '0' : '1',
                        transition: 'all 0.3s ease'
                    }}>

                        {/* ENTRY FORM */}
                        {mode === 'entry' && (
                            <form className="cmd-form" onSubmit={handleEntrySubmit}>
                                <div className="cmd-group">
                                    <label className="cmd-label">Producto</label>
                                    <select
                                        className="cmd-select"
                                        required
                                        value={entryForm.product_id}
                                        onChange={e => setEntryForm({ ...entryForm, product_id: e.target.value })}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="cmd-group">
                                    <label className="cmd-label">Nro. de Serie</label>
                                    <input className="cmd-input" required placeholder="SN-123" value={entryForm.serial_number} onChange={e => setEntryForm({ ...entryForm, serial_number: e.target.value })} />
                                </div>
                                <div className="cmd-group">
                                    <label className="cmd-label">Modelo / Variante</label>
                                    <input className="cmd-input" placeholder="Modelo 2024" value={entryForm.model_variant} onChange={e => setEntryForm({ ...entryForm, model_variant: e.target.value })} />
                                </div>
                                <div className="cmd-group">
                                    <label className="cmd-label">Costo (USD)</label>
                                    <input
                                        className="cmd-input"
                                        type="text"
                                        placeholder="0"
                                        value={entryForm.cost_usd}
                                        onChange={e => handlePriceChange(e, entryForm, setEntryForm, 'cost_usd')}
                                    />
                                </div>
                                <div className="cmd-group">
                                    <label className="cmd-label">Costo (ARS)</label>
                                    <input
                                        className="cmd-input"
                                        type="text"
                                        placeholder="0"
                                        value={entryForm.cost_ars}
                                        onChange={e => handlePriceChange(e, entryForm, setEntryForm, 'cost_ars')}
                                    />
                                </div>
                                <div className="cmd-group">
                                    <label className="cmd-label">Fecha Compra</label>
                                    <input className="cmd-input" type="date" required value={entryForm.purchase_date} onChange={e => setEntryForm({ ...entryForm, purchase_date: e.target.value })} />
                                </div>
                                <button type="submit" className="cmd-btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Guardando...' : 'Registrar Entrada'}
                                </button>
                            </form>
                        )}

                        {/* SALE FORM */}
                        {mode === 'sale' && (
                            <form className="cmd-form" onSubmit={handleSaleSubmit}>
                                <div className="cmd-group">
                                    <label className="cmd-label">Producto</label>
                                    <select
                                        className="cmd-select"
                                        value={saleForm.filter_product_id || ''}
                                        onChange={e => {
                                            setSaleForm({
                                                ...saleForm,
                                                filter_product_id: e.target.value,
                                                serial_input: ''
                                            });
                                        }}
                                    >
                                        <option value="">Seleccionar producto...</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="cmd-group">
                                    <label className="cmd-label">Item / Nro. de Serie</label>
                                    <select
                                        className="cmd-select"
                                        disabled={!saleForm.filter_product_id}
                                        value={saleForm.serial_input || ''}
                                        onChange={e => setSaleForm({ ...saleForm, serial_input: e.target.value })}
                                    >
                                        <option value="">-- Seleccionar Serie --</option>
                                        {availableItems
                                            .filter(item => item.product_id === saleForm.filter_product_id)
                                            .map(item => (
                                                <option key={item.id} value={item.serial_number}>
                                                    {item.serial_number} {item.model_variant ? `(${item.model_variant})` : ''}
                                                </option>
                                            ))
                                        }
                                    </select>
                                    {saleForm.filter_product_id && availableItems.filter(i => i.product_id === saleForm.filter_product_id).length === 0 && (
                                        <small style={{ color: '#ef4444', marginTop: 4, display: 'block' }}>
                                            ⚠️ No hay stock para este producto. Debes cargar una "Entrada" primero.
                                        </small>
                                    )}
                                </div>

                                <div className="row-2">
                                    <div className="cmd-group">
                                        <label className="cmd-label">Cliente</label>
                                        <input className="cmd-input" required placeholder="Nombre Cliente" value={saleForm.client_name} onChange={e => setSaleForm({ ...saleForm, client_name: e.target.value })} />
                                    </div>
                                    <div className="cmd-group">
                                        <label className="cmd-label">DNI</label>
                                        <input className="cmd-input" placeholder="12345678" value={saleForm.client_dni} onChange={e => setSaleForm({ ...saleForm, client_dni: e.target.value })} />
                                    </div>
                                </div>

                                <div className="cmd-group">
                                    <label className="cmd-label">Observaciones</label>
                                    <textarea
                                        className="cmd-input"
                                        rows="3"
                                        placeholder="Notas sobre la venta, condiciones especiales, etc..."
                                        value={saleForm.observations}
                                        onChange={e => setSaleForm({ ...saleForm, observations: e.target.value })}
                                        style={{ resize: 'vertical', minHeight: '60px' }}
                                    />
                                </div>

                                <div className="cmd-group">
                                    <label className="cmd-label">Precio Venta (USD)</label>
                                    <input
                                        className="cmd-input"
                                        type="text"
                                        required placeholder="0"
                                        value={saleForm.sale_price_usd}
                                        onChange={e => handlePriceChange(e, saleForm, setSaleForm, 'sale_price_usd')}
                                    />
                                </div>
                                <div className="cmd-group">
                                    <label className="cmd-label">Precio Venta (ARS)</label>
                                    <input
                                        className="cmd-input"
                                        type="text"
                                        placeholder="0"
                                        value={saleForm.sale_price_ars}
                                        onChange={e => handlePriceChange(e, saleForm, setSaleForm, 'sale_price_ars')}
                                    />
                                </div>

                                <div className="cmd-group">
                                    <label className="cmd-label">Monto Pagado (ARS)</label>
                                    <input
                                        className="cmd-input"
                                        type="text"
                                        placeholder="0"
                                        value={saleForm.amount_paid_ars}
                                        onChange={e => handlePriceChange(e, saleForm, setSaleForm, 'amount_paid_ars')}
                                    />
                                </div>

                                {/* Saldo Pendiente - Calculado automáticamente */}
                                {saleForm.sale_price_ars && (
                                    <div className="cmd-group">
                                        <label className="cmd-label">Saldo Pendiente (ARS)</label>
                                        <input
                                            className="cmd-input"
                                            type="text"
                                            readOnly
                                            value={formatNumber(
                                                Math.max(0, cleanNumber(saleForm.sale_price_ars) - cleanNumber(saleForm.amount_paid_ars))
                                            )}
                                            style={{
                                                backgroundColor: '#fee2e2',
                                                color: '#dc2626',
                                                fontWeight: 600,
                                                cursor: 'not-allowed'
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Checkbox Pagado */}
                                <div className="cmd-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={saleForm.payment_status === 'paid'}
                                            onChange={e => setSaleForm({
                                                ...saleForm,
                                                payment_status: e.target.checked ? 'paid' : 'pending'
                                            })}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                            Marcar como <b>PAGADO</b> (sin deuda pendiente)
                                        </span>
                                    </label>
                                </div>

                                <div className="cmd-group">
                                    <label className="cmd-label">Fecha Venta</label>
                                    <input className="cmd-input" type="date" required value={saleForm.sale_date} onChange={e => setSaleForm({ ...saleForm, sale_date: e.target.value })} />
                                </div>

                                {/* Imágenes del Producto - NUEVO */}
                                <div className="cmd-group">
                                    <label className="cmd-label">Imágenes del Producto (Máx 5)</label>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        id="productImages"
                                        style={{ display: 'none' }}
                                        onChange={e => {
                                            if (e.target.files) {
                                                const newFiles = Array.from(e.target.files);
                                                const totalFiles = saleForm.product_images.length + newFiles.length;
                                                if (totalFiles > 5) {
                                                    alert('Máximo 5 imágenes del producto permitidas');
                                                    return;
                                                }
                                                setSaleForm(p => ({ ...p, product_images: [...p.product_images, ...newFiles] }));
                                            }
                                        }}
                                    />
                                    <label
                                        htmlFor="productImages"
                                        style={{
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 12px',
                                            border: '2px dashed #cbd5e1',
                                            borderRadius: '6px',
                                            backgroundColor: '#f8fafc',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.borderColor = '#3b82f6'}
                                        onMouseOut={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                                    >
                                        <Upload size={20} style={{ color: '#64748b' }} />
                                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            Seleccionar imágenes ({saleForm.product_images.length}/5)
                                        </span>
                                    </label>
                                    {saleForm.product_images.length > 0 && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px', marginTop: '8px' }}>
                                            {saleForm.product_images.map((file, i) => (
                                                <div key={i} style={{ position: 'relative' }}>
                                                    <img
                                                        src={URL.createObjectURL(file)}
                                                        alt={`Preview ${i + 1}`}
                                                        style={{
                                                            width: '100%',
                                                            height: '80px',
                                                            objectFit: 'cover',
                                                            borderRadius: '4px',
                                                            border: '1px solid #e2e8f0'
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newImages = saleForm.product_images.filter((_, idx) => idx !== i);
                                                            setSaleForm({ ...saleForm, product_images: newImages });
                                                        }}
                                                        style={{
                                                            position: 'absolute',
                                                            top: '2px',
                                                            right: '2px',
                                                            backgroundColor: '#ef4444',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '50%',
                                                            width: '20px',
                                                            height: '20px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="cmd-group">
                                    <label className="cmd-label">Contrato / Fotos</label>
                                    <div className="compact-upload">
                                        <input type="file" multiple id="fileUp" style={{ display: 'none' }} onChange={handleFileChange} />
                                        <label htmlFor="fileUp" style={{ cursor: 'pointer', display: 'block' }}>
                                            <Upload size={24} style={{ color: '#94a3b8', marginBottom: 4 }} />
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Adjuntar archivos</div>
                                        </label>
                                        <div className="file-tags">
                                            {saleForm.files.map((f, i) => <span key={i} className="file-tag">{f.name.substring(0, 10)}...</span>)}
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" className="cmd-btn btn-success" disabled={submitting}>
                                    {submitting ? 'Procesando...' : 'Confirmar Venta'}
                                </button>
                            </form>
                        )}
                    </div> {/* Fin wrapper formularios colapsables */}
                </div>

                {/* RIGHT COLUMN: DATA PANEL */}
                <div className="data-panel">

                    {/* KPI Strip */}
                    <div className="kpi-strip">
                        <div
                            className={`mini-kpi ${viewMode === 'stock' ? 'active-kpi' : ''}`}
                            onClick={() => setViewMode('stock')}
                            style={{ cursor: 'pointer', border: viewMode === 'stock' ? '2px solid #3b82f6' : '1px solid transparent' }}
                        >
                            <div className="kpi-icon-wrap"><Package size={20} /></div>
                            <div className="kpi-content">
                                <div style={{ fontWeight: 600 }}>Stock Actual / Entradas</div>
                                <div style={{ fontSize: '1.2rem' }}>{stockCount}</div>
                            </div>
                        </div>
                        <div
                            className={`mini-kpi ${viewMode === 'sold' ? 'active-kpi' : ''}`}
                            onClick={() => setViewMode('sold')}
                            style={{ cursor: 'pointer', border: viewMode === 'sold' ? '2px solid #22c55e' : '1px solid transparent' }}
                        >
                            <div className="kpi-icon-wrap green"><CheckCircle size={20} /></div>
                            <div className="kpi-content">
                                <div style={{ fontWeight: 600 }}>Ventas / Salidas</div>
                                <div style={{ fontSize: '1.2rem' }}>{soldCount}</div>
                            </div>
                        </div>
                    </div>

                    {/* Table Card */}
                    <div className="table-card">
                        <div className="table-toolbar">
                            <div className="table-title">
                                {viewMode === 'stock' ? 'Registro de Entradas (Todas)' : 'Historial de Ventas'}
                            </div>
                            <div className="search-box">
                                <Search className="search-icon" />
                                <input
                                    className="search-input"
                                    placeholder="Buscar..."
                                    value={filter}
                                    onChange={e => setFilter(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="table-scroller">
                            <table className="clean-table">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Serie</th>
                                        <th>Info</th>
                                        {viewMode === 'sold' && <th>Venta</th>}
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInventory.map(item => (
                                        <tr key={item.id}>
                                            <td>
                                                <div className="product-cell">{item.productos?.nombre}</div>
                                                <div className="variant-sub">{item.model_variant}</div>
                                            </td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span>{item.serial_number}</span>
                                                    {viewMode === 'stock' && item.status === 'sold' && (
                                                        <>
                                                            <span style={{
                                                                backgroundColor: '#fee2e2',
                                                                color: '#dc2626',
                                                                padding: '2px 8px',
                                                                borderRadius: '4px',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 600,
                                                                fontFamily: 'system-ui'
                                                            }}>
                                                                VENDIDO
                                                            </span>
                                                            {/* Badge de estado de pago */}
                                                            {item.payment_status === 'paid' ? (
                                                                <span style={{
                                                                    backgroundColor: '#dcfce7',
                                                                    color: '#16a34a',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.7rem',
                                                                    fontWeight: 600,
                                                                    fontFamily: 'system-ui'
                                                                }}>
                                                                    ✓ PAGADO
                                                                </span>
                                                            ) : (
                                                                <span style={{
                                                                    backgroundColor: '#fef9c3',
                                                                    color: '#ca8a04',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.7rem',
                                                                    fontWeight: 600,
                                                                    fontFamily: 'system-ui'
                                                                }}>
                                                                    ⏱ PENDIENTE
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                {item.status === 'available' ? (
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                        Compra: {item.purchase_date} <br />
                                                        Costo: ${item.cost_usd || 0} USD
                                                        {item.observations && (
                                                            <>
                                                                <br />
                                                                <span style={{ fontStyle: 'italic', fontSize: '0.75rem' }}>
                                                                    💬 {item.observations.substring(0, 50)}{item.observations.length > 50 ? '...' : ''}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                        Compra: {item.purchase_date} <br />
                                                        Costo: ${item.cost_usd || 0} USD
                                                        {viewMode === 'stock' && (
                                                            <>
                                                                <br />
                                                                <span style={{ color: '#dc2626', fontWeight: 600 }}>
                                                                    Vendido a: {item.client_name}
                                                                </span>
                                                                <br />
                                                                {/* Información de pago */}
                                                                {item.sale_price_ars && (
                                                                    <span style={{ fontSize: '0.75rem' }}>
                                                                        💰 Pagado: ${formatNumber(item.amount_paid_ars || 0)} / ${formatNumber(item.sale_price_ars)}
                                                                        {item.payment_status !== 'paid' && item.sale_price_ars > (item.amount_paid_ars || 0) && (
                                                                            <span style={{ color: '#dc2626', fontWeight: 600 }}>
                                                                                {' '}(Saldo: ${formatNumber(item.sale_price_ars - (item.amount_paid_ars || 0))})
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                )}
                                                                {item.observations && (
                                                                    <>
                                                                        <br />
                                                                        <span style={{ fontStyle: 'italic', fontSize: '0.75rem' }}>
                                                                            💬 {item.observations.substring(0, 40)}{item.observations.length > 40 ? '...' : ''}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </>
                                                        )}
                                                        {viewMode === 'sold' && (
                                                            <>
                                                                Cliente: <b>{item.client_name}</b> <br />
                                                                {item.client_dni && <span>DNI: {item.client_dni}</span>}
                                                                <br />
                                                                {/* Información de pago */}
                                                                {item.sale_price_ars && (
                                                                    <span style={{ fontSize: '0.75rem' }}>
                                                                        💰 Pagado: ${formatNumber(item.amount_paid_ars || 0)} / ${formatNumber(item.sale_price_ars)}
                                                                        {item.payment_status !== 'paid' && item.sale_price_ars > (item.amount_paid_ars || 0) && (
                                                                            <span style={{ color: '#dc2626', fontWeight: 600 }}>
                                                                                {' '}(Saldo: ${formatNumber(item.sale_price_ars - (item.amount_paid_ars || 0))})
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                )}
                                                                {item.observations && (
                                                                    <>
                                                                        <br />
                                                                        <span style={{ fontStyle: 'italic', fontSize: '0.75rem' }}>
                                                                            💬 {item.observations.substring(0, 50)}{item.observations.length > 50 ? '...' : ''}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            {viewMode === 'sold' && (
                                                <td>
                                                    <div style={{ fontSize: '0.8rem' }}>
                                                        {item.sale_date} <br />
                                                        <span style={{ color: '#16a34a' }}>${item.sale_price_usd} USD</span>
                                                    </div>
                                                </td>
                                            )}
                                            <td>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button className="icon-btn edit-btn" onClick={() => handleEditClick(item)} title="Editar">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button className="icon-btn delete-btn" onClick={() => handleDelete(item.id)} title="Eliminar">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredInventory.length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Sin resultados</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div> {/* End sales-content-wrapper */}

            {/* MODAL: Edit Details */}
            {editingItem && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Editar Item</h3>
                            <button onClick={() => setEditingItem(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="cmd-group">
                                <label className="cmd-label">Serie</label>
                                <input className="cmd-input" value={editForm.serial_number || ''} onChange={e => setEditForm({ ...editForm, serial_number: e.target.value })} />
                            </div>
                            <div className="cmd-group">
                                <label className="cmd-label">Variante</label>
                                <input className="cmd-input" value={editForm.model_variant || ''} onChange={e => setEditForm({ ...editForm, model_variant: e.target.value })} />
                            </div>

                            <div className="row-2">
                                <div className="cmd-group">
                                    <label className="cmd-label">Costo USD</label>
                                    <input
                                        className="cmd-input"
                                        type="text"
                                        value={editForm.cost_usd || 0}
                                        onChange={e => handlePriceChange(e, editForm, setEditForm, 'cost_usd')}
                                    />
                                </div>
                                <div className="cmd-group">
                                    <label className="cmd-label">Costo ARS</label>
                                    <input
                                        className="cmd-input"
                                        type="text"
                                        value={editForm.cost_ars || 0}
                                        onChange={e => handlePriceChange(e, editForm, setEditForm, 'cost_ars')}
                                    />
                                </div>
                            </div>

                            {editForm.status === 'sold' && (
                                <>
                                    <hr style={{ margin: '10px 0', borderColor: '#e2e8f0' }} />
                                    <div className="row-2">
                                        <div className="cmd-group">
                                            <label className="cmd-label">Cliente</label>
                                            <input className="cmd-input" value={editForm.client_name || ''} onChange={e => setEditForm({ ...editForm, client_name: e.target.value })} />
                                        </div>
                                        <div className="cmd-group">
                                            <label className="cmd-label">DNI</label>
                                            <input className="cmd-input" value={editForm.client_dni || ''} onChange={e => setEditForm({ ...editForm, client_dni: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="row-2">
                                        <div className="cmd-group">
                                            <label className="cmd-label">Venta USD</label>
                                            <input
                                                className="cmd-input"
                                                type="text"
                                                value={editForm.sale_price_usd || 0}
                                                onChange={e => handlePriceChange(e, editForm, setEditForm, 'sale_price_usd')}
                                            />
                                        </div>
                                        <div className="cmd-group">
                                            <label className="cmd-label">Venta ARS</label>
                                            <input
                                                className="cmd-input"
                                                type="text"
                                                value={editForm.sale_price_ars || 0}
                                                onChange={e => handlePriceChange(e, editForm, setEditForm, 'sale_price_ars')}
                                            />
                                        </div>
                                    </div>

                                    {/* NUEVOS CAMPOS DE PAGO Y OBSERVACIONES */}
                                    <div className="cmd-group">
                                        <label className="cmd-label">Observaciones</label>
                                        <textarea
                                            className="cmd-input"
                                            rows="3"
                                            placeholder="Notas sobre la venta..."
                                            value={editForm.observations || ''}
                                            onChange={e => setEditForm({ ...editForm, observations: e.target.value })}
                                            style={{ resize: 'vertical', minHeight: '60px' }}
                                        />
                                    </div>

                                    <div className="cmd-group">
                                        <label className="cmd-label">Monto Pagado (ARS)</label>
                                        <input
                                            className="cmd-input"
                                            type="text"
                                            value={editForm.amount_paid_ars || 0}
                                            onChange={e => handlePriceChange(e, editForm, setEditForm, 'amount_paid_ars')}
                                        />
                                    </div>

                                    {/* Saldo Pendiente Calculado */}
                                    {editForm.sale_price_ars && (
                                        <div className="cmd-group">
                                            <label className="cmd-label">Saldo Pendiente (ARS)</label>
                                            <input
                                                className="cmd-input"
                                                type="text"
                                                readOnly
                                                value={formatNumber(
                                                    Math.max(0, cleanNumber(editForm.sale_price_ars) - cleanNumber(editForm.amount_paid_ars))
                                                )}
                                                style={{
                                                    backgroundColor: '#fee2e2',
                                                    color: '#dc2626',
                                                    fontWeight: 600,
                                                    cursor: 'not-allowed'
                                                }}
                                            />
                                        </div>
                                    )}

                                    {/* Checkbox Estado de Pago */}
                                    <div className="cmd-group">
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={editForm.payment_status === 'paid'}
                                                onChange={e => setEditForm({
                                                    ...editForm,
                                                    payment_status: e.target.checked ? 'paid' : 'pending'
                                                })}
                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                            />
                                            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                                Marcar como <b>PAGADO</b>
                                            </span>
                                        </label>
                                    </div>

                                    {/* Imágenes del Producto */}
                                    <div className="cmd-group" style={{ marginTop: 10 }}>
                                        <label className="cmd-label">Imágenes del Producto (Máx 5)</label>

                                        {/* Existing Images */}
                                        {editForm.product_images && editForm.product_images.length > 0 && (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px', marginBottom: '8px' }}>
                                                {editForm.product_images.map((url, i) => (
                                                    <div key={i} style={{ position: 'relative' }}>
                                                        <img
                                                            src={url}
                                                            alt={`Producto ${i + 1}`}
                                                            style={{
                                                                width: '100%',
                                                                height: '80px',
                                                                objectFit: 'cover',
                                                                borderRadius: '4px',
                                                                border: '1px solid #e2e8f0'
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newImages = editForm.product_images.filter((_, idx) => idx !== i);
                                                                setEditForm({ ...editForm, product_images: newImages });
                                                            }}
                                                            style={{
                                                                position: 'absolute',
                                                                top: '2px',
                                                                right: '2px',
                                                                backgroundColor: '#ef4444',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '50%',
                                                                width: '20px',
                                                                height: '20px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* New Uploads */}
                                        {(editForm.product_images || []).length < 5 && (
                                            <div style={{ marginTop: 5 }}>
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    id="editProductImages"
                                                    style={{ display: 'none' }}
                                                    onChange={e => {
                                                        if (e.target.files) {
                                                            const newFiles = Array.from(e.target.files);
                                                            const currentCount = (editForm.product_images || []).length;
                                                            const totalCount = currentCount + (editForm.newProductImages || []).length + newFiles.length;
                                                            if (totalCount > 5) {
                                                                alert('Máximo 5 imágenes del producto permitidas');
                                                                return;
                                                            }
                                                            setEditForm({ ...editForm, newProductImages: [...(editForm.newProductImages || []), ...newFiles] });
                                                        }
                                                    }}
                                                />
                                                <label
                                                    htmlFor="editProductImages"
                                                    style={{
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 5,
                                                        fontSize: '0.85rem',
                                                        color: '#64748b',
                                                        padding: '8px',
                                                        border: '2px dashed #cbd5e1',
                                                        borderRadius: '6px',
                                                        backgroundColor: '#f8fafc'
                                                    }}
                                                >
                                                    <PlusCircle size={16} /> Agregar imágenes ({(editForm.product_images || []).length}/5)
                                                </label>
                                                {editForm.newProductImages && editForm.newProductImages.length > 0 && (
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px', marginTop: '8px' }}>
                                                        {editForm.newProductImages.map((file, i) => (
                                                            <div key={i} style={{ position: 'relative' }}>
                                                                <img
                                                                    src={URL.createObjectURL(file)}
                                                                    alt={`Nueva ${i + 1}`}
                                                                    style={{
                                                                        width: '100%',
                                                                        height: '80px',
                                                                        objectFit: 'cover',
                                                                        borderRadius: '4px',
                                                                        border: '1px solid #e2e8f0'
                                                                    }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const kept = editForm.newProductImages.filter((_, idx) => idx !== i);
                                                                        setEditForm({ ...editForm, newProductImages: kept });
                                                                    }}
                                                                    style={{
                                                                        position: 'absolute',
                                                                        top: '2px',
                                                                        right: '2px',
                                                                        backgroundColor: '#ef4444',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '50%',
                                                                        width: '20px',
                                                                        height: '20px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        cursor: 'pointer',
                                                                        fontSize: '12px',
                                                                        fontWeight: 'bold'
                                                                    }}
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <hr style={{ margin: '10px 0', borderColor: '#e2e8f0' }} />

                                    {/* FILE MANAGEMENT - Contratos */}
                                    <div className="cmd-group" style={{ marginTop: 10 }}>
                                        <label className="cmd-label">Archivos / Contratos</label>

                                        {/* Existing Files */}
                                        {editForm.contract_files && editForm.contract_files.length > 0 && (
                                            <div className="file-list-edit">
                                                {editForm.contract_files.map((url, i) => (
                                                    <div key={i} className="file-item-edit">
                                                        <a href={url} target="_blank" rel="noreferrer" className="text-blue-500 underline text-sm truncate" style={{ maxWidth: '150px' }}>
                                                            Archivo {i + 1}
                                                        </a>
                                                        <button
                                                            type="button"
                                                            className="text-red-500 hover:text-red-700 ml-2"
                                                            onClick={() => {
                                                                const newFiles = editForm.contract_files.filter((_, idx) => idx !== i);
                                                                setEditForm({ ...editForm, contract_files: newFiles });
                                                            }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* New Uploads */}
                                        <div className="compact-upload" style={{ marginTop: 5 }}>
                                            <input
                                                type="file"
                                                multiple
                                                id="editFileUp"
                                                style={{ display: 'none' }}
                                                onChange={e => {
                                                    if (e.target.files) {
                                                        const added = Array.from(e.target.files);
                                                        setEditForm({ ...editForm, newFiles: [...(editForm.newFiles || []), ...added] });
                                                    }
                                                }}
                                            />
                                            <label htmlFor="editFileUp" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.85rem', color: '#64748b' }}>
                                                <PlusCircle size={16} /> Agregar nuevo archivo
                                            </label>
                                            <div className="file-tags">
                                                {editForm.newFiles && editForm.newFiles.map((f, i) => (
                                                    <span key={i} className="file-tag">
                                                        {f.name.substring(0, 10)}...
                                                        <X
                                                            size={12}
                                                            style={{ cursor: 'pointer', marginLeft: 4 }}
                                                            onClick={() => {
                                                                const kept = editForm.newFiles.filter((_, idx) => idx !== i);
                                                                setEditForm({ ...editForm, newFiles: kept });
                                                            }}
                                                        />
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                        </div>
                        <div className="modal-footer">
                            <button className="cmd-btn" onClick={() => setEditingItem(null)}>Cancelar</button>
                            <button className="cmd-btn btn-primary" onClick={handleSaveEdit}>
                                <Save size={16} style={{ marginRight: 5 }} /> Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Modal de Detalle Mobile */}
            {showDetailModal && selectedItem && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                        zIndex: 9999,
                        backdropFilter: 'blur(4px)'
                    }}
                    onClick={() => setShowDetailModal(false)}
                >
                    <div
                        style={{
                            background: 'white',
                            borderRadius: '16px',
                            maxWidth: '600px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflow: 'auto',
                            position: 'relative',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{
                            padding: '20px',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            position: 'sticky',
                            top: 0,
                            background: 'white',
                            zIndex: 1,
                            borderRadius: '16px 16px 0 0'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                                Detalle del Item
                            </h3>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: '#64748b',
                                    borderRadius: '8px',
                                    transition: 'background 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div style={{ padding: '24px' }}>
                            {/* Product Info */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>
                                    Producto
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                                    {selectedItem.productos?.nombre}
                                </div>
                                {selectedItem.model_variant && (
                                    <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                                        {selectedItem.model_variant}
                                    </div>
                                )}
                                <div style={{ fontSize: '14px', color: '#64748b', fontFamily: 'monospace', marginBottom: '12px' }}>
                                    Serie: {selectedItem.serial_number}
                                </div>
                                <div style={{
                                    marginTop: '12px',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    display: 'inline-block',
                                    backgroundColor: selectedItem.status === 'sold' ? '#fef9c3' : '#dcfce7',
                                    color: selectedItem.status === 'sold' ? '#ca8a04' : '#16a34a',
                                    fontWeight: '600',
                                    fontSize: '14px'
                                }}>
                                    {selectedItem.status === 'sold' ? 'VENDIDO' : 'DISPONIBLE'}
                                </div>
                            </div>

                            {/* Purchase Info */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
                                    Información de Compra
                                </div>
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    {selectedItem.purchase_date && (
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#64748b' }}>Fecha de compra</div>
                                            <div style={{ fontSize: '14px', fontWeight: '500' }}>{selectedItem.purchase_date}</div>
                                        </div>
                                    )}
                                    {selectedItem.cost_usd && (
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#64748b' }}>Costo USD</div>
                                            <div style={{ fontSize: '16px', fontWeight: '600', color: '#0369a1' }}>
                                                ${formatNumber(selectedItem.cost_usd)}
                                            </div>
                                        </div>
                                    )}
                                    {selectedItem.cost_ars && (
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#64748b' }}>Costo ARS</div>
                                            <div style={{ fontSize: '16px', fontWeight: '600', color: '#16a34a' }}>
                                                ${formatNumber(selectedItem.cost_ars)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Client Info (if sold) */}
                            {selectedItem.status === 'sold' && selectedItem.client_name && (
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
                                        Cliente
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>
                                        {selectedItem.client_name}
                                    </div>
                                    {selectedItem.client_dni && (
                                        <div style={{ fontSize: '14px', color: '#64748b' }}>
                                            DNI: {selectedItem.client_dni}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Sale Info (if sold) */}
                            {selectedItem.status === 'sold' && (
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
                                        Información de Venta
                                    </div>
                                    <div style={{ display: 'grid', gap: '12px' }}>
                                        {selectedItem.sale_date && (
                                            <div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>Fecha de venta</div>
                                                <div style={{ fontSize: '14px', fontWeight: '500' }}>{selectedItem.sale_date}</div>
                                            </div>
                                        )}
                                        {selectedItem.sale_price_usd && (
                                            <div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>Precio USD</div>
                                                <div style={{ fontSize: '18px', fontWeight: '600', color: '#0369a1' }}>
                                                    ${formatNumber(selectedItem.sale_price_usd)}
                                                </div>
                                            </div>
                                        )}
                                        {selectedItem.sale_price_ars && (
                                            <div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>Precio ARS</div>
                                                <div style={{ fontSize: '18px', fontWeight: '600', color: '#16a34a' }}>
                                                    ${formatNumber(selectedItem.sale_price_ars)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Payment Info (if sold) */}
                            {selectedItem.status === 'sold' && selectedItem.sale_price_ars && (
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
                                        Estado de Pago
                                    </div>
                                    <div style={{ display: 'grid', gap: '12px' }}>
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#64748b' }}>Monto pagado</div>
                                            <div style={{ fontSize: '16px', fontWeight: '600', color: '#16a34a' }}>
                                                ${formatNumber(selectedItem.amount_paid_ars || 0)} ARS
                                            </div>
                                        </div>
                                        {(() => {
                                            const salePrice = parseFloat(selectedItem.sale_price_ars || 0);
                                            const amountPaid = parseFloat(selectedItem.amount_paid_ars || 0);
                                            const balance = salePrice - amountPaid;
                                            const isPaid = selectedItem.payment_status === 'paid' || balance <= 0;

                                            return balance > 0 && !isPaid ? (
                                                <div>
                                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Saldo pendiente</div>
                                                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#dc2626' }}>
                                                        ${formatNumber(balance)} ARS
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{
                                                    padding: '12px',
                                                    background: '#dcfce7',
                                                    borderRadius: '8px',
                                                    color: '#16a34a',
                                                    fontWeight: '600',
                                                    textAlign: 'center'
                                                }}>
                                                    ✓ Pago completo
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}

                            {/* Observations */}
                            {selectedItem.observations && (
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
                                        Observaciones
                                    </div>
                                    <div style={{
                                        padding: '12px',
                                        background: '#f8fafc',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        color: '#475569',
                                        fontStyle: 'italic'
                                    }}>
                                        {selectedItem.observations}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Actions */}
                        <div style={{
                            padding: '20px',
                            borderTop: '1px solid #e2e8f0',
                            display: 'flex',
                            gap: '12px',
                            position: 'sticky',
                            bottom: 0,
                            background: 'white',
                            borderRadius: '0 0 16px 16px'
                        }}>
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    handleEditClick(selectedItem);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    background: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'background 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
                            >
                                <Edit size={16} />
                                Editar
                            </button>
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    handleDelete(selectedItem.id);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    background: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'background 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#b91c1c'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#dc2626'}
                            >
                                <Trash2 size={16} />
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
