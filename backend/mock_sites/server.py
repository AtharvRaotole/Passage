"""
Simple HTTP server to serve mock sites for demo mode
Run with: python server.py
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
from pathlib import Path

class MockSiteHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(Path(__file__).parent), **kwargs)
    
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def run_server(port=3001, site='facebook'):
    """Run mock site server"""
    site_map = {
        'facebook': 3001,
        'bank': 3002,
        'gmail': 3003,
    }
    
    port = site_map.get(site, port)
    server_address = ('', port)
    httpd = HTTPServer(server_address, MockSiteHandler)
    print(f"Mock {site} site running on http://localhost:{port}")
    print(f"Serving: mock-{site}.html")
    httpd.serve_forever()

if __name__ == '__main__':
    import sys
    site = sys.argv[1] if len(sys.argv) > 1 else 'facebook'
    run_server(site=site)

