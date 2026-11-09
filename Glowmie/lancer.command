#!/bin/bash
# Double-clique sur ce fichier pour lancer Glowmie sur http://localhost:8080
cd "$(dirname "$0")"
( sleep 1; open "http://localhost:8080" ) &
if command -v python3 >/dev/null 2>&1 && python3 -c "" 2>/dev/null; then python3 -m http.server 8080
else ruby -run -e httpd . -p 8080; fi
