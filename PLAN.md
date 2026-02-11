# S7abt CMS v2.0.2 — Deployment Overhaul Plan

## Goal
Make the codebase ready for a **fresh deployment in any AWS region** (next target: Bahrain `me-south-1`) and smooth for open-source contributors, incorporating all lessons learned from the us-east-1 deployment.

---

## Phase 1: Code Fixes (Eliminate Hardcoded Values & Bugs)

### 1.1 Standardize ALL `shared/db.js` files

**Problem:** There are 12+ source copies of `db.js` across admin modules. They have:
- Hardcoded regions (`me-central-1` in admin, `us-east-1` in API) as fallbacks
- Hardcoded secret names (`s7abt/database/credentials-dubai`, `credentials-production`)
- Hardcoded database names (`s7abt_dubai`, `s7abt`)
- Admin version is missing `rawQuery()` method (needed for LIMIT/OFFSET queries)
- Admin version has `acquireTimeout` (not a valid mysql2 pool option)
- Admin version has `onConnectionConnect`/`onConnectionRelease` callbacks (not standard)

**Fix:** Create ONE canonical `shared/db.js` pattern that ALL copies follow:
- Region: `process.env.AWS_REGION` only — **no hardcoded fallback** (Lambda auto-sets this)
- Secret: `process.env.DB_SECRET_ARN || process.env.DB_SECRET_NAME` only — **no hardcoded fallback** (fail early with clear error if not set)
- Database name: from secret JSON `dbname`/`database` field — **no hardcoded fallback** (fail early)
- Exports: `query`, `rawQuery`, `queryOne`, `getConnection`, `beginTransaction`, `closePool`
- Remove `acquireTimeout`, `onConnectionConnect`, `onConnectionRelease`

**Files to update (11 source files):**
1. `s7abt-api-backend/shared/db.js`
2. `s7abt-admin/backend/shared/db.js`
3. `s7abt-admin/backend/articles/shared/db.js`
4. `s7abt-admin/backend/news/shared/db.js`
5. `s7abt-admin/backend/auth/shared/db.js`
6. `s7abt-admin/backend/sections/shared/db.js`
7. `s7abt-admin/backend/tags/shared/db.js`
8. `s7abt-admin/backend/tweets/shared/db.js`
9. `s7abt-admin/backend/analytics/shared/db.js`
10. `s7abt-admin/backend/users/shared/db.js`
11. `s7abt-api-backend/news/shared/db.js`

### 1.2 Fix SAM Templates

**`s7abt-admin/infrastructure/template-phase3.yaml` (Admin API):**
- Runtime: `nodejs18.x` → `nodejs20.x`
- Add `custom:role` String attribute to Cognito UserPool Schema (currently missing — causes "custom:role attribute does not exist" error when creating users)
- Add VPC configuration parameters (`VpcSubnetIds`, `VpcSecurityGroupIds`) so Lambdas can reach RDS
- Add `AWSLambdaVPCAccessExecutionRole` managed policy to Lambda execution role
- Align env var: use `DB_SECRET_NAME` consistently (code reads `DB_SECRET_ARN || DB_SECRET_NAME`)
- Remove hardcoded `me-central-1` from DatabaseSecretArn default — use description-only placeholder

**`s7abt-api-backend/template.yaml` (Public API / Social Media):**
- Runtime: `nodejs18.x` → `nodejs20.x`
- Replace `me-central-1` references with generic `<your-region>` placeholders

### 1.3 Fix `lambda-init.js` (Database Initialization)

- Remove hardcoded `'s7abt_dubai'` fallback database name — must come from secret
- Add missing tables to schema SQL:
  - `s7b_article_shares` (tracking share counts — was missing, causing share feature to fail)
  - `s7b_tweets` (tweet queue for social media automation)
  - `s7b_comment` (article comments)
  - Cognito columns on `s7b_user`: `s7b_user_email`, `s7b_user_cognito_id`

### 1.4 Fix Frontend Hardcoded Values

**`s7abt-website-v2/s7abt-frontend-v2/lib/api/client.ts`:**
- Replace hardcoded `s7abt-GetTopWriters` Lambda name/URL — use `NEXT_PUBLIC_API_URL` base
- Ensure all fallback URLs use `<your-...>` placeholders, not region-specific values

