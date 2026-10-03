// Owner: diagrams agent. Adding a key here? Also add it to ../es/diagrams.ts (English placeholder + `// TODO(es)`).
export const diagrams = {
  sequence: {
    from: "From {from} to {to}",
    empty: "No messages yet",
    start: "Ready. Press play or step forward to send the first message.",
    number: "#",
    message: "Message",
    fromHeader: "From",
    toHeader: "To",
  },
  pipeline: {
    stage: "Stage {n}: {name}",
    error: "Failed at {name}",
    done: "All stages complete.",
    idle: "Not started yet.",
    expand: "Show full value",
    collapse: "Show less",
    output: "Output",
  },
  graph: {
    node: "{name}, follows {following}, followed by {followers}",
    select: "Select a person",
    cleared: "Selection cleared.",
    help: "Use arrow keys to move between people, Enter to select, Escape to clear. Drag to rearrange.",
    person: "Person",
    follows: "Follows",
    followedBy: "Followed by",
    none: "Nobody",
  },
  swimlane: {
    lane: "Lane",
    step: "Step {n}",
    arrow: "{from} to {to}",
  },
  packet: {
    label: "{type} message",
  },
  common: {
    textVersion: "Text version",
    invalid: "This diagram could not be drawn ({code}): {message}",
  },
};
