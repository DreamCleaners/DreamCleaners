import { Camera, UniversalCamera, Vector3 } from "@babylonjs/core";
import { Player } from "./player";

export class CameraManager{

    private camera !: UniversalCamera;

    constructor(private player: Player) {
        this.initCamera(player);
    }

    private initCamera(player: Player): void {

    this.camera = new UniversalCamera(
        'playerCamera',
        new Vector3(0, 1, 0),
        player.game.scene,
    );

    this.camera.parent = player.hitbox;
    this.camera.setTarget(new Vector3(0, 1, 1));
    this.camera.attachControl(player.game.scene.getEngine().getRenderingCanvas(), true); // Enable mouse control

    // Attach control binds the camera to mouse and keyboard inputs, we want to use only mouse inputs
    // So we remove all unwelcomed inputs
    this.camera.inputs.removeByType('FreeCameraKeyboardMoveInput');
    this.camera.inputs.removeByType('FreeCameraGamepadInput');
    this.camera.inputs.removeByType('FreeCameraTouchInput');

    // No deceleration
    this.camera.inertia = 0;
    // Cam sensitivity
    this.camera.angularSensibility = 1000;
    // Allows no "near clipping" of meshes when close to the camera
    this.camera.minZ = 0.01;
    }

    public updateCamera(): void {
        // N/A
    }

    public getRotationY(): number {
    return this.camera.rotation.y;
    }

    public setCameraHeight(height: number): void {
    this.camera.position.y = height;
    }

    public getCameraPositionY(): number {
    return this.camera.position.y;
    }

    public getCamera(): Camera {
    return this.camera;
    }
}