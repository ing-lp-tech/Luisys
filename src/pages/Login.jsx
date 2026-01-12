import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { signIn } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error } = await signIn(email, password);

        if (error) {
            setError('Credenciales incorrectas');
            setLoading(false);
        } else {
            navigate('/admin/dashboard');
        }
    };

    return (
        <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-indigo-500 to-purple-600 p-5 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-10 animate-fade-in-up">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-indigo-100 rounded-full">
                            <Lock size={32} className="text-indigo-600" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Panel de Administración</h1>
                    <p className="text-gray-500 text-sm">Ingenieros Emprendedores</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 font-semibold text-gray-700 text-sm">
                            <Mail size={18} className="text-indigo-500" />
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@ejemplo.com"
                            required
                            autoFocus
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 font-semibold text-gray-700 text-sm">
                            <Lock size={18} className="text-indigo-500" />
                            Contraseña
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`mt-4 w-full bg-indigo-600 text-white py-3.5 rounded-lg font-semibold text-base shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center gap-2`}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Cargando...
                            </>
                        ) : 'INGRESAR AL PANEL'}
                    </button>
                </form>

                <div className="text-center mt-8 pt-6 border-t border-gray-100">
                    <Link to="/" className="text-indigo-600 hover:text-purple-700 text-sm font-medium transition-colors">
                        ← Volver al sitio web
                    </Link>
                </div>
            </div>
        </div>
    );
}

