import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

// Returns an array of page texts. pages[0] = page 1.
export async function pdfToPages(buffer) {
  const pages = [];
  const uint8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  await pdf(uint8, {
    pagerender: async (pageData) => {
      const tc = await pageData.getTextContent();
      const text = tc.items.map((i) => i.str).join(" ");
      pages.push(text);
      return text;
    },
  });
  return pages;
}
