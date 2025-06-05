/* global Phaser */

// ---------- Phaser scene ----------
const setPoint = 1.0;          // desired level
let process = 0;               // simulated plant output
let integral = 0;
let lastErr = 0;
let bar;                       // green progress bar graphic

const config = {
  type: Phaser.AUTO,
  width: 640,
  height: 360,
  backgroundColor: '#1d1d1d',
  parent: document.body,
  scene: { preload, create, update }
};

new Phaser.Game(config);

function preload() {}

function create () {
  const g = this.add.graphics();
  // background “tank”
  g.fillStyle(0x444444).fillRect(120, 150, 400, 20);
  // dynamic bar
  bar = this.add.graphics();
}

function update (_, delta) {
  const kp = +document.getElementById('kp').value;
  const ki = +document.getElementById('ki').value;
  const kd = +document.getElementById('kd').value;

  const dt = delta / 1000;     // ms → s
  const err = setPoint - process;
  integral += err * dt;
  const deriv = (err - lastErr) / dt;

  const output = kp * err + ki * integral + kd * deriv;
  process += output * dt;
  lastErr = err;

  // clamp for display
  process = Phaser.Math.Clamp(process, 0, 2);

  // redraw bar (0–2 scaled to 0–400 px)
  bar.clear().fillStyle(0x00ff00).fillRect(120, 150, 400 * (process / 2), 20);
}

// ---------- Submit values to backend ----------
document.getElementById('submit').addEventListener('click', () => {
  const data = {
    kp: +document.getElementById('kp').value,
    ki: +document.getElementById('ki').value,
    kd: +document.getElementById('kd').value
  };

  fetch('http://localhost:8000/control-system/pid-evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
    .then(r => r.json())
    .then(res => {
      const msg = document.getElementById('msg');
      if (res.level_passed) {
        msg.textContent = `✅ Stabilised!  Score ${res.score}`;
        msg.style.color = 'lightgreen';
      } else {
        msg.textContent = `⚠️  Keep tuning… Score ${res.score}`;
        msg.style.color = 'orange';
      }
    })
    .catch(() => {
      document.getElementById('msg').textContent = '❌ Backend offline?';
    });
});
