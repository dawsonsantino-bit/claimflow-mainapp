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
                // 1. Try to match by email domain
                let assigned = false;
                const domain = user.email.split('@')[1];
                if (domain) {
                    const domains = await base44.entities.CompanyDomain.filter({ domain });
                    if (domains && domains.length > 0) {
                        await base44.auth.updateMe({ company_id: domains[0].company_id });
                        user.company_id = domains[0].company_id;
                        assigned = true;
                    }
                }

                // 2. Fallback: assign to Default Company (create if needed)
                if (!assigned) {
                    let companies = await base44.entities.Company.list();
                    let defaultCompany = companies.find(c => c.slug === 'default') || companies[0];
                    if (!defaultCompany) {
                        defaultCompany = await base44.entities.Company.create({ name: 'Default Company', slug: 'default' });
                        await base44.entities.ClaimSequence.create({ company_id: defaultCompany.id, last_number: 0 });
                    }
                    await base44.auth.updateMe({ company_id: defaultCompany.id });
                    user.company_id = defaultCompany.id;
                }
            } catch (e) { console.warn("Auto-assign company failed", e); }
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