import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment,
  Text,
  Html,
  Stars,
  Sky,
  useTexture,
  Sparkles,
  Float
} from '@react-three/drei';
import * as THREE from 'three';
import axiosInstance from '../../config/axios.config';
import { toast } from 'react-toastify';
import { 
  FiRefreshCw, 
  FiGrid, 
  FiLayers, 
  FiPlay, 
  FiPause,
  FiVolume2,
  FiVolumeX,
  FiMaximize2,
  FiInfo,
  FiEye,
  FiCamera
} from 'react-icons/fi';

/**
 * Animated Water Shader Material
 */
const WaterShader = {
  uniforms: {
    time: { value: 0 },
    colorShallow: { value: new THREE.Color('#4dd0e1') },
    colorDeep: { value: new THREE.Color('#006064') },
    transparency: { value: 0.8 }
  },
  vertexShader: `
    uniform float time;
    varying vec2 vUv;
    varying float vElevation;
    
    void main() {
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      
      // Create wave animation
      float elevation = sin(modelPosition.x * 0.02 + time * 0.5) * 0.5;
      elevation += sin(modelPosition.z * 0.02 + time * 0.3) * 0.3;
      
      modelPosition.y += elevation;
      
      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectedPosition = projectionMatrix * viewPosition;
      
      gl_Position = projectedPosition;
      
      vUv = uv;
      vElevation = elevation;
    }
  `,
  fragmentShader: `
    uniform vec3 colorShallow;
    uniform vec3 colorDeep;
    uniform float transparency;
    varying vec2 vUv;
    varying float vElevation;
    
    void main() {
      float depth = vElevation * 0.5 + 0.5;
      vec3 color = mix(colorDeep, colorShallow, depth);
      
      // Add shimmer effect
      float shimmer = sin(vUv.x * 20.0 + vUv.y * 20.0) * 0.1;
      color += shimmer;
      
      gl_FragColor = vec4(color, transparency);
    }
  `
};

/**
 * Enhanced Ocean Surface with Animation
 */
function AnimatedOceanSurface({ bathymetryData, wireframe, showTemperature, animationSpeed }) {
  const meshRef = useRef();
  const materialRef = useRef();

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.getElapsedTime() * animationSpeed;
    }
  });

  const { geometry, colors } = useMemo(() => {
    if (!bathymetryData || !bathymetryData.grid) return { geometry: null, colors: null };

    const grid = bathymetryData.grid;
    const resolution = Math.sqrt(grid.length);
    
    const geo = new THREE.PlaneGeometry(
      bathymetryData.metadata.extent,
      bathymetryData.metadata.extent,
      resolution - 1,
      resolution - 1
    );

    const positions = geo.attributes.position.array;
    const colorArray = new Float32Array(positions.length);
    
    const minDepth = bathymetryData.metadata.minDepth;
    const maxDepth = bathymetryData.metadata.maxDepth;
    const depthRange = maxDepth - minDepth;

    for (let i = 0; i < grid.length; i++) {
      const vertexIndex = i * 3;
      positions[vertexIndex + 2] = grid[i].depth / 50; // Enhanced scaling

      const normalizedDepth = (grid[i].depth - minDepth) / depthRange;
      
      if (showTemperature) {
        const temp = 1 - normalizedDepth;
        colorArray[vertexIndex] = temp * 0.8 + 0.2;
        colorArray[vertexIndex + 1] = 0.4 + temp * 0.3;
        colorArray[vertexIndex + 2] = (1 - temp) * 0.9 + 0.1;
      } else {
        // Enhanced depth gradient with more vibrant colors
        colorArray[vertexIndex] = 0.1 + normalizedDepth * 0.4;
        colorArray[vertexIndex + 1] = 0.5 + normalizedDepth * 0.4;
        colorArray[vertexIndex + 2] = 0.95 - normalizedDepth * 0.3;
      }
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    geo.computeVertexNormals();

    return { geometry: geo, colors: colorArray };
  }, [bathymetryData, showTemperature]);

  if (!geometry) return null;

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      {wireframe ? (
        <meshStandardMaterial
          vertexColors
          wireframe={true}
          color="#4dd0e1"
          emissive="#006064"
          emissiveIntensity={0.2}
        />
      ) : (
        <shaderMaterial
          ref={materialRef}
          {...WaterShader}
          vertexColors
          transparent
          side={THREE.DoubleSide}
        />
      )}
    </mesh>
  );
}

