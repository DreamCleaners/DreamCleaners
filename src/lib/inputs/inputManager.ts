import {
  DeviceSourceManager,
  DeviceType,
  Engine,
  IKeyboardEvent,
  IMouseEvent,
  PointerInput,
} from '@babylonjs/core';
import { DeviceSourceType } from '@babylonjs/core/DeviceInput/internalDeviceSourceManager';
import { InputState } from './inputState';
import { InputAction } from './inputAction';

export class InputManager {
  public inputState = new InputState();

  constructor(engine: Engine) {
    const deviceSourceManager = new DeviceSourceManager(engine);
    deviceSourceManager.onDeviceConnectedObservable.add(this.listenDevice.bind(this));
  }

  /**
   * Listen to the device events and update the input state
   */
  private listenDevice(device: DeviceSourceType): void {
    // MOUSE
    if (device.deviceType === DeviceType.Mouse) {
      device.onInputChangedObservable.add((mouseEvent: IMouseEvent) => {
        if (mouseEvent.inputIndex === PointerInput.LeftClick) {
          this.inputState.actions.set(
            InputAction.SHOOT,
            mouseEvent.type === 'pointerdown',
          );
        }
      });
    }
    // KEYBOARD
    if (device.deviceType === DeviceType.Keyboard) {
      device.onInputChangedObservable.add((keyboardEvent: IKeyboardEvent) => {
        if (keyboardEvent.code === 'KeyW') {
          this.inputState.actions.set(
            InputAction.FORWARD,
            keyboardEvent.type === 'keydown',
          );
        } else if (keyboardEvent.code === 'KeyS') {
          this.inputState.actions.set(
            InputAction.BACKWARD,
            keyboardEvent.type === 'keydown',
          );
        } else if (keyboardEvent.code === 'KeyA') {
          this.inputState.actions.set(InputAction.LEFT, keyboardEvent.type === 'keydown');
        } else if (keyboardEvent.code === 'KeyD') {
          this.inputState.actions.set(
            InputAction.RIGHT,
            keyboardEvent.type === 'keydown',
          );
        }

        // Weapon switch, useless key for now
        if (keyboardEvent.code === 'Digit1') {
          this.inputState.actions.set(
            InputAction.PRESS_ONE,
            keyboardEvent.type === 'keydown',
          );
        }
        if (keyboardEvent.code === 'Digit2') {
          this.inputState.actions.set(
            InputAction.PRESS_TWO,
            keyboardEvent.type === 'keydown',
          );
        }

        // RELOADING
        if (keyboardEvent.code === 'KeyR') {
          this.inputState.actions.set(
            InputAction.RELOAD,
            keyboardEvent.type === 'keydown',
          );
        }

        // Update the direction
        this.inputState.directions.x = 0;
        this.inputState.directions.y = 0;
        if (
          this.inputState.actions.get(InputAction.FORWARD) &&
          !this.inputState.actions.get(InputAction.BACKWARD)
        ) {
          this.inputState.directions.y = 1;
        }
        if (
          !this.inputState.actions.get(InputAction.FORWARD) &&
          this.inputState.actions.get(InputAction.BACKWARD)
        ) {
          this.inputState.directions.y = -1;
        }
        if (
          this.inputState.actions.get(InputAction.LEFT) &&
          !this.inputState.actions.get(InputAction.RIGHT)
        ) {
          this.inputState.directions.x = -1;
        }
        if (
          !this.inputState.actions.get(InputAction.LEFT) &&
          this.inputState.actions.get(InputAction.RIGHT)
        ) {
          this.inputState.directions.x = 1;
        }
      });
    }
  }
}
