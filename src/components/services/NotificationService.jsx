import { base44 } from '@/api/base44Client';
import { HUMAN_STATUSES, USER_ROLES } from '@/components/job/JobConstants';

/**
 * Notification Service
 * Handles sending emails and creating in-app notifications.
 */

const sendEmail = async (to, subject, body) => {
    if (!to) return;
    try {
        await base44.integrations.Core.SendEmail({
            to,
            subject,
            body
        });
    } catch (error) {
        // Swallow error for "Wire SMTP env... if SMTP missing... don't error" requirement
        console.warn("Email sending failed (SMTP missing or misconfigured):", error);
    }
};

const createNotification = async (userId, jobId, title, message, type = 'info') => {
    if (!userId) return;
    try {
        await base44.entities.Notification.create({
            user_id: userId,
            job_id: jobId,
            title,
            message,
            type,
            is_read: false,
            created_at: new Date().toISOString()
        });
    } catch (error) {
        console.error("Failed to create notification:", error);
    }
};

export const NotificationService = {
    /**
     * Notify relevant users about a status change.
     */
    notifyStatusChange: async (job, fromStatus, toStatus, actorUser) => {
        const humanStatus = HUMAN_STATUSES[toStatus] || toStatus;
        const title = `Job Status Updated: ${humanStatus}`;
        const message = `Job at ${job.property_address_line1} has been moved to ${humanStatus} by ${actorUser.full_name}.`;

        // 1. Notify Sales Rep (if not the actor)
        if (job.sales_rep_user_id && job.sales_rep_user_id !== actorUser.id) {
            try {
                // Fetch basic user info (optimization: could be cached or passed)
                const users = await base44.entities.User.list({ id: job.sales_rep_user_id });
                const salesRep = users[0];
                if (salesRep) {
                    await createNotification(salesRep.id, job.id, title, message);
                    await sendEmail(salesRep.email, title, message);
                }
            } catch (e) { console.error(e); }
        }
    },

    /**
     * Notify a user they have been assigned to a job.
     */
    notifyAssignment: async (job, role, assignedUserId, assignedByUserId) => {
        if (!assignedUserId) return;

        try {
            const users = await base44.entities.User.list({ id: assignedUserId });
            const assignedUser = users[0];
            if (!assignedUser) return;

            const title = `New Job Assignment: ${role}`;
            const message = `You have been assigned as ${role} to the job at ${job.property_address_line1}.`;

            await createNotification(assignedUser.id, job.id, title, message);
            await sendEmail(assignedUser.email, title, message);

        } catch (e) { console.error(e); }
    },

    /**
     * Notify Admins about potential issues.
     */
    notifyAdminIssue: async (job, issueText) => {
        try {
            const admins = await base44.entities.User.list({ business_role: USER_ROLES.CompanyAdmin });
            const title = `Action Required: Issue Detected`;
            const message = `AI flagged an issue for job at ${job.property_address_line1}: ${issueText}`;

            for (const admin of admins) {
                await createNotification(admin.id, job.id, title, message, 'warning');
                await sendEmail(admin.email, title, message);
            }
        } catch (e) { console.error(e); }
    },

    /**
     * Notify about stagnant jobs
     */
    notifyStagnantJob: async (job, daysStagnant, adminUser) => {
        const title = `Stagnant Job Alert`;
        const message = `Job at ${job.property_address_line1} has been in ${HUMAN_STATUSES[job.current_status]} for ${daysStagnant} days.`;
        
        await createNotification(adminUser.id, job.id, title, message, 'warning');
    }
};