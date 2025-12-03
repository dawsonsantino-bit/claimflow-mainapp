import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { USER_ROLES } from '@/components/job/JobConstants';
import { Loader2 } from 'lucide-react';

// Dashboard components (placeholders for now)
import CompanyAdminDashboard from '@/components/dashboard/CompanyAdminDashboard';
import LocationAdminDashboard from '@/components/dashboard/LocationAdminDashboard';
import SalesRepDashboard from '@/components/dashboard/SalesRepDashboard';
import HygienistDashboard from '@/components/dashboard/HygienistDashboard';
import AttorneyDashboard from '@/components/dashboard/AttorneyDashboard';
import ContractorDashboard from '@/components/dashboard/ContractorDashboard';
import HomeownerDashboard from '@/components/dashboard/HomeownerDashboard';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        // Not logged in
        window.location.href = '/';
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user) return null; // Redirect handled in useEffect

  // Auto-assign Homeowner role if missing (Self-service signup flow)
  // Also ensure company/location context exists for internal roles
  useEffect(() => {
      if (!user) return;

      const ensureUserContext = async () => {
          let updates = {};
          
          if (!user.business_role) {
              updates.business_role = USER_ROLES.Homeowner;
          }

          // For internal roles, ensure company/location exists
          if (user.business_role !== USER_ROLES.Homeowner && (!user.company_id || !user.location_id)) {
              try {
                  let companyId = user.company_id;
                  if (!companyId) {
                      const companies = await base44.entities.Company.list({}, '', 1);
                      if (companies.length > 0) companyId = companies[0].id;
                      else {
                          const newCo = await base44.entities.Company.create({ name: "Default Company" });
                          companyId = newCo.id;
                      }
                      updates.company_id = companyId;
                  }

                  let locationId = user.location_id;
                  if (!locationId) {
                      const locations = await base44.entities.Location.list({ company_id: companyId }, '', 1);
                      if (locations.length > 0) locationId = locations[0].id;
                      else {
                          const newLoc = await base44.entities.Location.create({ 
                              company_id: companyId, 
                              name: "Main Branch",
                              address_line1: "123 HQ Blvd",
                              city: "Cityville",
                              state: "ST",
                              zip: "12345"
                          });
                          locationId = newLoc.id;
                      }
                      updates.location_id = locationId;
                  }
              } catch (e) {
                  console.error("Failed to ensure context", e);
              }
          }

          if (Object.keys(updates).length > 0) {
              console.log("Updating user context:", updates);
              const updatedUser = await base44.auth.updateMe(updates);
              setUser(updatedUser);
          }
      };
      
      ensureUserContext();
  }, [user?.id]); // Run once when user loads

  const role = user.business_role || USER_ROLES.Homeowner;

  switch (role) {
    case USER_ROLES.CompanyAdmin:
      return <CompanyAdminDashboard user={user} />;
    case USER_ROLES.LocationAdmin:
      return <LocationAdminDashboard user={user} />;
    case USER_ROLES.SalesRep:
      return <SalesRepDashboard user={user} />;
    case USER_ROLES.Hygienist:
      return <HygienistDashboard user={user} />;
    case USER_ROLES.Attorney:
      return <AttorneyDashboard user={user} />;
    case USER_ROLES.Contractor:
      return <ContractorDashboard user={user} />;
    case USER_ROLES.Homeowner:
      return <HomeownerDashboard user={user} />;
    default:
      return (
        <div className="p-6">
          <h1 className="text-xl font-bold text-red-600">Unknown Role</h1>
          <p>Your account does not have a valid role assigned ({role}). Please contact support.</p>
        </div>
      );
  }
}