import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  useGLTF,
  Center,
  ContactShadows,
  Html,
} from "@react-three/drei";
import { Suspense, useRef, useState, useEffect, useCallback, useTransition } from "react";
import { ChevronLeft, ChevronRight, Box, Play, Pause, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { models3dApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

// ─── GLB Model (auto-rotating) ────────────────────────────────────────────
const GLBDish = ({ url, scale = 1 }) => {
  const { scene } = useGLTF(url);
  const groupRef = useRef();

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.2;
  });

  return (
    <Center>
      <group ref={groupRef} scale={scale}>
        <primitive object={scene.clone()} />
      </group>
    </Center>
  );
};

// ─── Fallback Primitive Dish (original shapes) ─────────────────────────────
const PrimitiveDish = ({ position = [0, 0, 0] }) => {
  const groupRef = useRef();

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.2;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Plate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.1, 32]} />
        <meshStandardMaterial color="#ffffff" metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Food - Steak representation */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[1.2, 0.4, 0.8]} />
        <meshStandardMaterial color="#8B4513" metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Garnish 1 */}
      <mesh position={[0.5, 0.35, 0.3]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#FF4500" metalness={0.1} roughness={0.6} />
      </mesh>

      {/* Garnish 2 */}
      <mesh position={[-0.5, 0.35, 0.2]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#32CD32" metalness={0.1} roughness={0.6} />
      </mesh>

      {/* Sauce */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.8, 0.11, 0.5]}>
        <circleGeometry args={[0.3, 32]} />
        <meshStandardMaterial color="#8B0000" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
};

// ─── Loading state inside canvas ───────────────────────────────────────────
const CanvasLoader = () => (
  <Html center>
    <div className="flex flex-col items-center gap-3 glass-morphism p-4 rounded-xl">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-sm font-semibold text-primary animate-pulse">Loading 3D Dish…</p>
    </div>
  </Html>
);

// ─── Context loss handler ──────────────────────────────────────────────────
const ContextLossHandler = () => {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    const handleLost = (e) => {
      e.preventDefault();
      console.warn("[MenuScene] WebGL context lost — pausing render");
    };
    const handleRestored = () => console.info("[MenuScene] WebGL context restored");

    canvas.addEventListener("webglcontextlost", handleLost);
    canvas.addEventListener("webglcontextrestored", handleRestored);

    return () => {
      canvas.removeEventListener("webglcontextlost", handleLost);
      canvas.removeEventListener("webglcontextrestored", handleRestored);
    };
  }, [gl]);

  return null;
};

