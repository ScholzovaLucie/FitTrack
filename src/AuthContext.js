import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from './supabaseClient';  // Tvůj Supabase klient

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Získat aktuální relaci uživatele při načtení
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user || null);
    };

    getUser();

    // Poslouchat změny v přihlášení / odhlášení
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    // Vracíme funkci, která odhlásí posluchače
    return () => {
      authListener?.subscription.unsubscribe();  // Zrušit posluchače
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook pro získání uživatele
export const useAuth = () => useContext(AuthContext);
