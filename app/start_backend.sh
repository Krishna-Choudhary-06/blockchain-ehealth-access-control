#!/bin/bash
export PATH="/home/krishna/.nvm/versions/node/v18.19.0/bin:$PATH"
cd /home/krishna/internship-blockchain-health/app
pkill -f "node server.js" 2>/dev/null || true
sleep 1
exec node server.js
