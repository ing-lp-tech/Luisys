// Helpers compartidos para ventas en una moneda + cobro en cuotas.
// La base (sql/07 y sql/08) calcula amount_paid y payment_status; el plan de
// cuotas vive en sale_installments. Acá derivamos lo que necesita la UI.

export const CURRENCIES = ['ARS', 'USD'];

export const PAYMENT_METHODS = ['Efectivo', 'Transferencia', 'Mercado Pago', 'Cheque', 'Tarjeta', 'Otro'];

// Cuántos días antes del vencimiento una cuota se considera "por vencer"
export const DUE_SOON_DAYS = 7;

export const formatMoney = (value, currency = 'ARS') => {
    const num = Number(value) || 0;
    const formatted = num.toLocaleString('es-AR', { maximumFractionDigits: 2 });
    return currency === 'USD' ? `US$ ${formatted}` : `$ ${formatted}`;
};

export const formatDate = (iso) => {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
};

export const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Días entre hoy y la fecha (negativo = ya pasó)
export const daysUntil = (iso) => {
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    const [ty, tm, td] = todayISO().split('-').map(Number);
    return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(ty, tm - 1, td)) / 86400000);
};

export const describeDays = (days) => {
    if (days === null) return '';
    if (days === 0) return 'vence hoy';
    if (days === 1) return 'vence mañana';
    if (days > 0) return `vence en ${days} días`;
    if (days === -1) return 'venció ayer';
    return `venció hace ${-days} días`;
};

export const addMonths = (isoDate, months) => {
    const [y, m, d] = isoDate.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1 + months, 1));
    // Si el día no existe en ese mes (ej. 31), usar el último día del mes
    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(d, lastDay));
    return date.toISOString().split('T')[0];
};

export const addDays = (isoDate, days) => {
    const [y, m, d] = isoDate.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d + days)).toISOString().split('T')[0];
};

/**
 * Genera las filas de un plan de cuotas.
 * Si hay anticipo, va como cuota 1 con vencimiento en `saleDate` y el resto se reparte.
 */
export const generatePlan = ({ total, count, firstDueDate, frequency = 'monthly', downPayment = 0, saleDate }) => {
    const rows = [];
    const down = Math.min(Number(downPayment) || 0, total);
    if (down > 0) rows.push({ due_date: saleDate || todayISO(), amount: down, notes: 'Anticipo' });

    const n = Math.max(1, parseInt(count, 10) || 1);
    const rest = total - down;
    if (rest <= 0) return rows;

    const each = Math.floor((rest / n) * 100) / 100;
    for (let i = 0; i < n; i++) {
        const due = frequency === 'monthly' ? addMonths(firstDueDate, i)
            : addDays(firstDueDate, i * (frequency === 'biweekly' ? 15 : 7));
        // La última cuota absorbe la diferencia por redondeo
        const amount = i === n - 1 ? Math.round((rest - each * (n - 1)) * 100) / 100 : each;
        rows.push({ due_date: due, amount, notes: '' });
    }
    return rows;
};

// Moneda de la venta. Las ventas viejas (sin sale_currency) se infieren por el precio cargado.
export const getSaleCurrency = (item) => {
    if (item.sale_currency) return item.sale_currency;
    return Number(item.sale_price_ars) > 0 ? 'ARS' : 'USD';
};

export const getCostInfo = (item) => {
    const currency = item.cost_currency || (Number(item.cost_usd) > 0 || !Number(item.cost_ars) ? 'USD' : 'ARS');
    const amount = Number(currency === 'USD' ? item.cost_usd : item.cost_ars) || 0;
    return { currency, amount };
};

export const getSaleSummary = (item) => {
    const currency = getSaleCurrency(item);
    const total = Number(currency === 'USD' ? item.sale_price_usd : item.sale_price_ars) || 0;
    const paidRaw = item.amount_paid ?? (currency === 'ARS' ? item.amount_paid_ars : 0);
    const paid = Number(paidRaw) || 0;
    const balance = Math.max(0, total - paid);
    const isPaid = item.payment_status === 'paid' || (total > 0 && balance <= 0.01);
    const progress = total > 0 ? Math.min(100, (paid / total) * 100) : (isPaid ? 100 : 0);

    return { currency, total, paid, balance, isPaid, progress };
};

/**
 * Plan de cuotas de una venta con el estado de cada una.
 * Usa item.installments (tabla sale_installments). Las ventas sin plan
 * cargado devuelven [].
 * Estados: 'paid' | 'overdue' | 'soon' | 'partial' | 'pending'
 */
export const buildInstallmentSchedule = (item) => {
    const rows = [...(item.installments || [])].sort((a, b) => a.installment_number - b.installment_number);
    if (rows.length === 0) return [];

    const { paid, isPaid } = getSaleSummary(item);
    let remainingPaid = isPaid ? Infinity : paid;

    return rows.map(row => {
        const amount = Number(row.amount) || 0;
        const covered = Math.min(amount, Math.max(0, remainingPaid));
        remainingPaid -= covered;
        const days = daysUntil(row.due_date);

        let state;
        if (covered >= amount - 0.01) state = 'paid';
        else if (days < 0) state = 'overdue';
        else if (days <= DUE_SOON_DAYS) state = 'soon';
        else if (covered > 0) state = 'partial';
        else state = 'pending';

        return {
            id: row.id,
            number: row.installment_number,
            dueDate: row.due_date,
            notes: row.notes,
            amount,
            covered,
            remaining: Math.max(0, amount - covered),
            days,
            state
        };
    });
};

/**
 * Estado de cobranza de una venta para alertas:
 *   level: 'paid' | 'overdue' | 'soon' | 'ontrack' | 'noplan'
 */
export const getCollectionStatus = (item) => {
    const summary = getSaleSummary(item);
    const schedule = buildInstallmentSchedule(item);
    const overdue = schedule.filter(i => i.state === 'overdue');
    const next = schedule.find(i => i.state !== 'paid') || null;
    const paidCount = schedule.filter(i => i.state === 'paid').length;

    let level;
    if (summary.isPaid) level = 'paid';
    else if (overdue.length > 0) level = 'overdue';
    else if (next?.state === 'soon') level = 'soon';
    else if (schedule.length > 0) level = 'ontrack';
    else level = 'noplan';

    return {
        ...summary,
        schedule,
        level,
        next,
        paidCount,
        overdueCount: overdue.length,
        overdueAmount: overdue.reduce((sum, i) => sum + i.remaining, 0)
    };
};

// Agrupa filas de sale_installments por venta
export const groupInstallments = (rows) => (rows || []).reduce((acc, row) => {
    (acc[row.item_id] = acc[row.item_id] || []).push(row);
    return acc;
}, {});
