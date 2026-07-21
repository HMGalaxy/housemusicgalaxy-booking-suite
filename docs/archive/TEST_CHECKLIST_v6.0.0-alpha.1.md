# Test Checklist — v6.0.0-alpha.1

Use one dedicated event named **GCOS Workflow Test**. Keep the Business Portal open normally and Client Portal open in another tab.

1. Open an event and confirm the workflow begins at **Booking Request Received**.
2. Business side: click **Send Event Form**.
3. Client Portal: confirm the status is **Event Form Pending** and click **Submit Event Form**.
4. Business side: confirm **Quote Preparation**, then click **Send Final Quote**.
5. Client Portal: confirm **Quote Review**, then click **Accept Quote**.
6. Business side: confirm **Contract Preparation**, then click **Send Contract & Deposit**.
7. Client Portal: click only **Sign Contract**. Confirm the workflow does not advance yet.
8. Client Portal: click **Record Deposit Paid**. Confirm it advances to **Planning Form Preparation**.
9. Business side: click **Send Planning Form**.
10. Client Portal: click **Submit Planning Form**.
11. Business side: test **Return for Changes**, resubmit from the Client Portal, then click **Approve Planning**.
12. Confirm the final state is **Event Ready**.
13. Refresh after several different stages and confirm the same state remains.
14. Open Recent Workflow History and confirm each action appears once with actor and timestamp.
15. Confirm CRM, Events, Calendar, Music Planner, Files and Messages still open and save normally.

Also test the decline branch on a second event: reach Quote Review and click **Decline Quote**.
