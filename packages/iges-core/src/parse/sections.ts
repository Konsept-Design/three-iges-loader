import type { SectionId } from "../types.js";
import { IGESParseError } from "../errors.js";

export interface RawSections {
  start: string;
  global: string;
  directory: string;
  parameter: string;
  terminate: string;
}

const SECTION_COLUMN = 72;

/**
 * Split file text into IGES sections (S, G, D, P, T).
 * Each physical line must be at least 73 characters for a valid section marker.
 */
export function splitSections(fileText: string): RawSections {
  const sections: RawSections = {
    start: "",
    global: "",
    directory: "",
    parameter: "",
    terminate: "",
  };

  const lines = fileText.split(/\r?\n/).filter((line) => line.length > 0);

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex] ?? "";
    if (line.length < 73) {
      continue;
    }

    const sectionChar = line[SECTION_COLUMN];
    if (!sectionChar) continue;

    const section = normalizeSectionId(sectionChar, line);
    if (!section) {
      continue;
    }

    const payload = line.slice(0, 80);

    switch (section) {
      case "S":
        sections.start += payload.slice(0, 72).trimEnd();
        break;
      case "G":
        sections.global += payload.slice(0, 72).trimEnd();
        break;
      case "D":
        sections.directory += payload;
        break;
      case "P":
        sections.parameter += payload.slice(0, 64);
        break;
      case "T":
        sections.terminate += payload.slice(0, 72).trimEnd();
        break;
    }
  }

  if (!sections.terminate) {
    throw new IGESParseError("Missing Terminate (T) section", { code: "MISSING_TERMINATE" });
  }

  return sections;
}

function normalizeSectionId(char: string, line: string): SectionId | null {
  if (char === "S" || char === "G" || char === "D" || char === "P" || char === "T") {
    return char;
  }

  // Some legacy files pad section markers (e.g. "  D      1")
  const tail = line.slice(SECTION_COLUMN).trim();
  const match = tail.match(/^([SGDPT])/);
  if (match?.[1]) {
    return match[1] as SectionId;
  }

  return null;
}

/**
 * Parse Terminate (T) section counts.
 *
 * IGES 5.3 packs four 8-column fields in columns 1–32:
 * `S`/`G`/`D`/`P` + a 7-character (often zero-padded) line count.
 * Example: `S0000001G0000004D0000012P0000006`
 */
export function parseTerminateSection(text: string): {
  startLineCount: number;
  globalLineCount: number;
  directoryLineCount: number;
  parameterLineCount: number;
} {
  return {
    startLineCount: parseTerminateCountField(text, 0),
    globalLineCount: parseTerminateCountField(text, 8),
    directoryLineCount: parseTerminateCountField(text, 16),
    parameterLineCount: parseTerminateCountField(text, 24),
  };
}

function parseTerminateCountField(text: string, offset: number): number {
  const field = text.slice(offset, offset + 8);
  if (field.length === 0) return 0;
  // Skip the section letter when present (S/G/D/P); accept digit-only legacy fields.
  const digits = /^[SGDP]/i.test(field) ? field.slice(1) : field;
  const value = parseInt(digits.trim(), 10);
  return Number.isFinite(value) ? value : 0;
}
