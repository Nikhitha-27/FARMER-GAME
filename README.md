# Farmer Harvest Game – HW2

This is my HW2 project for the JavaScript game assignment. The game is about moving a farmer around the field, collecting crops, and racing against an AI competitor. I added new gameplay features, sprite animation, multiple levels, and a JSON config for difficulty.

---

## 🚀 How to Run
1. Open the project folder in **VS Code**.  
2. Right click on `index.html` → choose **“Open with Live Server”**.  
   - (Or run a local server, e.g. `python -m http.server`).  
3. If you just double-click `index.html`, the game might run but `levels.json` won’t load (blocked by the browser).  

Controls:
- **Arrow keys** → Move farmer  
- **P** → Pause/Resume  
- **Start button** → Begin game  
- **Reset button** → Go back to menu  

---

## 🌾 New Features I Added
- **Multiple crop types**: wheat = 1 point, pumpkin = 3 points, golden apple = 5 points.  
- **Dynamic spawn rate**: crops spawn faster as time passes, so difficulty increases.  
- **AI competitor farmer**: a computer-controlled farmer that chases crops and scores against the player.  
- **Sprite animation**: the farmer uses a 4×4 sprite sheet and animates smoothly when walking.  
- **Farmer growth**: the farmer gets bigger over time in each level.  
- **Three levels**: each level has different goals, timers, obstacles, and AI speeds.  
- **High Score**: best score is saved in `localStorage`.  
- **Modern CSS styling**: glassy panels, rounded canvas, crisp pixel look.  
- **JSON config**: goals, time, spawn rate, AI speed, and growth values are loaded from `levels.json`.  

---

## 🧑‍💻 Arrow Functions, `this`, and `.bind(this)`
- **Arrow functions**:  
  Used in the game loop →  
  ```js
  this.tick = (ts) => { ... }
This keeps this bound to the Game instance when passed to requestAnimationFrame.

.bind(this):
Used in the input handler so event listeners keep the right context and can be removed:

this._onKeyDown = this.onKeyDown.bind(this);


Normal this in methods:
Functions like game.start() rely on the normal method call rule where this is the object instance.
📂 Project Structure
.
├── index.html
├── style.css
├── README.md
├── levels.json
└── src/
    ├── main.js
    ├── Game.js
    ├── Farmer.js
    ├── AIFarmer.js
    ├── Crop.js
    ├── Obstacle.js
    └── sprites/
        └── farmer.png
