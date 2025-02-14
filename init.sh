#!/bin/bash
#------------------------------------------------------
# This is a BASH script for setting up initial NodeJS
# environment for project Columbus, which is a Slack 
# chatbot powered by OpenAI and LangChain.
#
# The script is ONLY tested under CentOS Stream 9
# Please run it carefully if you are on a different
# OS
#------------------------------------------------------
# dean1873@qq.com
# Feb 12th, 2025
sudo yum update
sudo yum insatll -y npm

# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
source ~/.bashrc

# Install latest NodeJS and other related tools
nvm install v22.14.0

# Install the NodeJS packages
npm install 
npm run build

echo "DONE! Ready to run Columbus by 'npm run dev' or 'npm start' :)"


