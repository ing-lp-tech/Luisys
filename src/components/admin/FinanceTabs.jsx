import { useState } from 'react';
import { Package, Wrench, DollarSign, ShoppingCart, Calendar, CreditCard, Wallet } from 'lucide-react';
import './FinanceTabs.css';

/**
 * Sistema de tabs para el módulo de Finanzas
 * Organiza todas las secciones financieras en tabs separados
 */
export default function FinanceTabs({ children, defaultTab = 'inventario' }) {
    const [activeTab, setActiveTab] = useState(defaultTab);

    const tabs = [
        { id: 'inventario', label: 'Inventario', icon: Package },
        { id: 'repuestos', label: 'Repuestos', icon: Wrench },
        { id: 'ventas', label: 'Ventas', icon: DollarSign },
        { id: 'compras', label: 'Compras', icon: ShoppingCart },
        { id: 'gastos', label: 'Gastos Fijos', icon: Calendar },
        { id: 'cobrar', label: 'Por Cobrar', icon: CreditCard },
        { id: 'pagar', label: 'Por Pagar', icon: Wallet },
    ];

    return (
        <div className="finance-tabs">
            <div className="tabs-header">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>
            <div className="tab-content">
                {children({ activeTab })}
            </div>
        </div>
    );
}
