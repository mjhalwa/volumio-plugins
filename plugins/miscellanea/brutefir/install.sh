#!/bin/bash

echo "Installing brutefir dependencies"
echo "adding snd_aloop to /etc/module"
echo 'snd_aloop' | tee --append /etc/modules
sudo apt-get update
sudo apt-get -y install brutefir
echo "adding brutefir service"
cp /data/plugins/miscellanea/brutefir.service.gz /
sudo tar -xvf brutefir.service.gz
rm /brutefir.service.gz
echo "Installing brutefir plugin"

#required to end the plugin install
echo "plugininstallend"
