import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(null);

    const fetchUserRole = async (sessionUser) => {
        if (!sessionUser) {
            setRole(null);
            return;
        }

        try {
            // Consultamos la tabla de perfiles
            const { data, error } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', sessionUser.id)
                .single();

            if (data?.role) {
                setRole(data.role);
            } else {
                // Si no existe perfil, por defecto es un usuario normal
                setRole('user');
            }
        } catch (error) {
            console.error('Error fetching role:', error);
            setRole('user');
        }
    };

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserRole(session.user);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                setUser(null);
                setRole(null);
            } else if (session?.user) {
                setUser(session.user);
                fetchUserRole(session.user);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        setUser(null);
        setRole(null);
        return { error };
    };

    const value = {
        user,
        role,
        signIn,
        signOut,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
