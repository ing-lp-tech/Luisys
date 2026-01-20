import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user: currentUser } = useAuth();
    const [showCreateHelp, setShowCreateHelp] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .order('email');

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error:', error);
            alert(`Error al cargar usuarios: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.map(u =>
                u.id === userId ? { ...u, role: newRole } : u
            ));

            alert('✅ Rol actualizado.');
        } catch (error) {
            console.error('Error:', error);
            alert(`Error: ${error.message}`);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
                <button
                    onClick={() => setShowCreateHelp(!showCreateHelp)}
                    className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 flex items-center gap-2"
                >
                    <span>➕ Crear Nuevo Usuario</span>
                </button>
            </div>

            {/* Create User Instructions */}
            {showCreateHelp && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded shadow-sm animate-fade-in-down">
                    <div className="flex justify-between">
                        <h3 className="text-lg font-bold text-blue-900 mb-2">Cómo dar de alta un nuevo usuario</h3>
                        <button onClick={() => setShowCreateHelp(false)} className="text-blue-500 hover:text-blue-700">✕</button>
                    </div>

                    <p className="mb-4 text-blue-800">
                        Por seguridad, la creación de cuentas (Email y Contraseña) se realiza en el panel de control de Supabase.
                        Una vez creado, el usuario aparecerá <strong>automáticamente</strong> en la lista de abajo para que le asignes un rol.
                    </p>

                    <ol className="list-decimal list-inside space-y-3 mb-4 bg-white p-4 rounded border border-blue-100">
                        <li>
                            Ve a <a
                                href="https://supabase.com/dashboard/project/xmyuztkbevcsbcpxlyhf/auth/users"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 font-bold hover:underline"
                            >
                                Supabase Dashboard → Authentication → Users ↗
                            </a>
                        </li>
                        <li>Haz clic en el botón verde <strong>"Add User"</strong> (arriba a la derecha).</li>
                        <li>
                            Ingresa el Email y Contraseña.
                            <br />
                            <span className="text-purple-600 font-semibold">💡 RECOMENDADO:</span> Marca la casilla <strong>"Auto Confirm"</strong> para que el usuario pueda entrar sin esperar el email (los emails de prueba suelen fallar o ir a spam).
                        </li>
                        <li>Haz clic en "Create User".</li>
                        <li>
                            Si olvidaste "Auto Confirm" y el email no llega: Haz click en los 3 puntos (...) del usuario en Supabase y elige <strong>"Confirm User"</strong>.
                        </li>
                        <li>
                            <strong>¡Listo!</strong> Vuelve a esta página y recárgala. El usuario aparecerá en la lista de abajo y podrás asignarle su Rol (Admin, Vendedor, etc).
                        </li>
                    </ol>
                </div>
            )}

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Usuarios Registrados</h2>
                    <button onClick={fetchUsers} className="text-sm text-gray-500 hover:text-gray-700">
                        🔄 Recargar lista
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 text-center">Cargando base de datos...</div>
                ) : users.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No se encontraron perfiles de usuario.
                    </div>
                ) : (
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Registro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {users.map((profile) => (
                                <tr key={profile.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {profile.email}
                                        {profile.email === currentUser?.email && (
                                            <span className="ml-2 text-xs text-purple-600">(Tú)</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={profile.role || 'user'}
                                            onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                                            disabled={profile.email === currentUser?.email}
                                            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                                        >
                                            <option value="user">Usuario (Sin acceso)</option>
                                            <option value="vendedor">Vendedor (CRM)</option>
                                            <option value="admin">Admin</option>
                                            <option value="owner">Owner</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="mt-6 p-4 bg-green-50 rounded border border-green-200">
                <p className="text-green-800 text-sm flex items-center gap-2">
                    <span>✅</span>
                    <strong>Sistema Activo:</strong> Gestión directa sobre tabla <code>user_profiles</code> en Supabase.
                </p>
            </div>
        </div>
    );
}