**`s7abt-website-v2/s7abt-frontend-v2/.env.production`:**
- Reset to placeholder values (currently has our us-east-1 API Gateway IDs + S3 bucket)
- Should match `.env.example` with `<your-...>` placeholders

**`s7abt-website-v2/s7abt-frontend-v2/lib/utils/image.ts`:**
- Verify S3 base URL fallback uses generic placeholder

### 1.5 Update `.gitignore`

Add these patterns (build artifacts are currently tracked, adding 80+ duplicate files):
```
s7abt-api-backend/s7build/
s7abt-api-backend/infrastructure/.aws-sam/
**/deploy_temp/
**/*-deployment/
**/lambda-deploy/
*.zip
```

---

## Phase 2: Documentation Overhaul

### 2.1 Rewrite `README.md`

Keep the good parts (features, tech stack), improve:
- Fix project structure tree (currently says `s7abt-dubai/`)
- Add clear "Prerequisites" section with AWS resource requirements
- Add architecture diagram (text-based)
- Add links to DEPLOYMENT.md, TROUBLESHOOTING.md, SECRETS-SETUP.md
- Add complete API endpoint listing (including new endpoints: share, getByTags, search)

### 2.2 Rewrite `DEPLOYMENT.md` (comprehensive step-by-step)

Complete rewrite as a numbered deployment checklist:

1. **Prerequisites** — AWS CLI, SAM CLI, Node.js 20.x, target region selection
2. **Step 1: AWS Secrets Manager Setup**
   - Database credentials: exact JSON format (`host`, `port`, `username`, `password`, `dbname`)
   - OpenAI API key: `s7abt/openai/credentials` with `{ "apiKey": "sk-..." }`
   - Twitter/X API: `s7abt/twitter/credentials` with all 5 keys
   - Exact `aws secretsmanager create-secret` commands for each
3. **Step 2: VPC & Networking**
   - Create/select VPC with 2+ subnets in different AZs
   - Create security group: allow inbound TCP 3306 from Lambda SG
   - **CRITICAL:** Lambda needs either NAT Gateway or VPC Endpoints for Secrets Manager access
4. **Step 3: RDS MySQL**
   - Create instance in private subnets
   - Note security group rules
5. **Step 4: Database Initialization**
   - Option A: Invoke `lambda-init` function
   - Option B: Run SQL files directly (`lambda-init.js` schema + migration files)
6. **Step 5: Deploy Admin API (SAM)**
   - `sam build -t template-phase3.yaml && sam deploy --guided`
   - Document all parameter prompts
   - Save outputs: API URL, Cognito Pool ID, Client ID, S3 Bucket Name
7. **Step 6: Create Cognito Admin User**
   - 3 CLI commands: create-user, set-password, update-attributes (custom:role=admin)
   - **WARNING:** custom:role is REQUIRED — users cannot log in without it
8. **Step 7: Deploy Public API**
   - `npm install && npm run deploy` (or SAM directly)
   - Save output: Public API URL
9. **Step 8: Deploy Admin Panel (React+Vite)**
   - Copy `.env.example` → `.env.production`, fill in Cognito + API values
   - `npm run build` → deploy to S3+CloudFront or hosting of choice
10. **Step 9: Deploy Public Website (Next.js)**
    - Configure `NEXT_PUBLIC_*` env vars
    - Deploy to Amplify/Vercel
    - **WARNING:** Amplify `update-app --environment-variables` REPLACES ALL vars
11. **Step 10: Social Media Integration (Optional)**
    - Store OpenAI + Twitter secrets in Secrets Manager
    - Deploy tweet generator/publisher Lambdas
12. **Post-Deployment Verification Checklist**

### 2.3 Create `TROUBLESHOOTING.md` (NEW)

Document ALL issues we encountered with root cause and fix:

