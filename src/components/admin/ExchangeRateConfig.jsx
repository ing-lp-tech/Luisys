import { useState, useEffect } from 'react';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import { DollarSign, RefreshCw, Edit3, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import './ExchangeRateConfig.css';

/**
 * Componente para configurar y gestionar el tipo de cambio ARS/USD
 * Permite elegir entre dólar blue, oficial, o configuración manual
 * El panel es colapsable para no ocupar espacio innecesario
 */
export default function ExchangeRateConfig() {
    const { rateConfig, loading, updateFromAPI, setManualRate, reload } = useExchangeRate();
    const [manualValue, setManualValue] = useState('');
    const [isEditingManual, setIsEditingManual] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (rateConfig?.rate_type === 'manual') {
            setManualValue(rateConfig.rate_value?.toString() || '');
        }
    }, [rateConfig]);

    const handleUpdateFromAPI = async (type) => {
        try {
            setUpdating(true);
            await updateFromAPI(type);
        } catch (error) {
            alert(`Error al actualizar desde API: ${error.message}`);
        } finally {
            setUpdating(false);
        }
    };

    const handleSaveManual = async () => {
        const value = parseFloat(manualValue);
        if (isNaN(value) || value <= 0) {
            alert('Ingrese un valor válido mayor a 0');
            return;
        }

        try {
            setUpdating(true);
            await setManualRate(value);
            setIsEditingManual(false);
            setExpanded(false);
        } catch (error) {
            alert(`Error al guardar tipo de cambio manual: ${error.message}`);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return <div className="exchange-rate-loading">Cargando tipo de cambio...</div>;
    }

    const sourceLabel = rateConfig?.rate_type === 'manual' ? 'Manual' :
        rateConfig?.rate_type === 'blue' ? 'Dólar Blue' : 'Dólar Oficial';

    return (
        <div className="exchange-rate-config">
            {/* Barra compacta siempre visible */}
            <div className="exchange-compact-bar" onClick={() => setExpanded(!expanded)}>
                <div className="compact-left">
                    <DollarSign size={16} />
                    <span className="compact-label">USD/ARS:</span>
                    <span className="compact-value">
                        ${rateConfig?.rate_value?.toFixed(2) || '0.00'}
                    </span>
                    <span className="compact-source">{sourceLabel}</span>
                </div>
                <button className="btn-expand" title={expanded ? 'Colapsar' : 'Configurar tipo de cambio'}>
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    <span>{expanded ? 'Colapsar' : 'Configurar'}</span>
                </button>
            </div>

            {/* Panel expandible */}
            {expanded && (
                <div className="exchange-panel">
                    <div className="exchange-current">
                        <div className="current-label">Tipo de cambio actual:</div>
                        <div className="current-value">
                            ${rateConfig?.rate_value?.toFixed(2) || '0.00'}
                        </div>
                        <div className="current-source">
                            Fuente: {sourceLabel}
                        </div>
                        {rateConfig?.last_api_update && (
                            <div className="current-updated">
                                Actualizado: {new Date(rateConfig.last_api_update).toLocaleString('es-AR')}
                            </div>
                        )}
                    </div>

                    <div className="exchange-buttons">
                        <button
                            onClick={() => handleUpdateFromAPI('blue')}
                            disabled={updating}
                            className={`exchange-btn ${rateConfig?.rate_type === 'blue' ? 'active' : ''}`}
                        >
                            <RefreshCw size={16} className={updating ? 'spinning' : ''} />
                            Usar Dólar Blue
                        </button>

                        <button
                            onClick={() => handleUpdateFromAPI('oficial')}
                            disabled={updating}
                            className={`exchange-btn ${rateConfig?.rate_type === 'oficial' ? 'active' : ''}`}
                        >
                            <RefreshCw size={16} className={updating ? 'spinning' : ''} />
                            Usar Dólar Oficial
                        </button>

                        <button
                            onClick={() => setIsEditingManual(true)}
                            disabled={updating}
                            className={`exchange-btn ${rateConfig?.rate_type === 'manual' ? 'active' : ''}`}
                        >
                            <Edit3 size={16} />
                            Configurar Manual
                        </button>
                    </div>

                    {isEditingManual && (
                        <div className="exchange-manual">
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Ej: 1450.00"
                                value={manualValue}
                                onChange={(e) => setManualValue(e.target.value)}
                                className="manual-input"
                                autoFocus
                            />
                            <button onClick={handleSaveManual} className="btn-save" disabled={updating}>
                                <Check size={16} />
                                Guardar
                            </button>
                            <button onClick={() => setIsEditingManual(false)} className="btn-cancel">
                                <X size={16} />
                                Cancelar
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
