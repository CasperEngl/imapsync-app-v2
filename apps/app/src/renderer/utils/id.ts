import { customAlphabet } from "nanoid";

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const idLength = 10;
export const idGenerator = customAlphabet(alphabet, idLength);
