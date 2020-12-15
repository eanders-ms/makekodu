

## What is Kodu?

[Kodu Game Lab](https://www.kodugamelab.com) is a 3D game development environment designed to make game programming simple and accessible to anyone.
The Kodu programming model is novel and rigorously streamlined. It dispenses with the majority of traditional programming concepts, including
symbolic variables, branching, loops, string manipulation, polymorphism, and so on. The user programs characters in the world, and 
programs are expressed in a high-level, sensory paradigm. The typical "hello world" of Kodu is:

![Kodu-Hello-World](content/kodu-hello-world.png)

## What is MakeKodu?

This project is an experiment - inspired by Kodu and [Microsoft TileCode](https://microsoft.github.io/tilecode/) - to see what a Kodu-like
environment would feel like in MakeCode Arcade and on supported handhelds like [Meowbit](https://www.kittenbot.cc/products/meowbit-codable-console-for-microsoft-makecode-arcade).

Try it out at [https://humanapp.github.io/makekodu/](https://humanapp.github.io/makekodu/)


### Top TODOs

- [ ] Tile art (ongoing... keep up on it).
- [x] Tile compatibility filtering.
- [ ] In-world terrain editor. Use tilemap as terrain & walls.
- [ ] Default world size 500x500, with glass walls.

### TODO (General - not prioritized)

- [ ] Create MakeKodu hosting website.
- [ ] Add community features to hosting site: share world, browse shared, etc.
- [ ] Support tilemaps for terrain and wall painting.
- [ ] Support tilemap walls in physics engine.
- [x] Add "Duplicate" to character menu.
- [ ] Add rule menu: move up/down, delete.
- [x] Improve tile selection menu layout.
- [x] Implement tile compatibility filtering.
- [ ] Create character from gallery sprite.
- [ ] Actuator arbitration? Maybe.
- [x] Movement blending? Maybe. (done, not sure we want it though).
- [ ] Exclusive movement types? Maybe.
- [ ] Clicking "play": Delay entering play mode until A button is released. Otherwise brains can sense the button down from the click.
- [ ] When a brain has dpad input, change "stop" button to show you have to push the "menu" button to get back to edit mode.
- [ ] Implement world boundaries. 500x500?
- [ ] Implement help for all modes.
- [ ] Implement child rules - inherit targets from parent rule.
- [ ] Networked multiplayer using pxt-socket. Matchmaking through host site.
- [ ] World settings: Background color. Behavior on glass wall collide (destroy? bounce?)
- [ ] Character settings: Friction, default speed, default health, etc.
- [ ] Brain editor: Don't show when or do insertion point if there are no valid tiles to add.
- [x] Tile compat: Only make "it" modifier available if WHEN side produces character-sensory output.
- [ ] Tile compat: Handle "constraints.handling" config property when filtering tiles.
- [ ] Implement compact save format.

### TODO (Language - not prioritized)

- [ ] "player 1-4" filters (input and sensory).
- [ ] "express" actuator, filters, modidfiers. "none", "happy", "sad", "angry", "crazy", "hearts", "flowers", "stars", "swears"
- [x] "near by", "far away" filters
- [ ] "bump" sensor
- [x] "wander" (as default move behavior)
- [ ] "up", "down", "left", "right" (move modifiers)
- [ ] "above", "below", "left", "right" (position relative filters)
- [ ] teams: "red", "blue", "opposite", "none"
- [x] "me", "it" filters, modifiers
- [ ] "boom" actuator
- [x] "vanish" actuator
- [ ] "shoot" actuator, "shot hit" sensor, blips
- [ ] "score" sensor, actuator. filters: team, comparisons
- [ ] "win", "lose" actuators
- [ ] "timer" sensor
- [ ] "camera" actuator, "center on" and "keep in view" modifiers
- [x] "switch page" actuator
- [ ] "call page" actuator
- [ ] "say" actuator? Maybe.
- [ ] Terrain sensor, filters. Terrain paint actuator, modifiers.
- [ ] "on terrain" move modifier. Loosely paths on matching terrain.
- [ ] "pressed", "released" button filters.
- [ ] "done" final modifier to indicate brain should stop executing this frame.
- [ ] "not" final filter to negate the when clause.
- [ ] "started to" and "no longer" final filter for edge-triggered when clause. Combines with "not". Or make these options on the rule handle.

## Edit this project ![Build status badge](https://github.com/humanapp/makekodu/workflows/MakeCode/badge.svg)

To edit this repository in MakeCode.

* open [https://arcade.makecode.com/](https://arcade.makecode.com/)
* click on **Import** then click on **Import URL**
* paste **https://github.com/humanapp/makekodu** and click import

#### Metadata (used for search, rendering)

* for PXT/arcade
<script src="https://makecode.com/gh-pages-embed.js"></script><script>makeCodeRender("{{ site.makecode.home_url }}", "{{ site.github.owner_name }}/{{ site.github.repository_name }}");</script>
