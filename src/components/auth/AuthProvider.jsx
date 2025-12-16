import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        let user = await base44.auth.me();
        
        // Normalize email to lowercase
        if (user && user.email) {
            const normalizedEmail = user.email.toLowerCase();
            if (user.email !== normalizedEmail) {
                await base44.auth.updateMe({ email: normalizedEmail });
                user.email = normalizedEmail;
            }
        }
        
        // Auto-assign company logic
        if (user && !user.company_id && user.email) {
            try {
                const domain = user.email.split('@')[1];
                if (domain) {
                    const domains = await base44.entities.CompanyDomain.list({ domain: domain });
                    if (domains && domains.length > 0) {
                        const match = domains[0];
                        await base44.auth.updateMe({ company_id: match.company_id });
                        user.company_id = match.company_id;
                    }
                }
            } catch (e) { console.warn("Auto-assign failed", e); }
        }
        
        setCurrentUser(user);
      } catch (error) {
        // Not logged in
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);