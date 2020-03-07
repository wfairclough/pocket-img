#!/bin/bash

ab -n 10 \
  -c 10 \
  -s 60 \
  -t 1200 \
  -k \
  -p ./request.json \
  -T "application/json" \
  https://pocket-img-xg57rnl24q-uk.a.run.app/smallify

