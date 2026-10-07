# Interview script: design

Writes `DESIGN.md` (front matter and sections) and then derives `system/tokens/`. Ask in this order; render a sample page for every question marked **[sample]**, built from the answers so far. Each round is one message.

## Round 1. Personality and references

1. Three words for how the product should look and feel. Offer sets: "calm, dense, professional" · "warm, friendly, roomy" · "sharp, dark, technical" · "soft, playful, bright".
2. Two or three products whose look you admire, and one you want to avoid. What in each?
3. Platform and density: desktop web, mobile web, native mobile, several? Is it used for long sessions (favour density) or quick checks (favour size)?

→ Overview.

## Round 2. Colour

4. The primary colour, as hex if known. If not, **[sample]** six candidates applied to a button and a link on a white card; pick one or say "between B and C".
5. Neutrals: **[sample]** the same card with warm grey, cool grey and pure grey text and borders. Which?
6. Does the product need a dark theme now, later, or never? (Default: later; the template keeps `themes/dark.css` as a placeholder.)
7. State colours: default green, amber, red, or brand-specific ones? Any colour that carries domain meaning (zones, categories, severities)?

→ `colors` in the front matter; Colors section.

## Round 3. Type

8. Is there a brand typeface, and is it licensed for the web? Path or name. (Default: system sans; the template's `font-sans` stack.)
9. **[sample]** body text at 14 px and 16 px, on the same card, with the chosen face. Which base size?
10. Headings: same face as body or a second face? Tight and heavy, or light and roomy? **[sample]** two versions.
11. Numbers: do they matter enough for tabular figures or a separate numeric face? (Default: no.)

→ `typography`; Typography section.

## Round 4. Shape and depth

12. **[sample]** the primary button and an input at radius 0, 4, 8, 16 and pill, with the chosen colour and face. Which, and should buttons and inputs differ?
13. **[sample]** cards separated by a border, by a soft shadow, and by background tone alone. Which?
14. Icon style: outline, filled, two-tone? Any icon set already in use?

→ `rounded`; Shapes; Elevation & Depth.

## Round 5. Layout

15. How is a page framed: sidebar, top navigation, tab bar, none? **[sample]** two frames at the chosen platform width.
16. Spacing unit 4 px or 8 px? (Default: 4.) Maximum line length for reading text? (Default: 72 characters.)
17. Breakpoints the product must handle, if any beyond phone and desktop.

→ `spacing`; Layout section.

## Round 6. Components and motion

18. Button height and input height. (Default: 40 px each; 48 px for touch-first products.)
19. Which states must every interactive element have: hover, focus, active, disabled, loading, error? (Default: all six.) How is focus shown?
20. Motion: none, subtle (fades and 150 ms slides), or expressive? (Default: subtle.)

→ `components`; Components section.

## Round 7. Do's and don'ts

21. Three things you never want to see in this product's screens (modals for primary flows, colour as the only signal, centred body text…).
22. Three things every screen should do.

→ Do's and Don'ts.

After the confirmation: derive `tokens.json` and `tokens.css` (step 3 of `organize`) and update `system/components/button/` to the chosen height, radius and colours, since the template's button is the one component every prototype starts from.
