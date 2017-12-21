import { WaterFramebuffer } from './water-framebuffer.js';
import { ShaderBase } from './shader.js';

const vertex = `
  precision highp float;
  
  const float PI = 3.1415926535897932384626433832795;
  
  attribute vec2 aVertexPosition;
  attribute vec4 aVertexIndicator;
  
  uniform mat4 uViewMatrix;
  uniform mat4 uProjMatrix;
  
  uniform float uWaveLength;
  uniform float uWaveAmplitude;
  uniform float uWaveSlowdown;
  
  uniform float uSpecularReflectivity;
  uniform float uShineDamping;
  
  uniform vec3 uWaterPosition;
  
  uniform vec3 uLightDirection;
  uniform vec3 uDiffuseColor;
  
  uniform vec3 uCameraPosition;
  
  uniform float uTimePassed;
  uniform float uTriangleSize;
  
  varying vec4 vClipSpaceGrid;
  varying vec4 vClipSpaceReal;
  
  varying vec3 vVertexPosition;
  varying vec3 vVertexNormal;
  varying vec3 vToCameraVector;
  varying vec3 vSpecularColor;
  varying vec3 vDiffuseColor;
  
  vec3 calculateDiffuseLighting(vec3 toLightVector, vec3 normal) {
    float brightness = max(dot(toLightVector, normal), 0.0);
    
    return brightness * uDiffuseColor;
  }
  
  vec3 calculateSpecularLighting(vec3 toCameraVector, vec3 toLightVector, vec3 normal) {
    vec3 reflectedLightDirection = reflect(-toLightVector, normal);
    
    float specularFactor = max(dot(reflectedLightDirection, toCameraVector), 0.0);
    float specularValue = pow(specularFactor, uShineDamping);
    
    return specularValue * uSpecularReflectivity * uDiffuseColor;
  }
    
  float generateOffset(float x, float z, float v1, float v2) {
    float waveTime = uTimePassed / uWaveSlowdown;
    
  	float radiansX = ((mod(x + z * x * v1, uWaveLength) / uWaveLength) + waveTime * mod(x * 0.8 + z, 1.5)) * 2.0 * PI;
  	float radiansZ = ((mod(v2 * (z * x + x * z), uWaveLength) / uWaveLength) + waveTime * 2.0 * mod(x, 2.0)) * 2.0 * PI;
  	
  	return uWaveAmplitude * 0.5 * (sin(radiansZ) + cos(radiansX));
  }
  
  vec3 applyDistortion(vec3 vertex) {
    return vertex + vec3(
      generateOffset(vertex.x, vertex.z, 0.20, 0.10),
      generateOffset(vertex.x, vertex.z, 0.10, 0.30),
      generateOffset(vertex.x, vertex.z, 0.15, 0.20)
    );
  }
  
  vec3 getVertexPosition(vec2 indicator) {
    vec2 position = aVertexPosition + indicator * uTriangleSize;
    
    return vec3(position.x, 0.0, position.y) + uWaterPosition;
  }
  
  vec3 calculateNormal(vec3 vertex1, vec3 vertex2, vec3 vertex3) {
  	vec3 tangent = vertex2 - vertex1;
  	vec3 bitangent = vertex3 - vertex1;
  	
  	return normalize(cross(tangent, bitangent));
  }
  
  void main(void) {
    vec3 vertex1 = getVertexPosition(vec2(0.0, 0.0));
    vec3 vertex2 = getVertexPosition(aVertexIndicator.xy);
    vec3 vertex3 = getVertexPosition(aVertexIndicator.zw);
    
    vec4 clipSpaceGrid = uProjMatrix * uViewMatrix * vec4(vertex1, 1.0);
    
    vertex1 = applyDistortion(vertex1);
    vertex2 = applyDistortion(vertex2);
    vertex3 = applyDistortion(vertex3);
    
    vec3 vertexNormal = calculateNormal(vertex1, vertex2, vertex3);
    vec4 clipSpaceReal = uProjMatrix * uViewMatrix * vec4(vertex1, 1.0);
    
    vec3 toCameraVector = normalize(uCameraPosition - vertex1);
    vec3 toLightVector = uLightDirection;
    
	  vec3 specularColor = calculateSpecularLighting(toCameraVector, uLightDirection, vertexNormal);
	  vec3 diffuseColor = calculateDiffuseLighting(uLightDirection, vertexNormal);
	  
	  gl_Position = clipSpaceReal;
    
    vVertexPosition = vertex1;
    vClipSpaceGrid = clipSpaceGrid;
    vClipSpaceReal = clipSpaceReal;
    vVertexNormal = vertexNormal;
    vToCameraVector = toCameraVector;
    vSpecularColor = specularColor;
    vDiffuseColor = diffuseColor;
  }
`;

