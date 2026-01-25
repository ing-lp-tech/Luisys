import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Package, ShoppingCart, Upload, Search, FileText, LayoutDashboard, PlusCircle, CheckCircle, Smartphone, Edit, Trash2, X, Save } from 'lucide-react';
import './SalesManager.css';

export default function SalesManager() {
    const [mode, setMode] = useState('entry'); // 'entry' | 'sale'
    const [viewMode, setViewMode] = useState('stock'); // 'stock' | 'sold'
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [filter, setFilter] = useState('');

    // Editing State
    const [editingItem, setEditingItem] = useState(null);
    const [editForm, setEditForm] = useState({});

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
        files: []
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

        setSubmitting(true);
        try {
            // 1. Upload files first (best effort - don't fail if bucket has issues)
            const uploadedUrls = [];
            let uploadWarning = '';

            if (saleForm.files.length > 0) {
                try {
                    for (const file of saleForm.files) {
                        const ext = file.name.split('.').pop();
                        const name = `contract_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
                        const { error } = await supabase.storage.from('sales-contracts').upload(name, file);
                        if (error) throw error;
                        const { data } = supabase.storage.from('sales-contracts').getPublicUrl(name);
                        uploadedUrls.push(data.publicUrl);
                    }
                } catch (uploadError) {
                    console.error('File upload failed:', uploadError);
                    uploadWarning = '\n\n⚠️ Archivos NO se subieron (problema de permisos). La venta se guardó sin archivos.';
                }
            }

            // 2. Check if item exists in stock
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
                    client_dni: saleForm.client_dni, // NEW
                    sale_price_usd: cleanNumber(saleForm.sale_price_usd),
                    sale_price_ars: cleanNumber(saleForm.sale_price_ars),
                    sale_date: saleForm.sale_date,
                    contract_files: uploadedUrls.length > 0 ? uploadedUrls : null
                }).eq('id', existingItem.id);
                error = updateError;
            } else {
                // INSERT new item (Sold immediately)
                const { error: insertError } = await supabase.from('inventory_items').insert({
                    product_id: saleForm.filter_product_id,
                    serial_number: saleForm.serial_input,
                    status: 'sold',
                    client_name: saleForm.client_name,
                    client_dni: saleForm.client_dni, // NEW
                    sale_price_usd: cleanNumber(saleForm.sale_price_usd),
                    sale_price_ars: cleanNumber(saleForm.sale_price_ars),
                    sale_date: saleForm.sale_date,
                    contract_files: uploadedUrls.length > 0 ? uploadedUrls : null,
                    purchase_date: saleForm.sale_date // Default purchase date to sale date if unknown
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
                files: []
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
        if (viewMode === 'stock' && i.status !== 'available') return false;
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
            newFiles: [] // Initialize for new uploads
        });
    };

    const handleSaveEdit = async () => {
        try {
            // 1. Handle File Uploads
            let finalFiles = editForm.contract_files || []; // Start with existing kept files

            if (editForm.newFiles && editForm.newFiles.length > 0) {
                for (const file of editForm.newFiles) {
                    const ext = file.name.split('.').pop();
                    const name = `contract_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
                    const { error } = await supabase.storage.from('sales-contracts').upload(name, file);
                    if (error) throw error;
                    const { data } = supabase.storage.from('sales-contracts').getPublicUrl(name);
                    finalFiles.push(data.publicUrl);
                }
            }

            // 2. Prepare Updates
            const updates = {
                serial_number: editForm.serial_number,
                model_variant: editForm.model_variant,
                cost_usd: cleanNumber(editForm.cost_usd),
                cost_ars: cleanNumber(editForm.cost_ars),
                client_name: editForm.client_name,
                client_dni: editForm.client_dni,
                sale_price_usd: cleanNumber(editForm.sale_price_usd),
                sale_price_ars: cleanNumber(editForm.sale_price_ars),
                status: editForm.status,
                contract_files: finalFiles // Update files list
            };

            const { error } = await supabase.from('inventory_items').update(updates).eq('id', editingItem.id);
            if (error) throw error;

            setEditingItem(null);
            fetchInventory();
        } catch (err) { alert('Error al guardar: ' + err.message); }
    };

    return (
        <div className="sales-dashboard">

            {/* LEFT COLUMN: CONTROL PANEL */}
            <div className="control-panel">
                <div className="panel-header">
                    <div className="panel-title">
                        <LayoutDashboard size={20} />
                        Centro de Control
                    </div>
                    <div className="panel-subtitle">Administra stock y ventas desde aquí.</div>
                </div>

                {/* Mode Switcher */}
                <div className="mode-switch">
                    <button
                        className={`mode-btn ${mode === 'entry' ? 'active entry-mode' : ''}`}
                        onClick={() => setMode('entry')}
                    >
                        <PlusCircle size={16} style={{ display: 'inline', marginBottom: -2 }} /> Entrada
                    </button>
                    <button
                        className={`mode-btn ${mode === 'sale' ? 'active sale-mode' : ''}`}
                        onClick={() => setMode('sale')}
                    >
                        <ShoppingCart size={16} style={{ display: 'inline', marginBottom: -2 }} /> Venta
                    </button>
                </div>

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
                            <label className="cmd-label">Fecha Venta</label>
                            <input className="cmd-input" type="date" required value={saleForm.sale_date} onChange={e => setSaleForm({ ...saleForm, sale_date: e.target.value })} />
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
                            {viewMode === 'stock' ? 'Listado de Stock Disponible' : 'Historial de Ventas'}
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
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{item.serial_number}</td>
                                        <td>
                                            {item.status === 'available' ? (
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                    Compra: {item.purchase_date} <br />
                                                    Costo: ${item.cost_usd || 0} USD
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                    Cliente: <b>{item.client_name}</b> <br />
                                                    {item.client_dni && <span>DNI: {item.client_dni}</span>}
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

            {/* EDIT MODAL */}
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

                                    {/* FILE MANAGEMENT */}
                                    <div className="cmd-group" style={{ marginTop: 10 }}>
                                        <label className="cmd-label">Archivos / Fotos</label>

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
            )}
        </div>
    );
}
