#!/bin/bash
echo "🛑 Arrêt de UNITÉ 360..."
pkill -f "node.*backend" 2>/dev/null
pkill -f "vite" 2>/dev/null
echo "✅ Arrêté"
