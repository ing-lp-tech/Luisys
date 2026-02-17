import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Package, ShoppingCart, Upload, Search, FileText, LayoutDashboard, PlusCircle, CheckCircle, Smartphone, Edit, Trash2, X, Save } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import ExchangeRateConfig from '../../components/admin/ExchangeRateConfig';
import FinanceTabs from '../../components/admin/FinanceTabs';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import SalesManager from '../admin/SalesManager';
import SuppliesPartsTab from '../../components/admin/SuppliesPartsTab';
import SalesHistoryTab from '../../components/admin/SalesHistoryTab';
import InventoryTab from '../../components/admin/InventoryTab';
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

    useEffect(() => {
        fetchPendingPayments();
    }, []);

    const fetchPendingPayments = async () => {
        try {
            setLoading(true);
            // Obtener items vendidos con pago pendiente
            const { data, error } = await supabase
                .rpc('get_inventory')
                .eq('status', 'sold')
                .or('payment_status.eq.pending,payment_status.is.null');

            if (error) throw error;

            // Calcular saldo pendiente para cada uno
            const withBalance = data.map(item => ({
                ...item,
                balance: (item.sale_price_ars || 0) - (item.amount_paid_ars || 0)
            })).filter(item => item.balance > 0);

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

    return (
        <div style={{ padding: '24px' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '1.5rem', fontWeight: '600' }}>
                💵 Cuentas por Cobrar
            </h2>

            {pendingPayments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <p>✅ No hay deudas pendientes</p>
                </div>
            ) : (
                <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Cliente</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Producto</th>
                                <th style={{ padding: '12px', textAlign: 'right' }}>Total ARS</th>
                                <th style={{ padding: '12px', textAlign: 'right' }}>Pagado</th>
                                <th style={{ padding: '12px', textAlign: 'right' }}>Saldo</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Observaciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingPayments.map((item) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ fontWeight: '600' }}>{item.client_name}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{item.client_dni}</div>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <div>{item.product_name}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{item.serial_number}</div>
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                                        ${item.sale_price_ars?.toLocaleString()}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right', color: '#22c55e' }}>
                                        ${item.amount_paid_ars?.toLocaleString() || 0}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right', color: '#ef4444', fontWeight: '600' }}>
                                        ${item.balance.toLocaleString()}
                                    </td>
                                    <td style={{ padding: '12px', fontSize: '0.9rem', color: '#64748b' }}>
                                        {item.observations || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
