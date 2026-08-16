// Per-attempt mouse-movement buffer and Supabase row assembly.
// Nothing here talks to the network.

export function createTelemetry() {
  let buffer = [];
  let spawnTimestamp = 0;

  return {
    // Called on every spawn. A fresh array is allocated rather than emptied in
    // place, because the previous attempt's array is still on its way to
    // Supabase. Every buffer opens with the spawn baseline.
    beginAttempt(timestamp) {
      spawnTimestamp = timestamp;
      buffer = [{ t: 0, dx: 0, dy: 0 }];
    },

    record(dx, dy) {
      buffer.push({ t: Math.round(performance.now() - spawnTimestamp), dx, dy });
    },

    trajectory() {
      return buffer;
    }
  };
}

export function buildPayload({
  sessionId,
  targetDistance,
  timeToClickMs,
  clickResult,
  clickOffset,
  trajectory
}) {
  return {
    session_id: sessionId,
    is_human: true,
    bot_mode: null,
    target_distance: targetDistance,
    time_to_click_ms: timeToClickMs,
    click_result: clickResult,
    click_offset_x: clickOffset === null ? null : clickOffset.x,
    click_offset_y: clickOffset === null ? null : clickOffset.y,
    trajectory
  };
}
