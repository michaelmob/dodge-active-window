"use strict";
const Lang = imports.lang;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Tweener = imports.tweener.tweener;

let focusCallbackId;

/**
 * Brief description of the function here.
 * @summary If the description is long, write your summary here. Otherwise, feel free to remove this.
 * @param {ParamDataTypeHere} parameterNameHere - Brief description of the parameter here. Note: For other notations of data types, please refer to JSDocs: DataTypes command.
 * @return {ReturnValueDataTypeHere} Brief description of the returning value here.
 */
function windowFocusChanged() {
  let focusedWindow = global.display.get_focus_window();
  if (!focusedWindow) return;

  const aboveActors = global.get_window_actors().filter(
    (actor) => actor.metaWindow && actor.metaWindow.above && actor.metaWindow
    // if (actor.metaWindow && actor.metaWindow.above)
    //   return actor.metaWindow;
  );

  aboveActors.forEach(function (actor) {
    dodgeWindow(focusedWindow, actor);
  });
}

function dodgeWindow(focusedWindow, aboveActor) {
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
    )
  )
    return;

  // The above window's left and right X positions
  let aboveLeftX = aboveRect.x;
  let aboveRightX = aboveRect.x + aboveRect.width;

  // The focused window's left and right X positions
  let focusedLeftX = focusedRect.x;
  let focusedRightX = focusedRect.x + focusedRect.width;

  // Differences between the left and right X positions of the above and focused
  // window.
  let leftDiff = aboveRightX - focusedLeftX;
  let rightDiff = focusedRightX - aboveLeftX;

  const mRect = focusedWindow.get_work_area_current_monitor();

  let sum = 0;
  if (leftDiff > rightDiff) sum = rightDiff;
  else if (leftDiff < rightDiff) sum = -leftDiff;

  let x = aboveRect.x + sum;

  // Check for enough room on sides
  if (x < mRect.x) sum = rightDiff;
  else if (x + aboveRect.width > mRect.width) sum = -leftDiff;

  x = aboveRect.x + sum;

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

// This function is called once when your extension is loaded, not enabled. This
// is a good time to setup translations or anything else you only do once.
//
// You MUST NOT make any changes to GNOME Shell, connect any signals or add any
// MainLoop sources here.
function init() {
  log(`initializing ${Me.metadata.name} version ${Me.metadata.version}`);
}

// This function could be called after your extension is enabled, which could
// be done from GNOME Tweaks, when you log in or when the screen is unlocked.
//
// This is when you setup any UI for your extension, change existing widgets,
// connect signals or modify GNOME Shell's behaviour.
function enable() {
  focusCallbackId = global.display.connect(
    "notify::focus-window",
    Lang.bind(this, windowFocusChanged)
  );

  focusCallbackId = global.display.connect(
    "notify::focus-window",
    Lang.bind(this, windowFocusChanged)
  );

  log(`enabling ${Me.metadata.name} version ${Me.metadata.version}`);
}

// This function could be called after your extension is uninstalled, disabled
// in GNOME Tweaks, when you log out or when the screen locks.
//
// Anything you created, modifed or setup in enable() MUST be undone here. Not
// doing so is the most common reason extensions are rejected during review!
function disable() {
  global.display.disconnect(focusCallbackId);

  log(`disabling ${Me.metadata.name} version ${Me.metadata.version}`);
}
