/** The committed snapshot, validated once at import (written by scripts/snapshot-ecosystem.ts). */
import raw from "../../../data/ecosystem.json";
import { parseEcosystem } from "./schema.ts";

export const ECOSYSTEM = parseEcosystem(raw);
