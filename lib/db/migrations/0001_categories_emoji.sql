-- Migration: Add emoji column to categories table
-- Safe to run multiple times (idempotent)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS emoji varchar(8);
