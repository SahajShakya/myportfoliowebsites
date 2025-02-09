import React, { useState, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import webContactScene from "../../assets/3d/weblogo.glb";

const WebContact = () => {
  const [error, setError] = useState(null);
  const { scene, error: gltfError } = useGLTF(webContactScene);

  useEffect(() => {
    if (gltfError) {
      setError("Failed to load GLTF model");
    }
  }, [gltfError]);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <mesh>
      <primitive object={scene} />
    </mesh>
  );
};

export default WebContact;
