import {
  DeviceSourceManager,
  DeviceType,
  Engine,
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

    // keyboard events
    window.addEventListener('keydown', this.onKeyboardEvent.bind(this, true));
    window.addEventListener('keyup', this.onKeyboardEvent.bind(this, false));
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
  }

  private onKeyboardEvent(isKeydown: boolean, event: KeyboardEvent): void {
    if (event.code === 'KeyW') {
      this.inputState.actions.set(InputAction.FORWARD, isKeydown);
    } else if (event.code === 'KeyS') {
      this.inputState.actions.set(InputAction.BACKWARD, isKeydown);
    } else if (event.code === 'KeyA') {
      this.inputState.actions.set(InputAction.LEFT, isKeydown);
    } else if (event.code === 'KeyD') {
      this.inputState.actions.set(InputAction.RIGHT, isKeydown);
    } else if (event.code === 'Space') {
      this.inputState.actions.set(InputAction.JUMP, isKeydown);
    } else if (event.code === 'Escape') {
      this.inputState.actions.set(InputAction.ESCAPE, isKeydown);
    }

    // Switching weapons
    else if (event.code === 'Digit1') {
      this.inputState.actions.set(InputAction.PRESS_ONE, isKeydown);
    } else if (event.code === 'Digit2') {
      this.inputState.actions.set(InputAction.PRESS_TWO, isKeydown);
    }

    // Crouching / Sliding
    else if (event.code === 'ShiftLeft') {
      this.inputState.actions.set(InputAction.CROUCH, isKeydown);
    }

    // RELOADING
    else if (event.code === 'KeyR') {
      this.inputState.actions.set(InputAction.RELOAD, isKeydown);
    }

    // INTERACTING
    else if (event.code === 'KeyE') {
      this.inputState.actions.set(InputAction.INTERACT, isKeydown);
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
  }
}
