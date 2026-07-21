# Galaxy Cue email icon setup (BIMI)

1. Upload this complete release to GitHub Pages.
2. Confirm this URL opens publicly:
   https://hmgalaxy.github.io/housemusicgalaxy-booking-suite/assets/galaxy-cue-bimi-logo.svg
3. In GoDaddy DNS add one TXT record:
   - Type: TXT
   - Name: default._bimi
   - Value: v=BIMI1; l=https://hmgalaxy.github.io/housemusicgalaxy-booking-suite/assets/galaxy-cue-bimi-logo.svg;
   - TTL: 1 Hour
4. Do not create a second DMARC record. The existing _dmarc policy already uses p=quarantine.
5. Allow time for DNS and mailbox-provider caching. Display is controlled by each receiving provider and is not guaranteed without a BIMI certificate.
