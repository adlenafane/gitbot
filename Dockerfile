FROM node:4-onbuild

# Create app directory
RUN mkdir -p /usr/src/gitbot
WORKDIR /usr/src/gitbot

# Install app dependencies
COPY package.json /usr/src/gitbot
RUN npm install

# Bundle app source
COPY . /usr/src/gitbot

EXPOSE 8901
