import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import LoadingScreen from "../../../Components/UI/Loading/LoadingScreen";
import {Office} from "../../../models/Office";

const Home = () => {
  const [currentStage, setCurrentStage] = useState(1);
  const [isRotating, setIsRotating] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [islandPosition, setIslandPosition] = useState([0, 0, 0]);
  const [islandScale, setIslandScale] = useState([1, 1, 1]);

  return (
    <section className="w-full h-screen flex relative">
      {/* Canvas component for 3D rendering */}
      <Canvas
        className="w-full h-screen bg-transparent"
        camera={{ near: 0.1, far: 1000 }}
      >
        <Suspense fallback={<></>}> {/* Empty fallback to prevent layout shifts */}
          <directionalLight />
          <ambientLight />
          <pointLight />
          <spotLight />
          <hemisphereLight />
          <Office
            isRotating={isRotating}
            setIsRotating={setIsRotating}
            setCurrentStage={setCurrentStage}
            position={islandPosition}
            rotation={[0.1, 4.7077, 0]}
            scale={islandScale} currentFocusPoint={undefined}          />
        </Suspense>
      </Canvas>

      {/* Loading Screen overlay (positioned on top of the canvas) */}
      <div className="absolute top-28 left-0 right-0 z-10 flex justify-center items-center">
        <LoadingScreen />
      </div>
    </section>
  );
};

export default Home;
