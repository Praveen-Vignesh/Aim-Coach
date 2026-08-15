// Tunable numbers. Everything the scene and the game read lives here.

// Renderer
export const BACKGROUND_COLOR = 0x1a1a1a;
export const MAX_PIXEL_RATIO = 2;

// Camera
export const CAMERA_FOV = 90;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 1000;

// Environment wireframes (depth cues only — nothing is collidable)
export const FLOOR_Y = -5;
export const GRID_SIZE = 60;
export const GRID_DIVISIONS = 30;
export const GRID_COLOR = 0x2f2f2f;
export const GRID_CENTER_COLOR = 0x3d3d3d;

export const WALL_COLOR = 0x2a2a2a;
export const BACK_WALL_Z = -35;
export const SIDE_WALL_X = 20;
export const WALL_HEIGHT = 24;
export const WALL_WIDTH = 40;
export const WALL_DEPTH = 60;
export const WALL_CELL_SIZE = 2;

// Mouse input. Raw movementX/Y is multiplied by this and nothing else —
// no smoothing, no acceleration. There is no UI to change it.
export const SENSITIVITY = 1.0;
export const PITCH_LIMIT_DEG = 89;

// Targets
export const TARGET_RADIUS = 0.5;
export const TARGET_COLOR = 0xff5555;
export const TARGET_SEGMENTS = 24;

// A 3D volume, not a wall: z varies so target distance genuinely differs
// between attempts. Radius never scales with distance.
export const SPAWN_VOLUME = { xMin: -8, xMax: 8, yMin: -4, yMax: 4, zMin: -25, zMax: -8 };
export const MIN_SPAWN_DISTANCE = 5;

// Crosshair hit/miss flash duration
export const FEEDBACK_FLASH_MS = 90;
