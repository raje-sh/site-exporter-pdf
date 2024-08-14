#!/bin/bash

OUTPUT_FILE="/tmp/file.txt"
QUERY="COPY (SELECT json_agg(row_to_json(t)) :: text FROM (SELECT title, \"localeCode\", path, \"updatedAt\" FROM public.pages WHERE \"isPublished\" IS TRUE) t) TO '$OUTPUT_FILE'"
echo "$QUERY";
export PGPASSWORD=$DB_PASS

psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -c "$QUERY"
# psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -c "$QUERY" -o $OUTPUT_FILE

unset PGPASSWORD
echo "All records from the 'pages' table have been saved to $OUTPUT_FILE."
