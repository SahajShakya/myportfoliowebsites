import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import LoadingScreen from "../../../Components/UI/Loading/LoadingScreen";
import Office from "../../../Components/Model/Office";
import Office2 from "../../../Components/Model/Office2";
import Sky from "../../../Components/Model/Sky";
import Drone from "../../../Components/Model/Drone";
import Robot from "../../../Components/Model/Robot";
import HomeInfo from "./HomeInfo";

const Home = () => {
  const [isRotating, setIsRotating] = useState(false);
  const [currentStage, setCurrentStage] = useState(1);

  const adjustOfficeForScreenSize = () => {
    let screenScale, screenPosition;

    if (window.innerWidth < 480) {
      screenScale = [40, 40, 40]; // Scale down proportionally (you can fine-tune this)
      screenPosition = [30, -10, -340];
    } else if (window.innerWidth >= 480 && window.innerWidth < 768) {
      screenScale = [145, 145, 145];
      screenPosition = [90, -50, -1000];
    } else {
      screenScale = [3, 3, 3];
      screenPosition = [1.2, -3, -13];
    }

    return [screenScale, screenPosition];
  };

  const adjustDroneForScreenSize = () => {
    let screenScale, screenPosition;

    const width = window.innerWidth;

    if (width < 480) {
      // For screens smaller than 480px, scale down the drone further
      screenScale = [20, 20, 20]; // Scale down to a very small size
      screenPosition = [-60, -60, -220]; // Adjust position to be closer to camera
    } else if (width >= 480 && width < 768) {
      // For mobile screens (480px - 767px), keep the original scale and position
      screenScale = [145, 145, 145];
      screenPosition = [90, -50, -1000];
    } else {
      // For larger screens (>= 768px), keep the original scale and position
      screenScale = [0.5, 0.5, 0.5];
      screenPosition = [-6, 3, 0.7];
    }

    return [screenScale, screenPosition];
  };

  const adjustRobotForScreenSize = () => {
    let screenScale, screenPosition;

    const width = window.innerWidth;

    if (width < 480) {
      // For screens smaller than 480px, scale down the drone further
      screenScale = [20, 20, 20]; // Scale down to a very small size
      screenPosition = [50, -10, -200]; // Adjust position to be closer to camera
    } else if (width >= 480 && width < 768) {
      // For mobile screens (480px - 767px), keep the original scale and position
      screenScale = [145, 145, 145];
      screenPosition = [90, -50, -1000];
    } else {
      // For larger screens (>= 768px), keep the original scale and position
      screenScale = [1, 1, 1];
      screenPosition = [0, -2.5, -1.2];
    }

    return [screenScale, screenPosition];
  };

  const [officeScale, officePosition] = adjustOfficeForScreenSize();
  const [droneScale, dronePosition] = adjustDroneForScreenSize();
  const [robotScale, robotPosition] = adjustRobotForScreenSize();

  return (
    <section className="w-full h-screen flex relative">
      {/* Canvas component for 3D rendering */}
      <div className="absolute top-28 left-0 right-0 z-10 flex items-center justify-center">
        {currentStage && <HomeInfo currentStage={currentStage} />}
      </div>
      <Canvas
        className={`w-full h-screen bg-transparent ${
          isRotating ? "cursor-grabbing" : "cursor-grab"
        }`}
        camera={{ near: 0.1, far: 1000 }}
      >
        <Suspense fallback={<></>}>
          {" "}
          {/* Empty fallback to prevent layout shifts */}
          <directionalLight position={[1, 1, 1]} intensity={2} />
          <ambientLight intensity={2} />
          <hemisphereLight
            skyColor="#b1e1ff"
            groundColor="#000000"
            intensity={2}
          />
          {/* <Office
              position={officePosition}
              scale={officeScale}
              rotation={[0.1, 4.7077, 0]}
            /> */}
          <Drone
            planeScale={droneScale}
            planePosition={dronePosition}
            isRotating={isRotating}
            rotation={[0, 0, 0]}
          />
          <Sky isRotating={isRotating} />
          <Office2
            position={officePosition}
            scale={officeScale}
            rotation={[0.1, 4.7077, 0]}
            isRotating={isRotating}
            setIsRotating={setIsRotating}
            setCurrentStage={setCurrentStage}
          />
          <Robot
            robotScale={robotScale}
            robotPosition={robotPosition}
            isRotating={isRotating}
            rotation={[0, 0, 0]}
          />
        </Suspense>
      </Canvas>
    </section>
  );
};

export default Home;
