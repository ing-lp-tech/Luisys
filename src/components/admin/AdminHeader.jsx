import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Store, ArrowLeft } from 'lucide-react';
import DarkModeToggle from '../DarkModeToggle';
import './AdminHeader.css';

export default function AdminHeader({ title, showBackToStore = true }) {
    const { user, role, roleError, signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <header className="admin-header">
            <div>
                <h1>{title}</h1>
                <p>
                    Bienvenido, {user?.email}
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded ml-2">Rol: {role || 'Ninguno'}</span>
                    {roleError && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded ml-2">Error: {roleError}</span>}
                </p>
            </div>
            <div className="admin-header-buttons">
                <DarkModeToggle />
                <button onClick={() => navigate('/admin/dashboard')} className="back-to-store-button" style={{ marginRight: '8px' }}>
                    <ArrowLeft size={18} />
                    Volver al Admin
                </button>
                {showBackToStore && (
                    <button onClick={() => navigate('/')} className="back-to-store-button">
                        <Store size={18} />
                        Ir a Tienda
                    </button>
                )}
                <button onClick={handleLogout} className="logout-button">
                    <LogOut size={18} />
                    Cerrar Sesión
                </button>
            </div>
        </header>
    );
}
