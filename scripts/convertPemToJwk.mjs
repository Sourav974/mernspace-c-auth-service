import fs from "fs";
import rsaPemToJwk from "rsa-pem-to-jwk";

const privateKey = fs.readFileSync("./certs/private.pem");

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
const jwk = rsaPemToJwk(privateKey, { use: "sig" }, "public");

// eslint-disable-next-line no-console, no-undef
console.log(jwk);
