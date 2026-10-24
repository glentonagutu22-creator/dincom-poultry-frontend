
import { useEffect, useRef } from "react";
import "./LightRays.css";

const vertexShaderSource = `#version 300 es
in vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uColor;
uniform float uSpeed;
uniform float uSpread;
uniform float uLength;
uniform float uIntensity;
uniform float uGlow;
uniform float uHaze;
uniform float uMouseInfluence;

out vec4 outColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  vec2 centered = uv - vec2(0.5);

  // Normalize for screen aspect ratio.
  centered.x *= uResolution.x / uResolution.y;

  // Rays originate near the top-center of the screen.
  vec2 origin = vec2(0.0, 0.48);

  // Subtle cursor influence.
  vec2 mouse = (uMouse - vec2(0.5)) * 0.25 * uMouseInfluence;
  origin.x += mouse.x;

  vec2 direction = centered - origin;
  float distanceFromOrigin = length(direction);

  float angle = atan(direction.x, -direction.y);

  // Fan-shaped light beams.
  float spread = max(uSpread, 0.05);
  float rayPosition = angle / spread;

  float rays = pow(
    max(0.0, sin(rayPosition * 18.0 + uTime * uSpeed * 0.25)),
    10.0
  );

  // Soften and vary individual beams.
  float variation = 0.75 + 0.25 * sin(rayPosition * 3.7 + uTime * 0.2);
  rays *= variation;

  // Limit rays to the requested length.
  float lengthFade = 1.0 - smoothstep(uLength * 0.3, uLength, distanceFromOrigin);

  // Fade toward the edges of the screen.
  float edgeFade = smoothstep(0.0, 0.18, uv.y);
  float bottomFade = 1.0 - smoothstep(0.75, 1.0, uv.y);

  float glow = exp(-distanceFromOrigin * 2.2) * uGlow;
  float haze = exp(-abs(centered.x) * 1.8) * uHaze;

  float light = rays * lengthFade * edgeFade * bottomFade;
  light = light * uIntensity + glow + haze * 0.15;

  // A little organic movement prevents the rays looking too uniform.
  float noise = hash(floor(uv * 90.0) + floor(uTime * 0.5));
  light *= 0.97 + noise * 0.03;

  vec3 color = uColor * light;

  // Transparent canvas lets the page's green background show through.
  float alpha = clamp(light * 0.65, 0.0, 0.65);

  outColor = vec4(color, alpha);
}
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error("Unable to create WebGL shader.");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message || "Shader compilation failed.");
  }

  return shader;
}

function createProgram(gl) {
  const vertexShader = compileShader(
    gl,
    gl.VERTEX_SHADER,
    vertexShaderSource
  );

  const fragmentShader = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  );

  const program = gl.createProgram();

  if (!program) {
    throw new Error("Unable to create WebGL program.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(message || "WebGL program linking failed.");
  }

  return program;
}

function hexToRgb(hex) {
  const cleanHex = hex.replace("#", "");
  const normalized =
    cleanHex.length === 3
      ? cleanHex.split("").map((character) => character + character).join("")
      : cleanHex;

  const value = Number.parseInt(normalized, 16);

  if (!Number.isFinite(value)) {
    return [0.4, 0.75, 0.48];
  }

  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

function LightRays({
  raysColor = "#65b978",
  raysSpeed = 0.7,
  lightSpread = 0.6,
  rayLength = 2.5,
  glow = 0.5,
  haze = 0.2,
  intensity = 0.7,
  followMouse = true,
  mouseInfluence = 0.08,
  className = "",
  style = {},
}) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
    });

    // Graceful fallback for browsers without WebGL2.
    if (!gl) {
      console.warn("LightRays requires WebGL2 in this browser.");
      return;
    }

    let program;

    try {
      program = createProgram(gl);
    } catch (error) {
      console.error("LightRays could not initialize:", error);
      return;
    }

    const positionLocation = gl.getAttribLocation(program, "position");

    const uniforms = {
      resolution: gl.getUniformLocation(program, "uResolution"),
      time: gl.getUniformLocation(program, "uTime"),
      mouse: gl.getUniformLocation(program, "uMouse"),
      color: gl.getUniformLocation(program, "uColor"),
      speed: gl.getUniformLocation(program, "uSpeed"),
      spread: gl.getUniformLocation(program, "uSpread"),
      length: gl.getUniformLocation(program, "uLength"),
      intensity: gl.getUniformLocation(program, "uIntensity"),
      glow: gl.getUniformLocation(program, "uGlow"),
      haze: gl.getUniformLocation(program, "uHaze"),
      mouseInfluence: gl.getUniformLocation(program, "uMouseInfluence"),
    };

    const buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    gl.useProgram(program);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const color = hexToRgb(raysColor);
    let animationFrame;
    let startTime = performance.now();
    let isVisible = true;
    let isPageVisible = !document.hidden;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);

      canvas.width = Math.max(1, Math.floor(rect.width * pixelRatio));
      canvas.height = Math.max(1, Math.floor(rect.height * pixelRatio));

      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const render = (now) => {
      if (!isVisible || !isPageVisible) return;

      const elapsed = (now - startTime) / 1000;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);

      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.time, elapsed);
      gl.uniform2f(
        uniforms.mouse,
        mouseRef.current.x,
        mouseRef.current.y
      );
      gl.uniform3f(uniforms.color, color[0], color[1], color[2]);
      gl.uniform1f(uniforms.speed, raysSpeed);
      gl.uniform1f(uniforms.spread, lightSpread);
      gl.uniform1f(uniforms.length, rayLength);
      gl.uniform1f(uniforms.intensity, intensity);
      gl.uniform1f(uniforms.glow, glow);
      gl.uniform1f(uniforms.haze, haze);
      gl.uniform1f(
        uniforms.mouseInfluence,
        followMouse ? mouseInfluence : 0
      );

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrame = requestAnimationFrame(render);
    };

    const handleMouseMove = (event) => {
      if (!followMouse) return;

      const rect = canvas.getBoundingClientRect();

      mouseRef.current = {
        x: (event.clientX - rect.left) / rect.width,
        y: 1 - (event.clientY - rect.top) / rect.height,
      };
    };

    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;

      if (isPageVisible && isVisible) {
        startTime = performance.now();
        animationFrame = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animationFrame);
      }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;

      if (isVisible && isPageVisible) {
        startTime = performance.now();
        animationFrame = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animationFrame);
      }
    });

    intersectionObserver.observe(canvas);

    canvas.addEventListener("pointermove", handleMouseMove);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    resize();

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      // Render one still frame for reduced-motion preferences.
      render(performance.now());
      cancelAnimationFrame(animationFrame);
    } else {
      animationFrame = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      intersectionObserver.disconnect();

      canvas.removeEventListener("pointermove", handleMouseMove);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
    };
  }, [
    raysColor,
    raysSpeed,
    lightSpread,
    rayLength,
    glow,
    haze,
    intensity,
    followMouse,
    mouseInfluence,
  ]);

  return (
    <div
      className={`light-rays ${className}`.trim()}
      style={style}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="light-rays__canvas" />
    </div>
  );
}

export default LightRays;
