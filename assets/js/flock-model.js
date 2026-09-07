// Deterministic 3D boids. Positions are never assigned to a curve or ribbon.
// Local social forces and a moving pressure field create the collective shape.
export class Flock {
  constructor(count, aspect = 1.6) {
    this.count = count;
    this.positions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    this.acceleration = new Float32Array(count * 3);
    this.banks = new Float32Array(count);
    this.phases = new Float32Array(count);
    this.sizes = new Float32Array(count);
    this.next = new Int32Array(count);
    this.cells = new Map();
    this.time = 0;
    this.seed = 8701;
    this.resize(aspect);
    for (let i = 0; i < count; i++) {
      const k = i * 3;
      // Overlapping irregular volumes, not a hollow shell or a perfect sphere.
      let x, y, z;
      do {
        x = this.random() * 2 - 1;
        y = this.random() * 2 - 1;
        z = this.random() * 2 - 1;
      } while (x * x + y * y + z * z > 1);
      this.positions[k] = x * this.boundsX * .9;
      this.positions[k + 1] = y * 31 + Math.sin(x * 4) * 17;
      this.positions[k + 2] = z * 24;
      this.velocities[k] = 8 + this.random() * 3;
      this.velocities[k + 1] = Math.cos(x * 3) * 3;
      this.velocities[k + 2] = this.random() * 3 - 1.5;
      this.phases[i] = this.random() * Math.PI * 2;
      this.sizes[i] = .6 + this.random() * .65;
    }
  }

  random() {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  resize(aspect) {
    const next = Math.max(27, Math.min(112, 66 * aspect));
    if (this.boundsX) {
      for (let k = 0; k < this.positions.length; k += 3) this.positions[k] *= next / this.boundsX;
    }
    this.boundsX = next;
  }

  cellKey(x, y, z) { return (x + 128) + (y + 128) * 256 + (z + 128) * 65536; }

  step(dt, pointer = null) {
    this.time += dt;
    const t = this.time, p = this.positions, v = this.velocities, a = this.acceleration;
    const cellSize = 9, radius2 = 81;
    this.cells.clear();
    for (let i = 0; i < this.count; i++) {
      const k = i * 3;
      const key = this.cellKey(Math.floor(p[k] / cellSize), Math.floor(p[k + 1] / cellSize), Math.floor(p[k + 2] / cellSize));
      this.next[i] = this.cells.get(key) ?? -1;
      this.cells.set(key, i);
    }
    // A broad passing disturbance sends turning waves through the flock.
    // This repels locally; it does not prescribe individual destinations.
    const pressureX = Math.sin(t * .12) * this.boundsX * 1.15;
    const pressureY = Math.cos(t * .17) * 43;
    const pressureZ = Math.sin(t * .14 + 1) * 34;
    const pressure = 1.5 + 1.5 * Math.sin(t * .21);
    for (let i = 0; i < this.count; i++) {
      const k = i * 3, x = p[k], y = p[k + 1], z = p[k + 2];
      const gx = Math.floor(x / cellSize), gy = Math.floor(y / cellSize), gz = Math.floor(z / cellSize);
      let sx = 0, sy = 0, sz = 0, cx = 0, cy = 0, cz = 0, vx = 0, vy = 0, vz = 0, n = 0;
      for (let oz = -1; oz <= 1; oz++) for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        let j = this.cells.get(this.cellKey(gx + ox, gy + oy, gz + oz)) ?? -1;
        while (j !== -1) {
          const q = j * 3;
          if (j !== i) {
            const dx = p[q] - x, dy = p[q + 1] - y, dz = p[q + 2] - z;
            const d2 = dx * dx + dy * dy + dz * dz;
            if (d2 < radius2 && d2 > .0001) {
              // Distance-weighted neighbor consensus, with stronger personal space.
              const weight = 1 - d2 / radius2;
              cx += dx * weight; cy += dy * weight; cz += dz * weight;
              vx += v[q] * weight; vy += v[q + 1] * weight; vz += v[q + 2] * weight;
              n += weight;
              if (d2 < 5) {
                const force = (1 - d2 / 5) / (d2 + .15) * 4;
                sx -= dx * force; sy -= dy * force; sz -= dz * force;
              }
            }
          }
          j = this.next[j];
        }
      }
      let ax = sx, ay = sy, az = sz;
      if (n > 0) {
        ax += (vx / n - v[k]) * 1.3 + cx / n * .5;
        ay += (vy / n - v[k + 1]) * 1.3 + cy / n * .5;
        az += (vz / n - v[k + 2]) * 1.3 + cz / n * .5;
      }
      // Look-ahead soft boundaries turn the birds back without teleporting them.
      const bx = (x + v[k] * 2) / this.boundsX;
      const by = (y + v[k + 1] * 2) / 54;
      const bz = (z + v[k + 2] * 2) / 37;
      ax -= Math.sign(bx) * Math.pow(Math.abs(bx), 5) * 4;
      ay -= Math.sign(by) * Math.pow(Math.abs(by), 5) * 4;
      az -= Math.sign(bz) * Math.pow(Math.abs(bz), 5) * 4;
      // Small spatially varying wind keeps formations evolving.
      ax += Math.sin(y * .045 + t * .16) * .6;
      ay += Math.sin(z * .05 + t * .13) * .5;
      az += Math.cos(x * .035 - t * .11) * .7;
      const dx = x - pressureX, dy = y - pressureY, dz = z - pressureZ;
      const d = Math.hypot(dx, dy, dz);
      if (d < 24 && d > .01) {
        const f = (1 - d / 24) * pressure / d;
        ax += dx * f; ay += dy * f; az += dz * f;
      }
      if (pointer?.active) {
        const px = x - pointer.x, py = y - pointer.y;
        const pd = Math.hypot(px, py);
        if (pd < 16 && pd > .1) {
          ax += px / pd * (1 - pd / 16) * 2;
          ay += py / pd * (1 - pd / 16) * 2;
        }
      }
      const mag = Math.hypot(ax, ay, az);
      const factor = mag > 8 ? 8 / mag : 1;
      a[k] = ax * factor; a[k + 1] = ay * factor; a[k + 2] = az * factor;
    }
    for (let i = 0; i < this.count; i++) {
      const k = i * 3;
      const oldX = v[k], oldZ = v[k + 2];
      v[k] += a[k] * dt; v[k + 1] += a[k + 1] * dt; v[k + 2] += a[k + 2] * dt;
      const speed = Math.hypot(v[k], v[k + 1], v[k + 2]) || 1;
      const limit = Math.max(6, Math.min(12, speed)) / speed;
      v[k] *= limit; v[k + 1] *= limit; v[k + 2] *= limit;
      p[k] += v[k] * dt; p[k + 1] += v[k + 1] * dt; p[k + 2] += v[k + 2] * dt;
      const bank = Math.max(-.65, Math.min(.65, (oldX * v[k + 2] - oldZ * v[k]) * 2));
      this.banks[i] += (bank - this.banks[i]) * (1 - Math.exp(-dt * 3));
    }
  }
}
