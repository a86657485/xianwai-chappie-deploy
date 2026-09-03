#!/usr/bin/env python3
"""Local static server with a small shared media API for the presentation."""

from __future__ import annotations

import json
import mimetypes
import re
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote
from uuid import uuid4


CHAPTER_ID = re.compile(r"^[a-z]+$")
MAX_UPLOAD_BYTES = 120 * 1024 * 1024


def _read_manifest(path: Path) -> dict[str, list[dict]]:
    if not path.exists():
        return {}
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return value if isinstance(value, dict) else {}


def _write_manifest(path: Path, value: dict[str, list[dict]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".tmp")
    temporary.write_text(
        json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    temporary.replace(path)


def create_server(
    root: Path | str,
    upload_root: Path | str | None = None,
    host: str = "0.0.0.0",
    port: int = 4174,
) -> ThreadingHTTPServer:
    root = Path(root).resolve()
    upload_root = Path(upload_root or root / "uploads").resolve()
    upload_root.mkdir(parents=True, exist_ok=True)
    manifest_path = upload_root / "media.json"
    lock = threading.Lock()

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(root), **kwargs)

        def _json(self, status: int, payload: object) -> None:
            data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def _chapter(self) -> str | None:
            parts = self.path.split("?")[0].strip("/").split("/")
            if len(parts) >= 3 and parts[:2] == ["api", "media"] and CHAPTER_ID.match(parts[2]):
                return parts[2]
            return None

        def do_GET(self) -> None:  # noqa: N802
            if self.path.split("?")[0] == "/api/media":
                with lock:
                    self._json(200, _read_manifest(manifest_path))
                return
            super().do_GET()

        def do_POST(self) -> None:  # noqa: N802
            chapter = self._chapter()
            if chapter is None:
                self._json(404, {"error": "unknown media endpoint"})
                return
            content_length = int(self.headers.get("Content-Length", "0"))
            if content_length <= 0 or content_length > MAX_UPLOAD_BYTES:
                self._json(413, {"error": "file too large or empty"})
                return
            content_type = self.headers.get("Content-Type", "application/octet-stream")
            if not (content_type.startswith("image/") or content_type.startswith("video/")):
                self._json(415, {"error": "only image and video files are supported"})
                return
            original_name = unquote(self.headers.get("X-File-Name", "素材"))
            original_name = Path(original_name).name or "素材"
            extension = Path(original_name).suffix.lower()
            if not extension:
                extension = mimetypes.guess_extension(content_type) or ".bin"
            item_id = uuid4().hex
            filename = f"{item_id}{extension}"
            chapter_root = upload_root / chapter
            chapter_root.mkdir(parents=True, exist_ok=True)
            target = chapter_root / filename
            target.write_bytes(self.rfile.read(content_length))
            item = {
                "id": item_id,
                "name": original_name,
                "type": content_type,
                "url": f"/uploads/{chapter}/{filename}",
                "server": True,
            }
            with lock:
                manifest = _read_manifest(manifest_path)
                manifest.setdefault(chapter, []).append(item)
                _write_manifest(manifest_path, manifest)
            self._json(201, item)

        def do_DELETE(self) -> None:  # noqa: N802
            parts = self.path.split("?")[0].strip("/").split("/")
            if len(parts) != 4 or parts[:2] != ["api", "media"] or not CHAPTER_ID.match(parts[2]):
                self._json(404, {"error": "unknown media endpoint"})
                return
            chapter, item_id = parts[2], parts[3]
            with lock:
                manifest = _read_manifest(manifest_path)
                items = manifest.get(chapter, [])
                item = next((entry for entry in items if entry.get("id") == item_id), None)
                if item is None:
                    self._json(404, {"error": "media not found"})
                    return
                filename = Path(unquote(item.get("url", "")).split("/")[-1]).name
                target = upload_root / chapter / filename
                if target.exists():
                    target.unlink()
                manifest[chapter] = [entry for entry in items if entry.get("id") != item_id]
                _write_manifest(manifest_path, manifest)
            self.send_response(204)
            self.end_headers()

    return ThreadingHTTPServer((host, port), Handler)


if __name__ == "__main__":
    server = create_server(Path(__file__).parent)
    print("Serving on http://0.0.0.0:4174/ (shared media enabled)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