| # | Issue | Symptom | Root Cause | Fix |
|---|---|---|---|---|
| 1 | Lambda 30s timeout | Function times out after 30s | `getConnection()`+`connection.end()` keeps event loop alive | Use `db.query()`/`db.rawQuery()` pool methods |
| 2 | Deleted articles visible | Soft-deleted articles on public site | Missing `deleted_at IS NULL` filter | Add to all WHERE clauses |
| 3 | "No database selected" | Lambda 500 error | Secret has `dbname` but code expected `database` (or vice versa) | db.js reads both fields |
| 4 | custom:role not found | User creation fails in Cognito | Pool schema missing the attribute | Add `custom:role` to UserPool Schema in SAM template |
| 5 | Network Error in admin | Admin CORS/connection failures | Lambda not in VPC; or CORS headers missing | VPC config + CORS on API Gateway |
| 6 | Lambda can't reach DB | Connection timeout | Lambda not in same VPC, or SG blocks port 3306 | Same VPC + SG rule |
| 7 | Share stats broken | Share buttons do nothing | `s7b_article_shares` table missing or has wrong columns | Run migration; match INSERT columns to actual table |
| 8 | Module not found | `Cannot find module '../shared/db'` | Lambda zip flattened directory structure | Zip folder names, not `folder/*` |
| 9 | Tweet generation fails | OpenAI call errors | API key missing from Secrets Manager | Create `s7abt/openai/credentials` secret |
| 10 | Amplify vars wiped | Images/features break after env update | `update-app --environment-variables` REPLACES ALL vars | Always pass ALL vars in single call |
| 11 | SAM deploy stuck | Stack in REVIEW_IN_PROGRESS | Previous failed deployment | Delete stuck stack; or use direct Lambda update |

### 2.4 Create `SECRETS-SETUP.md` (NEW)

Dedicated guide with:
- Table of all required secrets
- Exact JSON format for each
- CLI commands to create each secret
- How to verify secrets are accessible from Lambda
- Secret rotation notes

### 2.5 Update `.env.example` Files

- `s7abt-admin/frontend/.env.example` — ensure complete with all vars and descriptions
- `s7abt-website-v2/s7abt-frontend-v2/.env.example` — add missing vars (TAGS_API_URL, S3_BASE_URL, SEARCH_API_URL, CONTACT_API_URL)

---

## Phase 3: Clean Up Build Artifacts

### 3.1 Remove tracked build artifacts from git

The `s7build/` and `.aws-sam/` directories contain 80+ duplicate copies of every Lambda file. These should never be in version control.

```bash
git rm -r --cached s7abt-api-backend/s7build/
git rm -r --cached s7abt-api-backend/infrastructure/.aws-sam/
```

### 3.2 Remove stale/duplicate files

- `s7abt-admin/infrastructure/template-phase2.yaml` (superseded by phase3)
- `s7abt-admin/infrastructure/template-phase3-updated.yaml` (stale duplicate)
- `s7abt-admin/infrastructure/template-phase3-final.yaml` (stale duplicate)
- `s7abt-api-backend/news/shared/shared/db.js` (nested duplicate)
- `s7abt-admin/backend/tags/shared/shared/db.js` (nested duplicate)
- `s7abt-admin/backend/sections/shared/shared/db.js` (nested duplicate)
- `s7abt-admin/backend/sections/sections/shared/` (nested duplicate)
- `s7abt-admin/backend/sections/tags/shared/` (misplaced duplicate)
- Various `*-deployment/` and `lambda-deploy/` folders

### 3.3 Reset `.env.production`
Remove our us-east-1-specific values. The file should have placeholder values only.

---

## Execution Order

1. **Phase 1** — Code fixes first (db.js standardization, SAM templates, lambda-init, frontend)
2. **Phase 3** — Clean up build artifacts and .gitignore (before docs, so git status is clean)
3. **Phase 2** — Documentation (README, DEPLOYMENT, TROUBLESHOOTING, SECRETS-SETUP)
4. **Final** — Commit all changes

---

## Files Changed Summary

| Category | Count | Files |
|---|---|---|
| `shared/db.js` standardization | 11 | All source db.js files |
| SAM templates | 2 | template-phase3.yaml, template.yaml |
| Lambda init | 1 | lambda-init.js |
| Frontend config | 3 | client.ts, .env.production, image.ts |
| .gitignore | 1 | .gitignore |
| Documentation (rewrite) | 2 | README.md, DEPLOYMENT.md |
| Documentation (new) | 2 | TROUBLESHOOTING.md, SECRETS-SETUP.md |
| .env.example updates | 2 | admin + website .env.example |
| Cleanup (remove) | ~10 | Stale templates, nested duplicates |
| **Total** | **~35** | |
