# Copyright Protection Guide

**Mindscape Analytics LLC — Internal Documentation**

---

## Overview

This guide explains how to maintain strong copyright protection for the TENVO platform.

## Protection Layers

### 1. Legal Foundation

**Files:**
- `LICENSE` - Proprietary software license
- `COPYRIGHT` - Comprehensive copyright notice
- `NOTICE` - Legal notice for all users
- `ANTI-PIRACY.md` - Detailed anti-piracy policy
- `SECURITY.md` - Security and disclosure policy
- `.github/DMCA-NOTICE.md` - DMCA takedown information

**Purpose:** Establish clear legal ownership and restrictions

**Maintenance:**
- Review annually
- Update copyright year
- Update contact information as needed
- Keep language clear and enforceable

### 2. Package Metadata

**File:** `package.json`

**Key Fields:**
```json
{
  "private": true,
  "license": "UNLICENSED",
  "author": "Mindscape Analytics LLC",
  "copyright": "Copyright © 2026 Mindscape Analytics LLC. All rights reserved."
}
```

**Purpose:** Prevent accidental npm publication and declare ownership

### 3. Source Code Headers

**Template:** `.copyright-header.js`

**Usage:**
```bash
npm run copyright:add-headers
```

**Purpose:** Embed copyright notice in every source file

**When to Run:**
- After creating new files
- Before major releases
- During security audits
- When preparing for external review

### 4. Git Configuration

**Files:**
- `.gitignore` - Hide sensitive documentation
- `.gitattributes` - Mark code as proprietary

**Purpose:** Control what is exposed on GitHub

**Critical .gitignore Entries:**
```
# Hide internal documentation
INTERNAL_README.md
TECHNICAL_README.md
docs/INTERNAL_*.md

# Hide sensitive configuration
.env
.env*.local

# Hide proprietary research
/research/
/internal-docs/
```

### 5. Public-Facing Files

**README.md** - Safe for GitHub, clearly states proprietary nature

**What to Include:**
- ✅ Clear "NOT open source" statement
- ✅ Copyright notice
- ✅ Contact information
- ✅ Legal warnings

**What to EXCLUDE:**
- ❌ Detailed technical architecture
- ❌ Database schemas
- ❌ API documentation
- ❌ Business logic explanations
- ❌ Deployment procedures
- ❌ Internal tools and scripts
- ❌ Customer information
- ❌ Trade secrets

---

## Verification Checklist

Run regularly:

```bash
npm run copyright:verify
```

### Manual Checks:

- [ ] All legal files are present
- [ ] Copyright year is current (2026)
- [ ] Contact information is accurate
- [ ] .gitignore hides sensitive files
- [ ] package.json shows "UNLICENSED"
- [ ] README.md is safe for public view
- [ ] No API keys or secrets in committed files
- [ ] No detailed technical documentation exposed

---

## GitHub Repository Settings

### Required Settings:

1. **Visibility:** Can be public (with proper LICENSE)
2. **License Detection:** Should show "Proprietary"
3. **About Section:**
   - Description: "Proprietary enterprise software - All rights reserved"
   - Website: https://www.mindscapeanalytics.com
   - Topics: Do NOT include "open-source"

4. **Branch Protection:**
   - Protect main branch
   - Require pull request reviews
   - Dismiss stale approvals
   - Require status checks

5. **Security Settings:**
   - Enable Dependabot alerts (for dependencies only)
   - Enable secret scanning
   - Enable token scanning

6. **Disable:**
   - Issues (for public repos) - Use private channels
   - Discussions - Use internal Slack/Teams
   - Wiki - Use internal documentation
   - Projects (for public repos)

### Repository Description Template:

```
⚠️ PROPRIETARY SOFTWARE - NOT OPEN SOURCE
Enterprise commerce platform by Mindscape Analytics LLC
Copyright © 2026 - All Rights Reserved
Unauthorized copying prohibited
```

---

