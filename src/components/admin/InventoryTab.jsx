import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, DollarSign, Trash2, X, FileText, Calendar, User, Edit, Package } from 'lucide-react';
import '../../pages/admin/SalesManager.css';

export default function InventoryTab() {
    const [items, setItems] = useState([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all'); // all, available, sold

    useEffect(() => {
        fetchItems();
    }, [statusFilter]);

    const fetchItems = async () => {
        setLoading(true);
        let query = supabase
            .from('inventory_items')
            .select('*, productos(nombre)')
            .order('created_at', { ascending: false });

        if (statusFilter === 'sold') {
            query = query.eq('status', 'sold');
        } else if (statusFilter === 'available') {
            query = query.eq('status', 'available');
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching items:', error);
        } else {
            setItems(data || []);
        }
        setLoading(false);
    };

    const handleRowClick = (item) => {
        setSelectedItem(item);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este registro?')) return;

        const { error } = await supabase
            .from('inventory_items')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Error al eliminar: ' + error.message);
        } else {
            alert('✅ Registro eliminado');
            fetchItems();
            setShowModal(false);
        }
    };

    const formatNumber = (value) => {
        if (!value) return '0';
        const num = parseFloat(value);
        return num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const filteredItems = items.filter(item => {
        const searchText = filter.toLowerCase();
        return (
            item.productos?.nombre?.toLowerCase().includes(searchText) ||
            item.serial_number?.toLowerCase().includes(searchText) ||
            item.model_variant?.toLowerCase().includes(searchText) ||
            item.client_name?.toLowerCase().includes(searchText) ||
            item.client_dni?.toLowerCase().includes(searchText)
        );
    });

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando inventario...</div>;
    }

    return (
        <div className="inventory-tab" style={{ padding: '20px' }}>
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
                        <Package size={24} />
                        Registro de Entradas
                    </h2>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                        {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} registrado{filteredItems.length !== 1 ? 's' : ''}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        style={{
                            padding: '10px 12px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '14px',
                            background: 'white'
                        }}
                    >
                        <option value="all">Todos</option>
                        <option value="available">Disponibles</option>
                        <option value="sold">Vendidos</option>
                    </select>

                    {/* Search */}
                    <div style={{ position: 'relative', minWidth: '280px' }}>
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
            </div>

            {/* Empty State */}
            {filteredItems.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#94a3b8'
                }}>
                    <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                    <p>No hay items registrados</p>
                </div>
            ) : (
                <>
                    {/* Mobile Cards */}
                    <div className="mobile-only" style={{ display: 'grid', gap: '12px' }}>
                        {filteredItems.map(item => {
                            const isSold = item.status === 'sold';
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
                                            backgroundColor: isSold ? '#fef9c3' : '#dcfce7',
                                            color: isSold ? '#ca8a04' : '#16a34a',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {isSold ? 'VENDIDO' : 'DISPONIBLE'}
                                        </span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                                        {item.model_variant && (
                                            <div>
                                                <div style={{ color: '#64748b', marginBottom: '2px' }}>Variante</div>
                                                <div style={{ fontWeight: '500' }}>{item.model_variant}</div>
                                            </div>
                                        )}
                                        {isSold && item.client_name && (
                                            <div>
                                                <div style={{ color: '#64748b', marginBottom: '2px' }}>Cliente</div>
                                                <div style={{ fontWeight: '500' }}>{item.client_name}</div>
                                            </div>
                                        )}
                                        {isSold && item.sale_date && (
                                            <div>
                                                <div style={{ color: '#64748b', marginBottom: '2px' }}>Fecha Venta</div>
                                                <div style={{ fontWeight: '500' }}>{item.sale_date}</div>
                                            </div>
                                        )}
                                        {isSold && item.sale_price_usd && (
                                            <div>
                                                <div style={{ color: '#64748b', marginBottom: '2px' }}>Precio</div>
                                                <div style={{ fontWeight: '600', color: '#0369a1' }}>
                                                    ${formatNumber(item.sale_price_usd)} USD
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {isSold && !isPaid && balance > 0 && (
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
                                        <th>Estado</th>
                                        <th>Cliente</th>
                                        <th>Fecha</th>
                                        <th>Precio</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.map(item => {
                                        const isSold = item.status === 'sold';
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
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        backgroundColor: isSold ? '#fef9c3' : '#dcfce7',
                                                        color: isSold ? '#ca8a04' : '#16a34a'
                                                    }}>
                                                        {isSold ? 'VENDIDO' : 'DISPONIBLE'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {isSold && item.client_name ? (
                                                        <>
                                                            <div style={{ fontWeight: '500' }}>{item.client_name}</div>
                                                            {item.client_dni && (
                                                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                                                    DNI: {item.client_dni}
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>-</span>
                                                    )}
                                                </td>
                                                <td style={{ fontSize: '13px' }}>
                                                    {isSold && item.sale_date ? item.sale_date : '-'}
                                                </td>
                                                <td>
                                                    {isSold && item.sale_price_usd ? (
                                                        <>
                                                            <div style={{ fontWeight: '600', color: '#0369a1' }}>
                                                                ${formatNumber(item.sale_price_usd)} USD
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                                                                ${formatNumber(item.sale_price_ars || 0)} ARS
                                                            </div>
                                                            {!isPaid && balance > 0 && (
                                                                <div style={{
                                                                    fontSize: '12px',
                                                                    color: '#dc2626',
                                                                    fontWeight: '600'
                                                                }}>
                                                                    Saldo: ${formatNumber(balance)}
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>-</span>
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

            {/* Detail Modal */}
            {showModal && selectedItem && (
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
                                Detalle del Item
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
                                    {selectedItem.productos?.nombre}
                                </div>
                                {selectedItem.model_variant && (
                                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                                        {selectedItem.model_variant}
                                    </div>
                                )}
                                <div style={{ fontSize: '14px', color: '#64748b', fontFamily: 'monospace', marginTop: '8px' }}>
                                    Serie: {selectedItem.serial_number}
                                </div>
                                <div style={{
                                    marginTop: '12px',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    display: 'inline-block',
                                    backgroundColor: selectedItem.status === 'sold' ? '#fef9c3' : '#dcfce7',
                                    color: selectedItem.status === 'sold' ? '#ca8a04' : '#16a34a',
                                    fontWeight: '600',
                                    fontSize: '14px'
                                }}>
                                    {selectedItem.status === 'sold' ? 'VENDIDO' : 'DISPONIBLE'}
                                </div>
                            </div>

                            {/* Client Info (if sold) */}
                            {selectedItem.status === 'sold' && selectedItem.client_name && (
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <User size={14} />
                                        Cliente
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>
                                        {selectedItem.client_name}
                                    </div>
                                    {selectedItem.client_dni && (
                                        <div style={{ fontSize: '14px', color: '#64748b' }}>
                                            DNI: {selectedItem.client_dni}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Sale Info (if sold) */}
                            {selectedItem.status === 'sold' && (
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Calendar size={14} />
                                        Información de Venta
                                    </div>
                                    <div style={{ display: 'grid', gap: '12px' }}>
                                        {selectedItem.sale_date && (
                                            <div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>Fecha de venta</div>
                                                <div style={{ fontSize: '14px', fontWeight: '500' }}>{selectedItem.sale_date}</div>
                                            </div>
                                        )}
                                        {selectedItem.sale_price_usd && (
                                            <div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>Precio USD</div>
                                                <div style={{ fontSize: '18px', fontWeight: '600', color: '#0369a1' }}>
                                                    ${formatNumber(selectedItem.sale_price_usd)}
                                                </div>
                                            </div>
                                        )}
                                        {selectedItem.sale_price_ars && (
                                            <div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>Precio ARS</div>
                                                <div style={{ fontSize: '18px', fontWeight: '600', color: '#16a34a' }}>
                                                    ${formatNumber(selectedItem.sale_price_ars)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Payment Info (if sold) */}
                            {selectedItem.status === 'sold' && (
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <DollarSign size={14} />
                                        Estado de Pago
                                    </div>
                                    <div style={{ display: 'grid', gap: '12px' }}>
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#64748b' }}>Monto pagado</div>
                                            <div style={{ fontSize: '16px', fontWeight: '600', color: '#16a34a' }}>
                                                ${formatNumber(selectedItem.amount_paid_ars || 0)} ARS
                                            </div>
                                        </div>
                                        {(() => {
                                            const salePrice = parseFloat(selectedItem.sale_price_ars || 0);
                                            const amountPaid = parseFloat(selectedItem.amount_paid_ars || 0);
                                            const balance = salePrice - amountPaid;
                                            const isPaid = selectedItem.payment_status === 'paid' || balance <= 0;

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
                            )}

                            {/* Observations */}
                            {selectedItem.observations && (
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
                                        {selectedItem.observations}
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
                                onClick={() => handleDelete(selectedItem.id)}
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
