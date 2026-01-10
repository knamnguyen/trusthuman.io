#!/bin/bash

TLS_KEY=/root/cert/key.pem TLS_CERT=/root/cert/cert.pem PORT=80 NODE_ENV=production bun --env-file=../../.env run ./src/server.ts
