---
name: planchest-interview
description: Build BRAND.md, DESIGN.md or CONTEXT.md from a conversation when there is no written material to organize. Asks a short series of questions one topic at a time, shows visual choices as rendered samples instead of describing them, and writes the answers into the repo in the format organize uses. Use when the user wants to define the brand, the design system or the product context by answering questions, or when organize found nothing to work from.
---

# Interview: build the design documents by asking

When nothing is written down, the design knowledge is in the user's head. This skill gets it out in a form the repo can hold. It fills the same files `planchest-organize` fills; what `planchest-organize` reads from material, `planchest-interview` reads from answers. Each topic has its own question script in this directory:

| Topic | Writes | Script |
|---|---|---|
| `context` | `CONTEXT.md` | `context.md` |
| `brand` | `BRAND.md`, logo files into `system/brand/` | `brand.md` |
| `design` | `DESIGN.md` front matter and sections, then `system/tokens/` | `design.md` |

The user names a topic (`/planchest:planchest-interview brand`) or you propose one. If more than one is needed, go in the order above: design questions are easier to answer once the audience and the voice are settled.

## How to ask

1. **Read what is there first.** Open the target file and the other two root documents. Skip questions the repo already answers and say which ones you skipped. If real material exists (a brand guide, a Figma export), stop and run `planchest-organize` instead; the interview is for what is not written down.
2. **Rounds of three to five questions.** One message per round, questions numbered, in the groups the script gives. Every question carries a default or an example answer, so "default" and "skip" are complete answers. Accept short answers; the user should never have to write prose.
3. **Show visual choices, do not describe them.** For colour, type, radius, density and layout frame, write a sample page to `.planchest/interview/<topic>.html` (self-contained HTML, two to four alternatives side by side, labelled A, B, C with one line each on what they imply), serve it with `planchest serve .planchest/interview`, and ask which. Build the sample from the answers so far: the user's primary colour on a button at each candidate radius, their body font at each candidate base size. Open it yourself if a browser tool is available, so you can refer to what is on screen. `.planchest/` is git-ignored; the sample is never committed.
4. **Reflect before writing.** After the last round, put the answers into the file's own structure and show them in one message. Ask for one confirmation for the whole file, not one per answer.
5. **Write.** Fill the file. Keep the placeholder comment of every section the user skipped. For `design`, also run step 3 of `planchest-organize` (derive tokens) so `tokens.json` and `tokens.css` match the front matter. For `brand`, copy any logo files the user gave into `system/brand/` and name them in the Logo section.
6. **Commit or open a PR** titled `Interview: <topic>`. End with the same **Missing** and **Needs your decision** lists `planchest-organize` ends with.

## Don't

- Don't ask every question at once. Five is the most a person answers well in one message.
- Don't invent an answer the user skipped. Leave the placeholder; it is honest and `planchest-organize` or a later interview can fill it.
- Don't ask what an agent decides better from the answers (the exact hex of a hover state, the line height of a caption). Derive it, show it in the sample, and let the user object.
- Don't ask about the product's domain in the `design` interview or about colours in the `context` interview. One topic per session keeps the user oriented.
