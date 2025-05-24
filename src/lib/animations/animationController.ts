import { AnimationGroup, Scalar } from '@babylonjs/core';
import { AnimationOptions } from './animationOptions';

type AnimationData = {
  group: AnimationGroup;
  baseLength: number;
};

export class AnimationController {
  private readonly animations: Map<string, AnimationData> = new Map();
  private transitionAnimation: AnimationGroup | null = null;
  private DEFAULT_TRANSITION_SPEED = 0.1;
  private transitionSpeed = this.DEFAULT_TRANSITION_SPEED;

  public addAnimation(name: string, animation: AnimationGroup): void {
    this.animations.set(name, {
      group: animation,
      baseLength: animation.getLength(),
    });
  }

  /**
   * Start an animation with the given options
   * @param options.loop - Should the animation loop (default: false)
   * @param options.from - Start the animation from this frame (default: animation.from)
   * @param options.to - Start the animation to this frame (default: animation.to)
   * @param options.speedRatio - Speed ratio of the animation (default: 1)
   * @param options.smoothTransition - Should the animation transition smoothly (default: false)
   * @param options.transitionSpeed - Speed of the transition (default: 0.1)
   * @param options.maxDuration - Max duration of the animation in seconds (default: animation length)
   */
  public startAnimation(
    animationName: string,
    options: AnimationOptions,
  ): AnimationGroup {
    const animationData = this.animations.get(animationName);
    if (!animationData) {
      throw new Error(`Animation ${animationName} not found`);
    }

    const animation = animationData.group;
    const baseLength = animationData.baseLength;

    if (options.smoothTransition !== undefined && options.smoothTransition) {
      this.transitionSpeed = options.transitionSpeed || this.DEFAULT_TRANSITION_SPEED;
      animation.weight = 0;
      this.transitionAnimation = animation;
    } else {
      if (this.transitionAnimation) {
        this.transitionAnimation.stop();
      }
      animation.stop();
      animation.weight = 1;
    }

    // start the animation
    const animationLoop: boolean = options?.loop ?? false;
    const animationFrom: number = options?.from ?? animation.from;
    const animationTo: number = options?.to ?? animation.to;
    let speedRatio: number = options?.speedRatio ?? 1;

    if (options.maxDuration) {
      const maxDurationSpeedRatio = baseLength / options.maxDuration;
      speedRatio = Math.max(speedRatio, maxDurationSpeedRatio);
    }

    return animation.start(animationLoop, speedRatio, animationFrom, animationTo);
  }

  public update(): void {
    this.smoothTransition();
  }

  /**
   * Make a smooth transition between animations according to the transition speed
   */
  private smoothTransition(): void {
    if (!this.transitionAnimation) return;
    const currentAnimation = this.transitionAnimation;

    currentAnimation.weight = Scalar.Clamp(
      currentAnimation.weight + this.transitionSpeed,
      0,
      1,
    );

    this.animations.forEach((animationData) => {
      const animation = animationData.group;
      if (animation.name !== currentAnimation.name && animation.isPlaying) {
        animation.weight = Scalar.Clamp(animation.weight - this.transitionSpeed, 0, 1);
        if (animation.weight === 0) animation.stop();
      }
    });

    if (currentAnimation.weight === 1) this.transitionAnimation = null;
  }

  public hasAnimation(name: string): boolean {
    return this.animations.has(name);
  }
}
