import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, Edit, Trash2, DollarSign, X, FileText, Calendar, User } from 'lucide-react';
import '../../pages/admin/SalesManager.css';

export default function SalesHistoryTab() {
    const [sales, setSales] = useState([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedSale, setSelectedSale] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('inventory_items')
            .select('*, productos(nombre)')
            .eq('status', 'sold')
            .order('sale_date', { ascending: false });

        if (error) {
            console.error('Error fetching sales:', error);
        } else {
            setSales(data || []);
        }
        setLoading(false);
    };

    const formatNumber = (value) => {
        if (!value) return '0';
        const num = parseFloat(value);
        return num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleRowClick = (sale) => {
        setSelectedSale(sale);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar esta venta?')) return;

        const { error } = await supabase
            .from('inventory_items')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Error al eliminar: ' + error.message);
        } else {
            alert('✅ Venta eliminada');
            fetchSales();
            setShowModal(false);
        }
    };

    const filteredSales = sales.filter(item => {
        const searchText = filter.toLowerCase();
        return (
            item.productos?.nombre?.toLowerCase().includes(searchText) ||
            item.serial_number?.toLowerCase().includes(searchText) ||
            item.client_name?.toLowerCase().includes(searchText) ||
            item.client_dni?.toLowerCase().includes(searchText)
        );
    });

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando ventas...</div>;
    }

    return (
        <div className="sales-history-tab" style={{ padding: '20px' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DollarSign size={24} />
                        Historial de Ventas
                    </h2>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                        {filteredSales.length} venta{filteredSales.length !== 1 ? 's' : ''} registrada{filteredSales.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Search */}
                <div style={{ position: 'relative', minWidth: '280px', width: '100%', maxWidth: '400px' }}>
                    <Search size={18} style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94a3b8'
                    }} />
                    <input
                        type="text"
                        placeholder="Buscar por producto, serie, cliente..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px 10px 40px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '14px'
                        }}
                    />
                </div>
            </div>

            {/* Empty State */}
            {filteredSales.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#94a3b8'
                }}>
                    <DollarSign size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                    <p>No hay ventas registradas</p>
                </div>
            ) : (
                <>
                    {/* Mobile Cards */}
                    <div className="mobile-only" style={{ display: 'grid', gap: '12px' }}>
                        {filteredSales.map(item => {
                            const salePrice = parseFloat(item.sale_price_ars || 0);
                            const amountPaid = parseFloat(item.amount_paid_ars || 0);
                            const balance = salePrice - amountPaid;
                            const isPaid = item.payment_status === 'paid' || balance <= 0;

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleRowClick(item)}
                                    style={{
                                        background: 'white',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        border: '1px solid #e2e8f0'
                                    }}
                                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
                                                {item.productos?.nombre}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>
                                                {item.serial_number}
                                            </div>
                                        </div>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '12px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            backgroundColor: isPaid ? '#dcfce7' : '#fef9c3',
                                            color: isPaid ? '#16a34a' : '#ca8a04',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {isPaid ? '✓ PAGADO' : '⏱ PENDIENTE'}
                                        </span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                                        <div>
                                            <div style={{ color: '#64748b', marginBottom: '2px' }}>Cliente</div>
                                            <div style={{ fontWeight: '500' }}>{item.client_name}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#64748b', marginBottom: '2px' }}>Fecha</div>
                                            <div style={{ fontWeight: '500' }}>{item.sale_date}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#64748b', marginBottom: '2px' }}>Precio</div>
                                            <div style={{ fontWeight: '600', color: '#0369a1' }}>
                                                ${formatNumber(item.sale_price_usd || 0)} USD
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#64748b', marginBottom: '2px' }}>Cobrado</div>
                                            <div style={{ fontWeight: '600', color: isPaid ? '#16a34a' : '#ca8a04' }}>
                                                ${formatNumber(amountPaid)}
                                            </div>
                                        </div>
                                    </div>

                                    {!isPaid && balance > 0 && (
                                        <div style={{
                                            marginTop: '12px',
                                            padding: '8px',
                                            background: '#fef2f2',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            color: '#dc2626',
                                            fontWeight: '600'
                                        }}>
                                            Saldo pendiente: ${formatNumber(balance)} ARS
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop Table */}
                    <div className="desktop-only" style={{
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        overflow: 'hidden'
                    }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="clean-table" style={{ width: '100%', minWidth: '800px' }}>
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Serie</th>
                                        <th>Cliente</th>
                                        <th>Fecha</th>
                                        <th>Precio</th>
                                        <th>Pago</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSales.map(item => {
                                        const salePrice = parseFloat(item.sale_price_ars || 0);
                                        const amountPaid = parseFloat(item.amount_paid_ars || 0);
                                        const balance = salePrice - amountPaid;
                                        const isPaid = item.payment_status === 'paid' || balance <= 0;

                                        return (
                                            <tr
                                                key={item.id}
                                                onClick={() => handleRowClick(item)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <td>
                                                    <div style={{ fontWeight: '600' }}>{item.productos?.nombre}</div>
                                                    {item.model_variant && (
                                                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                                                            {item.model_variant}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                                                    {item.serial_number}
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: '500' }}>{item.client_name}</div>
                                                    {item.client_dni && (
                                                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                                                            DNI: {item.client_dni}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ fontSize: '13px' }}>
                                                    {item.sale_date}
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: '600', color: '#0369a1' }}>
                                                        ${formatNumber(item.sale_price_usd || 0)} USD
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                                                        ${formatNumber(item.sale_price_ars || 0)} ARS
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '13px' }}>
                                                        ${formatNumber(amountPaid)} ARS
                                                    </div>
                                                    {balance > 0 && !isPaid && (
                                                        <div style={{
                                                            fontSize: '12px',
                                                            color: '#dc2626',
                                                            fontWeight: '600'
                                                        }}>
                                                            Saldo: ${formatNumber(balance)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        backgroundColor: isPaid ? '#dcfce7' : '#fef9c3',
                                                        color: isPaid ? '#16a34a' : '#ca8a04'
                                                    }}>
                                                        {isPaid ? '✓ PAGADO' : '⏱ PENDIENTE'}
                                                    </span>
                                                    {item.observations && (
                                                        <div style={{
                                                            fontSize: '11px',
                                                            color: '#64748b',
                                                            fontStyle: 'italic',
                                                            marginTop: '4px',
                                                            maxWidth: '200px',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}
                                                            title={item.observations}>
                                                            💬 {item.observations}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Summary Stats */}
            {filteredSales.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginTop: '24px'
                }}>
                    <div style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                            Total Ventas USD
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#0369a1' }}>
                            ${formatNumber(filteredSales.reduce((sum, s) => sum + parseFloat(s.sale_price_usd || 0), 0))}
                        </div>
                    </div>
                    <div style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                            Total Ventas ARS
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#16a34a' }}>
                            ${formatNumber(filteredSales.reduce((sum, s) => sum + parseFloat(s.sale_price_ars || 0), 0))}
                        </div>
                    </div>
                    <div style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                            Cobrado
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#16a34a' }}>
                            ${formatNumber(filteredSales.reduce((sum, s) => sum + parseFloat(s.amount_paid_ars || 0), 0))}
                        </div>
                    </div>
                    <div style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                            Por Cobrar
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>
                            ${formatNumber(filteredSales.reduce((sum, s) => {
                                const salePrice = parseFloat(s.sale_price_ars || 0);
                                const paid = parseFloat(s.amount_paid_ars || 0);
                                return sum + (salePrice - paid);
                            }, 0))}
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showModal && selectedSale && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    zIndex: 1000
                }}
                    onClick={() => setShowModal(false)}>
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        maxWidth: '600px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        position: 'relative'
                    }}
                        onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '20px',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            position: 'sticky',
                            top: 0,
                            background: 'white',
                            zIndex: 1
                        }}>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                                Detalle de Venta
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: '#64748b'
                                }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div style={{ padding: '24px' }}>
                            {/* Product Info */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>
                                    Producto
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                                    {selectedSale.productos?.nombre}
                                </div>
                                {selectedSale.model_variant && (
                                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                                        {selectedSale.model_variant}
                                    </div>
                                )}
                                <div style={{ fontSize: '14px', color: '#64748b', fontFamily: 'monospace', marginTop: '8px' }}>
                                    Serie: {selectedSale.serial_number}
                                </div>
                            </div>

                            {/* Client Info */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <User size={14} />
                                    Cliente
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>
                                    {selectedSale.client_name}
                                </div>
                                {selectedSale.client_dni && (
                                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                                        DNI: {selectedSale.client_dni}
                                    </div>
                                )}
                            </div>

                            {/* Sale Info */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Calendar size={14} />
                                    Información de Venta
                                </div>
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>Fecha de venta</div>
                                        <div style={{ fontSize: '14px', fontWeight: '500' }}>{selectedSale.sale_date}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>Precio USD</div>
                                        <div style={{ fontSize: '18px', fontWeight: '600', color: '#0369a1' }}>
                                            ${formatNumber(selectedSale.sale_price_usd || 0)}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>Precio ARS</div>
                                        <div style={{ fontSize: '18px', fontWeight: '600', color: '#16a34a' }}>
                                            ${formatNumber(selectedSale.sale_price_ars || 0)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Info */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <DollarSign size={14} />
                                    Estado de Pago
                                </div>
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>Monto pagado</div>
                                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#16a34a' }}>
                                            ${formatNumber(selectedSale.amount_paid_ars || 0)} ARS
                                        </div>
                                    </div>
                                    {(() => {
                                        const salePrice = parseFloat(selectedSale.sale_price_ars || 0);
                                        const amountPaid = parseFloat(selectedSale.amount_paid_ars || 0);
                                        const balance = salePrice - amountPaid;
                                        const isPaid = selectedSale.payment_status === 'paid' || balance <= 0;

                                        return balance > 0 && !isPaid ? (
                                            <div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>Saldo pendiente</div>
                                                <div style={{ fontSize: '16px', fontWeight: '600', color: '#dc2626' }}>
                                                    ${formatNumber(balance)} ARS
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{
                                                padding: '12px',
                                                background: '#dcfce7',
                                                borderRadius: '8px',
                                                color: '#16a34a',
                                                fontWeight: '600',
                                                textAlign: 'center'
                                            }}>
                                                ✓ Pago completo
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Observations */}
                            {selectedSale.observations && (
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <FileText size={14} />
                                        Observaciones
                                    </div>
                                    <div style={{
                                        padding: '12px',
                                        background: '#f8fafc',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        color: '#475569',
                                        fontStyle: 'italic'
                                    }}>
                                        {selectedSale.observations}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Actions */}
                        <div style={{
                            padding: '20px',
                            borderTop: '1px solid #e2e8f0',
                            display: 'flex',
                            gap: '12px',
                            position: 'sticky',
                            bottom: 0,
                            background: 'white'
                        }}>
                            <button
                                onClick={() => handleDelete(selectedSale.id)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Trash2 size={16} />
                                Eliminar
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: '#e2e8f0',
                                    color: '#475569',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
