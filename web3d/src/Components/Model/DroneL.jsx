import React, { useRef, useEffect } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import droneScene from "../../assets/3d/drone.glb";
import { useFrame } from "@react-three/fiber";

const Drone = ({ planePosition, planeScale, isRotating, rotation }) => {
  const droneRef = useRef();
  const { scene, animations } = useGLTF(droneScene);
  // const { actions } = useAnimations(animations, droneRef);

  // useEffect(() => {
  //   if (actions && actions["Start_Liftoff"]) {
  //     actions["Start_Liftoff"].play();
  //   }
  // }, [actions]);

  useFrame((state) => {
    droneRef.current.position.y =
      Math.sin(state.clock.getElapsedTime()) * 0.2 + 2;

    if (droneRef.current.position.x > state.camera.position.x + 10) {
      droneRef.current.position.y = Math.PI;
    } else if (droneRef.current.position.x < state.camera.position.x - 10) {
      droneRef.current.position.y = 0;
    }

    if ((droneRef.current, rotation.y == 0)) {
      droneRef.current.position.x -= 0.01;
      droneRef.current.position.z -= 1;
    } else {
      droneRef.current.position.x += 0.01;
      droneRef.current.position.z -= 0.01;
    }
  });

  return (
    <mesh
      position={planePosition}
      scale={planeScale}
      rotation={rotation}
      ref={droneRef}
    >
      <primitive object={scene} />
    </mesh>
  );
};

export default Drone;
