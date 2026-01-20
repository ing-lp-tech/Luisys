import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Package, FileText, BarChart3, Folder, Users } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
    const { user, role, roleError, signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div>
                    <h1>Panel de Administración</h1>
                    <p>
                        Bienvenido, {user?.email}
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded ml-2">Rol: {role || 'Ninguno'}</span>
                        {roleError && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded ml-2">Error: {roleError}</span>}
                    </p>
                </div>
                <button onClick={handleLogout} className="logout-button">
                    <LogOut size={18} />
                    Cerrar Sesión
                </button>
            </header>

            <div className="dashboard-grid">
                {(role === 'admin' || role === 'owner') && (
                    <>
                        <div className="dashboard-card" onClick={() => navigate('/admin/products')}>
                            <Package size={32} />
                            <h2>Gestionar Productos</h2>
                            <p>Agregar, editar y administrar productos</p>
                        </div>

                        <div className="dashboard-card" onClick={() => navigate('/admin/categories')}>
                            <Folder size={32} />
                            <h2>Gestionar Categorías</h2>
                            <p>Crear y organizar categorías de productos</p>
                        </div>

                        <div className="dashboard-card" onClick={() => navigate('/admin/upload-pdf')}>
                            <FileText size={32} />
                            <h2>Subir Manuales PDF</h2>
                            <p>Cargar manuales de Audaces al sistema</p>
                        </div>

                        <div className="dashboard-card" onClick={() => navigate('/admin/site-config')}>
                            <Folder size={32} />
                            <h2>Gestionar Contenido</h2>
                            <p>Editar imágenes de inicio, logos y "Sobre Mí"</p>
                        </div>
                    </>
                )}

                <div className="dashboard-card" onClick={() => navigate('/admin/leads')}>
                    <Users size={32} />
                    <h2>Clientes Potenciales</h2>
                    <p>Ver contactos capturados (CRM)</p>
                </div>

                {(role === 'admin' || role === 'owner') && (
                    <div className="dashboard-card" onClick={() => navigate('/admin/users')}>
                        <Users size={32} />
                        <h2>Gestionar Usuarios</h2>
                        <p>Asignar roles y permisos (Admin/Vendedor)</p>
                    </div>
                )}

                <div className="dashboard-card">
                    <BarChart3 size={32} />
                    <h2>Estadísticas</h2>
                    <p>Próximamente</p>
                </div>
            </div>
        </div>
    );
}
