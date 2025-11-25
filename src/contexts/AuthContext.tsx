import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface ExtendedUser extends User {
  role?: string;
}

interface AuthContextType {
  user: ExtendedUser | null;
  session: Session | null;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    return data?.role;
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Defer async role loading to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            loadUserRole(session.user.id).then(role => {
              setUser(prev => prev ? { ...prev, role: role || 'barber' } : null);
            });
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const role = await loadUserRole(session.user.id);
        setUser({ ...session.user, role: role || 'barber' });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    try {
      // Limpar estado local primeiro
      setUser(null);
      setSession(null);
      
      // Fazer logout no Supabase
      await supabase.auth.signOut();
      
      // Forçar redirecionamento completo
      window.location.replace("/auth");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      // Mesmo com erro, garantir limpeza e redirecionamento
      setUser(null);
      setSession(null);
      window.location.replace("/auth");
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
