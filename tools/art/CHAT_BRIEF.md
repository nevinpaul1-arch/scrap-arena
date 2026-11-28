# Scrap Arena · car layer art brief

## Paste this into chat

> I'm attaching approved reference art for 8 cars from my game Scrap Arena, plus this brief. Please make the **layer images** described below, starting with **Cruiser #27 only**. Make every layer as an **edit of the same master image** so all layers line up pixel for pixel. Before you show me a car's set, run the alignment check in Python. Then send the files as one zip, named exactly as listed.

---

## What this is for

In the game, each car is built from separate layers so panels can fly off and be repaired. The references show the finished look. I need the same look split into layers that stack exactly on top of each other. A developer will scale, rotate and pack them into the game, so your job is only the art and its alignment.

## Rules for every image of a car

1. **Same canvas for every image of one car:** 1024 × 1536 px, portrait, PNG.
2. **Straight top-down view, nose pointing up.** The car's left side (the driver's side) is on the left of the image. No perspective and no tilt.
3. **Flat background of pure magenta `#FF00FF`.** No texture, gradient, floor or vignette.
4. **No drop shadow or ground shadow.** The game draws its own.
5. **The car fills about 80% of the canvas height, centred,** with clear magenta all round. Nothing touches the edges.
6. **Make the master first, then every other layer as an edit of that master.** Change only what the step asks for and keep every other pixel the same. Don't redraw, re-light, move or rescale the car between images.
7. Keep the look of the reference: the clay toy style with satin paint, soft bevels, dark readable glass, chunky tyres, and the livery and number exactly as approved.
8. Hard, clean edges against the magenta. No glow or halo.

## The 9 images per car

| # | File name | What it shows |
|---|---|---|
| 00 | `<car>_00_master.png` | The whole car, all parts on (the left car in the reference). |
| 01 | `<car>_01_chassis.png` | The master with **all 5 removable parts taken off** (see the parts table). Show what's revealed underneath, such as the engine bay, door openings, bed edge or cargo bay, like the stripped car in the reference. Wheels, roof or cockpit, fenders and fixed trim stay exactly as in the master. |
| 02 | `<car>_02_hood.png` | Only the hood, **in its exact installed position**. Everything else is magenta. |
| 03 | `<car>_03_bumper.png` | Only the front piece, in place. |
| 04 | `<car>_04_rear.png` | Only the rear piece, in place. |
| 05 | `<car>_05_doorL.png` | Only the left door (image left), in place. Include its window and mirror. |
| 06 | `<car>_06_doorR.png` | Only the right door, in place. |
| 07 | `<car>_07_paint.png` | The master with **only the recolourable body paint** turned flat pure green `#00FF00`. Stripes, number and roundel, glass, tyres, lights, grille, chrome, dark trim and bare metal stay unchanged. This tells the game which areas take the player's paint colour. |
| 08 | `<car>_08_wreck.png` | The fully wrecked car: all removable parts gone, the body scorched and blackened with some soot, same position and size. |

Parts 02–06 are cut from the master at their installed positions. They are **not** the loose, spread-out pieces shown in the reference.

### Which piece is which

| Slot | Road cars | Rocket #05 (open-wheel) |
|---|---|---|
| hood | Hood with its scoop | Nose cover with the #05 |
| bumper | Front fascia and bumper with headlights. **Hauler's bull bar goes with this piece.** | Front wing |
| rear | Trunk lid, rear hatch or liftgate (see the car list). **Bruiser: tailgate only; the ribbed bed stays on the chassis.** | Rear engine cover |
| doorL / doorR | Left and right doors | Left and right side pods |

Rocket's **rear wing stays on the chassis**.

### Car list

| Car | File prefix | Look | Rear piece |
|---|---|---|---|
| Cruiser #27 | `cruiser` | Red, two cream stripes, dark 27 in an ivory roof roundel | Trunk lid |
| Dart #18 | `dart` | Cobalt hatchback, one diagonal yellow sash, light 18 | Rear hatch |
| Bruiser #43 | `bruiser` | Charcoal pickup, one offset orange stripe, light 43, open ribbed bed | Tailgate |
| Drifter #08 | `drifter` | White wide coupe, red and blue pinstripes, blue 08 | Trunk lid |
| Hauler #34 | `hauler` | Olive off-roader, slate roof, one cream stripe, light 34, bull bar | Rear hatch |
| Rocket #05 | `rocket` | Yellow open-wheel racer, twin black stripes, black 05 | Engine cover |
| Fortress #62 | `fortress` | Navy armoured SUV, two light-blue stripes, light 62 | Liftgate |
| Phantom #77 | `phantom` | Graphite coupe, twin silver stripes, light 77 | Trunk lid |

Paint layer (07) for the darker or lighter cars:
- **Bruiser:** the charcoal body panels are the paint. The bed liner and black trim are not.
- **Drifter:** the white body is the paint. The chrome and light trim are not.
- **Phantom:** the graphite body is the paint. Black trim and glass are not.

## Alignment check (run this in Python before sending each car)

1. Composite layers 02–06 over 01, treating magenta as transparent. The result must match 00. Report the share of non-magenta pixels that differ by more than 24 levels; it should be under 2%. If it's higher, find which part is offset and fix it, then check again.
2. Each part (02–06) must be non-magenta only where the master is non-magenta.
3. No two parts may overlap by more than a few pixels.
4. In 07, the green areas must sit inside the car outline of 00. Report the green share of the car; for most cars it's roughly 35–60%.
5. All 9 images must be exactly 1024 × 1536.

Include a small contact sheet (`<car>_check.png`) with the master, the chassis, the parts composited back on, and the paint mask side by side, plus the numbers from the check.

## Order of work

1. **Cruiser** first. Send the zip `cruiser_layers.zip`. Wait for the go-ahead.
2. Then the other seven, one zip per car: `dart_layers.zip`, `bruiser_layers.zip` and so on.

## Not needed

No game code, sprite sheets, atlas packing, rotation or resizing, and no shadow images. The developer handles all of that.
