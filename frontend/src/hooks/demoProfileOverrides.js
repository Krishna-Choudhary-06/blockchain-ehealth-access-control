/**
 * Demo-only hardcoded BGW recipient mappings.
 *
 * These map well-known demo identity names to static BGW recipient IDs
 * and default privacy levels. Real users enrolled through the standard
 * Fabric flow receive dynamic recipient IDs and are never matched here.
 *
 * This file exists solely to keep the demo identities working without
 * a production key-distribution authority. It is NOT safe for production.
 */
const DEMO_PROFILE_OVERRIDES = {
  patient1: { bgwRecipientId: 1, privacyLevel: 'L0' },
  patient7: { bgwRecipientId: 12, privacyLevel: 'L0' },
  patient10: { bgwRecipientId: 13, privacyLevel: 'L0' },
  doctor1: { bgwRecipientId: 8, privacyLevel: 'L2' },
  doctor2: { bgwRecipientId: 15, privacyLevel: 'L2' },
  nurse1: { bgwRecipientId: 11, privacyLevel: 'L1' },
  admin1: { bgwRecipientId: 20, privacyLevel: 'L3' }
}

export default DEMO_PROFILE_OVERRIDES
