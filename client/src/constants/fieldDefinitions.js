// Descriptions and metadata matching backend src/fields.js
export const FIELD_DEFINITIONS = {
  waiting_period_initial: {
    title: "Initial Waiting Period",
    description: "Waiting period before any non-accidental illness is eligible for claim coverage",
    section: "waiting_periods",
  },
  waiting_period_preexisting: {
    title: "Pre-Existing Diseases Waiting Period",
    description: "Waiting period required before pre-existing conditions and ailments are covered",
    section: "waiting_periods",
  },
  waiting_period_specific: {
    title: "Specific Illnesses Waiting Period",
    description: "Waiting period for listed conditions like cataract, hernia, joint replacement, etc.",
    section: "waiting_periods",
  },
  room_rent_cap: {
    title: "Room Rent Cap",
    description: "Daily room rent limit or percentage of total sum insured allowed without proportionate deduction",
    section: "coverage_limits",
  },
  copay: {
    title: "Co-Payment",
    description: "Percentage of the admissible claim amount that the insured member must bear out-of-pocket",
    section: "coverage_limits",
  },
  sub_limits: {
    title: "Treatment Sub-Limits",
    description: "Specific monetary caps on particular treatments, procedures, or robotic surgeries",
    section: "coverage_limits",
  },
  exclusions: {
    title: "Permanent Exclusions",
    description: "Treatments, procedures, or conditions that are permanently excluded from policy coverage",
    section: "exclusions",
  },
  claim_conditions: {
    title: "Claim Conditions & Intimation",
    description: "Mandatory timelines for hospital intimation, document submission, and cashless claims",
    section: "claims",
  },
};

export const FIELD_SECTIONS = [
  {
    id: "waiting_periods",
    title: "Waiting Periods",
    description: "Mandatory waiting durations before non-accidental illness coverage begins",
    fields: ["waiting_period_initial", "waiting_period_preexisting", "waiting_period_specific"],
  },
  {
    id: "coverage_limits",
    title: "Coverage Limits",
    description: "Daily room caps, patient co-payments, and procedure sub-limits",
    fields: ["room_rent_cap", "copay", "sub_limits"],
  },
  {
    id: "exclusions",
    title: "Exclusions",
    description: "Medical conditions, treatments, and procedures permanently excluded",
    fields: ["exclusions"],
  },
  {
    id: "claims",
    title: "Claims",
    description: "Hospital intimation windows, claims processing, and documentation rules",
    fields: ["claim_conditions"],
  },
];