// ─── Main MenuScene Component ──────────────────────────────────────────────
const MenuScene = () => {
  const [models, setModels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Resolve the model URL
  const resolveUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return url;
  };

  // Fetch 3D models from API on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await models3dApi.list();
        if (!cancelled && data?.models?.length) {
          setModels(data.models);
          // Removed aggressive preloading to save mobile data and prevent freezing
        }
      } catch (err) {
        console.warn("[MenuScene] Could not fetch 3D models:", err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const hasModels = models.length > 0;

  // Auto-play slideshow
  useEffect(() => {
    if (!isAutoPlaying || models.length <= 1) return;
    const interval = setInterval(() => {
      startTransition(() => {
        setCurrentIndex((i) => (i + 1) % models.length);
      });
    }, 4500); // Change slide every 4.5 seconds
    return () => clearInterval(interval);
  }, [models.length, isAutoPlaying]);

  const currentModel = models[currentIndex] || null;

  const handlePrev = () => {
    setIsAutoPlaying(false);
    startTransition(() => {
      setCurrentIndex((i) => (i - 1 + models.length) % models.length);
    });
  };
  const handleNext = () => {
    setIsAutoPlaying(false);
    startTransition(() => {
      setCurrentIndex((i) => (i + 1) % models.length);
    });
  };

  const modelUrl = currentModel ? resolveUrl(currentModel.model_url) : null;

  // Dispose GL on unmount to free the WebGL context
  const handleCreated = useCallback(({ gl }) => {
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }, []);

  return (
    <div 
      className="relative w-full h-[650px] rounded-3xl overflow-hidden border border-primary/20 shadow-[0_20px_50px_rgba(var(--primary),0.15)] group bg-gradient-to-br from-background via-background/95 to-primary/5"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Top Bar - Featured & AutoPlay Controls */}
      <div className="absolute top-6 left-6 right-6 z-10 flex justify-between items-start pointer-events-none">
        <div className="glass-morphism px-4 py-2 rounded-xl flex items-center gap-2 border border-primary/20 shadow-lg pointer-events-auto">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm font-bold text-foreground">Featured Dishes</span>
        </div>
        
        {hasModels && models.length > 1 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="glass-morphism rounded-full px-3 text-xs border border-white/10 pointer-events-auto hover:bg-primary/20"
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          >
            {isAutoPlaying ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
            {isAutoPlaying ? "Pause Slide" : "Auto-Play"}
          </Button>
        )}
      </div>

      {/* Cinematic Model Details Overlay */}
      {currentModel && (
        <div className="absolute bottom-12 left-8 z-10 max-w-sm pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentModel.name}
              initial={{ opacity: 0, x: -20, filter: "blur(10px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: 20, filter: "blur(10px)" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <p className="text-sm font-bold text-primary uppercase tracking-widest mb-1 shadow-sm">
                {currentModel.category}
              </p>
              <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-foreground to-primary/80 drop-shadow-md leading-tight mb-2">
                {currentModel.name}
              </h2>
              <div className="w-12 h-1 bg-gradient-to-r from-primary to-accent rounded-full mt-4" />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Interactive Hint */}
      <div className="absolute bottom-8 right-8 z-10 glass-morphism px-4 py-2 rounded-full text-xs text-muted-foreground pointer-events-none border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        Click & drag to rotate • Scroll to zoom
      </div>

      {/* Navigation arrows */}
      {hasModels && models.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 glass-morphism border border-white/10 hover:bg-primary hover:text-white w-12 h-12 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-4 group-hover:translate-x-0"
            onClick={handlePrev}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 glass-morphism border border-white/10 hover:bg-primary hover:text-white w-12 h-12 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0"
            onClick={handleNext}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </>
      )}

      {/* Dot indicators */}
      {hasModels && models.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2 glass-morphism px-3 py-2 rounded-full border border-white/5">
          {models.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setIsAutoPlaying(false);
              }}
              className={`h-2 rounded-full transition-all duration-500 ${
                idx === currentIndex
                  ? "bg-primary w-6 shadow-[0_0_10px_rgba(var(--primary),0.8)]"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/60 w-2"
              }`}
            />
          ))}
        </div>
      )}

      {/* No models badge */}
      {!isLoading && !hasModels && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 glass-morphism px-6 py-4 rounded-xl flex flex-col items-center gap-3 text-center border border-dashed border-primary/30">
          <Box className="w-8 h-8 text-primary/50" />
          <div>
            <p className="font-bold mb-1">No 3D Models Found</p>
            <p className="text-xs text-muted-foreground">
              Place <code>.glb</code> files in <code>public/models/</code> to see real 3D dishes
            </p>
          </div>
        </div>
      )}

      {/* Three.js Canvas */}
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
        <ContextLossHandler />
        <PerspectiveCamera makeDefault position={[0, 2.5, 5]} fov={45} />
        <OrbitControls
          enablePan={false}
          minDistance={2.5}
          maxDistance={8}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2 + 0.1}
          autoRotate={false} 
        />

        {/* Cinematic Lighting */}
        <ambientLight intensity={1.2} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0001}
        />
        <spotLight 
          position={[-5, 5, -5]} 
          intensity={1} 
          color="#a855f7" 
          distance={20}
          angle={Math.PI / 4}
          penumbra={1}
        />

        {/* 3D Model or Fallback */}
        <Suspense fallback={<CanvasLoader />}>
          {modelUrl ? (
            <GLBDish url={modelUrl} scale={1.2} />
          ) : (
            <PrimitiveDish position={[0, 0, 0]} />
          )}
        </Suspense>

        {/* Contact shadows for realistic grounding */}
        <ContactShadows
          position={[0, -0.6, 0]}
          opacity={0.6}
          scale={15}
          blur={2.5}
          far={4}
          color="#000000"
        />
      </Canvas>

      {/* Cinematic Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.2)] rounded-3xl" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/80 via-transparent to-transparent" />
    </div>
  );
};

export default MenuScene;
