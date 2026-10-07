status: approved

# Button

Triggers an action. Never used for navigation; that is a link.

## Variants

| Class | Use | Per screen |
|---|---|---|
| `btn--primary` | The one action the screen exists for | At most one |
| `btn--secondary` | Alternatives next to a primary | Any |
| `btn--ghost` | Low-emphasis actions inside dense UI | Any |
| `btn--danger` | Destructive actions; always behind a confirmation | At most one |

## States

Default, hover, focus-visible (2px primary outline, 2px offset), disabled (50% opacity, `aria-disabled` when the button must stay focusable), loading (text replaced by "…", `aria-busy="true"`).

## Accessibility

- Always `type="button"` unless submitting a form.
- Label is a verb phrase; icon-only buttons carry `aria-label`.
- Minimum target 40×40px.

## Do

- Put the primary button last in a row (reading order ends on the main action).

## Don't

- Don't stack two primary buttons.
- Don't change the label on hover.
