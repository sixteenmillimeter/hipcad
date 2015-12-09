#!/bin/bash

echo "INSTALLING HIPCAD DEPS..."

apt-get update
apt-get upgrade -y

apt-get install git -y
apt-get install nodejs -y
apt-get install npm -y
apt-get install nginx -y
apt-get install openscad -y
apt-get install apache2-utils -y
apt-get install jq -y

ln -s /usr/bin/nodejs /usr/bin/node
mkdir /var/node
mkdir /var/log/hipcad
mkdir /var/cfg
mkdir /var/cfg/hipcad.com
mkdir /tmp/hipcad

cd /var/node
git clone https://litter@bitbucket.org/litter/hipcad.git
cd hipcad
npm install -g forever gulp
npm install