const fragment = `
  precision highp float;
  
  uniform vec3 uCameraPosition;
  
  uniform float uFresnelReflectivity;
  uniform float uMinBlueness;
  uniform float uMaxBlueness;
  uniform float uMurkyDepth;
  
  uniform vec3 uWaterColor;
  uniform vec2 uNearFarPlanes;
  
  uniform sampler2D uReflectionTexture;
  uniform sampler2D uRefractionTexture;
  uniform sampler2D uDepthTexture;
  
  uniform float uFogDistance;
  uniform float uFogPower;
  uniform vec3 uFogColor;
  
  varying vec4 vClipSpaceGrid;
  varying vec4 vClipSpaceReal;
  
  varying vec3 vVertexPosition;
  varying vec3 vVertexNormal;
  varying vec3 vToCameraVector;
  varying vec3 vSpecularColor;
  varying vec3 vDiffuseColor;
  
  vec3 applyMurkiness(vec3 refractColor, float waterDepth) {
    float murkyFactor = clamp(waterDepth / uMurkyDepth, 0.0, 1.0);
  	float murkiness = uMinBlueness + murkyFactor * (uMaxBlueness - uMinBlueness);
  	
  	return mix(refractColor, uWaterColor, murkiness);
  }
  
  float toLinearDepth(float zDepth) {
  	float near = uNearFarPlanes.x;
  	float far = uNearFarPlanes.y;
  	
  	return 2.0 * near * far / (far + near - (2.0 * zDepth - 1.0) * (far - near));
  }
  
  float calculateWaterDepth(vec2 textureCoords) {
    float floorDepth = texture2D(uDepthTexture, textureCoords).r;
    float floorDistance = toLinearDepth(floorDepth);
    
    float waterDepth = gl_FragCoord.z;
    float waterDistance = toLinearDepth(waterDepth);
    
    return floorDistance - waterDistance;
  }
  
  float calculateFresnel() {
    vec3 viewVector = normalize(vToCameraVector);
    vec3 normal = normalize(vVertexNormal);
    
    float refractiveFactor = dot(viewVector, normal);
    float refractiveValue = pow(refractiveFactor, uFresnelReflectivity);
    
    return clamp(refractiveValue, 0.0, 1.0);
  }
  
  vec2 clipSpaceToTextureCoords(vec4 clipSpace) {
    vec2 normalizedDeviceCoords = clipSpace.xy / clipSpace.w;
    vec2 textureCoords = normalizedDeviceCoords / 2.0 + 0.5;
    
    return clamp(textureCoords, 0.002, 0.998);
  }
  
  void main(void) {
    vec2 textureCoordsReal = clipSpaceToTextureCoords(vClipSpaceReal);
    vec2 textureCoordsGrid = clipSpaceToTextureCoords(vClipSpaceGrid);
    
    vec2 refractionTextureCoords = textureCoordsGrid;
    vec2 reflectionTextureCoords = vec2(textureCoordsGrid.x, 1.0 - textureCoordsGrid.y);
    
    float waterDepth = calculateWaterDepth(textureCoordsReal);
    
    vec3 refractColor = texture2D(uRefractionTexture, refractionTextureCoords).rgb;
    vec3 reflectColor = texture2D(uReflectionTexture, reflectionTextureCoords).rgb;
    
    refractColor = applyMurkiness(refractColor, waterDepth);
    reflectColor = mix(reflectColor, uWaterColor, uMinBlueness);
    
    vec3 finalColor = mix(reflectColor, refractColor, calculateFresnel());
    vec3 finalColorWithLighting = finalColor * vDiffuseColor + vSpecularColor;
    
    float distanceToCamera = length(uCameraPosition - vVertexPosition);
    float fogFactor = clamp(1.0 - pow(distanceToCamera / uFogDistance, uFogPower), 0.0, 1.0);
    
    vec3 finalColorWithFogApplied = mix(uFogColor, finalColorWithLighting, fogFactor);
    
    gl_FragColor = vec4(finalColorWithFogApplied, 1.0);
  }
`;

const info = {
  attribs: [
    'aVertexPosition',
    'aVertexIndicator'
  ],
  uniforms: [
    'uWaterColor',
    'uNearFarPlanes',
    'uReflectionTexture',
    'uRefractionTexture',
    'uDepthTexture',
    'uViewMatrix',
    'uProjMatrix',
    'uWaterPosition',
    'uLightDirection',
    'uCameraPosition',
    'uTimePassed',
    'uTriangleSize',
    'uFogColor',
    'uFogDistance',
    'uFogPower',
    'uDiffuseColor',
    'uWaveLength',
    'uWaveAmplitude',
    'uWaveSlowdown',
    'uSpecularReflectivity',
    'uShineDamping',
    'uFresnelReflectivity',
    'uMinBlueness',
    'uMaxBlueness',
    'uMurkyDepth'
  ]
};

