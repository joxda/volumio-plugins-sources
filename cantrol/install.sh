#!/bin/bash

echo "Installing ainterface Dependencies"
sudo apt-get update
# Install the required packages via apt-get
sudo apt-get -y install  pigpio python-pigpio python3-pigpio

# If you need to differentiate install for armhf and i386 you can get the variable like this
#DPKG_ARCH=`dpkg --print-architecture`
# Then use it to differentiate your install

sudo systemctl enable pigpiod
sudo systemctl start pigpiod

#requred to end the plugin install
echo "plugininstallend"
