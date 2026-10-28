import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { pdfToPages } from '../src/pdf.js';

async function createPdfFromSections(pagesData, outputPath) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (const p of pagesData) {
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    let y = height - 50;

    // Header
    page.drawText(p.title, {
      x: 50,
      y,
      size: 12,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.2),
    });
    y -= 16;

    page.drawText(p.subtitle, {
      x: 50,
      y,
      size: 9,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 26;

    // Sections
    for (const sec of p.sections) {
      page.drawText(sec.heading, {
        x: 50,
        y,
        size: 10,
        font: boldFont,
        color: rgb(0.15, 0.25, 0.5),
      });
      y -= 15;

      const words = sec.text.split(" ");
      let currentLine = "";
      const maxWidth = width - 100;

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, 9.5);
        if (testWidth > maxWidth) {
          page.drawText(currentLine, {
            x: 50,
            y,
            size: 9.5,
            font,
            color: rgb(0.2, 0.2, 0.2),
          });
          y -= 13;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        page.drawText(currentLine, {
          x: 50,
          y,
          size: 9.5,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
        y -= 20;
      }
    }
  }

  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`Generated ${outputPath} (${pdfBytes.length} bytes, ${pagesData.length} pages)`);
}

async function run() {
  const evalDir = 'eval/policies';
  if (!fs.existsSync(evalDir)) {
    fs.mkdirSync(evalDir, { recursive: true });
  }

  // 1 & 2: Copy SecureLife and MediCare Plus
  if (fs.existsSync('sample-policies/SecureLife_Health_Shield_Sample.pdf')) {
    fs.copyFileSync('sample-policies/SecureLife_Health_Shield_Sample.pdf', path.join(evalDir, 'SecureLife_Health_Shield_Sample.pdf'));
  }
  if (fs.existsSync('sample-policies/MediCare_Plus_Sample.pdf')) {
    fs.copyFileSync('sample-policies/MediCare_Plus_Sample.pdf', path.join(evalDir, 'MediCare_Plus_Sample.pdf'));
  }

  // 3. Star Comprehensive Health Policy (4 pages, rich clauses)
  const starPages = [
    {
      title: "STAR HEALTH INSURANCE - COMPREHENSIVE POLICY WORDING",
      subtitle: "Policy Schedule & Operative Clauses (Page 1)",
      sections: [
        {
          heading: "Section 1: Operative Clause & Indemnity Scope",
          text: "The company hereby agrees subject to terms, conditions and exclusions herein contained to indemnify the insured person in respect of medically necessary hospitalization expenses incurred up to the Sum Insured stated in the policy schedule."
        },
        {
          heading: "Section 2.1: Initial Waiting Period",
          text: "A waiting period of thirty (30) days from the commencement date of the policy shall apply to all medical and surgical treatments, except in case of accidental bodily injury occurring during the policy period. No claim shall be payable for any illness diagnosed within 30 days."
        },
        {
          heading: "Section 2.2: Pre-Existing Diseases Waiting Period",
          text: "Pre-Existing Diseases and their direct complications shall not be covered until thirty-six (36) continuous months of coverage have elapsed since the inception of the first policy. Declared conditions prior to inception remain inadmissible during this 3-year period."
        }
      ]
    },
    {
      title: "STAR HEALTH INSURANCE - COMPREHENSIVE POLICY WORDING",
      subtitle: "Waiting Periods and Room Rent Limits (Page 2)",
      sections: [
        {
          heading: "Section 2.3: Specific Illnesses Waiting Period",
          text: "Expenses on treatment of the following specified ailments: cataract, benign prostatic hypertrophy, hernia, hydrocele, joint replacement surgeries, and calculus diseases are subject to a mandatory 24-month waiting period from initial inception."
        },
        {
          heading: "Section 3.1: Room Rent, Boarding and Nursing Charges",
          text: "Room Rent, boarding and nursing expenses are covered up to 1% of Sum Insured per day, subject to a maximum of Single Private A/C Room. If insured chooses a room category higher than eligibility, proportionate deductions shall apply on associated medical charges."
        },
        {
          heading: "Section 3.2: Co-Payment Provisions",
          text: "A co-payment of 10% shall apply to each and every admissible claim if the insured person is aged 60 years or above at the time of claim intimation. For insured members aged below 60, zero co-payment shall apply."
        }
      ]
    },
    {
      title: "STAR HEALTH INSURANCE - COMPREHENSIVE POLICY WORDING",
      subtitle: "Specific Sub-Limits and Treatment Caps (Page 3)",
      sections: [
        {
          heading: "Section 4.1: Cataract and Specific Procedure Sub-Limits",
          text: "Expenses incurred for Cataract surgery shall be capped at Rs. 35,000 per eye. Robotic / Cyberknife surgeries are covered up to a sub-limit of 50% of the total Sum Insured."
        },
        {
          heading: "Section 4.2: Day Care Procedures",
          text: "All day care procedures requiring less than 24 hours of hospitalization due to technological advancements are covered up to the Sum Insured."
        }
      ]
    },
    {
      title: "STAR HEALTH INSURANCE - COMPREHENSIVE POLICY WORDING",
      subtitle: "General Exclusions and Claims Procedure (Page 4)",
      sections: [
        {
          heading: "Section 5: Permanent Exclusions",
          text: "The following conditions are permanently excluded: treatment for alcoholism, drug addiction, intentional self-injury, aesthetic or cosmetic treatments, obesity/weight management surgeries, and hazardous sports unless expressly endorsed in writing."
        },
        {
          heading: "Section 6: Claim Intimation and Document Submission",
          text: "In case of planned hospitalization, the Company must be intimating at least 48 hours prior to admission. In case of emergency hospitalization, intimation must be given within 24 hours of admission. Complete claim documents must be submitted within 30 days of discharge."
        }
      ]
    }
  ];
  await createPdfFromSections(starPages, path.join(evalDir, 'Star_Comprehensive_Health_Policy.pdf'));

  // 4. HDFC ERGO Optima Restore Policy (3 pages)
  const hdfcPages = [
    {
      title: "HDFC ERGO GENERAL INSURANCE - OPTIMA RESTORE",
      subtitle: "Individual Health Insurance Policy Wording (Page 1)",
      sections: [
        {
          heading: "1. Coverage Terms & Inpatient Benefit",
          text: "If an Insured Person suffers an Illness or Injury during the Policy Period that requires Hospitalization on an inpatient basis, We will pay the Medically Necessary expenses incurred up to the Sum Insured specified in the Schedule."
        },
        {
          heading: "2. Initial 30-Day Waiting Period",
          text: "A waiting period of 30 days shall apply to all medical treatments, except in case of accidental injury occurring during the policy period. Sickness diagnosed within the first thirty days is excluded."
        },
        {
          heading: "3. Waiting Period for Pre-Existing Conditions",
          text: "Pre-existing diseases and their complications will be covered after a waiting period of 36 continuous months under this Policy. Pre-existing conditions diagnosed prior to continuous coverage are not payable during the first 36 months."
        }
      ]
    },
    {
      title: "HDFC ERGO GENERAL INSURANCE - OPTIMA RESTORE",
      subtitle: "Policy Benefit Schedule & Room Rent Terms (Page 2)",
      sections: [
        {
          heading: "4. Specific Disease Waiting Period (2 Years)",
          text: "A waiting period of 24 months of continuous coverage applies for specific illnesses: cataract, hernia, hydrocele, joint replacement surgery, and gall stones."
        },
        {
          heading: "5. Room Rent and Boarding Expenses",
          text: "There is no cap or sub-limit on Room Rent. The insured person is entitled to any room category of choice without any proportionate deduction on associated medical expenses."
        },
        {
          heading: "6. Co-Payment Terms",
          text: "No co-payment condition applies under this policy. The company reimburses 100% of all admissible claim expenses subject to the total Sum Insured."
        }
      ]
    },
    {
      title: "HDFC ERGO GENERAL INSURANCE - OPTIMA RESTORE",
      subtitle: "Sub-Limits, Exclusions and Claims (Page 3)",
      sections: [
        {
          heading: "7. Sub-Limits on Treatments",
          text: "Cataract surgery is subject to a monetary sub-limit of Rs. 40,000 per eye. Cyberknife treatments are covered up to a sub-limit of 50% of Sum Insured."
        },
        {
          heading: "8. Permanent Exclusions",
          text: "The following conditions are permanently excluded: treatment for alcoholism, drug abuse, self-inflicted injury, aesthetic or cosmetic treatments, weight reduction surgeries, and hazardous sports unless explicitly endorsed in writing."
        },
        {
          heading: "9. Claim Conditions and Deadlines",
          text: "In case of planned hospitalization, the Company must be intimating at least 48 hours prior to admission. In case of emergency hospitalization, intimation must be given within 24 hours of admission. Complete claim documents must be submitted within 30 days of discharge."
        }
      ]
    }
  ];
  await createPdfFromSections(hdfcPages, path.join(evalDir, 'HDFC_Ergo_Optima_Restore_Sample.pdf'));

  // 5. Large 14-Page Policy (Care Advantage Large Policy) to exercise chunking!
  const largePages = [];
  for (let i = 1; i <= 14; i++) {
    largePages.push({
      title: `CARE ADVANTAGE HEALTH POLICY WORDING - PART ${i}`,
      subtitle: `Official Master Policy Terms & Conditions (Page ${i} of 14)`,
      sections: [
        {
          heading: `Clause ${i}.1: Policy Administration & Definition of Terms`,
          text: `This section governs standard administrative procedures, renewal terms, portability guidelines, grace period allowances of 30 days, and legal jurisdiction applicable across territory of India under policy schedule page ${i}.`
        },
        ...(i === 2 ? [
          {
            heading: "Clause 2.1: Initial Waiting Period Provision",
            text: "A waiting period of thirty (30) days from the inception date of this Policy shall apply to all medical and surgical treatments, except in case of accidental bodily injury occurring during the policy period. No claims for sickness or illness diagnosed within the initial 30 days shall be admissible under any circumstances."
          }
        ] : []),
        ...(i === 4 ? [
          {
            heading: "Clause 4.2: Pre-Existing Disease Waiting Moratorium",
            text: "Pre-Existing Diseases and their direct complications shall not be covered until 36 continuous months of health insurance coverage have elapsed since the inception of the first policy with us. Covered ailments diagnosed prior to inception shall remain uninsurable during this 3-year moratorium."
          }
        ] : []),
        ...(i === 6 ? [
          {
            heading: "Clause 6.1: Specific Illnesses Waiting Period",
            text: "The expenses on treatment of the following specified illnesses and procedures: cataract, hernia, hydrocele, joint replacement surgery, and calculus diseases shall be payable only after a waiting period of 24 months of continuous coverage under this policy."
          }
        ] : []),
        ...(i === 8 ? [
          {
            heading: "Clause 8.1: Room Rent and ICU Charges",
            text: "Daily Room Rent, boarding and nursing expenses up to 1% of Sum Insured subject to a maximum of Single Private AC Room per day. If higher category room is occupied, proportionate deductions will apply to associated medical expenses."
          },
          {
            heading: "Clause 8.2: Co-Payment Structure",
            text: "A co-payment of 10% shall apply to each and every admissible claim if the insured person is aged 60 years or above at the time of claim intimation. For members below 60 years of age, zero co-payment shall apply for network hospitals."
          }
        ] : []),
        ...(i === 10 ? [
          {
            heading: "Clause 10.3: Treatment Sub-Limits",
            text: "Expenses related to Cataract surgery shall be capped at Rs. 40,000 per eye. Robotic / Cyberknife surgeries are covered up to a sub-limit of 50% of the total Sum Insured."
          }
        ] : []),
        ...(i === 12 ? [
          {
            heading: "Clause 12.1: General Permanent Exclusions",
            text: "The following conditions are permanently excluded: treatment for alcoholism, drug abuse, self-inflicted injury, aesthetic or cosmetic treatments, weight reduction surgeries, and hazardous sports unless explicitly endorsed in writing."
          }
        ] : []),
        ...(i === 14 ? [
          {
            heading: "Clause 14.2: Claims Procedure & Deadlines",
            text: "In case of planned hospitalization, the Company must be intimating at least 48 hours prior to admission. In case of emergency hospitalization, intimation must be given within 24 hours of admission. Complete claim documents must be submitted within 30 days of discharge."
          }
        ] : [])
      ]
    });
  }
  await createPdfFromSections(largePages, path.join(evalDir, 'Care_Advantage_Large_Policy.pdf'));

  // 6. Scanned / Low-text PDF (dummy.pdf)
  if (fs.existsSync('dummy.pdf')) {
    fs.copyFileSync('dummy.pdf', path.join(evalDir, 'Scanned_Doc_Sample.pdf'));
  }

  console.log("Evaluation test suite generated successfully in eval/policies/!");
}

run().catch(console.error);
