#!/bin/bash
echo "🚀 UNITÉ 360 - Démarrage"
echo "========================"

# Backend
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Services démarrés:"
echo "   🌐 Frontend: http://localhost:5173"
echo "   📡 Backend: http://localhost:5000"
echo "   🔍 Health: http://localhost:5000/api/health"
echo ""
echo "   👤 Admin: admin@unite360.com / admin123"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '🛑 Arrêté'" EXIT
wait
