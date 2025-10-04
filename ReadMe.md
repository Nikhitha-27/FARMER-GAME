# Farmer Harvest Game – HW2

This is my HW2 project where I built a small farming game in JavaScript using canvas.  
The idea is simple: move the farmer around, collect crops, and try to reach the goal before time runs out.  
I added some new features, organized the code into modules, and styled it so it feels more like a real game.

---

## How to Run
- Open the project folder in **VS Code** and run it with **Live Server** (right click on index.html → “Open with Live Server”).
- Or use any local server (like `python -m http.server` in the project folder).
- If you just double click `index.html`, the JSON config might not load, so better to use a local server.

---

## Controls
- **Arrow keys** – move the farmer  
- **P** – pause or resume  
- **Start** button – start the game  
- **Reset** button – go back to menu  

---

## Features I Added
- Different crop types with different points: wheat = 1, pumpkin = 3, golden apple = 5.  
- Crops spawn faster over time so the game gets harder.  
- Added an **AI competitor farmer** that also collects crops and can beat you.  
- Farmer now has **sprite animation** instead of a square (it animates only when moving).  
- Farmer also **grows bigger over time** in each level.  
- Three levels with different goals, timers, obstacles, and AI speeds.  
- High Score is saved using localStorage so it remembers your best score.  
- Cleaned up the UI with better CSS styling.

---

## Code Organization
index.html
style.css
src/
main.js
Game.js
Farmer.js
AIFarmer.js
Crop.js
Obstacle.js
levels.json
sprites/farmer.png


---

## JSON Config
The file `src/levels.json` controls goals, timers, spawn rates, AI speed, and growth.  
Example:
```json
{
  "goal": 30,
  "time": 55,
  "spawnEvery": 0.7,
  "obstacles": 3,
  "aiSpeed": 210,
  "growthEvery": 9,
  "growthAmount": 2
}
