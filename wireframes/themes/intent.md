# themes — as-is intent

## Covers

The `themes` kind viewer that this harness declares (`visualisers` id `themes`, Tool `theme-viewer`). It covers the platform's own themes and every `themes` directory that an instance in the checkout declares. The tools layer's `render-theme-sheet.ts --viz` (script `theme:viz`) draws it, and writes one page at `<locale>/cat-harness/themes/`. The route key is the one `index.json` records for this wireframe.

### How this was drawn

Drawn from the page that `theme:viz` writes in a checkout of the index, with the pull request that adds the viewer overlaid. That run reported 18 themes: 14 from the platform, and 4 declared by 2 instances. The instances are drawn as `<instance-a>` and `<instance-b>`, so this layer names no layer above it. The theme rows are abridged to one row of each shape: a theme with no backdrop, and a theme with art in three layouts.

## Who it is for, and what they need to do

- **Readers:** a theme author, a designer reviewing a crop, or a reviewer of a theme change.
- **Tasks:**
  - see every theme in the checkout, grouped by who declares it
  - read a theme's palette and the measured contrast of its ink over its scrim
  - look at each layout's art with its text and avatar regions drawn on it, and judge whether the box is on the subject

## What it must show

1. The total count of themes, split between the platform and the declaring instances.
2. One section for the platform, and one per declaring instance.
3. Per theme: its title, id and kind, its description, which instance wears it, the four palette swatches with their hex values, the contrast verdict (or "no backdrop"), and a sample sticky.
4. Per layout with art (laptop, mobile, card): the art at its pixel size, with the `textRegion` and `avatarRegion` boxes drawn over it, and the avatar clip at 46 px.
5. A key that says which colour is which region.

## Findings

1. **A theme with no backdrop still spends a full row on the art columns.** The cell spans all three layouts only to say "declares no backdrop", and on a phone that line sits below the sample sticky.
2. **The region colours are the only key.** The key below each table names blue and pink, and the boxes carry the region name only as a `title` tooltip, which a touch screen does not show.