## Handling Forks and Copies

### If Someone Forks Your Repo:

1. **Immediate Assessment:**
   - Is it authorized? (Check contracts)
   - What is their intent?
   - What code did they access?

2. **For Unauthorized Forks:**
   - Document the fork (screenshots, dates)
   - Review what code is exposed
   - Prepare DMCA takedown notice

3. **DMCA Takedown Process:**
   - Use GitHub's DMCA form
   - Reference `.github/DMCA-NOTICE.md`
   - Include specific URLs
   - Provide proof of ownership (LICENSE, COPYRIGHT)
   - GitHub typically responds within 24-48 hours

4. **Follow-Up:**
   - Send cease and desist letter to infringer
   - Consider legal action if commercial use
   - Update security measures

### DMCA Takedown Links:

- **GitHub:** https://github.com/contact/dmca-takedown
- **GitLab:** https://about.gitlab.com/handbook/legal/dmca/
- **Bitbucket:** Report through support

---

## Internal Documentation Security

### Types of Documentation:

**Public (can be on GitHub):**
- README.md (limited, legal-focused)
- LICENSE, COPYRIGHT, NOTICE
- SECURITY.md (no implementation details)
- Public API documentation (if applicable)

**Internal Only (must NOT be on GitHub):**
- Detailed architecture documents
- Database schemas and ERD
- API implementation details
- Business logic explanations
- Deployment procedures
- Internal tools documentation
- Performance optimization notes
- Security implementation details
- Customer data structures
- Integration credentials

### Location for Internal Docs:

Store in secure internal wiki/Confluence/Notion:
- **Not in Git:** Use internal documentation platform
- **Access Control:** Restrict to employees only
- **Encryption:** Use encrypted storage
- **Backups:** Regular secure backups
- **Audit Logs:** Track who accesses what

---

## Code Review Guidelines

### Before Committing:

Check for:
- [ ] No API keys or secrets
- [ ] No hardcoded credentials
- [ ] No customer data
- [ ] No PII (Personally Identifiable Information)
- [ ] No internal infrastructure details
- [ ] Copyright header present
- [ ] Comments don't reveal trade secrets

### Red Flags in Code:

```javascript
// ❌ BAD - Reveals trade secret
// Our proprietary algorithm uses XYZ mathematical formula...

// ❌ BAD - Hardcoded secret
const API_KEY = "sk_live_abc123...";

// ❌ BAD - Exposes customer
// Customer ABC Corp uses this for their specific workflow...

// ✅ GOOD - Generic comment
// Process payment using configured gateway

// ✅ GOOD - No implementation details
// Validate input according to business rules
```

---

## Employee/Contractor Onboarding

### Required Agreements:

1. **Non-Disclosure Agreement (NDA)**
   - Covers all proprietary information
   - Extends beyond employment term
   - Includes code, algorithms, business logic

2. **Intellectual Property Assignment**
   - All work belongs to company
   - No personal rights to code
   - Covers inventions and innovations

3. **Acceptable Use Policy**
   - No personal use of company code
   - No sharing with third parties
   - No removal of code from company systems

4. **Security Training**
   - Copyright awareness
   - Handling proprietary information
   - Incident reporting procedures

### Access Control:

- Grant minimum necessary access
- Time-limited contractor access
- Revoke immediately upon departure
- Audit access logs regularly

---

## Monitoring and Detection

### What to Monitor:

1. **GitHub:**
   - Forks of your repository
   - Code search results for your unique strings
   - Users starring/watching your repo

2. **Public Code Hosting:**
   - GitLab, Bitbucket for copies
   - Pastebin, Gist for code snippets
   - Stack Overflow for your code

3. **Search Engines:**
   - Google code search
   - GitHub advanced search
   - Unique function/variable names from your code

4. **Social Media:**
   - Twitter, LinkedIn for discussions
   - Reddit programming communities
   - Discord, Slack public channels

### Red Flags:

