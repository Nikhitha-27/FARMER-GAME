# Farmer Harvest Game – HW2

This is my HW2 project where I built a simple farming game in JavaScript using canvas.  
The goal is to move the farmer, collect crops, and beat the AI farmer or reach the goal before time runs out.  
I added several new features, organized the code into modules, and styled it with CSS so it feels more like a modern game.

---

## How to Run
- Open the project folder in **VS Code** and run with **Live Server** (right click on `index.html` → “Open with Live Server”).
- Or use any local server (`python -m http.server` also works).
- If you double-click `index.html`, the game will open, but the JSON config might not load (blocked on file://).

---

## Controls
- **Arrow keys** – move the farmer    
- **Start** button – begin game  
- **Reset** button – go back to menu  

---

## Features I Added
- **Multiple crop types**: wheat = 1, pumpkin = 3, golden apple = 5.  
- **Dynamic spawn rate**: crops appear faster as time goes on.  
- **AI competitor farmer**: chases crops and scores points against you.  
- **Sprite animation**: farmer uses a 4×4 sprite sheet and animates when walking.  
- **Farmer growth**: farmer grows bigger slowly during each level.  
- **3 levels**: each with different goals, timers, obstacles, and AI speed.  
- **High Score**: best score is saved in `localStorage`.  
- **Modern CSS style**: glassy panels, rounded canvas, crisp pixels.

---

## Project Structure

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
Crop points are also set in this file:

"crops": { "wheat": 1, "pumpkin": 3, "goldenApple": 5 }