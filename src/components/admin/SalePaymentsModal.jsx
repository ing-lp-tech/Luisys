import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { X, Trash2, PlusCircle, CalendarClock, Pencil, HandCoins, CheckCircle2, Receipt, Undo2 } from 'lucide-react';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import {
    CURRENCIES,
    PAYMENT_METHODS,
    formatMoney,
    formatDate,
    describeDays,
    todayISO,
    getCollectionStatus,
    getAmountToFinance,
    getUnlinkedPaid
} from '../../utils/salePayments';
import { CollectionBadge, InstallmentStateBadge, InstallmentPlanEditor } from './CollectionUI';

const parseAmount = (value) => parseFloat(String(value).replace(/\./g, '').replace(',', '.')) || 0;

const formatTyped = (value) => {
    const digits = String(value).replace(/[^0-9]/g, '');
    return digits === '' ? '' : new Intl.NumberFormat('es-AR').format(digits);
};

const toTyped = (amount) => (amount > 0 ? formatTyped(String(Math.round(amount))) : '');

/**
 * Cobranza de una venta: plan de cuotas con fechas límite + registro de pagos.
 * amount_paid / payment_status los recalcula Supabase con triggers.
 */
export default function SalePaymentsModal({ item, onClose, onChanged }) {
    const { rateConfig, getCurrentRate } = useExchangeRate();
    const [current, setCurrent] = useState(item);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingPlan, setEditingPlan] = useState(false);
    const [planRows, setPlanRows] = useState([]);
    // Cuota que se está cobrando desde su tarjeta: { number, payment_date, amount, payment_method }
    const [collecting, setCollecting] = useState(null);

    const status = getCollectionStatus(current);
    const { currency } = status;

    const [form, setForm] = useState({
        installment_number: '',
        payment_date: todayISO(),
        amount: '',
        currency,
        exchange_rate: '',
        payment_method: 'Efectivo',
        notes: ''
    });

    const needsRate = form.currency !== currency;

    useEffect(() => {
        loadAll();
    }, []);

    useEffect(() => {
        if (needsRate && !form.exchange_rate) {
            const rate = getCurrentRate?.();
            if (rate) setForm(f => ({ ...f, exchange_rate: formatTyped(String(Math.round(rate))) }));
        }
    }, [needsRate, rateConfig]);

    // Trae pagos, cuotas y los totales recalculados por el trigger
    const loadAll = async () => {
        setLoading(true);
        const [paysRes, instRes, itemRes] = await Promise.all([
            supabase.from('sale_payments').select('*').eq('item_id', item.id)
                .order('payment_date', { ascending: false }).order('created_at', { ascending: false }),
            supabase.from('sale_installments').select('*').eq('item_id', item.id).order('installment_number'),
            supabase.from('inventory_items').select('amount_paid, payment_status, amount_paid_ars, installments_count, first_due_date')
                .eq('id', item.id).single()
        ]);
        if (paysRes.error) alert('Error cargando pagos: ' + paysRes.error.message);
        setPayments(paysRes.data || []);

        const updated = { ...current, ...(itemRes.data || {}), installments: instRes.data || current.installments || [], payments: paysRes.data || [] };
        setCurrent(updated);
        setLoading(false);

        // Sugerir la próxima cuota impaga en el formulario
        const st = getCollectionStatus(updated);
        setForm(f => ({
            ...f,
            installment_number: st.next ? String(st.next.number) : '',
            amount: toTyped(st.next ? st.next.remaining : st.balance),
            notes: ''
        }));
        return updated;
    };

    const afterChange = async () => {
        await loadAll();
        onChanged?.();
    };

    // Monto que descuenta de la deuda, en la moneda de la venta
    const appliedPreview = () => {
        const amount = parseAmount(form.amount);
        if (!needsRate) return amount;
        const rate = parseAmount(form.exchange_rate);
        if (!rate) return 0;
        return currency === 'USD' ? amount / rate : amount * rate;
    };

    const insertPayment = async (payload) => {
        setSaving(true);
        try {
            const { error } = await supabase.from('sale_payments').insert({ item_id: item.id, ...payload });
            if (error) throw error;
            setCollecting(null);
            await afterChange();
        } catch (err) {
            alert('Error al registrar el pago: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleAdd = (e) => {
        e.preventDefault();
        const amount = parseAmount(form.amount);
        if (amount <= 0) return alert('Ingresá un monto mayor a 0');
        if (needsRate && !parseAmount(form.exchange_rate)) return alert('Ingresá el tipo de cambio');
        if (appliedPreview() > status.balance + 0.01 &&
            !window.confirm(`El pago supera el saldo pendiente (${formatMoney(status.balance, currency)}). ¿Registrarlo igual?`)) {
            return;
        }
        insertPayment({
            installment_number: form.installment_number ? Number(form.installment_number) : null,
            payment_date: form.payment_date,
            amount,
            currency: form.currency,
            exchange_rate: needsRate ? parseAmount(form.exchange_rate) : null,
            payment_method: form.payment_method || null,
            notes: form.notes || null
        });
    };

    // Abre el mini formulario de cobro dentro de la tarjeta de la cuota
    const startCollect = (inst) => setCollecting({
        number: inst.number,
        payment_date: todayISO(),
        amount: toTyped(inst.remaining),
        payment_method: 'Efectivo'
    });

    const confirmCollect = (e) => {
        e.preventDefault();
        const amount = parseAmount(collecting.amount);
        if (amount <= 0) return alert('Ingresá el monto cobrado');
        insertPayment({
            installment_number: collecting.number,
            payment_date: collecting.payment_date,
            amount,
            currency,
            payment_method: collecting.payment_method || null,
            notes: `Cuota ${collecting.number}`
        });
    };

    // Deshace el cobro de una cuota: borra los pagos asignados a ella
    const undoInstallment = async (inst) => {
        if (!window.confirm(`¿Deshacer el cobro de la cuota ${inst.number}? Se eliminan los pagos registrados para esa cuota.`)) return;
        const { error } = await supabase.from('sale_payments').delete()
            .eq('item_id', item.id).eq('installment_number', inst.number);
        if (error) return alert('Error: ' + error.message);
        await afterChange();
    };

    const handleSettleAll = () => {
        if (status.balance <= 0) return;
        if (!window.confirm(`¿Registrar un pago por todo el saldo (${formatMoney(status.balance, currency)})? La venta queda como PAGADA.`)) return;
        insertPayment({
            installment_number: status.next?.number ?? null,
            payment_date: todayISO(),
            amount: Math.round(status.balance * 100) / 100,
            currency,
            payment_method: form.payment_method || null,
            notes: 'Saldo total'
        });
    };

    const handleDelete = async (paymentId) => {
        if (!window.confirm('¿Eliminar este pago?')) return;
        const { error } = await supabase.from('sale_payments').delete().eq('id', paymentId);
        if (error) return alert('Error al eliminar: ' + error.message);
        await afterChange();
    };

    const startEditPlan = () => {
        setPlanRows(status.schedule.map(i => ({ due_date: i.dueDate, amount: i.amount, notes: i.notes || '' })));
        setEditingPlan(true);
    };

    // Lo que deben cubrir las cuotas: total menos anticipo / pagos a cuenta
    const unlinkedPaid = getUnlinkedPaid(current);
    const amountToFinance = getAmountToFinance(current);
    const planTargetLabel = unlinkedPaid > 0 ? 'saldo a financiar' : 'total de la venta';

    const savePlan = async () => {
        const rows = planRows.filter(r => r.due_date && Number(r.amount) > 0);
        const sum = rows.reduce((s, r) => s + Number(r.amount), 0);
        if (rows.length !== planRows.length) return alert('Todas las cuotas necesitan fecha y monto mayor a 0');
        if (Math.abs(sum - amountToFinance) > 0.01 &&
            !window.confirm(`Las cuotas suman ${formatMoney(sum, currency)} y el ${planTargetLabel} es ${formatMoney(amountToFinance, currency)}. ¿Guardar igual?`)) {
            return;
        }
        setSaving(true);
        try {
            const { error: delError } = await supabase.from('sale_installments').delete().eq('item_id', item.id);
            if (delError) throw delError;
            if (rows.length > 0) {
                const { error } = await supabase.from('sale_installments').insert(rows.map((r, idx) => ({
                    item_id: item.id,
                    installment_number: idx + 1,
                    due_date: r.due_date,
                    amount: Number(r.amount),
                    notes: r.notes || null
                })));
                if (error) throw error;
            }
            await supabase.from('inventory_items').update({
                installments_count: Math.max(1, rows.length),
                first_due_date: rows[0]?.due_date || null,
                installment_amount: null
            }).eq('id', item.id);
            setEditingPlan(false);
            await afterChange();
        } catch (err) {
            alert('Error al guardar el plan: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content sm-modal pay-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <HandCoins size={20} /> Cobranza
                        </h3>
                        <div className="pay-sub">
                            {current.productos?.nombre || current.product_name} · Serie {current.serial_number} · {current.client_name}
                            {current.client_dni ? ` · DNI ${current.client_dni}` : ''}
                        </div>
                    </div>
                    <button onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body">
                    {/* Resumen */}
                    <div className="pay-summary">
                        <div>
                            <span>Total ({currency})</span>
                            <b>{formatMoney(status.total, currency)}</b>
                        </div>
                        <div>
                            <span>Cobrado</span>
                            <b className="pay-green">{formatMoney(status.paid, currency)}</b>
                        </div>
                        <div>
                            <span>Saldo</span>
                            <b className={status.balance > 0 ? 'pay-red' : 'pay-green'}>{formatMoney(status.balance, currency)}</b>
                        </div>
                        <div className={status.overdueAmount > 0 ? 'pay-summary-alert' : ''}>
                            <span>Vencido</span>
                            <b className={status.overdueAmount > 0 ? 'pay-red' : ''}>{formatMoney(status.overdueAmount, currency)}</b>
                        </div>
                    </div>
                    <div className="pay-status-line">
                        <CollectionBadge status={status} />
                        <div className="pay-progress"><div style={{ width: `${status.progress}%` }} /></div>
                        <span className="pay-sub">{Math.round(status.progress)}%</span>
                    </div>

                    <div className="pay-columns">
                        {/* Columna izquierda: plan de cuotas */}
                        <section className="pay-panel">
                            <div className="pay-panel-head">
                                <h4><CalendarClock size={16} /> Plan de cuotas {status.schedule.length > 0 && `(${status.paidCount}/${status.schedule.length} pagadas)`}</h4>
                                {!editingPlan && (
                                    <button type="button" className="plan-link-btn" onClick={startEditPlan}>
                                        <Pencil size={13} /> {status.schedule.length ? 'Editar plan' : 'Definir cuotas'}
                                    </button>
                                )}
                            </div>

                            {editingPlan ? (
                                <>
                                    {unlinkedPaid > 0 && (
                                        <div className="plan-note">
                                            Ya cobraste {formatMoney(unlinkedPaid, currency)} sin asignar a cuotas (anticipo / a cuenta).
                                            Las cuotas cubren el resto.
                                        </div>
                                    )}
                                    <InstallmentPlanEditor
                                        total={amountToFinance}
                                        targetLabel={planTargetLabel}
                                        showDownPayment={unlinkedPaid === 0}
                                        currency={currency}
                                        saleDate={current.sale_date}
                                        rows={planRows}
                                        onChange={setPlanRows}
                                    />
                                    <div className="plan-actions">
                                        <button type="button" className="cmd-btn" onClick={() => setEditingPlan(false)}>Cancelar</button>
                                        <button type="button" className="cmd-btn btn-primary" disabled={saving} onClick={savePlan}>
                                            {saving ? 'Guardando...' : 'Guardar plan'}
                                        </button>
                                    </div>
                                </>
                            ) : status.schedule.length === 0 ? (
                                <div className="pay-empty">
                                    Esta venta no tiene cuotas con fecha límite. Definilas para recibir avisos de vencimiento.
                                </div>
                            ) : (
                                <div className="inst-list">
                                    {unlinkedPaid > 0 && (
                                        <div className="plan-note">
                                            Anticipo / pagos a cuenta: <b>{formatMoney(unlinkedPaid, currency)}</b> (no se asignan a ninguna cuota)
                                        </div>
                                    )}
                                    {status.schedule.map(inst => (
                                        <div key={inst.number} className={`inst-card inst-${inst.state}`}>
                                            <div className="inst-main">
                                                <div className="inst-num">{inst.number}</div>
                                                <div className="inst-body">
                                                    <div className="inst-top">
                                                        <b>{formatMoney(inst.amount, currency)}</b>
                                                        <InstallmentStateBadge state={inst.state} />
                                                    </div>
                                                    <div className="pay-sub">
                                                        Límite {formatDate(inst.dueDate)}
                                                        {inst.state !== 'paid' && ` · ${describeDays(inst.days)}`}
                                                        {inst.covered > 0 && inst.state !== 'paid' && ` · cobrado ${formatMoney(inst.covered, currency)}, falta ${formatMoney(inst.remaining, currency)}`}
                                                        {inst.notes ? ` · ${inst.notes}` : ''}
                                                    </div>
                                                    {inst.state === 'paid' && inst.lastPayment && (
                                                        <div className="inst-paid-info">
                                                            <CheckCircle2 size={12} /> Cobrada el {formatDate(inst.lastPayment.payment_date)}
                                                            {inst.lastPayment.payment_method ? ` · ${inst.lastPayment.payment_method}` : ''}
                                                        </div>
                                                    )}
                                                </div>
                                                {inst.state !== 'paid' && collecting?.number !== inst.number && (
                                                    <button type="button" className="inst-pay-btn" disabled={saving}
                                                        onClick={() => startCollect(inst)} title="Registrar que te pagaron esta cuota">
                                                        <HandCoins size={14} /> Registrar cobro
                                                    </button>
                                                )}
                                                {inst.state === 'paid' && inst.lastPayment && (
                                                    <button type="button" className="inst-undo-btn" disabled={saving}
                                                        onClick={() => undoInstallment(inst)} title="Deshacer el cobro de esta cuota">
                                                        <Undo2 size={13} /> Deshacer
                                                    </button>
                                                )}
                                            </div>

                                            {collecting?.number === inst.number && (
                                                <form className="inst-collect" onSubmit={confirmCollect}>
                                                    <div className="cmd-group">
                                                        <label className="cmd-label">Fecha en que te pagó</label>
                                                        <input className="cmd-input" type="date" required value={collecting.payment_date}
                                                            onChange={e => setCollecting({ ...collecting, payment_date: e.target.value })} />
                                                    </div>
                                                    <div className="cmd-group">
                                                        <label className="cmd-label">Monto ({currency})</label>
                                                        <input className="cmd-input" inputMode="numeric" required value={collecting.amount}
                                                            onChange={e => setCollecting({ ...collecting, amount: formatTyped(e.target.value) })} />
                                                    </div>
                                                    <div className="cmd-group">
                                                        <label className="cmd-label">Método</label>
                                                        <select className="cmd-select" value={collecting.payment_method}
                                                            onChange={e => setCollecting({ ...collecting, payment_method: e.target.value })}>
                                                            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="inst-collect-actions">
                                                        <button type="button" className="cmd-btn btn-ghost" onClick={() => setCollecting(null)}>Cancelar</button>
                                                        <button type="submit" className="pay-submit-btn" disabled={saving}>
                                                            <CheckCircle2 size={15} /> {saving ? 'Guardando...' : 'Confirmar cobro'}
                                                        </button>
                                                    </div>
                                                </form>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Columna derecha: registrar pago + historial */}
                        <section className="pay-panel">
                            <form className="pay-form" onSubmit={handleAdd}>
                                <div className="pay-panel-head">
                                    <h4><PlusCircle size={16} /> Registrar pago</h4>
                                    {status.balance > 0 && (
                                        <button type="button" className="plan-link-btn" onClick={handleSettleAll} disabled={saving}>
                                            Saldar todo
                                        </button>
                                    )}
                                </div>
                                <div className="row-2">
                                    <div className="cmd-group">
                                        <label className="cmd-label">Corresponde a</label>
                                        <select className="cmd-select" value={form.installment_number}
                                            onChange={e => {
                                                const inst = status.schedule.find(i => String(i.number) === e.target.value);
                                                setForm({ ...form, installment_number: e.target.value, amount: inst ? toTyped(inst.remaining) : form.amount });
                                            }}>
                                            <option value="">Sin cuota (anticipo / a cuenta)</option>
                                            {status.schedule.filter(i => i.state !== 'paid').map(i => (
                                                <option key={i.number} value={i.number}>
                                                    Cuota {i.number} · {formatDate(i.dueDate)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="cmd-group">
                                        <label className="cmd-label">Fecha de pago</label>
                                        <input className="cmd-input" type="date" required value={form.payment_date}
                                            onChange={e => setForm({ ...form, payment_date: e.target.value })} />
                                    </div>
                                </div>
                                <div className="row-2">
                                    <div className="cmd-group">
                                        <label className="cmd-label">Moneda</label>
                                        <div className="currency-toggle">
                                            {CURRENCIES.map(c => (
                                                <button type="button" key={c} className={form.currency === c ? 'active' : ''}
                                                    onClick={() => setForm({ ...form, currency: c })}>{c}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="cmd-group">
                                        <label className="cmd-label">Monto ({form.currency})</label>
                                        <input className="cmd-input" inputMode="numeric" placeholder="0" required value={form.amount}
                                            onChange={e => setForm({ ...form, amount: formatTyped(e.target.value) })} />
                                    </div>
                                </div>
                                {needsRate && (
                                    <div className="cmd-group">
                                        <label className="cmd-label">Tipo de cambio (ARS por 1 USD)</label>
                                        <input className="cmd-input" inputMode="numeric" value={form.exchange_rate}
                                            onChange={e => setForm({ ...form, exchange_rate: formatTyped(e.target.value) })} />
                                        <small className="pay-sub">Descuenta {formatMoney(appliedPreview(), currency)} del saldo</small>
                                    </div>
                                )}
                                <div className="row-2">
                                    <div className="cmd-group">
                                        <label className="cmd-label">Método</label>
                                        <select className="cmd-select" value={form.payment_method}
                                            onChange={e => setForm({ ...form, payment_method: e.target.value })}>
                                            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div className="cmd-group">
                                        <label className="cmd-label">Nota</label>
                                        <input className="cmd-input" placeholder="Opcional" value={form.notes}
                                            onChange={e => setForm({ ...form, notes: e.target.value })} />
                                    </div>
                                </div>
                                <button type="submit" className="pay-submit-btn" disabled={saving}>
                                    <PlusCircle size={16} /> {saving ? 'Guardando...' : 'Registrar pago'}
                                </button>
                            </form>

                            <div className="pay-panel-head" style={{ marginTop: 18 }}>
                                <h4><Receipt size={16} /> Pagos recibidos ({payments.length})</h4>
                            </div>
                            {loading ? (
                                <div className="pay-empty">Cargando...</div>
                            ) : payments.length === 0 ? (
                                <div className="pay-empty">Todavía no se registraron pagos.</div>
                            ) : (
                                <div className="pay-list">
                                    {payments.map(p => (
                                        <div key={p.id} className="pay-row">
                                            <div>
                                                <div className="pay-row-main">
                                                    {formatMoney(p.amount, p.currency)}
                                                    {p.installment_number ? <span className="pay-chip">Cuota {p.installment_number}</span> : null}
                                                </div>
                                                <div className="pay-sub">
                                                    {formatDate(p.payment_date)}{p.payment_method ? ` · ${p.payment_method}` : ''}
                                                    {p.currency !== currency && p.amount_applied != null
                                                        ? ` · = ${formatMoney(p.amount_applied, currency)} (TC ${formatMoney(p.exchange_rate, 'ARS')})` : ''}
                                                    {p.notes ? ` · ${p.notes}` : ''}
                                                </div>
                                            </div>
                                            <button className="icon-btn delete-btn" title="Eliminar pago" onClick={() => handleDelete(p.id)}>
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
