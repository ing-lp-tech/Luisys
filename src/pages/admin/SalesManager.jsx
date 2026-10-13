import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    Package, ShoppingCart, Upload, Search, PlusCircle, CheckCircle, Edit, Trash2, X, Save,
    DollarSign, AlertTriangle, Clock, Wallet, HandCoins, FileText, ChevronUp
} from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import ExchangeRateConfig from '../../components/admin/ExchangeRateConfig';
import SalePaymentsModal from '../../components/admin/SalePaymentsModal';
import { CollectionBadge, CollectionSummary, InstallmentPlanEditor } from '../../components/admin/CollectionUI';
import {
    CURRENCIES,
    PAYMENT_METHODS,
    DUE_SOON_DAYS,
    formatMoney,
    formatDate,
    todayISO,
    getCostInfo,
    getSaleSummary,
    getCollectionStatus,
    groupInstallments
} from '../../utils/salePayments';
import './SalesManager.css';

const MAX_IMAGES = 5;

// Botonera ARS / USD reutilizada en compra, venta y edición
const CurrencyToggle = ({ value, onChange }) => (
    <div className="currency-toggle">
        {CURRENCIES.map(c => (
            <button type="button" key={c} className={value === c ? 'active' : ''} onClick={() => onChange(c)}>
                {c}
            </button>
        ))}
    </div>
);

