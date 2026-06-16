# TODO

## Brainstorm / Validate
- [x] Explore relevant files for admin Matches UI and backend battle/proof endpoints.
- [x] Identify mismatch/logic issues between UI (expects /admin/battles) and backend controllers/routes.

## Fixes to implement (pending your approval)
- [] Remove/resolve obvious issues found in code:
  - [] `matchProofController.js`: duplicated `if (!proof)` block and inconsistent status filters.
  - [] `battleController.js`: potential logic issues (duplicate/unused functions, inconsistent admin approve/reject settling logic).
  - [] `Matches.jsx`: ensure it calls correct admin endpoints and handles response shape robustly.

## Testing
- [] Run admin + backend lint/tests (or start server) and validate:
  - [] matches list loads
  - [] match details modal loads
  - [] Win/Cancel actions work and don't double-pay/double-refund