/**
 * Enhanced Species Distribution with Animation
 */
function EnhancedSpeciesOverlay({ bathymetryData, animationSpeed }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * animationSpeed * 0.1) * 0.1;
    }
  });

  const markers = useMemo(() => {
    if (!bathymetryData || !bathymetryData.grid) return [];
    
    const grid = bathymetryData.grid;
    const samples = [];
    const sampleCount = Math.min(50, Math.floor(grid.length / 5));
    
    for (let i = 0; i < sampleCount; i++) {
      const randomIndex = Math.floor(Math.random() * grid.length);
      const point = grid[randomIndex];
      
      const extent = bathymetryData.metadata.extent;
      const resolution = Math.sqrt(grid.length);
      const x = ((randomIndex % resolution) / (resolution - 1) - 0.5) * extent;
      const z = (Math.floor(randomIndex / resolution) / (resolution - 1) - 0.5) * extent;
      const y = point.depth / 50 + 3;
      
      samples.push({
        position: [x, y, z],
        color: new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.8, 0.6),
        size: Math.random() * 0.5 + 0.2,
        speed: Math.random() * 2 + 1
      });
    }
    
    return samples;
  }, [bathymetryData]);

  return (
    <group ref={groupRef}>
      {markers.map((marker, index) => (
        <Float
          key={index}
          speed={marker.speed}
          rotationIntensity={0.5}
          floatIntensity={0.5}
        >
          <mesh position={marker.position}>
            <sphereGeometry args={[marker.size, 16, 16]} />
            <meshPhongMaterial 
              color={marker.color} 
              emissive={marker.color} 
              emissiveIntensity={0.8}
              transparent
              opacity={0.9}
            />
          </mesh>
        </Float>
      ))}
      <Sparkles
        count={100}
        scale={[bathymetryData?.metadata?.extent || 50, 20, bathymetryData?.metadata?.extent || 50]}
        size={2}
        speed={animationSpeed}
        color="#4dd0e1"
      />
    </group>
  );
}

/**
 * Depth Scale Legend
 */
function DepthLegend({ bathymetryData, position }) {
  if (!bathymetryData) return null;

  const { minDepth, maxDepth } = bathymetryData.metadata;
  const depths = [minDepth, (minDepth + maxDepth) / 2, maxDepth];

  return (
    <Html position={position} center>
      <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white text-xs">
        <div className="font-semibold mb-2">Depth Scale</div>
        {depths.map((depth, i) => (
          <div key={i} className="flex items-center gap-2 mb-1">
            <div 
              className="w-4 h-2 rounded"
              style={{
                backgroundColor: `hsl(${180 + i * 30}, 70%, ${70 - i * 20}%)`
              }}
            />
            <span>{depth.toFixed(0)}m</span>
          </div>
        ))}
      </div>
    </Html>
  );
}

/**
 * Main Enhanced 3D Ocean Depth Visualization Component
 */
