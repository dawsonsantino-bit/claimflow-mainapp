import { base44 } from '@/api/base44Client';
import { HUMAN_STATUSES, JOB_STATUSES } from '@/components/job/JobConstants';

// Deterministic fallbacks for each status
const FALLBACK_MESSAGES = {
    [JOB_STATUSES.LeadCreated]: "Your claim has been created. We will be in touch shortly.",
    [JOB_STATUSES.AssessmentDone]: "Assessment is complete. We are reviewing the details.",
    [JOB_STATUSES.ContractSigned]: "Contract signed. We are preparing the documentation.",
    [JOB_STATUSES.InitialDocumentationComplete]: "Initial documentation is complete. Next steps are underway.",
    [JOB_STATUSES.HygienistAssigned]: "A hygienist has been assigned to your case.",
    [JOB_STATUSES.SwabCompletedLabSent]: "Samples have been collected and sent to the lab.",
    [JOB_STATUSES.LabResultsProtocolReady]: "Lab results are in and the protocol is ready.",
    [JOB_STATUSES.InsuranceNegotiation]: "We are currently negotiating with your insurance provider.",
    [JOB_STATUSES.InsurancePaidFirstCheck]: "Initial insurance payment has been received.",
    [JOB_STATUSES.WorkInProgress]: "Restoration work is now in progress.",
    [JOB_STATUSES.WorkCompleted]: "All restoration work has been completed.",
    [JOB_STATUSES.FinalCheckToAttorney]: "Final settlement check has been sent to the attorney.",
    [JOB_STATUSES.ContractorPaidCaseClosed]: "Case is closed. Thank you for working with us.",
    [JOB_STATUSES.Canceled]: "This case has been canceled."
};

/**
 * Generates a status update message for the homeowner.
 * Uses AI if available, otherwise returns a deterministic fallback.
 * @param {Object} job - The job object
 * @param {String} toStatus - The new status
 * @returns {Promise<String>} The update text
 */
export async function generateStatusUpdate(job, toStatus) {
    const fallbackText = FALLBACK_MESSAGES[toStatus] || `Status updated to ${HUMAN_STATUSES[toStatus] || toStatus}.`;

    try {
        // Use AI to generate a friendly message
        const prompt = `
            You are a friendly customer service agent for CaseManager restoration.
            The job for ${job.property_owner_name} at ${job.property_address_line1} has moved to status: "${HUMAN_STATUSES[toStatus] || toStatus}".
            
            Write a status update for the homeowner.
            - Max 2 short sentences.
            - Friendly and reassuring tone.
            - No technical jargon.
            - If status is "WorkInProgress", mention we might need access.
            - If status is "InsuranceNegotiation", mention their attorney is handling it.
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
            return result.update_text;
        }
        
        return fallbackText;

    } catch (error) {
        console.error("AI Status Update Generation Failed:", error);
        return fallbackText;
    }
}