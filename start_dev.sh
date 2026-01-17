#!/bin/bash

PORT=8080 FS_ROOT=/ node server/server.js &
npm run dev -- --host 0.0.0.0

wait
