import { base44 } from '@/api/base44Client';
import { HUMAN_STATUSES, JOB_STATUSES } from '@/components/job/JobConstants';

// Deterministic fallbacks for each status
const FALLBACK_MESSAGES = {
    [JOB_STATUSES.LeadCreated]: "We opened your claim and assigned a team. Next: on-site assessment.",
    [JOB_STATUSES.AssessmentDone]: "Assessment is complete. We’re preparing your documents for signatures.",
    [JOB_STATUSES.ContractSigned]: "Your agreement is signed. We’re collecting the required 'before' photos and documentation.",
    [JOB_STATUSES.WorkInProgress]: "Restoration work has started. We’ll update you as major steps complete.",
    [JOB_STATUSES.WorkCompleted]: "Work is complete. We’re finalizing close-out and confirming the final payment.",
    [JOB_STATUSES.ContractorPaidCaseClosed]: "Your case is closed. Thank you for working with us."
};

/**
 * Generates a status update message for the homeowner.
 * Uses AI if available, otherwise returns a deterministic fallback.
 * @param {Object} job - The job object
 * @param {String} toStatus - The new status
 * @returns {Promise<String>} The update text
 */
export async function generateStatusUpdate(job, toStatus) {
    const fallbackText = FALLBACK_MESSAGES[toStatus] || `Your claim status was updated to ${HUMAN_STATUSES[toStatus] || toStatus}. We’ll keep you posted.`;

    try {
        // Use AI to generate a friendly message
        const prompt = `
            You are a calm, professional restoration assistant. 
            Write 2 short sentences: what just happened, what’s next. No dates or guarantees.
            
            Job Context:
            Owner: ${job.property_owner_name}
            Location: ${job.property_city}, ${job.property_state}
            New Status: ${HUMAN_STATUSES[toStatus] || toStatus}
        `;

        const result = await base44.integrations.Core.InvokeLLM({
            prompt: prompt,
            response_json_schema: {
                type: "object",
                properties: {
                    update_text: { type: "string" }
                }
            }
        });

        if (result && result.update_text) {
            return result.update_text.trim();
        }
        
        return fallbackText;

    } catch (error) {
        console.error("AI Status Update Generation Failed:", error);
        return fallbackText;
    }
}

/**
 * Orchestrates the status update process: Generates text, creates JobUpdate record, and sends email.
 * Fire-and-forget style (async).
 */
export async function createAndSendStatusUpdate(job, toStatus, user) {
    try {
        const text = await generateStatusUpdate(job, toStatus);
        
        // Create JobUpdate Record
        await base44.entities.JobUpdate.create({
            job_id: job.id,
            title: `Status Update: ${HUMAN_STATUSES[toStatus]}`,
            text: text,
            audience: 'Homeowner',
            visible_to_homeowner: true,
            created_by_user_id: user.id,
            generated_by_ai: true,
            created_at: new Date().toISOString()
        });

        // Send Email (if configured)
        if (job.property_email) {
            try {
                await base44.integrations.Core.SendEmail({
                    to: job.property_email,
                    subject: `Claim update: ${HUMAN_STATUSES[toStatus]}`,
                    body: text
                });
            } catch (emailError) {
                // Swallow email errors as requested
                console.warn("Email dispatch failed (SMTP likely missing or error):", emailError);
            }
        }

    } catch (error) {
        console.error("Failed to process status update workflow:", error);
    }
}