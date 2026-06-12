#!/usr/bin/env python3
import http.server
import socketserver
import os

PORT = 3000
DIRECTORY = r"c:\Users\DELL\Desktop\s\frontend\public"

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_GET(self):
        if self.path == '/':
            self.path = '/index-simple.html'
        return super().do_GET()

if __name__ == '__main__':
    os.chdir(DIRECTORY)
    with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
        print(f"✅ Server running at http://localhost:{PORT}")
        print(f"📁 Serving from: {DIRECTORY}")
        print("Press Ctrl+C to stop")
        httpd.serve_forever()
