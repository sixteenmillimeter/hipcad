#!/bin/bash
mv nginx.conf /etc/nginx/sites-available/hipcad.com
service nginx configtest
service nginx restart