export class WaterShader extends ShaderBase {
  constructor({
    gl,
    scene,
    reflectionWidth,
    reflectionHeight,
    refractionWidth,
    refractionHeight,
    reflectOffset,
    refractOffset,
    waveLength,
    waveAmplitude,
    waveSlowdown,
    specularReflectivity,
    shineDamping,
    fresnelReflectivity,
    minBlueness,
    maxBlueness,
    murkyDepth,
    elevation
  }) {
    super(gl, { vertex, fragment, info });
    
    this.reflectionWidth = reflectionWidth;
    this.reflectionHeight = reflectionHeight;
    this.refractionWidth = refractionWidth;
    this.refractionHeight = refractionHeight;
    this.reflectOffset = reflectOffset;
    this.refractOffset = refractOffset;
    this.waveLength = waveLength;
    this.waveAmplitude = waveAmplitude;
    this.waveSlowdown = waveSlowdown;
    this.specularReflectivity = specularReflectivity;
    this.shineDamping = shineDamping;
    this.fresnelReflectivity = fresnelReflectivity;
    this.minBlueness = minBlueness;
    this.maxBlueness = maxBlueness;
    this.murkyDepth = murkyDepth;
    this.elevation = elevation;
    
    this.framebuffer = new WaterFramebuffer({
      gl,
      scene,
      reflectionWidth,
      reflectionHeight,
      refractionWidth,
      refractionHeight
    });
    
    this.clippingPlane = vec4.create();
  }
  
  bindReflectionFramebuffer(scene) {
    this.framebuffer.bindReflectionFramebuffer();
    this.applyReflectionClippingPlane(scene);
  }
  
  bindRefractionFramebuffer(scene) {
    this.framebuffer.bindRefractionFramebuffer();
    this.applyRefractionClippingPlane(scene);
  }
  
  unbindFramebuffer() {
    this.framebuffer.unbindFramebuffer();
  }
  
  applyReflectionClippingPlane(scene) {
    vec4.set(this.clippingPlane, 0, 1, 0, -this.elevation + this.reflectOffset);
    
    scene.setClippingPlane(this.clippingPlane);
  }
  
  applyRefractionClippingPlane(scene) {
    vec4.set(this.clippingPlane, 0, -1, 0, this.elevation + this.refractOffset);
    
    scene.setClippingPlane(this.clippingPlane);
  }
  
  render(scene) {
    if (scene.getTerrainChunks().length === 0) {
      return;
    }
    
    super.setToActiveProgram();
    super.disableCullFace();
    
    super.setFloat('uTimePassed', performance.now());
    
    super.setFloat('uWaveLength', this.waveLength);
    super.setFloat('uWaveAmplitude', this.waveAmplitude);
    super.setFloat('uWaveSlowdown', this.waveSlowdown);
    super.setFloat('uSpecularReflectivity', this.specularReflectivity);
    super.setFloat('uShineDamping', this.shineDamping);
    super.setFloat('uFresnelReflectivity', this.fresnelReflectivity);
    super.setFloat('uMinBlueness', this.minBlueness);
    super.setFloat('uMaxBlueness', this.maxBlueness);
    super.setFloat('uMurkyDepth', this.murkyDepth);
    
    super.setMatrix('uProjMatrix', scene.getCamera().getProjectionMatrix(), 4);
    super.setMatrix('uViewMatrix', scene.getCamera().getViewMatrix(), 4);
    
    super.setVector('uCameraPosition', scene.getCamera().getPosition(), 3);
    super.setVector('uDiffuseColor', scene.getDirectionalLight().getColor(), 3);
    
    super.setVector('uLightDirection', scene.getDirectionalLight().getDirection(), 3);
    
    super.setFloat('uFogDistance', scene.getFog().getDistance());
    super.setFloat('uFogPower', scene.getFog().getPower());
    super.setVector('uFogColor', scene.getFog().getColor(), 3);
    
    super.setVector('uNearFarPlanes', scene.getCamera().getNearFarPlanes(), 2);
    
    super.setTexture('uReflectionTexture', this.framebuffer.getReflectionTexture(), 0);
    super.setTexture('uRefractionTexture', this.framebuffer.getRefractionTexture(), 1);
    super.setTexture('uDepthTexture', this.framebuffer.getRefractionDepthTexture(), 2);
    
    for (const chunk of scene.getTerrainChunks()) {
      super.setFloat('uTriangleSize', chunk.getWater().getTriangleSize());
      
      super.setVector('uWaterColor', chunk.getWater().getColor(), 3);
      super.setVector('uWaterPosition', chunk.getWater().getPosition(), 3);
      
      super.setArrayBuffer('aVertexPosition', chunk.getWater().getVertices(), 2);
      super.setArrayBuffer('aVertexIndicator', chunk.getWater().getIndicators(), 4);
      
      super.drawTrianglesWithoutIndices(chunk.getWater().getVerticesLength());
    }
    
    super.enableCullFace();
  }
}
