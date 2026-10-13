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
import { formatMoney, getCollectionStatus, groupInstallments } from '../../utils/salePayments';
import { CollectionBadge, CollectionSummary } from '../../components/admin/CollectionUI';
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
            const [invRes, instRes] = await Promise.all([
                supabase.rpc('get_inventory').eq('status', 'sold'),
                supabase.from('sale_installments').select('*')
            ]);
            if (invRes.error) throw invRes.error;
            const byItem = groupInstallments(instRes.data);

            // Ventas con saldo pendiente: primero las vencidas, después por fecha de la próxima cuota
            const rank = { overdue: 0, soon: 1, ontrack: 2, noplan: 3 };
            const withBalance = invRes.data
                .map(item => {
                    const full = { ...item, installments: byItem[item.id] || [] };
                    return { ...full, summary: getCollectionStatus(full) };
                })
                .filter(item => !item.summary.isPaid && item.summary.balance > 0)
                .sort((a, b) => (rank[a.summary.level] - rank[b.summary.level]) ||
                    (a.summary.next?.dueDate || '9999').localeCompare(b.summary.next?.dueDate || '9999'));

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
                        <table className="clean-table sales-table">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Producto</th>
                                    <th>Estado</th>
                                    <th>Cobranza</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingPayments.map((item) => (
                                    <tr key={item.id} className={`row-${item.summary.level}`}>
                                        <td>
                                            <div style={{ fontWeight: '600' }}>{item.client_name}</div>
                                            <div className="variant-sub">{item.client_dni}</div>
                                        </td>
                                        <td>
                                            <div>{item.product_name}</div>
                                            <div className="variant-sub">{item.serial_number}</div>
                                        </td>
                                        <td><CollectionBadge status={item.summary} /></td>
                                        <td className="cell-sm"><CollectionSummary status={item.summary} /></td>
                                        <td>
                                            <button className={`pay-open ${item.summary.level === 'overdue' ? 'urgent' : ''}`} title="Cuotas y pagos" onClick={() => setPaymentsItem(item)}>
                                                <DollarSign size={15} /> Cobrar
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
