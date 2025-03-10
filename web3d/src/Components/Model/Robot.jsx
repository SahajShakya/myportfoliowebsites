import React, { useEffect } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import robotScene from "../../assets/3d/robot_idle_animated.glb";

const Robot = ({ isRotating, robotScale, robotPosition, ...props }) => {
  const ref = React.useRef();
  const { scene, animations } = useGLTF(robotScene);
  const { actions } = useAnimations(animations, ref);

  useEffect(() => {
    if (isRotating) {
      // Access the specific action you want to play
      // const bodyAction = actions['Skelett|SkelettAction'];
      if (actions && actions["Skelett|SkelettAction"]) {
        actions["Skelett|SkelettAction"].play();
      }
    } else {
      // actions['Skelett|SkelettAction'].stop();
    }
  }, [actions, isRotating]);

  return (
    <mesh position={robotPosition} scale={robotScale} rotation={[0, 5, 0]}>
      <primitive object={scene} />
    </mesh>
  );
};

export default Robot;
