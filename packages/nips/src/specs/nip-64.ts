// Owner: spec author r4 (NIPs 60–79). NIP-64: Chess (Portable Game Notation).
import type { NipSpec } from "../spec.ts";

const FISCHER_SPASSKY = [
  '[Event "F/S Return Match"]',
  '[Site "Belgrade, Serbia JUG"]',
  '[Date "1992.11.04"]',
  '[Round "29"]',
  '[White "Fischer, Robert J."]',
  '[Black "Spassky, Boris V."]',
  '[Result "1/2-1/2"]',
  "",
  "1. e4 e5 2. Nf3 Nc6 3. Bb5 {This opening is called the Ruy Lopez.} 3... a6",
  "4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7",
  "11. c4 c6 12. cxb5 axb5 13. Nc3 Bb7 14. Bg5 b4 15. Nb1 h6 16. Bh4 c5 17. dxe5",
  "Nxe4 18. Bxe7 Qxe7 19. exd6 Qf6 20. Nbd2 Nxd6 21. Nc4 Nxc4 22. Bxc4 Nb6",
  "23. Ne5 Rae8 24. Bxf7+ Rxf7 25. Nxf7 Rxe1+ 26. Qxe1 Kxf7 27. Qe3 Qg5 28. Qxg5",
  "hxg5 29. b3 Ke6 30. a3 Kd6 31. axb4 cxb4 32. Ra5 Nd5 33. f3 Bc8 34. Kf2 Bf5",
  "35. Ra7 g6 36. Ra6+ Kc5 37. Ke1 Nf4 38. g3 Nxh3 39. Kd2 Kb5 40. Rd6 Kc5 41. Ra6",
  "Nf2 42. g4 Bd3 43. Re6 1/2-1/2",
].join("\n");

export const nip64: NipSpec = {
  nip: "64",
  variant: "event",
  howItWorks: [
    {
      id: "pgn",
      title: "how.pgn.title",
      body: "how.pgn.body",
      focus: { part: { kind: "event", id: "game" }, path: ["content"] },
    },
    { id: "formats", title: "how.formats.title", body: "how.formats.body" },
    {
      id: "alt",
      title: "how.alt.title",
      body: "how.alt.body",
      focus: { part: { kind: "event", id: "game" }, path: ["tags", 0] },
    },
    { id: "validate", title: "how.validate.title", body: "how.validate.body" },
  ],
  related: [
    { nip: "31", relation: "see-also", explain: "related.31" },
    { nip: "01", relation: "depends-on" },
  ],
  events: [
    {
      id: "game",
      label: "game.label",
      explain: "game.explain",
      kinds: [64],
      content: { format: "text", explain: "game.content", required: true, multiline: true },
      tags: [
        {
          name: "alt",
          explain: "game.tag.alt",
          presence: "recommended",
          repeatable: false,
          fields: [{ name: "summary", type: { type: "text" }, explain: "game.tag.alt.summary" }],
        },
      ],
      examples: [
        {
          id: "opening",
          label: "game.example.opening.label",
          explain: "game.example.opening.explain",
          signer: "bob",
          template: {
            kind: 64,
            tags: [["alt", "Chess game in progress: 1. e4"]],
            content: "1. e4 *",
          },
        },
        {
          id: "ruy-lopez",
          label: "game.example.ruy.label",
          explain: "game.example.ruy.explain",
          template: {
            kind: 64,
            tags: [["alt", "Chess: Fischer vs. Spassky, opening moves (Ruy Lopez)"]],
            content:
              '[White "Fischer, Robert J."]\n[Black "Spassky, Boris V."]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 {This opening is called the Ruy Lopez.} *',
          },
        },
        {
          id: "full-game",
          label: "game.example.full.label",
          explain: "game.example.full.explain",
          template: {
            kind: 64,
            tags: [
              ["alt", "Fischer vs. Spassky in Belgrade on 1992-11-04 (F/S Return Match, Round 29)"],
            ],
            content: FISCHER_SPASSKY,
          },
        },
      ],
    },
  ],
};
