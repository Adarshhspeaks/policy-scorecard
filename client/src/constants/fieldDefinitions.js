// Descriptions and metadata matching backend src/fields.js
export const FIELD_DEFINITIONS = {
  waiting_period_initial: {
    title: "Initial Waiting Period",
    description: "Waiting period before any non-accidental illness is eligible for claim coverage",
  },
  waiting_period_preexisting: {
    title: "Pre-Existing Diseases Waiting Period",
    description: "Waiting period required before pre-existing conditions and ailments are covered",
  },
  waiting_period_specific: {
    title: "Specific Illnesses Waiting Period",
    description: "Waiting period for listed conditions like cataract, hernia, joint replacement, etc.",
  },
  room_rent_cap: {
    title: "Room Rent Cap",
    description: "Daily room rent limit or percentage of total sum insured allowed without proportionate deduction",
  },
  copay: {
    title: "Co-Payment",
    description: "Percentage of the admissible claim amount that the insured member must bear out-of-pocket",
  },
  sub_limits: {
    title: "Treatment Sub-Limits",
    description: "Specific monetary caps on particular treatments, procedures, or robotic surgeries",
  },
  exclusions: {
    title: "Permanent Exclusions",
    description: "Treatments, procedures, or conditions that are permanently excluded from policy coverage",
  },
  claim_conditions: {
    title: "Claim Conditions & Intimation",
    description: "Mandatory timelines for hospital intimation, document submission, and cashless claims",
  },
};
