import {
    submitApprovalAction,
    resolveApprovalAction,
    getPendingApprovalsAction,
    getApprovalHistoryAction,
    getWorkflowRulesAction,
    saveWorkflowRuleAction
} from '@/lib/actions/standard/workflow';

export const workflowAPI = {
    async submit(data) { return await submitApprovalAction(data); },
    async resolve(data) { return await resolveApprovalAction(data); },
    async getPending(businessId) { return await getPendingApprovalsAction(businessId); },
    async getHistory(businessId, filters) { return await getApprovalHistoryAction(businessId, filters); },
    async getRules(businessId) { return await getWorkflowRulesAction(businessId); },
    async saveRule(businessId, ruleData) { return await saveWorkflowRuleAction(businessId, ruleData); },
};

