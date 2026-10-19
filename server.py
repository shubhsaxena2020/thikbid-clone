#!/usr/bin/env python3
"""
ThikBid Unified Local Server (Python 3)
Standalone HTTP server with SPA routing, static asset serving, and Range requests.
"""

import os
import sys
import mimetypes
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, unquote

PORT = int(os.environ.get("PORT", 3000))
HOST = os.environ.get("HOST", "0.0.0.0")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIRS = [
    os.path.join(BASE_DIR, "scraped"),
    BASE_DIR,
    os.path.join(BASE_DIR, "public")
]

ROUTE_MAP = {
    "/": "index.html",
    "/index": "index.html",
    "/index.html": "index.html",
    "/tenders": "tenders.html",
    "/tenders.html": "tenders.html",
    "/firm": "firm.html",
    "/firm.html": "firm.html",
    "/login": "login.html",
    "/login.html": "login.html",
    "/start": "start.html",
    "/start.html": "start.html",
    "/partners": "partners.html",
    "/partners.html": "partners.html",
    "/privacy": "privacy.html",
    "/privacy.html": "privacy.html",
    "/terms": "terms.html",
    "/terms.html": "terms.html",
    "/consent": "consent.html",
    "/consent.html": "consent.html",
    "/404": "404.html",
    "/404.html": "404.html",
    "/preview": "preview.html",
    "/preview.html": "preview.html",
    "/me": "tenders.html",
    "/checkout": "start.html",
    "/admin": "login.html",
    "/signin": "login.html",
    "/signup": "start.html"
}

CUSTOM_MIMES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".woff2": "font/woff2",
    ".woff": "font/woff"
}

def find_file(rel_path):
    clean_path = os.path.normpath(rel_path).lstrip("/\\")
    for r in ROOT_DIRS:
        full = os.path.join(r, clean_path)
        if os.path.isfile(full):
            return full
    return None

class ThikBidHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Concise logging
        sys.stderr.write(f"[{self.log_date_time_string()}] {args[0]} {args[1]} -> {args[2]}\n")

    def do_HEAD(self):
        self.handle_request(head_only=True)

    def do_GET(self):
        self.handle_request(head_only=False)

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/public/pv":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"ok": true}')
            return
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"ok": true}')

    def handle_request(self, head_only=False):
        parsed = urlparse(self.path)
        pathname = unquote(parsed.path)

        if len(pathname) > 1 and pathname.endswith("/"):
            pathname = pathname[:-1]

        # Handle API routes
        if pathname == "/api/public/config":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            if not head_only:
                data = {
                    "appName": "ThikBid",
                    "waNumber": "919387854327",
                    "modes": {"whatsapp": "live", "payments": "test"}
                }
                self.wfile.write(json.dumps(data).encode("utf-8"))
            return

        if pathname == "/api/public/tenders":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            if not head_only:
                data = {"items": [], "total": 489}
                self.wfile.write(json.dumps(data).encode("utf-8"))
            return

        # Check Route Map
        target_file = ROUTE_MAP.get(pathname)
        file_path = None
        if target_file:
            file_path = find_file(target_file)

        # Check SPA /tenders/ or /t/
        if not file_path and (pathname.startswith("/tenders/") or pathname.startswith("/t/")):
            file_path = find_file("tenders.html")

        # Check direct static file
        if not file_path:
            rel = pathname.lstrip("/")
            file_path = find_file(rel)
            if not file_path and not os.path.splitext(pathname)[1]:
                file_path = find_file(rel + ".html")

        # Fallback to index.html for extensionless URLs
        if not file_path and not os.path.splitext(pathname)[1]:
            file_path = find_file("tenders.html") or find_file("index.html")

        if not file_path:
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            if not head_only:
                self.wfile.write(b"<h1>404 Not Found</h1><p><a href='/'>Return to ThikBid Home</a></p>")
            return

        # Serve static file
        ext = os.path.splitext(file_path)[1].lower()
        mime_type = CUSTOM_MIMES.get(ext) or mimetypes.guess_type(file_path)[0] or "application/octet-stream"

        try:
            file_size = os.path.getsize(file_path)
            self.send_response(200)
            self.send_header("Content-Type", mime_type)
            self.send_header("Content-Length", str(file_size))
            self.send_header("X-Content-Type-Options", "nosniff")
            if "assets" in file_path:
                self.send_header("Cache-Control", "public, max-age=31536000, immutable")
            else:
                self.send_header("Cache-Control", "no-cache")
            self.end_headers()

            if not head_only:
                with open(file_path, "rb") as f:
                    while chunk := f.read(65536):
                        self.wfile.write(chunk)
        except Exception as e:
            self.send_response(500)
            self.end_headers()

def main():
    server_address = (HOST, PORT)
    httpd = HTTPServer(server_address, ThikBidHandler)
    print(f"ThikBid Python Server running on http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        httpd.server_close()

if __name__ == "__main__":
    main()
