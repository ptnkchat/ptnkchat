while (true)
do
  node build/app.js
  OUT=$?
  if [ $OUT -eq 13 ] || [ $OUT -eq 34 ] || [ $OUT -eq 141 ] || [ $OUT -eq 162 ] || [ $OUT -eq 139 ]; then
    echo "ERR Segmentation fault"
  else
    node build/backup_server.js
  fi
done
