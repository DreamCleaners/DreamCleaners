import { InputAction } from './inputAction';

export class InputState {
  public directions: {
    x: number;
    y: number;
  } = { x: 0, y: 0 };
  public actions: Map<InputAction, boolean> = new Map();

  public desiredWeaponIndex = 0;
}
