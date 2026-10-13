// Helpers compartidos para ventas en una moneda + cobro en cuotas.
// La base de datos (sql/07_sales_installments.sql) calcula amount_paid y
// payment_status; acá solo derivamos lo que necesita la UI.

export const CURRENCIES = ['ARS', 'USD'];

export const PAYMENT_METHODS = ['Efectivo', 'Transferencia', 'Mercado Pago', 'Cheque', 'Tarjeta', 'Otro'];

export const formatMoney = (value, currency = 'ARS') => {
    const num = Number(value) || 0;
    const formatted = num.toLocaleString('es-AR', { maximumFractionDigits: 2 });
    return currency === 'USD' ? `US$ ${formatted}` : `$ ${formatted}`;
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

const addMonths = (isoDate, months) => {
    const [y, m, d] = isoDate.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1 + months, 1));
    // Si el día no existe en ese mes (ej. 31), usar el último día del mes
    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(d, lastDay));
    return date.toISOString().split('T')[0];
};

const todayISO = () => new Date().toISOString().split('T')[0];

/**
 * Plan de cuotas: reparte lo cobrado sobre las cuotas en orden y marca
 * cada una como 'paid' | 'partial' | 'overdue' | 'pending'.
 */
export const buildInstallmentSchedule = (item) => {
    const { total, paid, installmentsCount } = getSaleSummary(item);
    if (installmentsCount <= 1 || total <= 0) return [];

    const amount = Number(item.installment_amount) || total / installmentsCount;
    const firstDue = item.first_due_date || item.sale_date;
    const today = todayISO();
    let remainingPaid = paid;

    return Array.from({ length: installmentsCount }, (_, idx) => {
        // La última cuota absorbe la diferencia por redondeo
        const due = idx === installmentsCount - 1 ? Math.max(0, total - amount * (installmentsCount - 1)) : amount;
        const covered = Math.min(due, Math.max(0, remainingPaid));
        remainingPaid -= covered;
        const dueDate = firstDue ? addMonths(firstDue, idx) : null;

        let state = 'pending';
        if (covered >= due - 0.01) state = 'paid';
        else if (dueDate && dueDate < today) state = 'overdue';
        else if (covered > 0) state = 'partial';

        return { number: idx + 1, amount: due, covered, dueDate, state };
    });
};

export const getSaleSummary = (item) => {
    const currency = getSaleCurrency(item);
    const total = Number(currency === 'USD' ? item.sale_price_usd : item.sale_price_ars) || 0;
    const paidRaw = item.amount_paid ?? (currency === 'ARS' ? item.amount_paid_ars : 0);
    const paid = Number(paidRaw) || 0;
    const balance = Math.max(0, total - paid);
    const isPaid = item.payment_status === 'paid' || (total > 0 && balance <= 0.01);
    const installmentsCount = Math.max(1, Number(item.installments_count) || 1);
    const progress = total > 0 ? Math.min(100, (paid / total) * 100) : (isPaid ? 100 : 0);

    return { currency, total, paid, balance, isPaid, installmentsCount, progress };
};

// Próxima cuota impaga (para mostrar "Cuota 2/3 vence 10/11")
export const getNextInstallment = (item) =>
    buildInstallmentSchedule(item).find(i => i.state !== 'paid') || null;
