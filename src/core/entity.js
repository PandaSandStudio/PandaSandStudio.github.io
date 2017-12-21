import { BufferData } from '../view/shaders/buffer.js';

const IDENTITY = mat4.identity(mat4.create());

export class Entity {
  constructor(args) {
    if (args) {
      this.initEntity(args);
    }
  }

  initEntity({
    geometry: {
      colors,
      vertices,
      normals,
      faces,
      texture,
      textureCoords
    },
    useLighting = true,
    useAdditiveBlending = false,
    name = Entity.uuid++,
    rotation = vec3.create(),
    position = vec3.create(),
    scale = vec3.fromValues(1, 1, 1),
    opacity = 1,
    renderPriority = 0,
    scene,
  }) {
    const bufferDataArguments = {
      position: {
        type: 'ARRAY_BUFFER',
        data: vertices
      },
      indices: {
        type: 'ELEMENT_ARRAY_BUFFER',
        data: faces
      }
    };

    if (texture) {
      bufferDataArguments.textureCoords = {
        type: 'ARRAY_BUFFER',
        data: textureCoords
      };
    } else {
      bufferDataArguments.color = {
        type: 'ARRAY_BUFFER',
        data: colors
      };
    }

    if (useLighting) {
      bufferDataArguments.normal = {
        type: 'ARRAY_BUFFER',
        data: normals
      };
    }

    this.bufferData = new BufferData(bufferDataArguments);

    this.worldMatrix = mat4.create();
    this.indicesCount = faces.length;

    this.rotation = rotation;
    this.position = position;
    this.scale = scale;
    this.name = name;
    this.opacity = opacity;
    this.affectedByLighting = useLighting;
    this.additiveBlendingEnabled = useAdditiveBlending;
    this.renderPriority = renderPriority;

    if (texture) {
      if (!scene) {
        throw new Error('[Entity] scene is not defined when using a texture');
      }

      this.texture = this.createTexture(texture, scene.getGlContext());
    }

    this.calculateWorldMatrix();
  }

  unbindBuffers() {
    BufferData.deleteTexture(this.texture);
    BufferData.deleteBufferData(this.bufferData);
  }

  isUsingAdditiveBlending() {
    return this.additiveBlendingEnabled;
  }

  isAffectedByLighting() {
    return this.affectedByLighting;
  }

  createTexture(texture, gl) {
    const buffer = new BufferData({
      texture: {
        type: 'TEXTURE_2D',
        data: this.texture
      }
    });

    buffer.bindBuffers(gl);

    return buffer.getBuffers().texture;
  }

  hasTexture() {
    return !!this.texture;
  }

  getTexture() {
    return this.texture;
  }

  get scale() {
    return this._scale;
  }

  set scale(scale) {
    this._scale = typeof scale === 'number'
      ? vec3.fromValues(scale, scale, scale)
      : scale;
  }

  updateGeometry(scene, { vertices, normals, faces, colors, textureCoords }) {
    const bufferDataArguments = {
      position: vertices,
      indices: faces
    };

    if (colors) {
      bufferDataArguments.color = colors;
    }

    if (normals) {
      bufferDataArguments.normal = normals;
    }

    if (textureCoords) {
      bufferDataArguments.textureCoords = textureCoords;
    }

    this.bufferData.updateBuffers(bufferDataArguments, scene.getGlContext());
    this.indicesCount = faces.length;
  }

  calculateWorldMatrix() {
    mat4.translate(
      this.worldMatrix,
      IDENTITY,
      [this.position[0], this.position[1], this.position[2]]
    );

    mat4.scale(
      this.worldMatrix,
      this.worldMatrix,
      this.scale
    );

    mat4.rotateZ(
      this.worldMatrix,
      this.worldMatrix,
      this.rotation[2] * Math.PI / 180
    );

    mat4.rotateX(
      this.worldMatrix,
      this.worldMatrix,
      this.rotation[0] * Math.PI / 180
    );

    mat4.rotateY(
      this.worldMatrix,
      this.worldMatrix,
      this.rotation[1] * Math.PI / 180
    );

    return this.worldMatrix;
  }

  setOpacity(opacity) {
    this.opacity = opacity;
  }

  getOpacity() {
    return this.opacity;
  }

  getWorldMatrix() {
    return this.worldMatrix;
  }

  getIndicesCount() {
    return this.indicesCount;
  }

  getBufferData() {
    return this.bufferData;
  }

  getBuffers() {
    return this.bufferData.buffers;
  }

  getBuffer(name) {
    return this.bufferData.buffers[name];
  }
}

Entity.uuid = 0;