- Unusual fork activity
- Repo suddenly starred by many accounts
- Code snippets appearing on forums
- Ex-employees joining competitors
- Unusual pattern of file access (audit logs)

### Tools:

- **GitHub Search:** Search for unique identifiers from your code
- **Google Alerts:** Set up alerts for unique terms
- **Code Detection:** Use commercial code similarity tools
- **Social Monitoring:** Tools like Mention or Brand24

---

## Response Procedures

### Suspected Code Theft:

1. **Don't Panic - Document:**
   - Screenshot everything
   - Save URLs and timestamps
   - Export repository if possible
   - Note user information

2. **Assess Severity:**
   - How much code was taken?
   - Is it being used commercially?
   - Who is the infringer?
   - What's the potential damage?

3. **Initial Response:**
   - Internal review by legal/security team
   - Preserve evidence
   - Prepare DMCA notice
   - Research the infringer

4. **Legal Action:**
   - DMCA takedown (for hosting providers)
   - Cease and desist letter
   - Demand letter for damages
   - Litigation if necessary

### Contact for Legal Issues:

**Internal Legal Team** or designated legal counsel

**Documentation to Provide:**
- Evidence of ownership (commits, dates, LICENSE)
- Evidence of infringement (screenshots, code diffs)
- Proof of damage (if any)
- Timeline of events

---

## Best Practices Summary

### DO:

✅ Keep copyright notices up to date  
✅ Use strong proprietary license  
✅ Add headers to all source files  
✅ Hide internal documentation  
✅ Monitor for unauthorized use  
✅ Respond quickly to infringement  
✅ Train employees on IP protection  
✅ Use strong access controls  
✅ Audit who has access regularly  
✅ Document everything  

### DON'T:

❌ Share code with unauthorized parties  
❌ Post detailed internals publicly  
❌ Use permissive licenses (MIT, Apache, etc.)  
❌ Commit secrets or credentials  
❌ Ignore copyright violations  
❌ Assume "private" repo means protected  
❌ Grant permanent access to contractors  
❌ Discuss proprietary details in public  
❌ Let former employees keep access  
❌ Forget to update legal documents  

---

## Annual Review Checklist

Perform annually (every January):

- [ ] Update copyright year in all files
- [ ] Review and update LICENSE
- [ ] Verify .gitignore is protecting sensitive files
- [ ] Run `npm run copyright:verify`
- [ ] Search GitHub for unauthorized forks
- [ ] Review employee/contractor access
- [ ] Update contact information
- [ ] Review and update SECURITY.md
- [ ] Check for exposed secrets (git-secrets tool)
- [ ] Review documentation for leaks
- [ ] Update ANTI-PIRACY.md if laws changed
- [ ] Verify DMCA agent information is current

---

## Quick Reference Commands

```bash
# Verify copyright protection
npm run copyright:verify

# Add copyright headers to source files
npm run copyright:add-headers

# Check for exposed secrets (if using git-secrets)
git secrets --scan

# List all files in git
git ls-files

# Search for potential secrets
git grep -i "api.key\\|password\\|secret"

# Check what files would be ignored
git check-ignore -v *
```

---

## Resources

### Internal:
- Legal team contact: [Add contact info]
- Security team: [Add contact info]
- Engineering leads: [Add contact info]

### External:
- **U.S. Copyright Office:** https://www.copyright.gov
- **GitHub DMCA:** https://github.com/contact/dmca-takedown
- **WIPO:** https://www.wipo.int
- **EFF (for understanding):** https://www.eff.org/issues/copyright

### Legal Counsel:
[Add your company's legal counsel information]

---

## Document History

- **Created:** January 2026
- **Last Updated:** January 2026
- **Next Review:** January 2027
- **Owner:** Legal/Engineering Leadership

---

**Copyright © 2026 Mindscape Analytics LLC. All Rights Reserved.**

**This guide is confidential and for internal use only.**
