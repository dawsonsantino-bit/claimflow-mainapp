import { USER_ROLES } from '@/components/job/JobConstants';

export const Permissions = {
    /**
     * Determines if a user can view a specific job.
     */
    canViewJob: (user, job) => {
        if (!user || !job) return false;
        
        // Company Admin: Can view all jobs in the company
        if (user.business_role === USER_ROLES.CompanyAdmin) {
            return user.company_id === job.company_id;
        }

        // Location Admin: Can view all jobs in their company
        if (user.business_role === USER_ROLES.LocationAdmin) {
            return user.company_id === job.company_id;
        }

        // Sales Rep: Can view jobs they created/assigned
        if (user.business_role === USER_ROLES.SalesRep) {
            return job.sales_rep_user_id === user.id;
        }

        // Hygienist: Can view jobs assigned to them
        if (user.business_role === USER_ROLES.Hygienist) {
            return job.hygienist_user_id === user.id;
        }

        // Attorney: Can view jobs assigned to them
        if (user.business_role === USER_ROLES.Attorney) {
            return job.attorney_user_id === user.id;
        }

        // Contractor: Can view jobs assigned to them
        if (user.business_role === USER_ROLES.Contractor) {
            return job.contractor_user_id === user.id;
        }

        // Homeowner: Can view their own job
        if (user.business_role === USER_ROLES.Homeowner) {
            return job.homeowner_user_id === user.id;
        }

        return false;
    },

    /**
     * Determines if a user can perform actions on a job.
     * In addition to role checks, this verifies assignment.
     */
    canPerformAction: (user, job, allowedRoles = []) => {
        if (!Permissions.canViewJob(user, job)) return false;

        // Admins can usually do anything
        if (user.business_role === USER_ROLES.CompanyAdmin || 
            user.business_role === USER_ROLES.LocationAdmin) {
            return true;
        }

        // Must be in allowed roles
        if (!allowedRoles.includes(user.business_role)) return false;

        // Double check assignment for specific roles to ensure they don't act on unassigned jobs
        if (user.business_role === USER_ROLES.SalesRep && job.sales_rep_user_id !== user.id) return false;
        if (user.business_role === USER_ROLES.Hygienist && job.hygienist_user_id !== user.id) return false;
        if (user.business_role === USER_ROLES.Attorney && job.attorney_user_id !== user.id) return false;
        if (user.business_role === USER_ROLES.Contractor && job.contractor_user_id !== user.id) return false;

        return true;
    }
};