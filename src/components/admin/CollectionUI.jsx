import { useState } from 'react';
import { AlertTriangle, Clock, CalendarClock, CheckCircle2, CircleDashed, Trash2, Plus, RefreshCw } from 'lucide-react';
import {
    formatMoney,
    formatDate,
    describeDays,
    generatePlan,
    addMonths,
    todayISO
} from '../../utils/salePayments';

const LEVELS = {
    paid: { icon: CheckCircle2, label: 'Pagado' },
    overdue: { icon: AlertTriangle, label: 'Cuota vencida' },
    soon: { icon: Clock, label: 'Por vencer' },
    ontrack: { icon: CalendarClock, label: 'Al día' },
    noplan: { icon: CircleDashed, label: 'Saldo pendiente' }
};

const INSTALLMENT_STATES = {
    paid: { icon: CheckCircle2, label: 'Pagada' },
    overdue: { icon: AlertTriangle, label: 'Vencida' },
    soon: { icon: Clock, label: 'Por vencer' },
    partial: { icon: CalendarClock, label: 'Parcial' },
    pending: { icon: CalendarClock, label: 'Pendiente' }
};

// Pill con ícono según el estado de cobranza (resultado de getCollectionStatus)
export function CollectionBadge({ status, compact = false }) {
    const { icon: Icon, label } = LEVELS[status.level];
    const text = status.level === 'overdue' && status.overdueCount > 1
        ? `${status.overdueCount} cuotas vencidas`
        : label;
    return (
        <span className={`col-badge col-${status.level}`} title={text}>
            <Icon size={13} />
            {!compact && text}
        </span>
    );
}

export function InstallmentStateBadge({ state }) {
    const { icon: Icon, label } = INSTALLMENT_STATES[state];
    return (
        <span className={`col-badge col-${state === 'pending' || state === 'partial' ? 'ontrack' : state}`}>
            <Icon size={12} /> {label}
        </span>
    );
}

// Resumen de cobranza para la tabla: montos, barra y próxima cuota
export function CollectionSummary({ status }) {
    if (status.total <= 0) return <span className="col-muted">Sin precio cargado</span>;
    const { next, currency } = status;
    return (
        <div className="col-summary">
            <div className="col-amounts">
                <b>{formatMoney(status.paid, currency)}</b>
                <span className="col-muted"> / {formatMoney(status.total, currency)}</span>
            </div>
            <div className="pay-progress small"><div style={{ width: `${status.progress}%` }} /></div>
            {status.level === 'overdue' && (
                <div className="col-line col-text-overdue">
                    <AlertTriangle size={12} /> Adeuda {formatMoney(status.overdueAmount, currency)} vencido
                </div>
            )}
            {next && status.level !== 'paid' && (
                <div className={`col-line col-text-${next.state}`}>
                    <CalendarClock size={12} />
                    Cuota {next.number}/{status.schedule.length}: {formatMoney(next.remaining, currency)} · {formatDate(next.dueDate)} ({describeDays(next.days)})
                </div>
            )}
            {status.level === 'noplan' && (
                <div className="col-line col-muted">Saldo {formatMoney(status.balance, currency)} · sin cuotas definidas</div>
            )}
        </div>
    );
}

/**
 * Editor del plan de cuotas: genera N cuotas y permite ajustar fecha límite
 * y monto de cada una. `rows` = [{ due_date, amount, notes }]
 */
