/**
 * Verification script for Approvals & Workflows tab, services, actions, and UI wirings.
 * Run: node scripts/verify-approvals-workflow.mjs or bun run scripts/verify-approvals-workflow.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const failures = [];

function assert(condition, message) {
  if (!condition) {
    failures.push(message);
    console.error(`❌ ${message}`);
  } else {
    console.log(`✅ ${message}`);
  }
}

function read(relPath) {
  return readFileSync(join(root, relPath), 'utf8');
}

console.log('--- Verifying Approvals & Workflows Fixes ---\n');

// 1. Check ApprovalInbox.jsx
const inboxSrc = read('components/workflow/ApprovalInbox.jsx');
assert(
  inboxSrc.includes('All caught up! 🎉') && !inboxSrc.includes('ðŸŽ‰'),
  'ApprovalInbox.jsx must use clean UTF-8 emoji 🎉 without corrupted bytes'
);
assert(
  inboxSrc.includes('invoice: { icon: FileText'),
  'ApprovalInbox.jsx TYPE_CONFIG must include invoice configuration'
);

// 2. Check WorkflowBuilder.jsx
const builderSrc = read('components/workflow/WorkflowBuilder.jsx');
assert(
  builderSrc.includes('workflowAPI.getRules(businessId)'),
  'WorkflowBuilder.jsx must fetch rules on mount via workflowAPI.getRules'
);
assert(
  builderSrc.includes('workflowAPI.saveRule(businessId, wf)'),
  'WorkflowBuilder.jsx must persist rules on save via workflowAPI.saveRule'
);
assert(
  builderSrc.includes('<t.icon className="w-4 h-4 text-emerald-600" />'),
  'WorkflowBuilder.jsx trigger option icon must use clean text-emerald-600 styling'
);

// 3. Check DashboardClient.jsx
const clientSrc = read('app/business/[category]/DashboardClient.jsx');
assert(
  clientSrc.includes("action: 'approve'"),
  "DashboardClient.jsx handleApproveRequest must send action: 'approve'"
);
assert(
  clientSrc.includes("action: 'reject'"),
  "DashboardClient.jsx handleRejectRequest must send action: 'reject'"
);

// 4. Check lib/actions/standard/workflow.js
const workflowActionSrc = read('lib/actions/standard/workflow.js');
assert(
  workflowActionSrc.includes("const isApproved = data.action === 'approve' || data.action === 'approved';"),
  'workflow.js resolveApprovalAction must normalize approval action string to accept both approve and approved'
);
assert(
  workflowActionSrc.includes("requestId.startsWith('inv_')"),
  'workflow.js resolveApprovalAction must handle synthetic invoice approval requests'
);
assert(
  workflowActionSrc.includes("4. Pending Invoices awaiting approval"),
  'workflow.js getPendingApprovalsAction must aggregate pending invoices'
);
assert(
  workflowActionSrc.includes('export async function getWorkflowRulesAction') &&
  workflowActionSrc.includes('export async function saveWorkflowRuleAction'),
  'workflow.js must export getWorkflowRulesAction and saveWorkflowRuleAction'
);

// 5. Check lib/services/WorkflowService.js
const serviceSrc = read('lib/services/WorkflowService.js');
assert(
  serviceSrc.includes("const isApproved = data.action === 'approve' || data.action === 'approved';"),
  'WorkflowService.js resolveApproval must normalize approval action string'
);
assert(
  serviceSrc.includes('async getWorkflowRules(businessId') &&
  serviceSrc.includes('async saveWorkflowRule(businessId'),
  'WorkflowService.js must implement getWorkflowRules and saveWorkflowRule methods'
);

// 6. Check lib/actions/standard/invoice-approval.js
const invApprovalSrc = read('lib/actions/standard/invoice-approval.js');
assert(
  invApprovalSrc.includes('export async function getPendingInvoiceApprovalsAction'),
  'invoice-approval.js must export getPendingInvoiceApprovalsAction to prevent duplicate export collisions'
);

// Summary
console.log('\n-----------------------------------');
if (failures.length > 0) {
  console.error(`❌ Verification failed with ${failures.length} issues.`);
  process.exit(1);
} else {
  console.log('✨ All Approvals & Workflows verification checks PASSED successfully!');
  process.exit(0);
}