function OceanDepth3D() {
  const [bathymetryData, setBathymetryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wireframe, setWireframe] = useState(false);
  const [showSpecies, setShowSpecies] = useState(true);
  const [showTemperature, setShowTemperature] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [isAnimating, setIsAnimating] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [viewMode, setViewMode] = useState('perspective'); // 'perspective', 'orthographic', 'top'
  const [showLegend, setShowLegend] = useState(true);
  
  const controlsRef = useRef();

  useEffect(() => {
    fetchBathymetryData();
  }, []);

  const fetchBathymetryData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get('/dashboard/bathymetry', {
        params: {
          latitude: 20.0,
          longitude: 70.0,
          resolution: 75,
          extent: 15
        }
      });

      setBathymetryData(response.data);
      toast.success('🌊 3D bathymetry data loaded successfully');
    } catch (err) {
      console.error('Error fetching bathymetry data:', err);
      const errorMsg = err.response?.data?.message || 'Failed to load bathymetry data';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (controlsRef.current) {
      switch(mode) {
        case 'top':
          controlsRef.current.object.position.set(0, 100, 0);
          controlsRef.current.object.lookAt(0, 0, 0);
          break;
        case 'side':
          controlsRef.current.object.position.set(100, 20, 0);
          controlsRef.current.object.lookAt(0, 0, 0);
          break;
        default:
          controlsRef.current.object.position.set(0, 50, 100);
          controlsRef.current.object.lookAt(0, 0, 0);
      }
      controlsRef.current.update();
    }
  };

  // Loading state with enhanced animation
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-gradient-to-br from-cyan-50 to-blue-100">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-cyan-200 border-t-cyan-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-20 w-20 border-4 border-blue-200 border-r-blue-600 mx-auto animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <p className="text-cyan-700 text-xl font-semibold">Loading Ocean Depths</p>
            <p className="text-cyan-600">Mapping the underwater world...</p>
          </div>
          <div className="mt-6 flex justify-center space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md shadow-lg">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">🌊</div>
            <p className="text-red-700 mb-6 font-medium">{error}</p>
            <button
              onClick={fetchBathymetryData}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-medium shadow-lg"
            >
              <FiRefreshCw className="inline mr-2" />
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Enhanced Header */}
      <div className="text-center mb-10">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent mb-4">
          🌊 Deep Ocean Explorer
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Dive into the mesmerizing depths of our oceans with this interactive 3D bathymetry visualization
        </p>
      </div>

      {/* Main 3D Visualization Container */}
      <div className="relative bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl shadow-2xl overflow-hidden" style={{ height: '800px' }}>
        
        {/* Enhanced Control Panel */}
        <div className="absolute top-1 right-6 z-20 bg-black backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-6 space-y-4 min-w-[280px]">
          <div className="text-white font-bold text-lg mb-4 flex items-center">
            <FiEye className="mr-2 text-cyan-400" />
            Ocean Controls
          </div>
          
          {/* Animation Controls */}
          <div className="space-y-3">
            <div className="text-white/80 text-sm font-semibold">Animation</div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsAnimating(!isAnimating)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isAnimating
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {isAnimating ? <FiPause className="inline mr-1" /> : <FiPlay className="inline mr-1" />}
                {isAnimating ? 'Pause' : 'Play'}
              </button>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  soundEnabled
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {soundEnabled ? <FiVolume2 /> : <FiVolumeX />}
              </button>
            </div>
            
            <div className="space-y-2">
              <label className="text-white/80 text-sm">Speed: {animationSpeed.toFixed(1)}x</label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
                disabled={!isAnimating}
              />
            </div>
          </div>

          {/* View Mode Controls */}
          <div className="space-y-3">
            <div className="text-white/80 text-sm font-semibold">View Mode</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'perspective', label: '3D View' },
                { key: 'top', label: 'Top View' },
                { key: 'side', label: 'Side View' },
                { key: 'free', label: 'Free Cam' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleViewModeChange(key)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    viewMode === key
                      ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Rendering Controls */}
          <div className="space-y-3">
            <div className="text-white/80 text-sm font-semibold">Rendering</div>
            <div className="flex gap-2">
              <button
                onClick={() => setWireframe(false)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  !wireframe
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Solid
              </button>
              <button
                onClick={() => setWireframe(true)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  wireframe
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <FiGrid className="inline mr-1" />
                Wire
              </button>
            </div>
          </div>

          {/* Layer Toggles */}
          <div className="space-y-3">
            <div className="text-white/80 text-sm font-semibold flex items-center">
              <FiLayers className="mr-1" />
              Data Layers
            </div>
            
            <div className="space-y-2">
              {[
                { key: 'showSpecies', label: 'Marine Life', icon: '🐠', state: showSpecies, setState: setShowSpecies },
                { key: 'showTemperature', label: 'Temperature', icon: '🌡️', state: showTemperature, setState: setShowTemperature },
                { key: 'showLegend', label: 'Depth Legend', icon: '📏', state: showLegend, setState: setShowLegend }
              ].map(({ key, label, icon, state, setState }) => (
                <label key={key} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={state}
                    onChange={(e) => setState(e.target.checked)}
                    className="w-4 h-4 text-cyan-500 rounded focus:ring-cyan-500 focus:ring-2"
                  />
                  <span className="text-sm text-white group-hover:text-cyan-300 transition-colors">
                    {icon} {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleResetCamera}
              className="flex-1 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center"
            >
              <FiRefreshCw className="mr-2" />
              Reset
            </button>
            <button
              onClick={() => {/* Screenshot functionality */}}
              className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-all"
            >
              <FiCamera />
            </button>
          </div>

          {/* Data Info */}
          {bathymetryData && (
            <div className="bg-white/10 rounded-lg p-3 space-y-2 text-xs text-white/80">
              <div className="flex items-center mb-2">
                <FiInfo className="mr-1 text-cyan-400" />
                <span className="font-semibold">Dataset Info</span>
              </div>
              <div>
                <span className="text-white/60">Depth Range:</span>
                <br />
                <span className="text-cyan-300">{bathymetryData.metadata.minDepth.toFixed(0)}m</span> to{' '}
                <span className="text-blue-300">{bathymetryData.metadata.maxDepth.toFixed(0)}m</span>
              </div>
              <div>
                <span className="text-white/60">Resolution:</span> {bathymetryData.metadata.resolution}²
              </div>
              <div>
                <span className="text-white/60">Data Points:</span>{' '}
                {bathymetryData.metadata.dataPoints?.toLocaleString() || 'N/A'}
              </div>
            </div>
          )}
        </div>

        {/* 3D Canvas */}
        <Canvas
          camera={{ 
            position: [0, 60, 120], 
            fov: 60,
            near: 0.1,
            far: 1000
          }}
        >
          {/* Enhanced Environment */}
          <Sky 
            distance={450000}
            sunPosition={[0, 1, 0]}
            inclination={0}
            azimuth={0.25}
          />
          <fog attach="fog" args={['#0a1929', 100, 300]} />
          
          {/* Enhanced Lighting */}
          <ambientLight intensity={0.3} color="#4dd0e1" />
          <directionalLight 
            position={[20, 20, 10]} 
            intensity={1.2} 
            color="#ffffff"
            castShadow 
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <directionalLight position={[-20, -10, -5]} intensity={0.4} color="#4dd0e1" />
          <pointLight position={[0, 50, 0]} intensity={0.5} color="#00bcd4" />

          {/* Camera Controls */}
          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.03}
            minDistance={30}
            maxDistance={300}
            maxPolarAngle={Math.PI / 2}
            enablePan={true}
            panSpeed={0.5}
            rotateSpeed={0.5}
            zoomSpeed={0.8}
          />

          {/* Enhanced Ocean Surface */}
          <AnimatedOceanSurface
            bathymetryData={bathymetryData}
            wireframe={wireframe}
            showTemperature={showTemperature}
            animationSpeed={isAnimating ? animationSpeed : 0}
          />

          {/* Enhanced Species Overlay */}
          {showSpecies && (
            <EnhancedSpeciesOverlay 
              bathymetryData={bathymetryData} 
              animationSpeed={isAnimating ? animationSpeed : 0}
            />
          )}

          {/* Depth Legend */}
          {showLegend && (
            <DepthLegend 
              bathymetryData={bathymetryData} 
              position={[-40, 20, -40]} 
            />
          )}

          {/* Enhanced Grid Helper */}
          <gridHelper 
            args={[150, 30, '#006064', '#004d52']} 
            position={[0, -80, 0]} 
          />
          
          {/* Stars Background */}
          <Stars
            radius={300}
            depth={50}
            count={1000}
            factor={4}
            saturation={0.5}
            fade
            speed={0.5}
          />
        </Canvas>
      </div>

      {/* Enhanced Instructions Panel */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
          🎮 Interactive Controls
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          {[
            { icon: '🖱️', title: 'Rotate View', desc: 'Left click + drag to orbit around the ocean' },
            { icon: '⚡', title: 'Pan Camera', desc: 'Right click + drag to move the view' },
            { icon: '🔍', title: 'Zoom', desc: 'Scroll wheel to zoom in and out' },
            { icon: '⚙️', title: 'Controls', desc: 'Use the panel to toggle layers and animations' }
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl mb-2">{icon}</div>
              <div className="font-semibold text-blue-900 mb-1">{title}</div>
              <div className="text-blue-700 text-xs">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OceanDepth3D;
