import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Package, ShoppingCart, Upload, Search, FileText, LayoutDashboard, PlusCircle, CheckCircle, Smartphone, Edit, Trash2, X, Save, DollarSign } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import ExchangeRateConfig from '../../components/admin/ExchangeRateConfig';
import FinanceTabs from '../../components/admin/FinanceTabs';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import SalesManager from '../admin/SalesManager';
import SuppliesPartsTab from '../../components/admin/SuppliesPartsTab';
import SalesHistoryTab from '../../components/admin/SalesHistoryTab';
import InventoryTab from '../../components/admin/InventoryTab';
import SalePaymentsModal from '../../components/admin/SalePaymentsModal';
import { formatMoney, getSaleSummary, getNextInstallment } from '../../utils/salePayments';
import '../admin/SalesManager.css';

/**
 * Componente de Finanzas - Gestión completa de finanzas
 * Incluye tabs para: Inventario, Repuestos, Ventas, Compras, Gastos, Cobros, Pagos
 */
export default function FinanzasModule() {
    return (
        <div className="sales-dashboard">
            <AdminHeader title="Finanzas" />

            {/* Configuración de Tipo de Cambio */}
            <ExchangeRateConfig />

            {/* Sistema de Tabs */}
            <FinanceTabs defaultTab="inventario">
                {({ activeTab }) => (
                    <>
                        {/* TAB: INVENTARIO - Productos con número de serie */}
                        {activeTab === 'inventario' && (
                            <SalesManager showHeaderAndExchange={false} />
                        )}

                        {/* TAB: REPUESTOS E INSUMOS */}
                        {activeTab === 'repuestos' && (
                            <SuppliesPartsTab />
                        )}

                        {/* TAB: VENTAS */}
                        {activeTab === 'ventas' && (
                            <SalesHistoryTab />
                        )}

                        {/* TAB: COMPRAS */}
                        {activeTab === 'compras' && (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>🛒 Compras</h3>
                                <p style={{ color: '#64748b' }}>Próximamente: registro y seguimiento de compras realizadas.</p>
                            </div>
                        )}

                        {/* TAB: GASTOS FIJOS */}
                        {activeTab === 'gastos' && (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>📅 Gastos Fijos</h3>
                                <p style={{ color: '#64748b' }}>Próximamente: gestión de gastos fijos mensuales (alquiler, servicios, etc.).</p>
                            </div>
                        )}

                        {/* TAB: CUENTAS POR COBRAR */}
                        {activeTab === 'cobrar' && (
                            <AccountsReceivableTab />
                        )}

                        {/* TAB: CUENTAS POR PAGAR */}
                        {activeTab === 'pagar' && (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>💳 Cuentas por Pagar</h3>
                                <p style={{ color: '#64748b' }}>Próximamente: seguimiento de deudas propias y pagos realizados.</p>
                            </div>
                        )}
                    </>
                )}
            </FinanceTabs>
        </div>
    );
}

/**
 * Tab de Cuentas por Cobrar
 * Vista especializada de deudas a favor
 */
function AccountsReceivableTab() {
    const [pendingPayments, setPendingPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paymentsItem, setPaymentsItem] = useState(null);

    useEffect(() => {
        fetchPendingPayments();
    }, []);

    const fetchPendingPayments = async () => {
        try {
            setLoading(true);
            // Ventas con saldo pendiente (pending o partial), en la moneda de cada venta
            const { data, error } = await supabase.rpc('get_inventory').eq('status', 'sold');
            if (error) throw error;

            const withBalance = data
                .map(item => ({ ...item, summary: getSaleSummary(item), next: getNextInstallment(item) }))
                .filter(item => !item.summary.isPaid && item.summary.balance > 0)
                .sort((a, b) => (a.next?.dueDate || '9999').localeCompare(b.next?.dueDate || '9999'));

            setPendingPayments(withBalance);
        } catch (error) {
            console.error('Error cargando cuentas por cobrar:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <p>Cargando cuentas por cobrar...</p>
            </div>
        );
    }

    const totalsByCurrency = pendingPayments.reduce((acc, item) => {
        acc[item.summary.currency] = (acc[item.summary.currency] || 0) + item.summary.balance;
        return acc;
    }, {});

    return (
        <div style={{ padding: '24px' }}>
            <h2 style={{ marginBottom: '8px', fontSize: '1.5rem', fontWeight: '600' }}>
                💵 Cuentas por Cobrar
            </h2>
            {pendingPayments.length > 0 && (
                <p style={{ marginBottom: '20px', color: '#64748b' }}>
                    Total a cobrar:{' '}
                    {Object.entries(totalsByCurrency).map(([cur, total]) => (
                        <b key={cur} className="pay-red" style={{ marginRight: 12 }}>{formatMoney(total, cur)}</b>
                    ))}
                </p>
            )}

            {pendingPayments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <p>✅ No hay deudas pendientes</p>
                </div>
            ) : (
                <div className="table-card">
                    <div className="table-scroller">
                        <table className="clean-table">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Producto</th>
                                    <th style={{ textAlign: 'right' }}>Total</th>
                                    <th style={{ textAlign: 'right' }}>Cobrado</th>
                                    <th style={{ textAlign: 'right' }}>Saldo</th>
                                    <th>Próxima cuota</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingPayments.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div style={{ fontWeight: '600' }}>{item.client_name}</div>
                                            <div className="variant-sub">{item.client_dni}</div>
                                        </td>
                                        <td>
                                            <div>{item.product_name}</div>
                                            <div className="variant-sub">{item.serial_number}</div>
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: '600' }}>
                                            {formatMoney(item.summary.total, item.summary.currency)}
                                        </td>
                                        <td style={{ textAlign: 'right' }} className="pay-green">
                                            {formatMoney(item.summary.paid, item.summary.currency)}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: '600' }} className="pay-red">
                                            {formatMoney(item.summary.balance, item.summary.currency)}
                                        </td>
                                        <td style={{ fontSize: '0.85rem' }} className={item.next?.state === 'overdue' ? 'pay-red' : ''}>
                                            {item.next
                                                ? <>Cuota {item.next.number}/{item.summary.installmentsCount}<br />{item.next.dueDate}{item.next.state === 'overdue' ? ' · VENCIDA' : ''}</>
                                                : '—'}
                                        </td>
                                        <td>
                                            <button className="icon-btn pay-btn" title="Registrar pago" onClick={() => setPaymentsItem(item)}>
                                                <DollarSign size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {paymentsItem && (
                <SalePaymentsModal
                    item={paymentsItem}
                    onClose={() => setPaymentsItem(null)}
                    onChanged={fetchPendingPayments}
                />
            )}
        </div>
    );
}
