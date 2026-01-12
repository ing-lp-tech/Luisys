import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, LogIn } from 'lucide-react';
import './Login.css';

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
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <Lock size={48} />
                    <h1>Panel de Administración</h1>
                    <p>Ingenieros Emprendedores</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && <div className="login-error">{error}</div>}

                    <div className="form-group">
                        <label>
                            <Mail size={18} />
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@ejemplo.com"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            <Lock size={18} />
                            Contraseña
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '20px',
                            backgroundColor: '#667eea',
                            color: '#ffffff',
                            padding: '15px 30px',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            width: '100%',
                            cursor: 'pointer',
                            display: 'block'
                        }}
                    >
                        {loading ? 'Cargando...' : 'INGRESAR AL PANEL'}
                    </button>
                </form>

                <div className="login-footer">
                    <a href="/">← Volver al sitio</a>
                </div>
            </div>
        </div>
    );
}
