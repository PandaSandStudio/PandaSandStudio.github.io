import { ShaderBase } from './shader.js';

const vertex = `
  precision highp float;
  
  attribute vec3 aVertexPosition;
  attribute vec3 aVertexNormal;
  attribute vec3 aVertexColor;
  
  uniform mat4 uViewMatrix;
  uniform mat4 uProjMatrix;
  
  uniform vec3 uLightDirection;
  uniform vec3 uAmbientColor;
  uniform vec3 uDiffuseColor;
  
  uniform float uFogDistance;
  uniform float uFogPower;
  uniform vec3 uFogColor;
  
  uniform vec3 uCameraPosition;
  
  varying vec4 vVertexColor;
  varying vec3 vVertexPosition;
  
  uniform float uSpecularReflectivity;
  uniform float uShineDamping;
  
  vec3 calculateSpecularLighting(vec3 toCameraVector, vec3 toLightVector, vec3 normal) {
    vec3 reflectedLightDirection = reflect(-toLightVector, normal);
    
    float specularFactor = max(dot(reflectedLightDirection, toCameraVector), 0.0);
    float specularValue = pow(specularFactor, uShineDamping);
    
    return specularValue * uSpecularReflectivity * uDiffuseColor;
  }
  
  vec3 calculateDiffuseLighting(vec3 toLightVector, vec3 normal) {
    float diffuseWeighting = max(dot(normal, toLightVector), 0.0);
    
    return uDiffuseColor * diffuseWeighting;
  }
  
  void main(void) {
    vec3 toCameraVector = normalize(uCameraPosition - aVertexPosition);
    vec3 toLightVector = uLightDirection;
    
    vec3 specularLighting = calculateSpecularLighting(toCameraVector, toLightVector, aVertexNormal);
    vec3 diffuseLighting = calculateDiffuseLighting(toLightVector, aVertexNormal);
    
    vec3 vertexColor = aVertexColor * (uAmbientColor + diffuseLighting + specularLighting);
    
    float distanceToCamera = length(uCameraPosition - aVertexPosition);
    float fogFactor = clamp(1.0 - pow(distanceToCamera / uFogDistance, uFogPower), 0.0, 1.0);
    
    vVertexColor = vec4(mix(uFogColor, vertexColor, fogFactor), 1.0);
    vVertexPosition = aVertexPosition;
    
    gl_Position = uProjMatrix * uViewMatrix * vec4(aVertexPosition, 1.0);
  }
`;

const fragment = `
  precision highp float;
  
  uniform vec4 uClippingPlane;
  uniform bool uUseClippingPlane;
  
  varying vec4 vVertexColor;
  varying vec3 vVertexPosition;
  
  void main(void) {
    if (uUseClippingPlane && dot(vec4(vVertexPosition, 1.0), uClippingPlane) < 0.0) {
      discard;
    }
    
    gl_FragColor = vVertexColor;
  }
`;

const info = {
  attribs: [
    'aVertexPosition',
    'aVertexNormal',
    'aVertexColor'
  ],
  uniforms: [
    'uProjMatrix',
    'uViewMatrix',
    'uLightDirection',
    'uAmbientColor',
    'uDiffuseColor',
    'uFogDistance',
    'uFogPower',
    'uFogColor',
    'uCameraPosition',
    'uClippingPlane',
    'uUseClippingPlane',
    'uSpecularReflectivity',
    'uShineDamping'
  ]
};

export class TerrainShader extends ShaderBase {
  constructor({ gl }) {
    super(gl, { vertex, fragment, info });
  }
  
  render(scene) {
    if (scene.getTerrainChunks().length === 0) {
      return;
    }
    
    super.setToActiveProgram();
    
    super.setVector('uClippingPlane', scene.getClippingPlane(), 4);
    super.setBool('uUseClippingPlane', scene.isUsingClippingPlane());
    
    super.setMatrix('uProjMatrix', scene.getCamera().getProjectionMatrix(), 4);
    super.setMatrix('uViewMatrix', scene.getCamera().getViewMatrix(), 4);
    
    super.setVector('uCameraPosition', scene.getCamera().getPosition(), 3);
    
    super.setVector('uAmbientColor', scene.getAmbientColor(), 3);
    super.setVector('uDiffuseColor', scene.getDirectionalLight().getColor(), 3);
    
    super.setVector('uLightDirection', scene.getDirectionalLight().getDirection(), 3);
    
    super.setFloat('uFogDistance', scene.getFog().getDistance());
    super.setFloat('uFogPower', scene.getFog().getPower());
    super.setVector('uFogColor', scene.getFog().getColor(), 3);
    
    for (const chunk of scene.getTerrainChunks()) {
      super.setArrayBuffer('aVertexColor', chunk.getBuffer('color'), 3);
      super.setArrayBuffer('aVertexPosition', chunk.getBuffer('position'), 3);
      super.setArrayBuffer('aVertexNormal', chunk.getBuffer('normal'), 3);
      
      super.setFloat('uSpecularReflectivity', chunk.getSpecularReflectivity());
      super.setFloat('uShineDamping', chunk.getShineDamping());
      
      super.drawTrianglesWithoutIndices(chunk.getVerticesLength());
    }
  }
}
