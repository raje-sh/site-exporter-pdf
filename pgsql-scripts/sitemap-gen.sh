#!/bin/bash

DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="wiki"
DB_USER="wikijs"
DB_PASSWORD="wikijsrocks"

OUTPUT_FILE="/tmp/file.txt"
QUERY="COPY (SELECT json_agg(row_to_json(t)) :: text FROM (SELECT title, \"localeCode\", path, \"updatedAt\" FROM public.pages WHERE \"isPublished\" IS TRUE) t) TO '$OUTPUT_FILE'"
echo "$QUERY";
export PGPASSWORD=$DB_PASSWORD

psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -c "$QUERY"
# psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -c "$QUERY" -o $OUTPUT_FILE

unset PGPASSWORD
echo "All records from the 'pages' table have been saved to $OUTPUT_FILE."
