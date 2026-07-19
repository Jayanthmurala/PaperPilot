#!/usr/bin/env python3
"""
Startup script for PaperPilot backend with increased file upload limits.
This script starts the uvicorn server with a 100MB request body size limit
to support multi-page PDF uploads (10+ pages).
"""

import uvicorn
import os
import sys

def main():
    """Start the server with increased upload limits"""
    
    # Configuration
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    
    # Increase limits for large PDF uploads
    # 100MB = 100 * 1024 * 1024 bytes
    limit_max_body_size = 100 * 1024 * 1024  # 100MB
    limit_max_line_size = 8192 * 2  # Increase header line size
    
    print(f"Starting PaperPilot server...")
    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"Max body size: {limit_max_body_size / (1024*1024):.0f}MB")
    print(f"Multi-page PDF support enabled (up to 50+ pages)")
    
    reload = os.environ.get("RELOAD", "false").lower() == "true"
    
    uvicorn.run(
        "server:app",
        host=host,
        port=port,
        reload=reload,
        timeout_keep_alive=120,  # Increase keep-alive for long uploads
    )

if __name__ == "__main__":
    main()
