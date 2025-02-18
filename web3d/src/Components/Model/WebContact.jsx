// WebContact.js
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const WebContact = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    // Initialize the scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Initialize the renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Initialize the GLTFLoader
    const loader = new GLTFLoader();

    // Load the 3D model
    loader.load(
      "../../assets/3d/weblogo.glb",
      (gltf) => {
        const model = gltf.scene;
        scene.add(model);

        // Set initial camera position
        camera.position.z = 5;

        // Animation loop
        const animate = () => {
          requestAnimationFrame(animate);

          // Rotate the model
          model.rotation.x += 0.01;
          model.rotation.y += 0.01;

          // Render the scene
          renderer.render(scene, camera);
        };
        animate();
      },
      undefined,
      (error) => {
        console.error(error);
      }
    );

    // Handle window resizing
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
};

export default WebContact;