// Selector de imágenes con preview. `existing` son URLs ya subidas, `files` son File nuevos.
const ImagePicker = ({ id, existing = [], files, onAddFiles, onRemoveExisting, onRemoveFile }) => {
    const count = existing.length + files.length;
    return (
        <div className="cmd-group">
            <label className="cmd-label">Imágenes del producto ({count}/{MAX_IMAGES})</label>
            {count < MAX_IMAGES && (
                <>
                    <input
                        type="file" multiple accept="image/*" id={id} style={{ display: 'none' }}
                        onChange={e => {
                            const added = Array.from(e.target.files || []);
                            if (count + added.length > MAX_IMAGES) return alert(`Máximo ${MAX_IMAGES} imágenes del producto permitidas`);
                            onAddFiles(added);
                            e.target.value = '';
                        }}
                    />
                    <label htmlFor={id} className="upload-drop">
                        <Upload size={18} /> Seleccionar imágenes
                    </label>
                </>
            )}
            {count > 0 && (
                <div className="thumb-grid">
                    {existing.map((url, i) => (
                        <div key={url} className="thumb">
                            <img src={url} alt={`Producto ${i + 1}`} />
                            <button type="button" onClick={() => onRemoveExisting(i)}>×</button>
                        </div>
                    ))}
                    {files.map((file, i) => (
                        <div key={`${file.name}-${i}`} className="thumb">
                            <img src={URL.createObjectURL(file)} alt={`Nueva ${i + 1}`} />
                            <button type="button" onClick={() => onRemoveFile(i)}>×</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Sube archivos al bucket de contratos y devuelve las URLs públicas
const uploadFiles = async (files, prefix) => {
    const urls = [];
    for (const file of files) {
        const ext = file.name.split('.').pop();
        const name = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('sales-contracts').upload(name, file);
        if (error) throw error;
        urls.push(supabase.storage.from('sales-contracts').getPublicUrl(name).data.publicUrl);
    }
    return urls;
};

const COLLECTION_FILTERS = [
    { key: 'all', label: 'Todas' },
    { key: 'overdue', label: 'Vencidas', icon: AlertTriangle },
    { key: 'soon', label: 'Por vencer', icon: Clock },
    { key: 'debt', label: 'Con saldo', icon: Wallet },
    { key: 'paid', label: 'Pagadas', icon: CheckCircle }
];

export default function SalesManager({ showHeaderAndExchange = true }) {
    const [mode, setMode] = useState('sale'); // 'entry' | 'sale'
    const [formOpen, setFormOpen] = useState(false);
    const [viewMode, setViewMode] = useState('all'); // 'all' | 'stock' | 'sold'
    const [collectionFilter, setCollectionFilter] = useState('all');
    const [submitting, setSubmitting] = useState(false);
    const [filter, setFilter] = useState('');

    const [editingItem, setEditingItem] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [paymentsItem, setPaymentsItem] = useState(null); // Venta con el modal de cobranza abierto

    const [products, setProducts] = useState([]);
    const [inventory, setInventory] = useState([]);

    const [entryForm, setEntryForm] = useState({
        product_id: '',
        serial_number: '',
        model_variant: '',
        cost_currency: 'USD',
        cost_amount: '',
        purchase_date: todayISO()
    });

    const emptySaleForm = () => ({
        filter_product_id: '',
        serial_input: '',
        client_name: '',
        client_dni: '',
        sale_currency: 'USD',
        sale_price: '',
        sale_date: todayISO(),
        payment_mode: 'contado', // 'contado' | 'cuotas'
        plan_rows: [], // [{ due_date, amount, notes }]
        initial_payment: '', // Lo cobrado en el momento (anticipo o pago total)
        initial_method: 'Efectivo',
        files: [], // Contratos/documentos
        observations: '',
        product_images: []
    });

    const [saleForm, setSaleForm] = useState(emptySaleForm);

    useEffect(() => {
        fetchProducts();
        fetchInventory();
    }, []);

    const fetchProducts = async () => {
        const { data } = await supabase.from('productos').select('id, nombre').order('nombre');
        setProducts(data || []);
    };

    const fetchInventory = async () => {
        const [invRes, instRes, payRes] = await Promise.all([
            supabase.rpc('get_inventory'),
            supabase.from('sale_installments').select('*').order('installment_number'),
            supabase.from('sale_payments').select('item_id, installment_number, amount, amount_applied, payment_date, payment_method')
        ]);
        if (instRes.error) console.error('Error cargando cuotas (¿corriste sql/08?):', instRes.error);
        const byItem = groupInstallments(instRes.data);
        const paymentsByItem = groupInstallments(payRes.data);

        let rows = invRes.data;
        if (invRes.error) {
            console.error('Error fetching inventory:', invRes.error);
            const { data: tableData } = await supabase.from('inventory_items')
                .select('*, productos(nombre)')
                .order('created_at', { ascending: false });
            rows = (tableData || []).map(i => ({ ...i, product_name: i.productos?.nombre }));
        }

        setInventory((rows || []).map(item => ({
            ...item,
            productos: { nombre: item.product_name },
            installments: byItem[item.id] || [],
            payments: paymentsByItem[item.id] || []
        })));
    };

    // --- Helpers de montos (formato es-AR con puntos de miles) ---
    const formatNumber = (value) => {
        if (!value) return '';
        const raw = value.toString().replace(/\./g, '');
        if (isNaN(raw)) return value;
        return new Intl.NumberFormat('es-AR').format(raw);
    };

    const cleanNumber = (value) => {
        if (!value) return 0;
        return parseFloat(value.toString().replace(/\./g, '').replace(',', '.')) || 0;
    };

    const handlePriceChange = (e, form, setForm, field) => {
        const digits = e.target.value.replace(/[^0-9]/g, '');
        setForm({ ...form, [field]: digits === '' ? '' : new Intl.NumberFormat('es-AR').format(digits) });
    };

    // --- Datos derivados ---
    const availableItems = useMemo(() => inventory.filter(i => i.status === 'available'), [inventory]);

    const soldWithStatus = useMemo(() => inventory
        .filter(i => i.status === 'sold')
        .map(i => ({ item: i, status: getCollectionStatus(i) })), [inventory]);

    const statusById = useMemo(() => Object.fromEntries(soldWithStatus.map(s => [s.item.id, s.status])), [soldWithStatus]);

    const alerts = useMemo(() => {
        const sumBy = (list, field) => list.reduce((acc, { status }) => {
            acc[status.currency] = (acc[status.currency] || 0) + status[field];
            return acc;
        }, {});
        const overdue = soldWithStatus.filter(s => s.status.level === 'overdue');
        const soon = soldWithStatus.filter(s => s.status.level === 'soon');
        const debt = soldWithStatus.filter(s => !s.status.isPaid && s.status.balance > 0);
        return {
            overdue,
            soon,
            debt,
            overdueAmounts: sumBy(overdue, 'overdueAmount'),
            debtAmounts: sumBy(debt, 'balance')
        };
    }, [soldWithStatus]);

    const moneyList = (amounts) => {
        const entries = Object.entries(amounts).filter(([, v]) => v > 0);
        return entries.length ? entries.map(([cur, v]) => formatMoney(v, cur)).join(' + ') : formatMoney(0, 'USD');
    };

    const stockCount = availableItems.length;
    const soldCount = soldWithStatus.length;

    const filteredInventory = inventory.filter(i => {
        if (viewMode === 'stock' && i.status !== 'available') return false;
        if (viewMode === 'sold' && i.status !== 'sold') return false;

        if (collectionFilter !== 'all') {
            const st = statusById[i.id];
            if (!st) return false;
            if (collectionFilter === 'overdue' && st.level !== 'overdue') return false;
            if (collectionFilter === 'soon' && st.level !== 'soon') return false;
            if (collectionFilter === 'debt' && (st.isPaid || st.balance <= 0)) return false;
            if (collectionFilter === 'paid' && !st.isPaid) return false;
        }

        const q = filter.toLowerCase();
        return !q || [i.productos?.nombre, i.serial_number, i.client_name, i.client_dni]
            .some(v => v?.toLowerCase().includes(q));
    }).sort((a, b) => {
        // Primero lo que requiere atención: vencidas, después por vencer
        const rank = (i) => ({ overdue: 0, soon: 1 }[statusById[i.id]?.level] ?? 2);
        return rank(a) - rank(b);
    });

    const showCollectionFilter = (key) => {
        setViewMode('sold');
        setCollectionFilter(key);
    };

    // --- Alta de compra ---
    const handleEntrySubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const cost = cleanNumber(entryForm.cost_amount) || null;
            const { error } = await supabase.rpc('register_entry', {
                p_product_id: entryForm.product_id,
                p_serial_number: entryForm.serial_number,
                p_model_variant: entryForm.model_variant,
                p_cost_currency: entryForm.cost_currency,
                p_cost_usd: entryForm.cost_currency === 'USD' ? cost : null,
                p_cost_ars: entryForm.cost_currency === 'ARS' ? cost : null,
                p_purchase_date: entryForm.purchase_date
            });
            if (error) throw error;
            alert('Entrada guardada.');
            setEntryForm({ ...entryForm, serial_number: '', model_variant: '', cost_amount: '' });
            fetchInventory();
        } catch (err) { alert(err.message); }
        finally { setSubmitting(false); }
    };

    // Al generar un plan con anticipo, sugerirlo como "cobrado hoy"
    const handlePlanChange = (rows) => {
        setSaleForm(f => ({
            ...f,
            plan_rows: rows,
            initial_payment: !f.initial_payment && rows[0]?.notes === 'Anticipo' ? formatNumber(String(Math.round(rows[0].amount))) : f.initial_payment
        }));
    };

    // --- Alta de venta ---
    const handleSaleSubmit = async (e) => {
        e.preventDefault();
        if (!saleForm.filter_product_id) return alert('Seleccioná un producto');
        if (!saleForm.serial_input) return alert('Seleccioná un número de serie');

        const salePrice = cleanNumber(saleForm.sale_price);
        const initialPayment = cleanNumber(saleForm.initial_payment);
        const isInstallments = saleForm.payment_mode === 'cuotas';
        const planRows = isInstallments ? saleForm.plan_rows : [];
        // Si el plan incluye el anticipo como cuota 1, lo cobrado hoy es esa cuota;
        // si no, lo cobrado hoy queda "a cuenta" y las cuotas cubren el resto
        const planIncludesDown = planRows[0]?.notes === 'Anticipo';
        const planTarget = planIncludesDown ? salePrice : salePrice - initialPayment;

        if (salePrice <= 0) return alert('Ingresá el precio de venta');
        if (initialPayment > salePrice) return alert('Lo cobrado no puede ser mayor al precio de venta');
        if (isInstallments) {
            if (planRows.length === 0) return alert('Generá o cargá las cuotas con su fecha límite');
            if (planRows.some(r => !r.due_date || !(Number(r.amount) > 0))) return alert('Todas las cuotas necesitan fecha límite y monto');
            const sum = planRows.reduce((s, r) => s + Number(r.amount), 0);
            if (Math.abs(sum - planTarget) > 0.01 &&
                !window.confirm(`Las cuotas suman ${formatMoney(sum, saleForm.sale_currency)} pero deberían sumar ${formatMoney(planTarget, saleForm.sale_currency)}. ¿Guardar igual?`)) {
                return;
            }
        }

        setSubmitting(true);
        try {
            let warning = '';
            let contractUrls = [];
            let imageUrls = [];
            try { contractUrls = await uploadFiles(saleForm.files, 'contract'); }
            catch (err) { console.error(err); warning += '\n\n⚠️ Los contratos NO se subieron. La venta se guardó sin archivos.'; }
            try { imageUrls = await uploadFiles(saleForm.product_images, 'product'); }
            catch (err) { console.error(err); warning += '\n\n⚠️ Las imágenes del producto NO se subieron.'; }

            const existingItem = availableItems.find(i =>
                i.product_id === saleForm.filter_product_id && i.serial_number === saleForm.serial_input
            );

            // La venta queda en una sola moneda; amount_paid / payment_status los calcula Supabase
            const saleData = {
                status: 'sold',
                client_name: saleForm.client_name,
                client_dni: saleForm.client_dni,
                sale_currency: saleForm.sale_currency,
                sale_price_usd: saleForm.sale_currency === 'USD' ? salePrice : null,
                sale_price_ars: saleForm.sale_currency === 'ARS' ? salePrice : null,
                sale_date: saleForm.sale_date,
                installments_count: Math.max(1, planRows.length),
                installment_amount: null,
                first_due_date: planRows[0]?.due_date || saleForm.sale_date,
                contract_files: contractUrls.length ? contractUrls : null,
                observations: saleForm.observations || null,
                product_images: imageUrls.length ? imageUrls : null
            };

            const { data: saved, error } = existingItem
                ? await supabase.from('inventory_items').update(saleData).eq('id', existingItem.id).select('id').single()
                : await supabase.from('inventory_items').insert({
                    ...saleData,
                    product_id: saleForm.filter_product_id,
                    serial_number: saleForm.serial_input,
                    purchase_date: saleForm.sale_date
                }).select('id').single();
            if (error) throw error;

            if (planRows.length > 0) {
                await supabase.from('sale_installments').delete().eq('item_id', saved.id);
                const { error: planError } = await supabase.from('sale_installments').insert(planRows.map((r, idx) => ({
                    item_id: saved.id,
                    installment_number: idx + 1,
                    due_date: r.due_date,
                    amount: Number(r.amount),
                    notes: r.notes || null
                })));
                if (planError) warning += `\n\n⚠️ La venta se guardó pero las cuotas no: ${planError.message}`;
            }

            if (initialPayment > 0) {
                const { error: payError } = await supabase.from('sale_payments').insert({
                    item_id: saved.id,
                    installment_number: planIncludesDown ? 1 : null,
                    payment_date: saleForm.sale_date,
                    amount: initialPayment,
                    currency: saleForm.sale_currency,
                    payment_method: saleForm.initial_method || null,
                    notes: isInstallments ? 'Pago al momento de la venta' : 'Pago contado'
                });
                if (payError) warning += `\n\n⚠️ La venta se guardó pero el pago no: ${payError.message}`;
            }

            alert('Venta registrada exitosamente.' + warning);
            setSaleForm(emptySaleForm());
            fetchInventory();
        } catch (err) { alert(err.message); }
        finally { setSubmitting(false); }
    };

    // --- Acciones ---
    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de ELIMINAR este item? Esta acción no se puede deshacer.')) return;
        const { error } = await supabase.from('inventory_items').delete().eq('id', id);
        if (error) return alert('Error al eliminar: ' + error.message);
        fetchInventory();
    };

    const handleEditClick = (item) => {
        const cost = getCostInfo(item);
        const sale = getSaleSummary(item);
        setEditingItem(item);
        setEditForm({
            ...item,
            cost_currency: cost.currency,
            cost_amount: formatNumber(cost.amount),
            sale_currency: sale.currency,
            sale_price: formatNumber(sale.total),
            observations: item.observations || '',
            contract_files: item.contract_files || [],
            product_images: item.product_images || [],
            newFiles: [],
            newProductImages: []
        });
    };

    const handleSaveEdit = async () => {
        try {
            const isSold = editForm.status === 'sold';
            const cost = cleanNumber(editForm.cost_amount) || null;
            const salePrice = cleanNumber(editForm.sale_price) || null;
            const originalSale = getSaleSummary(editingItem);
            // Los pagos ya convertidos quedarían en la moneda vieja: hay que borrarlos antes de cambiarla
            if (isSold && editForm.sale_currency !== originalSale.currency && originalSale.paid > 0) {
                return alert(`Esta venta ya tiene pagos registrados en ${originalSale.currency}. Eliminá esos pagos antes de cambiar la moneda.`);
            }
            if (editForm.product_images.length + editForm.newProductImages.length > MAX_IMAGES) {
                return alert(`Máximo ${MAX_IMAGES} imágenes del producto permitidas`);
            }

            const contractFiles = [...editForm.contract_files, ...await uploadFiles(editForm.newFiles, 'contract')];
            const productImages = [...editForm.product_images, ...await uploadFiles(editForm.newProductImages, 'product')];

            const updates = {
                serial_number: editForm.serial_number,
                model_variant: editForm.model_variant,
                purchase_date: editForm.purchase_date,
                cost_currency: editForm.cost_currency,
                cost_usd: editForm.cost_currency === 'USD' ? cost : null,
                cost_ars: editForm.cost_currency === 'ARS' ? cost : null,
                client_name: editForm.client_name,
                client_dni: editForm.client_dni,
                status: editForm.status,
                contract_files: contractFiles,
                observations: editForm.observations || null,
                product_images: productImages.length ? productImages : null
            };
            if (isSold) {
                Object.assign(updates, {
                    sale_date: editForm.sale_date,
                    sale_currency: editForm.sale_currency,
                    sale_price_usd: editForm.sale_currency === 'USD' ? salePrice : null,
                    sale_price_ars: editForm.sale_currency === 'ARS' ? salePrice : null
                });
            }

            const { error } = await supabase.from('inventory_items').update(updates).eq('id', editingItem.id);
            if (error) throw error;
            setEditingItem(null);
            fetchInventory();
        } catch (err) { alert('Error al guardar: ' + err.message); }
    };

    const openForm = (newMode) => {
        if (formOpen && mode === newMode) return setFormOpen(false);
        setMode(newMode);
        setFormOpen(true);
    };

    const salePriceValue = cleanNumber(saleForm.sale_price);
    const formPlanIncludesDown = saleForm.plan_rows[0]?.notes === 'Anticipo';
    const formPlanTarget = formPlanIncludesDown
        ? salePriceValue
        : Math.max(0, salePriceValue - cleanNumber(saleForm.initial_payment));
    const stockForProduct = availableItems.filter(i => i.product_id === saleForm.filter_product_id);

    return (
        <div className="sales-dashboard">
            {showHeaderAndExchange && <AdminHeader title="Finanzas" />}
            {showHeaderAndExchange && <ExchangeRateConfig />}

            {/* ===== Alertas de cobranza ===== */}
            {(alerts.overdue.length > 0 || alerts.soon.length > 0) && (
                <div className="alert-strip">
                    {alerts.overdue.length > 0 && (
                        <button className="alert-card alert-overdue" onClick={() => showCollectionFilter('overdue')}>
                            <AlertTriangle size={22} />
                            <div>
                                <b>{alerts.overdue.length} {alerts.overdue.length === 1 ? 'venta con cuotas vencidas' : 'ventas con cuotas vencidas'}</b>
                                <span>Adeudado vencido: {moneyList(alerts.overdueAmounts)} · {alerts.overdue.map(s => s.item.client_name).join(', ')}</span>
                            </div>
                        </button>
                    )}
                    {alerts.soon.length > 0 && (
                        <button className="alert-card alert-soon" onClick={() => showCollectionFilter('soon')}>
                            <Clock size={22} />
                            <div>
                                <b>{alerts.soon.length} {alerts.soon.length === 1 ? 'cuota vence' : 'cuotas vencen'} en los próximos {DUE_SOON_DAYS} días</b>
                                <span>
                                    {alerts.soon.map(s => `${s.item.client_name} (${formatDate(s.status.next.dueDate)})`).join(', ')}
                                </span>
                            </div>
                        </button>
                    )}
                </div>
            )}

            {/* ===== KPIs ===== */}
            <div className="kpi-strip kpi-strip-4">
                <button className={`mini-kpi ${viewMode === 'stock' ? 'kpi-active' : ''}`}
                    onClick={() => { setViewMode('stock'); setCollectionFilter('all'); }}>
                    <div className="kpi-icon-wrap"><Package size={20} /></div>
                    <div className="kpi-content">
                        <div>En stock</div>
                        <div>{stockCount}</div>
                    </div>
                </button>
                <button className={`mini-kpi ${viewMode === 'sold' && collectionFilter === 'all' ? 'kpi-active' : ''}`}
                    onClick={() => { setViewMode('sold'); setCollectionFilter('all'); }}>
                    <div className="kpi-icon-wrap green"><CheckCircle size={20} /></div>
                    <div className="kpi-content">
                        <div>Vendidos</div>
                        <div>{soldCount}</div>
                    </div>
                </button>
                <button className={`mini-kpi ${collectionFilter === 'debt' ? 'kpi-active' : ''}`} onClick={() => showCollectionFilter('debt')}>
                    <div className="kpi-icon-wrap amber"><Wallet size={20} /></div>
                    <div className="kpi-content">
                        <div>Por cobrar ({alerts.debt.length})</div>
                        <div className="kpi-money">{moneyList(alerts.debtAmounts)}</div>
                    </div>
                </button>
                <button className={`mini-kpi ${collectionFilter === 'overdue' ? 'kpi-active' : ''}`} onClick={() => showCollectionFilter('overdue')}>
                    <div className="kpi-icon-wrap red"><AlertTriangle size={20} /></div>
                    <div className="kpi-content">
                        <div>Vencido ({alerts.overdue.length})</div>
                        <div className="kpi-money">{moneyList(alerts.overdueAmounts)}</div>
                    </div>
                </button>
            </div>

            {/* ===== Formularios de entrada / venta ===== */}
            <div className="control-panel">
                <div className="control-head">
                    <div>
                        <div className="panel-title">Centro de Control</div>
                        <div className="panel-subtitle">Registrá compras (entradas) y ventas con su plan de cuotas.</div>
                    </div>
                    <div className="mode-switch">
                        <button className={`mode-btn ${formOpen && mode === 'entry' ? 'active entry-mode' : ''}`} onClick={() => openForm('entry')}>
                            <PlusCircle size={16} /> Nueva entrada
                        </button>
                        <button className={`mode-btn ${formOpen && mode === 'sale' ? 'active sale-mode' : ''}`} onClick={() => openForm('sale')}>
                            <ShoppingCart size={16} /> Nueva venta
                        </button>
                        {formOpen && (
                            <button className="mode-btn" onClick={() => setFormOpen(false)} title="Cerrar formulario">
                                <ChevronUp size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {formOpen && mode === 'entry' && (
                    <form className="cmd-form form-grid" onSubmit={handleEntrySubmit}>
                        <div className="cmd-group span-2">
                            <label className="cmd-label">Producto</label>
                            <select className="cmd-select" required value={entryForm.product_id}
                                onChange={e => setEntryForm({ ...entryForm, product_id: e.target.value })}>
                                <option value="">Seleccionar...</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                            </select>
                        </div>
                        <div className="cmd-group">
                            <label className="cmd-label">Nro. de serie</label>
                            <input className="cmd-input" required placeholder="SN-123" value={entryForm.serial_number}
                                onChange={e => setEntryForm({ ...entryForm, serial_number: e.target.value })} />
                        </div>
                        <div className="cmd-group">
                            <label className="cmd-label">Modelo / variante</label>
                            <input className="cmd-input" placeholder="Modelo 2024" value={entryForm.model_variant}
                                onChange={e => setEntryForm({ ...entryForm, model_variant: e.target.value })} />
                        </div>
                        <div className="cmd-group">
                            <label className="cmd-label">Moneda de compra</label>
                            <CurrencyToggle value={entryForm.cost_currency} onChange={c => setEntryForm({ ...entryForm, cost_currency: c })} />
                        </div>
                        <div className="cmd-group">
                            <label className="cmd-label">Costo ({entryForm.cost_currency})</label>
                            <input className="cmd-input" inputMode="numeric" placeholder="0" value={entryForm.cost_amount}
                                onChange={e => handlePriceChange(e, entryForm, setEntryForm, 'cost_amount')} />
                        </div>
                        <div className="cmd-group">
                            <label className="cmd-label">Fecha de compra</label>
                            <input className="cmd-input" type="date" required value={entryForm.purchase_date}
                                onChange={e => setEntryForm({ ...entryForm, purchase_date: e.target.value })} />
                        </div>
                        <div className="span-all form-actions">
                            <button type="submit" className="cmd-btn btn-primary" disabled={submitting}>
                                <PlusCircle size={16} /> {submitting ? 'Guardando...' : 'Registrar entrada'}
                            </button>
                        </div>
                    </form>
                )}

                {formOpen && mode === 'sale' && (
                    <form className="cmd-form form-grid" onSubmit={handleSaleSubmit}>
                        <div className="form-section-title span-all">1. Producto y cliente</div>
                        <div className="cmd-group span-2">
                            <label className="cmd-label">Producto</label>
                            <select className="cmd-select" value={saleForm.filter_product_id}
                                onChange={e => setSaleForm({ ...saleForm, filter_product_id: e.target.value, serial_input: '' })}>
                                <option value="">Seleccionar producto...</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                            </select>
                        </div>
                        <div className="cmd-group span-2">
                            <label className="cmd-label">Nro. de serie (en stock)</label>
                            <select className="cmd-select" disabled={!saleForm.filter_product_id} value={saleForm.serial_input}
                                onChange={e => setSaleForm({ ...saleForm, serial_input: e.target.value })}>
                                <option value="">-- Seleccionar serie --</option>
                                {stockForProduct.map(item => (
                                    <option key={item.id} value={item.serial_number}>
                                        {item.serial_number} {item.model_variant ? `(${item.model_variant})` : ''}
                                    </option>
                                ))}
                            </select>
                            {saleForm.filter_product_id && stockForProduct.length === 0 && (
                                <small className="pay-red">⚠️ No hay stock para este producto. Cargá una entrada primero.</small>
                            )}
                        </div>
                        <div className="cmd-group span-2">
                            <label className="cmd-label">Cliente</label>
                            <input className="cmd-input" required placeholder="Nombre del cliente" value={saleForm.client_name}
                                onChange={e => setSaleForm({ ...saleForm, client_name: e.target.value })} />
                        </div>
                        <div className="cmd-group">
                            <label className="cmd-label">DNI</label>
                            <input className="cmd-input" placeholder="12345678" value={saleForm.client_dni}
                                onChange={e => setSaleForm({ ...saleForm, client_dni: e.target.value })} />
                        </div>
                        <div className="cmd-group">
                            <label className="cmd-label">Fecha de venta</label>
                            <input className="cmd-input" type="date" required value={saleForm.sale_date}
                                onChange={e => setSaleForm({ ...saleForm, sale_date: e.target.value })} />
                        </div>

                        <div className="form-section-title span-all">2. Precio y forma de pago</div>
                        <div className="cmd-group">
                            <label className="cmd-label">Moneda de venta</label>
                            <CurrencyToggle value={saleForm.sale_currency} onChange={c => setSaleForm({ ...saleForm, sale_currency: c })} />
                        </div>
                        <div className="cmd-group">
                            <label className="cmd-label">Precio total ({saleForm.sale_currency})</label>
                            <input className="cmd-input input-strong" inputMode="numeric" required placeholder="0" value={saleForm.sale_price}
                                onChange={e => handlePriceChange(e, saleForm, setSaleForm, 'sale_price')} />
                        </div>
                        <div className="cmd-group span-2">
                            <label className="cmd-label">Forma de pago</label>
                            <div className="currency-toggle">
                                <button type="button" className={saleForm.payment_mode === 'contado' ? 'active' : ''}
                                    onClick={() => setSaleForm({ ...saleForm, payment_mode: 'contado' })}>Contado</button>
                                <button type="button" className={saleForm.payment_mode === 'cuotas' ? 'active' : ''}
                                    onClick={() => setSaleForm({ ...saleForm, payment_mode: 'cuotas' })}>En cuotas (con fechas límite)</button>
                            </div>
                        </div>

                        {saleForm.payment_mode === 'cuotas' && (
                            <div className="span-all">
                                <InstallmentPlanEditor
                                    total={formPlanTarget}
                                    showDownPayment={!cleanNumber(saleForm.initial_payment) || formPlanIncludesDown}
                                    targetLabel={formPlanIncludesDown || !cleanNumber(saleForm.initial_payment) ? 'total de la venta' : 'saldo a financiar (total − cobrado hoy)'}
                                    currency={saleForm.sale_currency}
                                    saleDate={saleForm.sale_date}
                                    rows={saleForm.plan_rows}
                                    onChange={handlePlanChange}
                                />
                            </div>
                        )}

                        <div className="cmd-group">
                            <label className="cmd-label">Cobrado hoy ({saleForm.sale_currency})</label>
                            <div className="input-with-btn">
                                <input className="cmd-input" inputMode="numeric" placeholder="0" value={saleForm.initial_payment}
                                    onChange={e => handlePriceChange(e, saleForm, setSaleForm, 'initial_payment')} />
                                {saleForm.payment_mode === 'contado' && saleForm.sale_price && (
                                    <button type="button" className="pay-fill-btn"
                                        onClick={() => setSaleForm({ ...saleForm, initial_payment: saleForm.sale_price })}>Total</button>
                                )}
                            </div>
                        </div>
                        <div className="cmd-group">
                            <label className="cmd-label">Método</label>
                            <select className="cmd-select" value={saleForm.initial_method}
                                onChange={e => setSaleForm({ ...saleForm, initial_method: e.target.value })}>
                                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        {salePriceValue > 0 && (
                            <div className="sale-balance-box span-2">
                                <HandCoins size={18} />
                                <div>
                                    Saldo a cobrar: <b className="pay-red">
                                        {formatMoney(Math.max(0, salePriceValue - cleanNumber(saleForm.initial_payment)), saleForm.sale_currency)}
                                    </b>
                                    <div className="pay-sub">Los pagos siguientes se registran desde el botón <DollarSign size={11} /> de la venta.</div>
                                </div>
                            </div>
                        )}

                        <div className="form-section-title span-all">3. Notas y archivos</div>
                        <div className="cmd-group span-2">
                            <label className="cmd-label">Observaciones</label>
                            <textarea className="cmd-input" rows="3" placeholder="Notas sobre la venta, condiciones especiales, etc..."
                                value={saleForm.observations} onChange={e => setSaleForm({ ...saleForm, observations: e.target.value })} />
                        </div>
                        <ImagePicker
                            id="saleProductImages"
                            files={saleForm.product_images}
                            onAddFiles={added => setSaleForm(f => ({ ...f, product_images: [...f.product_images, ...added] }))}
                            onRemoveFile={i => setSaleForm(f => ({ ...f, product_images: f.product_images.filter((_, idx) => idx !== i) }))}
                        />
                        <div className="cmd-group">
                            <label className="cmd-label">Contrato / documentos</label>
                            <input type="file" multiple id="saleContracts" style={{ display: 'none' }}
                                onChange={e => setSaleForm(f => ({ ...f, files: [...f.files, ...Array.from(e.target.files || [])] }))} />
                            <label htmlFor="saleContracts" className="upload-drop"><FileText size={18} /> Adjuntar archivos</label>
                            <div className="file-tags">
                                {saleForm.files.map((f, i) => <span key={i} className="file-tag">{f.name.substring(0, 18)}</span>)}
                            </div>
                        </div>

                        <div className="span-all form-actions">
                            <button type="submit" className="cmd-btn btn-success" disabled={submitting}>
                                <ShoppingCart size={16} /> {submitting ? 'Procesando...' : 'Confirmar venta'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* ===== Tabla ===== */}
            <div className="table-card">
                <div className="table-toolbar">
                    <div className="toolbar-left">
                        <div className="seg">
                            {[['all', 'Todo'], ['stock', 'En stock'], ['sold', 'Vendidos']].map(([key, label]) => (
                                <button key={key} className={viewMode === key ? 'active' : ''}
                                    onClick={() => { setViewMode(key); if (key === 'stock') setCollectionFilter('all'); }}>
                                    {label}
                                </button>
                            ))}
                        </div>
                        {viewMode !== 'stock' && (
                            <div className="chip-row">
                                {COLLECTION_FILTERS.map(({ key, label, icon: Icon }) => {
                                    const count = key === 'overdue' ? alerts.overdue.length : key === 'soon' ? alerts.soon.length : null;
                                    return (
                                        <button key={key} className={`chip chip-${key} ${collectionFilter === key ? 'active' : ''}`}
                                            onClick={() => setCollectionFilter(key)}>
                                            {Icon && <Icon size={13} />} {label}{count ? ` (${count})` : ''}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <div className="search-box">
                        <Search className="search-icon" />
                        <input className="search-input" placeholder="Buscar producto, serie, cliente, DNI..." value={filter}
                            onChange={e => setFilter(e.target.value)} />
                    </div>
                </div>

                <div className="table-scroller">
                    <table className="clean-table sales-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Serie / estado</th>
                                <th>Compra</th>
                                <th>Venta</th>
                                <th>Cobranza</th>
                                <th className="th-actions">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInventory.map(item => {
                                const isSold = item.status === 'sold';
                                const status = statusById[item.id];
                                const cost = getCostInfo(item);
                                return (
                                    <tr key={item.id} className={status ? `row-${status.level}` : ''}>
                                        <td>
                                            <div className="product-cell">{item.productos?.nombre}</div>
                                            <div className="variant-sub">{item.model_variant}</div>
                                        </td>
                                        <td>
                                            <div className="serial">{item.serial_number}</div>
                                            <div className="badge-row">
                                                {isSold
                                                    ? <span className="pay-badge pay-badge-sold">VENDIDO</span>
                                                    : <span className="pay-badge pay-badge-stock">EN STOCK</span>}
                                                {status && <CollectionBadge status={status} />}
                                            </div>
                                        </td>
                                        <td className="cell-sm">
                                            <div>{formatDate(item.purchase_date)}</div>
                                            <div className="col-muted">{cost.amount > 0 ? formatMoney(cost.amount, cost.currency) : 'Sin costo'}</div>
                                        </td>
                                        <td className="cell-sm">
                                            {isSold ? (
                                                <>
                                                    <div className="client-name">{item.client_name}</div>
                                                    <div className="col-muted">
                                                        {formatDate(item.sale_date)}{item.client_dni ? ` · DNI ${item.client_dni}` : ''}
                                                    </div>
                                                    {item.observations && (
                                                        <div className="obs" title={item.observations}>💬 {item.observations}</div>
                                                    )}
                                                </>
                                            ) : <span className="col-muted">—</span>}
                                        </td>
                                        <td className="cell-sm">
                                            {status ? <CollectionSummary status={status} /> : <span className="col-muted">—</span>}
                                        </td>
                                        <td>
                                            <div className="row-actions">
                                                {isSold && (
                                                    <button className={`pay-open ${status?.level === 'overdue' ? 'urgent' : ''}`} onClick={() => setPaymentsItem(item)} title="Cobranza: cuotas y pagos">
                                                        <DollarSign size={15} /> Cobrar
                                                    </button>
                                                )}
                                                <button className="icon-btn edit-btn" onClick={() => handleEditClick(item)} title="Editar">
                                                    <Edit size={16} />
                                                </button>
                                                <button className="icon-btn delete-btn" onClick={() => handleDelete(item.id)} title="Eliminar">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredInventory.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="empty-cell">Sin resultados</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ===== Modal de edición ===== */}
            {editingItem && (
                <div className="modal-overlay" onClick={() => setEditingItem(null)}>
                    <div className="modal-content sm-modal edit-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3>Editar {editingItem.status === 'sold' ? 'venta' : 'item'}</h3>
                                <div className="pay-sub">{editingItem.productos?.nombre}</div>
                            </div>
                            <button onClick={() => setEditingItem(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="edit-columns">
                                <section className="edit-section">
                                    <h4><Package size={16} /> Producto y compra</h4>
                                    <div className="row-2">
                                        <div className="cmd-group">
                                            <label className="cmd-label">Serie</label>
                                            <input className="cmd-input" value={editForm.serial_number || ''}
                                                onChange={e => setEditForm({ ...editForm, serial_number: e.target.value })} />
                                        </div>
                                        <div className="cmd-group">
                                            <label className="cmd-label">Variante</label>
                                            <input className="cmd-input" value={editForm.model_variant || ''}
                                                onChange={e => setEditForm({ ...editForm, model_variant: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="row-2">
                                        <div className="cmd-group">
                                            <label className="cmd-label">Moneda de compra</label>
                                            <CurrencyToggle value={editForm.cost_currency} onChange={c => setEditForm({ ...editForm, cost_currency: c })} />
                                        </div>
                                        <div className="cmd-group">
                                            <label className="cmd-label">Costo ({editForm.cost_currency})</label>
                                            <input className="cmd-input" inputMode="numeric" value={editForm.cost_amount || ''}
                                                onChange={e => handlePriceChange(e, editForm, setEditForm, 'cost_amount')} />
                                        </div>
                                    </div>
                                    <div className="cmd-group">
                                        <label className="cmd-label">Fecha de compra</label>
                                        <input className="cmd-input" type="date" value={editForm.purchase_date || ''}
                                            onChange={e => setEditForm({ ...editForm, purchase_date: e.target.value })} />
                                    </div>
                                    <ImagePicker
                                        id="editProductImages"
                                        existing={editForm.product_images}
                                        files={editForm.newProductImages}
                                        onAddFiles={added => setEditForm(f => ({ ...f, newProductImages: [...f.newProductImages, ...added] }))}
                                        onRemoveExisting={i => setEditForm(f => ({ ...f, product_images: f.product_images.filter((_, idx) => idx !== i) }))}
                                        onRemoveFile={i => setEditForm(f => ({ ...f, newProductImages: f.newProductImages.filter((_, idx) => idx !== i) }))}
                                    />
                                </section>

                                {editForm.status === 'sold' && (
                                    <section className="edit-section">
                                        <h4><ShoppingCart size={16} /> Venta</h4>
                                        <div className="row-2">
                                            <div className="cmd-group">
                                                <label className="cmd-label">Cliente</label>
                                                <input className="cmd-input" value={editForm.client_name || ''}
                                                    onChange={e => setEditForm({ ...editForm, client_name: e.target.value })} />
                                            </div>
                                            <div className="cmd-group">
                                                <label className="cmd-label">DNI</label>
                                                <input className="cmd-input" value={editForm.client_dni || ''}
                                                    onChange={e => setEditForm({ ...editForm, client_dni: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="row-2">
                                            <div className="cmd-group">
                                                <label className="cmd-label">Moneda de venta</label>
                                                <CurrencyToggle value={editForm.sale_currency} onChange={c => setEditForm({ ...editForm, sale_currency: c })} />
                                            </div>
                                            <div className="cmd-group">
                                                <label className="cmd-label">Precio total ({editForm.sale_currency})</label>
                                                <input className="cmd-input" inputMode="numeric" value={editForm.sale_price || ''}
                                                    onChange={e => handlePriceChange(e, editForm, setEditForm, 'sale_price')} />
                                            </div>
                                        </div>
                                        <div className="cmd-group">
                                            <label className="cmd-label">Fecha de venta</label>
                                            <input className="cmd-input" type="date" value={editForm.sale_date || ''}
                                                onChange={e => setEditForm({ ...editForm, sale_date: e.target.value })} />
                                        </div>
                                        <div className="cmd-group">
                                            <label className="cmd-label">Observaciones</label>
                                            <textarea className="cmd-input" rows="3" value={editForm.observations || ''}
                                                onChange={e => setEditForm({ ...editForm, observations: e.target.value })} />
                                        </div>

                                        <div className="pay-edit-box">
                                            <div className="pay-edit-head">
                                                <b>Cobranza</b>
                                                {statusById[editingItem.id] && <CollectionBadge status={statusById[editingItem.id]} />}
                                            </div>
                                            {statusById[editingItem.id] && <CollectionSummary status={statusById[editingItem.id]} />}
                                            <button type="button" className="pay-submit-btn"
                                                onClick={() => { setPaymentsItem(editingItem); setEditingItem(null); }}>
                                                <DollarSign size={16} /> Cuotas y pagos
                                            </button>
                                        </div>

                                        <div className="cmd-group">
                                            <label className="cmd-label">Contratos / documentos</label>
                                            {editForm.contract_files.length > 0 && (
                                                <div className="file-list-edit">
                                                    {editForm.contract_files.map((url, i) => (
                                                        <div key={url} className="file-item-edit">
                                                            <a href={url} target="_blank" rel="noreferrer">Archivo {i + 1}</a>
                                                            <button type="button" className="icon-btn delete-btn"
                                                                onClick={() => setEditForm(f => ({ ...f, contract_files: f.contract_files.filter((_, idx) => idx !== i) }))}>
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <input type="file" multiple id="editContracts" style={{ display: 'none' }}
                                                onChange={e => setEditForm(f => ({ ...f, newFiles: [...f.newFiles, ...Array.from(e.target.files || [])] }))} />
                                            <label htmlFor="editContracts" className="upload-drop"><FileText size={18} /> Agregar archivo</label>
                                            <div className="file-tags">
                                                {editForm.newFiles.map((f, i) => (
                                                    <span key={i} className="file-tag">
                                                        {f.name.substring(0, 18)}
                                                        <X size={12} style={{ cursor: 'pointer', marginLeft: 4 }}
                                                            onClick={() => setEditForm(ef => ({ ...ef, newFiles: ef.newFiles.filter((_, idx) => idx !== i) }))} />
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </section>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="cmd-btn btn-ghost" onClick={() => setEditingItem(null)}>Cancelar</button>
                            <button className="cmd-btn btn-primary" onClick={handleSaveEdit}>
                                <Save size={16} /> Guardar cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Modal de cobranza ===== */}
            {paymentsItem && (
                <SalePaymentsModal
                    item={paymentsItem}
                    onClose={() => setPaymentsItem(null)}
                    onChanged={fetchInventory}
                />
            )}
        </div>
    );
}
