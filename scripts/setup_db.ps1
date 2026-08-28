#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Setup script for Sahoolat PostgreSQL database (after fresh PostgreSQL install).
  Run this once, then run: alembic upgrade head
  
.USAGE
  cd backend
  .\..\scripts\setup_db.ps1
#>

$PG_BIN = Get-ChildItem "C:\Program Files\PostgreSQL" -ErrorAction SilentlyContinue | 
          Sort-Object Name -Descending | 
          Select-Object -First 1 | 
          ForEach-Object { "$($_.FullName)\bin" }

if (-not $PG_BIN -or -not (Test-Path "$PG_BIN\psql.exe")) {
    Write-Error "PostgreSQL bin not found. Check installation path."
    exit 1
}

Write-Host "Using PostgreSQL at: $PG_BIN"
$env:PATH = "$PG_BIN;$env:PATH"

# Create role and database
$sql = @"
DO `$`$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'sahoolat_user') THEN
    CREATE ROLE sahoolat_user LOGIN PASSWORD 'sahoolat_pass';
  END IF;
END
`$`$;

SELECT 'CREATE DATABASE sahoolat_db OWNER sahoolat_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'sahoolat_db')
\gexec
"@

Write-Host "Creating database and user..."
$sql | & "$PG_BIN\psql.exe" -U postgres -c $sql 2>&1

# Simpler approach — individual commands
& "$PG_BIN\psql.exe" -U postgres -c "DO `$`$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='sahoolat_user') THEN CREATE ROLE sahoolat_user LOGIN PASSWORD 'sahoolat_pass'; END IF; END `$`$;" 2>&1
& "$PG_BIN\psql.exe" -U postgres -c "CREATE DATABASE sahoolat_db OWNER sahoolat_user;" 2>&1

Write-Host "Done. Now run: alembic upgrade head"
