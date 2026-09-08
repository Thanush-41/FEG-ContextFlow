#!/usr/bin/env bash
set -euo pipefail

mongosh --host mongo:27017 --quiet --eval '
  try {
    rs.status()
  } catch (_) {
    rs.initiate({_id: "rs0", members: [{_id: 0, host: "mongo:27017"}]})
  }
'
