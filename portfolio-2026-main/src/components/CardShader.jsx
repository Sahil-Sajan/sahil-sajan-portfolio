import { useRef, useEffect } from "react";

const VERT = `
  attribute vec2 a_pos;
  void main() {
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

// Cursor-proximity pixel distortion.
// Blocks snap to the card's 9 px dot-grid and are displaced by whole
// multiples of that unit — progressively more so the closer they are
// to the cursor.  No animation, no blend mode, card colour tones only.
const FRAG = `
  precision mediump float;

  uniform vec2  u_res;
  uniform float u_mx;   // smoothed cursor x  (-0.5 → 0.5)
  uniform float u_my;   // smoothed cursor y  (-0.5 → 0.5)
  uniform float u_hover;

  float h2(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Card colour palette — black, green, white only (no teal)
  vec3 cardColor(float t) {
    t = fract(t);
    if (t < 0.20) return vec3(0.071, 0.075, 0.071); // #121312  off-black
    if (t < 0.45) return vec3(0.0,   0.627, 0.518);  // #00A084  dark-green
    if (t < 0.75) return vec3(0.306, 0.875, 0.533);  // #4EDF88  light-green
    return            vec3(0.984, 1.0,   0.992);      // #FBFFFD  off-white
  }

  void main() {
    // Grid unit — matches the card's dot-art block size
    const float BS = 9.0;

    vec2 px  = gl_FragCoord.xy;
    vec2 uv  = px / u_res;

    // Cursor in UV space (0-1), Y-flipped for WebGL bottom-up coords
    vec2 cursor = vec2(u_mx + 0.5, 1.0 - (u_my + 0.5));

    // Block the pixel lives in
    vec2 bIdx = floor(px / BS);

    // Measure distance from block CENTER (not raw pixel) so the
    // boundary aligns to the grid — naturally non-circular / blocky
    vec2 blockCenter = (bIdx + 0.5) * BS / u_res;
    float aspect = u_res.y / u_res.x;
    float dist   = length((blockCenter - cursor) * vec2(1.0, aspect));

    // Per-block noise jitter on the radius — breaks up any residual roundness
    float radJitter = (h2(bIdx + vec2(5.3, 8.1)) - 0.5) * 0.07;
    float radius  = 0.45 + radJitter;

    // Cubic falloff: full intensity at cursor, zero at radius
    float t = clamp(1.0 - dist / radius, 0.0, 1.0);
    float falloff = t * t * t;

    // Per-block random displacement direction (fixed — no time seed)
    // Magnitude grows with falloff so distortion is strongest at cursor
    float maxDisp = 5.0; // maximum displacement in block units
    float rawDx = (h2(bIdx + vec2(1.31, 2.74)) - 0.5) * 2.0 * maxDisp * falloff;
    float rawDy = (h2(bIdx + vec2(4.07, 0.93)) - 0.5) * 0.8 * maxDisp * falloff;

    // Snap to whole grid units  →  only moves in card-pixel increments
    float dxB = sign(rawDx) * floor(abs(rawDx) + 0.5);
    float dyB = sign(rawDy) * floor(abs(rawDy) + 0.5);

    // Source block whose colour this pixel borrows
    vec2 srcIdx = bIdx + vec2(dxB, dyB);

    // Colour from source — card's own tones
    float cs    = h2(srcIdx * vec2(0.73, 1.17));
    vec3  color = cardColor(cs);

    // Only render where there is real displacement
    float displaced = step(0.5, length(vec2(dxB, dyB)));

    // Alpha: proportional to falloff so the edge fades smoothly
    float alpha = displaced * falloff * u_hover * 0.82;

    // Tight vignette matching card border
    float vig = smoothstep(0.0, 0.02, uv.x) * smoothstep(1.0, 0.98, uv.x)
              * smoothstep(0.0, 0.02, uv.y) * smoothstep(1.0, 0.98, uv.y);

    gl_FragColor = vec4(color, alpha * vig);
  }
`;

function buildProgram(gl) {
  const mk = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, mk(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  return prog;
}

export default function CardShader({ hoverPos, isActive }) {
  const canvasRef  = useRef(null);
  const liveRef    = useRef({ hoverPos, isActive });
  liveRef.current  = { hoverPos, isActive };
  const rafRef     = useRef(null);
  const restartRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
    });
    if (!gl) return;

    const prog = buildProgram(gl);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const aPosLoc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPosLoc);
    gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes   = gl.getUniformLocation(prog, "u_res");
    const uMx    = gl.getUniformLocation(prog, "u_mx");
    const uMy    = gl.getUniformLocation(prog, "u_my");
    const uHover = gl.getUniformLocation(prog, "u_hover");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    let hoverVal = 0;
    let smx = 0, smy = 0; // smoothed cursor position

    const tick = () => {
      const { hoverPos: hp, isActive: act } = liveRef.current;

      // Smooth hover in/out
      hoverVal += ((act ? 1.0 : 0.0) - hoverVal) * 0.1;
      if (Math.abs(hoverVal - (act ? 1.0 : 0.0)) < 0.001) hoverVal = act ? 1.0 : 0.0;

      // Stop the RAF loop when fully idle — restartRef restarts it on next hover
      if (hoverVal < 0.001 && !act) {
        hoverVal = 0;
        gl.clear(gl.COLOR_BUFFER_BIT);
        rafRef.current = null;
        return;
      }

      // Smooth cursor — trails slightly so the distortion field glides
      if (hp?.active) {
        smx += (hp.x - smx) * 0.18;
        smy += (hp.y - smy) * 0.18;
      }

      gl.clear(gl.COLOR_BUFFER_BIT);

      if (hoverVal > 0.002) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(uRes,   canvas.width, canvas.height);
        gl.uniform1f(uMx,    smx);
        gl.uniform1f(uMy,    smy);
        gl.uniform1f(uHover, hoverVal);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    // Exposed so the isActive effect can restart a stopped loop
    restartRef.current = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, []);

  // Restart the idle-stopped loop as soon as hover begins
  useEffect(() => {
    if (isActive && restartRef.current) restartRef.current();
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={180}
      height={255}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 3,
        borderRadius: "9px",
      }}
    />
  );
}
