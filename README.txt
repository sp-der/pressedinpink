PNP send-order-link repair

1. Extract this ZIP into the root of the Pressed In Pink repository.
2. Redeploy the function:

   npx supabase functions deploy send-order-link

3. Submit one new test order.
4. Check the customer inbox, PNP notification inbox, spam folders, and Resend > Emails.
5. If the function still fails, the Network > Response tab will now show a safe stage, detail, and diagnosticId, while Supabase logs will show the full error.
