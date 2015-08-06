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

ln -s /usr/bin/nodejs /usr/bin/node
mkdir /var/node
cd /var/node
git clone https://litter@bitbucket.org/litter/hipcad.git
cd hipcad
npm install -g forever
npm install