export function InstallmentPlanEditor({ total, currency, saleDate, rows, onChange }) {
    const [gen, setGen] = useState({
        downPayment: '',
        count: '3',
        firstDueDate: addMonths(saleDate || todayISO(), 1),
        frequency: 'monthly'
    });

    const sum = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const diff = Math.round((total - sum) * 100) / 100;

    const parse = (v) => parseFloat(String(v).replace(/\./g, '').replace(',', '.')) || 0;

    const handleGenerate = () => {
        if (total <= 0) return alert('Primero cargá el precio total de la venta');
        onChange(generatePlan({
            total,
            count: gen.count,
            firstDueDate: gen.firstDueDate,
            frequency: gen.frequency,
            downPayment: parse(gen.downPayment),
            saleDate
        }));
    };

    const updateRow = (idx, field, value) => {
        onChange(rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
    };

    const addRow = () => {
        const last = rows[rows.length - 1];
        onChange([...rows, {
            due_date: last ? addMonths(last.due_date, 1) : gen.firstDueDate,
            amount: diff > 0 ? diff : 0,
            notes: ''
        }]);
    };

    const fixLast = () => {
        if (rows.length === 0) return;
        const last = rows[rows.length - 1];
        updateRow(rows.length - 1, 'amount', Math.round(((Number(last.amount) || 0) + diff) * 100) / 100);
    };

    return (
        <div className="plan-editor">
            <div className="plan-gen">
                <div className="cmd-group">
                    <label className="cmd-label">Anticipo ({currency})</label>
                    <input className="cmd-input" inputMode="numeric" placeholder="0" value={gen.downPayment}
                        onChange={e => setGen({ ...gen, downPayment: e.target.value.replace(/[^0-9]/g, '') === '' ? '' : new Intl.NumberFormat('es-AR').format(e.target.value.replace(/[^0-9]/g, '')) })} />
                </div>
                <div className="cmd-group">
                    <label className="cmd-label">Cuotas</label>
                    <input className="cmd-input" type="number" min="1" value={gen.count}
                        onChange={e => setGen({ ...gen, count: e.target.value })} />
                </div>
                <div className="cmd-group">
                    <label className="cmd-label">1er vencimiento</label>
                    <input className="cmd-input" type="date" value={gen.firstDueDate}
                        onChange={e => setGen({ ...gen, firstDueDate: e.target.value })} />
                </div>
                <div className="cmd-group">
                    <label className="cmd-label">Frecuencia</label>
                    <select className="cmd-select" value={gen.frequency} onChange={e => setGen({ ...gen, frequency: e.target.value })}>
                        <option value="monthly">Mensual</option>
                        <option value="biweekly">Quincenal</option>
                        <option value="weekly">Semanal</option>
                    </select>
                </div>
                <button type="button" className="plan-gen-btn" onClick={handleGenerate}>
                    <RefreshCw size={14} /> Generar cuotas
                </button>
            </div>

            {rows.length > 0 && (
                <div className="plan-rows">
                    <div className="plan-row plan-row-head">
                        <span>#</span><span>Fecha límite</span><span>Monto ({currency})</span><span>Nota</span><span />
                    </div>
                    {rows.map((r, idx) => (
                        <div className="plan-row" key={idx}>
                            <span className="plan-num">{idx + 1}</span>
                            <input className="cmd-input" type="date" required value={r.due_date}
                                onChange={e => updateRow(idx, 'due_date', e.target.value)} />
                            <input className="cmd-input" type="number" min="0" step="0.01" required value={r.amount}
                                onChange={e => updateRow(idx, 'amount', e.target.value === '' ? '' : Number(e.target.value))} />
                            <input className="cmd-input" placeholder="Opcional" value={r.notes || ''}
                                onChange={e => updateRow(idx, 'notes', e.target.value)} />
                            <button type="button" className="icon-btn delete-btn" title="Quitar cuota"
                                onClick={() => onChange(rows.filter((_, i) => i !== idx))}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="plan-footer">
                <button type="button" className="plan-link-btn" onClick={addRow}><Plus size={14} /> Agregar cuota</button>
                {rows.length > 0 && (
                    Math.abs(diff) < 0.01 ? (
                        <span className="col-text-paid"><CheckCircle2 size={13} /> Suma {formatMoney(sum, currency)} = total</span>
                    ) : (
                        <span className="col-text-soon">
                            <AlertTriangle size={13} /> Suma {formatMoney(sum, currency)} · {diff > 0 ? 'faltan' : 'sobran'} {formatMoney(Math.abs(diff), currency)}
                            {' '}<button type="button" className="plan-link-btn" onClick={fixLast}>Ajustar última</button>
                        </span>
                    )
                )}
            </div>
        </div>
    );
}
