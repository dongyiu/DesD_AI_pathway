#!/bin/sh

#this program is written in Bash, which is a shell scripting language like fish, or zsh

echo "Waiting for PostgreSQL to start... $(ls) it is"

./Wait-for "$DB_HOST":"$DB_PORT"

echo "Executing manage.py"
python automatically_start_script.py
python manage.py makemigrations
python manage.py migrate

python manage.py runserver 0.0.0.0:8000 #running the server