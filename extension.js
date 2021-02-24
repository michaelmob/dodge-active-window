"use strict";
const Lang = imports.lang;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Tweener = imports.tweener.tweener;

let focusCallbackId;

function dodgeWindow(focusedWindow, aboveActor) {
  // Check that they're not the same window
  const aboveWindow = aboveActor.metaWindow;
  if (focusedWindow == aboveWindow) return;

  const focusedRect = focusedWindow.get_frame_rect();
  const aboveRect = aboveWindow.get_frame_rect();

  // Collision check
  if (
    !(
      focusedRect.x < aboveRect.x + aboveRect.width &&
      focusedRect.x + focusedRect.width > aboveRect.x &&
      focusedRect.y < aboveRect.y + aboveRect.height &&
      focusedRect.y + focusedRect.height > aboveRect.y
    ) ||
    aboveRect.width > focusedRect.width
  )
    return;

  // The above window's left and right X positions
  const aboveLeftX = aboveRect.x;
  const aboveRightX = aboveRect.x + aboveRect.width;

  // The focused window's left and right X positions
  const focusedLeftX = focusedRect.x;
  const focusedRightX = focusedRect.x + focusedRect.width;

  // Differences between the left and right X positions of the above and focused
  // window.
  const leftDiff = aboveRightX - focusedLeftX;
  const rightDiff = focusedRightX - aboveLeftX;

  let update = 0;

  // Is the left edge is closer than the right edge?
  if (leftDiff > rightDiff) {
    // Set update to move the window to the right edge
    update = rightDiff;
  }

  // Is the left edge further than the right edge?
  else if (leftDiff < rightDiff) {
    // Set update to move the window to the left edge
    update = -leftDiff;
  }

  // New X position
  let x = aboveRect.x + update;

  // Get the work area geometry to ensure our above window remains within the
  // work area.
  const monitorRect = focusedWindow.get_work_area_current_monitor();

  // Ensure
  if (x < monitorRect.x) {
    update = rightDiff;
  }
  //
  else if (x + aboveRect.width > monitorRect.width) {
    update = -leftDiff;
  }

  x = aboveRect.x + update;

  // Move window with tweening
  Tweener.addTween(aboveActor, {
    x: x,
    y: aboveRect.y,
    time: 0.1,
    transition: "linear",
    onComplete: () => {
      aboveWindow.move_resize_frame(
        false,
        x,
        aboveRect.y,
        aboveRect.width,
        aboveRect.height
      );
    },
  });
}

function windowFocusChanged() {
  let focusedWindow = global.display.get_focus_window();
  if (!focusedWindow) return;

  const aboveActors = global.get_window_actors().filter(function (actor) {
    if (actor.metaWindow && actor.metaWindow.above) {
      return actor.metaWindow;
    }
  });

  // TODO: this runs the loop twice, combine this and aboveActors
  aboveActors.forEach(function (actor) {
    dodgeWindow(focusedWindow, actor);
  });
}

function init() {
  log(`initializing ${Me.metadata.name} version ${Me.metadata.version}`);
}

function enable() {
  focusCallbackId = global.display.connect(
    "notify::focus-window",
    Lang.bind(this, windowFocusChanged)
  );

  log(`enabling ${Me.metadata.name} version ${Me.metadata.version}`);
}

function disable() {
  global.display.disconnect(focusCallbackId);
  log(`disabling ${Me.metadata.name} version ${Me.metadata.version}`);
}
