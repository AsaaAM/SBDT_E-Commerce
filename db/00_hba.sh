#!/bin/bash
set -e
echo "Menambahkan aturan replikasi ke pg_hba.conf..."
echo "host replication all all trust" >> "$PGDATA/pg_hba.conf"
