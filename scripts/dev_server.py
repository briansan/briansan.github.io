#!/usr/bin/env python3
"""Simple static dev server with built-in hot reload polling."""

from __future__ import annotations

import argparse
import json
import os
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Lock, Thread
from urllib.parse import urlsplit

HOT_RELOAD_SNIPPET = """
<script>
(function () {
  var endpoint = "/__hot_reload_version";
  var currentVersion = null;

  function pollVersion() {
    fetch(endpoint, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          return null;
        }
        return response.json();
      })
      .then(function (data) {
        if (!data || typeof data.version !== "number") {
          return;
        }

        if (currentVersion === null) {
          currentVersion = data.version;
          return;
        }

        if (data.version !== currentVersion) {
          window.location.reload();
        }
      })
      .catch(function () {
        // Server restarts or transient network errors are expected in dev.
      });
  }

  pollVersion();
  setInterval(pollVersion, 800);
})();
</script>
""".strip()


class VersionState:
  def __init__(self) -> None:
    self._version = 0
    self._lock = Lock()

  def bump(self) -> int:
    with self._lock:
      self._version += 1
      return self._version

  def get(self) -> int:
    with self._lock:
      return self._version


def build_snapshot(root: Path) -> dict[str, int]:
  snapshot: dict[str, int] = {}
  ignored_dirs = {".git", "__pycache__"}

  for dirpath, dirnames, filenames in os.walk(root):
    dirnames[:] = [
      dirname
      for dirname in dirnames
      if dirname not in ignored_dirs and not dirname.startswith(".")
    ]

    for filename in filenames:
      if filename.startswith("."):
        continue

      filepath = Path(dirpath) / filename
      try:
        relative_path = str(filepath.relative_to(root))
        snapshot[relative_path] = filepath.stat().st_mtime_ns
      except OSError:
        continue

  return snapshot


def watch_for_changes(root: Path, state: VersionState, interval: float) -> None:
  previous_snapshot = build_snapshot(root)

  while True:
    time.sleep(interval)
    current_snapshot = build_snapshot(root)

    if current_snapshot != previous_snapshot:
      next_version = state.bump()
      previous_snapshot = current_snapshot
      print(f"[hot-reload] file change detected (version {next_version})", flush=True)


def create_handler(root: Path, state: VersionState):
  class HotReloadHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
      super().__init__(*args, directory=str(root), **kwargs)

    def do_GET(self) -> None:
      request_path = urlsplit(self.path).path

      if request_path == "/__hot_reload_version":
        self._serve_reload_version()
        return

      html_path = self._resolve_html_path(request_path)
      if html_path is not None:
        self._serve_html_with_reload(html_path)
        return

      super().do_GET()

    def _serve_reload_version(self) -> None:
      payload = json.dumps({"version": state.get()}).encode("utf-8")
      self.send_response(200)
      self.send_header("Content-Type", "application/json; charset=utf-8")
      self.send_header("Cache-Control", "no-store")
      self.send_header("Content-Length", str(len(payload)))
      self.end_headers()
      self.wfile.write(payload)

    def _resolve_html_path(self, request_path: str) -> Path | None:
      local_path = Path(self.translate_path(request_path))

      if local_path.is_dir():
        index_path = local_path / "index.html"
        if index_path.is_file():
          return index_path
        return None

      if local_path.is_file() and local_path.suffix.lower() == ".html":
        return local_path

      return None

    def _serve_html_with_reload(self, html_path: Path) -> None:
      try:
        raw_html = html_path.read_text(encoding="utf-8")
      except OSError:
        self.send_error(404, "File not found")
        return

      if "</body>" in raw_html:
        output_html = raw_html.replace("</body>", f"\n{HOT_RELOAD_SNIPPET}\n</body>")
      else:
        output_html = f"{raw_html}\n{HOT_RELOAD_SNIPPET}"

      payload = output_html.encode("utf-8")
      self.send_response(200)
      self.send_header("Content-Type", "text/html; charset=utf-8")
      self.send_header("Cache-Control", "no-store")
      self.send_header("Content-Length", str(len(payload)))
      self.end_headers()
      self.wfile.write(payload)

  return HotReloadHandler


def parse_args() -> argparse.Namespace:
  parser = argparse.ArgumentParser(
    description="Run a static server with automatic browser refresh on file changes."
  )
  parser.add_argument("--root", default=".", help="Directory to serve.")
  parser.add_argument("--port", type=int, default=8080, help="Port to bind.")
  parser.add_argument(
    "--interval",
    type=float,
    default=0.75,
    help="Polling interval in seconds for file change detection.",
  )
  return parser.parse_args()


def main() -> None:
  args = parse_args()

  if args.port <= 0 or args.port > 65535:
    raise ValueError("port must be between 1 and 65535")

  root = Path(args.root).resolve()
  if not root.is_dir():
    raise ValueError(f"root directory does not exist: {root}")

  state = VersionState()
  watcher = Thread(
    target=watch_for_changes,
    args=(root, state, args.interval),
    daemon=True,
  )
  watcher.start()

  server = ThreadingHTTPServer(("127.0.0.1", args.port), create_handler(root, state))
  print(f"Serving {root} with hot reload at http://localhost:{args.port}", flush=True)

  try:
    server.serve_forever()
  except KeyboardInterrupt:
    print("\nStopping server...", flush=True)
  finally:
    server.server_close()


if __name__ == "__main__":
  main()
