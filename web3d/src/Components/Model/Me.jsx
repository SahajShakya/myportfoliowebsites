/* eslint-disable react/prop-types */
/* eslint-disable react/no-unknown-property */

import  { useRef, useEffect, useCallback } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { a } from '@react-spring/three'
import me from "../../assets/3d/Gemini_Generated_Image_7janx37janx37jan.glb"

export function Me({ isRotating, setIsRotating, ...props }) {
  const meRef = useRef()
  const { nodes } = useGLTF(me)
  const { gl, viewport } = useThree()

  const lastX = useRef(0)
  const rotationSpeed = useRef(0)
  const dampingFactor = 0.95

  const handlePointerDown = useCallback((event) => {
    event.stopPropagation()
    event.preventDefault()
    setIsRotating(true)
    const clientX = event.touches ? event.touches[0].clientX : event.clientX
    lastX.current = clientX
  }, [setIsRotating])

  const handlePointerUp = useCallback((event) => {
    event.stopPropagation()
    event.preventDefault()
    setIsRotating(false)
  }, [setIsRotating])

  const handlePointerMove = useCallback((event) => {
    event.stopPropagation()
    event.preventDefault()
    if (isRotating) {
      const clientX = event.touches ? event.touches[0].clientX : event.clientX
      const delta = (clientX - lastX.current) / viewport.width
      meRef.current.rotation.y += delta * 0.01 * Math.PI
      lastX.current = clientX
      rotationSpeed.current = delta * 0.01 * Math.PI
    }
  }, [isRotating, viewport.width])

  const handleKeyDown = useCallback((event) => {
    if (event.key === "ArrowLeft") {
      if (!isRotating) setIsRotating(true)
      meRef.current.rotation.y += 0.005 * Math.PI
      rotationSpeed.current = 0.007
    } else if (event.key === "ArrowRight") {
      if (!isRotating) setIsRotating(true)
      meRef.current.rotation.y -= 0.005 * Math.PI
      rotationSpeed.current = -0.007
    }
  }, [isRotating, setIsRotating])

  const handleKeyUp = useCallback((event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      setIsRotating(false)
    }
  }, [setIsRotating])

  useEffect(() => {
    const canvas = gl.domElement
    canvas.addEventListener("pointerdown", handlePointerDown)
    canvas.addEventListener("pointerup", handlePointerUp)
    canvas.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    canvas.addEventListener("touchstart", handlePointerDown)
    canvas.addEventListener("touchend", handlePointerUp)
    canvas.addEventListener("touchmove", handlePointerMove)

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown)
      canvas.removeEventListener("pointerup", handlePointerUp)
      canvas.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      canvas.removeEventListener("touchstart", handlePointerDown)
      canvas.removeEventListener("touchend", handlePointerUp)
      canvas.removeEventListener("touchmove", handlePointerMove)
    }
  }, [gl, handlePointerDown, handlePointerUp, handlePointerMove, handleKeyDown, handleKeyUp])

  useFrame(() => {
    if (!isRotating) {
      rotationSpeed.current *= dampingFactor
      if (Math.abs(rotationSpeed.current) < 0.001) {
        rotationSpeed.current = 0
      }
      meRef.current.rotation.y += rotationSpeed.current
    }
  })

  return (
    <a.group {...props} ref={meRef}>
      <mesh
        geometry={nodes.mesh_0.geometry}
        material={nodes.mesh_0.material}
      />
      <mesh
        geometry={nodes.mesh_1.geometry}
        material={nodes.mesh_1.material}
        position={[-0.504, 0, 0]}
      />
      <mesh
        geometry={nodes.mesh_2.geometry}
        material={nodes.mesh_2.material}
        position={[0.504, 0, 0]}
      />
      <mesh
        geometry={nodes.mesh_3.geometry}
        material={nodes.mesh_3.material}
        position={[0, 0.515, 0]}
      />
      <mesh
        geometry={nodes.mesh_4.geometry}
        material={nodes.mesh_4.material}
        position={[0, -0.515, 0]}
      />
    </a.group>
  )
}

export default Me
