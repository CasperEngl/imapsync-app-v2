import * as v from "valibot";
import { TransferState, type TransferWithState } from "~/renderer/schemas.js";
import { idGenerator } from "~/renderer/utils/id.js";

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let currentValue = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === "\"") {
      if (i + 1 < line.length && line[i + 1] === "\"") {
        // Handle escaped quotes
        currentValue += "\"";
        i++; // Skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      // End of field
      values.push(currentValue);
      currentValue = "";
    } else {
      currentValue += char;
    }
  }

  // Push the last value
  values.push(currentValue);

  return values;
}

export function convertCsvToTransfers(csvText: string): TransferWithState[] {
  const lines = csvText.split("\n").filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error("CSV file must contain headers and at least one transfer");
  }

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line).map((value, index) => {
      if (index > 5) {
        return v.parse(TransferState, JSON.parse(value));
      }

      return value.trim();
    });

    const [
      sourceHost,
      sourceUser,
      sourcePassword,
      destinationHost,
      destinationUser,
      destinationPassword,
      state,
    ] = v.parse(
      v.tuple([
        v.string(),
        v.string(),
        v.string(),
        v.string(),
        v.string(),
        v.string(),
        v.nullish(TransferState),
      ]),
      values,
    );

    return {
      id: state?.id || idGenerator(),
      status: state?.status || "idle",
      error: state?.error || null,
      createdAt: state?.createdAt || Date.now(),
      outputs: state?.outputs || [],
      source: {
        host: sourceHost || "",
        user: sourceUser || "",
        password: sourcePassword || "",
      },
      destination: {
        host: destinationHost || "",
        user: destinationUser || "",
        password: destinationPassword || "",
      },
    };
  });
}
