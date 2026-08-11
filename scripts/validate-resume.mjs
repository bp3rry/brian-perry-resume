import { readFile } from "node:fs/promises";
import { schema } from "@jsonresume/schema";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const resume = JSON.parse(await readFile(new URL("../resume.json", import.meta.url), "utf8"));
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

if (!validate(resume)) {
  console.error(ajv.errorsText(validate.errors, { separator: "\n" }));
  process.exitCode = 1;
} else {
  console.log("resume.json is valid JSON Resume data.");
}
