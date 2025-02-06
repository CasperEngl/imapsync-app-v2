import { describe, expect, it } from "vitest";

import { convertCsvToTransfers } from "~/renderer/utils/convert-csv-to-transfers.js";

const TEST_CSV = `source_host,source_user,source_password,destination_host,destination_user,destination_password
test1.lamiral.info,test1,secret1,test2.lamiral.info,test2,secret2
test1.lamiral.info,test1,secret1,test2.lamiral.info,test2,secret2`;

describe("convertCsvToTransfers", () => {
  it("converts valid CSV to transfers", () => {
    const transfers = convertCsvToTransfers(TEST_CSV);

    expect(transfers).toHaveLength(2);
    expect(transfers[0]).toMatchObject({
      source: {
        host: "test1.lamiral.info",
        user: "test1",
        password: "secret1",
      },
      destination: {
        host: "test2.lamiral.info",
        user: "test2",
        password: "secret2",
      },
    });

    // Verify generated fields
    expect(transfers[0]?.id).toBeDefined();
    expect(transfers[0]?.createdAt).toBeDefined();
    expect(transfers[0]?.outputs).toEqual([]);
  });

  it("throws error for empty CSV", () => {
    expect(() => convertCsvToTransfers("")).toThrow(
      "CSV file must contain headers and at least one transfer",
    );
  });

  it("throws error for CSV with only headers", () => {
    expect(() =>
      convertCsvToTransfers(
        "source_host,source_user,source_password,destination_host,destination_user,destination_password",
      ),
    ).toThrow("CSV file must contain headers and at least one transfer");
  });

  it("preserves existing state when provided", () => {
    const csvWithState = `source_host,source_user,source_password,destination_host,destination_user,destination_password,state
test1.lamiral.info,test1,secret1,test2.lamiral.info,test2,secret2,"{""id"":""test-id"",""status"":""syncing"",""error"":null,""createdAt"":1234567890,""outputs"":[{""id"":""output-1"",""content"":""test output"",""isError"":false,""timestamp"":1234567890}]}"`;

    const transfers = convertCsvToTransfers(csvWithState);

    expect(transfers[0]).toMatchObject({
      id: "test-id",
      status: "syncing",
      error: null,
      createdAt: 1234567890,
      outputs: [
        {
          content: "test output",
          isError: false,
          timestamp: 1234567890,
        },
      ],
      source: {
        host: "test1.lamiral.info",
        user: "test1",
        password: "secret1",
      },
      destination: {
        host: "test2.lamiral.info",
        user: "test2",
        password: "secret2",
      },
    });
  });

  it("handles empty fields gracefully", () => {
    const csvWithEmptyFields = `source_host,source_user,source_password,destination_host,destination_user,destination_password
,test1,,test2.lamiral.info,test2,`;

    const transfers = convertCsvToTransfers(csvWithEmptyFields);

    expect(transfers[0]).toMatchObject({
      source: {
        host: "",
        user: "test1",
        password: "",
      },
      destination: {
        host: "test2.lamiral.info",
        user: "test2",
        password: "",
      },
    });
  });
});
