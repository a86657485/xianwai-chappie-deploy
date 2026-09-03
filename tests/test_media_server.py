import http.client
import json
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.parse import quote

try:
    import server as media_server
except ModuleNotFoundError:
    media_server = None


class SharedMediaServerTests(unittest.TestCase):
    def test_uploaded_media_is_shared_and_can_be_deleted(self):
        self.assertIsNotNone(media_server, "server.py has not been implemented")
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "index.html").write_text("ok", encoding="utf-8")
            httpd = media_server.create_server(
                root=root,
                upload_root=root / "uploads",
                host="127.0.0.1",
                port=0,
            )
            thread = threading.Thread(target=httpd.serve_forever, daemon=True)
            thread.start()
            try:
                connection = http.client.HTTPConnection(
                    "127.0.0.1", httpd.server_address[1], timeout=5
                )
                payload = b"\x89PNG\r\nshared-image"
                connection.request(
                    "POST",
                    "/api/media/face",
                    body=payload,
                    headers={
                        "Content-Type": "image/png",
                        "Content-Length": str(len(payload)),
                        "X-File-Name": quote("课堂照片.png"),
                    },
                )
                response = connection.getresponse()
                self.assertEqual(response.status, 201)
                created = json.loads(response.read())

                connection.request("GET", "/api/media")
                response = connection.getresponse()
                self.assertEqual(response.status, 200)
                listing = json.loads(response.read())
                self.assertEqual(listing["face"][0]["name"], "课堂照片.png")

                connection.request("GET", created["url"])
                response = connection.getresponse()
                self.assertEqual(response.status, 200)
                self.assertEqual(response.read(), payload)

                connection.request(
                    "DELETE", f"/api/media/face/{created['id']}"
                )
                response = connection.getresponse()
                self.assertEqual(response.status, 204)
                response.read()

                connection.request("GET", "/api/media")
                response = connection.getresponse()
                self.assertEqual(json.loads(response.read())["face"], [])
            finally:
                httpd.shutdown()
                httpd.server_close()
                thread.join(timeout=5)


if __name__ == "__main__":
    unittest.main()
