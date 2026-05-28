import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  useGLTF,
  Center,
  ContactShadows,
  Html,
} from "@react-three/drei";
import { Suspense, useRef, useEffect, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";

// ─── Spinning GLB Model ────────────────────────────────────────────────────
const GLBModel = ({ url, autoRotate = true, scale = 1 }) => {
  const { scene } = useGLTF(url);
  const groupRef = useRef();

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <Center>
      <group ref={groupRef} scale={scale}>
        <primitive object={scene.clone()} />
      </group>
    </Center>
  );
};

// ─── Loading Spinner inside Canvas ─────────────────────────────────────────
const CanvasLoader = () => (
  <Html center>
    <div className="flex flex-col items-center gap-2">
      <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      <p className="text-xs text-muted-foreground">Loading 3D model…</p>
    </div>
  </Html>
);

// ─── Error Fallback ────────────────────────────────────────────────────────
const ErrorFallback = () => (
  <mesh>
    <boxGeometry args={[1.5, 1.5, 1.5]} />
    <meshStandardMaterial color="#ff4444" wireframe opacity={0.5} transparent />
  </mesh>
);

// ─── Context loss handler ──────────────────────────────────────────────────
const ContextGuard = () => {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;

    const handleLost = (e) => {
      e.preventDefault();
      console.warn("[GLBViewer] WebGL context lost");
    };
    const handleRestored = () => {
      console.info("[GLBViewer] WebGL context restored");
    };

    canvas.addEventListener("webglcontextlost", handleLost);
    canvas.addEventListener("webglcontextrestored", handleRestored);

    // Cleanup: dispose the renderer when this component unmounts
    // (i.e. when the dialog closes)
    return () => {
      canvas.removeEventListener("webglcontextlost", handleLost);
      canvas.removeEventListener("webglcontextrestored", handleRestored);
      gl.dispose();
      gl.forceContextLoss();
    };
  }, [gl]);

  return null;
};

// ─── Main Viewer Component ─────────────────────────────────────────────────
const GLBModelViewer = ({
  modelUrl,
  className = "",
  height = "400px",
  autoRotate = true,
  scale = 1,
  showControls = true,
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state when URL changes
  useEffect(() => {
    setHasError(false);
  }, [modelUrl]);

  // Cap pixel ratio for performance
  const handleCreated = useCallback(({ gl }) => {
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  }, []);

  if (!modelUrl) return null;

  return (
    <div className={`relative w-full rounded-xl overflow-hidden ${className}`} style={{ height }}>
      {/* Instruction overlay */}
      {showControls && (
        <div className="absolute top-3 left-3 z-10 bg-background/70 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs text-muted-foreground border border-border/50">
          🖱️ Drag to rotate • Scroll to zoom
        </div>
      )}

      <Canvas
        shadows
        dpr={[1, 1.5]}
        onCreated={handleCreated}
        gl={{
          antialias: true,
          powerPreference: "default",
          failIfMajorPerformanceCaveat: false,
        }}
      >
        <ContextGuard />
        <PerspectiveCamera makeDefault position={[0, 2, 5]} fov={45} />
        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={8}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          autoRotate={false}
        />

        {/* Default Neutral Lighting */}
        <ambientLight intensity={1.5} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
        />

        {/* 3D Model */}
        <Suspense fallback={<CanvasLoader />}>
          {hasError ? (
            <ErrorFallback />
          ) : (
            <GLBModel url={modelUrl} autoRotate={autoRotate} scale={scale} />
          )}
        </Suspense>

        {/* Contact shadow for grounding */}
        <ContactShadows
          position={[0, -0.5, 0]}
          opacity={0.4}
          scale={10}
          blur={2}
          far={4}
        />
      </Canvas>

      {/* Bottom gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/60 to-transparent pointer-events-none" />
    </div>
  );
};

export default GLBModelViewer;
