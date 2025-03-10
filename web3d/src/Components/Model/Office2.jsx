/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
*/

import React, { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import OfficeScene from "../../assets/3d/test2.glb";
import { a } from "@react-spring/three";

const Office2 = ({
  isRotating,
  setIsRotating,
  setCurrentStage,
  currentFocusPoint,
  ...props
}) => {
  const islandRef = useRef();
  // Get access to the Three.js renderer and viewport
  const { gl, viewport } = useThree();
  const { nodes, materials } = useGLTF(OfficeScene);

  // Use a ref for the last mouse x position
  const lastX = useRef(0);
  // Use a ref for rotation speed
  const rotationSpeed = useRef(0);
  // Define a damping factor to control rotation damping
  const dampingFactor = 0.95;

  // Handle pointer (mouse or touch) down event
  const handlePointerDown = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setIsRotating(true);

    // Calculate the clientX based on whether it's a touch event or a mouse event
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;

    // Store the current clientX position for reference
    lastX.current = clientX;
  };

  // Handle pointer (mouse or touch) up event
  const handlePointerUp = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setIsRotating(false);
  };

  // Handle pointer (mouse or touch) move event
  const handlePointerMove = (event) => {
    event.stopPropagation();
    event.preventDefault();
    if (isRotating) {
      // If rotation is enabled, calculate the change in clientX position
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;

      // calculate the change in the horizontal position of the mouse cursor or touch input,
      // relative to the viewport's width
      const delta = (clientX - lastX.current) / viewport.width;

      // Update the island's rotation based on the mouse/touch movement
      islandRef.current.rotation.y += delta * 0.01 * Math.PI;

      // Update the reference for the last clientX position
      lastX.current = clientX;

      // Update the rotation speed
      rotationSpeed.current = delta * 0.01 * Math.PI;
    }
  };

  // Handle keydown events
  const handleKeyDown = (event) => {
    if (event.key === "ArrowLeft") {
      if (!isRotating) setIsRotating(true);

      islandRef.current.rotation.y += 0.005 * Math.PI;
      rotationSpeed.current = 0.007;
    } else if (event.key === "ArrowRight") {
      if (!isRotating) setIsRotating(true);

      islandRef.current.rotation.y -= 0.005 * Math.PI;
      rotationSpeed.current = -0.007;
    }
  };

  // Handle keyup events
  const handleKeyUp = (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      setIsRotating(false);
    }
  };

  // Touch events for mobile devices
  const handleTouchStart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsRotating(true);

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    lastX.current = clientX;
  };

  const handleTouchEnd = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsRotating(false);
  };

  const handleTouchMove = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (isRotating) {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const delta = (clientX - lastX.current) / viewport.width;

      islandRef.current.rotation.y += delta * 0.01 * Math.PI;
      lastX.current = clientX;
      rotationSpeed.current = delta * 0.01 * Math.PI;
    }
  };

  useEffect(() => {
    // Add event listeners for pointer and keyboard events
    const canvas = gl.domElement;
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchend", handleTouchEnd);
    canvas.addEventListener("touchmove", handleTouchMove);

    // Remove event listeners when component unmounts
    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.removeEventListener("touchmove", handleTouchMove);
    };
  }, [gl, handlePointerDown, handlePointerUp, handlePointerMove]);

  // This function is called on each frame update
  useFrame(() => {
    // If not rotating, apply damping to slow down the rotation (smoothly)
    if (!isRotating) {
      // Apply damping factor
      rotationSpeed.current *= dampingFactor;

      // Stop rotation when speed is very small
      if (Math.abs(rotationSpeed.current) < 0.001) {
        rotationSpeed.current = 0;
      }

      islandRef.current.rotation.y += rotationSpeed.current;
    } else {
      // When rotating, determine the current stage based on island's orientation
      const rotation = islandRef.current.rotation.y;

      /**
       * Normalize the rotation value to ensure it stays within the range [0, 2 * Math.PI].
       * The goal is to ensure that the rotation value remains within a specific range to
       * prevent potential issues with very large or negative rotation values.
       *  Here's a step-by-step explanation of what this code does:
       *  1. rotation % (2 * Math.PI) calculates the remainder of the rotation value when divided
       *     by 2 * Math.PI. This essentially wraps the rotation value around once it reaches a
       *     full circle (360 degrees) so that it stays within the range of 0 to 2 * Math.PI.
       *  2. (rotation % (2 * Math.PI)) + 2 * Math.PI adds 2 * Math.PI to the result from step 1.
       *     This is done to ensure that the value remains positive and within the range of
       *     0 to 2 * Math.PI even if it was negative after the modulo operation in step 1.
       *  3. Finally, ((rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) applies another
       *     modulo operation to the value obtained in step 2. This step guarantees that the value
       *     always stays within the range of 0 to 2 * Math.PI, which is equivalent to a full
       *     circle in radians.
       */
      const normalizedRotation =
        ((rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

      // console.log(normalizedRotation);

      // Set the current stage based on the island's orientation
      switch (true) {
        case normalizedRotation >= 5.93 || normalizedRotation <= 0.35:
          setCurrentStage(3);
          break;

        // Stage 2: This range is straightforward (1.6 to 2.5)
        case normalizedRotation >= 1.6 && normalizedRotation <= 3:
          setCurrentStage(2);
          break;

        // Stage 1: This range is straightforward (4.25 to 4.75)
        case normalizedRotation >= 4.25 && normalizedRotation <= 4.75:
          setCurrentStage(1);
          break;

        // Stage 1: This range is straightforward (4.25 to 4.75)
        case normalizedRotation >= 3.2 && normalizedRotation <= 2.2:
          setCurrentStage(6);
          break;

        // Stage 4: This range wraps from 5.0 to 1.0 (ensure this doesn't run after 2)
        case normalizedRotation >= 5.0 && normalizedRotation <= 5.93:
          setCurrentStage(4);
          break;
        case normalizedRotation >= 0.36 && normalizedRotation <= 1.164:
          setCurrentStage(5);
          break;

        default:
          setCurrentStage(null);
      }
    }
  });

  return (
    <a.group {...props} ref={islandRef}>
      <mesh
        geometry={nodes.Cube.geometry}
        material={materials.Material}
        position={[0, 0.331, 0]}
        rotation={[-Math.PI, 0, -Math.PI]}
        scale={[0.74, 0.287, 0.74]}
      />
      <group scale={0.01}>
        <group scale={100}>
          <group rotation={[-Math.PI / 2, 0, 0]} scale={0.008}>
            <group rotation={[Math.PI / 2, 0, 0]}>
              <group
                position={[-123.493, 1.133, 64.664]}
                rotation={[-Math.PI / 2, 0, -2.988]}
                scale={100}
              >
                <mesh
                  geometry={
                    nodes.Archinteriors8_01_292_003_Esmalte_Preto_001_0001
                      .geometry
                  }
                  material={materials.Esmalte_Preto_001}
                />
                <mesh
                  geometry={
                    nodes.Archinteriors8_01_292_003_Material_004_0001.geometry
                  }
                  material={materials.Material_004}
                />
              </group>
              <group
                position={[83.984, 227.115, 272.869]}
                rotation={[-Math.PI / 2, 0, -Math.PI]}
                scale={109.963}
              >
                <mesh
                  geometry={nodes.books_005_books_003_0001.geometry}
                  material={materials.books_003}
                />
                <mesh
                  geometry={nodes.books_005_books_003_0002.geometry}
                  material={materials.books_003}
                  position={[2.726, 0.689, -0.334]}
                  rotation={[0, 0, 1.539]}
                  scale={[0.584, 1, 1]}
                />
                <mesh
                  geometry={nodes.books_005_books_003_0003.geometry}
                  material={materials.books_003}
                  position={[-0.092, 0.712, -0.618]}
                  rotation={[0, 0, 1.539]}
                  scale={[0.584, 1, 1]}
                />
                <mesh
                  geometry={nodes.books_005_books_paper_002_0001.geometry}
                  material={materials.books_paper_002}
                />
              </group>
              <group
                position={[108.26, 44.492, -116.527]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={[4.659, 3.09, 3.015]}
              >
                <mesh
                  geometry={nodes.Box323536_001_Cabinet_color_001_0001.geometry}
                  material={materials.Cabinet_color_001}
                />
                <mesh
                  geometry={
                    nodes.Box323536_001_Cabinet_Handle_001_0001.geometry
                  }
                  material={materials.Cabinet_Handle_001}
                />
                <mesh
                  geometry={nodes.Box323536_001_Cabinet_Wood_001_0001.geometry}
                  material={materials.Cabinet_Wood_001}
                />
              </group>
              <group
                position={[-39.701, 109.763, 134.386]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={7.178}
              >
                <mesh
                  geometry={nodes.Circle_001_PC1GlossyPin_001_0001.geometry}
                  material={materials.PC1GlossyPin_001}
                />
                <mesh
                  geometry={nodes.Circle_001_PC1Material_008_0001.geometry}
                  material={materials.PC1Material_008}
                />
                <mesh
                  geometry={nodes.Circle_001_PC1Material_009_0001.geometry}
                  material={materials.PC1Material_009}
                />
                <mesh
                  geometry={nodes.Circle_001_PC1Material_015_0001.geometry}
                  material={materials.PC1Material_015}
                />
                <mesh
                  geometry={nodes.Circle_001_PC1Material_016_0001.geometry}
                  material={materials.PC1Material_016}
                />
                <mesh
                  geometry={nodes.Circle_001_PC1PenBlackpart_001_0001.geometry}
                  material={materials.PC1PenBlackpart_001}
                />
                <mesh
                  geometry={
                    nodes.Circle_001_PC1PenGlossyPart1_001_0001.geometry
                  }
                  material={materials.PC1PenGlossyPart1_001}
                />
                <mesh
                  geometry={nodes.Circle_001_PC1WireInGlas_0001.geometry}
                  material={materials.PC1WireInGlas}
                />
              </group>
              <group
                position={[6.5, 109.763, -135.082]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={7.178}
              >
                <mesh
                  geometry={nodes.Circle_002_PC1GlossyPin_001_0001.geometry}
                  material={materials.PC1GlossyPin_001}
                />
                <mesh
                  geometry={nodes.Circle_002_PC1Material_008_0001.geometry}
                  material={materials.PC1Material_008}
                />
                <mesh
                  geometry={nodes.Circle_002_PC1Material_009_0001.geometry}
                  material={materials.PC1Material_009}
                />
                <mesh
                  geometry={nodes.Circle_002_PC1Material_015_0001.geometry}
                  material={materials.PC1Material_015}
                />
                <mesh
                  geometry={nodes.Circle_002_PC1Material_016_0001.geometry}
                  material={materials.PC1Material_016}
                />
                <mesh
                  geometry={nodes.Circle_002_PC1PenBlackpart_001_0001.geometry}
                  material={materials.PC1PenBlackpart_001}
                />
                <mesh
                  geometry={
                    nodes.Circle_002_PC1PenGlossyPart1_001_0001.geometry
                  }
                  material={materials.PC1PenGlossyPart1_001}
                />
                <mesh
                  geometry={nodes.Circle_002_PC1WireInGlas_0001.geometry}
                  material={materials.PC1WireInGlas}
                />
              </group>
              <group rotation={[-Math.PI / 2, 0, 0]} scale={100}>
                <mesh
                  geometry={nodes.Cube__0001.geometry}
                  material={materials.Cube__0}
                />
                <mesh
                  geometry={nodes.Cube__0002.geometry}
                  material={materials.Cube__0}
                  position={[-4.554, -3.834, -0.4]}
                  rotation={[0, 0, 1.538]}
                  scale={[0.665, 1, 1]}
                />
                <mesh
                  geometry={nodes.Cube__0003.geometry}
                  material={materials.Cube__0}
                  position={[-1.682, -4.08, -0.035]}
                  rotation={[0, 0, 1.538]}
                  scale={[0.781, 1, 1]}
                />
              </group>
              <mesh
                geometry={nodes.Cube_001_Light_Fixture_0001.geometry}
                material={materials.Light_Fixture}
                position={[-243.376, 374.575, -81.939]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={[17.475, 221.057, 14.36]}
              />
              <group
                position={[414.959, 364.929, 481.161]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={5.07}
              >
                <mesh
                  geometry={nodes.Cylinder_Inner_Light_case_0001.geometry}
                  material={materials.Inner_Light_case}
                  position={[-42.314, -12.327, 4.353]}
                />
                <mesh
                  geometry={nodes.Cylinder_Inner_light_emission_0001.geometry}
                  material={materials.Inner_light_emission}
                />
              </group>
              <group
                position={[-0.475, 364.929, -79.019]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={7.313}
              >
                <mesh
                  geometry={nodes.Cylinder_001_Light_Case_0001.geometry}
                  material={materials.Light_Case}
                />
                <mesh
                  geometry={nodes.Cylinder_001_Light_emission_0001.geometry}
                  material={materials.Light_emission}
                />
              </group>
              <group
                position={[-244.636, 364.929, -79.019]}
                rotation={[-Math.PI / 2, -0.322, 0]}
                scale={7.313}
              >
                <mesh
                  geometry={nodes.Cylinder_002_Light_Case_0001.geometry}
                  material={materials.Light_Case}
                />
                <mesh
                  geometry={nodes.Cylinder_002_Light_emission_0001.geometry}
                  material={materials.Light_emission}
                />
              </group>
              <group
                position={[243.686, 364.929, -79.019]}
                rotation={[-Math.PI / 2, 0.291, 0]}
                scale={7.313}
              >
                <mesh
                  geometry={nodes.Cylinder_003_Light_Case_0001.geometry}
                  material={materials.Light_Case}
                />
                <mesh
                  geometry={nodes.Cylinder_003_Light_emission_0001.geometry}
                  material={materials.Light_emission}
                />
              </group>
              <group
                position={[-244.636, 364.929, 122.199]}
                rotation={[-Math.PI / 2, -0.211, 0]}
                scale={7.313}
              >
                <mesh
                  geometry={nodes.Cylinder_004_Light_Case_0001.geometry}
                  material={materials.Light_Case}
                />
                <mesh
                  geometry={nodes.Cylinder_004_Light_emission_0001.geometry}
                  material={materials.Light_emission}
                />
              </group>
              <group
                position={[-0.475, 364.929, 122.199]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={7.313}
              >
                <mesh
                  geometry={nodes.Cylinder_005_Light_Case_0001.geometry}
                  material={materials.Light_Case}
                />
                <mesh
                  geometry={nodes.Cylinder_005_Light_emission_0001.geometry}
                  material={materials.Light_emission}
                />
              </group>
              <group
                position={[243.686, 364.929, 122.199]}
                rotation={[-1.465, 0.287, -0.38]}
                scale={7.313}
              >
                <mesh
                  geometry={nodes.Cylinder_006_Light_Case_0001.geometry}
                  material={materials.Light_Case}
                />
                <mesh
                  geometry={nodes.Cylinder_006_Light_emission_0001.geometry}
                  material={materials.Light_emission}
                />
              </group>
              <group
                position={[-244.636, 364.929, -285.145]}
                rotation={[-Math.PI / 2, -0.339, 0]}
                scale={7.313}
              >
                <mesh
                  geometry={nodes.Cylinder_007_Light_Case_0001.geometry}
                  material={materials.Light_Case}
                />
                <mesh
                  geometry={nodes.Cylinder_007_Light_emission_0001.geometry}
                  material={materials.Light_emission}
                />
              </group>
              <group
                position={[-0.475, 364.929, -285.145]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={7.313}
              >
                <mesh
                  geometry={nodes.Cylinder_008_Light_Case_0001.geometry}
                  material={materials.Light_Case}
                />
                <mesh
                  geometry={nodes.Cylinder_008_Light_emission_0001.geometry}
                  material={materials.Light_emission}
                />
              </group>
              <group
                position={[243.686, 364.929, -285.145]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={7.313}
              >
                <mesh
                  geometry={nodes.Cylinder_009_Light_Case_0001.geometry}
                  material={materials.Light_Case}
                />
                <mesh
                  geometry={nodes.Cylinder_009_Light_emission_0001.geometry}
                  material={materials.Light_emission}
                />
              </group>
              <mesh
                geometry={nodes.low_poly_001_PC2_CUP_0001.geometry}
                material={materials.PC2_CUP}
                position={[-96.934, 104.672, -179.34]}
                rotation={[Math.PI, -1.218, Math.PI]}
                scale={104.361}
              />
              <mesh
                geometry={nodes.low_poly_012_Black5_001_0001.geometry}
                material={materials.Black5_001}
                position={[89.963, 21.688, 0]}
                rotation={[Math.PI / 2, 0, 0]}
                scale={100}
              />
              <mesh
                geometry={nodes.low_poly_013_Green1_0001.geometry}
                material={materials.Green1}
                position={[89.963, 21.688, 0]}
                rotation={[Math.PI / 2, 0, 0]}
                scale={100}
              />
              <mesh
                geometry={nodes.low_poly_014_Black5_0001.geometry}
                material={materials.PC1WireInGlas}
                position={[928.261, 144.487, -287.716]}
                rotation={[Math.PI / 2, 0, 0]}
                scale={100}
              />
              <mesh
                geometry={nodes.low_poly_018_PC2_CUP_0001.geometry}
                material={materials.PC2_CUP}
                position={[-96.934, 104.672, -9.247]}
                rotation={[Math.PI, -1.218, Math.PI]}
                scale={104.361}
              />
              <mesh
                geometry={nodes.low_poly_025_Blue3_0001.geometry}
                material={materials.Blue3}
                position={[89.963, 21.688, 0]}
                rotation={[Math.PI / 2, 0, 0]}
                scale={100}
              />
              <mesh
                geometry={
                  nodes.Monitor_27__Curved_001_PC1MOUSE_PAD_0001.geometry
                }
                material={materials.PC1MOUSE_PAD}
                position={[-98.322, 98.079, 66.16]}
                rotation={[-Math.PI, 0.004, -Math.PI]}
                scale={4.887}
              />
              <group
                position={[-53.651, 132.925, 46.362]}
                rotation={[-Math.PI, 0.004, -Math.PI]}
                scale={4.887}
              >
                <mesh
                  geometry={
                    nodes.Monitor_27__Curved_002_PC_1Back_Panel_0001.geometry
                  }
                  material={materials.PC_1Back_Panel}
                />
                <mesh
                  geometry={
                    nodes.Monitor_27__Curved_002_PC_1Stand_0001.geometry
                  }
                  material={materials.PC_1Stand}
                />
                <mesh
                  geometry={
                    nodes.Monitor_27__Curved_002_PC_1Wallpaper_0001.geometry
                  }
                  material={materials.PC_1Wallpaper}
                />
                <mesh
                  geometry={
                    nodes.Monitor_27__Curved_002_PC_1Wallpaper_0002.geometry
                  }
                  material={materials.PC_1Wallpaper}
                  position={[-36.024, 18.099, -72.74]}
                  rotation={[-Math.PI, 0.03, -Math.PI]}
                  scale={[1.001, 1.529, 1.381]}
                />
              </group>
              <mesh
                geometry={
                  nodes.Monitor_27__Curved_003_PC_1_Keyboard_0001.geometry
                }
                material={materials.PC_1_Keyboard}
                position={[-100.191, 98.17, 38.896]}
                rotation={[-Math.PI, 0.004, -Math.PI]}
                scale={4.887}
              />
              <mesh
                geometry={nodes.Monitor_27__Curved_004_PC1MOUSE_0001.geometry}
                material={materials.PC1MOUSE}
                position={[-98.322, 98.079, 66.16]}
                rotation={[-Math.PI, 0.004, -Math.PI]}
                scale={4.887}
              />
              <group
                position={[1.104, 94.98, -60.764]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={[129.712, 201.896, 100]}
              >
                <mesh
                  geometry={nodes.Plane_Material_003_0001.geometry}
                  material={materials.Material_003}
                />
                <mesh
                  geometry={nodes.Plane_Material_003_0002.geometry}
                  material={materials.Material_003}
                  position={[1.335, -2.355, 0.05]}
                  scale={[0.452, 0.4, 1]}
                />
              </group>
              <group rotation={[Math.PI, 0, 0]} scale={[264.514, 195.858, 100]}>
                <mesh
                  geometry={nodes.Plane_002_White_0001.geometry}
                  material={materials.White}
                  position={[-0.001, -0.078, 0.013]}
                />
              </group>
              <group
                position={[0, 1.545, -100.308]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={103.318}
              >
                <mesh
                  geometry={nodes.Plane_013_Floor_0001.geometry}
                  material={materials.Floor}
                  position={[0.357, -1.992, -0.037]}
                  scale={[0.539, 0.778, 1]}
                />
                <mesh
                  geometry={nodes.Plane_013_Floor_0002.geometry}
                  material={materials.Floor}
                  position={[-0.201, -1.573, 3.781]}
                  scale={[0.539, 0.778, 1]}
                />
              </group>
              <mesh
                geometry={nodes.Plane_014_Material_002_0001.geometry}
                material={materials.Material_002}
                position={[0, 0, -100.308]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={[515.103, 398.369, 398.369]}
              />
              <group
                position={[87.241, 97.398, 7.543]}
                rotation={[-Math.PI / 2, 0, 1.834]}
                scale={1.237}
              >
                <mesh
                  geometry={nodes.R_Mouse_00_001_PC2_BODY_0001.geometry}
                  material={materials.PC2_BODY}
                />
                <mesh
                  geometry={nodes.R_Mouse_00_001_PC2_SCREEN_0001.geometry}
                  material={materials.PC2_SCREEN}
                />
              </group>
              <mesh
                geometry={nodes.R_Mouse_00_002_PC2_MOUSEPAD_0001.geometry}
                material={materials.PC2_MOUSEPAD}
                position={[92.88, 98.081, 42.961]}
                rotation={[-Math.PI / 2, 0, 1.834]}
                scale={1.237}
              />
              <mesh
                geometry={nodes.R_Mouse_00_003_PC2_KEYBOARD_0001.geometry}
                material={materials.PC2_KEYBOARD}
                position={[94.34, 98.17, 59.888]}
                rotation={[-Math.PI / 2, 0, 1.834]}
                scale={1.237}
              />
              <mesh
                geometry={nodes.R_Mouse_00_004_PC2_MOUSE_0001.geometry}
                material={materials.PC2_MOUSE}
                position={[92.88, 98.081, 42.961]}
                rotation={[-Math.PI / 2, 0, 1.834]}
                scale={1.237}
              />
              <group
                position={[56.094, 110.061, -259.265]}
                rotation={[0, 1.571, 0]}
                scale={1.702}
              >
                <mesh
                  geometry={nodes.surface_SURFACE_2_KEYBOARD_0001.geometry}
                  material={materials.SURFACE_2_KEYBOARD}
                />
                <mesh
                  geometry={nodes.surface_SURFACE_2_SCREEN_0001.geometry}
                  material={materials.SURFACE_2_SCREEN}
                />
              </group>
              <group
                position={[56.094, 110.061, -259.265]}
                rotation={[0, 1.571, 0]}
                scale={1.702}
              >
                <mesh
                  geometry={nodes.surface_001_SURFACE_1_KEYBOARD_0001.geometry}
                  material={materials.PC1WireInGlas}
                />
                <mesh
                  geometry={nodes.surface_001_SURFACE_1_SCREEN_0001.geometry}
                  material={materials.SURFACE_1_SCREEN}
                />
              </group>
              <group
                position={[-91.47, 95.896, -232.847]}
                rotation={[-1.596, 0.245, -1.468]}
                scale={41.664}
              >
                <mesh
                  geometry={nodes.tela_LAP_1_BLACK_FRAME_0001.geometry}
                  material={materials.LAP_1_BLACK_FRAME}
                />
                <mesh
                  geometry={nodes.tela_LAP_1_BODY_0001.geometry}
                  material={materials.LAP_1_BODY}
                />
                <mesh
                  geometry={nodes.tela_LAP_1_KEYBOARD_0001.geometry}
                  material={materials.LAP_1_KEYBOARD}
                />
                <mesh
                  geometry={nodes.tela_LAP_1SCREEN_0001.geometry}
                  material={materials.LAP_1SCREEN}
                />
              </group>
            </group>
          </group>
        </group>
      </group>
      <group scale={0.01}>
        <group scale={100}>
          <group rotation={[-Math.PI / 2, 0, 0]} scale={0.008}>
            <group rotation={[Math.PI / 2, 0, 0]}>
              <mesh
                geometry={
                  nodes.Monitor_27__Curved_002_PC_1Back_Panel_0002.geometry
                }
                material={materials["PC_1Back_Panel.001"]}
                position={[-53.651, 132.925, 46.362]}
                rotation={[-Math.PI, 0.004, -Math.PI]}
                scale={4.887}
              />
            </group>
          </group>
        </group>
      </group>
    </a.group>
  );
};

export default Office2;
