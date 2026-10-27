import fs from 'fs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { pdfToPages } from './src/pdf.js';

async function generateSamplePolicy() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pagesData = [
    {
      title: "STAR HEALTH & ALLIED INSURANCE - POLICY SCHEDULE",
      subtitle: "Comprehensive Health Insurance Policy Wording (Page 1)",
      sections: [
        {
          heading: "1. Policy Summary & Scope of Cover",
          text: "This Policy document constitutes the legal contract between Star Health and the Insured Person. In consideration of the premium paid, the Company agrees to pay or reimburse medical expenses incurred for inpatient hospitalization during the policy period subject to policy terms, conditions, sub-limits, and exclusions outlined herein."
        },
        {
          heading: "2. Initial Waiting Period (Section 3.1)",
          text: "A waiting period of thirty (30) days from the inception date of this Policy shall apply to all medical and surgical treatments, except in case of accidental bodily injury occurring during the policy period. No claims for sickness or illness diagnosed within the initial 30 days shall be admissible under any circumstances."
        },
        {
          heading: "3. Pre-Existing Diseases Waiting Period (Section 3.2)",
          text: "Pre-Existing Diseases and their direct complications shall not be covered until 36 continuous months of health insurance coverage have elapsed since the inception of the first policy with us. Covered ailments diagnosed prior to inception shall remain uninsurable during this 3-year moratorium."
        }
      ]
    },
    {
      title: "TERMS AND CONDITIONS - SPECIFIC WAITING PERIODS & LIMITS",
      subtitle: "Policy Document Terms (Page 2)",
      sections: [
        {
          heading: "4. Specific Illnesses Waiting Period (Section 3.3)",
          text: "The expenses on treatment of the following specified illnesses and procedures: cataract, hernia, hydrocele, joint replacement surgery, and calculus diseases shall be payable only after a waiting period of 24 months of continuous coverage under this policy."
        },
        {
          heading: "5. Room Rent Cap and Boarding (Section 4.1)",
          text: "Daily Room Rent, boarding and nursing expenses up to 1% of Sum Insured subject to a maximum of Single Private AC Room per day. If higher category room is occupied, proportionate deductions will apply to associated medical expenses."
        },
        {
          heading: "6. Co-Payment Conditions (Section 4.2)",
          text: "A co-payment of 10% shall apply to each and every admissible claim if the insured person is aged 60 years or above at the time of claim intimation. For members below 60 years of age, zero co-payment shall apply for network hospitals."
        }
      ]
    },
    {
      title: "EXCLUSIONS AND CLAIMS PROCEDURE",
      subtitle: "Policy Document Terms (Page 3)",
      sections: [
        {
          heading: "7. Specific Treatment Sub-Limits (Section 5.1)",
          text: "Expenses related to Cataract surgery shall be capped at Rs. 40,000 per eye. Robotic / Cyberknife surgeries are covered up to a sub-limit of 50% of the total Sum Insured."
        },
        {
          heading: "8. Permanent Exclusions (Section 6)",
          text: "The following conditions are permanently excluded: treatment for alcoholism, drug abuse, self-inflicted injury, aesthetic or cosmetic treatments, weight reduction surgeries, and hazardous sports unless explicitly endorsed in writing."
        },
        {
          heading: "9. Claim Conditions and Deadlines (Section 7)",
          text: "In case of planned hospitalization, the Company must be intimating at least 48 hours prior to admission. In case of emergency hospitalization, intimation must be given within 24 hours of admission. Complete claim documents must be submitted within 30 days of discharge."
        }
      ]
    }
  ];

  for (const p of pagesData) {
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    let y = height - 50;

    // Header
    page.drawText(p.title, {
      x: 50,
      y,
      size: 13,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.2),
    });
    y -= 18;

    page.drawText(p.subtitle, {
      x: 50,
      y,
      size: 9,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 30;

    // Sections
    for (const sec of p.sections) {
      page.drawText(sec.heading, {
        x: 50,
        y,
        size: 11,
        font: boldFont,
        color: rgb(0.15, 0.25, 0.5),
      });
      y -= 18;

      // Word wrap text
      const words = sec.text.split(" ");
      let currentLine = "";
      const maxWidth = width - 100;

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, 10);
        if (testWidth > maxWidth) {
          page.drawText(currentLine, {
            x: 50,
            y,
            size: 10,
            font,
            color: rgb(0.2, 0.2, 0.2),
          });
          y -= 14;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        page.drawText(currentLine, {
          x: 50,
          y,
          size: 10,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
        y -= 25;
      }
    }
  }

  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  fs.writeFileSync('sample_policy.pdf', pdfBytes);
  // Also copy to client/public so user can download it from the browser UI if they want
  if (!fs.existsSync('client/public')) {
    fs.mkdirSync('client/public', { recursive: true });
  }
  fs.writeFileSync('client/public/sample_policy.pdf', pdfBytes);

  console.log(`Successfully generated sample_policy.pdf (${pdfBytes.length} bytes)`);

  // Verify extraction with pdfToPages
  const pages = await pdfToPages(Buffer.from(pdfBytes));
  console.log(`Verified with pdfToPages: ${pages.length} pages extracted.`);
  console.log(`Total text length: ${pages.join("").length} characters.`);
  pages.forEach((txt, idx) => {
    console.log(`Page ${idx + 1} character count: ${txt.length}`);
  });
}

generateSamplePolicy().catch(console.error);
