FROM node:11-alpine
RUN apk add --no-cache --virtual .build-deps \
  python-dev \
  make \
  g++
RUN echo 'Asia/Shanghai' > /etc/timezone
ENV TZ="Asia/Shanghai"
RUN ls
RUN npm i -d