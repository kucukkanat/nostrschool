/** Turns the chapter's quiz dictionary into Quiz props; the correct option per question lives here, not in i18n. */
import type { Dictionary } from "@nostrschool/i18n";
import type { QuizOption } from "@nostrschool/ui";

type QuizDict = Dictionary["chapters"]["ch08"]["quiz"];
type QuestionId = "q1" | "q2" | "q3";
type OptionId = "a" | "b" | "c";

const ANSWERS: Readonly<Record<QuestionId, OptionId>> = { q1: "b", q2: "c", q3: "a" };
const OPTION_IDS: readonly OptionId[] = ["a", "b", "c"];

export interface QuizQuestion {
  readonly id: QuestionId;
  readonly question: string;
  readonly options: readonly QuizOption[];
}

export const quizQuestions = (t: QuizDict): readonly QuizQuestion[] =>
  (Object.keys(ANSWERS) as QuestionId[]).map((id) => {
    const q = t[id];
    return {
      id,
      question: q.question,
      options: OPTION_IDS.map((o) => ({
        id: o,
        label: q[o],
        correct: ANSWERS[id] === o,
        explanation: q[`${o}Explain`],
      })),
    };
  });
