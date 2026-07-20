import { decodeHollerithToken, parseHollerith } from "./hollerith.js";
import type { ParamValue, PointerValue } from "../types.js";

/**
 * Split parameter data into records using the record delimiter,
 * respecting Hollerith strings.
 */
export function splitParameterRecords(data: string, recordDelimiter: string): string[] {
  const records: string[] = [];
  let current = "";
  let i = 0;

  while (i < data.length) {
    const hollerith = tryReadHollerithAt(data, i);
    if (hollerith) {
      current += hollerith.raw;
      i += hollerith.length;
      continue;
    }

    if (data.startsWith(recordDelimiter, i)) {
      if (current.trim().length > 0) {
        records.push(current.trim());
      }
      current = "";
      i += recordDelimiter.length;
      continue;
    }

    current += data[i];
    i += 1;
  }

  if (current.trim().length > 0) {
    records.push(current.trim());
  }

  return records;
}

function tryReadHollerithAt(data: string, start: number): { raw: string; length: number } | null {
  const hIndex = data.indexOf("H", start);
  if (hIndex <= start) return null;

  const countStr = data.slice(start, hIndex);
  if (!/^\d+$/.test(countStr)) return null;

  const count = parseInt(countStr, 10);
  const textStart = hIndex + 1;
  const textEnd = textStart + count;
  if (textEnd > data.length) return null;

  return {
    raw: data.slice(start, textEnd),
    length: textEnd - start,
  };
}

/**
 * Tokenize one parameter record into fields using the field delimiter.
 *
 * Empty fields are preserved (`,,foo` → `["", "", "foo"]`) so Global / PD
 * parameter indices stay aligned with the IGES spec.
 */
export function tokenizeFields(record: string, fieldDelimiter: string): string[] {
  const fields: string[] = [];
  let current = "";
  let i = 0;
  let endedWithDelimiter = false;

  while (i < record.length) {
    const hollerith = tryReadHollerithAt(record, i);
    if (hollerith) {
      if (current.length > 0) {
        fields.push(current);
        current = "";
      }
      fields.push(hollerith.raw);
      i += hollerith.length;
      // Hollerith tokens are complete fields; consume the trailing delimiter
      // without pushing an extra empty value.
      if (record.startsWith(fieldDelimiter, i)) {
        i += fieldDelimiter.length;
        endedWithDelimiter = true;
      } else {
        endedWithDelimiter = false;
      }
      continue;
    }

    if (record.startsWith(fieldDelimiter, i)) {
      fields.push(current);
      current = "";
      i += fieldDelimiter.length;
      endedWithDelimiter = true;
      continue;
    }

    current += record[i];
    i += 1;
    endedWithDelimiter = false;
  }

  if (current.length > 0 || endedWithDelimiter || fields.length === 0) {
    fields.push(current);
  }

  return fields;
}

/**
 * Convert string tokens to typed parameter values.
 * Pointer detection: integer tokens that match known DE sequences are still
 * returned as numbers here; callers use context for pointer fields.
 */
export function tokensToParamValues(tokens: string[]): ParamValue[] {
  return tokens.map((token) => {
    const trimmed = token.trim();
    if (trimmed.includes("H") && parseHollerith(trimmed) !== undefined) {
      return decodeHollerithToken(trimmed);
    }
    const asReal = trimmed.replace(/[Dd]/g, "e");
    if (/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(asReal)) {
      return parseFloat(asReal);
    }
    return trimmed;
  });
}

export function toPointer(deSequence: number): PointerValue {
  return { kind: "pointer", deSequence };
}
