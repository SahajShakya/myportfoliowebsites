import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import LoadingScreen from "../../../Components/UI/Loading/LoadingScreen";
// import Office from "../../../Components/Model/Office";
// import Office2 from "../../../Components/Model/Office2";
import Office3 from "../../../Components/Model/Office3";
import Sky from "../../../Components/Model/Sky";
// import Drone from "../../../Components/Model/Drone";
import Drone from "../../../Components/Model/DroneL";
import Robot from "../../../Components/Model/Robot";
import HomeInfo from "./HomeInfo";

const LOAD_MESSAGES = [
  "Loading Drone...",
  "Loading Robot...",
  "Loading Environment...",
  "Preparing 3D Scene...",
];

const Home = () => {
  const [isRotating, setIsRotating] = useState(false);
  const [currentStage, setCurrentStage] = useState(1);
  const [loadMessage, setLoadMessage] = useState(0);
  const [minElapsed, setMinElapsed] = useState(false);
  const { progress, active } = useProgress();
  const ready = !active && progress >= 100;

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), 700);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready) return;
    const id = setInterval(() => {
      setLoadMessage((m) => (m + 1) % LOAD_MESSAGES.length);
    }, 900);
    return () => clearInterval(id);
  }, [ready]);

  const showLoader = !ready || !minElapsed;

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
      <div className="absolute top-28 left-0 right-0 z-10 flex items-center justify-center h-[150px]">
        {currentStage && <HomeInfo currentStage={currentStage} />}
      </div>

      {/* Loading overlay shown while the 3D assets load */}
      <div
        className={`absolute inset-0 z-[5] flex flex-col items-center justify-center transition-opacity duration-500 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 ${
          showLoader ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="relative mb-6">
          <div className="w-28 h-28 border-4 border-slate-600 border-t-sky-400 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-slate-600 border-b-indigo-400 rounded-full animate-spin" />
          </div>
        </div>
        <p className="mb-4 text-sm font-medium tracking-wide text-slate-300">
          {LOAD_MESSAGES[loadMessage]}
        </p>
        <div className="w-64 h-2 overflow-hidden bg-slate-700 rounded-full">
          <div
            className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full transition-all duration-200"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-400">{Math.round(progress)}%</p>
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
          <Office3
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
