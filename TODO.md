# TODO

- [ ] Update `addaludo/backend/utils/2factorInSms.js` to support both 2Factor styles:
  - [x] Keep existing POST `https://2factor.in/API/R1/` flow (module=TRANS_SMS, apikey, to, from, msg)
  - [x] Add support for template-based V1 endpoint that requires `templatename`
  - [x] Ensure correct URL string formatting (template name in URL; no raw message text)
  - [x] Choose style via env `TWOFACTOR_USE_TEMPLATE` (preferred) and/or presence of `TWOFACTOR_TEMPLATE_NAME`
- [ ] Restart backend and test `POST /api/otp/send`
- [ ] Confirm the “Missing templatename value” error is gone



//test