import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { X, Trash2, PlusCircle, Calendar } from 'lucide-react';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import {
    CURRENCIES,
    PAYMENT_METHODS,
    formatMoney,
    getSaleSummary,
    buildInstallmentSchedule
} from '../../utils/salePayments';

const STATE_LABELS = {
    paid: '✓ Pagada',
    partial: 'Parcial',
    overdue: 'Vencida',
    pending: 'Pendiente'
};

const parseAmount = (value) => parseFloat(value.toString().replace(/\./g, '').replace(',', '.')) || 0;

const formatTyped = (value) => {
    const digits = value.replace(/[^0-9]/g, '');
    return digits === '' ? '' : new Intl.NumberFormat('es-AR').format(digits);
};

/**
 * Modal para ver y registrar los pagos (cuotas) de una venta.
 * El total cobrado y el estado los recalcula Supabase con triggers.
 */
export default function SalePaymentsModal({ item, onClose, onChanged }) {
    const { rateConfig, getCurrentRate } = useExchangeRate();
    const [current, setCurrent] = useState(item);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const summary = getSaleSummary(current);
    const schedule = buildInstallmentSchedule(current);
    const nextInstallment = schedule.find(i => i.state !== 'paid');

    const suggestedAmount = () => {
        const target = nextInstallment ? nextInstallment.amount - nextInstallment.covered : summary.balance;
        return target > 0 ? formatTyped(String(Math.round(target))) : '';
    };

    const [form, setForm] = useState({
        payment_date: new Date().toISOString().split('T')[0],
        amount: suggestedAmount(),
        currency: summary.currency,
        exchange_rate: '',
        payment_method: 'Efectivo',
        notes: ''
    });

    const needsRate = form.currency !== summary.currency;

    useEffect(() => {
        fetchPayments();
    }, []);

    useEffect(() => {
        if (needsRate && !form.exchange_rate) {
            const rate = getCurrentRate?.();
            if (rate) setForm(f => ({ ...f, exchange_rate: String(Math.round(rate)) }));
        }
    }, [needsRate, rateConfig]);

    const fetchPayments = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('sale_payments')
            .select('*')
            .eq('item_id', item.id)
            .order('payment_date', { ascending: true })
            .order('created_at', { ascending: true });
        if (error) alert('Error cargando pagos: ' + error.message);
        setPayments(data || []);
        setLoading(false);
    };

    // Después de cada cambio traemos de nuevo la venta para tener amount_paid/payment_status del trigger
    const refreshItem = async () => {
        const { data } = await supabase
            .from('inventory_items')
            .select('amount_paid, payment_status, amount_paid_ars')
            .eq('id', item.id)
            .single();
        const updated = data ? { ...current, ...data } : current;
        setCurrent(updated);
        onChanged?.();
        return updated;
    };

    // Monto que descuenta de la deuda, en la moneda de la venta
    const appliedPreview = () => {
        const amount = parseAmount(form.amount);
        if (!needsRate) return amount;
        const rate = parseAmount(form.exchange_rate);
        if (!rate) return 0;
        return summary.currency === 'USD' ? amount / rate : amount * rate;
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        const amount = parseAmount(form.amount);
        if (amount <= 0) return alert('Ingresá un monto mayor a 0');
        if (needsRate && !parseAmount(form.exchange_rate)) return alert('Ingresá el tipo de cambio');
        if (appliedPreview() > summary.balance + 0.01 &&
            !window.confirm(`El pago supera el saldo pendiente (${formatMoney(summary.balance, summary.currency)}). ¿Registrarlo igual?`)) {
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase.from('sale_payments').insert({
                item_id: item.id,
                installment_number: nextInstallment?.number ?? payments.length + 1,
                payment_date: form.payment_date,
                amount,
                currency: form.currency,
                exchange_rate: needsRate ? parseAmount(form.exchange_rate) : null,
                payment_method: form.payment_method || null,
                notes: form.notes || null
            });
            if (error) throw error;

            await fetchPayments();
            const updated = await refreshItem();
            const updatedSummary = getSaleSummary(updated);
            const nextOpen = buildInstallmentSchedule(updated).find(i => i.state !== 'paid');
            const nextTarget = nextOpen ? nextOpen.amount - nextOpen.covered : updatedSummary.balance;
            setForm(f => ({
                ...f,
                amount: nextTarget > 0 ? formatTyped(String(Math.round(nextTarget))) : '',
                notes: ''
            }));
        } catch (err) {
            alert('Error al registrar el pago: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (paymentId) => {
        if (!window.confirm('¿Eliminar este pago?')) return;
        const { error } = await supabase.from('sale_payments').delete().eq('id', paymentId);
        if (error) return alert('Error al eliminar: ' + error.message);
        await fetchPayments();
        await refreshItem();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content pay-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Pagos de la venta</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body">
                    <div className="pay-heading">
                        <div className="pay-product">{current.productos?.nombre || current.product_name}</div>
                        <div className="pay-sub">
                            Serie {current.serial_number} · {current.client_name}
                            {current.client_dni ? ` · DNI ${current.client_dni}` : ''}
                        </div>
                    </div>

                    {/* Resumen */}
                    <div className="pay-summary">
                        <div>
                            <span>Total ({summary.currency})</span>
                            <b>{formatMoney(summary.total, summary.currency)}</b>
                        </div>
                        <div>
                            <span>Cobrado</span>
                            <b className="pay-green">{formatMoney(summary.paid, summary.currency)}</b>
                        </div>
                        <div>
                            <span>Saldo</span>
                            <b className={summary.balance > 0 ? 'pay-red' : 'pay-green'}>
                                {formatMoney(summary.balance, summary.currency)}
                            </b>
                        </div>
                    </div>
                    <div className="pay-progress"><div style={{ width: `${summary.progress}%` }} /></div>

                    {/* Plan de cuotas */}
                    {schedule.length > 0 && (
                        <div className="cmd-group">
                            <label className="cmd-label">Plan de cuotas ({schedule.length})</label>
                            <div className="pay-schedule">
                                {schedule.map(inst => (
                                    <div key={inst.number} className={`pay-inst pay-inst-${inst.state}`}>
                                        <span className="pay-inst-num">Cuota {inst.number}</span>
                                        <span className="pay-inst-date">
                                            <Calendar size={12} /> {inst.dueDate || '—'}
                                        </span>
                                        <span>{formatMoney(inst.amount, summary.currency)}</span>
                                        <span className="pay-inst-state">{STATE_LABELS[inst.state]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Historial de pagos */}
                    <div className="cmd-group">
                        <label className="cmd-label">Pagos registrados ({payments.length})</label>
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
                                                {p.installment_number ? `Cuota ${p.installment_number} · ` : ''}
                                                {formatMoney(p.amount, p.currency)}
                                                {p.currency !== summary.currency && p.amount_applied != null && (
                                                    <span className="pay-sub"> (= {formatMoney(p.amount_applied, summary.currency)} a {formatMoney(p.exchange_rate, 'ARS')})</span>
                                                )}
                                            </div>
                                            <div className="pay-sub">
                                                {p.payment_date}{p.payment_method ? ` · ${p.payment_method}` : ''}{p.notes ? ` · ${p.notes}` : ''}
                                            </div>
                                        </div>
                                        <button className="icon-btn delete-btn" title="Eliminar pago" onClick={() => handleDelete(p.id)}>
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Nuevo pago */}
                    <form className="pay-form" onSubmit={handleAdd}>
                        <label className="cmd-label">
                            Registrar pago{nextInstallment ? ` (cuota ${nextInstallment.number} de ${schedule.length})` : ''}
                        </label>
                        <div className="row-2">
                            <div className="cmd-group">
                                <label className="cmd-label">Fecha</label>
                                <input className="cmd-input" type="date" required value={form.payment_date}
                                    onChange={e => setForm({ ...form, payment_date: e.target.value })} />
                            </div>
                            <div className="cmd-group">
                                <label className="cmd-label">Método</label>
                                <select className="cmd-select" value={form.payment_method}
                                    onChange={e => setForm({ ...form, payment_method: e.target.value })}>
                                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="row-2">
                            <div className="cmd-group">
                                <label className="cmd-label">Moneda del pago</label>
                                <div className="currency-toggle">
                                    {CURRENCIES.map(c => (
                                        <button type="button" key={c}
                                            className={form.currency === c ? 'active' : ''}
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
                                <input className="cmd-input" inputMode="numeric" placeholder="1.200" value={form.exchange_rate}
                                    onChange={e => setForm({ ...form, exchange_rate: formatTyped(e.target.value) })} />
                                <small className="pay-sub">
                                    Descuenta {formatMoney(appliedPreview(), summary.currency)} de la deuda en {summary.currency}
                                </small>
                            </div>
                        )}
                        <div className="cmd-group">
                            <label className="cmd-label">Nota (opcional)</label>
                            <input className="cmd-input" placeholder="Ej: transferencia Banco Nación" value={form.notes}
                                onChange={e => setForm({ ...form, notes: e.target.value })} />
                        </div>
                        <button type="submit" className="cmd-btn btn-success" disabled={saving}>
                            <PlusCircle size={16} style={{ marginRight: 6 }} />
                            {saving ? 'Guardando...' : 'Registrar pago'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
