import { InputAction } from './inputAction';

export class InputState {
  public directions: {
    x: number;
    y: number;
  } = { x: 0, y: 0 };
  public actions: Map<InputAction, boolean> = new Map();

  private axis: {
    x: number;
    y: number;
  } = { x: 0, y: 0 };

  public getAxis(): { x: number; y: number } {
    const axis = { x: this.axis.x, y: this.axis.y };
    // reset the axis after reading it to avoid reading the same value twice
    // when the mouse is not moving
    this.axis.x = 0;
    this.axis.y = 0;
    return axis;
  }

  public setAxis(x: number, y: number): void {
    this.axis.x = x;
    this.axis.y = y;
  }
}
